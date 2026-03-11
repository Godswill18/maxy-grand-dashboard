import { create } from 'zustand';

interface WeeklyTask {
  day: string;
  completed: number;
  pending: number;
  inProgress: number;
}

interface PerformanceData {
  month: string;
  score: number;
}

interface UrgentTask {
  _id: string;
  room: string;
  roomNumber: string;
  type: string;
  priority: string;
  estimatedStartTime?: string;
  createdAt: string;
  notes?: string;
}

interface DashboardStats {
  tasksToday: number;
  completedToday: number;
  pendingToday: number;
  inProgressToday: number;
  completedYesterday: number;
  performanceScore: number;
  previousMonthScore: number;
  urgentCount: number;
  standardCount: number;
}

interface DashboardData {
  stats: DashboardStats;
  weeklyData: WeeklyTask[];
  performanceData: PerformanceData[];
  urgentTasks: UrgentTask[];
}

const CLEANER_DASHBOARD_TTL = 2 * 60 * 1000; // 2 minutes

interface DashboardState {
  dashboardData: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchDashboardData: () => Promise<void>;
  clearError: () => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboardData: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchDashboardData: async () => {
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < CLEANER_DASHBOARD_TTL) return;

    set({ isLoading: true, error: null });
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${VITE_API_URL}/api/cleaning/dashboard/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data: DashboardData = await response.json();
      
    //   console.log('Fetched dashboard data:', data);

      set({ dashboardData: data, isLoading: false, lastFetched: Date.now() });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
        dashboardData: null
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useDashboardStore;