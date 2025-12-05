import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO, isWithinInterval, isValid } from "date-fns";
import { useShiftStore } from "@/store/useSiftStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

export default function MySchedule() {
  const { user } = useAuthStore();
  const { mySchedule, isLoading, fetchMySchedule, initializeSocket, disconnectSocket } =
    useShiftStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());

  useEffect(() => {
    initializeSocket();
    loadSchedule();

    // Listen for shift updates specific to this user
    return () => {
      disconnectSocket();
    };
  }, []);

  const loadSchedule = () => {
    const start = startOfMonth(selectedMonth);
    const end = endOfMonth(selectedMonth);
    
    fetchMySchedule({
      startDate: format(start, "yyyy-MM-dd"),
      endDate: format(end, "yyyy-MM-dd"),
    });
  };

  useEffect(() => {
    loadSchedule();
  }, [selectedMonth]);

  // Helper function to safely parse dates
  const safeParse = (dateString: any): Date | null => {
    if (!dateString) return null;
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  // Helper to check if shift has valid dates
  const hasValidDates = (shift: any): boolean => {
    return !!(shift.startDate && shift.endDate && safeParse(shift.startDate) && safeParse(shift.endDate));
  };

  // Filter out invalid shifts
  const validSchedule = mySchedule.filter(hasValidDates);

  // Get shifts for selected date (check if date falls within shift range)
  const shiftsForSelectedDate = validSchedule.filter((shift) => {
    const shiftStart = safeParse(shift.startDate);
    const shiftEnd = safeParse(shift.endDate);
    
    if (!shiftStart || !shiftEnd) return false;
    
    try {
      return isWithinInterval(selectedDate, { start: shiftStart, end: shiftEnd });
    } catch {
      return false;
    }
  });

  // Get upcoming shifts (shifts that haven't ended yet)
  const now = new Date();
  const upcomingShifts = validSchedule
    .filter((shift) => {
      const shiftEnd = safeParse(shift.endDate);
      if (!shiftEnd) return false;
      return shiftEnd >= now && shift.status !== "cancelled";
    })
    .sort((a, b) => {
      const aStart = safeParse(a.startDate);
      const bStart = safeParse(b.startDate);
      if (!aStart || !bStart) return 0;
      return aStart.getTime() - bStart.getTime();
    })
    .slice(0, 5);

  // Get all dates covered by shifts for calendar highlighting
  const datesWithShifts: Date[] = [];
  validSchedule.forEach((shift) => {
    const startDate = safeParse(shift.startDate);
    const endDate = safeParse(shift.endDate);
    
    if (!startDate || !endDate) return;
    
    // Add all dates in the range
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      datesWithShifts.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "in-progress":
        return "bg-green-500 animate-pulse";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      case "in-progress":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Check if a shift spans multiple days
  const isMultiDayShift = (shift: any) => {
    if (!hasValidDates(shift)) return false;
    const start = safeParse(shift.startDate);
    const end = safeParse(shift.endDate);
    if (!start || !end) return false;
    return format(start, "yyyy-MM-dd") !== format(end, "yyyy-MM-dd");
  };

  // Safe format helper
  const safeFormat = (dateString: any, formatStr: string, fallback: string = "Invalid Date"): string => {
    const date = safeParse(dateString);
    if (!date) return fallback;
    try {
      return format(date, formatStr);
    } catch {
      return fallback;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Schedule</h1>
        <p className="text-muted-foreground">View your assigned shifts and work schedule</p>
      </div>

      {/* Show warning if there are invalid shifts */}
      {mySchedule.length !== validSchedule.length && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                  {mySchedule.length - validSchedule.length} shift(s) have invalid dates
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Please contact your manager to update these shifts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Shift Status */}
      {validSchedule.some((s) => s.isActive) && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-300">
                  You are currently on duty
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Your shift is active right now
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={selectedMonth}
              onMonthChange={setSelectedMonth}
              className="rounded-md border w-full"
              modifiers={{
                hasShift: datesWithShifts,
              }}
              modifiersStyles={{
                hasShift: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                },
              }}
            />

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span>Has shift</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Shifts */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">Loading...</div>
            ) : upcomingShifts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No upcoming shifts scheduled
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingShifts.map((shift) => (
                  <div
                    key={shift._id}
                    className="p-3 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getStatusBadgeColor(shift.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(shift.status)}
                          {shift.status}
                        </span>
                      </Badge>
                      {shift.isActive && (
                        <Badge className="bg-green-500">Active</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold">
                        📅 {safeFormat(shift.startDate, "EEE, MMM d")}
                        {isMultiDayShift(shift) && (
                          <span> → {safeFormat(shift.endDate, "EEE, MMM d")}</span>
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        ⏰ {shift.startTime} - {shift.endTime}
                      </p>
                      <p className="text-muted-foreground">
                        🏷️ {shift.shiftType}
                      </p>
                      {shift.notes && (
                        <p className="text-muted-foreground italic mt-2">
                          📝 {shift.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            Shifts for {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shiftsForSelectedDate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shifts scheduled for this date
            </div>
          ) : (
            <div className="space-y-4">
              {shiftsForSelectedDate.map((shift) => (
                <div
                  key={shift._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadgeColor(shift.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(shift.status)}
                          {shift.status}
                        </span>
                      </Badge>
                      {shift.isActive && (
                        <Badge className="bg-green-500 animate-pulse">
                          Active Now
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline">{shift.shiftType}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Shift Period</p>
                      <p className="font-semibold">
                        {safeFormat(shift.startDate, "MMM d")}
                        {isMultiDayShift(shift) && (
                          <span> - {safeFormat(shift.endDate, "MMM d")}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Shift Hours</p>
                      <p className="font-semibold">{shift.startTime} - {shift.endTime}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{shift.hotelId?.name || "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Scheduled By</p>
                      <p className="font-semibold">
                        {shift.createdBy?.firstName || "Unknown"} {shift.createdBy?.lastName || ""}
                      </p>
                    </div>
                  </div>

                  {isMultiDayShift(shift) && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        📆 Multi-day shift: {safeFormat(shift.startDate, "MMM d")} - {safeFormat(shift.endDate, "MMM d")}
                      </p>
                    </div>
                  )}

                  {shift.notes && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-semibold mb-1">Notes:</p>
                      <p className="text-sm text-muted-foreground">{shift.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Shifts Summary */}
      <Card>
        <CardHeader>
          <CardTitle>This Month's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold">{validSchedule.length}</p>
              <p className="text-sm text-muted-foreground">Total Shifts</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-blue-500">
                {validSchedule.filter((s) => s.status === "scheduled").length}
              </p>
              <p className="text-sm text-muted-foreground">Scheduled</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-gray-500">
                {validSchedule.filter((s) => s.status === "completed").length}
              </p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-500">
                {validSchedule.filter((s) => s.isActive).length}
              </p>
              <p className="text-sm text-muted-foreground">Active Now</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}