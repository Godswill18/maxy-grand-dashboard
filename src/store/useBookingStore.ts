// src/store/useBookingStore.ts
import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { socket } from '../lib/socket'; // Import the initialized socket
import { toast } from 'sonner';

// Define the shape of your booking data based on the controller
// Includes populated fields
export interface Booking {
  _id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  bookingStatus: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'pending';
  paymentStatus: 'pending' | 'partial' | 'paid';
  hotelId: {
    _id: string;
    name: string;
  };
  // Booked category — the legacy pair (roomTypeId+roomId) or the new v2 pair
  // (roomTypeV2Id+roomUnitId) is set, never both. roomTypeId/roomTypeV2Id is
  // the immutable booked category; roomId/roomUnitId is the assigned
  // physical room, null until staff assign one at check-in.
  roomTypeId?: { _id: string; name?: string; roomNumber?: string } | null;
  roomId?: { _id: string; roomNumber: string } | null;
  roomTypeV2Id?: { _id: string; name: string; basePrice?: number } | null;
  roomUnitId?: { _id: string; roomNumber: string; status?: string } | null;
  createdAt: string;
  guests?: number;
  numberOfGuests?: number;
  specialRequests?: string;
  bookingType?: 'online' | 'walk-in';
  guestDetails?: {
    address?: string;
    city?: string;
    state?: string;
    arrivingFrom?: string;
    nextOfKinName?: string;
    nextOfKinPhone?: string;
  };
  preferences?: {
    extraBedding?: boolean;
    specialRequests?: string;
  };
  amountPaid?: number;
  confirmationCode?: string;
  // Structured payment ledger — replaces the never-actually-populated
  // paymentHistory field this codebase used to reference.
  payments?: PaymentLedgerEntry[];
  outstanding?: number; // present on rows returned by the outstanding-balances endpoints
  overdue?: boolean;
}

export interface PaymentLedgerEntry {
  _id: string;
  type: 'payment' | 'refund' | 'adjustment';
  amount: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'pos' | 'other';
  referenceNumber?: string | null;
  paymentDate: string;
  notes?: string | null;
  recordedBy: string | { _id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface OutstandingSummary {
  totalOutstandingAmount: number;
  outstandingCount: number;
  fullyPaidCount: number;
  partiallyPaidCount: number;
  overdueCount: number;
}

interface Hotel {
  _id: string;
  name: string;
}

export interface AuditLogChange {
  field: string;
  from: any;
  to: any;
}

export interface AuditLogEntry {
  _id: string;
  bookingId: string;
  hotelId: string;
  eventType: string;
  description: string;
  actorType: 'staff' | 'guest' | 'system';
  performedBy: string | null;
  performedByName: string | null;
  performedByRole: string | null;
  performedByBranch: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  changes: AuditLogChange[];
  createdAt: string;
}

const BOOKING_TTL = 2 * 60 * 1000; // 2 minutes

// Define the state and actions for your store
interface BookingState {
  bookings: Booking[];
  hotels: Hotel[];
  currentHotelId: string | null;
  requestId: number;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;             // cache timestamp
  fetchBookings: (hotelId?: string, force?: boolean) => Promise<void>;
  fetchHotels: () => Promise<void>;
  updateBookingStatus: (id: string, bookingStatus: Booking['bookingStatus']) => Promise<void>;
  updateBooking: (id: string, data: any) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  createBooking: (data: any) => Promise<void>;

  // Activity log (audit trail)
  auditLog: AuditLogEntry[];
  auditLogPage: number;
  auditLogTotalPages: number;
  auditLogSort: 'newest' | 'oldest';
  isLoadingAuditLog: boolean;
  fetchBookingAuditLog: (bookingId: string, page?: number, sort?: 'newest' | 'oldest') => Promise<void>;
  setAuditLogSort: (sort: 'newest' | 'oldest') => void;
  exportBookingAuditLog: (bookingId: string, confirmationCode?: string) => Promise<void>;
  refundBooking: (id: string, amount: number, reason: string, notes?: string) => Promise<{ success: boolean; message?: string }>;
  extendStayV2: (
    bookingId: string,
    additionalNights: number,
    amountCollected: number,
    paymentNote?: string
  ) => Promise<{ success: boolean; message?: string; error?: string; data?: any }>;

  // Outstanding Balance Management
  outstandingBookings: Booking[];
  outstandingSummary: OutstandingSummary | null;
  outstandingCurrentHotelId: string | null;
  isLoadingOutstanding: boolean;
  outstandingLastFetched: number | null;
  fetchOutstandingBalances: (hotelId?: string, force?: boolean) => Promise<void>;
  recordPayment: (
    bookingId: string,
    data: { amount: number; method?: string; referenceNumber?: string; paymentDate?: string; notes?: string }
  ) => Promise<{ success: boolean; message?: string }>;
  editPayment: (
    bookingId: string,
    entryId: string,
    data: { amount?: number; method?: string; referenceNumber?: string; paymentDate?: string; notes?: string; reason: string }
  ) => Promise<{ success: boolean; message?: string }>;
  recordAdjustment: (
    bookingId: string,
    data: { amount: number; reason: string; method?: string; referenceNumber?: string; paymentDate?: string }
  ) => Promise<{ success: boolean; message?: string }>;
  exportOutstandingCSV: (bookingIds?: string[]) => Promise<void>;
  exportOutstandingExcel: (bookingIds?: string[]) => Promise<void>;
  exportOutstandingPDF: (bookingIds?: string[]) => Promise<void>;
  exportPaymentReceipt: (bookingId: string, confirmationCode?: string) => Promise<void>;

  // Socket.io listeners
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

// Helper to get auth token
const getToken = () => localStorage.getItem('token');
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Module-level handler refs so closeSocketListeners only removes THIS store's handlers
let _bsCreatedHandler: ((data: Booking) => void) | null = null;
let _bsUpdatedHandler: ((data: Booking) => void) | null = null;
let _bsDeletedHandler: ((id: string) => void) | null = null;

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  hotels: [],
  currentHotelId: null,
  requestId: 0,
  isLoading: false,
  error: null,
  lastFetched: null,

  auditLog: [],
  auditLogPage: 1,
  auditLogTotalPages: 1,
  auditLogSort: 'newest',
  isLoadingAuditLog: false,

  outstandingBookings: [],
  outstandingSummary: null,
  outstandingCurrentHotelId: null,
  isLoadingOutstanding: false,
  outstandingLastFetched: null,

  // --- 1. AXIOS ACTIONS (for initial load and updates) ---

  fetchHotels: async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/hotels/list`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ hotels: response.data });
    } catch (err) {
      const error = err as AxiosError;
      console.error('Failed to fetch hotels:', error.message);
    }
  },

  fetchBookings: async (hotelId?: string, force = false) => {
    const { lastFetched, currentHotelId: prevHotelId, requestId: prevId } = get();
    const hotelChanged = hotelId !== prevHotelId;
    const isFresh = lastFetched && Date.now() - lastFetched < BOOKING_TTL;

    // Skip fetch if data is still fresh, same hotel, and not forced (e.g. by socket event)
    if (isFresh && !force && !hotelChanged) return;

    const myId = prevId + 1;
    set({ isLoading: true, error: null, currentHotelId: hotelId || null, requestId: myId });
    try {
      const token = getToken();
      const params: any = {};
      if (hotelId) {
        params.hotelId = hotelId;
      }
      const response = await axios.get(`${VITE_API_URL}/api/bookings/all`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      // Discard response if a newer request has since been started
      if (get().requestId === myId) {
        const result = response.data;
        // Only update bookings if response is valid — never clear on a malformed payload
        if (result?.success && Array.isArray(result.data)) {
          set({ bookings: result.data, isLoading: false, lastFetched: Date.now() });
        } else {
          set({ isLoading: false });
        }
      }
    } catch (err) {
      if (get().requestId === myId) {
        const error = err as AxiosError;
        set({ error: error.message, isLoading: false });
      }
    }
  },

  updateBookingStatus: async (id: string, bookingStatus: Booking['bookingStatus']) => {
    // We update optimistically via socket, but send the request
    try {
      const token = getToken();
      await axios.patch(
        `${VITE_API_URL}/api/bookings/${id}/status`,
        { bookingStatus }, // Send the new status in the body
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      // Refetch current page/filter after update
      get().fetchBookings(get().currentHotelId || undefined);
      toast.success(`Booking status updated to ${bookingStatus}`);
    } catch (err) {
      const error = err as AxiosError;
      toast.error(`Failed to update booking: ${error.message}`);
    }
  },

  updateBooking: async (id: string, data: any) => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const response = await axios.put(`${VITE_API_URL}/api/bookings/update/${id}`,data,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );
      
      // Refetch bookings after update
      await get().fetchBookings(get().currentHotelId || undefined);
      
      set({ isLoading: false });
      toast.success('Booking updated successfully');
      
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      set({ 
        isLoading: false, 
        error: error.message 
      });
      toast.error(`Failed to update booking: ${ error.message}`);
      throw error;
    }
  },

cancelBooking: async (id: string) => {
  set({ isLoading: true, error: null });
  try {
    const token = getToken();
    
    // ✅ CORRECT: Config is 3rd parameter for axios.patch
    await axios.patch(
      `${VITE_API_URL}/api/bookings/cancel/${id}`,
      {},  // ✅ Empty body (PATCH doesn't need data)
      {    // ✅ Config object as 2nd parameter (after data)
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      }
    );
    
    // Refetch bookings after cancellation
    await get().fetchBookings(get().currentHotelId || undefined);
    
    set({ isLoading: false });
    toast.success('Booking cancelled successfully');
  } catch (err) {
    const error = err as AxiosError;
    set({ 
      isLoading: false, 
      error: error.message 
    });
    toast.error(`Failed to cancel booking: ${error.message}`);
    throw error;
  }
},

  deleteBooking: async (id: string) => {
    try {
      const token = getToken();
      await axios.delete(`${VITE_API_URL}/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      // Refetch current after delete
      get().fetchBookings(get().currentHotelId || undefined);
      toast.success('Booking deleted successfully');
    } catch (err) {
      const error = err as AxiosError;
      toast.error(`Failed to delete booking: ${error.message}`);
    }
  },

  createBooking: async (data) => {
    set({ isLoading: true, error: null });

    try {
      const token = getToken();
      const res = await axios.post(`${VITE_API_URL}/api/bookings/create-walkin`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      // Refetch current
      get().fetchBookings(get().currentHotelId || undefined);

      toast.success('Booking created successfully');

      set({ isLoading: false });
      
      return res.data;
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.response?.data?.error || "Booking failed",
      });
      toast.error(`Failed to create booking: ${err.response?.data?.error || "Booking failed"}`);
      throw err;
    }
  },

  // --- Activity log (audit trail) ---

  fetchBookingAuditLog: async (bookingId: string, page = 1, sort?: 'newest' | 'oldest') => {
    const resolvedSort = sort ?? get().auditLogSort;
    set({ isLoadingAuditLog: true, auditLogSort: resolvedSort });
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/bookings/${bookingId}/audit-log`, {
        params: { page, limit: 20, sort: resolvedSort },
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      if (response.data.success) {
        set({
          auditLog: response.data.data,
          auditLogPage: response.data.page,
          auditLogTotalPages: response.data.totalPages,
          isLoadingAuditLog: false,
        });
      } else {
        set({ isLoadingAuditLog: false });
      }
    } catch (err) {
      const error = err as AxiosError<any>;
      set({ isLoadingAuditLog: false });
      toast.error(error.response?.data?.error || 'Failed to load activity log');
    }
  },

  setAuditLogSort: (sort) => set({ auditLogSort: sort }),

  exportBookingAuditLog: async (bookingId: string, confirmationCode?: string) => {
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/bookings/${bookingId}/audit-log/export`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `booking-${confirmationCode || bookingId}-audit-log.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const error = err as AxiosError<any>;
      toast.error(error.response?.data?.error || 'Failed to export activity log');
    }
  },

  refundBooking: async (id: string, amount: number, reason: string, notes?: string) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${VITE_API_URL}/api/bookings/${id}/refund`,
        { amount, reason, notes },
        {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      await get().fetchBookings(get().currentHotelId || undefined, true);
      await get().fetchBookingAuditLog(id, 1, get().auditLogSort);
      await get().fetchOutstandingBalances(get().outstandingCurrentHotelId || undefined, true);
      toast.success('Refund recorded successfully');
      return { success: true, message: response.data.message };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to record refund';
      toast.error(message);
      return { success: false, message };
    }
  },

  extendStayV2: async (bookingId, additionalNights, amountCollected, paymentNote) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/extend-stay-v2`,
        { additionalNights, amountCollected, paymentNote },
        {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      await get().fetchBookings(get().currentHotelId || undefined, true);
      await get().fetchBookingAuditLog(bookingId, 1, get().auditLogSort);
      toast.success(response.data.message || 'Stay extended successfully');
      return { success: true, message: response.data.message, data: response.data.data };
    } catch (err) {
      const error = err as AxiosError<any>;
      const errorCode = (error.response?.data as any)?.error;
      if (errorCode === 'BLOCKED_CAPACITY') {
        // No toast here — the caller renders a dedicated blocked-state UI
        // with the reassignment remedy instead of a generic error toast.
        return {
          success: false,
          error: errorCode,
          message: (error.response?.data as any)?.message,
          data: (error.response?.data as any)?.data,
        };
      }
      const message = (error.response?.data as any)?.message || errorCode || 'Failed to extend stay';
      toast.error(message);
      return { success: false, message, error: errorCode };
    }
  },

  // --- Outstanding Balance Management ---

  fetchOutstandingBalances: async (hotelId?: string, force = false) => {
    const { outstandingLastFetched, outstandingCurrentHotelId: prevHotelId } = get();
    const hotelChanged = hotelId !== prevHotelId;
    const isFresh = outstandingLastFetched && Date.now() - outstandingLastFetched < BOOKING_TTL;
    if (isFresh && !force && !hotelChanged) return;

    set({ isLoadingOutstanding: true, outstandingCurrentHotelId: hotelId || null });
    try {
      const token = getToken();
      const params: any = {};
      if (hotelId) params.hotelId = hotelId;
      const response = await axios.get(`${VITE_API_URL}/api/bookings/outstanding`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      if (response.data.success) {
        set({
          outstandingBookings: response.data.data.bookings,
          outstandingSummary: response.data.data.summary,
          isLoadingOutstanding: false,
          outstandingLastFetched: Date.now(),
        });
      } else {
        set({ isLoadingOutstanding: false });
      }
    } catch (err) {
      const error = err as AxiosError<any>;
      set({ isLoadingOutstanding: false });
      toast.error(error.response?.data?.error || 'Failed to load outstanding balances');
    }
  },

  recordPayment: async (bookingId, data) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/payment`,
        data,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      await get().fetchBookings(get().currentHotelId || undefined, true);
      await get().fetchOutstandingBalances(get().outstandingCurrentHotelId || undefined, true);
      await get().fetchBookingAuditLog(bookingId, 1, get().auditLogSort);
      toast.success(response.data.message || 'Payment recorded successfully');
      return { success: true, message: response.data.message };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to record payment';
      toast.error(message);
      return { success: false, message };
    }
  },

  editPayment: async (bookingId, entryId, data) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/payments/${entryId}`,
        data,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      await get().fetchBookings(get().currentHotelId || undefined, true);
      await get().fetchOutstandingBalances(get().outstandingCurrentHotelId || undefined, true);
      await get().fetchBookingAuditLog(bookingId, 1, get().auditLogSort);
      toast.success(response.data.message || 'Payment entry updated successfully');
      return { success: true, message: response.data.message };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to edit payment entry';
      toast.error(message);
      return { success: false, message };
    }
  },

  recordAdjustment: async (bookingId, data) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${VITE_API_URL}/api/bookings/${bookingId}/adjustment`,
        data,
        { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      await get().fetchBookings(get().currentHotelId || undefined, true);
      await get().fetchOutstandingBalances(get().outstandingCurrentHotelId || undefined, true);
      await get().fetchBookingAuditLog(bookingId, 1, get().auditLogSort);
      toast.success(response.data.message || 'Adjustment recorded successfully');
      return { success: true, message: response.data.message };
    } catch (err) {
      const error = err as AxiosError<any>;
      const message = error.response?.data?.error || 'Failed to record adjustment';
      toast.error(message);
      return { success: false, message };
    }
  },

  exportOutstandingCSV: async (bookingIds?: string[]) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${VITE_API_URL}/api/bookings/outstanding/export/csv`,
        { bookingIds },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `outstanding-balances-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  },

  exportOutstandingExcel: async (bookingIds?: string[]) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${VITE_API_URL}/api/bookings/outstanding/export/excel`,
        { bookingIds },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `outstanding-balances-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export Excel');
    }
  },

  exportOutstandingPDF: async (bookingIds?: string[]) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${VITE_API_URL}/api/bookings/outstanding/export/pdf`,
        { bookingIds },
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true, responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'outstanding-balances-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export PDF');
    }
  },

  exportPaymentReceipt: async (bookingId: string, confirmationCode?: string) => {
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/bookings/${bookingId}/receipt/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${confirmationCode || bookingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to generate receipt');
    }
  },

  // --- 2. SOCKET.IO LISTENERS (for real-time updates) ---

  initSocketListeners: () => {
    // Remove only THIS store's handlers (preserves other stores' listeners)
    if (_bsCreatedHandler) socket.off('bookingCreated', _bsCreatedHandler);
    if (_bsUpdatedHandler) socket.off('bookingUpdated', _bsUpdatedHandler);
    if (_bsDeletedHandler) socket.off('bookingDeleted', _bsDeletedHandler);

    _bsCreatedHandler = (newBooking: Booking) => {
      const currentHotelId = get().currentHotelId;
      const hotelId = typeof newBooking.hotelId === 'string' ? newBooking.hotelId : newBooking.hotelId._id;
      if (currentHotelId === null || hotelId === currentHotelId) {
        get().fetchBookings(currentHotelId || undefined, true);
      }
      const outstandingHotelId = get().outstandingCurrentHotelId;
      if (outstandingHotelId === null || hotelId === outstandingHotelId) {
        get().fetchOutstandingBalances(outstandingHotelId || undefined, true);
      }
      toast.info(`New booking created for ${newBooking.guestName}`);
    };

    _bsUpdatedHandler = (updatedBooking: Booking) => {
      const currentHotelId = get().currentHotelId;
      const hotelId = typeof updatedBooking.hotelId === 'string' ? updatedBooking.hotelId : updatedBooking.hotelId._id;
      if (currentHotelId === null || hotelId === currentHotelId) {
        get().fetchBookings(currentHotelId || undefined, true);
      }
      const outstandingHotelId = get().outstandingCurrentHotelId;
      if (outstandingHotelId === null || hotelId === outstandingHotelId) {
        get().fetchOutstandingBalances(outstandingHotelId || undefined, true);
      }
      toast.info(`Booking for ${updatedBooking.guestName} was updated`);
    };

    _bsDeletedHandler = (_bookingId: string) => {
      get().fetchBookings(get().currentHotelId || undefined, true);
      get().fetchOutstandingBalances(get().outstandingCurrentHotelId || undefined, true);
      toast.warning('A booking was deleted');
    };

    socket.on('bookingCreated', _bsCreatedHandler);
    socket.on('bookingUpdated', _bsUpdatedHandler);
    socket.on('bookingDeleted', _bsDeletedHandler);
  },

  closeSocketListeners: () => {
    if (_bsCreatedHandler) socket.off('bookingCreated', _bsCreatedHandler);
    if (_bsUpdatedHandler) socket.off('bookingUpdated', _bsUpdatedHandler);
    if (_bsDeletedHandler) socket.off('bookingDeleted', _bsDeletedHandler);
    _bsCreatedHandler = null;
    _bsUpdatedHandler = null;
    _bsDeletedHandler = null;
  },
}));