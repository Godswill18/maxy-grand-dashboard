import { create } from 'zustand';
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuthStore } from './useAuthStore';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export type NotificationType =
  | 'booking'
  | 'checkin'
  | 'checkout'
  | 'cleaning_task'
  | 'cleaning_completed'
  | 'payment'
  | 'order'
  | 'order_ready'
  | 'request'
  | 'request_completed'
  | 'shift'
  | 'general'
  | 'booking_cancelled'
  | 'room_status_changed'
  | 'order_cancelled'
  | 'staff_activity'
  | 'escalation'
  | 'user_management'
  | 'branch_event';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export type NotificationFilter = 'all' | 'unread' | 'read';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  filter: NotificationFilter;
  page: number;
  totalPages: number;
  hasMore: boolean;
  // Bumped every time a new_notification event arrives — components watch
  // this to trigger a toast/sound side effect exactly once per notification.
  lastReceived: Notification | null;

  setFilter: (filter: NotificationFilter) => void;
  fetchNotifications: (opts?: { page?: number; search?: string; append?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>; // alias kept for NotificationBell compatibility

  _setConnected: (connected: boolean) => void;
  _handleNewNotification: (notification: Notification) => void;
  _handleRemoteRead: (id: string) => void;
  _handleRemoteReadAll: () => void;
}

const authHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  isLoading: false,
  filter: 'all',
  page: 1,
  totalPages: 1,
  hasMore: false,
  lastReceived: null,

  setFilter: (filter) => set({ filter, page: 1 }),

  fetchNotifications: async (opts = {}) => {
    const { page = 1, search, append = false } = opts;
    const { filter } = get();
    set({ isLoading: true });
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (filter === 'unread') params.unreadOnly = 'true';
      if (search) params.search = search;

      const response = await axios.get(`${VITE_API_URL}/api/notifications`, {
        params,
        headers: authHeaders(),
        withCredentials: true,
      });

      if (response.data.success) {
        const { notifications, unreadCount, totalPages, currentPage } = response.data.data;
        const filtered = filter === 'read' ? notifications.filter((n: Notification) => n.read) : notifications;
        set((state) => ({
          notifications: append ? [...state.notifications, ...filtered] : filtered,
          unreadCount,
          page: Number(currentPage) || page,
          totalPages,
          hasMore: (Number(currentPage) || page) < totalPages,
        }));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await axios.get(`${VITE_API_URL}/api/notifications/unread-count`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      if (response.data.success) {
        set({ unreadCount: response.data.data.unreadCount });
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await axios.patch(`${VITE_API_URL}/api/notifications/${id}/read`, {}, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set((state) => ({
        notifications: state.notifications.map((n) => (n._id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - (state.notifications.find(n => n._id === id && !n.read) ? 1 : 0)),
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await axios.patch(`${VITE_API_URL}/api/notifications/read-all`, {}, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await axios.delete(`${VITE_API_URL}/api/notifications/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set((state) => ({
        notifications: state.notifications.filter((n) => n._id !== id),
      }));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },
  clearNotification: async (id) => get().deleteNotification(id),

  deleteAllRead: async () => {
    try {
      await axios.delete(`${VITE_API_URL}/api/notifications/read/all`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set((state) => ({
        notifications: state.notifications.filter((n) => !n.read),
      }));
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  },

  clearAll: async () => {
    try {
      await axios.delete(`${VITE_API_URL}/api/notifications/clear-all`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  },

  _setConnected: (connected) => set({ isConnected: connected }),

  _handleNewNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
      lastReceived: notification,
    }));
  },

  _handleRemoteRead: (id) => {
    set((state) => {
      const target = state.notifications.find((n) => n._id === id);
      if (!target || target.read) return {};
      return {
        notifications: state.notifications.map((n) => (n._id === id ? { ...n, read: true } : n)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  _handleRemoteReadAll: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
}));

let socket: Socket | null = null;

/**
 * Connects to the dedicated, JWT-authenticated `/notifications` Socket.IO
 * namespace. Call once at the app root (see App.tsx's AuthenticatedLayout,
 * right next to useForceLogout()) — this guarantees exactly one connection
 * regardless of how many components render a notification bell/page.
 */
export const useNotificationSocket = () => {
  const user = useAuthStore((state) => state.user);
  const { fetchNotifications, fetchUnreadCount, _setConnected, _handleNewNotification, _handleRemoteRead, _handleRemoteReadAll } = useNotificationStore();

  useEffect(() => {
    if (!user?._id) return;

    const token = localStorage.getItem('token');
    const newSocket = io(`${VITE_API_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      _setConnected(true);
      // Refetch to catch anything missed while disconnected
      fetchNotifications();
      fetchUnreadCount();
    });

    newSocket.on('disconnect', () => {
      _setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Notification socket connection error:', error.message);
    });

    newSocket.on('new_notification', (notification: Notification) => {
      _handleNewNotification(notification);
    });

    newSocket.on('notification_read', ({ id }: { id: string }) => {
      _handleRemoteRead(id);
    });

    newSocket.on('notifications_all_read', () => {
      _handleRemoteReadAll();
    });

    socket = newSocket;

    // Polling fallback — refetch every 2 minutes to catch any missed events
    const pollInterval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 120_000);

    // Refetch when the browser tab regains visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        fetchUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      newSocket.close();
      socket = null;
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);
};

/**
 * Compatibility hook matching the old NotificationContext's useNotifications()
 * shape, so NotificationBell.tsx only needs targeted changes, not a rewrite.
 */
export const useNotifications = () => {
  const store = useNotificationStore();
  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isConnected: store.isConnected,
    fetchNotifications: () => store.fetchNotifications(),
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    clearNotification: store.clearNotification,
    clearAll: store.clearAll,
  };
};
