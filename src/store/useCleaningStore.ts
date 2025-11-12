// src/stores/useCleaningStore.ts
import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const socket = io(VITE_API_URL);

interface CleaningRequest {
  _id: string;
  roomId: { roomNumber: string; status: string };
  assignedCleaner: { name: string };
  status: string;
  createdAt: string;
}

interface CleaningState {
  requests: CleaningRequest[];
  isLoading: boolean;
  fetchRequests: (role: string) => Promise<void>;
  updateRequestStatus: (id: string) => Promise<void>;
}

export const useCleaningStore = create<CleaningState>((set, get) => ({
  requests: [],
  isLoading: false,

  fetchRequests: async (role) => {
    try {
      set({ isLoading: true });
      const token = localStorage.getItem('authToken');

      const { data } = await axios.get(`${VITE_API_URL}/api/cleaning/get-cleaning-history`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ requests: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error(error);
    }
  },

  updateRequestStatus: async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `${VITE_API_URL}/api/cleaning/${id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error(error);
    }
  },
}));

// --- SOCKET EVENT LISTENERS ---
socket.on('newCleaningRequest', (newRequest) => {
  const { requests } = useCleaningStore.getState();
  useCleaningStore.setState({ requests: [newRequest, ...requests] });
});

socket.on('taskCompleted', ({ requestId }) => {
  const { requests } = useCleaningStore.getState();
  const updated = requests.map((r) =>
    r._id === requestId ? { ...r, status: 'completed' } : r
  );
  useCleaningStore.setState({ requests: updated });
});
