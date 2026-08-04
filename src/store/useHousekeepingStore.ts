import { create } from 'zustand';
import { toast } from 'sonner';
import { useAuthStore } from './useAuthStore';
import { socket } from '../lib/socket';

interface RoomTypeInfo {
  name: string;
  categoryTag?: string;
}

interface CleaningRoom {
  _id: string;
  roomNumber: string;
  status: string;
  roomTypeId: RoomTypeInfo;
}

interface StaffRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface HotelRef {
  _id: string;
  name: string;
}

interface BookingRef {
  _id: string;
  guestName?: string;
}

export interface CleaningRequest {
  _id: string;
  hotelId?: string | HotelRef;
  // Exactly one of roomId (legacy)/roomUnitId (v2) is populated.
  roomId?: CleaningRoom | null;
  roomUnitId?: CleaningRoom | null;
  bookingId?: BookingRef | null;
  requestType?: 'checkout' | 'guest-request' | 'manual';
  assignedCleaner: StaffRef | null;
  requestedBy: StaffRef;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority?: 'High' | 'Medium' | 'Low';
  notes?: string;
  estimatedDuration?: string;
  startTime?: string;
  finishTime?: string;
  actualDuration?: number;
  createdAt: string;
  updatedAt: string;
}

interface Cleaner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface HousekeepingState {
  // Unassigned queue — now sourced directly from CleaningRequest (via
  // /api/cleaning/unassigned), not derived from Room.status. The old
  // Room.status-derived approach missed guest-originated requests, which
  // set 'occupied-needs-cleaning' rather than 'cleaning'.
  unassignedRequests: CleaningRequest[];
  allRequests: CleaningRequest[];
  pendingTasks: CleaningRequest[];
  inProgressTasks: CleaningRequest[];
  completedTasks: CleaningRequest[];
  cleaners: Cleaner[];
  fetchUnassignedRequests: () => Promise<void>;
  fetchAllRequests: () => Promise<void>;
  fetchCleaners: () => Promise<void>;
  assignCleanerToRequest: (requestId: string, cleanerId: string) => Promise<void>;
  cancelCleaningRequest: (requestId: string, reason?: string) => Promise<void>;
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

const getToken = () => useAuthStore.getState().token;
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getHotelId = () => useAuthStore.getState().user?.hotelId;

// Module-level handler refs so closeSocketListeners only removes THIS
// store's handlers — same pattern as useHousekeeperStore.ts/useRoomTypeV2Store.ts.
let _hkConnectHandler: (() => void) | null = null;
let _hkUpdateHandler: ((requests: CleaningRequest[]) => void) | null = null;

const bucketRequests = (requests: CleaningRequest[]) => ({
  allRequests: requests,
  pendingTasks: requests.filter((r) => r.status === 'pending' && !!r.assignedCleaner),
  inProgressTasks: requests.filter((r) => r.status === 'in-progress'),
  completedTasks: requests.filter((r) => r.status === 'completed'),
  unassignedRequests: requests.filter((r) => r.status === 'pending' && !r.assignedCleaner),
});

export const useHousekeepingStore = create<HousekeepingState>((set, get) => ({
  unassignedRequests: [],
  allRequests: [],
  pendingTasks: [],
  inProgressTasks: [],
  completedTasks: [],
  cleaners: [],

  fetchUnassignedRequests: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/unassigned`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch unassigned requests');
      const requests = await response.json();
      set({ unassignedRequests: requests });
    } catch (error) {
      toast.error('Failed to fetch unassigned cleaning requests');
      console.error(error);
    }
  },

  fetchAllRequests: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/hotel`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch requests');
      const requests = await response.json();
      // Also derives unassignedRequests from the same payload so both views
      // stay consistent — fetchUnassignedRequests above remains available
      // for a targeted refresh (e.g. after an assign action).
      set(bucketRequests(requests));
    } catch (error) {
      toast.error('Failed to fetch requests');
      console.error(error);
    }
  },

  fetchCleaners: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/cleaners`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch cleaners');
      const cleaners = await response.json();
      set({ cleaners });
    } catch (error) {
      toast.error('Failed to fetch cleaners');
      console.error(error);
    }
  },

  assignCleanerToRequest: async (requestId: string, cleanerId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/${requestId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cleanerId }),
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to assign cleaner');
      }
      toast.success('Cleaner assigned successfully');
      get().fetchAllRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to assign cleaner');
      console.error(error);
    }
  },

  cancelCleaningRequest: async (requestId: string, reason?: string) => {
    try {
      const token = getToken();
      const response = await fetch(`${VITE_API_URL}/api/cleaning/${requestId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
        credentials: 'include',
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to cancel cleaning request');
      }
      toast.success('Cleaning request cancelled');
      get().fetchAllRequests();
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel cleaning request');
      console.error(error);
    }
  },

  // Without join_hotel, the backend's hotel-scoped cleaning:update broadcast
  // never reached this page — nothing on any housekeeping page emitted it
  // before this fix, so the dashboard was fetch-on-mount only.
  initSocketListeners: () => {
    const hotelId = getHotelId();
    if (!hotelId) return;

    if (_hkConnectHandler) socket.off('connect', _hkConnectHandler);
    _hkConnectHandler = () => socket.emit('join_hotel', hotelId);
    socket.on('connect', _hkConnectHandler);
    if (socket.connected) socket.emit('join_hotel', hotelId);

    if (_hkUpdateHandler) socket.off('cleaning:update', _hkUpdateHandler);
    _hkUpdateHandler = (requests) => set(bucketRequests(requests));
    socket.on('cleaning:update', _hkUpdateHandler);
  },

  closeSocketListeners: () => {
    if (_hkConnectHandler) socket.off('connect', _hkConnectHandler);
    if (_hkUpdateHandler) socket.off('cleaning:update', _hkUpdateHandler);
    _hkConnectHandler = null;
    _hkUpdateHandler = null;
  },
}));
