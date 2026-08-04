import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Wrench, AlertCircle, Clock, CheckCircle2, Flame, Building2, History, Timer } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatCountAxis } from "@/lib/chartFormatters";
import { useMaintenanceStore } from "@/store/useMaintenanceStore";

const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' };
const PIE_COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--secondary))'];

const inProgressCount = (byStatus: Record<string, number>) =>
  (byStatus['Assigned'] || 0) + (byStatus['In Progress'] || 0) + (byStatus['Awaiting Parts'] || 0) + (byStatus['On Hold'] || 0);
const resolvedCount = (byStatus: Record<string, number>) => (byStatus['Resolved'] || 0) + (byStatus['Closed'] || 0);

interface MaintenanceSummarySectionProps {
  role: 'superadmin' | 'admin' | 'receptionist';
  hotelId?: string;
}

export default function MaintenanceSummarySection({ role, hotelId }: MaintenanceSummarySectionProps) {
  const navigate = useNavigate();
  const { summary, isLoadingSummary, fetchSummary, initSocketListeners, closeSocketListeners } = useMaintenanceStore();

  useEffect(() => {
    fetchSummary(hotelId);
  }, [fetchSummary, hotelId]);

  useEffect(() => {
    initSocketListeners();
    return () => closeSocketListeners();
  }, [initSocketListeners, closeSocketListeners]);

  const basePath = role === 'superadmin' ? '/maintenance' : role === 'admin' ? '/manager/maintenance' : '/receptionist/maintenance';
  const goToFiltered = (status: string) => navigate(`${basePath}?status=${encodeURIComponent(status)}`);
  const goToBranch = (branchHotelId: string) => navigate(`/maintenance?hotelId=${branchHotelId}`);

  if (isLoadingSummary && !summary) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  if (!summary) return null;

  const statusPieData = Object.entries(summary.byStatus).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  const priorityPieData = Object.entries(summary.byPriority).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2"><Wrench className="h-5 w-5" /> Maintenance Summary</h2>

      {/* Stat cards — role-specific set */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Requests" value={summary.total} icon={Wrench} color="primary" onClick={() => navigate(basePath)} />
        <StatCard title="Open" value={summary.byStatus['Open'] || 0} icon={AlertCircle} color="warning" onClick={() => goToFiltered('Open')} />
        {role === 'admin' && (
          <StatCard title="Assigned" value={summary.byStatus['Assigned'] || 0} icon={Clock} color="info" onClick={() => goToFiltered('Assigned')} />
        )}
        <StatCard title="In Progress" value={role === 'admin' ? (summary.byStatus['In Progress'] || 0) : inProgressCount(summary.byStatus)} icon={Clock} color="info" onClick={() => goToFiltered('In Progress')} />
        <StatCard title="Resolved" value={resolvedCount(summary.byStatus)} icon={CheckCircle2} color="success" onClick={() => goToFiltered('Resolved')} />
        {role === 'admin' && (
          <StatCard title="Overdue" value={summary.overdueCount} icon={Timer} color="warning" onClick={() => navigate(basePath)} />
        )}
        <StatCard title="Critical" value={summary.criticalActive} icon={Flame} color="warning" onClick={() => navigate(`${basePath}?priority=Critical`)} />
        {role === 'receptionist' && (
          <StatCard title="High Priority" value={summary.byPriority['High'] || 0} icon={AlertCircle} color="warning" onClick={() => navigate(`${basePath}?priority=High`)} />
        )}
        {role === 'superadmin' && (
          <StatCard title="Avg. Resolution Time" value={`${summary.avgResolutionHours}h`} icon={Timer} color="info" />
        )}
      </div>

      {/* Org-wide by-branch breakdown — superadmin only, shown when not scoped to one branch */}
      {role === 'superadmin' && summary.byBranch && summary.byBranch.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" /> Requests by Branch</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {summary.byBranch.map((b) => (
              <div
                key={b.hotelId}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => goToBranch(b.hotelId)}
              >
                <span className="text-sm font-medium">{b.hotelName}</span>
                <span className="text-sm text-muted-foreground">{b.total} total · {b.open} open</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Maintenance Trend (Last 14 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={summary.trend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" tickFormatter={(d) => d.slice(5)} />
                <YAxis className="text-xs" tickFormatter={formatCountAxis} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Requests by Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {statusPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Requests by Priority</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={priorityPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {priorityPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-2 max-h-[260px] overflow-y-auto">
            {summary.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No recent activity</p>
            ) : (
              summary.recentActivity.map((entry) => (
                <div key={entry._id} className="text-xs border-b pb-2 last:border-0">
                  <p className="text-foreground">{entry.description}</p>
                  <p className="text-muted-foreground">{new Date(entry.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Recently Resolved</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {summary.recentlyResolved.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No recently resolved requests</p>
          ) : (
            summary.recentlyResolved.map((r) => (
              <div
                key={r._id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm"
                onClick={() => navigate(`${basePath}?requestId=${r._id}`)}
              >
                <span>Room {r.roomUnitId?.roomNumber ?? 'N/A'} — {r.title}</span>
                <span className="text-xs text-muted-foreground">
                  {r.resolution.resolvedAt ? new Date(r.resolution.resolvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ''}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
