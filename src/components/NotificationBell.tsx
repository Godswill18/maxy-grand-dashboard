// ✅ UPDATED: NotificationBell.tsx with enhanced features

import { Bell, Check, X, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { getNotificationRoute } from '@/components/utils/getNotificationRoute';
import { getNotificationsRoute } from '@/components/utils/GetprofileRoute';
import { notificationIcons, priorityColors } from '@/lib/notificationIcons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  checkout: "Guest Checkout",
  "guest-request": "Guest Cleaning Request",
  "staff-request": "Receptionist Request",
  manual: "Manual",
};

export const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    clearNotification
  } = useNotifications();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Dropdown is a quick-glance preview; the full list/filter/search lives on
  // the dedicated notification-center page (see Notifications.tsx).
  const recent = notifications.slice(0, 5);

  const handleItemClick = (notification: (typeof notifications)[number]) => {
    if (!notification.read) markAsRead(notification._id);
    if (!user) return;
    const route = getNotificationRoute(user.role, notification.relatedEntityType, notification.relatedEntityId);
    if (route) navigate(route);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {/* ✅ Connection indicator */}
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background",
              isConnected ? "bg-green-500" : "bg-gray-400"
            )}
            title={isConnected ? "Connected" : "Disconnected"}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notifications</h3>
            {!isConnected && (
              <WifiOff className="h-4 w-4 text-muted-foreground"  />
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            recent.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={cn(
                  "flex gap-3 p-4 cursor-pointer transition-colors",
                  !notification.read && "bg-primary/5 hover:bg-primary/10"
                )}
                onClick={() => handleItemClick(notification)}
              >
                {/* Icon */}
                <div className="text-2xl flex-shrink-0">
                  {notificationIcons[notification.type] || '📢'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                      "font-medium text-sm",
                      !notification.read && "font-semibold"
                    )}>
                      {notification.title}
                    </p>
                    {/* ✅ Priority indicator */}
                    {notification.priority && (
                      <span className={cn(
                        "text-[10px] uppercase tracking-wide flex-shrink-0",
                        priorityColors[notification.priority]
                      )}>
                        {notification.priority !== 'medium' &&
                          '!'.repeat(notification.priority === 'urgent' ? 3 : notification.priority === 'high' ? 2 : 1) + ' '}
                        {notification.priority}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {notification.message}
                  </p>

                  {/* Structured fields (Room Number, Category, Branch,
                      Request Type, Status) — currently only populated on
                      housekeeping/cleaning notifications' metadata. */}
                  {(notification.metadata?.roomNumber || notification.metadata?.branchName) && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground mt-1">
                      {notification.metadata?.roomNumber && (
                        <span>Room {notification.metadata.roomNumber}</span>
                      )}
                      {notification.metadata?.roomCategory && (
                        <span>· {notification.metadata.roomCategory}</span>
                      )}
                      {notification.metadata?.branchName && (
                        <span>· {notification.metadata.branchName}</span>
                      )}
                      {notification.metadata?.requestType && (
                        <span>· {REQUEST_TYPE_LABELS[notification.metadata.requestType] || notification.metadata.requestType}</span>
                      )}
                      {notification.metadata?.status && (
                        <span>· {notification.metadata.status}</span>
                      )}
                    </div>
                  )}

                  {notification.metadata?.checkoutTime && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Checked out {formatDistanceToNow(new Date(notification.metadata.checkoutTime), { addSuffix: true })}
                    </p>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>

                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notification._id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => user && navigate(getNotificationsRoute(user.role))}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
