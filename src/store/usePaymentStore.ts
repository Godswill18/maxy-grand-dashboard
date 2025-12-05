import { create } from 'zustand';
import { toast } from 'sonner';

interface Payment {
  _id: string;
  bookingId: {
    _id: string;
    guestName: string;
    guestEmail: string;
    confirmationCode: string;
    checkInDate: string;
    checkOutDate: string;
    bookingType: string;
    roomTypeId?: {
      name: string;
      roomNumber: string;
    };
    totalAmount: number;
  };
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  gatewayRef?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaymentFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  bookingType?: string;
}

interface PaymentState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  filters: PaymentFilters;
  
  // Actions
  fetchPayments: (hotelId?: string, filters?: PaymentFilters) => Promise<void>;
  fetchPaymentById: (paymentId: string) => Promise<Payment | null>;
  setFilters: (filters: PaymentFilters) => void;
  clearFilters: () => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  isLoading: false,
  error: null,
  filters: {},

  fetchPayments: async (hotelId?: string) => {
    set({ isLoading: true, error: null });
    
    // console.log('=== FETCH PAYMENTS DEBUG ===');
    // console.log('Hotel ID:', hotelId);
    // console.log('API URL:', VITE_API_URL);
    
    try {
      const url = hotelId 
        ? `${VITE_API_URL}/api/payments/hotel/${hotelId}`
        : `${VITE_API_URL}/api/payments/all`;

    //   console.log('Fetching from URL:', url);

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

    //   console.log('Response status:', response.status);
    //   console.log('Response OK:', response.ok);

      const data = await response.json();
    //   console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to fetch payments');
      }

      const payments = data.success ? data.data : [];
    //   console.log('Payments count:', payments.length);
      
      set({ 
        payments,
        isLoading: false 
      });
    } catch (error: any) {
    //   console.error('=== FETCH PAYMENTS ERROR ===');
    //   console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      set({ 
        error: error.message || 'Failed to fetch payments',
        payments: [],
        isLoading: false 
      });
      
      toast.error(error.message || 'Failed to fetch payments');
    }
  },

  fetchPaymentById: async (paymentId: string) => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/payments/${paymentId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment');
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error: any) {
      console.error('Error fetching payment:', error);
      toast.error(error.message || 'Failed to fetch payment');
      return null;
    }
  },

  setFilters: (filters: PaymentFilters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },
}));