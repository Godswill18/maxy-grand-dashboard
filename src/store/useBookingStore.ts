// src/store/useBookingStore.ts
import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { socket } from '../lib/socket'; // Import the initialized socket
import { toast } from 'sonner';

// Define the shape of your booking data based on the controller
// Includes populated fields
interface Booking {
  _id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  bookingStatus: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'pending';
  paymentStatus: 'pending' | 'partial' | 'paid';
  hotelId: {
    _id: string;
    name: string;
  };
  roomId: {
    _id: string;
    roomNumber: string;
  };
  createdAt: string;
}

interface Hotel {
  _id: string;
  name: string;
}

// Define the state and actions for your store
interface BookingState {
  bookings: Booking[];
  hotels: Hotel[];
  currentHotelId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchBookings: (hotelId?: string) => Promise<void>;
  fetchHotels: () => Promise<void>;
  updateBookingStatus: (id: string, bookingStatus: Booking['bookingStatus']) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  createBooking: (data: any) => Promise<void>;
  
  // Socket.io listeners
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

// Helper to get auth token
const getToken = () => sessionStorage.getItem('authToken');
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const getUser = () => {
  const userStr = sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  hotels: [],
  currentHotelId: null,
  isLoading: false,
  error: null,

  // --- 1. AXIOS ACTIONS (for initial load and updates) ---

  fetchHotels: async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/hotels`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ hotels: response.data });
    } catch (err) {
      const error = err as AxiosError;
      console.error('Failed to fetch hotels:', error.message);
    }
  },

  fetchBookings: async (hotelId?: string) => {
    set({ isLoading: true, error: null, currentHotelId: hotelId || null });
    try {
      const token = getToken();
      const params: any = {};
      if (hotelId) {
        params.hotelId = hotelId;
      }
      const response = await axios.get(`${VITE_API_URL}/api/bookings/all`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ bookings: response.data.data || [], isLoading: false });
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
    }
  },

  updateBookingStatus: async (id: string, bookingStatus: Booking['bookingStatus']) => {
    // We update optimistically via socket, but send the request
    try {
      const token = getToken();
      await axios.patch(
        `${VITE_API_URL}/api/bookings/${id}/status`,
        { bookingStatus }, // Send the new status in the body
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      // Refetch current page/filter after update
      get().fetchBookings(get().currentHotelId);
      toast.success(`Booking status updated to ${bookingStatus}`);
    } catch (err) {
      const error = err as AxiosError;
      toast.error(`Failed to update booking: ${error.message}`);
    }
  },

  deleteBooking: async (id: string) => {
    try {
      const token = getToken();
      await axios.delete(`${VITE_API_URL}/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      // Refetch current after delete
      get().fetchBookings(get().currentHotelId);
      toast.success('Booking deleted successfully');
    } catch (err) {
      const error = err as AxiosError;
      toast.error(`Failed to delete booking: ${error.message}`);
    }
  },

  createBooking: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const res = await axios.post(`${VITE_API_URL}/api/bookings/create`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      // Refetch current
      get().fetchBookings(get().currentHotelId);

      toast.success('Booking created successfully');

      set({ isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.error || "Booking failed",
      });
    }
  },

  // --- 2. SOCKET.IO LISTENERS (for real-time updates) ---

  initSocketListeners: () => {
    // Ensure listeners are only set up once
    socket.off('bookingCreated');
    socket.off('bookingUpdated');
    socket.off('bookingDeleted');

    // Listen for new bookings
    socket.on('bookingCreated', (newBooking: Booking) => {
      // Refetch to include new booking if matches current hotel
      if (get().currentHotelId === null || newBooking.hotelId._id === get().currentHotelId) {
        get().fetchBookings(get().currentHotelId);
      }
      toast.info(`New booking created for ${newBooking.guestName}`);
    });

    // Listen for updates
    socket.on('bookingUpdated', (updatedBooking: Booking) => {
      // Refetch if matches current hotel
      if (get().currentHotelId === null || updatedBooking.hotelId._id === get().currentHotelId) {
        get().fetchBookings(get().currentHotelId);
      }
      toast.info(`Booking for ${updatedBooking.guestName} was updated`);
    });

    // Listen for deletions
    socket.on('bookingDeleted', (bookingId: string) => {
      get().fetchBookings(get().currentHotelId);
      toast.warning('A booking was deleted');
    });
  },

  closeSocketListeners: () => {
    socket.off('bookingCreated');
    socket.off('bookingUpdated');
    socket.off('bookingDeleted');
  },
}));