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
import { useEffect, useMemo, useRef, useState, memo } from "react";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BedDouble, Clock, Sparkles, Wrench, CheckCircle2, User, UserCheck, DoorOpen, AlertTriangle, Search } from "lucide-react";
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
          {/* Combined state — occupied AND flagged for maintenance. Status
              correctly stays 'occupied' now (see updateRoomUnitStatus),
              so this is the only visual signal the flag is present. */}
          {unit.status === "occupied" && unit.maintenanceReason && (
            <Badge className="text-xs font-semibold border shrink-0 gap-1 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">
              <Wrench className="h-3 w-3" />
              Maintenance
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

      {/* Maintenance reason — shown whenever flagged, whether the room is
          vacant (status:'maintenance') or occupied+flagged (status stays
          'occupied', badge above signals the flag). */}
      {unit.maintenanceReason && (
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
        {/* Completion now flows through the cleaner's Accept→Start→Complete
            task pipeline on the Housekeeping dashboard, not a manual
            receptionist toggle-off — once requested, this becomes a
            disabled status indicator rather than a "Finish" action. */}
        {unit.status === "occupied" && !unit.housekeepingInProgress && (
          <Button size="sm" variant="outline" onClick={() => onToggleHousekeeping(unit)} disabled={isTogglingHousekeeping}>
            <Sparkles className="h-4 w-4 mr-1.5" />
            {isTogglingHousekeeping ? "Requesting..." : "Request Cleaning"}
          </Button>
        )}
        {unit.status === "occupied" && unit.housekeepingInProgress && (
          <Button size="sm" variant="outline" disabled>
            <Sparkles className="h-4 w-4 mr-1.5" />
            Cleaning Requested
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onFlagMaintenance(unit)}>
          <Wrench className="h-4 w-4 mr-1.5" />
          {/* Keyed on the flag, not status — an occupied+flagged room
              still shows "Restore" even though status stays 'occupied'. */}
          {unit.maintenanceReason ? "Restore" : unit.status === "occupied" ? "Flag Issue" : "Maintenance"}
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
  // Keyed on the flag itself, not `status` — an occupied+flagged room
  // correctly keeps status:'occupied' now, it never becomes 'maintenance'.
  const goingIntoMaintenance = !unit?.maintenanceReason;

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
  // Independent of unitsBoard on purpose — a live socket patch only ever
  // touches unitsBoard, never this, so an in-progress filter selection
  // survives real-time updates untouched.
  const [statusFilter, setStatusFilter] = useState<RoomUnit["status"] | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all"); // category _id
  const [roomNumberQuery, setRoomNumberQuery] = useState("");
  const [isFilterBarStuck, setIsFilterBarStuck] = useState(false);
  const filterBarSentinelRef = useRef<HTMLDivElement>(null);
  const activeFilterCardRef = useRef<HTMLButtonElement>(null);

  // There's no CSS ":stuck" selector for position:sticky — this is the
  // standard scroll-listener-free technique: a 1px sentinel placed just
  // above the sticky bar, observed via IntersectionObserver. Once it
  // scrolls out of view, the bar is "stuck"; toggling one boolean class
  // this way causes no layout thrash and no reflow-triggering scroll handler.
  useEffect(() => {
    const sentinel = filterBarSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsFilterBarStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

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

  // Filtering happens upstream of grouping, over the live in-memory array —
  // no API call, no reload. Both this and `stats` below re-derive
  // automatically whenever unitsBoard or statusFilter change, so a live
  // status update (targeted patch, see useRoomTypeV2Store.ts) naturally
  // re-applies the active filter: a room that stops matching leaves the
  // grid, a newly-matching one enters.
  const filteredUnits = useMemo(() => {
    // "Maintenance" matches by flag, not status equality — an occupied
    // room stays status:'occupied' while flagged, so it must still be
    // findable under this filter rather than only vacant-maintenance rooms.
    let result = statusFilter === "all"
      ? unitsBoard
      : statusFilter === "maintenance"
        ? unitsBoard.filter((u) => !!u.maintenanceReason)
        : unitsBoard.filter((u) => u.status === statusFilter);
    if (categoryFilter !== "all") {
      result = result.filter((u) => typeof u.roomTypeId === "object" && u.roomTypeId._id === categoryFilter);
    }
    if (roomNumberQuery.trim()) {
      const q = roomNumberQuery.trim().toLowerCase();
      result = result.filter((u) => u.roomNumber.toLowerCase().includes(q));
    }
    return result;
  }, [unitsBoard, statusFilter, categoryFilter, roomNumberQuery]);

  // Options for the category dropdown, derived from the live board — not a
  // separate fetch, same "derived from the in-memory array" principle as stats.
  const availableCategories = useMemo(() => {
    const map = new Map<string, string>(); // id -> name
    for (const u of unitsBoard) {
      if (typeof u.roomTypeId === "object") map.set(u.roomTypeId._id, u.roomTypeId.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [unitsBoard]);

  const grouped = useMemo(() => {
    const map = new Map<string, { id: string; name: string; units: RoomUnit[] }>();
    for (const unit of filteredUnits) {
      const category = typeof unit.roomTypeId === "object" ? unit.roomTypeId : null;
      const key = category?._id || "unknown";
      const name = category?.name || "Unassigned";
      if (!map.has(key)) map.set(key, { id: key, name, units: [] });
      map.get(key)!.units.push(unit);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredUnits]);

  const stats = useMemo(() => ({
    available: unitsBoard.filter((u) => u.status === "available").length,
    occupied: unitsBoard.filter((u) => u.status === "occupied").length,
    cleaning: unitsBoard.filter((u) => u.status === "cleaning").length,
    // Counts every flagged room, not just vacant ones — an occupied room
    // stays status:'occupied' while flagged (see updateRoomUnitStatus), so
    // status === 'maintenance' alone would undercount.
    maintenance: unitsBoard.filter((u) => !!u.maintenanceReason).length,
  }), [unitsBoard]);

  // Only user-initiated clicks scroll the active card into view (mobile
  // horizontal scroll) — never triggered by remote/socket-driven updates,
  // which only ever touch unitsBoard, not this handler.
  const handleSelectFilter = (value: RoomUnit["status"] | "all") => {
    setStatusFilter(value);
    requestAnimationFrame(() => {
      activeFilterCardRef.current?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
    });
  };

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

  // Only ever called to request cleaning (the button no longer offers a
  // "Finish" path) — completion happens via the cleaner's task pipeline.
  const handleToggleHousekeeping = async (unit: RoomUnit) => {
    setTogglingHousekeepingId(unit._id);
    const result = await toggleHousekeeping(unit._id, true);
    if (result.success) {
      toast.success(
        result.alreadyQueued
          ? `Room ${unit.roomNumber} already has a cleaning request queued`
          : `Cleaning requested for Room ${unit.roomNumber} — housekeepers notified`
      );
    } else {
      toast.error(result.error || "Failed to request cleaning");
    }
    setTogglingHousekeepingId(null);
  };

  const showBoard = !isSuperAdmin || selectedBranchId;

  // "All Rooms" first — the single, unambiguous reset control (clicking a
  // status card sets the filter; it doesn't toggle, so there's never an
  // ambiguous "click again to clear" state).
  const filterEntries: { key: RoomUnit["status"] | "all"; label: string; value: number; icon: JSX.Element; bg: string }[] = [
    { key: "all", label: "All Rooms", value: unitsBoard.length, icon: <BedDouble className="h-5 w-5 text-foreground" />, bg: "bg-muted" },
    { key: "available", label: "Available", value: stats.available, icon: <CheckCircle2 className={cn("h-5 w-5", STATUS_THEME.available.accent)} />, bg: STATUS_THEME.available.iconBg },
    { key: "occupied", label: "Occupied", value: stats.occupied, icon: <User className={cn("h-5 w-5", STATUS_THEME.occupied.accent)} />, bg: STATUS_THEME.occupied.iconBg },
    { key: "cleaning", label: "Cleaning", value: stats.cleaning, icon: <Sparkles className={cn("h-5 w-5", STATUS_THEME.cleaning.accent)} />, bg: STATUS_THEME.cleaning.iconBg },
    { key: "maintenance", label: "Maintenance", value: stats.maintenance, icon: <Wrench className={cn("h-5 w-5", STATUS_THEME.maintenance.accent)} />, bg: STATUS_THEME.maintenance.iconBg },
  ];

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
          {/* 1px sentinel — IntersectionObserver watches this to detect when
              the bar below has actually become stuck (no CSS ":stuck"
              selector exists for position:sticky). */}
          <div ref={filterBarSentinelRef} className="h-px" />
          <div
            className={cn(
              "sticky top-0 z-10 bg-background py-3 -mt-3 transition-shadow duration-200",
              isFilterBarStuck && "border-b border-border shadow-sm"
            )}
          >
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-1 sm:pb-0 sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible">
              {filterEntries.map((s) => {
                const isActive = statusFilter === s.key;
                return (
                  <button
                    key={s.key}
                    ref={isActive ? activeFilterCardRef : undefined}
                    type="button"
                    onClick={() => handleSelectFilter(s.key)}
                    aria-pressed={isActive}
                    className={cn(
                      "text-left rounded-xl border bg-card p-4 flex items-center gap-3 shrink-0 min-w-[150px] sm:min-w-0 sm:shrink snap-start",
                      "transition-all duration-150 hover:shadow-sm",
                      isActive
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5 border-primary/40"
                        : "border-border"
                    )}
                  >
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>{s.icon}</div>
                    <div>
                      <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                      <p className="text-2xl font-bold leading-tight">{isBoardLoading ? "—" : s.value}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by room number..."
                value={roomNumberQuery}
                onChange={(e) => setRoomNumberQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          ) : grouped.length === 0 ? (
            <Card className="border-dashed bg-muted/20 animate-in fade-in duration-300">
              <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-2">
                <BedDouble className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {categoryFilter !== "all" || roomNumberQuery.trim()
                    ? "No rooms match the current filters."
                    : `No rooms are currently ${STATUS_LABELS[statusFilter as RoomUnit["status"]]?.toLowerCase() || statusFilter}.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            grouped.map((group) => (
              <Card key={group.id} className="animate-in fade-in duration-300">
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
