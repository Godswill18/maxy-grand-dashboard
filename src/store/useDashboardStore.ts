import { create } from 'zustand';
import axios from 'axios';

// --- 1. Define Types ---
interface Stats {
  totalStaff: number;
  totalUsers: number;
  branchManagers: number;
  hotelBranches: number;
  totalRooms: number;
  cleaners: number;
  receptionists: number;
  waiters: number;
  availableRooms: number;
  roomsToClean: number;
  bookingsToday: number;
  bookingsYesterday: number;
  bookingsThisWeek: number;
  bookingsLastWeek: number;
  bookingsThisMonth: number;
  bookingsLastMonth: number;
}

interface BookingData {
  name: string;
  daily: number;
  weekly: number;
  monthly: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

export interface BranchRevenue {
  _id: string;
  name: string;
  city: string;
  isActive: boolean;
  revenue: number;
  bookings: number;
}

interface DashboardState {
  stats: Partial<Stats>;
  bookingChartData: BookingData[];
  revenueChartData: RevenueData[];
  branchMonthlyRevenue: BranchRevenue[];
  isLoading: boolean;
  branchRevenueLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchDashboardData: () => Promise<void>;
  fetchBranchMonthlyRevenue: () => Promise<void>;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- 2. Create the Store ---
export const useDashboardStore = create<DashboardState & { actions: DashboardActions }>(
  (set) => ({
    // --- Initial State ---
    stats: {},
    bookingChartData: [],
    revenueChartData: [],
    branchMonthlyRevenue: [],
    isLoading: true,
    branchRevenueLoading: true,
    error: null,

    // --- Actions ---
    actions: {
      fetchDashboardData: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get(`${VITE_API_URL}/api/dashboard/overview`, {
            headers: getAuthHeaders(), withCredentials: true,
          });
          set({
            stats: response.data.stats,
            bookingChartData: response.data.bookingChartData,
            revenueChartData: response.data.revenueChartData,
            isLoading: false,
          });
        } catch (err: any) {
          const error = err.response?.data?.message || err.message;
          set({ isLoading: false, error });
        }
      },

      fetchBranchMonthlyRevenue: async () => {
        set({ branchRevenueLoading: true });
        try {
          const response = await axios.get(`${VITE_API_URL}/api/dashboard/branch-monthly-revenue`, {
            headers: getAuthHeaders(), withCredentials: true,
          });
          set({
            branchMonthlyRevenue: response.data.data || [],
            branchRevenueLoading: false,
          });
        } catch (err: any) {
          const error = err.response?.data?.message || err.message;
          set({ branchRevenueLoading: false, error });
        }
      },
    },
  })
);

// --- Custom Hooks for easier access ---
export const useDashboardState = () => ({
  stats: useDashboardStore((state) => state.stats),
  bookingChartData: useDashboardStore((state) => state.bookingChartData),
  revenueChartData: useDashboardStore((state) => state.revenueChartData),
  branchMonthlyRevenue: useDashboardStore((state) => state.branchMonthlyRevenue),
  isLoading: useDashboardStore((state) => state.isLoading),
  branchRevenueLoading: useDashboardStore((state) => state.branchRevenueLoading),
  error: useDashboardStore((state) => state.error),
});

export const useDashboardActions = () => useDashboardStore((state) => state.actions);
