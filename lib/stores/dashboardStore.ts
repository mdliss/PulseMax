import { create } from 'zustand';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/db/firebaseClient';
import { COLLECTIONS } from '@/lib/db/collections';

// Dashboard metrics state
interface DashboardMetrics {
  activeSessions: number;
  dailySessionVolume: number;
  averageSessionRating: number;
  tutorUtilizationRate: number;
  customerSatisfactionScore: number;
  supplyDemandBalance: number;
}

interface DashboardState {
  metrics: DashboardMetrics | null;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  setMetrics: (metrics: DashboardMetrics) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshMetrics: () => Promise<void>;
  subscribeToMetrics: () => void;
  cleanup: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  metrics: null,
  lastUpdated: null,
  isLoading: false,
  error: null,
  unsubscribe: null,

  setMetrics: (metrics) => set({
    metrics,
    lastUpdated: new Date(),
    error: null
  }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  refreshMetrics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const metrics = await response.json();
      set({
        metrics,
        lastUpdated: new Date(),
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

  // Real-time subscription to metrics
  subscribeToMetrics: () => {
    const metricsRef = doc(db, COLLECTIONS.METRICS_CACHE, 'dashboard');

    const unsubscribe = onSnapshot(
      metricsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          set({
            metrics: data.metrics as DashboardMetrics,
            lastUpdated: data.updatedAt?.toDate() || new Date(),
            error: null,
            isLoading: false,
          });
        }
      },
      (error) => {
        set({
          error: error.message,
          isLoading: false,
        });
      }
    );

    set({ unsubscribe });
  },

  cleanup: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
      set({ unsubscribe: null });
    }
  },
}));
