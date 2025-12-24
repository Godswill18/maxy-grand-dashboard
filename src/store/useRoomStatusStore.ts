import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';

// Define types
interface RoomType {
  _id: string;
  name: string;
}

export interface RoomStatus {
  _id: string;
  roomNumber: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out-of-service';
  roomTypeId: RoomType;
  floor?: number;
  lastCleaned?: string;
  currentGuest?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface CleaningRequest {
  _id: string;
  roomId: RoomStatus;
  assignedCleaner?: User;
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

interface RoomStatusState {
  rooms: RoomStatus[];
  cleaningRequests: CleaningRequest[];
  availableCleaners: User[];
  isLoading: boolean;
  error: string | null;
  
  // Fetch functions
  fetchAllRooms: () => Promise<void>;
  fetchCleaningRequests: () => Promise<void>;
  fetchAvailableCleaners: () => Promise<void>;
  
  // Action functions
  acceptCleaningRequest: (requestId: string) => Promise<void>;
  updateRoomStatus: (roomId: string, status: RoomStatus['status']) => Promise<void>;
  createCleaningRequest: (roomId: string, cleanerId: string, notes?: string, priority?: string) => Promise<void>;
}

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useRoomStatusStore = create<RoomStatusState>((set, get) => ({
  rooms: [],
  cleaningRequests: [],
  availableCleaners: [],
  isLoading: false,
  error: null,

  // Fetch all rooms in the hotel
  fetchAllRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = useAuthStore.getState();
      if (!user?.hotelId) {
        throw new Error('Hotel ID not found');
      }
      
      const response = await axios.get(
        `${VITE_API_URL}/api/rooms/room-status/by-hotel/${user.hotelId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      // Handle both direct array response and { success, rooms } response
      const roomsData = response.data.rooms || response.data;
      set({ rooms: roomsData, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch rooms', 
        isLoading: false 
      });
    }
  },

  // Fetch all cleaning requests for the hotel
  fetchCleaningRequests: async () => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${VITE_API_URL}/api/cleaning/hotel`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ cleaningRequests: response.data, isLoading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch cleaning requests', 
        isLoading: false 
      });
    }
  },

  // Fetch available cleaners in the hotel
  fetchAvailableCleaners: async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${VITE_API_URL}/api/cleaning/cleaners`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ availableCleaners: response.data });
    } catch (error: any) {
      console.error('Failed to fetch cleaners:', error);
    }
  },

  // ✅ FIXED: Cleaner accepts a cleaning request (assigns themselves but doesn't start yet)
  acceptCleaningRequest: async (requestId: string) => {
    try {
      const { token, user } = useAuthStore.getState();
      
      // ✅ FIXED: Call /accept endpoint to assign cleaner (status stays 'pending')
      const response = await axios.patch(
        `${VITE_API_URL}/api/cleaning/${requestId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      console.log('✅ Request accepted:', response.data);

      // Update local state - status stays 'pending', only assignedCleaner changes
      set((state) => ({
        cleaningRequests: state.cleaningRequests.map((req) =>
          req._id === requestId
            ? { 
                ...req, 
                status: 'pending', // ✅ Status stays 'pending' after accept
                assignedCleaner: user ? {
                  _id: user._id,
                  firstName: user.firstName || '',
                  lastName: user.lastName || ''
                } : undefined
              }
            : req
        ),
      }));

      // Refresh requests and rooms to get updated data from server
      await Promise.all([
        get().fetchCleaningRequests(),
        get().fetchAllRooms()
      ]);
    } catch (error: any) {
      console.error('❌ Failed to accept cleaning request:', error);
      console.error('❌ Error details:', error.response?.data);
      throw error;
    }
  },

  // Update room status (e.g., mark as clean, dirty, etc.)
  updateRoomStatus: async (roomId: string, status: RoomStatus['status']) => {
    try {
      const { token } = useAuthStore.getState();
      
      const response = await axios.patch(
        `${VITE_API_URL}/api/rooms/${roomId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // Update local state with the response
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId 
            ? { ...room, status, lastCleaned: status === 'available' ? new Date().toISOString() : room.lastCleaned } 
            : room
        ),
      }));

      return response.data;
    } catch (error: any) {
      console.error('Failed to update room status:', error);
      throw error;
    }
  },

  // Create a new cleaning request (admin/staff assigns cleaner to a room)
  createCleaningRequest: async (
    roomId: string, 
    cleanerId: string, 
    notes?: string,
    priority: string = 'Medium'
  ) => {
    try {
      const { token } = useAuthStore.getState();
      
      const response = await axios.post(
        `${VITE_API_URL}/api/cleaning`,
        {
          roomId,
          assignedCleanerId: cleanerId,
          notes,
          priority,
          estimatedDuration: '30 min'
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // Add the new request to local state
      set((state) => ({
        cleaningRequests: [response.data, ...state.cleaningRequests],
      }));

      // Refresh to get updated data
      await get().fetchCleaningRequests();
    } catch (error: any) {
      console.error('Failed to create cleaning request:', error);
      throw error;
    }
  },
}));