import { create } from 'zustand';
import { useAuthStore } from './useAuthStore'; // Import auth store to get token

// Define the shape of a Branch object (based on your backend model)
export interface Branch {
  _id: string;
  name: string;
  city: string;
  address: string;
  phoneNumber: string;
  manager?: string; // Optional
  roomCount?: number;
  staffCount?: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Define the shape of the store's state and actions
interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
  fetchBranches: () => Promise<void>;
  fetchActiveBranches: () => Promise<void>;
  fetchBranchById: (id: string) => Promise<void>;
  createBranch: (newBranchData: Omit<Branch, '_id'>) => Promise<boolean>;
  updateBranch: (id: string, updatedData: Partial<Branch>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
}

// Helper to get API URL and Auth Token
const getApiConfig = () => {
  const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
  const token = useAuthStore.getState().token; // Get token from auth store
  return {
    apiUrl: `${VITE_API_URL}/api/hotels`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`, // Assuming Bearer token auth
    },
    
  };
};

export const useBranchStore = create<BranchState>((set) => ({
  branches: [],
  currentBranch: null,
  isLoading: false,
  error: null,

  // --- FETCH ALL BRANCHES (for Admin) ---
  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    const { apiUrl, headers } = getApiConfig();
    try {
      const response = await fetch(`${apiUrl}/getHotel-branch-admin`, {
        method: 'GET',
        headers,
        credentials: 'include' as RequestCredentials,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch branches');
      }
      set({ branches: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchActiveBranches: async () => {
    set({ isLoading: true, error: null });
    const { apiUrl, headers } = getApiConfig();
    try {
      const response = await fetch(`${apiUrl}/getActive-branch`, {
        method: 'GET',
        headers,
        credentials: 'include' as RequestCredentials,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch branches');
      }
      set({ branches: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  // --- FETCH SINGLE BRANCH ---
  fetchBranchById: async (id: string) => {
    set({ isLoading: true, error: null, currentBranch: null });
    const { apiUrl, headers } = getApiConfig();
    try {
      const response = await fetch(`${apiUrl}/get-single-branch/${id}`, {
        method: 'GET',
        headers,
        credentials: 'include' as RequestCredentials,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Branch not found');
      }
      set({ currentBranch: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  // --- CREATE BRANCH ---
  createBranch: async (newBranchData) => {
    set({ isLoading: true, error: null });
    const { apiUrl, headers } = getApiConfig();
    try {
      const response = await fetch(`${apiUrl}/createHotel-branch`, {
        method: 'POST',
        headers,
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify(newBranchData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create branch');
      }
      // Add the new branch to the local state
      set((state) => ({
        branches: [...state.branches, data.data],
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // --- UPDATE BRANCH ---
  updateBranch: async (id, updatedData) => {
    set({ isLoading: true, error: null });
    const { apiUrl, headers } = getApiConfig();
    try {
      const response = await fetch(`${apiUrl}/update-branch/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify(updatedData),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update branch');
      }
      // Update the branch in the local state
      set((state) => ({
        branches: state.branches.map((b) => (b._id === id ? data.data : b)),
        currentBranch: state.currentBranch?._id === id ? data.data : state.currentBranch,
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  // --- DELETE BRANCH ---
  deleteBranch: async (id) => {
    set({ isLoading: true, error: null });
    const { apiUrl, headers } = getApiConfig();
    try {
      const response = await fetch(`${apiUrl}/delete-branch/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include' as RequestCredentials,
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete branch');
      }
      // Remove the branch from local state
      set((state) => ({
        branches: state.branches.filter((b) => b._id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
}));