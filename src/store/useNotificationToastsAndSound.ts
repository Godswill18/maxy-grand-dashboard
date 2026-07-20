import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useNotificationStore } from './useNotificationStore';
import { useAuthStore } from './useAuthStore';
import { playNotificationSound } from '@/lib/notificationSound';
import { notificationIcons } from '@/lib/notificationIcons';
import { getNotificationRoute } from '@/components/utils/getNotificationRoute';

/**
 * Drives the toast + sound side effects for every incoming notification.
 * Call once at the app root (see App.tsx's AuthenticatedLayout), next to
 * useNotificationSocket() — the store itself can't call useNavigate()/toast()
 * since it isn't a React component.
 */
export const useNotificationToastsAndSound = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const lastReceived = useNotificationStore((state) => state.lastReceived);
  const lastHandledId = useRef<string | null>(null);

  useEffect(() => {
    if (!lastReceived || lastReceived._id === lastHandledId.current) return;
    lastHandledId.current = lastReceived._id;

    const priority = lastReceived.priority || 'medium';
    const route = user ? getNotificationRoute(user.role, lastReceived.relatedEntityType, lastReceived.relatedEntityId) : null;

    toast(lastReceived.title, {
      description: lastReceived.message,
      duration: priority === 'urgent' ? 8000 : 5000,
      icon: notificationIcons[lastReceived.type] || '📢',
      action: route
        ? { label: 'View', onClick: () => navigate(route) }
        : undefined,
    });

    playNotificationSound(priority);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastReceived]);
};
