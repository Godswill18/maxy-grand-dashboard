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

// Define the state and actions for your store
interface BookingState {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  fetchBookings: () => Promise<void>;
  updateBookingStatus: (id: string, bookingStatus: Booking['bookingStatus']) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  
  // Socket.io listeners
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

// Helper to get auth token
const getToken = () => localStorage.getItem('authToken');
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  isLoading: false,
  error: null,

  // --- 1. AXIOS ACTIONS (for initial load and updates) ---

  fetchBookings: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/bookings/all`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ bookings: response.data.data, isLoading: false });
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
      // The backend will emit a 'bookingUpdated' event, which our listener will catch
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
      // The backend will emit a 'bookingDeleted' event
      toast.success('Booking deleted successfully');
    } catch (err) {
      const error = err as AxiosError;
      toast.error(`Failed to delete booking: ${error.message}`);
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
      set((state) => ({
        bookings: [newBooking, ...state.bookings], // Add to the top of the list
      }));
      toast.info(`New booking created for ${newBooking.guestName}`);
    });

    // Listen for updates
    socket.on('bookingUpdated', (updatedBooking: Booking) => {
      set((state) => ({
        bookings: state.bookings.map((b) =>
          b._id === updatedBooking._id ? updatedBooking : b
        ),
      }));
      toast.info(`Booking for ${updatedBooking.guestName} was updated`);
    });

    // Listen for deletions
    socket.on('bookingDeleted', (bookingId: string) => {
      set((state) => ({
        bookings: state.bookings.filter((b) => b._id !== bookingId),
      }));
      toast.warning('A booking was deleted');
    });
  },

  closeSocketListeners: () => {
    socket.off('bookingCreated');
    socket.off('bookingUpdated');
    socket.off('bookingDeleted');
  },
}));