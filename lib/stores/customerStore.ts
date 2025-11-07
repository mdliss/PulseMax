import { create } from 'zustand';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/db/firebaseClient';
import { COLLECTIONS, CustomerHealthDocument } from '@/lib/db/collections';

// Customer health state
export interface Customer {
  id: string;
  customerId: string;
  name?: string;
  email?: string;
  riskScore: number;
  riskTier: 'critical' | 'at-risk' | 'healthy' | 'thriving';
  firstSessionScore?: number;
  sessionVelocityScore?: number;
  ibCallScore?: number;
  goalCompleted: boolean;
  suggestedIntervention?: string;
  calculatedAt: Date;
}

interface CustomerState {
  customers: Customer[];
  filteredCustomers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    riskTier?: string;
    minRiskScore?: number;
    maxRiskScore?: number;
  };

  // Actions
  setCustomers: (customers: Customer[]) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setFilters: (filters: Partial<CustomerState['filters']>) => void;
  applyFilters: () => void;
  fetchCustomers: () => Promise<void>;
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  customers: [],
  filteredCustomers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
  filters: {},

  setCustomers: (customers) => {
    set({ customers });
    get().applyFilters();
  },

  setSelectedCustomer: (selectedCustomer) => set({ selectedCustomer }),

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
    get().applyFilters();
  },

  applyFilters: () => {
    const { customers, filters } = get();
    let filtered = [...customers];

    if (filters.riskTier) {
      filtered = filtered.filter(c => c.riskTier === filters.riskTier);
    }

    if (filters.minRiskScore !== undefined) {
      filtered = filtered.filter(c => c.riskScore >= filters.minRiskScore!);
    }

    if (filters.maxRiskScore !== undefined) {
      filtered = filtered.filter(c => c.riskScore <= filters.maxRiskScore!);
    }

    set({ filteredCustomers: filtered });
  },

  fetchCustomers: async () => {
    set({ isLoading: true, error: null });
    try {
      const q = query(
        collection(db, COLLECTIONS.CUSTOMER_HEALTH),
        orderBy('riskScore', 'desc'),
        limit(1000)
      );

      const snapshot = await getDocs(q);
      const customers: Customer[] = snapshot.docs.map(doc => {
        const data = doc.data() as CustomerHealthDocument;
        return {
          id: doc.id,
          customerId: data.customerId,
          riskScore: data.riskScore,
          riskTier: data.riskTier,
          firstSessionScore: data.firstSessionScore,
          sessionVelocityScore: data.sessionVelocityScore,
          ibCallScore: data.ibCallScore,
          goalCompleted: data.hasCompletedGoal,
          suggestedIntervention: data.suggestedIntervention,
          calculatedAt: data.calculatedAt instanceof Date ? data.calculatedAt : (data.calculatedAt as any).toDate(),
        };
      });

      set({
        customers,
        isLoading: false,
        error: null
      });
      get().applyFilters();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      });
    }
  },
}));
