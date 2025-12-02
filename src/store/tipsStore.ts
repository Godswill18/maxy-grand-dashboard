import { create } from 'zustand';
import axios from 'axios';

// Types
interface PerformanceStats {
  todayRevenue: number;
  todayRevenueChange: number;
  weeklyRevenue: number;
  weeklyRevenueChange: number;
  monthlyRevenue: number;
  monthlyRevenueChange: number;
  averageRating: number;
  ratingChange: number;
  completedOrders: number;
  ordersChange: number;
  totalOrders: number;
}

interface DailyRevenue {
  day: string;
  revenue: number;
  orders: number;
}

interface MonthlyPerformance {
  month: string;
  orders: number;
  revenue: number;
  averageRevenue: number;
}

interface PerformanceHighlights {
  bestDay: {
    day: string;
    revenue: number;
  };
  mostPopularTable: {
    table: string;
    orders: number;
  };
  mostPopularRoom: {
    room: string;
    orders: number;
  };
  customerFeedback: {
    rating: number;
    reviews: number;
  };
  averageOrderValue: number;
}

interface PerformanceState {
  // State
  stats: PerformanceStats | null;
  dailyRevenue: DailyRevenue[];
  weeklyRevenue: DailyRevenue[];
  monthlyPerformance: MonthlyPerformance[];
  highlights: PerformanceHighlights | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchPerformanceData: () => Promise<void>;
  fetchDailyRevenue: (period?: 'week' | 'month') => Promise<void>;
  fetchMonthlyPerformance: (months?: number) => Promise<void>;
  fetchHighlights: () => Promise<void>;
  clearError: () => void;
}

// API Configuration
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Zustand Store
export const usePerformanceStore = create<PerformanceState>((set, get) => ({
  // Initial State
  stats: null,
  dailyRevenue: [],
  weeklyRevenue: [],
  monthlyPerformance: [],
  highlights: null,
  loading: false,
  error: null,

  // Fetch Performance Data (Stats)
  fetchPerformanceData: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/performance/stats');
      set({ 
        stats: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch performance data', 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch Daily Revenue
  fetchDailyRevenue: async (period = 'week') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/performance/daily-tips', {
        params: { period }
      });
      
      if (period === 'week') {
        set({ 
          weeklyRevenue: response.data.data,
          loading: false 
        });
      } else {
        set({ 
          dailyRevenue: response.data.data,
          loading: false 
        });
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch daily revenue', 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch Monthly Performance
  fetchMonthlyPerformance: async (months = 6) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/performance/monthly', {
        params: { months }
      });
      set({ 
        monthlyPerformance: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch monthly performance', 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch Performance Highlights
  fetchHighlights: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/performance/highlights');
      set({ 
        highlights: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch performance highlights', 
        loading: false 
      });
      throw error;
    }
  },

  // Clear Error
  clearError: () => set({ error: null }),
}));