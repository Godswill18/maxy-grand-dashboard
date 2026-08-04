// src/store/useRoomTypeV2Store.ts
// New two-level room model: RoomTypeV2 (sellable category) + RoomUnit
// (physical inventory). Coexists with useRoomStore.ts (legacy) — nothing
// here touches the legacy /api/rooms/* endpoints.
import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { socket } from '../lib/socket';

export interface RoomTypeV2 {
  _id: string;
  hotelId: { _id: string; name: string } | string;
  name: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  bedConfig?: string;
  amenities: string[];
  images: string[];
  // Deprecated — superseded by categoryTag below. Kept readable, no longer
  // written by create/edit forms. RoomCategory folded into this model.
  categoryId?: string | null;
  categoryTag?: string | null;
  slug?: string | null;
  isBookable: boolean;
  unitCount?: number;
  activeUnitCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomUnit {
  _id: string;
  hotelId: string;
  roomTypeId: string | { _id: string; name: string; basePrice?: number };
  roomNumber: string;
  floor?: number;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  isActive: boolean;
  lastCleaned?: string;
  currentGuest?: string | null;
  currentBookingId?: string | null;
  currentGuestName?: string | null;
  checkOutAt?: string | null;
  checkedInAt?: string | null;
  maintenanceReason?: string | null;
  // Stayover housekeeping — guest still checked in, cleaning happening
  // during the stay. Only meaningful while status is 'occupied'; distinct
  // from status 'cleaning', which is vacant post-checkout turnover.
  housekeepingInProgress?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoomTypeV2State {
  roomTypes: RoomTypeV2[];
  currentRoomType: (RoomTypeV2 & { units?: RoomUnit[] }) | null;
  units: RoomUnit[];
  unitsBoard: RoomUnit[];
  isLoading: boolean;
  isBoardLoading: boolean;
  error: string | null;
  isCreateModalOpen: boolean;
  isAddUnitModalOpen: boolean;

  openCreateModal: () => void;
  closeCreateModal: () => void;
  openAddUnitModal: () => void;
  closeAddUnitModal: () => void;

  fetchRoomTypesByHotel: (hotelId: string) => Promise<void>;
  fetchAllRoomTypes: () => Promise<void>;
  fetchRoomTypeById: (id: string) => Promise<void>;
  createRoomType: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  updateRoomType: (id: string, data: Partial<RoomTypeV2>) => Promise<{ success: boolean; error?: string }>;
  deleteRoomType: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleRoomTypeBookable: (id: string) => Promise<{ success: boolean; error?: string }>;
  addRoomTypeImages: (id: string, formData: FormData) => Promise<{ success: boolean; error?: string }>;
  deleteRoomTypeImage: (id: string, imagePath: string) => Promise<{ success: boolean; error?: string }>;
  replaceRoomTypeImage: (id: string, oldImagePath: string, file: File) => Promise<{ success: boolean; error?: string }>;

  addRoomUnit: (roomTypeId: string, data: { roomNumber: string; floor?: number }) => Promise<{ success: boolean; error?: string }>;
  updateRoomUnit: (unitId: string, data: Partial<Pick<RoomUnit, 'roomNumber' | 'floor' | 'isActive'>>) => Promise<{ success: boolean; error?: string }>;
  reassignRoomUnitCategory: (unitId: string, newRoomTypeId: string) => Promise<{ success: boolean; error?: string }>;
  updateRoomUnitStatus: (unitId: string, status: RoomUnit['status'], maintenanceReason?: string) => Promise<{ success: boolean; error?: string }>;
  toggleHousekeeping: (unitId: string, inProgress: boolean) => Promise<{ success: boolean; error?: string; alreadyQueued?: boolean }>;
  deleteRoomUnit: (unitId: string) => Promise<{ success: boolean; error?: string }>;

  // --- Rooms status board (hotel-wide, grouped client-side by category) ---
  fetchUnitsBoard: (hotelId?: string, opts?: { silent?: boolean }) => Promise<void>;
  checkInAndAssignRoom: (
    bookingId: string,
    unitId?: string,
    guestDetails?: Record<string, any>,
    preferences?: Record<string, any>
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  checkOutRoom: (bookingId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  reassignRoom: (
    bookingId: string,
    unitId: string,
    reason: 'upgrade' | 'downgrade' | 'lateral' | 'other',
    note?: string
  ) => Promise<{ success: boolean; data?: any; error?: string }>;
  extendStay: (
    bookingId: string,
    additionalNights: number,
    amountCollected: number,
    paymentNote?: string
  ) => Promise<{ success: boolean; data?: any; error?: string; message?: string }>;
  initRoomUnitSocketListeners: () => void;
  closeRoomUnitSocketListeners: () => void;
}

// Module-level handler ref so closeRoomUnitSocketListeners only removes THIS
// store's handler (preserves other stores' listeners on the shared socket).
let _rtuUpdatedHandler: ((unit: RoomUnit) => void) | null = null;

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useRoomTypeV2Store = create<RoomTypeV2State>((set, get) => ({
  roomTypes: [],
  currentRoomType: null,
  units: [],
  unitsBoard: [],
  isLoading: false,
  isBoardLoading: false,
  error: null,
  isCreateModalOpen: false,
  isAddUnitModalOpen: false,

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  openAddUnitModal: () => set({ isAddUnitModalOpen: true }),
  closeAddUnitModal: () => set({ isAddUnitModalOpen: false }),

  fetchRoomTypesByHotel: async (hotelId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/room-types-v2/by-hotel/${hotelId}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set({ roomTypes: res.data.data, isLoading: false });
    } catch (err) {
      set({ error: (err as AxiosError).message, isLoading: false });
    }
  },

  fetchAllRoomTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/room-types-v2/all`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set({ roomTypes: res.data.data, isLoading: false });
    } catch (err) {
      set({ error: (err as AxiosError).message, isLoading: false });
    }
  },

  fetchRoomTypeById: async (id: string) => {
    set({ isLoading: true, error: null, currentRoomType: null, units: [] });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/room-types-v2/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      const data = res.data.data;
      set({ currentRoomType: data, units: data.units || [], isLoading: false });
    } catch (err) {
      set({ error: (err as AxiosError).message, isLoading: false });
    }
  },

  createRoomType: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${VITE_API_URL}/api/room-types-v2/create`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
        withCredentials: true,
      });
      const created = res.data.data;
      set((state) => ({ roomTypes: [...state.roomTypes, created], isLoading: false }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateRoomType: async (id, data) => {
    try {
      const res = await axios.put(`${VITE_API_URL}/api/room-types-v2/${id}`, data, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      const updated = res.data.data;
      set((state) => ({
        roomTypes: state.roomTypes.map((rt) => (rt._id === id ? { ...rt, ...updated } : rt)),
        currentRoomType: state.currentRoomType?._id === id ? { ...state.currentRoomType, ...updated } : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  deleteRoomType: async (id) => {
    try {
      await axios.delete(`${VITE_API_URL}/api/room-types-v2/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set((state) => ({ roomTypes: state.roomTypes.filter((rt) => rt._id !== id) }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  toggleRoomTypeBookable: async (id) => {
    try {
      const res = await axios.patch(`${VITE_API_URL}/api/room-types-v2/${id}/toggle-bookable`, {}, {
        headers: authHeaders(),
        withCredentials: true,
      });
      const updated = res.data.data;
      set((state) => ({
        roomTypes: state.roomTypes.map((rt) => (rt._id === id ? { ...rt, ...updated } : rt)),
        currentRoomType: state.currentRoomType?._id === id ? { ...state.currentRoomType, ...updated } : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  addRoomTypeImages: async (id, formData) => {
    try {
      const res = await axios.post(`${VITE_API_URL}/api/room-types-v2/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
        withCredentials: true,
      });
      const updated = res.data.data;
      set((state) => ({
        currentRoomType: state.currentRoomType?._id === id ? { ...state.currentRoomType, ...updated } : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  deleteRoomTypeImage: async (id, imagePath) => {
    try {
      const res = await axios.patch(`${VITE_API_URL}/api/room-types-v2/${id}/images/delete`, { imagePath }, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      const updated = res.data.data;
      set((state) => ({
        currentRoomType: state.currentRoomType?._id === id ? { ...state.currentRoomType, ...updated } : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  replaceRoomTypeImage: async (id, oldImagePath, file) => {
    try {
      const formData = new FormData();
      formData.append('oldImagePath', oldImagePath);
      formData.append('image', file);
      const res = await axios.patch(`${VITE_API_URL}/api/room-types-v2/${id}/images/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...authHeaders() },
        withCredentials: true,
      });
      const updated = res.data.data;
      set((state) => ({
        currentRoomType: state.currentRoomType?._id === id ? { ...state.currentRoomType, ...updated } : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  addRoomUnit: async (roomTypeId, data) => {
    try {
      const res = await axios.post(`${VITE_API_URL}/api/room-types-v2/${roomTypeId}/units`, data, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      const unit = res.data.data as RoomUnit;
      set((state) => ({
        units: [...state.units, unit].sort((a, b) => a.roomNumber.localeCompare(b.roomNumber)),
        currentRoomType: state.currentRoomType
          ? { ...state.currentRoomType, unitCount: (state.currentRoomType.unitCount || 0) + 1 }
          : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  updateRoomUnit: async (unitId, data) => {
    try {
      const res = await axios.put(`${VITE_API_URL}/api/room-types-v2/units/${unitId}`, data, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      const updated = res.data.data as RoomUnit;
      set((state) => ({ units: state.units.map((u) => (u._id === unitId ? updated : u)) }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  reassignRoomUnitCategory: async (unitId, newRoomTypeId) => {
    try {
      await axios.patch(`${VITE_API_URL}/api/room-types-v2/units/${unitId}/reassign-category`, { roomTypeId: newRoomTypeId }, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      // Unit moves OUT of the category currently being viewed — remove it,
      // same local patch shape as deleteRoomUnit (not an in-place update
      // like updateRoomUnit, since it no longer belongs on this page).
      set((state) => ({
        units: state.units.filter((u) => u._id !== unitId),
        currentRoomType: state.currentRoomType
          ? { ...state.currentRoomType, unitCount: Math.max(0, (state.currentRoomType.unitCount || 1) - 1) }
          : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  updateRoomUnitStatus: async (unitId, status, maintenanceReason) => {
    try {
      const res = await axios.patch(`${VITE_API_URL}/api/room-types-v2/units/${unitId}/status`, { status, maintenanceReason }, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      const updated = res.data.data as RoomUnit;
      set((state) => ({
        units: state.units.map((u) => (u._id === unitId ? updated : u)),
        unitsBoard: state.unitsBoard.map((u) => (u._id === unitId ? { ...u, ...updated, roomTypeId: u.roomTypeId } : u)),
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  toggleHousekeeping: async (unitId, inProgress) => {
    try {
      const res = await axios.patch(`${VITE_API_URL}/api/room-types-v2/units/${unitId}/housekeeping`, { inProgress }, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      const updated = res.data.data as RoomUnit;
      set((state) => ({
        units: state.units.map((u) => (u._id === unitId ? updated : u)),
        unitsBoard: state.unitsBoard.map((u) => (u._id === unitId ? { ...u, ...updated, roomTypeId: u.roomTypeId } : u)),
      }));
      return { success: true, alreadyQueued: res.data.alreadyQueued };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  deleteRoomUnit: async (unitId) => {
    try {
      await axios.delete(`${VITE_API_URL}/api/room-types-v2/units/${unitId}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set((state) => ({
        units: state.units.filter((u) => u._id !== unitId),
        currentRoomType: state.currentRoomType
          ? { ...state.currentRoomType, unitCount: Math.max(0, (state.currentRoomType.unitCount || 1) - 1) }
          : state.currentRoomType,
      }));
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  fetchUnitsBoard: async (hotelId, opts) => {
    if (!opts?.silent) set({ isBoardLoading: true, error: null });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/room-types-v2/units/board`, {
        params: hotelId ? { hotelId } : undefined,
        headers: authHeaders(),
        withCredentials: true,
      });
      set({ unitsBoard: res.data.data, isBoardLoading: false });
    } catch (err) {
      const error = err as AxiosError<any>;
      set({ error: error.response?.data?.error || error.message, isBoardLoading: false });
    }
  },

  checkInAndAssignRoom: async (bookingId, unitId, guestDetails, preferences) => {
    try {
      const res = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/check-in-v2`,
        { unitId, guestDetails, preferences },
        { headers: { 'Content-Type': 'application/json', ...authHeaders() }, withCredentials: true }
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  checkOutRoom: async (bookingId) => {
    try {
      const res = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/check-out-v2`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  reassignRoom: async (bookingId, unitId, reason, note) => {
    try {
      const res = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/reassign-room-v2`,
        { unitId, reason, note },
        { headers: { 'Content-Type': 'application/json', ...authHeaders() }, withCredentials: true }
      );
      return { success: true, data: res.data.data };
    } catch (err) {
      const error = err as AxiosError<any>;
      return { success: false, error: error.response?.data?.error || error.message };
    }
  },

  extendStay: async (bookingId, additionalNights, amountCollected, paymentNote) => {
    try {
      const res = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/extend-stay-v2`,
        { additionalNights, amountCollected, paymentNote },
        { headers: { 'Content-Type': 'application/json', ...authHeaders() }, withCredentials: true }
      );
      return { success: true, data: res.data.data, message: res.data.message };
    } catch (err) {
      const error = err as AxiosError<any>;
      // On BLOCKED_CAPACITY, error.response.data.data carries the
      // blocked-night details the caller needs for the reassignment remedy.
      return {
        success: false,
        error: error.response?.data?.error || error.message,
        message: error.response?.data?.message,
        data: error.response?.data?.data,
      };
    }
  },

  // Live board updates — pushed from checkInAndAssignRoom, checkOutRoom, and
  // updateRoomUnitStatus on the backend (io.emitToHotel(..., 'roomUnitUpdated', unit)).
  // Falls back to a 60s poll on the board page itself, same precedent as the
  // legacy RoomReceptionist.tsx board (socket coverage isn't guaranteed complete).
  initRoomUnitSocketListeners: () => {
    if (_rtuUpdatedHandler) socket.off('roomUnitUpdated', _rtuUpdatedHandler);

    _rtuUpdatedHandler = (updatedUnit: RoomUnit) => {
      set((state) => {
        const exists = state.unitsBoard.some((u) => u._id === updatedUnit._id);
        // The socket payload's roomTypeId is a raw ObjectId (not populated).
        // Normally we preserve the already-populated {_id,name} shape already
        // on the board — but if the category actually changed (reassignRoomUnitCategory),
        // the old populated object is now WRONG, not just unpopulated, so it
        // must not be kept. Trust the incoming id in that case; the board's
        // next full fetch re-populates it with the new category's name.
        const existing = state.unitsBoard.find((u) => u._id === updatedUnit._id);
        const existingCategoryId = typeof existing?.roomTypeId === 'object' ? existing.roomTypeId._id : existing?.roomTypeId;
        const categoryChanged = existingCategoryId && existingCategoryId !== updatedUnit.roomTypeId;
        const merged = { ...updatedUnit, roomTypeId: !categoryChanged && existing?.roomTypeId ? existing.roomTypeId : updatedUnit.roomTypeId };
        return {
          unitsBoard: exists
            ? state.unitsBoard.map((u) => (u._id === updatedUnit._id ? merged : u))
            : [...state.unitsBoard, merged],
        };
      });
    };

    socket.on('roomUnitUpdated', _rtuUpdatedHandler);
  },

  closeRoomUnitSocketListeners: () => {
    if (_rtuUpdatedHandler) socket.off('roomUnitUpdated', _rtuUpdatedHandler);
    _rtuUpdatedHandler = null;
  },
}));
