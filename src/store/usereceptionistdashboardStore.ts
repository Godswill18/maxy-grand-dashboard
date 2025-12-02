// src/store/useReceptionistDashboardStore.ts

import { create } from 'zustand';

// --- Type Definitions ---
interface CheckInActivity {
  time: string;
  checkins: number;
  checkouts: number;
}

interface RevenueData {
  day: string;
  revenue: number;
}

interface PendingCheckIn {
  _id: string;
  guestName: string;
  roomNumber: string;
  checkInDate: string;
  confirmationCode: string;
  guestPhone?: string;
  guestEmail?: string;
}

interface ExpectedCheckOut {
  _id: string;
  guestName: string;
  roomNumber: string;
  checkOutDate: string;
  bookingStatus: string;
  amountPaid: number;
  totalAmount: number;
}

interface DashboardStats {
  todayCheckIns: {
    total: number;
    completed: number;
    pending: number;
  };
  todayCheckOuts: {
    total: number;
    completed: number;
    pending: number;
  };
  occupiedRooms: {
    occupied: number;
    total: number;
    occupancyRate: number;
  };
  todayRevenue: {
    amount: number;
    percentageChange: number;
  };
}

interface ReceptionistDashboardState {
  // Data
  stats: DashboardStats;
  checkInActivity: CheckInActivity[];
  weeklyRevenue: RevenueData[];
  pendingCheckIns: PendingCheckIn[];
  expectedCheckOuts: ExpectedCheckOut[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchCheckInActivity: () => Promise<void>;
  fetchWeeklyRevenue: () => Promise<void>;
  fetchPendingCheckIns: () => Promise<void>;
  fetchExpectedCheckOuts: () => Promise<void>;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const initialStats: DashboardStats = {
  todayCheckIns: { total: 0, completed: 0, pending: 0 },
  todayCheckOuts: { total: 0, completed: 0, pending: 0 },
  occupiedRooms: { occupied: 0, total: 0, occupancyRate: 0 },
  todayRevenue: { amount: 0, percentageChange: 0 },
};

export const useReceptionistDashboardStore = create<ReceptionistDashboardState>((set, get) => ({
  // Initial state
  stats: initialStats,
  checkInActivity: [],
  weeklyRevenue: [],
  pendingCheckIns: [],
  expectedCheckOuts: [],
  isLoading: false,
  error: null,

  // Fetch dashboard stats
  fetchStats: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/dashboard-stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ stats: data.data });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch check-in activity (hourly data for today)
  fetchCheckInActivity: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/checkin-activity`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch check-in activity');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ checkInActivity: data.data });
      }
    } catch (error) {
      console.error('Error fetching check-in activity:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch weekly revenue
  fetchWeeklyRevenue: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/weekly-revenue`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch weekly revenue');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ weeklyRevenue: data.data });
      }
    } catch (error) {
      console.error('Error fetching weekly revenue:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch pending check-ins
  fetchPendingCheckIns: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/pending-checkins`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending check-ins');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ pendingCheckIns: data.data });
      }
    } catch (error) {
      console.error('Error fetching pending check-ins:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch expected check-outs
  fetchExpectedCheckOuts: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/expected-checkouts`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expected check-outs');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ expectedCheckOuts: data.data });
      }
    } catch (error) {
      console.error('Error fetching expected check-outs:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch all dashboard data
  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await Promise.all([
        get().fetchStats(),
        get().fetchCheckInActivity(),
        get().fetchWeeklyRevenue(),
        get().fetchPendingCheckIns(),
        get().fetchExpectedCheckOuts(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));