// src/pages/superAdmin/RoomStatusBoard.tsx
// Live physical-room status board for the new RoomUnit/RoomTypeV2 model.
// Used by superadmin (/room-status-v2), manager (/manager/room-status-v2),
// and receptionist (/receptionist/room-status-v2) — same multi-mount pattern
// as RoomTypes.tsx / CategoryManagement.tsx. Grouped by category, each card
// shows live status + a checkout countdown derived from checkOutAt (never a
// stored ticking value). Coexists with the legacy Room-based board
// (RoomReceptionist.tsx) — nothing here touches the legacy /api/rooms/* endpoints.
//
// Designed to be readable from across a room: whole-card status theming,
// oversized checkout countdown as the dominant element, larger cards with
// fewer per row. Each card is memoized on its own displayed fields so the
// 60s poll's fresh array reference doesn't force every card to re-render —
// only ones whose data actually changed re-paint; the per-card countdown
// still ticks independently every second regardless (isolated interval).
import { useEffect, useMemo, useState, memo } from "react";
import type { ComponentType, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BedDouble, Clock, Sparkles, Wrench, CheckCircle2, User, UserCheck, DoorOpen, AlertTriangle } from "lucide-react";
import { useRoomTypeV2Store, type RoomUnit } from "@/store/useRoomTypeV2Store";
import { useBranchStore } from "@/store/useBranchStore";
import { useAuthStore } from "@/store/useAuthStore";
import { socket } from "@/lib/socket";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<RoomUnit["status"], string> = {
  available: "Available",
  occupied: "Occupied",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
};

type IconType = ComponentType<{ className?: string }>;

// Icon shown in every card's status badge alongside the color and text —
// color is never the only signal. Occupied's icon varies by time band
// (see OCCUPIED_BAND_ICON below), not used from this map.
const STATUS_ICONS: Record<RoomUnit["status"], IconType> = {
  available: CheckCircle2,
  occupied: Clock,
  cleaning: Sparkles,
  maintenance: Wrench,
};

// Whole-card theming per BASE status — background + border + accent all
// reflect status, not just a thin strip. Occupied is NOT driven from here;
// it progresses through OCCUPIED_BAND_THEME below as checkout approaches.
// Cleaning uses amber/yellow (vacant, awaiting turnover) — kept distinct
// from occupied's "calm" blue band so the two states can never be confused
// at a glance.
const STATUS_THEME: Record<RoomUnit["status"], {
  card: string;
  badge: string;
  accent: string;
  iconBg: string;
}> = {
  available: {
    card: "bg-success/5 border-success/30 dark:bg-success/10",
    badge: "bg-success/15 text-success border-success/30",
    accent: "text-success",
    iconBg: "bg-success/15",
  },
  occupied: {
    card: "bg-destructive/5 border-destructive/30 dark:bg-destructive/10",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    accent: "text-destructive",
    iconBg: "bg-destructive/15",
  },
  cleaning: {
    card: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800",
    badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
    accent: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
  },
  maintenance: {
    card: "bg-slate-100 border-slate-300 dark:bg-slate-800/40 dark:border-slate-700",
    badge: "bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-700/60 dark:text-slate-300 dark:border-slate-600",
    accent: "text-slate-600 dark:text-slate-400",
    iconBg: "bg-slate-200 dark:bg-slate-700/60",
  },
};

// How soon before checkOutAt the "approaching" (orange) band begins. Single
// tunable constant — discrete bands, not a continuous gradient.
const APPROACHING_MINS = 60;

type OccupiedBand = "calm" | "approaching" | "overdue";

// Pure, no side effects — shared by the card's background theme AND the
// countdown text (both driven by the same `now`) so they can never disagree.
function getOccupiedBand(checkOutAt: string, now: number): OccupiedBand {
  const distance = new Date(checkOutAt).getTime() - now;
  if (distance <= 0) return "overdue";
  if (distance <= APPROACHING_MINS * 60000) return "approaching";
  return "calm";
}

const OCCUPIED_BAND_THEME: Record<OccupiedBand, {
  card: string;
  badge: string;
  accent: string;
  iconBg: string;
}> = {
  calm: {
    card: "bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
    accent: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
  },
  approaching: {
    card: "bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800",
    badge: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800",
    accent: "text-orange-600 dark:text-orange-400",
    iconBg: "bg-orange-100 dark:bg-orange-900/40",
  },
  // Reuses the same destructive tokens the old always-red "occupied" theme
  // used — the worst case still looks like today's occupied card.
  overdue: {
    card: "bg-destructive/5 border-destructive/30 dark:bg-destructive/10",
    badge: "bg-destructive/15 text-destructive border-destructive/30",
    accent: "text-destructive",
    iconBg: "bg-destructive/15",
  },
};

const OCCUPIED_BAND_ICON: Record<OccupiedBand, IconType> = {
  calm: Clock,
  approaching: Clock,
  overdue: AlertTriangle,
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// Live checkout countdown text — the visual focal point of an occupied
// card. `now`/`band` are passed down from OccupiedRoomFrame's single shared
// tick (not owned here) so the countdown text and the card's background
// band can never drift out of sync from two independent timers.
function CheckoutCountdown({ checkOutAt, now, band }: { checkOutAt: string; now: number; band: OccupiedBand }) {
  const distance = new Date(checkOutAt).getTime() - now;
  const isOverdue = distance <= 0;
  const abs = Math.abs(distance);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const seconds = Math.floor((abs % 60000) / 1000);

  const formatted = days >= 1
    ? `${days}d ${pad(hours)}:${pad(minutes)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className="rounded-lg bg-background/70 dark:bg-background/30 px-4 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
        {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
        <span>{isOverdue ? "Overdue" : "Checkout in"}</span>
      </div>
      <p className={cn(
        "text-4xl sm:text-5xl font-black tabular-nums tracking-tight leading-none transition-colors duration-500",
        OCCUPIED_BAND_THEME[band].accent,
        band === "overdue" && "animate-pulse"
      )}>
        {formatted}
      </p>
    </div>
  );
}

// Owns the single 1s tick driving an occupied card's time-based color band
// and its countdown text together — kept out of the memoized RoomCard so
// non-occupied cards never pay a per-second re-render cost, and so an
// occupied card's OWN tick never forces sibling cards to re-render.
function OccupiedRoomFrame({
  checkOutAt,
  housekeepingInProgress,
  children,
}: {
  checkOutAt: string;
  housekeepingInProgress?: boolean;
  children: (band: OccupiedBand, now: number) => ReactNode;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const band = getOccupiedBand(checkOutAt, now);
  const theme = OCCUPIED_BAND_THEME[band];

  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border-2 p-6 space-y-4 shadow-sm hover:shadow-md transition-colors duration-500",
      theme.card
    )}>
      {/* Stayover housekeeping overlay — layered on top of the occupied
          band color, never replaces it. Decorative only; the actual signal
          is the "Housekeeping" badge below, on its own solid chip. */}
      {housekeepingInProgress && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-25"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, rgb(217 119 6) 0px, rgb(217 119 6) 10px, transparent 10px, transparent 20px)",
          }}
        />
      )}
      <div className="relative z-10 space-y-4">
        {children(band, now)}
      </div>
    </div>
  );
}

interface RoomCardProps {
  unit: RoomUnit;
  roomTypeName: string;
  isMarkingClean: boolean;
  isTogglingHousekeeping: boolean;
  onMarkClean: (unit: RoomUnit) => void;
  onFlagMaintenance: (unit: RoomUnit) => void;
  onToggleHousekeeping: (unit: RoomUnit) => void;
}

const RoomCard = memo(function RoomCard({
  unit, roomTypeName, isMarkingClean, isTogglingHousekeeping, onMarkClean, onFlagMaintenance, onToggleHousekeeping,
}: RoomCardProps) {
  // Shared body — rendered either directly (static statuses) or once per
  // second from inside OccupiedRoomFrame's tick (occupied), so the exact
  // same markup/behavior applies either way; only the surrounding
  // color/frame differs.
  const renderBody = (
    theme: { card: string; badge: string; accent: string; iconBg: string },
    StatusIcon: IconType,
    band?: OccupiedBand,
    now?: number,
  ) => (
    <>
      {/* Room number + status — identifiable at a glance */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center shrink-0", theme.iconBg)}>
            <BedDouble className={cn("h-6 w-6", theme.accent)} />
          </div>
          <div className="min-w-0">
            <p className="text-3xl font-bold leading-tight truncate">{unit.roomNumber}</p>
            {unit.floor !== undefined && <p className="text-xs text-muted-foreground">Floor {unit.floor}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <Badge className={cn("text-xs font-semibold border shrink-0 gap-1", theme.badge)}>
            <StatusIcon className="h-3 w-3" />
            {STATUS_LABELS[unit.status]}
          </Badge>
          {/* Combined state — occupied AND being cleaned (stayover). Its
              own solid chip so the stripe overlay behind it never reduces
              its contrast. */}
          {unit.status === "occupied" && unit.housekeepingInProgress && (
            <Badge className="text-xs font-semibold border shrink-0 gap-1 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800">
              <Sparkles className="h-3 w-3" />
              Housekeeping
            </Badge>
          )}
        </div>
      </div>

      {/* Countdown — the dominant element on an occupied card */}
      {unit.status === "occupied" && unit.checkOutAt && band && now !== undefined && (
        <CheckoutCountdown checkOutAt={unit.checkOutAt} now={now} band={band} />
      )}

      {/* Guest / check-in / check-out details */}
      {unit.status === "occupied" && (
        <div className="space-y-1.5 text-sm">
          {unit.currentGuestName && (
            <div className="flex items-center gap-2 font-medium">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{unit.currentGuestName}</span>
            </div>
          )}
          {unit.checkedInAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCheck className="h-4 w-4 shrink-0" />
              <span>Checked in {formatDateTime(unit.checkedInAt)}</span>
            </div>
          )}
          {unit.checkOutAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DoorOpen className="h-4 w-4 shrink-0" />
              <span>Checkout {formatDateTime(unit.checkOutAt)}</span>
            </div>
          )}
        </div>
      )}

      {/* Maintenance reason */}
      {unit.status === "maintenance" && unit.maintenanceReason && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground italic">
          <Wrench className="h-4 w-4 mt-0.5 shrink-0" />
          <span className="line-clamp-2">"{unit.maintenanceReason}"</span>
        </div>
      )}

      {/* Room type */}
      <p className="text-xs font-medium text-muted-foreground pt-3 border-t border-current/10">
        {roomTypeName}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {unit.status === "cleaning" && (
          <Button size="sm" variant="outline" onClick={() => onMarkClean(unit)} disabled={isMarkingClean}>
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            {isMarkingClean ? "Marking..." : "Mark Clean"}
          </Button>
        )}
        {unit.status === "occupied" && (
          <Button size="sm" variant="outline" onClick={() => onToggleHousekeeping(unit)} disabled={isTogglingHousekeeping}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            {isTogglingHousekeeping
              ? "Saving..."
              : unit.housekeepingInProgress ? "Finish Housekeeping" : "Start Housekeeping"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onFlagMaintenance(unit)}>
          <Wrench className="h-4 w-4 mr-1.5" />
          {unit.status === "maintenance" ? "Restore" : unit.status === "occupied" ? "Flag Issue" : "Maintenance"}
        </Button>
      </div>
    </>
  );

  if (unit.status === "occupied" && unit.checkOutAt) {
    return (
      <OccupiedRoomFrame checkOutAt={unit.checkOutAt} housekeepingInProgress={unit.housekeepingInProgress}>
        {(band, now) => renderBody(OCCUPIED_BAND_THEME[band], OCCUPIED_BAND_ICON[band], band, now)}
      </OccupiedRoomFrame>
    );
  }

  const theme = STATUS_THEME[unit.status];
  const StatusIcon = STATUS_ICONS[unit.status];
  return (
    <div className={cn(
      "rounded-xl border-2 p-6 space-y-4 shadow-sm hover:shadow-md transition-all duration-300",
      theme.card
    )}>
      {renderBody(theme, StatusIcon)}
    </div>
  );
}, (prev, next) =>
  prev.unit._id === next.unit._id &&
  prev.unit.status === next.unit.status &&
  prev.unit.checkOutAt === next.unit.checkOutAt &&
  prev.unit.checkedInAt === next.unit.checkedInAt &&
  prev.unit.currentGuestName === next.unit.currentGuestName &&
  prev.unit.maintenanceReason === next.unit.maintenanceReason &&
  prev.unit.housekeepingInProgress === next.unit.housekeepingInProgress &&
  prev.unit.roomNumber === next.unit.roomNumber &&
  prev.unit.floor === next.unit.floor &&
  prev.roomTypeName === next.roomTypeName &&
  prev.isMarkingClean === next.isMarkingClean &&
  prev.isTogglingHousekeeping === next.isTogglingHousekeeping
);

// Maintenance-reason dialog (create) / confirm (restore to available)
function MaintenanceDialog({
  isOpen, onClose, unit,
}: { isOpen: boolean; onClose: () => void; unit: RoomUnit | null }) {
  const { updateRoomUnitStatus } = useRoomTypeV2Store();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const goingIntoMaintenance = unit?.status !== "maintenance";

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!unit) return;
    setIsSubmitting(true);
    const result = goingIntoMaintenance
      ? await updateRoomUnitStatus(unit._id, "maintenance", reason || undefined)
      : await updateRoomUnitStatus(unit._id, "available");
    if (result.success) {
      toast.success(goingIntoMaintenance ? "Room flagged for maintenance" : "Room restored to available");
      onClose();
    } else {
      toast.error(result.error || "Failed to update room status");
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{goingIntoMaintenance ? "Flag for Maintenance" : "Restore to Available"}</DialogTitle>
          <DialogDescription>
            {goingIntoMaintenance
              ? `Room ${unit?.roomNumber} will be marked out of service.`
              : `Room ${unit?.roomNumber} will become available again.`}
          </DialogDescription>
        </DialogHeader>
        {goingIntoMaintenance && (
          <div className="space-y-1 py-2">
            <Label htmlFor="maint-reason">Reason (optional)</Label>
            <Textarea id="maint-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. AC not working" />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} variant={goingIntoMaintenance ? "destructive" : "default"}>
            {isSubmitting ? "Saving..." : goingIntoMaintenance ? "Flag Maintenance" : "Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoomStatusBoard() {
  const { unitsBoard, isBoardLoading, fetchUnitsBoard, updateRoomUnitStatus, toggleHousekeeping, initRoomUnitSocketListeners, closeRoomUnitSocketListeners } = useRoomTypeV2Store();
  const { branches, fetchBranches, isLoading: isBranchesLoading } = useBranchStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "superadmin";

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [maintenanceTarget, setMaintenanceTarget] = useState<RoomUnit | null>(null);
  const [markingCleanId, setMarkingCleanId] = useState<string | null>(null);
  const [togglingHousekeepingId, setTogglingHousekeepingId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBranches();
    } else {
      fetchUnitsBoard();
    }
  }, [isSuperAdmin, fetchBranches, fetchUnitsBoard]);

  useEffect(() => {
    if (isSuperAdmin && selectedBranchId) fetchUnitsBoard(selectedBranchId);
  }, [isSuperAdmin, selectedBranchId, fetchUnitsBoard]);

  useEffect(() => {
    const hotelId = isSuperAdmin ? selectedBranchId : user?.hotelId;
    if (!hotelId) return;

    // Without this, roomUnitUpdated broadcasts (emitToHotel) never reach this
    // tab — the server only routes them to sockets that have joined
    // hotel_{hotelId}, and nothing does that automatically on connect. Same
    // join_hotel/'connect' pattern as WaiterDashboard.tsx.
    const handleConnect = () => socket.emit('join_hotel', hotelId);
    socket.on('connect', handleConnect);
    if (socket.connected) socket.emit('join_hotel', hotelId);

    initRoomUnitSocketListeners();
    // 60s poll fallback — same precedent as the legacy board, since socket
    // coverage isn't guaranteed complete. Silent: this is a background
    // safety net, not a user-initiated load, so it must not flash the
    // skeleton over an already-rendered board.
    const interval = setInterval(() => {
      if (isSuperAdmin) {
        if (selectedBranchId) fetchUnitsBoard(selectedBranchId, { silent: true });
      } else {
        fetchUnitsBoard(undefined, { silent: true });
      }
    }, 60000);
    return () => {
      socket.off('connect', handleConnect);
      closeRoomUnitSocketListeners();
      clearInterval(interval);
    };
  }, [isSuperAdmin, selectedBranchId, user?.hotelId, fetchUnitsBoard, initRoomUnitSocketListeners, closeRoomUnitSocketListeners]);

  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; name: string; units: RoomUnit[] }>();
    for (const unit of unitsBoard) {
      const category = typeof unit.roomTypeId === "object" ? unit.roomTypeId : null;
      const key = category?._id || "unknown";
      const name = category?.name || "Unassigned";
      if (!map.has(key)) map.set(key, { id: key, name, units: [] });
      map.get(key)!.units.push(unit);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [unitsBoard]);

  const stats = useMemo(() => ({
    available: unitsBoard.filter((u) => u.status === "available").length,
    occupied: unitsBoard.filter((u) => u.status === "occupied").length,
    cleaning: unitsBoard.filter((u) => u.status === "cleaning").length,
    maintenance: unitsBoard.filter((u) => u.status === "maintenance").length,
  }), [unitsBoard]);

  const handleMarkClean = async (unit: RoomUnit) => {
    setMarkingCleanId(unit._id);
    const result = await updateRoomUnitStatus(unit._id, "available");
    if (result.success) {
      toast.success(`Room ${unit.roomNumber} marked clean`);
    } else {
      toast.error(result.error || "Failed to update room status");
    }
    setMarkingCleanId(null);
  };

  const handleToggleHousekeeping = async (unit: RoomUnit) => {
    setTogglingHousekeepingId(unit._id);
    const nextInProgress = !unit.housekeepingInProgress;
    const result = await toggleHousekeeping(unit._id, nextInProgress);
    if (result.success) {
      toast.success(nextInProgress ? `Housekeeping started in Room ${unit.roomNumber}` : `Housekeeping finished in Room ${unit.roomNumber}`);
    } else {
      toast.error(result.error || "Failed to update housekeeping status");
    }
    setTogglingHousekeepingId(null);
  };

  const showBoard = !isSuperAdmin || selectedBranchId;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Room Status</h1>
        <p className="text-muted-foreground">Live status of every physical room, grouped by category</p>
      </div>

      {isSuperAdmin && !isBranchesLoading && branches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {branches.map((branch) => (
            <Button
              key={branch._id}
              variant={selectedBranchId === branch._id ? "default" : "outline"}
              onClick={() => setSelectedBranchId(branch._id)}
              className="rounded-full"
              size="sm"
            >
              {branch.name}
            </Button>
          ))}
        </div>
      )}

      {!showBoard ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-2">
            <BedDouble className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Select a branch above to view its room status board.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Available", value: stats.available, icon: <CheckCircle2 className={cn("h-5 w-5", STATUS_THEME.available.accent)} />, bg: STATUS_THEME.available.iconBg },
              { label: "Occupied", value: stats.occupied, icon: <User className={cn("h-5 w-5", STATUS_THEME.occupied.accent)} />, bg: STATUS_THEME.occupied.iconBg },
              { label: "Cleaning", value: stats.cleaning, icon: <Sparkles className={cn("h-5 w-5", STATUS_THEME.cleaning.accent)} />, bg: STATUS_THEME.cleaning.iconBg },
              { label: "Maintenance", value: stats.maintenance, icon: <Wrench className={cn("h-5 w-5", STATUS_THEME.maintenance.accent)} />, bg: STATUS_THEME.maintenance.iconBg },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>{s.icon}</div>
                  <div>
                    <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                    <p className="text-2xl font-bold leading-tight">{isBoardLoading ? "—" : s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {isBoardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
            </div>
          ) : unitsBoard.length === 0 ? (
            <Card className="border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-2">
                <BedDouble className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No room units found for this branch yet.</p>
              </CardContent>
            </Card>
          ) : (
            grouped.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                    {group.units.map((unit) => (
                      <RoomCard
                        key={unit._id}
                        unit={unit}
                        roomTypeName={group.name}
                        isMarkingClean={markingCleanId === unit._id}
                        isTogglingHousekeeping={togglingHousekeepingId === unit._id}
                        onMarkClean={handleMarkClean}
                        onFlagMaintenance={setMaintenanceTarget}
                        onToggleHousekeeping={handleToggleHousekeeping}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}

      <MaintenanceDialog isOpen={!!maintenanceTarget} unit={maintenanceTarget} onClose={() => setMaintenanceTarget(null)} />
    </div>
  );
}
