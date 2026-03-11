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

const BRANCH_TTL = 10 * 60 * 1000; // 10 minutes — branches rarely change

// Define the shape of the store's state and actions
interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchBranches: () => Promise<void>;
  fetchActiveBranches: () => Promise<void>;
  fetchBranchById: (id: string) => Promise<void>;
  createBranch: (newBranchData: Omit<Branch, '_id'>) => Promise<boolean>;
  updateBranch: (id: string, updatedData: Partial<Branch>) => Promise<boolean>;
  deleteBranch: (id: string) => Promise<boolean>;
  // ✅ NEW: Calculate counts based on related data
  calculateStaffCount: (hotelId: string, staffList: any[]) => number;
  calculateRoomCount: (hotelId: string, roomList: any[]) => number;
  // ✅ NEW: Enrich branches with calculated counts
  enrichBranchesWithCounts: (branches: Branch[], staffList: any[], roomList: any[]) => Branch[];
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

export const useBranchStore = create<BranchState>((set, get) => ({
  branches: [],
  currentBranch: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  // ✅ NEW: Calculate staff count for a branch based on hotelId
  calculateStaffCount: (hotelId: string, staffList: any[]) => {
    if (!Array.isArray(staffList)) return 0;
    return staffList.filter((staff) => {
      // Check if staff has hotelId and it matches the branch _id
      if (staff.hotelId) {
        // hotelId could be an object with _id or just a string
        const staffHotelId = typeof staff.hotelId === 'object' 
          ? staff.hotelId._id 
          : staff.hotelId;
        return staffHotelId === hotelId;
      }
      return false;
    }).length;
  },

  // ✅ NEW: Calculate room count for a branch based on hotelId
  calculateRoomCount: (hotelId: string, roomList: any[]) => {
    if (!Array.isArray(roomList)) return 0;
    return roomList.filter((room) => {
      // Check if room has hotelId and it matches the branch _id
      if (room.hotelId) {
        // hotelId could be an object with _id or just a string
        const roomHotelId = typeof room.hotelId === 'object' 
          ? room.hotelId._id 
          : room.hotelId;
        return roomHotelId === hotelId;
      }
      return false;
    }).length;
  },

  // ✅ NEW: Enrich branches with calculated counts
  enrichBranchesWithCounts: (branches: Branch[], staffList: any[], roomList: any[]) => {
    const { calculateStaffCount, calculateRoomCount } = get();
    
    return branches.map((branch) => ({
      ...branch,
      staffCount: calculateStaffCount(branch._id, staffList),
      roomCount: calculateRoomCount(branch._id, roomList),
    }));
  },

  // --- FETCH ALL BRANCHES (for Admin) ---
  fetchBranches: async () => {
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < BRANCH_TTL) return;

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
      set({ branches: data.data, isLoading: false, lastFetched: Date.now() });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchActiveBranches: async () => {
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < BRANCH_TTL) return;

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
      set({ branches: data.data, isLoading: false, lastFetched: Date.now() });
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
      set((state) => ({
        branches: [...state.branches, data.data],
        isLoading: false,
        lastFetched: null, // invalidate
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
      set((state) => ({
        branches: state.branches.map((b) => (b._id === id ? data.data : b)),
        currentBranch: state.currentBranch?._id === id ? data.data : state.currentBranch,
        isLoading: false,
        lastFetched: null, // invalidate
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
      set((state) => ({
        branches: state.branches.filter((b) => b._id !== id),
        isLoading: false,
        lastFetched: null, // invalidate
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
}));