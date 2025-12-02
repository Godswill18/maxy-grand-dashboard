import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Award,
  Star,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePerformanceStore } from "@/store/tipsStore";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

export default function Performance() {
  const {
    stats,
    weeklyRevenue,
    monthlyPerformance,
    highlights,
    loading,
    error,
    fetchPerformanceData,
    fetchDailyRevenue,
    fetchMonthlyPerformance,
    fetchHighlights,
    clearError,
  } = usePerformanceStore();

  const { user } = useAuthStore();

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchPerformanceData(),
          fetchDailyRevenue('week'),
          fetchMonthlyPerformance(6),
          fetchHighlights(),
        ]);
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
        toast.error('Failed to load performance data');
      }
    };

    fetchData();
  }, [fetchPerformanceData, fetchDailyRevenue, fetchMonthlyPerformance, fetchHighlights]);

  // Clear error on unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleRefresh = async () => {
    try {
      await Promise.all([
        fetchPerformanceData(),
        fetchDailyRevenue('week'),
        fetchMonthlyPerformance(6),
        fetchHighlights(),
      ]);
      toast.success('Performance data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  const formatCurrency = (value: number) => {
    return `₦${value.toLocaleString()}`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

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
              ? 'Hotel Performance'
              : 'My Performance'}
          </h2>
          <p className="text-muted-foreground">
            {['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')
              ? "Track your hotel's revenue and performance metrics"
              : 'Track your revenue and performance metrics'}
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <DollarSign className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">{formatCurrency(stats.todayRevenue)}</p>
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.todayRevenueChange)}
                  <span className={`text-sm font-medium ${getChangeColor(stats.todayRevenueChange)}`}>
                    {stats.todayRevenueChange > 0 ? '+' : ''}{stats.todayRevenueChange}%
                  </span>
                  <span className="text-xs text-muted-foreground">from yesterday</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">{formatCurrency(stats.monthlyRevenue)}</p>
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.monthlyRevenueChange)}
                  <span className={`text-sm font-medium ${getChangeColor(stats.monthlyRevenueChange)}`}>
                    {stats.monthlyRevenueChange > 0 ? '+' : ''}{stats.monthlyRevenueChange}%
                  </span>
                  <span className="text-xs text-muted-foreground">from last month</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Average Rating</p>
                <Star className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">{stats.averageRating.toFixed(1)}</p>
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.ratingChange)}
                  <span className={`text-sm font-medium ${getChangeColor(stats.ratingChange)}`}>
                    {stats.ratingChange > 0 ? '+' : ''}{stats.ratingChange.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">from last period</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-muted-foreground">Completed Orders</p>
                <Award className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold">{stats.completedOrders}</p>
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.ordersChange)}
                  <span className={`text-sm font-medium ${getChangeColor(stats.ordersChange)}`}>
                    {stats.ordersChange > 0 ? '+' : ''}{stats.ordersChange}%
                  </span>
                  <span className="text-xs text-muted-foreground">from last month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="orders" fill="hsl(var(--info))" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Highlights */}
      {highlights && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Best Day</p>
                <p className="text-2xl font-bold">{highlights.bestDay.day}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(highlights.bestDay.revenue)} earned
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Most Popular Table</p>
                <p className="text-2xl font-bold">{highlights.mostPopularTable.table}</p>
                <p className="text-sm text-muted-foreground">
                  {highlights.mostPopularTable.orders} orders
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Customer Feedback</p>
                <p className="text-2xl font-bold">{highlights.customerFeedback.rating.toFixed(1)}/5.0</p>
                <p className="text-sm text-muted-foreground">
                  {highlights.customerFeedback.reviews} reviews
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">{formatCurrency(highlights.averageOrderValue)}</p>
                <p className="text-sm text-muted-foreground">per order</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Insights */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Orders (All Time)</p>
                <p className="text-3xl font-bold">{stats.totalOrders.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Completed & paid orders</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Weekly Revenue</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.weeklyRevenue)}</p>
                <div className="flex items-center gap-1">
                  {getChangeIcon(stats.weeklyRevenueChange)}
                  <span className={`text-sm font-medium ${getChangeColor(stats.weeklyRevenueChange)}`}>
                    {stats.weeklyRevenueChange > 0 ? '+' : ''}{stats.weeklyRevenueChange}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last week</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {highlights && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Most Popular Room</p>
                  <p className="text-3xl font-bold">{highlights.mostPopularRoom.room}</p>
                  <p className="text-sm text-muted-foreground">
                    {highlights.mostPopularRoom.orders} orders
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}