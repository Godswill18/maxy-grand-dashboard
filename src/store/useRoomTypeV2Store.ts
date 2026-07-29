// src/store/useRoomTypeV2Store.ts
// New two-level room model: RoomTypeV2 (sellable category) + RoomUnit
// (physical inventory). Coexists with useRoomStore.ts (legacy) — nothing
// here touches the legacy /api/rooms/* endpoints.
import { create } from 'zustand';
import axios, { AxiosError } from 'axios';

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
  categoryId?: string | null;
  isBookable: boolean;
  unitCount?: number;
  activeUnitCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomUnit {
  _id: string;
  hotelId: string;
  roomTypeId: string;
  roomNumber: string;
  floor?: number;
  status: 'ready' | 'occupied' | 'cleaning-required' | 'being-cleaned' | 'maintenance' | 'out-of-service';
  isActive: boolean;
  lastCleaned?: string;
  currentGuest?: string | null;
  currentBookingId?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RoomTypeV2State {
  roomTypes: RoomTypeV2[];
  currentRoomType: (RoomTypeV2 & { units?: RoomUnit[] }) | null;
  units: RoomUnit[];
  isLoading: boolean;
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
  updateRoomUnitStatus: (unitId: string, status: RoomUnit['status']) => Promise<{ success: boolean; error?: string }>;
  deleteRoomUnit: (unitId: string) => Promise<{ success: boolean; error?: string }>;
}

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
  isLoading: false,
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

  updateRoomUnitStatus: async (unitId, status) => {
    try {
      const res = await axios.patch(`${VITE_API_URL}/api/room-types-v2/units/${unitId}/status`, { status }, {
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
}));
