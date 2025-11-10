import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Define the full staff user type
export interface StaffUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  hotelId?: { // hotelId is populated, so it's an object
    _id: string;
    name: string;
  } | null;
}

// AdminUser for the existing getAdmins function
interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface StaffState {
  admins: AdminUser[];
  staff: StaffUser[]; // New: For the full staff list
  socket: Socket | null; // New: For Socket.io
  isLoading: boolean;
  error: string | null;
  fetchAdmins: () => Promise<void>;
  fetchAllStaff: () => Promise<void>; // New
  updateStaffStatus: (userId: string, isActive: boolean) => Promise<void>; // New
  initializeSocket: () => void; // New
  disconnectSocket: () => void; // New
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useStaffStore = create<StaffState>((set, get) => ({
  admins: [],
  staff: [], // New
  socket: null, // New
  isLoading: false,
  error: null,

  fetchAdmins: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/admins`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send auth cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch admins');
      }

      const data = await response.json();
      
      set({
        admins: data.data as AdminUser[],
        isLoading: false,
      });

    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  // --- NEW: fetchAllStaff ---
  fetchAllStaff: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/get-all-staff`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch staff');
      }
      const data = await response.json();
      set({ staff: data.data as StaffUser[], isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  // --- NEW: updateStaffStatus ---
  updateStaffStatus: async (userId: string, isActive: boolean) => {
    // Optimistically update local state so the UI responds immediately.
    const prevStaff = get().staff;
    set((state) => ({
      staff: state.staff.map((s) => (s._id === userId ? { ...s, isActive } : s)),
    }));

    try {
      const response = await fetch(`${VITE_API_URL}/api/users/update-staff-status/${userId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
      // Server will also emit socket event; keep optimistic change as-is.
    } catch (err: any) {
      console.error(err);
      // Revert to previous state on failure
      set({ staff: prevStaff, error: err.message });
    }
  },

  // --- NEW: initializeSocket ---
  initializeSocket: () => {
    // Prevent multiple connections
    if (get().socket) return;

    const newSocket = io(VITE_API_URL, {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket.io connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    // This is the real-time magic
    newSocket.on('staffUpdated', (data: { action: 'create' | 'update' | 'delete'; user: StaffUser }) => {
      const { action, user } = data;
      
      set((state) => {
        let newStaffList = [...state.staff];
        
        if (action === 'create') {
          // Add new user if they don't already exist
          if (!newStaffList.find(s => s._id === user._id)) {
            newStaffList.push(user);
          }
        } else if (action === 'update') {
          // Find and replace the updated user
          newStaffList = newStaffList.map(s => s._id === user._id ? user : s);
        } else if (action === 'delete') {
          // Filter out the deleted user
          newStaffList = newStaffList.filter(s => s._id !== user._id);
        }
        
        return { staff: newStaffList };
      });
    });

    set({ socket: newSocket });
  },

  // --- NEW: disconnectSocket ---
  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));