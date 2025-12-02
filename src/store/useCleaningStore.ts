import { create } from 'zustand';
import { toast } from 'sonner';
import { useAuthStore } from './useAuthStore';
import { io } from 'socket.io-client';

interface CleaningRoom {
  _id: string;
  roomNumber: string;
  status: string;
  roomTypeId: { name: string };
  hotelId: { _id: string; name: string };
  branchId?: { _id: string; name: string }; // Optional, for display only
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
  hotelId: { _id: string; name: string };
  branchId?: { _id: string; name: string }; // Optional, for display only
}

interface Cleaner {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  hotelId: string;
  branchId?: { _id: string; name: string }; // Optional, for display only
}

interface Hotel {
  _id: string;
  name: string;
}

interface CleaningState {
  // Data
  cleaningRooms: CleaningRoom[];
  allRequests: CleaningRequest[];
  pendingTasks: CleaningRequest[];
  inProgressTasks: CleaningRequest[];
  completedTasks: CleaningRequest[];
  cleaners: Cleaner[];
  hotels: Hotel[];
  
  // Filters (simplified to hotelId only)
  viewMode: 'all-hotels' | 'single-hotel';
  selectedHotelId: string | null;
  
  // UI State
  isLoading: boolean;
  
  // Actions
  fetchHotels: () => Promise<void>;
  fetchCleaningRooms: (filters?: { hotelId?: string }) => Promise<void>;
  fetchAllRequests: (filters?: { hotelId?: string }) => Promise<void>;
  fetchCleaners: (filters?: { hotelId?: string }) => Promise<void>;
  assignCleaner: (roomId: string, cleanerId: string, notes?: string) => Promise<void>;
  setViewMode: (mode: 'all-hotels' | 'single-hotel') => void;
  setSelectedHotel: (hotelId: string | null) => void;
  updateTaskStatus: (taskId: string, status: string) => Promise<void>;
  refreshData: () => Promise<void>;
}

const getToken = () => useAuthStore.getState().token;
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
const getUserHotelId = () => useAuthStore.getState().user?.hotelId;

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
  hotels: [],
  viewMode: 'single-hotel',
  selectedHotelId: null,
  isLoading: false,

  // Fetch Hotels
  fetchHotels: async () => {
    try {
      const token = getToken();
      
      const response = await fetch(`${VITE_API_URL}/api/hotels/getHotel-branch-admin`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch hotels');
      
      const hotels = await response.json();
      set({ hotels });
      
      // Set user's hotel as default if not already set
      const userHotelId = getUserHotelId();
      if (userHotelId && !get().selectedHotelId) {
        set({ selectedHotelId: userHotelId });
      }
    } catch (error) {
      toast.error('Failed to fetch hotels');
      console.error(error);
    }
  },

  // Fetch Cleaning Rooms
  fetchCleaningRooms: async (filters?: { hotelId?: string }) => {
    try {
      set({ isLoading: true });
      const token = getToken();
      const state = get();
      
      let url = `${VITE_API_URL}/api/cleaning/rooms/cleaning?`;
      
      // Determine hotel filter
      if (state.viewMode === 'all-hotels') {
        url += `all=true&`;
      } else {
        const hotelId = filters?.hotelId || state.selectedHotelId || getUserHotelId();
        if (hotelId) {
          url += `hotelId=${hotelId}&`;
        }
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
  fetchAllRequests: async (filters?: { hotelId?: string }) => {
    try {
      set({ isLoading: true });
      const token = getToken();
      const state = get();
      
      let url = `${VITE_API_URL}/api/cleaning/hotel?`;
      
      // Determine hotel filter
      if (state.viewMode === 'all-hotels') {
        url += `all=true&`;
      } else {
        const hotelId = filters?.hotelId || state.selectedHotelId || getUserHotelId();
        if (hotelId) {
          url += `hotelId=${hotelId}&`;
        }
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
  fetchCleaners: async (filters?: { hotelId?: string }) => {
    try {
      const token = getToken();
      const state = get();
      
      let url = `${VITE_API_URL}/api/cleaning/cleaners?`;
      
      // Determine hotel filter
      if (state.viewMode === 'all-hotels') {
        url += `all=true&`;
      } else {
        const hotelId = filters?.hotelId || state.selectedHotelId || getUserHotelId();
        if (hotelId) {
          url += `hotelId=${hotelId}&`;
        }
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
      await get().refreshData();
    } catch (error) {
      toast.error('Failed to assign cleaner');
      console.error(error);
    }
  },

  // Set View Mode
  setViewMode: (mode: 'all-hotels' | 'single-hotel') => {
    set({ viewMode: mode });
    
    if (mode === 'single-hotel') {
      const userHotelId = getUserHotelId();
      set({ selectedHotelId: userHotelId });
    }
    
    // Refetch data with new mode
    get().refreshData();
  },

  // Set Selected Hotel
  setSelectedHotel: (hotelId: string | null) => {
    set({ selectedHotelId: hotelId });
    
    // Refetch data with new hotel
    get().refreshData();
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
      await get().refreshData();
    } catch (error) {
      toast.error('Failed to update task status');
      console.error(error);
    }
  },

  // Refresh Data
  refreshData: async () => {
    await Promise.all([
      get().fetchCleaningRooms(),
      get().fetchAllRequests(),
      get().fetchCleaners(),
    ]);
  },
}));

// Socket.IO Event Listeners (simplified to hotelId only)
socket.on('newCleaningRequest', (newRequest: CleaningRequest) => {
  const { 
    allRequests, 
    viewMode, 
    selectedHotelId
  } = useCleaningStore.getState();
  
  // Filter based on current view mode (hotelId only)
  let shouldAdd = true;
  
  if (viewMode === 'single-hotel' && selectedHotelId) {
    shouldAdd = newRequest.hotelId._id === selectedHotelId;
  }
  
  if (shouldAdd) {
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