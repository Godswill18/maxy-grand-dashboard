import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { io, Socket } from 'socket.io-client';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

/**
 * Hook to handle force logout events from the server
 * Listens for shift end events and logs user out immediately
 * Should be used at the root level (App.tsx or MainLayout)
 */
export const useForceLogout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Create socket connection
    const socket: Socket = io(VITE_API_URL, { 
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('🔌 Force logout listener connected:', socket.id);
      
      // Join user-specific room
      socket.emit('join', `user:${user._id}`);
    });

    // ✅ Listen for force logout events
    socket.on(`user:${user._id}:force:logout`, async (data: any) => {
      console.log('🚪 FORCE LOGOUT EVENT RECEIVED:', data);
      
      // Show notification
      toast.error(data.message || 'Your shift has ended. You have been logged out.', {
        duration: 5000,
        // important: true,
      });

      // Wait a moment for user to see the message
      setTimeout(async () => {
        // Perform logout
        await logout();
        
        // Redirect to login
        navigate('/login', { 
          replace: true,
          state: { 
            message: data.message,
            reason: data.reason,
          }
        });

        // Reload page to clear all state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 2000); // 2 second delay to show toast
    });

    // Also listen for general force logout event
    socket.on('force:logout', async (data: any) => {
      console.log('🚪 FORCE LOGOUT (GENERAL) EVENT RECEIVED:', data);
      
      toast.error(data.message || 'You have been logged out.', {
        duration: 5000,
        // important: true,
      });

      setTimeout(async () => {
        await logout();
        navigate('/login', { replace: true });
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }, 2000);
    });

    // Listen for user status changes
    socket.on(`user:${user._id}:status:changed`, (data: any) => {
      console.log('📊 User status changed:', data);
      
      if (!data.isActive) {
        console.log('⚠️ User set to inactive');
        // The force logout event will handle the actual logout
      }
    });

    socket.on('disconnect', () => {
      console.log('🔌 Force logout listener disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up force logout listener');
      socket.off(`user:${user._id}:force:logout`);
      socket.off('force:logout');
      socket.off(`user:${user._id}:status:changed`);
      socket.disconnect();
    };
  }, [user, logout, navigate]);
};