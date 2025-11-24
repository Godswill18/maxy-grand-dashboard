// src/store/useRequest.ts

import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from './useAuthStore'; // ASSUMING useAuthStore is available
import { toast } from 'sonner';

// --- 1. Define Types ---
interface User {
  _id: string;
  // name: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Hotel {
  _id: string;
  name: string;
  location: string;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface FinancialRequest {
  _id: string;
  hotelId: Hotel | string; // Can be populated object or just ID string
  raisedBy: User;
  approvedBy?: User | string; 
  title: string;
  amount: number;
  description: string;
  images: string[];
  status: RequestStatus;
  createdAt: string;
}

interface RequestPayload {
    title: string;
    amount: number;
    description: string;
    images?: string[]; // Optional array of image URLs
}

// --- 2. Define Store State and Actions ---
interface RequestStoreState {
  requests: FinancialRequest[];
  isLoading: boolean;
  error: string | null;
  actions: {
    fetchAllRequests: (isAdmin: boolean) => Promise<void>;
    updateRequestStatus: (
      requestId: string, 
      status: 'approved' | 'rejected'
    ) => Promise<void>;
    createRequest: (payload: RequestPayload) => Promise<void>;
    editRequest: (requestId: string, payload: Partial<RequestPayload>) => Promise<void>;
  };
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// FIX: Implement Auth Headers using the Auth Store
const getAuthHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  };
};


export const useRequestStore = create<RequestStoreState>((set) => ({
  // --- Initial State ---
  requests: [],
  isLoading: false,
  error: null,

  // --- Actions ---
  actions: {
    /**
     * Fetches requests based on user role (All for Superadmin, Hotel for Admin)
     */
    fetchAllRequests: async (isAdmin: boolean) => {
      set({ isLoading: true, error: null });
      try {
        // Determine endpoint based on role: 
        // Admin uses /api/requests (getHotelRequests), Superadmin uses /api/requests/all
        const endpoint = isAdmin ? `${VITE_API_URL}/api/requests/` : `${VITE_API_URL}/api/requests/all`;
        
        const response = await axios.get<FinancialRequest[]>(endpoint, {
          headers: getAuthHeaders(),
            withCredentials: true,
        });
        
        set({ requests: response.data, isLoading: false });

      } catch (err: any) {
        const error = err.response?.data?.message || err.message;
        set({ isLoading: false, error });
        toast.error(`Failed to fetch requests: ${error}`);
      }
    },

    /**
     * Approves or Rejects a request (for Superadmin)
     */
    updateRequestStatus: async (requestId, status) => {
      try {
        const response = await axios.patch<FinancialRequest>(
          `${VITE_API_URL}/api/requests/${requestId}/status`,
          { status },
          { headers: getAuthHeaders(), withCredentials: true }
        );

        const updatedRequest = response.data;

        // Update the request in the store's state
        set((state) => ({
          requests: state.requests.map((req) =>
            req._id === requestId ? updatedRequest : req
          ),
          error: null,
        }));
        toast.success(`Request ${status} successfully.`);

      } catch (err: any) {
        const error = err.response?.data?.message || err.message;
        set({ error });
        toast.error(`Failed to update status: ${error}`);
      }
    },

    /**
     * Creates a new financial request (for Admin)
     */
    createRequest: async (payload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post<FinancialRequest>(
                `${VITE_API_URL}/api/requests/create`,
                payload, 
                { headers: getAuthHeaders(), withCredentials: true }
            );

            const newRequest = response.data;

            // Prepend the new request to the list
            set((state) => ({
                requests: [newRequest, ...state.requests],
                error: null,
                isLoading: false,
            }));
            toast.success('Request submitted successfully.');

        } catch (err: any) {
            const error = err.response?.data?.message || err.message;
            set({ error, isLoading: false });
            toast.error(`Failed to submit request: ${error}`);
            throw new Error(error); // Re-throw to handle dialog closing on the frontend
        }
    },
    
    editRequest: async (requestId, payload) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.patch<FinancialRequest>(
          `${VITE_API_URL}/api/requests/${requestId}/edit-request`,
          payload,
          { headers: getAuthHeaders(), withCredentials: true }
        );
  
        const updatedRequest = response.data;
  
        // Update the request in the store's state
        set((state) => ({
          requests: state.requests.map((req) =>
            req._id === requestId ? updatedRequest : req
          ),
          error: null,
          isLoading: false,
        }));
        toast.success('Request updated successfully.');
  
      } catch (err: any) {
        const error = err.response?.data?.message || err.message;
        set({ error, isLoading: false });
        toast.error(`Failed to update request: ${error}`);
        throw new Error(error); // Re-throw to handle dialog closing on the frontend
      }
    },
  },

}));

// Export actions for easy access in components
export const useRequestActions = () => useRequestStore((state) => state.actions);