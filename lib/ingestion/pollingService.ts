/**
 * Polling service for Rails API data ingestion
 */

import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/db/firebase';
import { COLLECTIONS } from '@/lib/db/collections';
import { railsClient } from '@/lib/api/railsClient';
import {
  transformSessions,
  transformCustomers,
  transformTutors,
  transformInboundCalls,
  validateSession,
  validateCustomer,
  validateTutor,
  validateInboundCall,
} from './transformers';
import { scheduleDataIngestion } from '@/lib/queue/bullmq';

interface PollingConfig {
  interval: number; // milliseconds
  batchSize: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: PollingConfig = {
  interval: 5 * 60 * 1000, // 5 minutes
  batchSize: 100,
  enabled: true,
};

export class PollingService {
  private config: PollingConfig;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private lastSyncTimes: Map<string, Date> = new Map();

  constructor(config: Partial<PollingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Start all polling tasks
  start() {
    if (!this.config.enabled) {
      console.log('Polling service is disabled');
      return;
    }

    console.log('Starting polling service...');

    this.startSessionsPolling();
    this.startCustomersPolling();
    this.startTutorsPolling();
    this.startInboundCallsPolling();

    console.log('Polling service started');
  }

  // Stop all polling tasks
  stop() {
    console.log('Stopping polling service...');

    this.timers.forEach((timer, key) => {
      clearInterval(timer);
      console.log(`Stopped polling for ${key}`);
    });

    this.timers.clear();
    console.log('Polling service stopped');
  }

  // Individual polling functions
  private startSessionsPolling() {
    this.poll('sessions', async () => {
      const lastSync = this.lastSyncTimes.get('sessions');
      const startDate = lastSync?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      try {
        const response = await railsClient.getSessions({
          startDate,
          perPage: this.config.batchSize,
        });

        if (!response.data || response.data.length === 0) {
          console.log('No new sessions to sync');
          return;
        }

        const sessions = transformSessions(response.data);
        const validSessions = sessions.filter(validateSession);

        if (validSessions.length !== sessions.length) {
          console.warn(`Filtered out ${sessions.length - validSessions.length} invalid sessions`);
        }

        await this.batchWriteToFirestore(COLLECTIONS.SESSIONS, validSessions, 'sessionId');

        this.lastSyncTimes.set('sessions', new Date());
        console.log(`Synced ${validSessions.length} sessions`);
      } catch (error) {
        console.error('Error polling sessions:', error);
      }
    });
  }

  private startCustomersPolling() {
    this.poll('customers', async () => {
      try {
        const response = await railsClient.getCustomers({
          status: 'active',
          perPage: this.config.batchSize,
        });

        if (!response.data || response.data.length === 0) {
          console.log('No customers to sync');
          return;
        }

        const customers = transformCustomers(response.data);
        const validCustomers = customers.filter(validateCustomer);

        if (validCustomers.length !== customers.length) {
          console.warn(`Filtered out ${customers.length - validCustomers.length} invalid customers`);
        }

        await this.batchWriteToFirestore(COLLECTIONS.CUSTOMERS, validCustomers, 'customerId');

        this.lastSyncTimes.set('customers', new Date());
        console.log(`Synced ${validCustomers.length} customers`);
      } catch (error) {
        console.error('Error polling customers:', error);
      }
    });
  }

  private startTutorsPolling() {
    this.poll('tutors', async () => {
      try {
        const response = await railsClient.getTutors({
          status: 'active',
          perPage: this.config.batchSize,
        });

        if (!response.data || response.data.length === 0) {
          console.log('No tutors to sync');
          return;
        }

        const tutors = transformTutors(response.data);
        const validTutors = tutors.filter(validateTutor);

        if (validTutors.length !== tutors.length) {
          console.warn(`Filtered out ${tutors.length - validTutors.length} invalid tutors`);
        }

        await this.batchWriteToFirestore(COLLECTIONS.TUTORS, validTutors, 'tutorId');

        this.lastSyncTimes.set('tutors', new Date());
        console.log(`Synced ${validTutors.length} tutors`);
      } catch (error) {
        console.error('Error polling tutors:', error);
      }
    });
  }

  private startInboundCallsPolling() {
    this.poll('inbound_calls', async () => {
      const lastSync = this.lastSyncTimes.get('inbound_calls');
      const startDate = lastSync?.toISOString() || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      try {
        const response = await railsClient.getInboundCalls({
          startDate,
          perPage: this.config.batchSize,
        });

        if (!response.data || response.data.length === 0) {
          console.log('No new inbound calls to sync');
          return;
        }

        const calls = transformInboundCalls(response.data);
        const validCalls = calls.filter(validateInboundCall);

        if (validCalls.length !== calls.length) {
          console.warn(`Filtered out ${calls.length - validCalls.length} invalid calls`);
        }

        await this.batchWriteToFirestore(COLLECTIONS.INBOUND_CALLS, validCalls);

        this.lastSyncTimes.set('inbound_calls', new Date());
        console.log(`Synced ${validCalls.length} inbound calls`);
      } catch (error) {
        console.error('Error polling inbound calls:', error);
      }
    });
  }

  // Helper: Set up periodic polling
  private poll(name: string, fn: () => Promise<void>) {
    // Run immediately
    fn();

    // Then run on interval
    const timer = setInterval(fn, this.config.interval);
    this.timers.set(name, timer);

    console.log(`Started polling for ${name} every ${this.config.interval / 1000}s`);
  }

  // Helper: Batch write to Firestore
  private async batchWriteToFirestore<T extends Record<string, any>>(
    collectionName: string,
    items: T[],
    idField?: keyof T
  ) {
    if (items.length === 0) return;

    const BATCH_LIMIT = 500; // Firestore batch limit
    const batches: any[][] = [];

    for (let i = 0; i < items.length; i += BATCH_LIMIT) {
      batches.push(items.slice(i, i + BATCH_LIMIT));
    }

    for (const batchItems of batches) {
      const batch = db.batch();

      for (const item of batchItems) {
        const docId = idField ? String(item[idField]) : undefined;
        const docRef = docId
          ? db.collection(collectionName).doc(docId)
          : db.collection(collectionName).doc();

        batch.set(docRef, {
          ...item,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();
    }

    console.log(`Wrote ${items.length} items to ${collectionName} in ${batches.length} batches`);
  }

  // Manual sync methods
  async syncSessions(startDate?: Date, endDate?: Date) {
    await this.startSessionsPolling();
  }

  async syncCustomers() {
    await this.startCustomersPolling();
  }

  async syncTutors() {
    await this.startTutorsPolling();
  }

  async syncInboundCalls(startDate?: Date) {
    await this.startInboundCallsPolling();
  }
}

// Singleton instance
export const pollingService = new PollingService();
