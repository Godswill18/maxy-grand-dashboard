import { useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  BedDouble,
  Building,
  Users,
  CalendarDays,
  CreditCard,
  ArrowRight,
  Calendar,
} from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; border: string; light: string }> = {
  pending:       { bg: "#f59e0b", border: "#d97706", light: "bg-amber-50 border-amber-400" },
  confirmed:     { bg: "#22c55e", border: "#16a34a", light: "bg-green-50 border-green-400" },
  "checked-in":  { bg: "#3b82f6", border: "#2563eb", light: "bg-blue-50 border-blue-400" },
  "checked-out": { bg: "#9ca3af", border: "#6b7280", light: "bg-gray-50 border-gray-300" },
  cancelled:     { bg: "#ef4444", border: "#dc2626", light: "bg-red-50 border-red-400" },
};

const STATUS_BADGE_CLS: Record<string, string> = {
  pending:       "bg-amber-100 text-amber-700 border border-amber-200",
  confirmed:     "bg-green-100 text-green-700 border border-green-200",
  "checked-in":  "bg-blue-100 text-blue-700 border border-blue-200",
  "checked-out": "bg-gray-100 text-gray-600 border border-gray-200",
  cancelled:     "bg-red-100 text-red-700 border border-red-200",
};

const PAYMENT_BADGE_CLS: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  partial: "bg-orange-100 text-orange-700 border border-orange-200",
  pending: "bg-rose-100 text-rose-700 border border-rose-200",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BookingCalendarProps {
  bookings: any[];
}

const getCalendarDays = (month: Date): Date[] => {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const end   = endOfWeek(endOfMonth(month),     { weekStartsOn: 0 });
  const days: Date[] = [];
  let cur = start;
  while (cur <= end) {
    days.push(cur);
    cur = addDays(cur, 1);
  }
  return days;
};

const getBookingDayInfo = (booking: any, day: Date) => {
  const d    = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const cin  = new Date(new Date(booking.checkInDate).toDateString());
  const cout = new Date(new Date(booking.checkOutDate).toDateString());
  const isActive = cin <= d && d < cout;
  const isStart  = cin.getTime() === d.getTime();
  const isEnd    = cout.getTime() - 86400000 === d.getTime();
  return { isActive, isStart, isEnd };
};

const nightCount = (cin: string, cout: string) =>
  Math.round((new Date(cout).getTime() - new Date(cin).getTime()) / 86400000);

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const capitalize = (s: string) =>
  s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function BookingCalendar({ bookings }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [daySheetOpen, setDaySheetOpen] = useState(false);

  const calendarDays = useMemo(() => getCalendarDays(currentMonth), [currentMonth]);

  const bookingsForDay = useMemo(() => {
    const map = new Map<string, { booking: any; isStart: boolean; isEnd: boolean }[]>();
    calendarDays.forEach((day) => {
      const key = day.toDateString();
      const entries: { booking: any; isStart: boolean; isEnd: boolean }[] = [];
      bookings.forEach((b) => {
        const { isActive, isStart, isEnd } = getBookingDayInfo(b, day);
        if (isActive) entries.push({ booking: b, isStart, isEnd });
      });
      map.set(key, entries);
    });
    return map;
  }, [calendarDays, bookings]);

  const selectedDayBookings: any[] = selectedDate
    ? (bookingsForDay.get(selectedDate.toDateString()) ?? []).map((e) => e.booking)
    : [];

  const handleDateClick = (day: Date, inMonth: boolean) => {
    if (!inMonth) return;
    setSelectedDate(day);
    setDaySheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day-name header */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground border-b pb-1">
        {DAY_NAMES.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar grid — click a date cell to see that day's bookings */}
      <div className="grid grid-cols-7 border-l border-t">
        {calendarDays.map((day) => {
          const key     = day.toDateString();
          const inMonth = isSameMonth(day, currentMonth);
          const today   = isToday(day);
          const dayEntries = bookingsForDay.get(key) ?? [];

          return (
            <div
              key={key}
              onClick={() => handleDateClick(day, inMonth)}
              className={[
                "border-r border-b min-h-[110px] p-1 flex flex-col gap-0.5 select-none",
                inMonth
                  ? "bg-background cursor-pointer hover:bg-muted/50 active:bg-muted transition-colors"
                  : "opacity-40 bg-muted/30 cursor-default",
                today ? "ring-2 ring-inset ring-blue-400" : "",
              ].join(" ")}
            >
              {/* Day number */}
              <span
                className={[
                  "text-xs self-end px-1 rounded-full",
                  today ? "bg-blue-500 text-white font-semibold" : "text-muted-foreground",
                ].join(" ")}
              >
                {format(day, "d")}
              </span>

              {/* Booking bars — visual indicators only */}
              {dayEntries.map(({ booking: bk, isStart, isEnd }) => {
                const color = STATUS_COLORS[bk.bookingStatus] ?? { bg: "#6b7280", border: "#4b5563" };
                return (
                  <div
                    key={bk._id + key}
                    className={[
                      "w-full overflow-hidden pointer-events-none",
                      isStart ? "rounded-l px-1 py-0.5" : "px-0 py-0",
                      isEnd   ? "rounded-r" : "",
                    ].join(" ")}
                    style={{
                      backgroundColor: color.bg,
                      borderLeft: isStart ? `3px solid ${color.border}` : undefined,
                      height: isStart ? undefined : "8px",
                      marginTop: isStart ? undefined : "2px",
                    }}
                  >
                    {isStart && (
                      <>
                        <p className="text-[11px] text-white font-medium leading-tight truncate">
                          {bk.guestName}
                        </p>
                        {bk.roomTypeId?.roomNumber && (
                          <p className="text-[10px] text-white/80 leading-tight">
                            Rm {bk.roomTypeId.roomNumber}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-3 pt-1">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: colors.bg }} />
            <span className="text-xs text-muted-foreground capitalize">{status.replace(/-/g, " ")}</span>
          </div>
        ))}
      </div>

      {/* Day detail sheet */}
      <Sheet open={daySheetOpen} onOpenChange={setDaySheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] flex flex-col p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="text-xl font-bold">
              {selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy") : ""}
            </SheetTitle>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: selectedDayBookings.length > 0 ? "#3b82f6" : "#9ca3af" }}
              />
              <span className="text-sm text-muted-foreground">
                {selectedDayBookings.length === 0
                  ? "No bookings"
                  : `${selectedDayBookings.length} booking${selectedDayBookings.length !== 1 ? "s" : ""}`}
              </span>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {selectedDayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <Calendar className="h-14 w-14 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground">No bookings on this day</p>
                <p className="text-xs text-muted-foreground/60">
                  Select another date to view its bookings
                </p>
              </div>
            ) : (
              selectedDayBookings.map((bk) => {
                const statusColor = STATUS_COLORS[bk.bookingStatus] ?? { bg: "#6b7280", border: "#4b5563" };
                const outstanding = Math.max(0, (bk.totalAmount ?? 0) - (bk.amountPaid ?? 0));
                const nights = nightCount(bk.checkInDate, bk.checkOutDate);

                return (
                  <div key={bk._id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
                    {/* Status colour top bar */}
                    <div className="h-1.5" style={{ backgroundColor: statusColor.bg }} />

                    <div className="p-4 space-y-3">
                      {/* Guest name + badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-base leading-tight">{bk.guestName}</p>
                          {bk.confirmationCode && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">
                              # {bk.confirmationCode}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge className={STATUS_BADGE_CLS[bk.bookingStatus] ?? ""}>
                            {capitalize(bk.bookingStatus)}
                          </Badge>
                          {bk.bookingType && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {capitalize(bk.bookingType)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Room + hotel + nights */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <BedDouble className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            Room {bk.roomTypeId?.roomNumber ?? "N/A"}
                            {bk.roomTypeId?.name ? ` · ${bk.roomTypeId.name}` : ""}
                          </span>
                        </div>
                        {bk.hotelId?.name && (
                          <div className="flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 shrink-0" />
                            <span>{bk.hotelId.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 shrink-0" />
                          <span>{nights} night{nights !== 1 ? "s" : ""}</span>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>{format(new Date(bk.checkInDate), "PP")}</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span>{format(new Date(bk.checkOutDate), "PP")}</span>
                      </div>

                      {/* Contact */}
                      {(bk.guestEmail || bk.guestPhone) && (
                        <div className="space-y-1">
                          {bk.guestEmail && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3 shrink-0" />
                              <span className="truncate">{bk.guestEmail}</span>
                            </div>
                          )}
                          {bk.guestPhone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{bk.guestPhone}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Payment summary */}
                      <div className="flex items-end justify-between pt-2 border-t gap-2">
                        <div className="space-y-0.5 text-sm">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground">Total:</span>
                            <span className="font-semibold">{fmt(bk.totalAmount ?? 0)}</span>
                          </div>
                          <div className="flex items-center gap-2 pl-5">
                            <span className="text-muted-foreground">Paid:</span>
                            <span className="font-semibold text-green-600">{fmt(bk.amountPaid ?? 0)}</span>
                          </div>
                          {outstanding > 0 && (
                            <div className="flex items-center gap-2 pl-5">
                              <span className="text-muted-foreground">Balance:</span>
                              <span className="font-semibold text-rose-600">{fmt(outstanding)}</span>
                            </div>
                          )}
                        </div>
                        {bk.paymentStatus && (
                          <Badge className={PAYMENT_BADGE_CLS[bk.paymentStatus] ?? ""}>
                            {capitalize(bk.paymentStatus)}
                          </Badge>
                        )}
                      </div>

                      {/* Special requests */}
                      {bk.preferences?.specialRequests && (
                        <div className="text-sm bg-muted/40 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Special Requests</p>
                          <p className="italic text-muted-foreground text-xs">{bk.preferences.specialRequests}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
