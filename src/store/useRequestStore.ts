import { create } from 'zustand';
import axios from 'axios'; // Using axios for simplicity, but fetch is fine too

// --- 1. Define Types (based on your backend 'populate') ---
interface User {
  _id: string;
  name: string;
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
  hotelId: Hotel;
  raisedBy: User;
  approvedBy?: User; // Optional, might be null
  amount: number;
  description: string;
  images: string[];
  status: RequestStatus;
  createdAt: string;
}

// --- 2. Define Store State and Actions ---
interface RequestStoreState {
  requests: FinancialRequest[];
  isLoading: boolean;
  error: string | null;
  actions: {
    fetchAllRequests: () => Promise<void>;
    updateRequestStatus: (
      requestId: string, 
      status: 'approved' | 'rejected'
    ) => Promise<void>;
  };
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// TODO: You MUST send an auth token (e.g., from a user/auth store)
// This is a placeholder for your auth logic
const getAuthHeaders = () => {
  // const token = useAuthStore.getState().token;
  // return { Authorization: `Bearer ${token}` };
  return {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer YOUR_TOKEN_HERE` 
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
     * Fetches all requests (for Superadmin)
     */
    fetchAllRequests: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get<FinancialRequest[]>(`${VITE_API_URL}/api/requests/all`, {
          headers: getAuthHeaders(),
            withCredentials: true,
        });
        
        set({ requests: response.data, isLoading: false });

      } catch (err: any) {
        const error = err.response?.data?.message || err.message;
        set({ isLoading: false, error });
      }
    },

    /**
     * Approves or Rejects a request (for Superadmin)
     */
    updateRequestStatus: async (requestId, status) => {
      // Optimistic update can be added here, but we'll do a simple update
      try {
        const response = await axios.patch<FinancialRequest>(
          `${VITE_API_URL}/api/requests/${requestId}/status`,
          { status }, // The body of the request
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

      } catch (err: any) {
        const error = err.response?.data?.message || err.message;
        // Set an error, but don't stop the app
        set({ error });
        console.error("Failed to update status:", error);
      }
    },
  },
}));

// Export actions for easy access in components
export const useRequestActions = () => useRequestStore((state) => state.actions);