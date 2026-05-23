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
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  X,
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
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

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

  const b = selectedBooking;
  const statusColor = b ? (STATUS_COLORS[b.bookingStatus] ?? { bg: "#6b7280", border: "#4b5563", light: "" }) : null;
  const outstanding = b ? Math.max(0, (b.totalAmount ?? 0) - (b.amountPaid ?? 0)) : 0;
  const nights = b ? nightCount(b.checkInDate, b.checkOutDate) : 0;

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

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-l border-t">
        {calendarDays.map((day) => {
          const key     = day.toDateString();
          const inMonth = isSameMonth(day, currentMonth);
          const today   = isToday(day);

          const dayEntries = bookingsForDay.get(key) ?? [];

          return (
            <div
              key={key}
              className={[
                "border-r border-b min-h-[110px] p-1 flex flex-col gap-0.5",
                !inMonth ? "opacity-40 bg-muted/30" : "bg-background",
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

              {/* Booking bars */}
              {dayEntries.map(({ booking: bk, isStart, isEnd }) => {
                const color = STATUS_COLORS[bk.bookingStatus] ?? { bg: "#6b7280", border: "#4b5563" };
                return (
                  <button
                    key={bk._id + key}
                    onClick={() => setSelectedBooking(bk)}
                    title={bk.guestName}
                    className={[
                      "w-full text-left cursor-pointer overflow-hidden",
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
                  </button>
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

      {/* Detail dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          {b && statusColor && (
            <div className="flex">
              {/* Colored left bar */}
              <div
                className="w-1 shrink-0"
                style={{ backgroundColor: statusColor.bg }}
              />

              <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[80vh]">
                {/* Close */}
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Badges + name */}
                <div className="space-y-1 pr-6">
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={STATUS_BADGE_CLS[b.bookingStatus] ?? ""}>
                      {capitalize(b.bookingStatus)}
                    </Badge>
                    {b.bookingType && (
                      <Badge variant="outline" className="capitalize">
                        {capitalize(b.bookingType)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xl font-bold">{b.guestName}</p>
                  {b.confirmationCode && (
                    <p className="text-xs text-muted-foreground font-mono"># {b.confirmationCode}</p>
                  )}
                </div>

                <hr />

                {/* Room / Hotel */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <BedDouble className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Room</p>
                      <p className="font-medium">
                        {b.roomTypeId?.roomNumber ?? "N/A"}
                        {b.roomTypeId?.name ? ` · ${b.roomTypeId.name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Building className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Hotel</p>
                      <p className="font-medium">{b.hotelId?.name ?? "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Dates / nights */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="font-medium">{format(new Date(b.checkInDate), "PP")}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="font-medium">{format(new Date(b.checkOutDate), "PP")}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    <span className="font-medium">{nights}</span> night{nights !== 1 ? "s" : ""}
                    {b.numberOfGuests ? ` · ${b.numberOfGuests} guest${b.numberOfGuests !== 1 ? "s" : ""}` : ""}
                  </span>
                </div>

                <hr />

                {/* Contact */}
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {b.guestEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="truncate">{b.guestEmail}</span>
                    </div>
                  )}
                  {b.guestPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{b.guestPhone}</span>
                    </div>
                  )}
                </div>

                <hr />

                {/* Payment */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Payment</span>
                    {b.paymentStatus && (
                      <Badge className={PAYMENT_BADGE_CLS[b.paymentStatus] ?? ""}>
                        {capitalize(b.paymentStatus)}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm space-y-1 pl-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium">{fmt(b.totalAmount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paid</span>
                      <span className="font-medium text-green-600">{fmt(b.amountPaid ?? 0)}</span>
                    </div>
                    {outstanding > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Outstanding</span>
                        <span className="font-medium text-rose-600">{fmt(outstanding)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special requests */}
                {b.preferences?.specialRequests && (
                  <>
                    <hr />
                    <div className="text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Special Requests</p>
                      <p className="italic text-muted-foreground">{b.preferences.specialRequests}</p>
                    </div>
                  </>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
