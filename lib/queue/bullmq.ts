import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';

// Create Redis connection for BullMQ
// Note: BullMQ requires ioredis, not Upstash REST API
const connection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : null;

// Job types
export interface DataIngestionJob {
  source: 'sessions' | 'customers' | 'tutors' | 'inbound_calls' | 'bookings';
  startDate?: Date;
  endDate?: Date;
}

export interface MetricsCalculationJob {
  type: 'customer_health' | 'tutor_performance' | 'supply_demand';
  customerId?: string;
  tutorId?: string;
}

export interface AlertGenerationJob {
  checkType: 'customer_risk' | 'tutor_performance' | 'anomaly' | 'supply_demand';
}

// Queues
export const dataIngestionQueue = connection
  ? new Queue<DataIngestionJob>('data-ingestion', { connection })
  : null;

export const metricsQueue = connection
  ? new Queue<MetricsCalculationJob>('metrics-calculation', { connection })
  : null;

export const alertQueue = connection
  ? new Queue<AlertGenerationJob>('alert-generation', { connection })
  : null;

// Queue job scheduling helpers
export async function scheduleDataIngestion(jobData: DataIngestionJob) {
  if (!dataIngestionQueue) {
    console.warn('Data ingestion queue not available. Skipping job scheduling.');
    return;
  }

  await dataIngestionQueue.add(
    `ingest-${jobData.source}`,
    jobData,
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );
}

export async function scheduleMetricsCalculation(jobData: MetricsCalculationJob) {
  if (!metricsQueue) {
    console.warn('Metrics queue not available. Skipping job scheduling.');
    return;
  }

  await metricsQueue.add(
    `calculate-${jobData.type}`,
    jobData,
    {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  );
}

export async function scheduleAlertGeneration(jobData: AlertGenerationJob) {
  if (!alertQueue) {
    console.warn('Alert queue not available. Skipping job scheduling.');
    return;
  }

  await alertQueue.add(
    `check-${jobData.checkType}`,
    jobData,
    {
      attempts: 2,
      priority: jobData.checkType === 'customer_risk' ? 1 : 2,
    }
  );
}

// Recurring job schedules
export async function setupRecurringJobs() {
  if (!dataIngestionQueue || !metricsQueue || !alertQueue) {
    console.warn('Queues not available. Skipping recurring job setup.');
    return;
  }

  // Data ingestion every 5 minutes
  await dataIngestionQueue.add(
    'ingest-sessions',
    { source: 'sessions' },
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
    }
  );

  // Customer health calculation every 15 minutes
  await metricsQueue.add(
    'calculate-customer-health',
    { type: 'customer_health' },
    {
      repeat: {
        pattern: '*/15 * * * *', // Every 15 minutes
      },
    }
  );

  // Tutor performance calculation every hour
  await metricsQueue.add(
    'calculate-tutor-performance',
    { type: 'tutor_performance' },
    {
      repeat: {
        pattern: '0 * * * *', // Every hour
      },
    }
  );

  // Alert generation every 5 minutes
  await alertQueue.add(
    'check-alerts',
    { checkType: 'customer_risk' },
    {
      repeat: {
        pattern: '*/5 * * * *', // Every 5 minutes
      },
    }
  );

  console.log('Recurring jobs scheduled successfully');
}
