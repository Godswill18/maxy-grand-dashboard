import { create } from 'zustand';
import axios from 'axios';
import { shallow } from 'zustand/shallow';

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

interface DashboardState {
  stats: Partial<Stats>; // Use Partial for initial state
  bookingChartData: BookingData[];
  revenueChartData: RevenueData[];
  isLoading: boolean;
  error: string | null;
}

interface DashboardActions {
  fetchDashboardData: () => Promise<void>;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// TODO: You MUST send an auth token (e.g., from a user/auth store)
const getAuthHeaders = () => {
  // const token = useAuthStore.getState().token;
  // return { Authorization: `Bearer ${token}` };
  return {
    // 'Authorization': `Bearer YOUR_TOKEN_HERE`
  };
};

// --- 2. Create the Store ---
export const useDashboardStore = create<DashboardState & { actions: DashboardActions }>(
  (set) => ({
    // --- Initial State ---
    stats: {},
    bookingChartData: [],
    revenueChartData: [],
    isLoading: true,
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
    },
  })
);

// --- Custom Hooks for easier access ---
export const useDashboardState = () => ({
      stats: useDashboardStore((state) => state.stats),
      bookingChartData: useDashboardStore((state) => state.bookingChartData),
      revenueChartData: useDashboardStore((state) => state.revenueChartData),
      isLoading: useDashboardStore((state) => state.isLoading),
      error: useDashboardStore((state) => state.error),
    });

//     export const useReportState = () => ({
//     timeseriesData: useReportStore((s) => s.timeseriesData),
//     sourceData: useReportStore((s) => s.sourceData),
//     period: useReportStore((s) => s.period),
//     isLoading: useReportStore((s) => s.isLoading),
//     error: useReportStore((s) => s.error),
//   });
  

export const useDashboardActions = () => useDashboardStore((state) => state.actions);