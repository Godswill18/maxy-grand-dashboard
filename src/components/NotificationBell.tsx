// ✅ UPDATED: NotificationBell.tsx with enhanced features

import { Bell, Check, Trash2, X, Wifi, WifiOff } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
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

const notificationIcons: Record<string, string> = {
  booking: '📅',
  checkin: '🔑',
  checkout: '👋',
  cleaning_task: '🧹',
  cleaning_completed: '✨',
  payment: '💳',
  order: '🍽️',
  order_ready: '✅',
  request: '🔧',
  request_completed: '🎉',
  shift: '⏰',
  general: '📢',
};

const priorityColors: Record<string, string> = {
  low: 'text-blue-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
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
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={cn(
                  "flex gap-3 p-4 cursor-pointer transition-colors",
                  !notification.read && "bg-primary/5 hover:bg-primary/10"
                )}
                onClick={() => !notification.read && markAsRead(notification._id)}
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
                    {notification.priority && notification.priority !== 'medium' && (
                      <span className={cn(
                        "text-xs",
                        priorityColors[notification.priority]
                      )}>
                        {'!'.repeat(notification.priority === 'urgent' ? 3 : notification.priority === 'high' ? 2 : 1)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {notification.message}
                  </p>
                  
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
                onClick={() => {
                  // Navigate to notifications page if you have one
                  // window.location.href = '/notifications';
                }}
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