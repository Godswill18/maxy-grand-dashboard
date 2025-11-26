import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore'; // Assuming you have an auth store for the token

// Define types based on your backend response
interface RoomType {
  _id: string;
  name: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  status: string;
  roomTypeId: RoomType;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface CleaningTask {
  _id: string;
  roomId: Room;
  assignedCleaner: string; // ID
  requestedBy: User;
  status: 'pending' | 'in_progress' | 'completed'; // Backend uses lowercase, mapping might be needed
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HousekeeperState {
  tasks: CleaningTask[];
  isLoading: boolean;
  error: string | null;
  fetchMyTasks: () => Promise<void>;
  startTask: (taskId: string) => void; // Optimistic update or API call if you had a 'start' endpoint
  completeTask: (taskId: string) => Promise<void>;
}

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useHousekeeperStore = create<HousekeeperState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchMyTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${VITE_API_URL}/api/cleaning/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ tasks: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch tasks', 
        isLoading: false 
      });
    }
  },

  // Note: Your backend doesn't have a specific "start task" endpoint, 
  // so we'll handle this locally for UI feedback or you might want to add one later.
  // For now, we will just update the local state to show "In Progress"
  startTask: (taskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((t) => 
        t._id === taskId ? { ...t, status: 'in_progress' } : t
      ),
    }));
  },

  completeTask: async (taskId: string) => {
    try {
      const { token } = useAuthStore.getState();
      await axios.patch(`${VITE_API_URL}/api/cleaning/${taskId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      // Remove the task from the list or mark as completed
      // Your getMyPendingTasks controller only returns 'pending' tasks, 
      // so essentially it should disappear from the list upon refresh.
      // We'll update local state to reflect completion immediately.
      set((state) => ({
        tasks: state.tasks.map((t) => 
          t._id === taskId ? { ...t, status: 'completed' } : t
        ),
      }));
      
      // Optionally refresh the list to be perfectly in sync
      // get().fetchMyTasks(); 
    } catch (error: any) {
      console.error("Failed to complete task", error);
      // You might want to set an error state here to show a toast
    }
  },
}));