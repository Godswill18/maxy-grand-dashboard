import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

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
  | 'general';

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  relatedEntityType?: string;
  relatedEntityId?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Source user reactively from auth store — updates automatically on login/logout
  const currentUser = useAuthStore((state) => state.user);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`${VITE_API_URL}/api/notifications`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setNotifications(response.data.data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  // Socket connection — recreated whenever the logged-in user changes
  useEffect(() => {
    if (!currentUser?._id) return;

    const newSocket = io(VITE_API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      console.log('🔌 Notification socket connected');
      setIsConnected(true);

      // Authenticate and join rooms
      newSocket.emit('authenticate', currentUser._id);
      if (currentUser.hotelId) {
        const hotelId = typeof currentUser.hotelId === 'string'
          ? currentUser.hotelId
          : (currentUser.hotelId as any)._id;
        newSocket.emit('join_hotel', hotelId);
      }
      if (currentUser.role) {
        newSocket.emit('join_role', currentUser.role);
      }

      // Refetch to catch any notifications missed while disconnected
      fetchNotifications();
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Notification socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data: any) => {
      console.log('✅ Notification socket authenticated:', data);
    });

    newSocket.on('new_notification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      setNotifications(prev => [notification, ...prev]);

      // Browser push notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: notification._id,
        });
      }

      // Notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {
        // audio not available — ignore
      }
    });

    setSocket(newSocket);

    // Polling fallback — refetch every 2 minutes to catch any missed events
    const pollInterval = setInterval(fetchNotifications, 120_000);

    // Refetch when the browser tab regains visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') fetchNotifications();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      newSocket.close();
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?._id, currentUser?.hotelId, currentUser?.role, fetchNotifications]);

  // Request browser notification permission once
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Browser notification permission:', permission);
      });
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await axios.patch(
        `${VITE_API_URL}/api/notifications/${id}/read`,
        {},
        { withCredentials: true }
      );
      setNotifications(prev =>
        prev.map(notif => notif._id === id ? { ...notif, read: true } : notif)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch(
        `${VITE_API_URL}/api/notifications/read-all`,
        {},
        { withCredentials: true }
      );
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const clearNotification = useCallback(async (id: string) => {
    try {
      await axios.delete(`${VITE_API_URL}/api/notifications/${id}`, {
        withCredentials: true,
      });
      setNotifications(prev => prev.filter(notif => notif._id !== id));
    } catch (error) {
      console.error('Error clearing notification:', error);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await axios.delete(`${VITE_API_URL}/api/notifications/clear-all`, {
        withCredentials: true,
      });
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
