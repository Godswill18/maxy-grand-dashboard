// ✅ ENHANCED: useStaffStore.ts with current user support for notifications

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// --- Types ---
export interface StaffUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  hotelId?: {
    _id: string;
    name: string;
  } | null;
  bankName?: string;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface GuestUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface StaffState {
  admins: AdminUser[];
  staff: StaffUser[];
  guests: GuestUser[];
  currentUser: StaffUser | GuestUser | AdminUser | null; // ✅ NEW: Current logged-in user
  socket: Socket | null;
  isLoading: boolean;
  error: string | null;
  fetchAdmins: () => Promise<void>;
  fetchAllStaff: () => Promise<void>;
  fetchGuests: () => Promise<void>;
  updateStaffStatus: (userId: string, isActive: boolean) => Promise<void>;
  updateStaffRole: (userId: string, newRole: string) => Promise<void>;
  getUserById: (userId: string) => Promise<StaffUser | GuestUser | null>;
  setCurrentUser: (user: StaffUser | GuestUser | AdminUser | null) => void; // ✅ NEW
  initializeSocket: () => void;
  disconnectSocket: () => void;
}

const VITE_API_URL =
  (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useStaffStore = create<StaffState>((set, get) => ({
  admins: [],
  staff: [],
  guests: [],
  currentUser: null, // ✅ NEW
  socket: null,
  isLoading: false,
  error: null,

  // ✅ NEW: Set current user
  setCurrentUser: (user) => {
    set({ currentUser: user });
    
    // Also save to localStorage for persistence
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  },

  fetchAdmins: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/admins`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch admins');
      }

      const data = await response.json();
      set({ admins: data.data as AdminUser[], isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

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

  fetchGuests: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/get-all-guests`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch guests');
      }
      const data = await response.json();
      set({ guests: data.data as GuestUser[], isLoading: false });
    } catch (err: any) {
      console.error('Fetch guests error:', err);
      set({ isLoading: false, error: err.message });
    }
  },

  getUserById: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/get-user/${userId}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch user');
      }

      const data = await response.json();
      set({ isLoading: false });
      return data.data as StaffUser | GuestUser;
    } catch (err: any) {
      console.error('getUserById error:', err);
      set({ isLoading: false, error: err.message });
      return null;
    }
  },

  updateStaffStatus: async (userId: string, isActive: boolean) => {
    const prevStaff = get().staff;
    set((state) => ({
      staff: state.staff.map((s) =>
        s._id === userId ? { ...s, isActive } : s
      ),
    }));

    try {
      const response = await fetch(
        `${VITE_API_URL}/api/users/update-staff-status/${userId}`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }
    } catch (err: any) {
      console.error(err);
      set({ staff: prevStaff, error: err.message });
    }
  },

  updateStaffRole: async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/update-staff-role/${userId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update staff role");
      }

      const data = await response.json();

      set((state) => ({
        staff: state.staff.map((s) =>
          s._id === userId ? { ...s, role: data.data.role } : s
        ),
      }));
    } catch (err: any) {
      console.error("Error updating staff role:", err.message);
      set({ error: err.message });
    }
  },

  initializeSocket: () => {
    if (get().socket) return;
    const newSocket = io(VITE_API_URL, { withCredentials: true });

    newSocket.on('connect', () => {
      console.log('Socket.io connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    newSocket.on(
      'staffUpdated',
      (data: { action: 'create' | 'update' | 'delete'; user: StaffUser }) => {
        const { action, user } = data;
        set((state) => {
          let newStaffList = [...state.staff];
          if (action === 'create') {
            if (!newStaffList.find((s) => s._id === user._id)) {
              newStaffList.push(user);
            }
          } else if (action === 'update') {
            newStaffList = newStaffList.map((s) =>
              s._id === user._id ? user : s
            );
          } else if (action === 'delete') {
            newStaffList = newStaffList.filter((s) => s._id !== user._id);
          }
          return { staff: newStaffList };
        });
      }
    );

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
}));

// ✅ Helper function to initialize current user from localStorage on app load
export const initializeCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      useStaffStore.getState().setCurrentUser(user);
    }
  } catch (error) {
    console.error('Error initializing current user:', error);
  }
};