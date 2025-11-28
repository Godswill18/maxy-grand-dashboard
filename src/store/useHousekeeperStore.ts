import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';


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
  assignedCleaner: string;
  requestedBy: User;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: 'High' | 'Medium' | 'Low';
  estimatedDuration?: string;
  startTime?: string;
  finishTime?: string;
  actualDuration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HousekeeperState {
  tasks: CleaningTask[];
  isLoading: boolean;
  error: string | null;
  fetchMyTasks: () => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  
  // NEW: Socket listener management
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
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

  startTask: async (taskId: string) => {
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.patch(
        `${VITE_API_URL}/api/cleaning/${taskId}/start`, 
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      set((state) => ({
        tasks: state.tasks.map((t) => 
          t._id === taskId ? { ...t, status: 'in-progress', startTime: response.data.request.startTime } : t
        ),
      }));
    } catch (error: any) {
      console.error("Failed to start task", error);
      throw error;
    }
  },

  completeTask: async (taskId: string) => {
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.patch(
        `${VITE_API_URL}/api/cleaning/${taskId}/complete`, 
        {}, 
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      set((state) => ({
        tasks: state.tasks.map((t) => 
          t._id === taskId 
            ? { 
                ...t, 
                status: 'completed', 
                finishTime: response.data.request.finishTime,
                actualDuration: response.data.request.actualDuration 
              } 
            : t
        ),
      }));
    } catch (error: any) {
      console.error("Failed to complete task", error);
      throw error;
    }
  },

  // Socket.io listeners for real-time updates
  initSocketListeners: () => {
    // You can implement socket listeners here if needed
    // socket.on('cleaning:new', (data) => { ... });
    // socket.on('cleaning:update', (data) => { ... });
  },

  closeSocketListeners: () => {
    // Clean up socket listeners
    // socket.off('cleaning:new');
    // socket.off('cleaning:update');
  },
}));