import { create } from 'zustand';
import { toast } from 'sonner';
import { useAuthStore } from './useAuthStore';

interface CleaningRoom {
  _id: string;
  roomNumber: string;
  status: string;
  roomTypeId: { name: string };
}

interface CleaningRequest {
  _id: string;
  roomId: CleaningRoom;
  assignedCleaner: { _id: string; name: string; email: string };
  requestedBy: { name: string };
  status: 'pending' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Cleaner {
  _id: string;
  name: string;
  email: string;
}

interface HousekeepingState {
  cleaningRooms: CleaningRoom[];
  allRequests: CleaningRequest[];
  pendingTasks: CleaningRequest[];
  completedTasks: CleaningRequest[];
  cleaners: Cleaner[];
  fetchCleaningRooms: () => Promise<void>;
  fetchAllRequests: () => Promise<void>;
  fetchCleaners: () => Promise<void>;
  assignCleaner: (roomId: string, cleanerId: string, notes?: string) => Promise<void>;
}

const getToken = () => useAuthStore.getState().token; 
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getHotelId = () => useAuthStore.getState().user?.hotelId;

export const useHousekeepingStore = create<HousekeepingState>((set, get) => ({
  cleaningRooms: [],
  allRequests: [],
  pendingTasks: [],
  completedTasks: [],
  cleaners: [],
  fetchCleaningRooms: async () => {
    try {
      const token = getToken();
      const hotelId = getHotelId();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/rooms/cleaning?hotelId=${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cleaning rooms');
      const rooms = await response.json();
      set({ cleaningRooms: rooms });
    } catch (error) {
      toast.error('Failed to fetch cleaning rooms');
      console.error(error);
    }
  },
  fetchAllRequests: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/hotel`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',

      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      const requests = await response.json();
      const pending = requests.filter((r: CleaningRequest) => r.status === 'pending');
      const completed = requests.filter((r: CleaningRequest) => r.status === 'completed');
      set({ allRequests: requests, pendingTasks: pending, completedTasks: completed });
    } catch (error) {
      toast.error('Failed to fetch requests');
      console.error(error);
    }
  },
  fetchCleaners: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/cleaners`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',

      });
      if (!response.ok) throw new Error('Failed to fetch cleaners');
      const cleaners = await response.json();
      set({ cleaners });
    } catch (error) {
      toast.error('Failed to fetch cleaners');
      console.error(error);
    }
  },

  assignCleaner: async (roomId: string, cleanerId: string, notes?: string) => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          
        },
        body: JSON.stringify({ roomId, assignedCleanerId: cleanerId, notes }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to assign cleaner');
      toast.success('Cleaner assigned successfully');
      // Refetch to update state
      get().fetchAllRequests();
      get().fetchCleaningRooms();
    } catch (error) {
      toast.error('Failed to assign cleaner');
      console.error(error);
    }
  },
}));