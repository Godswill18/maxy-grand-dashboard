import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  useReportState,
  useReportActions,
  ReportPeriod,
} from '@/store/useReportStore'; // Using your path
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';

// Colors for the Pie chart
const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--info))',
  'hsl(var(--warning))',
];
// Using VITE_API_URL from the store, but defining a fallback here just in case
const BACKEND_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export default function Reports() {
  // Get state and actions from the Zustand store
  const { timeseriesData, sourceData, period, isLoading, error } =
    useReportState();
  const { setPeriod, fetchReportData, initSocket, disconnectSocket, exportToExcel } =
    useReportActions();

  // On component mount:
  // 1. Fetch initial data for the default period ('month')
  // 2. Initialize the socket connection
  useEffect(() => {
    fetchReportData();
    initSocket(BACKEND_URL);

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-card p-2 text-card-foreground shadow-sm">
          <p className="font-bold">{label}</p>
          <p className="text-sm" style={{ color: 'hsl(var(--primary))' }}>
            Revenue: ${payload[0].value.toLocaleString()}
          </p>
          <p className="text-sm" style={{ color: 'hsl(var(--secondary))' }}>
            Bookings: {payload[1].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground">
            Real-time performance analytics and insights
          </p>
        </div>
        <Button onClick={exportToExcel} disabled={isLoading || timeseriesData.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* --- Period Toggle --- */}
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={(value: ReportPeriod) => {
            if (value) setPeriod(value);
            fetchReportData();
          }}
          className="w-full sm:w-auto"
        >
          <ToggleGroupItem value="day" className="flex-1">Day</ToggleGroupItem>
          <ToggleGroupItem value="month" className="flex-1">Month</ToggleGroupItem>
          <ToggleGroupItem value="year" className="flex-1">Year</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* --- Error Display --- */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button variant="destructive" onClick={fetchReportData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* --- Main Analytics Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* --- Revenue & Bookings Chart --- */}
        <Card className="lg:col-span-2 animate-in fade-in slide-in-from-top">
          <CardHeader>
            <CardTitle>Cash Inflow & Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeseriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" />
                  {/* Primary Y-Axis (Revenue) */}
                  <YAxis
                    yAxisId="left"
                    className="text-xs"
                    tickFormatter={(value) => `₦ ${(value / 1000).toFixed(0)}k`}
                  />
                  {/* Secondary Y-Axis (Bookings) */}
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="text-xs"
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    yAxisId="left"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalBookings"
                    yAxisId="right"
                    stroke="hsl(var(--secondary))"
                    fill="hsl(var(--secondary))"
                    fillOpacity={0.6}
                    name="Bookings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* --- Booking Types Chart --- */}
        <Card className="animate-in fade-in slide-in-from-right">
          <CardHeader>
            {/* FIX: Title corrected to match controller data */}
            <CardTitle>Booking Types</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}