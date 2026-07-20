import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { notificationIcons, priorityColors } from "@/lib/notificationIcons";
import { getNotificationRoute } from "@/components/utils/getNotificationRoute";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore, type NotificationFilter } from "@/store/useNotificationStore";

export default function Notifications() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const {
    notifications,
    filter,
    isLoading,
    page,
    totalPages,
    setFilter,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotificationStore();

  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchNotifications({ page: 1, search });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchNotifications({ page: 1, search });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleItemClick = (notification: (typeof notifications)[number]) => {
    if (!notification.read) markAsRead(notification._id);
    if (!user) return;
    const route = getNotificationRoute(user.role, notification.relatedEntityType, notification.relatedEntityId);
    if (route) navigate(route);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Notifications
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => markAllAsRead()}>
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
          <Button variant="outline" size="sm" onClick={() => deleteAllRead()}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete read
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as NotificationFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="read">Read</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-2">
        {notifications.length === 0 && !isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification._id}
              className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                !notification.read && "bg-primary/5 border-primary/20"
              )}
              onClick={() => handleItemClick(notification)}
            >
              <CardContent className="p-4 flex gap-3 items-start">
                <div className="text-2xl flex-shrink-0">
                  {notificationIcons[notification.type] || "📢"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm", !notification.read && "font-semibold")}>
                      {notification.title}
                    </p>
                    {notification.priority && notification.priority !== "medium" && (
                      <span className={cn("text-xs", priorityColors[notification.priority])}>
                        {"!".repeat(notification.priority === "urgent" ? 3 : notification.priority === "high" ? 2 : 1)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification._id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => fetchNotifications({ page: page - 1, search })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => fetchNotifications({ page: page + 1, search })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
