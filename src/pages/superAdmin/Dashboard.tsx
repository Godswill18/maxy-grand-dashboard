import { useEffect, useMemo } from 'react';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  TrendingUp,
  TrendingDown,
  RefreshCw,
  MapPin,
  CalendarDays,
  DollarSign,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
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
} from '@/store/useDashboardStore';
import { formatCurrencyAxis } from '@/lib/chartFormatters';

const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(pct)), isPositive: pct >= 0 };
};

const formatNaira = (value: number) =>
  `₦${value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(1)}M`
    : value >= 1_000
    ? `${(value / 1_000).toFixed(0)}k`
    : value.toLocaleString()}`;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
const currentYear = new Date().getFullYear();
const currentMonthIndex = new Date().getMonth() + 1; // 1-based

const formattedDate = new Date().toLocaleDateString('en-GB', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});

// Tooltip shared style
const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '13px',
};

export default function Dashboard() {
  const {
    stats,
    bookingChartData,
    revenueChartData,
    branchMonthlyRevenue,
    isLoading,
    branchRevenueLoading,
    error,
  } = useDashboardState();
  const { fetchDashboardData, fetchBranchMonthlyRevenue } = useDashboardActions();

  useEffect(() => {
    fetchDashboardData();
    fetchBranchMonthlyRevenue();
  }, [fetchDashboardData, fetchBranchMonthlyRevenue]);

  const handleRefresh = () => {
    fetchDashboardData();
    fetchBranchMonthlyRevenue();
  };

  const todayTrend = calculateTrend(stats.bookingsToday || 0, stats.bookingsYesterday || 0);
  const weekTrend  = calculateTrend(stats.bookingsThisWeek || 0, stats.bookingsLastWeek || 0);
  const monthTrend = calculateTrend(stats.bookingsThisMonth || 0, stats.bookingsLastMonth || 0);

  const totalMonthRevenue = useMemo(
    () => branchMonthlyRevenue.reduce((sum, b) => sum + b.revenue, 0),
    [branchMonthlyRevenue]
  );

  const maxBranchRevenue = useMemo(
    () => Math.max(...branchMonthlyRevenue.map((b) => b.revenue), 1),
    [branchMonthlyRevenue]
  );

  // Highlight current month in the yearly revenue chart
  const enhancedRevenueData = useMemo(
    () =>
      revenueChartData.map((d, i) => ({
        ...d,
        isCurrent: i + 1 === currentMonthIndex,
      })),
    [revenueChartData]
  );

  return (
    <div className="space-y-7 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
            SuperAdmin Dashboard
          </p>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Maxy Grand Hotel &mdash; {formattedDate}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading || branchRevenueLoading}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading || branchRevenueLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── Error ── */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="destructive" size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Top KPI Row ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Key Performance Indicators
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-muted">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <div className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '0ms' }}>
                <StatCard
                  title="Revenue This Month"
                  value={formatNaira(totalMonthRevenue)}
                  icon={DollarSign}
                  color="success"
                  subtitle={currentMonthName}
                  trend={monthTrend}
                />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '50ms' }}>
                <StatCard
                  title="Bookings This Month"
                  value={stats.bookingsThisMonth?.toLocaleString() || '0'}
                  icon={CalendarDays}
                  color="primary"
                  trend={monthTrend}
                />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                <StatCard
                  title="Hotel Branches"
                  value={stats.hotelBranches?.toLocaleString() || '0'}
                  icon={Building2}
                  color="info"
                  subtitle="Active locations"
                />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '150ms' }}>
                <StatCard
                  title="Total Staff"
                  value={stats.totalStaff?.toLocaleString() || '0'}
                  icon={Users}
                  color="secondary"
                  subtitle="Across all branches"
                />
              </div>
              <div className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: '200ms' }}>
                <StatCard
                  title="Available Rooms"
                  value={stats.availableRooms?.toLocaleString() || '0'}
                  icon={BedDouble}
                  color="warning"
                  subtitle={`of ${stats.totalRooms || 0} total rooms`}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Secondary Stats Grid ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Staff & Room Breakdown
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-muted">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-12" />
                </CardContent>
              </Card>
            ))
          ) : (
            [
              { title: 'Branch Managers', value: stats.branchManagers?.toLocaleString() || '0', icon: UserCheck, color: 'secondary' as const },
              { title: 'Cleaners',         value: stats.cleaners?.toLocaleString()      || '0', icon: Sparkles,   color: 'info'      as const },
              { title: 'Receptionists',    value: stats.receptionists?.toLocaleString() || '0', icon: UserCircle, color: 'primary'   as const },
              { title: 'Waiters',          value: stats.waiters?.toLocaleString()       || '0', icon: Coffee,     color: 'warning'   as const },
              { title: 'Rooms to Clean',   value: stats.roomsToClean?.toLocaleString()  || '0', icon: AlertCircle,color: 'warning'   as const },
            ].map((s, i) => (
              <div key={s.title} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${i * 40}ms` }}>
                <StatCard {...s} compact />
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Branch Performance Section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Branch Performance
            </p>
            <h2 className="text-base font-semibold text-foreground">
              {currentMonthName} {currentYear} — Revenue & Bookings by Location
            </h2>
          </div>
        </div>

        {branchRevenueLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : branchMonthlyRevenue.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No revenue data yet for {currentMonthName}</p>
              <p className="text-sm mt-1">Paid bookings this month will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {branchMonthlyRevenue.map((branch, i) => {
              const pct = Math.round((branch.revenue / maxBranchRevenue) * 100);
              return (
                <Card
                  key={branch._id}
                  className="hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Branch header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{branch.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{branch.city}
                        </p>
                      </div>
                      <Badge
                        variant={branch.isActive ? 'default' : 'secondary'}
                        className={`shrink-0 text-xs ${branch.isActive ? 'bg-green-500/15 text-green-700 border-green-300' : ''}`}
                      >
                        {branch.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {/* Revenue */}
                    <div>
                      <p className="text-2xl font-bold text-green-600">
                        ₦{branch.revenue.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {branch.bookings} booking{branch.bookings !== 1 ? 's' : ''} this month
                      </p>
                    </div>

                    {/* Revenue bar */}
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Share of total revenue</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Monthly Revenue This Year */}
        <Card className="animate-in fade-in slide-in-from-left duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Revenue — {currentYear}</CardTitle>
            <CardDescription>Paid bookings summed by month. Current month highlighted.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enhancedRevenueData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatCurrencyAxis}
                    width={55}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} name="Revenue">
                    {enhancedRevenueData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isCurrent ? 'hsl(142 71% 45%)' : 'hsl(var(--primary) / 0.55)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Branch Revenue Comparison */}
        <Card className="animate-in fade-in slide-in-from-right duration-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Branch Revenue — {currentMonthName}</CardTitle>
            <CardDescription>How much each location earned this month.</CardDescription>
          </CardHeader>
          <CardContent>
            {branchRevenueLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : branchMonthlyRevenue.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                No branch revenue data for {currentMonthName}.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={branchMonthlyRevenue}
                  layout="vertical"
                  margin={{ left: 10, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis
                    type="number"
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatCurrencyAxis}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: number) => [`₦${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(142 71% 45%)" radius={[0, 6, 6, 0]} name="Revenue" barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Booking Trends ── */}
      <Card className="animate-in fade-in slide-in-from-bottom duration-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Booking Trends — Last 7 Days</CardTitle>
          <CardDescription>Daily, weekly cumulative, and monthly cumulative bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[280px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={bookingChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 11 }} />
                <YAxis className="text-xs" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="daily"   stroke="hsl(var(--primary))"   strokeWidth={2} dot={false} name="Daily" />
                <Line type="monotone" dataKey="weekly"  stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} name="Weekly (Cumulative)" />
                <Line type="monotone" dataKey="monthly" stroke="hsl(142 71% 45%)"      strokeWidth={2} dot={false} name="Monthly (Cumulative)" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Overview ── */}
      <Card className="animate-in fade-in slide-in-from-bottom duration-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Booking Quick Overview</CardTitle>
          <CardDescription>Today, this week, and this month at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
              {[
                { label: "Today's Bookings",  value: stats.bookingsToday,     trend: todayTrend,  sub: 'vs yesterday',   color: 'text-primary' },
                { label: 'This Week',         value: stats.bookingsThisWeek,  trend: weekTrend,   sub: 'vs last week',   color: 'text-secondary' },
                { label: 'This Month',        value: stats.bookingsThisMonth, trend: monthTrend,  sub: 'vs last month',  color: 'text-green-600' },
              ].map(({ label, value, trend, sub, color }) => (
                <div key={label} className="px-6 py-4 first:pl-0 last:pr-0 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{label}</p>
                  <p className={`text-3xl font-bold ${color}`}>{value ?? 0}</p>
                  <p className={`text-xs font-medium flex items-center gap-1 ${trend.isPositive ? 'text-green-600' : 'text-destructive'}`}>
                    {trend.isPositive
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {trend.isPositive ? '+' : ''}{trend.value}% {sub}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
