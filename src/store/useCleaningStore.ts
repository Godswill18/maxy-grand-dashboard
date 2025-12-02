import { create } from 'zustand';
import { toast } from 'sonner';
import { useAuthStore } from './useAuthStore';
import { io } from 'socket.io-client';

interface CleaningRoom {
  _id: string;
  roomNumber: string;
  status: string;
  roomTypeId: { name: string };
  hotelId: string;
  branchId: { _id: string; name: string };
}

interface CleaningRequest {
  _id: string;
  roomId: CleaningRoom;
  assignedCleaner: { _id: string; firstName: string; lastName: string; email: string };
  requestedBy: { name: string };
  status: 'pending' | 'in-progress' | 'completed';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  startTime?: string;
  finishTime?: string;
  actualDuration?: number;
  estimatedDuration?: string;
  hotelId: string;
  branchId: { _id: string; name: string };
}

interface Cleaner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  hotelId: string;
  branchId: { _id: string; name: string };
}

interface Branch {
  _id: string;
  name: string;
  hotelId: string;
}

interface CleaningState {
  // Data
  cleaningRooms: CleaningRoom[];
  allRequests: CleaningRequest[];
  pendingTasks: CleaningRequest[];
  inProgressTasks: CleaningRequest[];
  completedTasks: CleaningRequest[];
  cleaners: Cleaner[];
  branches: Branch[];
  
  // Filters
  selectedBranchId: string | null;
  
  // UI State
  isLoading: boolean;
  
  // Actions
  fetchBranches: () => Promise<void>;
  fetchCleaningRooms: (branchId?: string) => Promise<void>;
  fetchAllRequests: (branchId?: string) => Promise<void>;
  fetchCleaners: (branchId?: string) => Promise<void>;
  assignCleaner: (roomId: string, cleanerId: string, notes?: string) => Promise<void>;
  setSelectedBranch: (branchId: string | null) => void;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
}

const getToken = () => useAuthStore.getState().token;
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getHotelId = () => useAuthStore.getState().user?.hotelId;

// Socket.IO setup
const socket = io(VITE_API_URL);

export const useCleaningStore = create<CleaningState>((set, get) => ({
  // Initial State
  cleaningRooms: [],
  allRequests: [],
  pendingTasks: [],
  inProgressTasks: [],
  completedTasks: [],
  cleaners: [],
  branches: [],
  selectedBranchId: null,
  isLoading: false,

  // Fetch Branches
  fetchBranches: async () => {
    try {
      const token = getToken();
      const hotelId = getHotelId();
      
      const response = await fetch(`${VITE_API_URL}/api/branches?hotelId=${hotelId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch branches');
      
      const branches = await response.json();
      set({ branches });
    } catch (error) {
      toast.error('Failed to fetch branches');
      console.error(error);
    }
  },

  // Fetch Cleaning Rooms
  fetchCleaningRooms: async (branchId?: string) => {
    try {
      set({ isLoading: true });
      const token = getToken();
      const hotelId = getHotelId();
      const selectedBranch = branchId || get().selectedBranchId;
      
      let url = `${VITE_API_URL}/api/cleaning/rooms/cleaning?hotelId=${hotelId}`;
      if (selectedBranch) {
        url += `&branchId=${selectedBranch}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch cleaning rooms');
      
      const rooms = await response.json();
      set({ cleaningRooms: rooms, isLoading: false });
    } catch (error) {
      toast.error('Failed to fetch cleaning rooms');
      console.error(error);
      set({ isLoading: false });
    }
  },

  // Fetch All Requests
  fetchAllRequests: async (branchId?: string) => {
    try {
      set({ isLoading: true });
      const token = getToken();
      const selectedBranch = branchId || get().selectedBranchId;
      
      let url = `${VITE_API_URL}/api/cleaning/hotel`;
      if (selectedBranch) {
        url += `?branchId=${selectedBranch}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const requests = await response.json();
      
      const pending = requests.filter((r: CleaningRequest) => r.status === 'pending');
      const inProgress = requests.filter((r: CleaningRequest) => r.status === 'in-progress');
      const completed = requests.filter((r: CleaningRequest) => r.status === 'completed');
      
      set({ 
        allRequests: requests, 
        pendingTasks: pending,
        inProgressTasks: inProgress,
        completedTasks: completed,
        isLoading: false 
      });
    } catch (error) {
      toast.error('Failed to fetch requests');
      console.error(error);
      set({ isLoading: false });
    }
  },

  // Fetch Cleaners
  fetchCleaners: async (branchId?: string) => {
    try {
      const token = getToken();
      const selectedBranch = branchId || get().selectedBranchId;
      
      let url = `${VITE_API_URL}/api/cleaning/cleaners`;
      if (selectedBranch) {
        url += `?branchId=${selectedBranch}`;
      }
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch cleaners');
      
      const cleaners = await response.json();
      set({ cleaners });
    } catch (error) {
      toast.error('Failed to fetch cleaners');
      console.error(error);
    }
  },

  // Assign Cleaner
  assignCleaner: async (roomId: string, cleanerId: string, notes?: string) => {
    try {
      const token = getToken();
      
      const response = await fetch(`${VITE_API_URL}/api/cleaning/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId, assignedCleanerId: cleanerId, notes }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to assign cleaner');
      
      toast.success('Cleaner assigned successfully');
      
      // Refetch to update state
      const selectedBranch = get().selectedBranchId;
      await Promise.all([
        get().fetchAllRequests(selectedBranch || undefined),
        get().fetchCleaningRooms(selectedBranch || undefined),
      ]);
    } catch (error) {
      toast.error('Failed to assign cleaner');
      console.error(error);
    }
  },

  // Set Selected Branch
  setSelectedBranch: (branchId: string | null) => {
    set({ selectedBranchId: branchId });
    
    // Refetch data with new branch filter
    const state = get();
    state.fetchCleaningRooms(branchId || undefined);
    state.fetchAllRequests(branchId || undefined);
    state.fetchCleaners(branchId || undefined);
  },

  // Update Task Status
  updateTaskStatus: async (taskId: string, status: string) => {
    try {
      const token = getToken();
      
      const response = await fetch(`${VITE_API_URL}/api/cleaning/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to update task status');
      
      toast.success('Task status updated');
      
      // Refetch to update state
      const selectedBranch = get().selectedBranchId;
      await get().fetchAllRequests(selectedBranch || undefined);
    } catch (error) {
      toast.error('Failed to update task status');
      console.error(error);
    }
  },
}));

// Socket.IO Event Listeners
socket.on('newCleaningRequest', (newRequest: CleaningRequest) => {
  const { allRequests, selectedBranchId } = useCleaningStore.getState();
  
  // Only add if it matches the selected branch or no branch is selected
  if (!selectedBranchId || newRequest.branchId._id === selectedBranchId) {
    const updatedRequests = [newRequest, ...allRequests];
    const pending = updatedRequests.filter(r => r.status === 'pending');
    const inProgress = updatedRequests.filter(r => r.status === 'in-progress');
    const completed = updatedRequests.filter(r => r.status === 'completed');
    
    useCleaningStore.setState({
      allRequests: updatedRequests,
      pendingTasks: pending,
      inProgressTasks: inProgress,
      completedTasks: completed,
    });
    
    toast.info('New cleaning request received');
  }
});

socket.on('taskStatusUpdated', ({ requestId, status }: { requestId: string; status: string }) => {
  const { allRequests } = useCleaningStore.getState();
  
  const updatedRequests = allRequests.map(r =>
    r._id === requestId ? { ...r, status: status as any } : r
  );
  
  const pending = updatedRequests.filter(r => r.status === 'pending');
  const inProgress = updatedRequests.filter(r => r.status === 'in-progress');
  const completed = updatedRequests.filter(r => r.status === 'completed');
  
  useCleaningStore.setState({
    allRequests: updatedRequests,
    pendingTasks: pending,
    inProgressTasks: inProgress,
    completedTasks: completed,
  });
  
  toast.info(`Task marked as ${status}`);
});

socket.on('taskCompleted', ({ requestId }: { requestId: string }) => {
  const { allRequests } = useCleaningStore.getState();
  
  const updatedRequests = allRequests.map(r =>
    r._id === requestId ? { ...r, status: 'completed' as any } : r
  );
  
  const pending = updatedRequests.filter(r => r.status === 'pending');
  const inProgress = updatedRequests.filter(r => r.status === 'in-progress');
  const completed = updatedRequests.filter(r => r.status === 'completed');
  
  useCleaningStore.setState({
    allRequests: updatedRequests,
    pendingTasks: pending,
    inProgressTasks: inProgress,
    completedTasks: completed,
  });
  
  toast.success('Task completed');
});