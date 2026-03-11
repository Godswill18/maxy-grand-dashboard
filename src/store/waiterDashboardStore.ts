import { create } from 'zustand';
import axios from 'axios';

// Types
interface DashboardStats {
  totalOrdersToday: number;
  todayChange: number;
  pendingOrders: number;
  completedOrders: number;
  completedChange: number;
  tablesAssigned: number;
  reservationsToday: number;
  inProgressOrders: number;
  readyOrders: number;
}

interface RecentOrder {
  _id: string;
  orderType: 'room service' | 'pickup' | 'table service';
  tableNumber?: string;
  roomNumber?: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  createdAt: string;
  waiterId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

const WAITER_DASHBOARD_TTL = 60 * 1000; // 1 minute — orders change frequently

interface DashboardState {
  // State
  stats: DashboardStats | null;
  recentOrders: RecentOrder[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  fetchDashboardStats: () => Promise<void>;
  fetchRecentOrders: (limit?: number) => Promise<void>;
  refreshDashboard: (force?: boolean) => Promise<void>;
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
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Zustand Store
export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial State
  stats: null,
  recentOrders: [],
  loading: false,
  error: null,
  lastFetched: null,

  // Fetch Dashboard Stats
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/waiter-dashboard/stats');
      set({ 
        stats: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch dashboard stats', 
        loading: false 
      });
      throw error;
    }
  },

  // Fetch Recent Orders
  fetchRecentOrders: async (limit = 10) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/api/waiter-dashboard/recent-orders', {
        params: { limit }
      });
      set({ 
        recentOrders: response.data.data,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.error || 'Failed to fetch recent orders', 
        loading: false 
      });
      throw error;
    }
  },

  // Refresh All Dashboard Data
  refreshDashboard: async (force = false) => {
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < WAITER_DASHBOARD_TTL && !force) return;

    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchDashboardStats(),
        get().fetchRecentOrders()
      ]);
      set({ lastFetched: Date.now() });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to refresh dashboard',
        loading: false
      });
      throw error;
    }
  },

  // Clear Error
  clearError: () => set({ error: null }),
}));