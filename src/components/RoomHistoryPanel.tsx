import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Wrench, User, CheckCircle2 } from "lucide-react";
import { useMaintenanceStore } from "@/store/useMaintenanceStore";
import { cn } from "@/lib/utils";

const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

interface RoomHistoryPanelProps {
  roomUnitId: string;
}

// Merged permanent history for one room — Cleaning Requests + Maintenance
// Requests/Complaints, with dates raised/resolved and staff who
// raised/resolved them (GET /api/maintenance/room-history/:roomUnitId).
export default function RoomHistoryPanel({ roomUnitId }: RoomHistoryPanelProps) {
  const { roomHistory, isLoadingRoomHistory, fetchRoomHistory } = useMaintenanceStore();

  useEffect(() => {
    if (roomUnitId) fetchRoomHistory(roomUnitId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUnitId]);

  if (isLoadingRoomHistory) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!roomHistory || roomHistory.timeline.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No cleaning or maintenance history for this room yet.</p>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Room {roomHistory.roomNumber} — Full History</h3>
      <div className="space-y-3">
        {roomHistory.timeline.map((entry) => {
          const Icon = entry.type === 'cleaning' ? Sparkles : Wrench;
          const color = entry.type === 'cleaning'
            ? "bg-amber-100 border-amber-200 text-amber-600"
            : "bg-orange-100 border-orange-200 text-orange-600";
          const isDone = entry.status === 'completed' || entry.status === 'Resolved' || entry.status === 'Closed';
          return (
            <div key={`${entry.type}-${entry._id}`} className="flex items-start gap-3">
              <div className={cn("h-7 w-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5", color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 rounded-lg border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{entry.summary}</p>
                  <Badge variant={isDone ? "default" : "secondary"} className="shrink-0 text-xs">
                    {entry.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Raised {fmtDateTime(entry.raisedAt)}</p>
                {entry.raisedBy && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Raised by {entry.raisedBy}
                  </p>
                )}
                {entry.resolvedAt && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 pt-1 border-t">
                    <CheckCircle2 className="h-3 w-3" /> Resolved {fmtDateTime(entry.resolvedAt)}
                    {entry.resolvedBy ? ` by ${entry.resolvedBy}` : ""}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
