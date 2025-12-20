// ✅ UPDATED: NotificationContext.tsx with useStaffStore

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useStaffStore } from '@/store/useUserStore'; // ✅ Using useStaffStore

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
  
  // ✅ Get user from useStaffStore
  // Assuming your auth state stores the current logged-in user
  // You may need to adjust this based on your actual store structure
  const staff = useStaffStore((state) => state.staff);
  const guests = useStaffStore((state) => state.guests);
  
  // ✅ Get current user - adjust this based on how you store current user
  // Option 1: If you have a separate auth store
  // const currentUser = useAuthStore((state) => state.user);
  
  // Option 2: If you store current user ID somewhere and need to fetch
  // For now, I'll assume you have a way to get current user
  // You might need to add a currentUser field to useStaffStore
  const [currentUser, setCurrentUser] = useState<any>(null);

  // ✅ Get current user from localStorage or auth context
  useEffect(() => {
    // This is a placeholder - adjust based on your auth implementation
    const getUserFromAuth = () => {
      try {
        // Method 1: From localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          return JSON.parse(userStr);
        }
        
        // Method 2: From your auth context/store
        // return authStore.user;
        
        return null;
      } catch (error) {
        console.error('Error getting user:', error);
        return null;
      }
    };
    
    const user = getUserFromAuth();
    setCurrentUser(user);
  }, []);

  // ✅ Initialize Socket.IO connection
  useEffect(() => {
    if (!currentUser?._id) return;

    const newSocket = io(VITE_API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to notification server');
      setIsConnected(true);
      
      // ✅ Authenticate with user ID
      newSocket.emit('authenticate', currentUser._id);
      
      // ✅ Join hotel room if user has hotelId
      if (currentUser.hotelId) {
        const hotelId = typeof currentUser.hotelId === 'string' 
          ? currentUser.hotelId 
          : currentUser.hotelId._id;
        newSocket.emit('join_hotel', hotelId);
      }
      
      // ✅ Join role room
      if (currentUser.role) {
        newSocket.emit('join_role', currentUser.role);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔴 Disconnected from notification server');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Authenticated:', data);
    });

    // ✅ Listen for new notifications
    newSocket.on('new_notification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      
      setNotifications(prev => [notification, ...prev]);
      
      // ✅ Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: notification._id,
        });
      }
      
      // ✅ Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (error) {
        console.log('Audio playback error:', error);
      }
    });

    setSocket(newSocket);

    // ✅ Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [currentUser?._id, currentUser?.hotelId, currentUser?.role]);

  // ✅ Fetch notifications from database on mount
  useEffect(() => {
    if (currentUser?._id) {
      fetchNotifications();
    }
  }, [currentUser?._id]);

  // ✅ Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }, []);

  // ✅ Fetch notifications from API
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

  // ✅ Mark notification as read
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

  // ✅ Mark all as read
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

  // ✅ Clear notification
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

  // ✅ Clear all notifications
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