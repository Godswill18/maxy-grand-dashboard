import { create } from 'zustand';

interface Room {
  _id: string;
  roomNumber: string;
  status: string;
  roomTypeId?: {
    _id: string;
    name: string;
  };
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface CompletedTask {
  _id: string;
  hotelId: string;
  roomId: Room;
  assignedCleaner: User;
  requestedBy: User;
  notes?: string;
  priority: string;
  estimatedDuration: string;
  actualDuration?: number;
  status: 'completed';
  startTime: string;
  finishTime: string;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  feedback?: string;
}

interface TaskHistoryState {
  completedTasks: CompletedTask[];
  isLoading: boolean;
  error: string | null;
  fetchCompletedTasks: () => Promise<void>;
  clearError: () => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const useTaskHistoryStore = create<TaskHistoryState>((set) => ({
  completedTasks: [],
  isLoading: false,
  error: null,

  fetchCompletedTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = sessionStorage.getItem('token'); // Adjust based on your auth storage
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${VITE_API_URL}/api/cleaning/my-tasks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch tasks: ${response.statusText}`);
      }

      const allTasks: CompletedTask[] = await response.json();
      
      // Validate and filter completed tasks
      const completedTasks = Array.isArray(allTasks) 
        ? allTasks.filter(task => task && task.status === 'completed')
        : [];

      // console.log('Fetched completed tasks:', completedTasks);

      set({ completedTasks, isLoading: false });
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
        completedTasks: [] // Reset tasks on error
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useTaskHistoryStore;