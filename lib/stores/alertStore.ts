import { create } from 'zustand';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/db/firebaseClient';
import { COLLECTIONS, AlertDocument } from '@/lib/db/collections';

export interface Alert {
  id: string;
  type: 'customer-risk' | 'tutor-performance' | 'supply-demand' | 'anomaly';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  suggestedAction: string;
  createdAt: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
  metadata?: Record<string, any>;
}

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'status'>) => void;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  resolveAlert: (id: string) => void;
  fetchAlerts: () => Promise<void>;
  markAllAsRead: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  addAlert: async (alertData) => {
    try {
      const alertDoc: Omit<AlertDocument, 'createdAt' | 'updatedAt'> = {
        alertType: alertData.type,
        severity: alertData.severity,
        title: alertData.title,
        message: alertData.message,
        suggestedAction: alertData.suggestedAction,
        status: 'active',
        metadata: alertData.metadata,
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.ALERTS), {
        ...alertDoc,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const newAlert: Alert = {
        ...alertData,
        id: docRef.id,
        createdAt: new Date(),
        status: 'active',
      };

      set((state) => ({
        alerts: [newAlert, ...state.alerts],
        unreadCount: state.unreadCount + 1,
      }));
    } catch (error) {
      console.error('Error adding alert:', error);
    }
  },

  acknowledgeAlert: async (id) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ALERTS, id), {
        status: 'acknowledged',
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      });

      set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, status: 'acknowledged' as const } : alert
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  },

  dismissAlert: async (id) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ALERTS, id), {
        status: 'dismissed',
        updatedAt: new Date(),
      });

      set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, status: 'dismissed' as const } : alert
        ),
      }));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  },

  resolveAlert: async (id) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ALERTS, id), {
        status: 'resolved',
        resolvedAt: new Date(),
        updatedAt: new Date(),
      });

      set((state) => ({
        alerts: state.alerts.map(alert =>
          alert.id === id ? { ...alert, status: 'resolved' as const } : alert
        ),
      }));
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  },

  fetchAlerts: async () => {
    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, COLLECTIONS.ALERTS),
        where('status', 'in', ['active', 'acknowledged']),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);
      const alerts: Alert[] = snapshot.docs.map(doc => {
        const data = doc.data() as AlertDocument;
        return {
          id: doc.id,
          type: data.alertType,
          severity: data.severity,
          title: data.title,
          message: data.message,
          suggestedAction: data.suggestedAction || '',
          createdAt: data.createdAt instanceof Date ? data.createdAt : (data.createdAt as any).toDate(),
          status: data.status,
          metadata: data.metadata,
        };
      });

      const unreadCount = alerts.filter(a => a.status === 'active').length;

      set({
        alerts,
        unreadCount,
        isLoading: false,
        error: null
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },

  markAllAsRead: () => {
    set((state) => ({
      alerts: state.alerts.map(alert =>
        alert.status === 'active' ? { ...alert, status: 'acknowledged' as const } : alert
      ),
      unreadCount: 0,
    }));
  },
}));
