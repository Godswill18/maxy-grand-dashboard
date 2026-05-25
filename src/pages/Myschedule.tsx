import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  Tag,
  Building2,
  User,
  AlertTriangle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  isValid,
} from "date-fns";
import { useShiftStore } from "@/store/useSiftStore";
import { useAuthStore } from "@/store/useAuthStore";

// ── Color maps ─────────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
  scheduled:     "bg-blue-100   text-blue-700   border border-blue-200",
  "in-progress": "bg-emerald-100 text-emerald-700 border border-emerald-200",
  completed:     "bg-gray-100   text-gray-600   border border-gray-200",
  cancelled:     "bg-red-100    text-red-700    border border-red-200",
};

const SHIFT_TYPE_LABEL: Record<string, string> = {
  morning:    "Morning",
  afternoon:  "Afternoon",
  evening:    "Evening",
  night:      "Night",
  "full-day": "Full Day",
  custom:     "Custom",
};

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MySchedule() {
  const { user } = useAuthStore();
  const { mySchedule, isLoading, fetchMySchedule, initializeSocket, disconnectSocket } =
    useShiftStore();

  const [selectedDate, setSelectedDate]   = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  useEffect(() => {
    initializeSocket();
    loadSchedule();
    return () => { disconnectSocket(); };
  }, []);

  const loadSchedule = () => {
    fetchMySchedule({
      startDate: format(startOfMonth(selectedMonth), "yyyy-MM-dd"),
      endDate:   format(endOfMonth(selectedMonth),   "yyyy-MM-dd"),
    });
  };

  useEffect(() => { loadSchedule(); }, [selectedMonth]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const safeParse = (dateString: any): Date | null => {
    if (!dateString) return null;
    try {
      const date = typeof dateString === "string" ? parseISO(dateString) : new Date(dateString);
      return isValid(date) ? date : null;
    } catch { return null; }
  };

  const hasValidDates = (shift: any) =>
    !!(shift.startDate && shift.endDate && safeParse(shift.startDate) && safeParse(shift.endDate));

  const safeFormat = (dateString: any, formatStr: string, fallback = "—"): string => {
    const date = safeParse(dateString);
    if (!date) return fallback;
    try { return format(date, formatStr); } catch { return fallback; }
  };

  const isMultiDayShift = (shift: any): boolean => {
    if (!hasValidDates(shift)) return false;
    const s = safeParse(shift.startDate);
    const e = safeParse(shift.endDate);
    if (!s || !e) return false;
    return format(s, "yyyy-MM-dd") !== format(e, "yyyy-MM-dd");
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const validSchedule = mySchedule.filter(hasValidDates);

  const shiftsForSelectedDate = validSchedule.filter((shift) => {
    const s = safeParse(shift.startDate);
    const e = safeParse(shift.endDate);
    if (!s || !e) return false;
    try { return isWithinInterval(selectedDate, { start: s, end: e }); } catch { return false; }
  });

  const now = new Date();
  const upcomingShifts = validSchedule
    .filter((shift) => {
      const e = safeParse(shift.endDate);
      return e && e >= now && shift.status !== "cancelled";
    })
    .sort((a, b) => {
      const as = safeParse(a.startDate);
      const bs = safeParse(b.startDate);
      if (!as || !bs) return 0;
      return as.getTime() - bs.getTime();
    })
    .slice(0, 5);

  // Collect all dates covered by any shift (for calendar dots)
  const datesWithShifts: Date[] = [];
  validSchedule.forEach((shift) => {
    const s = safeParse(shift.startDate);
    const e = safeParse(shift.endDate);
    if (!s || !e) return;
    const cur = new Date(s);
    while (cur <= e) {
      datesWithShifts.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
  });

  const isOnDuty = validSchedule.some((s) => s.isShiftTime);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading && mySchedule.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-52" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80" />
          <Skeleton className="h-80" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Your assigned shifts and work schedule
          </p>
        </div>
        {isOnDuty && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            On Duty Now
          </div>
        )}
      </div>

      {/* Invalid shifts warning */}
      {mySchedule.length !== validSchedule.length && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            <strong>{mySchedule.length - validSchedule.length}</strong> shift(s) have invalid
            dates and are hidden. Please contact your manager.
          </span>
        </div>
      )}

      {/* Monthly stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Shifts" value={validSchedule.length}                                        icon={CalendarDays}  color="bg-slate-500"   />
        <StatCard title="Scheduled"    value={validSchedule.filter(s => s.status === "scheduled").length}  icon={CalendarClock} color="bg-blue-500"    />
        <StatCard title="Completed"    value={validSchedule.filter(s => s.status === "completed").length}  icon={CalendarCheck} color="bg-emerald-500" />
        <StatCard title="Active Now"   value={validSchedule.filter(s => s.isShiftTime).length}             icon={Clock}         color="bg-amber-500"   />
      </div>

      {/* Calendar + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              className="rounded-md border w-full"
              modifiers={{ hasShift: datesWithShifts }}
              modifiersClassNames={{
                hasShift:
                  "font-semibold relative after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary",
              }}
            />
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              <span>Shift day</span>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Shifts */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Upcoming Shifts
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({upcomingShifts.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {upcomingShifts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No upcoming shifts scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map((shift) => (
                  <div
                    key={shift._id}
                    className={`p-3 rounded-lg border transition-colors ${
                      shift.isShiftTime
                        ? "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`text-xs ${STATUS_CLS[shift.status] ?? "bg-gray-100 text-gray-600 border"}`}>
                        {shift.status}
                      </Badge>
                      {shift.isShiftTime && (
                        <Badge className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {safeFormat(shift.startDate, "EEE, MMM d")}
                        {isMultiDayShift(shift) && (
                          <> → {safeFormat(shift.endDate, "EEE, MMM d")}</>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono">{shift.startTime} – {shift.endTime}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Tag className="h-3 w-3 shrink-0" />
                      <span className="capitalize">
                        {SHIFT_TYPE_LABEL[shift.shiftType] ?? shift.shiftType}
                      </span>
                    </div>

                    {shift.notes && (
                      <p className="text-xs text-muted-foreground italic mt-2 pt-2 border-t">
                        {shift.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({shiftsForSelectedDate.length} shift{shiftsForSelectedDate.length !== 1 ? "s" : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shiftsForSelectedDate.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No shifts scheduled for this date</p>
              <p className="text-xs mt-1">Select a highlighted date to view shift details</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shiftsForSelectedDate.map((shift) => (
                <div
                  key={shift._id}
                  className={`p-4 rounded-lg border ${
                    shift.isShiftTime
                      ? "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-900/10"
                      : "border-border"
                  }`}
                >
                  {/* Status row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={STATUS_CLS[shift.status] ?? "bg-gray-100 text-gray-600 border"}>
                        {shift.status}
                      </Badge>
                      {shift.isShiftTime && (
                        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 animate-pulse">
                          Active Now
                        </Badge>
                      )}
                      {shift.emergencyActivated && (
                        <Badge className="bg-amber-100 text-amber-700 border border-amber-200 text-xs">
                          Emergency Active
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {SHIFT_TYPE_LABEL[shift.shiftType] ?? shift.shiftType}
                    </Badge>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Shift Period</p>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {safeFormat(shift.startDate, "MMM d")}
                          {isMultiDayShift(shift) && (
                            <> – {safeFormat(shift.endDate, "MMM d")}</>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Hours (WAT)</p>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium font-mono">
                          {shift.startTime} – {shift.endTime}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">{shift.hotelId?.name ?? "—"}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scheduled By</p>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">
                          {shift.createdBy?.firstName ?? "Unknown"}{" "}
                          {shift.createdBy?.lastName ?? ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {shift.notes && (
                    <>
                      <Separator className="my-3" />
                      <p className="text-xs text-muted-foreground italic">{shift.notes}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
