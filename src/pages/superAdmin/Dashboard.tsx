import { useEffect } from 'react';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserCircle,
  Building2,
  Bed,
  Sparkles,
  UserCheck,
  Coffee,
  BedDouble,
  AlertCircle,
  LucideIcon, // Import LucideIcon for type
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  useDashboardState,
  useDashboardActions,
} from '@/store/useDashboardStore'; // Adjust path
import { StatCardSkeleton } from '@/components/skeleton/StatCardSkeleton'; // Adjust path
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

// Helper function to calculate trends
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) {
    return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  }
  const percentageChange = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(percentageChange)),
    isPositive: percentageChange >= 0,
  };
};

export default function Dashboard() {
  // --- Get State & Actions from Store ---
  const { stats, bookingChartData, revenueChartData, isLoading, error } =
    useDashboardState();
  const { fetchDashboardData } = useDashboardActions();

  // --- Fetch Data on Mount ---
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Map dynamic data to the static structure ---
  // This array connects your backend data (stats.totalStaff)
  // to the frontend UI (icon, color, etc.)
  const dynamicStats = [
    {
      title: 'Total Staff',
      value: stats.totalStaff?.toLocaleString() || '0',
      icon: Users,
      color: 'primary' as const,
    },
    {
      title: 'Total Users',
      value: stats.totalUsers?.toLocaleString() || '0',
      icon: UserCircle,
      color: 'info' as const,
    },
    {
      title: 'Branch Managers',
      value: stats.branchManagers?.toLocaleString() || '0',
      icon: UserCheck,
      color: 'secondary' as const,
    },
    {
      title: 'Hotel Branches',
      value: stats.hotelBranches?.toLocaleString() || '0',
      icon: Building2,
      color: 'success' as const,
    },
    {
      title: 'Total Rooms',
      value: stats.totalRooms?.toLocaleString() || '0',
      icon: Bed,
      color: 'primary' as const,
    },
    {
      title: 'Cleaners',
      value: stats.cleaners?.toLocaleString() || '0',
      icon: Sparkles,
      color: 'info' as const,
    },
    {
      title: 'Receptionists',
      value: stats.receptionists?.toLocaleString() || '0',
      icon: UserCheck,
      color: 'secondary' as const,
    },
    {
      title: 'Waiters',
      value: stats.waiters?.toLocaleString() || '0',
      icon: Coffee,
      color: 'warning' as const,
    },
    {
      title: 'Available Rooms',
      value: stats.availableRooms?.toLocaleString() || '0',
      icon: BedDouble,
      color: 'success' as const,
    },
    {
      title: 'To Be Cleaned',
      value: stats.roomsToClean?.toLocaleString() || '0',
      icon: AlertCircle,
      color: 'warning' as const,
    },
  ];

  // Calculate trends for Quick Overview
  const todayTrend = calculateTrend(
    stats.bookingsToday || 0,
    stats.bookingsYesterday || 0
  );
  const weekTrend = calculateTrend(
    stats.bookingsThisWeek || 0,
    stats.bookingsLastWeek || 0
  );
  const monthTrend = calculateTrend(
    stats.bookingsThisMonth || 0,
    stats.bookingsLastMonth || 0
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading
          ? // Show skeletons
            Array.from({ length: 10 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))
          : // Show real data
            dynamicStats.map((stat, index) => (
              <div
                key={stat.title}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <StatCard {...stat} />
              </div>
            ))}
      </div>

      {/* Error Display */}
      {error && (
         <Card className="border-destructive bg-destructive/10">
           <CardHeader>
             <CardTitle className="text-destructive">Error</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-destructive">{error}</p>
             <Button variant="destructive" onClick={fetchDashboardData} className="mt-4">
               Try Again
             </Button>
           </CardContent>
         </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <Card className="animate-in fade-in slide-in-from-left duration-500">
          <CardHeader>
            <CardTitle>Booking Trends (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={bookingChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="daily"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Daily"
                  />
                  <Line
                    type="monotone"
                    dataKey="weekly"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Weekly (Cumulative)"
                  />
                  <Line
                    type="monotone"
                    dataKey="monthly"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    name="Monthly (Cumulative)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="animate-in fade-in slide-in-from-right duration-500">
          <CardHeader>
            <CardTitle>Monthly Revenue (This Year)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => `₦${value.toLocaleString()}`}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="hsl(var(--success))"
                    radius={[8, 8, 0, 0]}
                    name="Revenue"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="animate-in fade-in slide-in-from-bottom duration-500">
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Today's Bookings</p>
                <p className="text-2xl font-bold text-primary">
                  {stats.bookingsToday}
                </p>
                <p className={`text-xs ${todayTrend.isPositive ? 'text-success' : 'text-destructive'}`}>
                  {todayTrend.isPositive ? '+' : ''}{todayTrend.value}% from yesterday
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-secondary">
                  {stats.bookingsThisWeek}
                </p>
                <p className={`text-xs ${weekTrend.isPositive ? 'text-success' : 'text-destructive'}`}>
                  {weekTrend.isPositive ? '+' : ''}{weekTrend.value}% from last week
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-info">
                  {stats.bookingsThisMonth}
                </p>
                <p className={`text-xs ${monthTrend.isPositive ? 'text-success' : 'text-destructive'}`}>
                  {monthTrend.isPositive ? '+' : ''}{monthTrend.value}% from last month
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}