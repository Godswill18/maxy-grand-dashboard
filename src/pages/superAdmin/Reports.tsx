import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  DollarSign,
  CalendarDays,
  TrendingUp,
  Award,
  AlertCircle,
  Building2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  useReportState,
  useReportActions,
  ReportPeriod,
  TimeSeriesData,
} from "@/store/useReportStore";
import { useBranchStore } from "@/store/useBranchStore";
import { cn } from "@/lib/utils";

const BACKEND_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";

const DONUT_COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444"];
const BAR_COLORS   = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899"];

const PERIOD_TABS: { key: ReportPeriod; label: string }[] = [
  { key: "day",   label: "Day"   },
  { key: "week",  label: "Week"  },
  { key: "month", label: "Month" },
  { key: "year",  label: "Year"  },
];

// ── Custom tooltip for Area chart ─────────────────────────────────────────────
const AreaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-card-foreground min-w-[160px]">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold ml-auto pl-3">
            {p.dataKey === "totalRevenue" ? `₦${p.value.toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Custom tooltip for Branch bar chart ───────────────────────────────────────
const BranchTooltip = ({ active, payload, label, metric }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-lg text-card-foreground min-w-[180px]">
      <p className="text-xs font-semibold text-muted-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.fill }} />
          <span className="text-muted-foreground truncate max-w-[100px]">{p.name}:</span>
          <span className="font-semibold ml-auto pl-2">
            {metric === "revenue" ? `₦${Number(p.value).toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Reports() {
  const {
    timeseriesData,
    sourceData,
    period,
    isLoading,
    error,
    selectedHotelId,
    branchComparison,
    isBranchLoading,
  } = useReportState();
  const {
    setPeriod,
    fetchReportData,
    initSocket,
    disconnectSocket,
    exportToExcel,
    setSelectedHotel,
    fetchBranchComparison,
  } = useReportActions();

  const { branches, fetchBranches } = useBranchStore();
  const [branchMetric, setBranchMetric] = useState<"revenue" | "bookings">("revenue");

  useEffect(() => {
    if (branches.length === 0) fetchBranches();
    fetchReportData();
    fetchBranchComparison(8);
    initSocket(BACKEND_URL);
    return () => disconnectSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── KPI values derived from timeseries ────────────────────────────────────
  const kpis = useMemo(() => {
    const totalRevenue  = timeseriesData.reduce((s, r) => s + r.totalRevenue,  0);
    const totalBookings = timeseriesData.reduce((s, r) => s + r.totalBookings, 0);
    const avgValue      = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;
    const best          = timeseriesData.reduce<TimeSeriesData | null>(
      (b, r) => (!b || r.totalRevenue > b.totalRevenue ? r : b),
      null
    );
    return { totalRevenue, totalBookings, avgValue, best };
  }, [timeseriesData]);

  // ── Branch comparison chart data ──────────────────────────────────────────
  const branchChartData = useMemo(() => {
    if (!branchComparison.length) return [];
    const allLabels = [
      ...new Set(branchComparison.flatMap((b) => b.timeseries.map((t) => t.label))),
    ].sort();
    return allLabels.map((label) => {
      const point: Record<string, string | number> = { label };
      branchComparison.forEach((branch) => {
        const match = branch.timeseries.find((t) => t.label === label);
        point[branch.branchName] = match
          ? branchMetric === "revenue"
            ? match.totalRevenue
            : match.totalBookings
          : 0;
      });
      return point;
    });
  }, [branchComparison, branchMetric]);

  // ── Donut total (center label) ────────────────────────────────────────────
  const donutTotal = sourceData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time performance analytics and insights</p>
        </div>
        <Button onClick={exportToExcel} disabled={isLoading || timeseriesData.length === 0} size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* ── Hotel / Branch Selector ─────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {[{ _id: null as string | null, name: "All Hotels" }, ...branches].map((b) => (
          <button
            key={b._id ?? "all"}
            onClick={() => setSelectedHotel(b._id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              selectedHotelId === b._id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* ── KPI Summary Row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Revenue",
            value: `₦${kpis.totalRevenue.toLocaleString()}`,
            color: "text-green-600",
            bg:    "bg-green-50",
            border:"border-l-green-400",
            icon:  <DollarSign className="h-5 w-5 text-green-500" />,
          },
          {
            label: "Total Bookings",
            value: kpis.totalBookings.toString(),
            color: "text-blue-600",
            bg:    "bg-blue-50",
            border:"border-l-blue-400",
            icon:  <CalendarDays className="h-5 w-5 text-blue-500" />,
          },
          {
            label: "Avg Booking Value",
            value: `₦${kpis.avgValue.toLocaleString()}`,
            color: "text-purple-600",
            bg:    "bg-purple-50",
            border:"border-l-purple-400",
            icon:  <TrendingUp className="h-5 w-5 text-purple-500" />,
          },
          {
            label: "Best Period",
            value: kpis.best?.label ?? "—",
            sub:   kpis.best ? `₦${kpis.best.totalRevenue.toLocaleString()}` : undefined,
            color: "text-amber-600",
            bg:    "bg-amber-50",
            border:"border-l-amber-400",
            icon:  <Award className="h-5 w-5 text-amber-500" />,
          },
        ].map((card) => (
          <Card key={card.label} className={cn("border-l-4", card.border)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", card.bg)}>
                {card.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight truncate">{card.label}</p>
                <p className={cn("text-lg font-bold leading-tight truncate", card.color)}>{card.value}</p>
                {card.sub && <p className="text-xs text-muted-foreground">{card.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Period Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {PERIOD_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              period === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Error State ─────────────────────────────────────────────────────── */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-5 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Error loading data</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={fetchReportData} variant="outline" size="sm" className="ml-auto shrink-0">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Main Charts Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area Chart — Cash Inflow & Bookings */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Cash Inflow & Bookings</CardTitle>
            <p className="text-xs text-muted-foreground">Revenue vs booking volume over time</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : timeseriesData.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <TrendingUp className="h-8 w-8 opacity-30" />
                <p className="text-sm">No data for this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeseriesData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                    width={56}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                  />
                  <Tooltip content={<AreaTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    yAxisId="left"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalBookings"
                    yAxisId="right"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#bookingsGradient)"
                    name="Bookings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Donut Chart — Booking Types */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Booking Types</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution by booking channel</p>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : sourceData.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <CalendarDays className="h-8 w-8 opacity-30" />
                <p className="text-sm">No booking data</p>
              </div>
            ) : (
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={sourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                    >
                      {sourceData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        background: "hsl(var(--card))",
                        color: "hsl(var(--card-foreground))",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: 0, height: 220 }}>
                  <p className="text-2xl font-bold text-foreground">{donutTotal}</p>
                  <p className="text-xs text-muted-foreground">bookings</p>
                </div>
                {/* Legend */}
                <div className="mt-3 space-y-1.5">
                  {sourceData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                        <span className="capitalize text-muted-foreground">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{d.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({donutTotal > 0 ? ((d.value / donutTotal) * 100).toFixed(0) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Branch Weekly Comparison ─────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Branch Performance
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Weekly comparison across all branches (last 8 weeks)
              </p>
            </div>
            <div className="flex gap-1.5">
              {(["revenue", "bookings"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setBranchMetric(m)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors border",
                    branchMetric === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                  )}
                >
                  {m === "revenue" ? "Revenue" : "Bookings"}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isBranchLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : branchChartData.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Building2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">No branch data available</p>
              <p className="text-xs">Branch data will appear once bookings are recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(500, branchChartData.length * 60) }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={branchChartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) =>
                        branchMetric === "revenue" ? `₦${(v / 1000).toFixed(0)}k` : String(v)
                      }
                      width={52}
                    />
                    <Tooltip
                      content={(props) => (
                        <BranchTooltip {...props} metric={branchMetric} />
                      )}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    />
                    {branchComparison.map((branch, i) => (
                      <Bar
                        key={branch.branchId}
                        dataKey={branch.branchName}
                        fill={BAR_COLORS[i % BAR_COLORS.length]}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={40}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
