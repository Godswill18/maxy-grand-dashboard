// Frontend: stores/useOrderStore.ts
import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { socket } from '../lib/socket'; // Assume socket lib
import { toast } from 'sonner';
import { get } from 'http';
import { useAuthStore } from './useAuthStore';

interface Order {
  _id: string;
  hotelId: { _id: string; name: string };
  orderType: string;
  roomNumber?: string;
  tableNumber?: string;
  customerName?: string;
  items: Array<{ menuItemId: { name: string }; quantity: number; price: number }>;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  specialInstructions?: string;
  waiterId?: { name: string };
  createdAt: string;
  updatedAt: string;
}

interface OrderSummary {
  dailyCompleted: number;
  weeklyOrders: number;
  monthlyOrders: number;
}

interface Hotel {
  _id: string;
  name: string;
}

interface OrderState {
  orders: Order[];
  summary: OrderSummary | null;
  hotels: Hotel[];
  currentHotelId: string | null;
  isLoading: boolean;
  error: string | null;
  fetchOrders: (params?: { page?: number; limit?: number; sortBy?: string; sortDir?: 'asc' | 'desc'; status?: string; fromDate?: string; toDate?: string; amount?: number; hotelId?: string }) => Promise<void>;
  fetchSummary: (hotelId?: string) => Promise<void>;
  fetchHotels: () => Promise<void>;
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

const getToken = () => {
  return useAuthStore.getState().token;
};

const VITE_API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:5000';

const getUser = () => {
  const { user } = useAuthStore.getState();
  return user || null;
};

// console.log(getToken())

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  summary: null,
  hotels: [],
  currentHotelId: null,
  isLoading: false,
  error: null,

  fetchHotels: async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/hotels/getHotel-branch-admin`, { // Assume hotels endpoint
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ hotels: response.data });
    } catch (err) {
      console.error('Failed to fetch hotels');
    }
  },

  fetchOrders: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const token = sessionStorage.getItem("token");
      const user = getUser();
      const queryParams = new URLSearchParams(params as any);
      if (user.role === 'admin' && !params.hotelId) {
        queryParams.append('hotelId', user.hotelId);
      }
      const response = await axios.get(`${VITE_API_URL}/api/orders/admin?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ orders: response.data.data, currentHotelId: params.hotelId || user.hotelId || null, isLoading: false });
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSummary: async (hotelId?: string) => {
    try {
      const token = getToken();
      const user = getUser();
      const queryParams = new URLSearchParams();
      if (user.role === 'superadmin' && hotelId) {
        queryParams.append('hotelId', hotelId);
      }
      const response = await axios.get(`${VITE_API_URL}/api/orders/summary?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ summary: response.data.data });
    } catch (err) {
      console.error('Failed to fetch summary');
    }
  },

  initSocketListeners: () => {
    socket.off('orderCreated');
    socket.off('orderUpdated');
    socket.off('orderDeleted'); // Assume delete exists

    socket.on('orderCreated', (newOrder: Order) => {
      const { currentHotelId } = get();
      if (!currentHotelId || newOrder.hotelId._id === currentHotelId) {
        get().fetchOrders({}); // Refetch
      }
      toast.info('New order created');
    });

    socket.on('orderUpdated', (updatedOrder: Order) => {
      const { currentHotelId } = get();
      if (!currentHotelId || updatedOrder.hotelId._id === currentHotelId) {
        get().fetchOrders({});
      }
      toast.info('Order updated');
    });

    socket.on('orderDeleted', (orderId: string) => {
      get().fetchOrders({});
      toast.warning('Order deleted');
    });
  },

  closeSocketListeners: () => {
    socket.off('orderCreated');
    socket.off('orderUpdated');
    socket.off('orderDeleted');
  },
}));