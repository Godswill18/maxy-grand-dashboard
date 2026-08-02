import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  History,
  Search,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  BedDouble,
  Building2,
  CreditCard,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Wallet,
  FileText,
  Heart,
  Sparkles,
  ArrowRight,
  Receipt,
  CalendarDays,
  LogIn,
  LogOut,
  RefreshCw,
  Ban,
  Timer,
  Banknote,
  Undo2,
  Download,
  Loader2,
} from "lucide-react";
import { useBookingStore } from "@/store/useBookingStore";
import type { AuditLogEntry } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getBookingRoomDisplay } from "@/lib/bookingDisplay";

// ── Types ──────────────────────────────────────────────────────────────────
interface PaymentEntry {
  amount: number;
  date: string;
  note?: string;
  receivedBy?: string;
}

interface BookingWithHistory {
  _id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  amountPaid?: number;
  bookingStatus: "confirmed" | "checked-in" | "checked-out" | "cancelled" | "pending";
  paymentStatus: "pending" | "partial" | "paid";
  hotelId: { _id: string; name: string } | string;
  // Booked category — legacy pair (roomTypeId+roomId) or v2 pair
  // (roomTypeV2Id+roomUnitId) is set, never both. roomTypeId/roomTypeV2Id is
  // immutable; roomId/roomUnitId is the assigned room, null until check-in.
  roomTypeId?: { _id: string; roomNumber?: string; name?: string } | string | null;
  roomId?: { _id: string; roomNumber?: string } | string | null;
  roomTypeV2Id?: { _id: string; name: string; basePrice?: number } | string | null;
  roomUnitId?: { _id: string; roomNumber?: string; status?: string } | string | null;
  createdAt: string;
  updatedAt?: string;
  guests?: number;
  numberOfGuests?: number;
  specialRequests?: string;
  bookingType?: "online" | "walk-in";
  confirmationCode?: string;
  guestDetails?: {
    address?: string;
    city?: string;
    state?: string;
    arrivingFrom?: string;
    nextOfKinName?: string;
    nextOfKinPhone?: string;
  };
  preferences?: {
    extraBedding?: boolean;
    specialRequests?: string;
  };
  paymentHistory?: PaymentEntry[];
}

// ── Color maps ─────────────────────────────────────────────────────────────
const STATUS_ROW: Record<string, string> = {
  pending:       "border-l-amber-400  bg-amber-50/30  dark:bg-amber-900/10",
  confirmed:     "border-l-green-400  bg-green-50/30  dark:bg-green-900/10",
  "checked-in":  "border-l-blue-400   bg-blue-50/30   dark:bg-blue-900/10",
  "checked-out": "border-l-gray-300   bg-gray-50/30   dark:bg-gray-800/10",
  cancelled:     "border-l-red-400    bg-red-50/30    dark:bg-red-900/10",
};

const STATUS_BADGE: Record<string, string> = {
  pending:       "bg-amber-100 text-amber-700 border-amber-200",
  confirmed:     "bg-green-100 text-green-700 border-green-200",
  "checked-in":  "bg-blue-100  text-blue-700  border-blue-200",
  "checked-out": "bg-gray-100  text-gray-600  border-gray-200",
  cancelled:     "bg-red-100   text-red-600   border-red-200",
};

const PAYMENT_BADGE: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  partial: "bg-orange-100  text-orange-700  border-orange-200",
  pending: "bg-rose-100    text-rose-700    border-rose-200",
};

const STATUS_GRADIENT: Record<string, string> = {
  pending:       "from-amber-50  to-amber-100/50  dark:from-amber-900/20  dark:to-amber-800/10  border-amber-200/60",
  confirmed:     "from-green-50  to-green-100/50  dark:from-green-900/20  dark:to-green-800/10  border-green-200/60",
  "checked-in":  "from-blue-50   to-blue-100/50   dark:from-blue-900/20   dark:to-blue-800/10   border-blue-200/60",
  "checked-out": "from-gray-50   to-gray-100/50   dark:from-gray-900/20   dark:to-gray-800/10   border-gray-200/60",
  cancelled:     "from-red-50    to-red-100/50    dark:from-red-900/20    dark:to-red-800/10    border-red-200/60",
};

// ── Activity log event styling ────────────────────────────────────────────
const AUDIT_EVENT_ICON: Record<string, React.ElementType> = {
  booking_created: FileText,
  booking_updated: RefreshCw,
  booking_confirmed: CheckCircle2,
  booking_cancelled: Ban,
  booking_expired: Timer,
  checked_in: LogIn,
  checked_out: LogOut,
  booking_extended: CalendarDays,
  room_reassigned: ArrowRight,
  payment_received: Banknote,
  payment_refunded: Undo2,
};

const AUDIT_EVENT_COLOR: Record<string, string> = {
  booking_created: "bg-blue-100 border-blue-200 text-blue-600",
  booking_updated: "bg-gray-100 border-gray-200 text-gray-600",
  booking_confirmed: "bg-green-100 border-green-200 text-green-600",
  booking_cancelled: "bg-red-100 border-red-200 text-red-600",
  booking_expired: "bg-amber-100 border-amber-200 text-amber-600",
  checked_in: "bg-blue-100 border-blue-200 text-blue-600",
  checked_out: "bg-emerald-100 border-emerald-200 text-emerald-600",
  booking_extended: "bg-violet-100 border-violet-200 text-violet-600",
  room_reassigned: "bg-orange-100 border-orange-200 text-orange-600",
  payment_received: "bg-emerald-100 border-emerald-200 text-emerald-600",
  payment_refunded: "bg-rose-100 border-rose-200 text-rose-600",
};

const AUDIT_EVENT_LABEL: Record<string, string> = {
  booking_created: "Booking Created",
  booking_updated: "Booking Updated",
  booking_confirmed: "Booking Confirmed",
  booking_cancelled: "Booking Cancelled",
  booking_expired: "Booking Expired",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  booking_extended: "Booking Extended",
  room_reassigned: "Room Reassigned",
  payment_received: "Payment Received",
  payment_refunded: "Payment Refunded",
};

const fmtFieldValue = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtDateForDisplay(v);
  return String(v);
};
const fmtDateForDisplay = (d: string) => {
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtMoney = (n: number) =>
  `₦${(n ?? 0).toLocaleString()}`;

const getNights = (cin: string, cout: string) => {
  const diff = new Date(cout).getTime() - new Date(cin).getTime();
  return Math.max(1, Math.round(diff / 86_400_000));
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

const hotelName  = (b: BookingWithHistory) =>
  b.hotelId   && typeof b.hotelId   === "object" ? b.hotelId.name              : typeof b.hotelId   === "string" ? b.hotelId   : "—";
const roomNumber = (b: BookingWithHistory) => getBookingRoomDisplay(b).roomNumber ?? "Not assigned";
const roomName   = (b: BookingWithHistory) => getBookingRoomDisplay(b).category;

const PAGE_SIZE = 15;

// ── Status filter pills ────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { key: "all",          label: "All" },
  { key: "pending",      label: "Pending" },
  { key: "confirmed",    label: "Confirmed" },
  { key: "checked-in",   label: "Checked In" },
  { key: "checked-out",  label: "Checked Out" },
  { key: "cancelled",    label: "Cancelled" },
] as const;

// ══════════════════════════════════════════════════════════════════════════
export default function BookingHistory() {
  const { user }                           = useAuthStore();
  const {
    bookings, isLoading, error, fetchBookings, initSocketListeners, closeSocketListeners,
    auditLog, auditLogPage, auditLogTotalPages, auditLogSort, isLoadingAuditLog,
    fetchBookingAuditLog, setAuditLogSort, exportBookingAuditLog, refundBooking,
  } = useBookingStore();

  const [search, setSearch]                 = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [dateRange, setDateRange]           = useState<DateRange | undefined>(undefined);
  const [dateOpen, setDateOpen]             = useState(false);
  const [selected, setSelected]             = useState<BookingWithHistory | null>(null);
  const [sheetOpen, setSheetOpen]           = useState(false);
  const [page, setPage]                     = useState(1);

  // Role-aware fetch
  useEffect(() => {
    const hotelId = user?.role === "superadmin" ? undefined : user?.hotelId;
    fetchBookings(hotelId);
    initSocketListeners();
    return () => {
      closeSocketListeners();
    };
  }, [user?.hotelId, user?.role]);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return (bookings as BookingWithHistory[]).filter((b) => {
      const matchesSearch =
        b.guestName?.toLowerCase().includes(q) ||
        b.guestEmail?.toLowerCase().includes(q) ||
        b.guestPhone?.toLowerCase().includes(q) ||
        (b.confirmationCode?.toLowerCase().includes(q) ?? false);

      const matchesStatus =
        statusFilter === "all" || b.bookingStatus === statusFilter;

      const cin = new Date(b.checkInDate);
      const matchesDate =
        !dateRange?.from ||
        (cin >= dateRange.from && (!dateRange.to || cin <= dateRange.to));

      return matchesSearch && matchesStatus && matchesDate && b.bookingStatus !== 'failed' && b.bookingStatus !== 'pending' && b.bookingStatus !== 'expired';
    });
  }, [bookings, search, statusFilter, dateRange]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, dateRange]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = bookings as BookingWithHistory[];
    return {
      total:       all.length,
      checkedOut:  all.filter((b) => b.bookingStatus === "checked-out").length,
      active:      all.filter((b) => b.bookingStatus === "checked-in").length,
      pending:     all.filter((b) => b.bookingStatus === "pending" || b.bookingStatus === "confirmed").length,
      cancelled:   all.filter((b) => b.bookingStatus === "cancelled").length,
      revenue:     all.reduce((s, b) => s + (b.amountPaid ?? 0), 0),
    };
  }, [bookings]);

  const statPills = [
    { label: "Total",       value: stats.total,      icon: FileText,    cls: "text-primary" },
    { label: "Checked-Out", value: stats.checkedOut,  icon: CheckCircle2, cls: "text-emerald-600" },
    { label: "Active",      value: stats.active,      icon: Users,       cls: "text-blue-500" },
    { label: "Pending",     value: stats.pending,     icon: Clock,       cls: "text-amber-500" },
    { label: "Cancelled",   value: stats.cancelled,   icon: XCircle,     cls: "text-red-500" },
    { label: "Revenue",     value: fmtMoney(stats.revenue), icon: Wallet, cls: "text-violet-500" },
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────
  const openDetail = (b: BookingWithHistory) => {
    setSelected(b);
    setSheetOpen(true);
    fetchBookingAuditLog(b._id, 1, auditLogSort);
  };

  const canViewAuditLog = user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const canRecordRefund = user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'superadmin';

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading && bookings.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-56" />
        </div>
        <div className="flex gap-3 flex-wrap">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-full" />)}
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardContent className="p-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center bg-card rounded-xl border border-destructive/20">
        <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold mb-1">Could Not Load Bookings</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Booking History</h1>
            <p className="text-sm text-muted-foreground">Complete record of all hotel reservations</p>
          </div>
        </div>
      </div>

      {/* ── Stat Pills ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2.5">
        {statPills.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="flex items-center gap-2 bg-muted/50 border rounded-full px-4 py-1.5">
            <Icon className={`h-4 w-4 ${cls}`} />
            <span className="font-bold text-sm text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Search + Filter Bar ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search guest, email, code…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Date range picker */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 text-sm font-normal">
              <CalendarIcon className="h-4 w-4" />
              {dateRange?.from
                ? dateRange.to
                  ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
                  : format(dateRange.from, "MMM d, yyyy")
                : "Filter by check-in date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <DatePickerCalendar
              initialFocus
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
            {dateRange && (
              <div className="p-3 border-t">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateRange(undefined)}>
                  Clear date range
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize",
                statusFilter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ───────────────────────────────────────────── */}
      <p className="text-xs text-muted-foreground -mt-2">
        {filtered.length} booking{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* ── Empty state ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-card rounded-xl border border-dashed">
          <History className="h-10 w-10 mb-3 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-1">No Bookings Found</h2>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          {/* ── Booking List ──────────────────────────────────────── */}
          <div className="space-y-3">
            {paginated.map((b, idx) => {
              const nights   = getNights(b.checkInDate, b.checkOutDate);
              const balance  = (b.totalAmount ?? 0) - (b.amountPaid ?? 0);
              const hotel    = hotelName(b);
              const room     = roomNumber(b);
              const rowStyle = STATUS_ROW[b.bookingStatus] ?? STATUS_ROW.pending;

              return (
                <Card
                  key={b._id}
                  className={cn(
                    "border-l-4 hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom overflow-hidden",
                    rowStyle
                  )}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-sm text-primary">
                        {getInitials(b.guestName)}
                      </div>

                      {/* Content — fills remaining width */}
                      <div className="flex-1 min-w-0 space-y-2">

                        {/* Row 1: Guest name + booking type badge | status badges */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-foreground leading-tight">{b.guestName}</span>
                              {b.bookingType && (
                                <span className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                                  b.bookingType === "walk-in"
                                    ? "bg-violet-100 text-violet-700 border-violet-200"
                                    : "bg-sky-100 text-sky-700 border-sky-200"
                                )}>
                                  {b.bookingType === "walk-in" ? "Walk-in" : "Online"}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{b.guestEmail}</p>
                          </div>
                          {/* Badges — stacked on mobile, inline on sm+ */}
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
                            <Badge className={cn("border text-[11px]", STATUS_BADGE[b.bookingStatus] ?? STATUS_BADGE.pending)}>
                              {b.bookingStatus.replace("-", " ")}
                            </Badge>
                            <Badge className={cn("border text-[11px]", PAYMENT_BADGE[b.paymentStatus] ?? PAYMENT_BADGE.pending)}>
                              {b.paymentStatus === "pending" ? "Unpaid" : b.paymentStatus}
                            </Badge>
                          </div>
                        </div>

                        {/* Row 2: Room · hotel · dates · amount · view button */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          {/* Room — always visible */}
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <BedDouble className="h-3.5 w-3.5 shrink-0" />
                            <span>{getBookingRoomDisplay(b).label}</span>
                          </div>

                          {/* Hotel — sm+ */}
                          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[140px]">{hotel}</span>
                          </div>

                          {/* Dates — sm+ */}
                          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            <span>{fmtDate(b.checkInDate)}</span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span>{fmtDate(b.checkOutDate)}</span>
                            <span className="font-medium text-foreground ml-0.5">{nights}n</span>
                          </div>

                          {/* Amount — always visible */}
                          <div className="text-xs">
                            <span className="font-bold text-foreground">{fmtMoney(b.totalAmount)}</span>
                            {balance > 0 ? (
                              <span className="text-red-500 font-medium ml-1">(bal: {fmtMoney(balance)})</span>
                            ) : (
                              <span className="text-emerald-600 font-medium ml-1">· paid</span>
                            )}
                          </div>

                          {/* Spacer pushes button to the right */}
                          <div className="flex-1" />

                          {/* View button — always visible */}
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs shrink-0 h-7 px-3"
                            onClick={() => openDetail(b)}
                          >
                            View
                          </Button>
                        </div>

                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Pagination ──────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} &middot; {filtered.length} results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Detail Sheet
      ══════════════════════════════════════════════════════════════ */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0">
          {selected && <BookingDetailPanel booking={selected} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Detail Panel — rendered inside the Sheet
// ══════════════════════════════════════════════════════════════════════════
function BookingDetailPanel({ booking: b }: { booking: BookingWithHistory }) {
  const nights  = getNights(b.checkInDate, b.checkOutDate);
  const balance = (b.totalAmount ?? 0) - (b.amountPaid ?? 0);
  const hotel   = hotelName(b);
  const room    = roomNumber(b);
  const rName   = roomName(b);
  const gradCls = STATUS_GRADIENT[b.bookingStatus] ?? STATUS_GRADIENT.pending;

  const { user } = useAuthStore();
  const {
    auditLog, auditLogPage, auditLogTotalPages, auditLogSort, isLoadingAuditLog,
    fetchBookingAuditLog, setAuditLogSort, exportBookingAuditLog, refundBooking,
  } = useBookingStore();

  const canViewAuditLog = user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'superadmin';
  const canRecordRefund = canViewAuditLog;
  const isSuperAdmin = user?.role === 'superadmin';

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSortToggle = (sort: 'newest' | 'oldest') => {
    setAuditLogSort(sort);
    fetchBookingAuditLog(b._id, 1, sort);
  };

  const handleAuditPageChange = (nextPage: number) => {
    fetchBookingAuditLog(b._id, nextPage, auditLogSort);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await exportBookingAuditLog(b._id, b.confirmationCode);
    setIsExporting(false);
  };

  const handleRefundSubmit = async () => {
    const amount = parseFloat(refundAmount);
    if (!amount || amount <= 0) return;
    setIsRefunding(true);
    const result = await refundBooking(b._id, amount, refundReason, refundNotes || undefined);
    setIsRefunding(false);
    if (result.success) {
      setRefundOpen(false);
      setRefundAmount("");
      setRefundReason("");
      setRefundNotes("");
    }
  };

  return (
    <div className="flex flex-col">

      {/* ── Hero Header ───────────────────────────────────────────── */}
      <div className={cn("px-6 py-5 bg-gradient-to-br border-b", gradCls)}>
        <SheetHeader>
          <SheetTitle className="text-xl font-bold text-foreground">Booking Details</SheetTitle>
        </SheetHeader>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-primary/15 border-2 border-primary/20 flex items-center justify-center font-bold text-lg text-primary">
            {getInitials(b.guestName)}
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{b.guestName}</p>
            <p className="text-sm text-muted-foreground">{b.guestEmail}</p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1">
            <Badge className={cn("border", STATUS_BADGE[b.bookingStatus] ?? STATUS_BADGE.pending)}>
              {b.bookingStatus.replace("-", " ")}
            </Badge>
            {b.confirmationCode && (
              <span className="text-[11px] text-muted-foreground font-mono">
                #{b.confirmationCode}
              </span>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            Created {fmtDateTime(b.createdAt)}
          </span>
          {b.bookingType && (
            <span className={cn(
              "px-2 py-0.5 rounded-full border font-medium",
              b.bookingType === "walk-in"
                ? "bg-violet-100 text-violet-700 border-violet-200"
                : "bg-sky-100 text-sky-700 border-sky-200"
            )}>
              {b.bookingType === "walk-in" ? "Walk-in" : "Online Booking"}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="p-6 space-y-5">

        {/* 1 · Guest Information */}
        <Section icon={User} title="Guest Information">
          <DetailGrid>
            <DetailItem label="Full Name"  value={b.guestName} />
            <DetailItem label="Email"      value={b.guestEmail} icon={<Mail className="h-3.5 w-3.5" />} />
            <DetailItem label="Phone"      value={b.guestPhone} icon={<Phone className="h-3.5 w-3.5" />} />
            <DetailItem label="Guests"     value={`${b.numberOfGuests ?? b.guests ?? 1} person${(b.numberOfGuests ?? b.guests ?? 1) > 1 ? "s" : ""}`} />
            {b.guestDetails?.address && (
              <DetailItem label="Address" value={b.guestDetails.address} className="col-span-2" icon={<MapPin className="h-3.5 w-3.5" />} />
            )}
            {(b.guestDetails?.city || b.guestDetails?.state) && (
              <DetailItem
                label="City / State"
                value={[b.guestDetails.city, b.guestDetails.state].filter(Boolean).join(", ")}
              />
            )}
            {b.guestDetails?.arrivingFrom && (
              <DetailItem label="Arriving From" value={b.guestDetails.arrivingFrom} />
            )}
          </DetailGrid>
        </Section>

        {/* 2 · Next of Kin */}
        <Section icon={Heart} title="Next of Kin">
          {b.guestDetails?.nextOfKinName || b.guestDetails?.nextOfKinPhone ? (
            <DetailGrid>
              {b.guestDetails.nextOfKinName && (
                <DetailItem label="Name"  value={b.guestDetails.nextOfKinName} />
              )}
              {b.guestDetails.nextOfKinPhone && (
                <DetailItem label="Phone" value={b.guestDetails.nextOfKinPhone} icon={<Phone className="h-3.5 w-3.5" />} />
              )}
            </DetailGrid>
          ) : (
            <p className="text-sm text-muted-foreground italic">Not provided</p>
          )}
        </Section>

        {/* 3 · Preferences */}
        <Section icon={Sparkles} title="Preferences & Requests">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28 shrink-0">Extra Bedding</span>
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full border",
                b.preferences?.extraBedding
                  ? "bg-green-100 text-green-700 border-green-200"
                  : "bg-gray-100 text-gray-500 border-gray-200"
              )}>
                {b.preferences?.extraBedding ? "Requested" : "Not requested"}
              </span>
            </div>
            {(b.preferences?.specialRequests || b.specialRequests) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Special Requests</p>
                <p className="text-sm bg-muted/40 rounded-lg p-3 text-foreground">
                  {b.preferences?.specialRequests ?? b.specialRequests}
                </p>
              </div>
            )}
            {!b.preferences?.specialRequests && !b.specialRequests && !b.preferences?.extraBedding && (
              <p className="text-sm text-muted-foreground italic">No preferences recorded</p>
            )}
          </div>
        </Section>

        <Separator />

        {/* 4 · Booking Details */}
        <Section icon={BedDouble} title="Booking Details">
          <DetailGrid>
            <DetailItem label="Hotel"       value={hotel}           icon={<Building2 className="h-3.5 w-3.5" />} />
            <DetailItem label="Assigned Room" value={room === "Not assigned" ? room : `Room ${room}`} icon={<BedDouble className="h-3.5 w-3.5" />} />
            <DetailItem label="Room Category" value={rName} />
            <DetailItem label="Check-in"   value={fmtDate(b.checkInDate)} />
            <DetailItem label="Check-out"  value={fmtDate(b.checkOutDate)} />
            <DetailItem label="Duration"   value={`${nights} night${nights !== 1 ? "s" : ""}`} />
            <DetailItem label="Booked On"  value={fmtDateTime(b.createdAt)} className="col-span-2" />
            {b.updatedAt && (
              <DetailItem label="Last Updated" value={fmtDateTime(b.updatedAt)} className="col-span-2" />
            )}
          </DetailGrid>
        </Section>

        <Separator />

        {/* 5 · Financial Summary */}
        <Section icon={CreditCard} title="Financial Summary">
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-xl font-bold text-foreground">{fmtMoney(b.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="text-base font-semibold text-emerald-600">{fmtMoney(b.amountPaid ?? 0)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">Balance Due</span>
                <span className={cn("text-base font-bold", balance > 0 ? "text-red-500" : "text-emerald-600")}>
                  {balance > 0 ? fmtMoney(balance) : "Fully Paid"}
                </span>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Payment Status</span>
                <Badge className={cn("border", PAYMENT_BADGE[b.paymentStatus] ?? PAYMENT_BADGE.pending)}>
                  {b.paymentStatus === "pending" ? "Unpaid" : b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)}
                </Badge>
              </div>
            </div>
            {canRecordRefund && (b.amountPaid ?? 0) > 0 && (
              <div className="px-4 pb-4">
                <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Undo2 className="h-3.5 w-3.5" />
                      Record Refund
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record a Refund</DialogTitle>
                      <DialogDescription>
                        A bookkeeping entry only — this does not process a payment-gateway refund.
                        Amount paid so far: {fmtMoney(b.amountPaid ?? 0)}.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <div>
                        <Label htmlFor="refund-amount">Amount (₦)</Label>
                        <Input
                          id="refund-amount"
                          type="number"
                          min={0}
                          max={b.amountPaid ?? 0}
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="refund-reason">Reason</Label>
                        <Input
                          id="refund-reason"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder="e.g. Guest cancelled early"
                        />
                      </div>
                      <div>
                        <Label htmlFor="refund-notes">Notes (optional)</Label>
                        <Textarea
                          id="refund-notes"
                          rows={2}
                          value={refundNotes}
                          onChange={(e) => setRefundNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setRefundOpen(false)} disabled={isRefunding}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleRefundSubmit}
                        disabled={isRefunding || !refundAmount || !refundReason.trim() || parseFloat(refundAmount) <= 0}
                      >
                        {isRefunding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Record Refund
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </Section>

        {/* 6 · Payment History */}
        <Section icon={Receipt} title="Payment History">
          {b.paymentHistory && b.paymentHistory.length > 0 ? (
            <div className="space-y-3">
              {b.paymentHistory.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Receipt className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="flex-1 rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-700">{fmtMoney(entry.amount)}</span>
                      <span className="text-xs text-muted-foreground">{fmtDate(entry.date)}</span>
                    </div>
                    {entry.note && (
                      <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>
                    )}
                    {entry.receivedBy && (
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Received by staff ID: {entry.receivedBy}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No payment records found</p>
          )}
        </Section>

        {/* 7 · Activity Log / Audit Trail */}
        {canViewAuditLog && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => handleSortToggle('newest')}
                    className={cn("px-2 py-1", auditLogSort === 'newest' ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}
                  >
                    Newest
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSortToggle('oldest')}
                    className={cn("px-2 py-1", auditLogSort === 'oldest' ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}
                  >
                    Oldest
                  </button>
                </div>
                {isSuperAdmin && (
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleExport} disabled={isExporting}>
                    {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                    Export
                  </Button>
                )}
              </div>
            </div>

            {isLoadingAuditLog ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
              </div>
            ) : auditLog.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No activity recorded yet</p>
            ) : (
              <>
                <div className="space-y-3">
                  {auditLog.map((entry: AuditLogEntry) => {
                    const Icon = AUDIT_EVENT_ICON[entry.eventType] || FileText;
                    const color = AUDIT_EVENT_COLOR[entry.eventType] || "bg-gray-100 border-gray-200 text-gray-600";
                    return (
                      <div key={entry._id} className="flex items-start gap-3">
                        <div className={cn("h-7 w-7 rounded-full border flex items-center justify-center shrink-0 mt-0.5", color)}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 rounded-lg border bg-card p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{AUDIT_EVENT_LABEL[entry.eventType] || entry.eventType}</p>
                            <span className="text-xs text-muted-foreground shrink-0">{fmtDateTime(entry.createdAt)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                          {entry.performedByName && (
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.performedByName} ({entry.performedByRole}){entry.performedByBranch ? ` · ${entry.performedByBranch}` : ""}
                            </p>
                          )}
                          {entry.changes && entry.changes.length > 0 && (
                            <div className="mt-2 space-y-1 border-t pt-2">
                              {entry.changes.map((c, i) => (
                                <p key={i} className="text-[11px] text-muted-foreground">
                                  <span className="font-medium text-foreground">{c.field}:</span>{" "}
                                  {fmtFieldValue(c.from)} <ArrowRight className="inline h-2.5 w-2.5 mx-0.5" /> {fmtFieldValue(c.to)}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {auditLogTotalPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleAuditPageChange(auditLogPage - 1)}
                      disabled={auditLogPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">Page {auditLogPage} of {auditLogTotalPages}</span>
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleAuditPageChange(auditLogPage + 1)}
                      disabled={auditLogPage >= auditLogTotalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

function DetailItem({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
      <div className="flex items-center gap-1">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-sm font-medium text-foreground">{value ?? "—"}</p>
      </div>
    </div>
  );
}
