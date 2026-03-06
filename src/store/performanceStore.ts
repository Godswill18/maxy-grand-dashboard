import { create } from 'zustand';

interface MonthlyData {
  month: string;
  completed: number;
  rating: number;
}

interface TaskTypeData {
  name: string;
  value: number;
  color: string;
}

interface PerformanceMetric {
  metric: string;
  score: number;
}

interface WeeklyProductivity {
  day: string;
  tasks: number;
  avgTime: number;
}

interface Achievement {
  title: string;
  description: string;
  icon: string;
  achieved: boolean;
  progress?: number;
  target?: number;
}

interface KeyMetrics {
  tasksThisMonth: number;
  tasksLastMonth: number;
  averageRating: number;
  avgTimePerTask: number;
  previousAvgTime: number;
  efficiencyScore: number;
  percentile: number;
}

interface PerformanceData {
  keyMetrics: KeyMetrics;
  monthlyData: MonthlyData[];
  taskTypeData: TaskTypeData[];
  performanceMetrics: PerformanceMetric[];
  weeklyProductivity: WeeklyProductivity[];
  achievements: Achievement[];
}

interface PerformanceState {
  performanceData: PerformanceData | null;
  isLoading: boolean;
  error: string | null;
  fetchPerformanceData: () => Promise<void>;
  clearError: () => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const usePerformanceStore = create<PerformanceState>((set) => ({
  performanceData: null,
  isLoading: false,
  error: null,

  fetchPerformanceData: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${VITE_API_URL}/api/cleaning/cleaner-stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch performance data: ${response.statusText}`);
      }

      const data: PerformanceData = await response.json();
      
    //   console.log('Fetched performance data:', data);

      set({ performanceData: data, isLoading: false });
    } catch (error) {
      console.error('Error fetching performance data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
        performanceData: null
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default usePerformanceStore;