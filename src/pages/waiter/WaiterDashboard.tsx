import { useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  UtensilsCrossed, 
  CalendarDays, 
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Package
} from "lucide-react";
import { useDashboardStore } from "@/store/waiterDashboardStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { 
  DashboardStatsSkeleton, 
  RecentOrdersSkeleton, 
  QuickStatsSkeleton 
} from "@/components/skeleton/waiterDashboardSkeleton";

export default function WaiterDashboard() {
  const {
    stats,
    recentOrders,
    loading,
    error,
    fetchDashboardStats,
    fetchRecentOrders,
    refreshDashboard,
    clearError
  } = useDashboardStore();

  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchRecentOrders(4)
        ]);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast.error('Failed to load dashboard data');
      }
    };

    fetchData();
  }, [fetchDashboardStats, fetchRecentOrders]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleRefresh = async () => {
    try {
      await refreshDashboard();
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    }
  };

  const getOrderLocation = (order: typeof recentOrders[0]) => {
    if (order.orderType === 'table service') {
      return `Table ${order.tableNumber}`;
    } else if (order.orderType === 'room service') {
      return `Room ${order.roomNumber}`;
    } else {
      return `Pickup: ${order.customerName}`;
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending': return { label: 'Pending', color: 'text-warning bg-warning/10' };
      case 'confirmed': return { label: 'Confirmed', color: 'text-info bg-info/10' };
      case 'preparing': return { label: 'Preparing', color: 'text-primary bg-primary/10' };
      case 'ready': return { label: 'Ready', color: 'text-purple-600 bg-purple-100' };
      case 'delivered': return { label: 'Completed', color: 'text-success bg-success/10' };
      case 'cancelled': return { label: 'Cancelled', color: 'text-destructive bg-destructive/10' };
      default: return { label: status, color: 'text-muted-foreground bg-muted' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getItemsCount = (order: typeof recentOrders[0]) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Build stats array
  const statsArray = stats ? [
    {
      title: "Total Orders Today",
      value: stats.totalOrdersToday.toString(),
      icon: ClipboardList,
      color: "primary" as const,
      trend: { value: Math.abs(stats.todayChange), isPositive: stats.todayChange >= 0 },
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toString(),
      icon: Clock,
      color: "warning" as const,
    },
    {
      title: "Completed Orders",
      value: stats.completedOrders.toString(),
      icon: CheckCircle,
      color: "success" as const,
      trend: { value: Math.abs(stats.completedChange), isPositive: stats.completedChange >= 0 },
    },
    {
      title: "Tables Assigned",
      value: stats.tablesAssigned.toString(),
      icon: UtensilsCrossed,
      color: "info" as const,
    },
    {
      title: "In Progress",
      value: stats.inProgressOrders.toString(),
      icon: TrendingUp,
      color: "secondary" as const,
    },
  ] : [];

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')
              ? 'Hotel Dashboard'
              : 'My Dashboard'}
          </h2>
          <p className="text-muted-foreground">
            {['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')
              ? 'Overview of hotel operations'
              : 'Overview of your daily activities'}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      {loading && !stats ? (
        <DashboardStatsSkeleton />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statsArray.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      {/* Recent Orders */}
      {loading && recentOrders.length === 0 ? (
        <RecentOrdersSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/waiter/orders')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No recent orders</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const statusInfo = getStatusDisplay(order.orderStatus);
                  return (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/waiter/orders/' + order._id)}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">#{order._id.slice(-6).toUpperCase()}</span>
                          <span className="text-sm text-muted-foreground">
                            {getOrderLocation(order)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getItemsCount(order)} items • {formatTime(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-lg">
                          ₦{order.totalAmount.toLocaleString()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/waiter/orders')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">View All Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Manage and update order statuses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate('/waiter/performance')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-success/10 rounded-lg">
                <TrendingUp className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">View Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Check your tips and performance metrics
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Quick Stats */}
      {loading && !stats ? (
        <QuickStatsSkeleton />
      ) : stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Ready for Service</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.readyOrders}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orders ready to deliver
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')
                      ? 'Table Service Orders'
                      : 'My Reservations'}
                  </p>
                  <p className="text-2xl font-bold text-info">
                    {stats.reservationsToday}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Table orders today
                  </p>
                </div>
                <div className="p-3 bg-info/10 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Being Prepared</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.inProgressOrders}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Orders in kitchen
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <UtensilsCrossed className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}