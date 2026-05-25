import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Plus,
  Zap,
  ZapOff,
  Clock,
  AlertTriangle,
  CalendarDays,
  CalendarCheck,
  CalendarRange,
  UserX,
  ShieldOff,
  Info,
  RotateCcw,
  Building2,
  User,
  MapPin,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useShiftStore } from "@/store/useSiftStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useStaffStore } from "@/store/useStaffStore";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────
interface CreateShiftData {
  userId: string;
  hotelId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  shiftType?: "custom" | "morning" | "afternoon" | "evening" | "night" | "full-day";
  notes?: string;
}

interface ConfirmationDialogState {
  isOpen: boolean;
  type: "delete" | "activate" | "deactivate" | null;
  shiftId: string | null;
  shiftName: string | null;
}

// ── Color maps ─────────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
  scheduled:     "bg-blue-100   text-blue-700   border border-blue-200",
  "in-progress": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  completed:     "bg-gray-100   text-gray-600   border border-gray-200",
  cancelled:     "bg-red-100    text-red-700    border border-red-200",
};

const SHIFT_TYPE_LABEL: Record<string, string> = {
  morning:   "Morning",
  afternoon: "Afternoon",
  evening:   "Evening",
  night:     "Night",
  "full-day": "Full Day",
  custom:    "Custom",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Shared form fields ─────────────────────────────────────────────────────
function ShiftForm({
  formData,
  setFormData,
  staffUsers,
  staff,
  onStaffSelect,
}: {
  formData: CreateShiftData;
  setFormData: (d: CreateShiftData) => void;
  staffUsers: any[];
  staff: any[];
  onStaffSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Staff Member *</Label>
        <Select value={formData.userId} onValueChange={onStaffSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select staff member" />
          </SelectTrigger>
          <SelectContent>
            {staffUsers.map((s) => (
              <SelectItem key={s._id} value={s._id}>
                {s.firstName} {s.lastName} ({s.role})
                {s.hotelId && ` — ${s.hotelId.name}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {formData.userId && (
          <p className="text-xs text-muted-foreground mt-1">
            Hotel: {staff.find((s) => s._id === formData.userId)?.hotelId?.name ?? "Unknown"}
          </p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Date *</Label>
          <Input
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
          />
        </div>
        <div>
          <Label>End Date *</Label>
          <Input
            type="date"
            value={formData.endDate}
            min={formData.startDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Time * (WAT)</Label>
          <Input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">Staff can log in from this time</p>
        </div>
        <div>
          <Label>End Time * (WAT)</Label>
          <Input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">Staff logged out at this time</p>
        </div>
      </div>

      <Separator />

      <div>
        <Label>Shift Type</Label>
        <Select
          value={formData.shiftType}
          onValueChange={(v) => setFormData({ ...formData, shiftType: v as CreateShiftData["shiftType"] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select shift type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">Morning</SelectItem>
            <SelectItem value="afternoon">Afternoon</SelectItem>
            <SelectItem value="evening">Evening</SelectItem>
            <SelectItem value="night">Night</SelectItem>
            <SelectItem value="full-day">Full Day</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add any additional notes..."
          rows={3}
        />
      </div>
    </div>
  );
}

// ── Detail Sheet ───────────────────────────────────────────────────────────
function ShiftDetailSheet({
  shift,
  open,
  onClose,
  onEdit,
  onActivate,
  onDeactivate,
  onDelete,
  safeFormatDate,
}: {
  shift: any;
  open: boolean;
  onClose: () => void;
  onEdit: (shift: any) => void;
  onActivate: (id: string, name: string) => void;
  onDeactivate: (id: string, name: string) => void;
  onDelete: (id: string, name: string) => void;
  safeFormatDate: (d: any, fmt: string, fallback?: string) => string;
}) {
  if (!shift) return null;
  const staffName = `${shift.userId?.firstName ?? ""} ${shift.userId?.lastName ?? ""}`.trim();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-xl font-bold">{staffName || "Shift Details"}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="capitalize text-xs">{shift.userId?.role}</Badge>
            <Badge className={STATUS_CLS[shift.status] ?? "bg-gray-100 text-gray-600 border"}>
              {shift.status}
            </Badge>
            {shift.emergencyActivated && (
              <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
                <Zap className="h-3 w-3 mr-1" /> Emergency Active
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Staff & Hotel */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Staff</p>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{staffName}</span>
            </div>
            {shift.hotelId?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" />
                <span>{shift.hotelId.name}</span>
              </div>
            )}
          </section>

          <Separator />

          {/* Schedule */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Schedule</p>
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {safeFormatDate(shift.startDate, "MMM d, yyyy")}
                {safeFormatDate(shift.startDate, "yyyy-MM-dd") !== safeFormatDate(shift.endDate, "yyyy-MM-dd") && (
                  <> → {safeFormatDate(shift.endDate, "MMM d, yyyy")}</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{shift.startTime} – {shift.endTime} WAT (daily)</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Type: {SHIFT_TYPE_LABEL[shift.shiftType] ?? shift.shiftType}</span>
            </div>
          </section>

          {shift.emergencyActivated && shift.emergencyActivatedBy && (
            <>
              <Separator />
              <section className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Emergency Activation</p>
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                  <p>Activated by <strong>{shift.emergencyActivatedBy.firstName} {shift.emergencyActivatedBy.lastName}</strong></p>
                  {shift.emergencyActivatedAt && (
                    <p className="text-xs mt-1 text-amber-600">{safeFormatDate(shift.emergencyActivatedAt, "MMM d, yyyy 'at' HH:mm")}</p>
                  )}
                </div>
              </section>
            </>
          )}

          {shift.notes && (
            <>
              <Separator />
              <section className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
                <p className="text-sm bg-muted/40 rounded-lg p-3 text-muted-foreground italic">{shift.notes}</p>
              </section>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t shrink-0 flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { onClose(); onEdit(shift); }}>
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          {shift.emergencyActivated ? (
            <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() => { onClose(); onDeactivate(shift._id, staffName); }}>
              <ZapOff className="h-3.5 w-3.5" /> Remove Emergency
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={() => { onClose(); onActivate(shift._id, staffName); }}>
              <Zap className="h-3.5 w-3.5" /> Emergency Activate
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50 ml-auto"
            onClick={() => { onClose(); onDelete(shift._id, staffName); }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ShiftScheduler() {
  const { user } = useAuthStore();
  const {
    shifts,
    isLoading,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    activateShift,
    deactivateShift,
    initializeSocket,
    disconnectSocket,
  } = useShiftStore();

  const { staff, fetchStaff } = useStaffStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen]     = useState(false);
  const [selectedShift, setSelectedShift]           = useState<any>(null);
  const [detailSheetOpen, setDetailSheetOpen]       = useState(false);
  const [filterDate, setFilterDate]                 = useState<string>("");
  const [filterStaff, setFilterStaff]               = useState<string>("all");
  const [nigerianTime, setNigerianTime]             = useState<Date>(new Date());

  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialogState>({
    isOpen: false, type: null, shiftId: null, shiftName: null,
  });

  const [formData, setFormData] = useState<CreateShiftData>({
    userId: "",
    hotelId: user?.hotelId || "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: "17:00",
    shiftType: "custom",
    notes: "",
  });

  useEffect(() => {
    initializeSocket();
    fetchShifts({});
    fetchStaff();

    const interval = setInterval(() => {
      const now = new Date();
      setNigerianTime(new Date(now.toLocaleString("en-US", { timeZone: "Africa/Lagos" })));
    }, 1000);

    return () => {
      disconnectSocket();
      clearInterval(interval);
    };
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const safeFormatDate = (dateString: any, formatString: string, fallback = "—"): string => {
    if (!dateString) return fallback;
    try {
      const date = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
      if (!isValid(date)) return fallback;
      return format(date, formatString);
    } catch {
      return fallback;
    }
  };

  const hasValidDates = (shift: any) => !!(shift.startDate && shift.endDate);

  const isMultiDayShift = (shift: any) =>
    hasValidDates(shift) &&
    safeFormatDate(shift.startDate, "yyyy-MM-dd") !== safeFormatDate(shift.endDate, "yyyy-MM-dd");

  const getShiftDuration = (shift: any) => {
    if (!hasValidDates(shift)) return "—";
    const diff = Math.ceil(Math.abs(new Date(shift.endDate).getTime() - new Date(shift.startDate).getTime()) / 86400000);
    return diff <= 1 ? "1 day" : `${diff} days`;
  };

  const staffUsers = staff.filter((u) =>
    ["receptionist", "cleaner", "waiter", "headWaiter"].includes(u.role)
  );

  const validShifts = shifts.filter(hasValidDates);

  const filteredShifts = validShifts.filter((shift) => {
    if (filterDate) {
      const s = safeFormatDate(shift.startDate, "yyyy-MM-dd", "");
      const e = safeFormatDate(shift.endDate,   "yyyy-MM-dd", "");
      if (!s || !e || filterDate < s || filterDate > e) return false;
    }
    if (filterStaff !== "all") return shift.userId?._id === filterStaff;
    return true;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const todayStr = format(nigerianTime, "yyyy-MM-dd");
  const startOfWeek = new Date(nigerianTime);
  startOfWeek.setDate(nigerianTime.getDate() - nigerianTime.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  const stats = {
    total:          validShifts.length,
    today:          validShifts.filter((s) =>
      safeFormatDate(s.startDate, "yyyy-MM-dd") <= todayStr &&
      safeFormatDate(s.endDate,   "yyyy-MM-dd") >= todayStr
    ).length,
    week:           validShifts.filter((s) => {
      const ss = new Date(safeFormatDate(s.startDate, "yyyy-MM-dd"));
      const se = new Date(safeFormatDate(s.endDate,   "yyyy-MM-dd"));
      return ss <= endOfWeek && se >= startOfWeek;
    }).length,
    shiftTime:      validShifts.filter((s) => s.isShiftTime).length,
    emergency:      validShifts.filter((s) => s.emergencyActivated).length,
    offShift:       validShifts.filter((s) => !s.userId?.isActive && !["superadmin","admin"].includes(s.userId?.role)).length,
    deactivated:    validShifts.filter((s) => s.userId?.isActive === false).length,
  };

  // ── Confirmation dialog ───────────────────────────────────────────────────
  const openConfirmDialog = (type: "delete" | "activate" | "deactivate", shiftId: string, shiftName: string) =>
    setConfirmDialog({ isOpen: true, type, shiftId, shiftName });

  const closeConfirmDialog = () =>
    setConfirmDialog({ isOpen: false, type: null, shiftId: null, shiftName: null });

  const handleConfirmedAction = async () => {
    if (!confirmDialog.shiftId || !confirmDialog.type) return;
    try {
      switch (confirmDialog.type) {
        case "delete":
          await deleteShift(confirmDialog.shiftId);
          toast.success("Shift deleted successfully");
          break;
        case "activate":
          await activateShift(confirmDialog.shiftId);
          toast.success("Emergency activated — staff can log in immediately");
          break;
        case "deactivate":
          await deactivateShift(confirmDialog.shiftId);
          toast.success("Emergency activation removed. Normal schedule applies.");
          break;
      }
      closeConfirmDialog();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${confirmDialog.type} shift`);
    }
  };

  const confirmContent = {
    delete:     { title: "Delete Shift",              actionText: "Delete",     cls: "bg-red-600 hover:bg-red-700",    desc: `Delete the shift for ${confirmDialog.shiftName}? This cannot be undone.` },
    activate:   { title: "Emergency Activate",        actionText: "Activate",   cls: "bg-amber-600 hover:bg-amber-700", desc: `Emergency-activate shift for ${confirmDialog.shiftName}? They can log in immediately, bypassing scheduled hours.` },
    deactivate: { title: "Remove Emergency Access",   actionText: "Remove",     cls: "bg-amber-600 hover:bg-amber-700", desc: `Remove emergency activation for ${confirmDialog.shiftName}? If outside shift hours, they will be logged out.` },
  }[confirmDialog.type ?? "delete"] ?? { title: "", actionText: "", cls: "", desc: "" };

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleStaffSelection = (staffId: string) => {
    const selected = staff.find((s) => s._id === staffId);
    setFormData({ ...formData, userId: staffId, hotelId: selected?.hotelId?._id || user?.hotelId || formData.hotelId });
  };

  const resetForm = () =>
    setFormData({ userId: "", hotelId: user?.hotelId || "", startDate: format(new Date(), "yyyy-MM-dd"), startTime: "09:00", endDate: format(new Date(), "yyyy-MM-dd"), endTime: "17:00", shiftType: "custom", notes: "" });

  const validateForm = (): boolean => {
    if (!formData.userId || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      toast.error("Please fill all required fields");
      return false;
    }
    if (!formData.hotelId) {
      toast.error("Hotel ID is required. Please select a staff member with an assigned hotel.");
      return false;
    }
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error("End date cannot be before start date");
      return false;
    }
    return true;
  };

  const handleCreateShift = async () => {
    if (!validateForm()) return;
    try {
      await createShift(formData);
      toast.success("Shift created — will auto-activate daily at start time.");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create shift");
    }
  };

  const handleUpdateShift = async () => {
    if (!selectedShift || !validateForm()) return;
    try {
      await updateShift(selectedShift._id, formData);
      toast.success("Shift updated successfully");
      setIsEditDialogOpen(false);
      setSelectedShift(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update shift");
    }
  };

  const openEditDialog = (shift: any) => {
    if (!hasValidDates(shift)) {
      toast.error("Cannot edit shift with invalid dates. Please delete and recreate.");
      return;
    }
    setSelectedShift(shift);
    setFormData({
      userId:    shift.userId?._id || "",
      hotelId:   shift.hotelId?._id || user?.hotelId || "",
      startDate: safeFormatDate(shift.startDate, "yyyy-MM-dd", format(new Date(), "yyyy-MM-dd")),
      startTime: shift.startTime || "09:00",
      endDate:   safeFormatDate(shift.endDate,   "yyyy-MM-dd", format(new Date(), "yyyy-MM-dd")),
      endTime:   shift.endTime || "17:00",
      shiftType: shift.shiftType || "custom",
      notes:     shift.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDetailSheet = (shift: any, e: React.MouseEvent) => {
    // Don't open sheet if the click was on an action button
    if ((e.target as HTMLElement).closest("button")) return;
    setSelectedShift(shift);
    setDetailSheetOpen(true);
  };

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading && shifts.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Shift Scheduler</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage staff shifts and schedules</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            WAT {format(nigerianTime, "HH:mm:ss")}
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Shift
          </Button>
        </div>
      </div>

      {/* Invalid shifts warning */}
      {shifts.length !== validShifts.length && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{shifts.length - validShifts.length}</strong> shift(s) have invalid dates and are hidden.
            Delete and recreate them.
          </span>
        </div>
      )}

      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Shifts auto-activate and deactivate at the scheduled WAT times each day. Emergency activation
          bypasses the schedule. Staff need both an active account <em>and</em> an active shift to log in.
        </span>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Shifts"       value={stats.total}     icon={CalendarDays}  color="bg-slate-500"   />
        <StatCard title="Today's Shifts"     value={stats.today}     icon={CalendarCheck} color="bg-blue-500"    />
        <StatCard title="This Week"          value={stats.week}      icon={CalendarRange} color="bg-violet-500"  />
        <StatCard title="Within Shift Time"  value={stats.shiftTime} icon={Clock}         color="bg-emerald-500" sub="Can log in now" />
      </div>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Emergency Active" value={stats.emergency}   icon={Zap}      color="bg-amber-500" />
        <StatCard title="Off Shift"        value={stats.offShift}    icon={UserX}    color="bg-rose-500"  sub="Outside hours" />
        <StatCard title="Deactivated"      value={stats.deactivated} icon={ShieldOff} color="bg-red-600"  sub="Account disabled" />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="h-8 text-xs w-[150px]"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <Select value={filterStaff} onValueChange={setFilterStaff}>
              <SelectTrigger className="h-8 text-xs w-[210px]">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {staffUsers.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.firstName} {s.lastName} ({s.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5 ml-auto"
              onClick={() => { setFilterDate(""); setFilterStaff("all"); }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shifts table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Shifts
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredShifts.length})</span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Staff</TableHead>
                <TableHead className="text-xs">Role</TableHead>
                <TableHead className="text-xs">Hotel</TableHead>
                <TableHead className="text-xs">Date Range</TableHead>
                <TableHead className="text-xs">Time (WAT)</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No shifts match the current filters</p>
                    <p className="text-xs mt-1">Click "New Shift" to schedule one</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredShifts.map((shift) => {
                  const name = `${shift.userId?.firstName ?? ""} ${shift.userId?.lastName ?? ""}`.trim();
                  const multiDay = isMultiDayShift(shift);
                  return (
                    <TableRow
                      key={shift._id}
                      className={`hover:bg-muted/50 cursor-pointer ${shift.emergencyActivated ? "bg-amber-50/60 dark:bg-amber-900/10" : ""}`}
                      onClick={(e) => openDetailSheet(shift, e)}
                    >
                      <TableCell className="font-medium text-sm">{name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">{shift.userId?.role ?? "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{shift.hotelId?.name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {safeFormatDate(shift.startDate, "MMM d")}
                        {multiDay && <> → {safeFormatDate(shift.endDate, "MMM d, yyyy")}</>}
                        {!multiDay && <>, {safeFormatDate(shift.startDate, "yyyy")}</>}
                        <span className="ml-1 text-muted-foreground/60">({getShiftDuration(shift)})</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono whitespace-nowrap">
                        {shift.startTime} – {shift.endTime}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {SHIFT_TYPE_LABEL[shift.shiftType] ?? shift.shiftType ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={`text-xs ${STATUS_CLS[shift.status] ?? "bg-gray-100 text-gray-600 border"}`}>
                            {shift.status}
                          </Badge>
                          {shift.emergencyActivated && (
                            <Badge className="text-xs bg-amber-100 text-amber-700 border border-amber-200">
                              <Zap className="h-2.5 w-2.5 mr-0.5" /> Emergency
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {shift.emergencyActivated ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              title="Remove emergency activation"
                              onClick={(e) => { e.stopPropagation(); openConfirmDialog("deactivate", shift._id, name); }}>
                              <ZapOff className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              title="Emergency activate"
                              onClick={(e) => { e.stopPropagation(); openConfirmDialog("activate", shift._id, name); }}>
                              <Zap className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit shift"
                            onClick={(e) => { e.stopPropagation(); openEditDialog(shift); }}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete shift"
                            onClick={(e) => { e.stopPropagation(); openConfirmDialog("delete", shift._id, name); }}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Sheet */}
      <ShiftDetailSheet
        shift={selectedShift}
        open={detailSheetOpen}
        onClose={() => setDetailSheetOpen(false)}
        onEdit={openEditDialog}
        onActivate={(id, name) => openConfirmDialog("activate", id, name)}
        onDeactivate={(id, name) => openConfirmDialog("deactivate", id, name)}
        onDelete={(id, name) => openConfirmDialog("delete", id, name)}
        safeFormatDate={safeFormatDate}
      />

      {/* Confirmation AlertDialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {confirmContent.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmContent.desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedAction} className={confirmContent.cls}>
              {confirmContent.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
            <DialogDescription>
              Schedule a new shift. Times are in Nigerian Time (WAT). The shift will
              auto-activate and deactivate daily at the specified times.
            </DialogDescription>
          </DialogHeader>
          <ShiftForm
            formData={formData}
            setFormData={setFormData}
            staffUsers={staffUsers}
            staff={staff}
            onStaffSelect={handleStaffSelection}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateDialogOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateShift} disabled={isLoading}>
              {isLoading ? "Creating…" : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>Update shift details. Times are in Nigerian Time (WAT).</DialogDescription>
          </DialogHeader>
          <ShiftForm
            formData={formData}
            setFormData={setFormData}
            staffUsers={staffUsers}
            staff={staff}
            onStaffSelect={handleStaffSelection}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setSelectedShift(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateShift} disabled={isLoading}>
              {isLoading ? "Updating…" : "Update Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
