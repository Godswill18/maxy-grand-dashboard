import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { toast } from 'sonner';
import axios from 'axios';

export interface Guest {
  id: string;
  name: string;
  roomId: string;
  email: string;
  phone: string;
  bookingId: string;
  room: string;
  checkInDate: string;
  checkOutDate: string;
  rawCheckOutDate: string;
  status: "Pending Check-in" | "Checked In" | "Checked Out" | "Cancelled" | "Pending" | "Unknown";
  guests: number;
  specialRequests?: string;
  roomRate?: number;
  bookingType?: 'online' | 'walk-in'; // NEW: Add booking type
}

const mapBookingStatusToFrontend = (status: string): Guest['status'] => {
  switch (status) {
    case 'confirmed':
      return "Pending Check-in";
    case 'checked-in':
      return "Checked In";
    case 'checked-out':
      return "Checked Out";
    case 'cancelled':
      return "Cancelled";
    case 'pending':
      return "Pending";
    default:
      return "Unknown";
  }
};

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const formatDateTime = (dateString: string | undefined): string => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    return "Invalid Date";
  }
};

interface CheckInState {
  guests: Guest[];
  loading: boolean;
  error: string | null;
  fetchGuests: () => Promise<void>;
  checkInGuest: (bookingId: string, confirmationCode: string) => Promise<void>;
  checkOutGuest: (bookingId: string) => Promise<void>;
  createBooking: (data: any) => Promise<void>;
  verifyConfirmationCode: (bookingId: string, code: string) => Promise<boolean>;
  checkInWithRegistration: (bookingId: string, formData: any) => Promise<void>;
  createGuestAccountAndCheckIn: (userData: { 
    firstName: string; 
    lastName: string; 
    email: string; 
    phoneNumber: string; 
    password: string; 
  }) => Promise<string>;
  extendGuestStay: (bookingId: string, days: number, additionalAmount: number) => Promise<void>; // NEW
  getCheckoutAlerts: () => Promise<{ urgent: Guest[]; overdue: Guest[] }>; // NEW
}

const mapBookingToGuest = (booking: any): Guest => {
  const room = booking.roomId;
  const guestUser = booking.guestId;
  const roomType = room?.roomTypeId;

  const guestName = guestUser
    ? `${guestUser.firstName} ${guestUser.lastName}`
    : booking.guestName;

  return {
    id: booking._id,
    roomId: room?._id || 'N/A',
    name: guestName,
    email: guestUser?.email || booking.guestEmail || 'N/A',
    phone: guestUser?.phoneNumber || booking.guestPhone || 'N/A',
    bookingId: booking._id,
    room: room?.roomNumber || 'N/A',
    checkInDate: formatDateTime(booking.checkInDate),
    checkOutDate: formatDateTime(booking.checkOutDate),
    rawCheckOutDate: booking.checkOutDate,
    status: mapBookingStatusToFrontend(booking.bookingStatus),
    guests: booking.guests || roomType?.capacity || 1,
    specialRequests: booking.specialRequests || undefined,
    roomRate: roomType?.price || 0,
    bookingType: booking.bookingType || 'online', // NEW: Include booking type
  };
};

export const useCheckInStore = create<CheckInState>((set, get) => ({
  guests: [],
  loading: false,
  error: null,

  fetchGuests: async () => {
    set({ loading: true, error: null });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${VITE_API_URL}/api/receptionist/dashboard/bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include' as RequestCredentials,
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch rooms');
      }

      const mappedGuests: Guest[] = result.data.map(mapBookingToGuest);
      set({ guests: mappedGuests, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      toast.error(`Error fetching guests: ${error.message}`);
    }
  },

  checkInGuest: async (bookingId: string, confirmationCode: string) => {
    set({ loading: true });
    try {
      const token = useAuthStore.getState().token;
      
      const response = await fetch(`${VITE_API_URL}/api/receptionist/${bookingId}/check-in`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ confirmationCode }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check in');
      }

      const updatedGuest = mapBookingToGuest(result.data);

      set((state) => ({
        loading: false,
        guests: state.guests.map((guest) =>
          guest.id === bookingId ? updatedGuest : guest
        ),
      }));
      toast.success(`${updatedGuest.name} checked in successfully!`);
    } catch (error: any) {
      set({ loading: false, error: error.message });
      toast.error(`Check-in failed: ${error.message}`);
    }
  },

  checkOutGuest: async (bookingId: string) => {
    set({ loading: true });
    try {
      const token = useAuthStore.getState().token;

      const response = await fetch(`${VITE_API_URL}/api/receptionist/${bookingId}/check-out`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include' as RequestCredentials,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check out');
      }
      
      const updatedGuest = mapBookingToGuest(result.data);
      set((state) => ({
        loading: false,
        guests: state.guests.map((guest) =>
          guest.id === bookingId ? updatedGuest : guest
        ),
      }));

      toast.success(result.message || `${updatedGuest.name} checked out successfully`);
    } catch (error: any) {
      set({ loading: false });
      toast.error(`Check-out failed: ${error.message}`);
    }
  },

  verifyConfirmationCode: async (bookingId: string, code: string): Promise<boolean> => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${VITE_API_URL}/api/bookings/verify-code/${bookingId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ confirmationCode: code }),
      });
      const result = await response.json();
      return result.success || false;
    } catch (error) {
      toast.error('Failed to verify code');
      return false;
    }
  },

  createGuestAccountAndCheckIn: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/create-guest-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const error = result.error || result.message || 'Account creation failed.';
        throw new Error(error);
      }

      return result.userId as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'A network or server error occurred during account creation.';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  checkInWithRegistration: async (bookingId: string, formData: any) => {
    set({ loading: true });
    try {
      const { createGuestAccountAndCheckIn } = useCheckInStore.getState();
      let userId = formData.userId;
      if (!userId) {
        userId = await createGuestAccountAndCheckIn({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
        });
      }
      const token = useAuthStore.getState().token;
      const response = await fetch(`${VITE_API_URL}/api/receptionist/${bookingId}/check-in`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          confirmationCode: formData.confirmationCode,
          userId,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          arrivingFrom: formData.arrivingFrom,
          nextOfKinName: formData.nextOfKinName,
          nextOfKinPhone: formData.nextOfKinPhone,
          extraBedding: formData.extraBedding,
          specialRequests: formData.specialRequests,
        }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to check in');
      }
      const updatedGuest = mapBookingToGuest(result.data);
      set((state) => ({
        guests: state.guests.map((guest) => guest.id === bookingId ? updatedGuest : guest),
      }));
      toast.success('Guest checked in successfully');
    } catch (error: any) {
      toast.error(`Check-in failed: ${error.message}`);
    } finally {
      set({ loading: false });
    }
  },

  createBooking: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${VITE_API_URL}/api/bookings/create`, data, {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      await get().fetchGuests();
      toast.success('Booking created successfully');
      set({ loading: false });
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.error || "Booking failed",
      });
    }
  },

  // NEW: Extend guest stay
  extendGuestStay: async (bookingId: string, days: number, additionalAmount: number) => {
    set({ loading: true });
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${VITE_API_URL}/api/receptionist/${bookingId}/extend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ days, additionalAmount }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to extend stay');
      }

      const updatedGuest = mapBookingToGuest(result.data);
      set((state) => ({
        loading: false,
        guests: state.guests.map((guest) =>
          guest.id === bookingId ? updatedGuest : guest
        ),
      }));
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

  // NEW: Get checkout alerts
  getCheckoutAlerts: async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${VITE_API_URL}/api/receptionist/checkout-alerts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch alerts');
      }

      return {
        urgent: result.data.urgent.map(mapBookingToGuest),
        overdue: result.data.overdue.map(mapBookingToGuest),
      };
    } catch (error: any) {
      toast.error(`Failed to fetch checkout alerts: ${error.message}`);
      return { urgent: [], overdue: [] };
    }
  },
}));