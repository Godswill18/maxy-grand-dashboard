// src/stores/useRoomStore.ts
import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from './useAuthStore';

// Define the shape of your room data based on your backend model
interface Room {
  _id: string;
  hotelId: string;
  name: string;
  roomNumber: string;
  description: string;
  amenities: string[]; // Assuming amenities is an array of strings
  price: number;
  capacity: number;
  images: string[];
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved' | 'cleaning';
  roomTypeId: {
    _id: string;
    name: string;
    price: number;
    description: string;
    createdAt: string;
    updatedAt: string;
    images: string[];
    isAvailable: boolean;
  };
}

// Define the state and actions for your store
interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  isModalOpen: boolean;
  fetchRooms: () => Promise<void>;
  fetchRoomsAdmin: () => Promise<void>;
  fetchRoomById: (id: string) => Promise<void>;
  createRoom: (formData: FormData) => Promise<{ success: boolean }>;
  openModal: () => void;
  closeModal: () => void;
  updateRoom: (id: string, updatedData: Partial<Room>) => Promise<{ success: boolean }>; // For text-only
  deleteRoom: (id: string) => Promise<{ success: boolean }>;
  
  // --- 👇 NEW FUNCTIONS ADDED ---
  addImages: (id: string, formData: FormData) => Promise<{ success: boolean }>;
  deleteImage: (id: string, imagePath: string) => Promise<{ success: boolean }>;
}

// Helper function to get the auth token (if you have one)
const getToken = () => {
  // Replace with your actual token logic (e.g., from localStorage, context)
  return localStorage.getItem('authToken'); 
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useRoomStore = create<RoomState>((set) => ({
  rooms: [],
  currentRoom: null,
  isLoading: false,
  error: null,
  isModalOpen: false,
  
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),

  fetchRooms: async () => {
    const { user } = useAuthStore.getState(); // Get current user
    if (!user) return;

    set({ isLoading: true });
    try {
      const url = user.hotelId
        ? `/api/rooms/by-hotel/${user.hotelId}` // fetch hotel-specific rooms
        : `/api/rooms`; // fallback to all rooms if no hotelId

      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();

      if (data.success) {
        set({ rooms: data.rooms });
      } else {
        set({ rooms: [] });
        console.error('Failed to fetch rooms:', data.message);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      set({ rooms: [] });
    } finally {
      set({ isLoading: false });
    }
  },

   fetchRoomsAdmin: async () => {
    set({ isLoading: true, error: null });
    
    // 1. Get User Context
    const { user, token } = useAuthStore.getState();

    if (!user) {
        set({ error: "User not authenticated", isLoading: false });
        return;
    }

    try {
      let url = '';

      // 2. Logic: Superadmin gets ALL, Admin gets HOTEL SPECIFIC
      if (user.role === 'superadmin') {
          url = `${VITE_API_URL}/api/rooms/get-all-rooms`;
      } else if (user.hotelId) {
          // Use the endpoint that filters by hotelId
          // Note: Ensure your backend supports this route or similar
          url = `${VITE_API_URL}/api/rooms/by-hotel/${user.hotelId}`; 
      } else {
          // Fallback if admin has no hotelId assigned
          set({ rooms: [], isLoading: false });
          return;
      }

      // 3. Make request with Authorization header
      const response = await axios.get(url, {
          headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true 
      });

      // 4. Handle different response structures based on endpoint
      // /get-all-rooms usually returns { data: [...] }
      // /by-hotel usually returns { rooms: [...] } based on your previous code
      const data = response.data.data || response.data.rooms || [];

      set({ rooms: data, isLoading: false });

    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
    }
  },

  fetchRoomById: async (id: string) => {
    set({ isLoading: true, error: null, currentRoom: null });
    try {
      const response = await axios.get(`${VITE_API_URL}/api/rooms/get-room/${id}`);
      set({ currentRoom: response.data.data, isLoading: false });
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
    }
  },

  // --- UPDATE ROOM (TEXT-ONLY) ---
  // This function is already correct for your new API
  updateRoom: async (id: string, updatedData: Partial<Room>) => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();

      const response = await axios.put(
        `${VITE_API_URL}/api/rooms/update-room/${id}`,
        updatedData,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true,
        }
      );

      const updated = response.data.data;
      set((state) => ({
        rooms: state.rooms.map((r) => (r._id === id ? updated : r)),
        currentRoom: state.currentRoom?._id === id ? updated : state.currentRoom,
        isLoading: false,
      }));

      return { success: true };
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
      console.error("Update Room Error:", error.response?.data || error.message);
      return { success: false };
    }
  },

  // --- DELETE ROOM ---
  deleteRoom: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      await axios.delete(`${VITE_API_URL}/api/rooms/delete-room/${id}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        withCredentials: true,
      });
      set((state) => ({
        rooms: state.rooms.filter((r) => r._id !== id),
        currentRoom: state.currentRoom?._id === id ? null : state.currentRoom,
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
      return { success: false };
    }
  },

  // --- CREATE ROOM ---
  createRoom: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken(); // Get auth token
      await axios.post(`${VITE_API_URL}/api/rooms/create-room`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true,
      });
      set({ isLoading: false });
      // After creating, fetch the updated list of rooms
      useRoomStore.getState().fetchRoomsAdmin();
      return { success: true };
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
      return { success: false };
    }
  },
  
  // --- 👇 NEW FUNCTION IMPLEMENTATION ---
  
  // --- ADD IMAGES TO ROOM ---
  addImages: async (id: string, formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const response = await axios.post(
        `${VITE_API_URL}/api/rooms/add-images/${id}`, // Uses the new route
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Handles files
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true,
        }
      );

      const updated = response.data.data;
      // Update state with the new room data
      set((state) => ({
        rooms: state.rooms.map((r) => (r._id === id ? updated : r)),
        currentRoom: state.currentRoom?._id === id ? updated : state.currentRoom,
        isLoading: false,
      }));

      return { success: true };
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
      return { success: false };
    }
  },

  // --- DELETE IMAGE FROM ROOM ---
  deleteImage: async (id: string, imagePath: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const response = await axios.patch(
        `${VITE_API_URL}/api/rooms/delete-image/${id}`, // Uses the new route
        { imagePath }, // Send the path of the image to delete
        {
          headers: {
            'Content-Type': 'application/json', // Sends JSON
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          withCredentials: true,
        }
      );

      const updated = response.data.data;
      // Update state with the new room data
      set((state) => ({
        rooms: state.rooms.map((r) => (r._id === id ? updated : r)),
        currentRoom: state.currentRoom?._id === id ? updated : state.currentRoom,
        isLoading: false,
      }));

      return { success: true };
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
      return { success: false };
    }
  },

}));