import { create } from 'zustand';
import { useAuthStore } from './useAuthStore'; // Import auth store to get token
import { toast } from 'sonner';
import axios from 'axios';

// This interface matches the frontend component's needs
export interface Guest {
  id: string; // This will be the Room ID
  name: string;
  roomId: string;
  email: string;
  phone: string;
  bookingId: string;
  room: string;
  checkInDate: string;
  checkOutDate: string;
  rawCheckOutDate: string
  status: "Pending Check-in" | "Checked In" | "Checked Out" | "Cancelled" | "Pending" | "Unknown";
  guests: number;
  specialRequests?: string;
}

// This utility function maps backend room status to frontend guest status
const mapBookingStatusToFrontend = (status: string): Guest['status'] => {
  switch (status) {
    // This is the most important one for check-in:
    case 'confirmed':
      return "Pending Check-in";
    
    case 'checked-in':
      return "Checked In";
    
    case 'checked-out':
      return "Checked Out";
    
    case 'cancelled':
      return "Cancelled";

    // 'pending' bookings are not yet confirmed
    case 'pending':
      return "Pending";
      
    // Default for any unknown booking status
    default:
      // We should never see room statuses like 'available' or 'cleaning' here.
      // If we do, it's a bug in the data.
      return "Unknown";
  }
};
/**
 * FIX: This function now gets the token from the store *every time it is called*,
 * ensuring the token is always fresh and not stale from when the module first loaded.
 */
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// This function formats date strings
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

// Define the state and actions
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
  }) => Promise<string>; // Returns the new userId
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
  };
};





export const useCheckInStore = create<CheckInState>((set, get) => ({
  guests: [],
  loading: false,
  error: null,
  

  fetchGuests: async () => {
    set({ loading: true, error: null });
    try {
      // This will now get the fresh token or throw an error if missing
      // const { apiUrl, headers } = getApiConfig();
      
      const token = useAuthStore.getState().token; // Get fresh token
      const response = await fetch(`${VITE_API_URL}/api/receptionist/dashboard/bookings`, {
        method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include' as RequestCredentials,
        // Removed `credentials: 'include'` as it's for cookie-based auth,
        // not typically used with Bearer tokens.
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch rooms');
      }


    const mappedGuests: Guest[] = result.data.map(mapBookingToGuest);

      set({ guests: mappedGuests, loading: false });
      // console.log('Fetched guests dataaaa:', mappedGuests);
    } catch (error: any) {
      set({ loading: false, error: error.message });
      toast.error(`Error fetching guests: ${error.message}`);
    }
  },

  checkInGuest: async (bookingId: string, confirmationCode: string) => {
  // --- 1. Accept 'confirmationCode' as a new argument ---
  set({ loading: true });
  try {
    const token = useAuthStore.getState().token;
    
    const response = await fetch(`${VITE_API_URL}/api/receptionist/${bookingId}/check-in`, {
      method: 'PATCH', 
      headers: {
        // --- 2. Add Content-Type header ---
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include' as RequestCredentials,
      
      // --- 3. Add the body with the code ---
      body: JSON.stringify({ confirmationCode }),
    });

    const result = await response.json();

    if (!result.success) {
      // The backend error 'Invalid confirmation code.' will now show up
      throw new Error(result.error || 'Failed to check in');
    }

    // (Rest of the function is the same)
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
    // This will now display the "Invalid confirmation code" error
    toast.error(`Check-in failed: ${error.message}`);
  }
},


  checkOutGuest: async (bookingId: string) => {
    // --- FIX 2: This whole function is updated ---
    set({ loading: true }); // Use loading state
    try {
      const token = useAuthStore.getState().token;

      // --- FIX 1: Standardized URL ---
      const response = await fetch(`${VITE_API_URL}/api/receptionist/${bookingId}/check-out`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include' as RequestCredentials,
        // body is no longer needed, the endpoint handles the logic
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check out');
      }
      
      // --- THIS FIXES THE UI UPDATE ---
      // Use the same mapping logic as check-in
      const updatedGuest = mapBookingToGuest(result.data); 
      set((state) => ({
        loading: false,
        guests: state.guests.map((guest) =>
          guest.id === bookingId ? updatedGuest : guest // Replace the entire guest object
        ),
      }));
      // --- END OF UI UPDATE FIX ---

      toast.success(result.message || `${updatedGuest.name} checked out successfully`);
    } catch (error: any) {
      set({ loading: false }); // Clear loading on error
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
              // Note: This endpoint is protected, assuming the receptionist is logged in.
              const response = await fetch(`${VITE_API_URL}/api/users/create-guest-account`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: "include", // Include cookies/auth headers for protected routes
                  body: JSON.stringify(userData),
              });

              const result = await response.json();

              if (!response.ok || !result.success) {
                  const error = result.error || result.message || 'Account creation failed.';
                  throw new Error(error);
              }

              // Return the new userId obtained from the backend
              return result.userId as string; 

          } catch (err) {
              const message = err instanceof Error ? err.message : 'A network or server error occurred during account creation.';
              set({ error: message });
              throw err; // Re-throw the error so the calling component can handle it
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

  // console.log('Creating booking with data:', data);

  try {
    const res = await axios.post(`${VITE_API_URL}/api/bookings/create`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // refresh guest list
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

}));