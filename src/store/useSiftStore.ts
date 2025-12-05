import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Types
export interface ShiftData {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  hotelId: {
    _id: string;
    name: string;
  };
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  shiftType: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  isActive: boolean;
  notes?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  emergencyActivated?: boolean;
  emergencyActivatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  emergencyActivatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShiftData {
  userId: string;
  hotelId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  shiftType?: string;
  notes?: string;
}

interface ShiftStore {
  shifts: ShiftData[];
  mySchedule: ShiftData[];
  socket: Socket | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchShifts: (filters?: any) => Promise<void>;
  fetchMySchedule: (filters?: any) => Promise<void>;
  createShift: (data: CreateShiftData) => Promise<void>;
  updateShift: (shiftId: string, data: Partial<CreateShiftData>) => Promise<void>;
  deleteShift: (shiftId: string) => Promise<void>;
  
  // ✅ NEW: Emergency activation
  activateShift: (shiftId: string) => Promise<void>;
  deactivateShift: (shiftId: string) => Promise<void>;
  
  // Socket
  initializeSocket: () => void;
  disconnectSocket: () => void;
}

export const useShiftStore = create<ShiftStore>((set, get) => ({
  shifts: [],
  mySchedule: [],
  socket: null,
  isLoading: false,
  error: null,

  fetchShifts: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.hotelId) params.append('hotelId', filters.hotelId);

      const response = await fetch(`${VITE_API_URL}/api/shifts?${params}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch shifts');
      }

      const data = await response.json();
      set({ shifts: data.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      console.error('Fetch shifts error:', err);
    }
  },

  fetchMySchedule: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`${VITE_API_URL}/api/shifts/my-schedule?${params}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch schedule');
      }

      const data = await response.json();
      set({ mySchedule: data.data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      console.error('Fetch schedule error:', err);
    }
  },

  createShift: async (shiftData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/shifts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create shift');
      }

      const data = await response.json();
      
      // Check for duplicates before adding
      set((state) => {
        const exists = state.shifts.some(shift => shift._id === data.data._id);
        if (exists) {
          return { isLoading: false };
        }
        return {
          shifts: [...state.shifts, data.data],
          isLoading: false,
        };
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateShift: async (shiftId, shiftData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/shifts/${shiftId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update shift');
      }

      const data = await response.json();
      
      set((state) => ({
        shifts: state.shifts.map((shift) =>
          shift._id === shiftId ? data.data : shift
        ),
        mySchedule: state.mySchedule.map((shift) =>
          shift._id === shiftId ? data.data : shift
        ),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteShift: async (shiftId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/shifts/${shiftId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete shift');
      }

      set((state) => ({
        shifts: state.shifts.filter((shift) => shift._id !== shiftId),
        mySchedule: state.mySchedule.filter((shift) => shift._id !== shiftId),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // ✅ NEW: Emergency activate shift
  activateShift: async (shiftId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/shifts/${shiftId}/activate`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate shift');
      }

      const data = await response.json();
      
      set((state) => ({
        shifts: state.shifts.map((shift) =>
          shift._id === shiftId ? data.data : shift
        ),
        mySchedule: state.mySchedule.map((shift) =>
          shift._id === shiftId ? data.data : shift
        ),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  // ✅ NEW: Deactivate emergency shift
  deactivateShift: async (shiftId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${VITE_API_URL}/api/shifts/${shiftId}/deactivate`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deactivate shift');
      }

      const data = await response.json();
      
      set((state) => ({
        shifts: state.shifts.map((shift) =>
          shift._id === shiftId ? data.data : shift
        ),
        mySchedule: state.mySchedule.map((shift) =>
          shift._id === shiftId ? data.data : shift
        ),
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  initializeSocket: () => {
    if (get().socket) return;

    const newSocket = io(VITE_API_URL, { withCredentials: true });

    newSocket.on('connect', () => {
      console.log('Shift Socket.io connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Shift Socket.io disconnected');
    });

    // Handle shift events with duplicate checking
    newSocket.on('shiftCreated', (data: { shift: ShiftData }) => {
      console.log('Socket: Shift created', data.shift._id);
      
      set((state) => {
        const exists = state.shifts.some(shift => shift._id === data.shift._id);
        if (exists) {
          console.log('Shift already exists, skipping duplicate:', data.shift._id);
          return state;
        }

        console.log('Adding new shift to state:', data.shift._id);
        return {
          shifts: [...state.shifts, data.shift],
        };
      });
    });

    newSocket.on('shiftUpdated', (data: { shift: ShiftData }) => {
      console.log('Socket: Shift updated', data.shift._id);
      
      set((state) => ({
        shifts: state.shifts.map((shift) =>
          shift._id === data.shift._id ? data.shift : shift
        ),
        mySchedule: state.mySchedule.map((shift) =>
          shift._id === data.shift._id ? data.shift : shift
        ),
      }));
    });

    // ✅ NEW: Handle shift activation
    newSocket.on('shift:activated', (data: ShiftData) => {
      console.log('Socket: Shift activated', data._id);
      
      set((state) => ({
        shifts: state.shifts.map((shift) =>
          shift._id === data._id ? data : shift
        ),
        mySchedule: state.mySchedule.map((shift) =>
          shift._id === data._id ? data : shift
        ),
      }));
    });

    // ✅ NEW: Handle shift deactivation
    newSocket.on('shift:deactivated', (data: ShiftData) => {
      console.log('Socket: Shift deactivated', data._id);
      
      set((state) => ({
        shifts: state.shifts.map((shift) =>
          shift._id === data._id ? data : shift
        ),
        mySchedule: state.mySchedule.map((shift) =>
          shift._id === data._id ? data : shift
        ),
      }));
    });

    newSocket.on('shiftDeleted', (data: { shiftId: string }) => {
      console.log('Socket: Shift deleted', data.shiftId);
      
      set((state) => ({
        shifts: state.shifts.filter((shift) => shift._id !== data.shiftId),
        mySchedule: state.mySchedule.filter((shift) => shift._id !== data.shiftId),
      }));
    });

    // User status updated (from cron job)
    newSocket.on('userStatusUpdated', (data: { userId: string; isActive: boolean }) => {
      console.log('Socket: User status updated', data);
    });

    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));