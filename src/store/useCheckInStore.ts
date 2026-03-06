import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';
import { toast } from 'sonner';
import axios from 'axios';
import { socket } from '../lib/socket';

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
  rawCheckInDate: string; // ✅ For date validation
  status: "Pending Check-in" | "Checked In" | "Checked Out" | "Cancelled" | "Pending" | "Unknown";
  guests: number;
  specialRequests?: string;
  roomRate?: number;
  bookingType?: 'online' | 'walk-in';
  updatedAt?: string;
}

const mapBookingStatusToFrontend = (status: string): Guest['status'] => {
  switch (status) {
    case 'confirmed': return "Pending Check-in";
    case 'checked-in': return "Checked In";
    case 'checked-out': return "Checked Out";
    case 'cancelled': return "Cancelled";
    case 'pending': return "Pending";
    default: return "Unknown";
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
  createGuestAccountAndCheckIn: (data: any) => Promise<string>;
  extendGuestStay: (bookingId: string, days: number, additionalAmount: number) => Promise<void>;
  getCheckoutAlerts: () => Promise<{ urgent: Guest[]; overdue: Guest[] }>;
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
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
    rawCheckInDate: booking.checkInDate,
    status: mapBookingStatusToFrontend(booking.bookingStatus),
    guests: booking.guests || roomType?.capacity || 1,
    specialRequests: booking.specialRequests || undefined,
    roomRate: roomType?.price || 0,
    bookingType: booking.bookingType || 'online',
    updatedAt: booking.updatedAt,
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

      if (!result.success) throw new Error(result.error || 'Failed to fetch guests');

      const mappedGuests: Guest[] = result.data.map(mapBookingToGuest);
      set({ guests: mappedGuests, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      console.error(`Error fetching guests: ${error.message}`);
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
      if (!result.success) throw new Error(result.error || 'Failed to check in');

      const updatedGuest = mapBookingToGuest(result.data);
      set((state) => ({
        loading: false,
        guests: state.guests.map((guest) => guest.id === bookingId ? updatedGuest : guest),
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
      if (!result.success) throw new Error(result.error || 'Failed to check out');
      
      const updatedGuest = mapBookingToGuest(result.data);
      set((state) => ({
        loading: false,
        guests: state.guests.map((guest) => guest.id === bookingId ? updatedGuest : guest),
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
        throw new Error(result.error || result.message || 'Account creation failed.');
      }

      return result.userId as string;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Account creation failed.';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  // ✅ FIXED: Complete check-in flow with date validation and proper request building
  checkInWithRegistration: async (bookingId: string, formData: any) => {
    set({ loading: true });
    try {
      console.log('📋 CHECK-IN WITH REGISTRATION', {
        bookingId,
        hasConfirmationCode: !!formData.confirmationCode,
        hasGuestDetails: !!(formData.firstName && formData.lastName),
      });

      // ✅ VALIDATE CHECK-IN DATE
      const guest = get().guests.find(g => g.id === bookingId);
      if (guest?.rawCheckInDate) {
        const checkInDate = new Date(guest.rawCheckInDate);
        const now = new Date();
        
        checkInDate.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        if (now < checkInDate) {
          set({ loading: false });
          const formattedCheckInDate = checkInDate.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          });
          toast.error(`❌ Guest cannot check in before the scheduled check-in date (${formattedCheckInDate})`);
          return;
        }
      }

      // ✅ BUILD COMPLETE REQUEST BODY
      const requestBody = {
        confirmationCode: formData.confirmationCode || '',
        userId: formData.userId || null,
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        arrivingFrom: formData.arrivingFrom || '',
        nextOfKinName: formData.nextOfKinName || '',
        nextOfKinPhone: formData.nextOfKinPhone || '',
        extraBedding: formData.extraBedding || false,
        specialRequests: formData.specialRequests || '',
        guestDetails: {
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          email: formData.email || '',
          phoneNumber: formData.phoneNumber || '',
        },
        preferences: {
          extraBedding: formData.extraBedding || false,
          specialRequests: formData.specialRequests || '',
        },
      };

      console.log('📤 SENDING REQUEST BODY:', requestBody);

      // ✅ SEND TO BACKEND
      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${VITE_API_URL}/api/receptionist/${bookingId}/check-in`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        }
      );

      // ✅ HANDLE RESPONSE
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Check-in failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Check-in failed');
      }

      const checkedInBooking = data.data;

      // ✅ UPDATE LOCAL STATE
      set(state => {
        const updatedGuests = state.guests.map(guest => {
          if (guest.id === bookingId) {
            return {
              ...guest,
              status: 'Checked In',
              room: checkedInBooking.roomId?.roomNumber || guest.room,
            };
          }
          return guest;
        });
        return { guests: updatedGuests, loading: false };
      });

      toast.success('✅ Guest checked in successfully');

    } catch (error: any) {
      console.error('❌ CHECK-IN ERROR:', error);
      set({ loading: false });
      toast.error(error.message || 'Check-in failed');
      throw error;
    }
  },

  createBooking: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await axios.post(`${VITE_API_URL}/api/bookings/create`, data, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      await get().fetchGuests();
      toast.success('Booking created successfully');
      set({ loading: false });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error || "Booking failed" });
    }
  },

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
      if (!result.success) throw new Error(result.error || 'Failed to extend stay');

      const updatedGuest = mapBookingToGuest(result.data);
      set((state) => ({
        loading: false,
        guests: state.guests.map((guest) => guest.id === bookingId ? updatedGuest : guest),
      }));
    } catch (error: any) {
      set({ loading: false });
      throw error;
    }
  },

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
      if (!result.success) throw new Error(result.error || 'Failed to fetch alerts');

      return {
        urgent: result.data.urgent.map(mapBookingToGuest),
        overdue: result.data.overdue.map(mapBookingToGuest),
      };
    } catch (error: any) {
      toast.error(`Failed to fetch checkout alerts: ${error.message}`);
      return { urgent: [], overdue: [] };
    }
  },

  initSocketListeners: () => {
    if (!socket.connected) {
      console.log('🔌 Socket connecting...');
      socket.connect();
    }

    socket.off('bookingCreated');
    socket.off('bookingUpdated');
    socket.off('bookingDeleted');

    socket.on('bookingCreated', (newBooking: any) => {
      console.log('✅ Socket: bookingCreated');
      get().fetchGuests();
    });

    socket.on('bookingUpdated', (updatedBooking: any) => {
      console.log('✅ Socket: bookingUpdated');
      get().fetchGuests();
    });

    socket.on('bookingDeleted', (bookingId: string) => {
      console.log('✅ Socket: bookingDeleted');
      get().fetchGuests();
    });

    console.log('✅ Socket listeners initialized');
  },

  closeSocketListeners: () => {
    console.log('❌ Removing socket listeners');
    socket.off('bookingCreated');
    socket.off('bookingUpdated');
    socket.off('bookingDeleted');
  },
}));