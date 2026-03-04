import { create } from 'zustand';
import { useAuthStore } from './useAuthStore';

export interface Announcement {
  _id: string;
  hotelId: { _id: string; name: string } | string | null;
  title: string;
  content: string;
  imageUrl: string | null;
  status: 'active' | 'draft';
  targetAudience: 'guest' | 'staff' | 'both';
  startDate: string | null;
  endDate: string | null;
  ctaButtonText: string | null;
  ctaButtonUrl: string | null;
  priority: number;
  createdByRole: 'superadmin' | 'admin';
  createdBy: { _id: string; firstName: string; lastName: string; role: string } | string;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementState {
  announcements: Announcement[];
  isLoading: boolean;
  error: string | null;
  fetchAnnouncements: (hotelId?: string) => Promise<void>;
  createAnnouncement: (formData: FormData) => Promise<boolean>;
  updateAnnouncement: (id: string, formData: FormData) => Promise<boolean>;
  deleteAnnouncement: (id: string) => Promise<boolean>;
  toggleVisibility: (id: string) => Promise<boolean>;
}

const getApiConfig = () => {
  const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
  const token = useAuthStore.getState().token;
  return {
    baseUrl: `${VITE_API_URL}/api/announcements`,
    token,
  };
};

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],
  isLoading: false,
  error: null,

  fetchAnnouncements: async (hotelId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { baseUrl, token } = getApiConfig();
      const url = hotelId ? `${baseUrl}/admin?hotelId=${hotelId}` : `${baseUrl}/admin`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch announcements');
      set({ announcements: data.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createAnnouncement: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const { baseUrl, token } = getApiConfig();
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create announcement');
      set((state) => ({
        announcements: [data.data, ...state.announcements],
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  updateAnnouncement: async (id: string, formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const { baseUrl, token } = getApiConfig();
      const res = await fetch(`${baseUrl}/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update announcement');
      set((state) => ({
        announcements: state.announcements.map((a) => (a._id === id ? data.data : a)),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  deleteAnnouncement: async (id: string) => {
    try {
      const { baseUrl, token } = getApiConfig();
      const res = await fetch(`${baseUrl}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete announcement');
      set((state) => ({
        announcements: state.announcements.filter((a) => a._id !== id),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  toggleVisibility: async (id: string) => {
    try {
      const { baseUrl, token } = getApiConfig();
      const res = await fetch(`${baseUrl}/${id}/toggle-visibility`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to toggle visibility');
      set((state) => ({
        announcements: state.announcements.map((a) => (a._id === id ? data.data : a)),
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },
}));
