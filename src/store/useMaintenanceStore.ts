import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { socket } from '../lib/socket';
import { useAuthStore } from './useAuthStore';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getToken = () => localStorage.getItem('token');
const authHeaders = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export type IssueType =
  | 'Plumbing' | 'Electrical' | 'Furniture' | 'Air Conditioning' | 'Internet'
  | 'Television' | 'Water Supply' | 'Door/Lock' | 'Bathroom'
  | 'Cleaning Complaint' | 'Noise Complaint' | 'Other';

export type MaintenanceStatus = 'Open' | 'Assigned' | 'In Progress' | 'Awaiting Parts' | 'On Hold' | 'Resolved' | 'Closed';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';

interface RoomUnitRef {
  _id: string;
  roomNumber: string;
  floor?: number;
  roomTypeId?: { _id: string; name: string; categoryTag?: string | null } | null;
}

interface StaffRef {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role?: string;
}

export interface MaintenanceRequest {
  _id: string;
  hotelId: { _id: string; name: string } | string;
  roomUnitId: RoomUnitRef | null;
  issueType: IssueType;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  attachments: { url: string; key: string; mimetype?: string; originalname?: string; kind?: 'photo' | 'video' | 'document' }[];
  raisedBy: StaffRef | null;
  resolution: { resolvedBy: StaffRef | null; resolvedAt: string | null; notes: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceAuditLogEntry {
  _id: string;
  maintenanceRequestId: string;
  hotelId: string;
  eventType: 'request_created' | 'status_changed' | 'priority_changed' | 'resolved' | 'reopened' | 'updated';
  description: string;
  actorType: 'staff' | 'system';
  performedByName: string | null;
  performedByRole: string | null;
  performedByBranch: string | null;
  changes: { field: string; from: any; to: any }[];
  createdAt: string;
}

export interface RoomHistoryEntry {
  type: 'cleaning' | 'maintenance';
  _id: string;
  summary: string;
  status: string;
  raisedAt: string;
  raisedBy: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface MaintenanceSummary {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  criticalActive: number;
  overdueCount: number;
  avgResolutionHours: number;
  trend: { date: string; count: number }[];
  recentActivity: MaintenanceAuditLogEntry[];
  recentlyResolved: MaintenanceRequest[];
  byBranch: { hotelId: string; hotelName: string; total: number; open: number }[] | null;
}

export interface MaintenanceFilters {
  hotelId?: string;
  roomUnitId?: string;
  roomNumber?: string;
  roomCategory?: string;
  issueType?: string;
  priority?: string;
  status?: string;
  raisedBy?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface MaintenanceState {
  requests: MaintenanceRequest[];
  isLoading: boolean;
  error: string | null;

  auditLog: MaintenanceAuditLogEntry[];
  auditLogPage: number;
  auditLogTotalPages: number;
  auditLogSort: 'newest' | 'oldest';
  isLoadingAuditLog: boolean;

  roomHistory: { roomNumber: string; timeline: RoomHistoryEntry[] } | null;
  isLoadingRoomHistory: boolean;

  summary: MaintenanceSummary | null;
  isLoadingSummary: boolean;

  fetchRequests: (filters?: MaintenanceFilters) => Promise<void>;
  fetchSummary: (hotelId?: string) => Promise<void>;
  createRequest: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  updateStatus: (id: string, status: MaintenanceStatus, resolutionNotes?: string) => Promise<{ success: boolean; error?: string }>;
  updatePriority: (id: string, priority: MaintenancePriority) => Promise<{ success: boolean; error?: string }>;
  updateRequest: (id: string, data: { title?: string; description?: string; issueType?: IssueType }) => Promise<{ success: boolean; error?: string }>;
  fetchAuditLog: (id: string, page?: number, sort?: 'newest' | 'oldest') => Promise<void>;
  setAuditLogSort: (sort: 'newest' | 'oldest') => void;
  fetchRoomHistory: (roomUnitId: string) => Promise<void>;
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

let _mtConnectHandler: (() => void) | null = null;
let _mtUpdateHandler: ((requests: MaintenanceRequest[]) => void) | null = null;
let _mtSummaryDebounce: ReturnType<typeof setTimeout> | null = null;

export const useMaintenanceStore = create<MaintenanceState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  auditLog: [],
  auditLogPage: 1,
  auditLogTotalPages: 1,
  auditLogSort: 'newest',
  isLoadingAuditLog: false,

  roomHistory: null,
  isLoadingRoomHistory: false,

  summary: null,
  isLoadingSummary: false,

  fetchRequests: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/maintenance`, {
        params: filters,
        headers: authHeaders(),
        withCredentials: true,
      });
      set({ requests: res.data.data, isLoading: false });
    } catch (err) {
      const error = err as AxiosError<any>;
      set({ error: error.response?.data?.error || error.message, isLoading: false });
      toast.error(error.response?.data?.error || 'Failed to fetch maintenance requests');
    }
  },

  createRequest: async (formData: FormData) => {
    try {
      await axios.post(`${VITE_API_URL}/api/maintenance`, formData, {
        headers: { ...authHeaders() }, // Content-Type left to axios/browser for multipart boundary
        withCredentials: true,
      });
      toast.success('Request submitted successfully');
      await get().fetchRequests();
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to submit request';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  updateStatus: async (id, status, resolutionNotes) => {
    try {
      await axios.patch(
        `${VITE_API_URL}/api/maintenance/${id}/status`,
        { status, resolutionNotes },
        { headers: { 'Content-Type': 'application/json', ...authHeaders() }, withCredentials: true }
      );
      toast.success(`Status updated to ${status}`);
      await get().fetchRequests();
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to update status';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  updatePriority: async (id, priority) => {
    try {
      await axios.patch(
        `${VITE_API_URL}/api/maintenance/${id}/priority`,
        { priority },
        { headers: { 'Content-Type': 'application/json', ...authHeaders() }, withCredentials: true }
      );
      toast.success(`Priority updated to ${priority}`);
      await get().fetchRequests();
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to update priority';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  updateRequest: async (id, data) => {
    try {
      await axios.patch(`${VITE_API_URL}/api/maintenance/${id}`, data, {
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        withCredentials: true,
      });
      toast.success('Request updated');
      await get().fetchRequests();
      return { success: true };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to update request';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  fetchAuditLog: async (id, page = 1, sort) => {
    const resolvedSort = sort ?? get().auditLogSort;
    set({ isLoadingAuditLog: true, auditLogSort: resolvedSort });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/maintenance/${id}/audit-log`, {
        params: { page, limit: 20, sort: resolvedSort },
        headers: authHeaders(),
        withCredentials: true,
      });
      set({
        auditLog: res.data.data,
        auditLogPage: res.data.page,
        auditLogTotalPages: res.data.totalPages,
        isLoadingAuditLog: false,
      });
    } catch (err) {
      const error = err as AxiosError<any>;
      set({ isLoadingAuditLog: false });
      toast.error(error.response?.data?.error || 'Failed to load activity log');
    }
  },

  setAuditLogSort: (sort) => set({ auditLogSort: sort }),

  fetchSummary: async (hotelId) => {
    set({ isLoadingSummary: true });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/maintenance/summary`, {
        params: { hotelId, days: 14 },
        headers: authHeaders(),
        withCredentials: true,
      });
      set({ summary: res.data.data, isLoadingSummary: false });
    } catch (err) {
      const error = err as AxiosError<any>;
      set({ isLoadingSummary: false });
      toast.error(error.response?.data?.error || 'Failed to load maintenance summary');
    }
  },

  fetchRoomHistory: async (roomUnitId: string) => {
    set({ isLoadingRoomHistory: true });
    try {
      const res = await axios.get(`${VITE_API_URL}/api/maintenance/room-history/${roomUnitId}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set({ roomHistory: res.data.data, isLoadingRoomHistory: false });
    } catch (err) {
      const error = err as AxiosError<any>;
      set({ isLoadingRoomHistory: false });
      toast.error(error.response?.data?.error || 'Failed to load room history');
    }
  },

  // Same join_hotel pattern as useHousekeepingStore.ts — superadmin (no
  // single hotelId) gets fetch-on-mount data only, no live push. A known,
  // accepted limitation shared with the Housekeeping dashboard.
  initSocketListeners: () => {
    const hotelId = useAuthStore.getState().user?.hotelId;
    if (!hotelId) return;

    if (_mtConnectHandler) socket.off('connect', _mtConnectHandler);
    _mtConnectHandler = () => socket.emit('join_hotel', hotelId);
    socket.on('connect', _mtConnectHandler);
    if (socket.connected) socket.emit('join_hotel', hotelId);

    if (_mtUpdateHandler) socket.off('maintenance:update', _mtUpdateHandler);
    _mtUpdateHandler = (requests) => {
      set({ requests });
      // Debounced — a burst of mutations (e.g. bulk status changes) should
      // trigger one summary refetch, not one per event.
      if (_mtSummaryDebounce) clearTimeout(_mtSummaryDebounce);
      _mtSummaryDebounce = setTimeout(() => {
        get().fetchSummary(useAuthStore.getState().user?.hotelId);
      }, 1500);
    };
    socket.on('maintenance:update', _mtUpdateHandler);
  },

  closeSocketListeners: () => {
    if (_mtConnectHandler) socket.off('connect', _mtConnectHandler);
    if (_mtUpdateHandler) socket.off('maintenance:update', _mtUpdateHandler);
    if (_mtSummaryDebounce) clearTimeout(_mtSummaryDebounce);
    _mtConnectHandler = null;
    _mtUpdateHandler = null;
    _mtSummaryDebounce = null;
  },
}));
