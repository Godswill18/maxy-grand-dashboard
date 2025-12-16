import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Clock, BedDouble, CreditCard, AlertCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useReceptionistDashboardStore } from "@/store/usereceptionistdashboardStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReceptionistDashboard() {
  const {
    stats,
    checkInActivity,
    weeklyRevenue,
    pendingCheckIns,
    expectedCheckOuts,
    isLoading,
    error,
    fetchDashboardData,
  } = useReceptionistDashboardStore();

  useEffect(() => {
    fetchDashboardData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Error Loading Dashboard</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading && !stats.todayCheckIns.total) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-[400px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Front Desk Dashboard</h1>
          <p className="text-muted-foreground">Manage guest check-ins, bookings, and payments</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            <span className="text-sm">Refreshing...</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCheckIns.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCheckIns.completed} completed, {stats.todayCheckIns.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Check-outs</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCheckOuts.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayCheckOuts.completed} completed, {stats.todayCheckOuts.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
            <BedDouble className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.occupiedRooms.occupied}/{stats.occupiedRooms.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.occupiedRooms.occupancyRate}% occupancy rate
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.todayRevenue.amount)}
            </div>
            <p className={`text-xs ${stats.todayRevenue.percentageChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {stats.todayRevenue.percentageChange >= 0 ? '+' : ''}
              {stats.todayRevenue.percentageChange}% from yesterday
            </p>
          </CardContent>
        </Card> */}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check-in/Check-out Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {checkInActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={checkInActivity}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="time" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="checkins" fill="hsl(var(--success))" name="Check-ins" />
                  <Bar dataKey="checkouts" fill="hsl(var(--warning))" name="Check-outs" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>No activity data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    name="Revenue" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <p>No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-success" />
              Pending Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCheckIns.length > 0 ? (
              <div className="space-y-4">
                {pendingCheckIns.slice(0, 5).map((guest) => (
                  <div 
                    key={guest._id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{guest.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {guest.roomNumber} • {formatTime(guest.checkInDate)}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {guest.confirmationCode}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>No pending check-ins</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Expected Check-outs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expectedCheckOuts.length > 0 ? (
              <div className="space-y-4">
                {expectedCheckOuts.slice(0, 5).map((guest) => (
                  <div 
                    key={guest._id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{guest.guestName}</p>
                      <p className="text-sm text-muted-foreground">
                        Room {guest.roomNumber} • {formatTime(guest.checkOutDate)}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      guest.bookingStatus === "checked-out" 
                        ? "bg-success/10 text-success" 
                        : "bg-warning/10 text-warning"
                    }`}>
                      {guest.bookingStatus === "checked-out" ? "Completed" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <p>No expected check-outs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}