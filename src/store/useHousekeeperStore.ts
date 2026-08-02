import { create } from 'zustand';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';
import { socket } from '../lib/socket';


// Define types based on your backend response
interface RoomType {
  _id: string;
  name: string;
  categoryTag?: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  status: string;
  roomTypeId: RoomType;
}

interface Hotel {
  _id: string;
  name: string;
}

interface BookingRef {
  _id: string;
  guestName?: string;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface CleaningTask {
  _id: string;
  hotelId?: string | Hotel;
  // Exactly one of roomId (legacy)/roomUnitId (v2) is populated, same
  // dual-shape convention used throughout the rest of the app.
  roomId?: Room | null;
  roomUnitId?: Room | null;
  // Only set for checkout-triggered tasks — the guest whose stay ended.
  bookingId?: BookingRef | null;
  requestType?: 'checkout' | 'guest-request' | 'manual';
  assignedCleaner: string | User | null;
  requestedBy: User;
  status: 'pending' | 'in-progress' | 'completed';
  priority?: 'High' | 'Medium' | 'Low';
  estimatedDuration?: string;
  startTime?: string;
  finishTime?: string;
  actualDuration?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface HousekeeperState {
  tasks: CleaningTask[];
  // Pool of pending, not-yet-accepted requests for this hotel — a cleaner
  // must actively accept one before it shows up in `tasks`. Without this,
  // checkout-triggered requests (created unassigned, per the "housekeeper
  // accepts task" workflow) were only ever actionable via a manager
  // assigning them on the Housekeeping dashboard.
  unassignedTasks: CleaningTask[];
  isLoading: boolean;
  error: string | null;
  fetchMyTasks: () => Promise<void>;
  fetchUnassignedTasks: () => Promise<void>;
  acceptTask: (taskId: string) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;

  // NEW: Socket listener management
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Module-level handler refs so closeSocketListeners only removes THIS
// store's handlers (preserves other stores' listeners on the shared socket)
// — same pattern as useRoomTypeV2Store.ts's room-unit socket listeners.
let _cleaningConnectHandler: (() => void) | null = null;
let _cleaningUpdateHandler: ((requests: CleaningTask[]) => void) | null = null;

export const useHousekeeperStore = create<HousekeeperState>((set, get) => ({
  tasks: [],
  unassignedTasks: [],
  isLoading: false,
  error: null,

  fetchMyTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${VITE_API_URL}/api/cleaning/my-tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ tasks: response.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch tasks',
        isLoading: false
      });
    }
  },

  fetchUnassignedTasks: async () => {
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.get(`${VITE_API_URL}/api/cleaning/unassigned`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ unassignedTasks: response.data });
    } catch (error: any) {
      console.error('Failed to fetch unassigned tasks', error);
    }
  },

  acceptTask: async (taskId: string) => {
    try {
      const { token } = useAuthStore.getState();
      await axios.patch(
        `${VITE_API_URL}/api/cleaning/${taskId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      // Refetch both — simpler and safer than reconstructing populated
      // fields (roomUnitId/hotelId/bookingId) from a partial local patch.
      await Promise.all([get().fetchMyTasks(), get().fetchUnassignedTasks()]);
    } catch (error: any) {
      console.error('Failed to accept task', error);
      throw error;
    }
  },

  startTask: async (taskId: string) => {
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.patch(
        `${VITE_API_URL}/api/cleaning/${taskId}/start`, 
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      set((state) => ({
        tasks: state.tasks.map((t) => 
          t._id === taskId ? { ...t, status: 'in-progress', startTime: response.data.request.startTime } : t
        ),
      }));
    } catch (error: any) {
      console.error("Failed to start task", error);
      throw error;
    }
  },

  completeTask: async (taskId: string) => {
    try {
      const { token } = useAuthStore.getState();
      const response = await axios.patch(
        `${VITE_API_URL}/api/cleaning/${taskId}/complete`, 
        {}, 
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      set((state) => ({
        tasks: state.tasks.map((t) => 
          t._id === taskId 
            ? { 
                ...t, 
                status: 'completed', 
                finishTime: response.data.request.finishTime,
                actualDuration: response.data.request.actualDuration 
              } 
            : t
        ),
      }));
    } catch (error: any) {
      console.error("Failed to complete task", error);
      throw error;
    }
  },

  // Socket.io listeners for real-time updates. Without join_hotel, the
  // backend's hotel-scoped cleaning:update broadcast (emitToHotel) never
  // reaches this tab — nothing on any cleaning/housekeeping page emitted
  // it before this fix, so the task list was fetch-on-mount only.
  initSocketListeners: () => {
    const { user } = useAuthStore.getState();
    const hotelId = user?.hotelId;
    if (!hotelId) return;

    if (_cleaningConnectHandler) socket.off('connect', _cleaningConnectHandler);
    _cleaningConnectHandler = () => socket.emit('join_hotel', hotelId);
    socket.on('connect', _cleaningConnectHandler);
    if (socket.connected) socket.emit('join_hotel', hotelId);

    if (_cleaningUpdateHandler) socket.off('cleaning:update', _cleaningUpdateHandler);
    _cleaningUpdateHandler = (requests) => {
      // The broadcast carries every request for the hotel; this store
      // represents both "my tasks" and the unassigned pool this cleaner
      // could accept — split it into both buckets.
      const cleanerId = useAuthStore.getState().user?._id;
      if (!cleanerId) return;
      const myTasks = requests.filter((r) => {
        const cleaner = r.assignedCleaner;
        const assignedId = typeof cleaner === 'string' ? cleaner : cleaner?._id;
        return assignedId === cleanerId;
      });
      const unassigned = requests.filter((r) => r.status === 'pending' && !r.assignedCleaner);
      set({ tasks: myTasks, unassignedTasks: unassigned });
    };
    socket.on('cleaning:update', _cleaningUpdateHandler);
  },

  closeSocketListeners: () => {
    if (_cleaningConnectHandler) socket.off('connect', _cleaningConnectHandler);
    if (_cleaningUpdateHandler) socket.off('cleaning:update', _cleaningUpdateHandler);
    _cleaningConnectHandler = null;
    _cleaningUpdateHandler = null;
  },
}));