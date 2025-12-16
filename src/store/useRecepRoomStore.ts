import { create } from 'zustand';
import { toast } from 'sonner';

// Define the API base URL (consistent with useAuthStore)
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// --- INTERFACES BASED ON YOUR BACKEND (receptionistController.js) ---

// Represents the populated roomTypeId object
interface RoomType {
  _id: string;
  name: string; // "Standard", "Deluxe", etc.
  price: number;
  capacity: number;
  amenities: string[];
}

// Represents the populated currentBookingId object
interface CurrentBooking {
  _id: string;
  guestName: string; // The primary guest name
  guestEmail: string;
  guestPhone: string;
  guestId?: { // Details if the guest is a registered user
    firstName: string;
    lastName: string;
    email: string;
  };
}

// This is the main Room object, matching your backend's `formattedRooms`
export interface ReceptionistRoom {
  _id: string;
  roomNumber: string;
  status: "available" | "occupied" | "cleaning" | "maintenance" | "reserved";
  hotelId: string;
  roomTypeId: RoomType; // This is now a populated object
  currentBookingId: CurrentBooking | null; // Can be null if available
  checkInDate: string | null;
  checkOutDate: string | null;
}

// --- ZUSTAND STORE DEFINITION ---

interface RoomState {
  rooms: ReceptionistRoom[];
  isLoading: boolean;
  error: string | null;
  fetchRooms: () => Promise<void>;
  checkIn: (bookingId: string, confirmationCode: string) => Promise<{ success: boolean }>;
  updateRoomStatus: (roomId: string, newStatus: string) => Promise<void>;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  isLoading: false,
  error: null,

  /**
   * Fetches all rooms from the receptionist's endpoint
   */
  fetchRooms: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/rooms`, {
        method: 'GET',
        credentials: 'include', // Important for protected routes
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      set({ rooms: data.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch rooms';
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  /**
   * Checks in a guest for a specific booking
   */
  checkIn: async (bookingId: string, confirmationCode: string) => {
    set({ isLoading: true }); // Use a loading state for the action
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/${bookingId}/check-in`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirmationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      toast.success(`Booking ${bookingId} checked in successfully!`);
      
      // Refresh the entire room list to show the new status
      await get().fetchRooms(); 
      
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: message, isLoading: false });
      toast.error(message);
      return { success: false };
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * Updates the status of a room
   */
  updateRoomStatus: async (roomId: string, newStatus: string) => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/receptionist/rooms/${roomId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room status');
      }

      toast.success(`Room status updated to ${newStatus}`);
      
      // Refresh the room list
      await get().fetchRooms();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update room status';
      toast.error(message);
      throw error;
    }
  },
}));