// src/pages/OutstandingBalances.tsx
// Centralized dashboard for bookings with an unpaid or partially-paid
// balance — branch-scoped (receptionist/branch manager see their own
// branch, superadmin sees all). Reuses the stat-card convention from
// Transactions.tsx/Reports.tsx and the client-side filter pattern from
// Transactions.tsx (fetch once, filter via useMemo) — the server only does
// the "outstanding > 0" filtering and branch scoping that can't reasonably
// be pushed client-side.
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  Wallet,
  Filter,
  X,
  Download,
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Receipt,
  User,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileDown,
  Printer,
} from "lucide-react";
import { useBookingStore, type Booking } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { getBookingRoomDisplay } from "@/lib/bookingDisplay";
import { cn } from "@/lib/utils";
import BookingActivityLog from "@/components/BookingActivityLog";

const fmtMoney = (n: number) => `₦${(n ?? 0).toLocaleString()}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const PAYMENT_STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  partial: "bg-orange-100 text-orange-700 border-orange-200",
  pending: "bg-rose-100 text-rose-700 border-rose-200",
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "pos", label: "POS" },
  { value: "other", label: "Other" },
];

export default function OutstandingBalances() {
  const { user } = useAuthStore();
  const { outstandingBookings, outstandingSummary, isLoadingOutstanding, fetchOutstandingBalances } = useBookingStore();

  const canRecordPayment = user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'superadmin';
  const canEditOrAdjust = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [autoOpenRecordPayment, setAutoOpenRecordPayment] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const [filters, setFilters] = useState({
    searchTerm: "",
    paymentStatus: "all" as "all" | "partial" | "pending",
    roomCategory: "all",
    startDate: "",
    endDate: "",
    minOutstanding: "",
    maxOutstanding: "",
    overdueOnly: false,
  });

  useEffect(() => {
    fetchOutstandingBalances(user?.role === 'superadmin' ? undefined : user?.hotelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.hotelId]);

  // Whenever the selected booking's underlying data changes (e.g. a payment
  // was just recorded), keep the open Sheet showing the fresh copy.
  useEffect(() => {
    if (!selected) return;
    const fresh = outstandingBookings.find((b) => b._id === selected._id);
    if (fresh) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outstandingBookings]);

  const roomCategories = useMemo(() => {
    const names = new Set<string>();
    outstandingBookings.forEach((b) => names.add(getBookingRoomDisplay(b).category));
    return Array.from(names).sort();
  }, [outstandingBookings]);

  const filteredBookings = useMemo(() => {
    return outstandingBookings.filter((b) => {
      if (filters.paymentStatus !== "all" && b.paymentStatus !== filters.paymentStatus) return false;
      if (filters.roomCategory !== "all" && getBookingRoomDisplay(b).category !== filters.roomCategory) return false;
      if (filters.overdueOnly && !b.overdue) return false;

      const outstanding = b.outstanding ?? ((b.totalAmount ?? 0) - (b.amountPaid ?? 0));
      if (filters.minOutstanding && outstanding < Number(filters.minOutstanding)) return false;
      if (filters.maxOutstanding && outstanding > Number(filters.maxOutstanding)) return false;

      if (filters.startDate && new Date(b.checkOutDate) < new Date(filters.startDate)) return false;
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(b.checkOutDate) > end) return false;
      }

      if (filters.searchTerm) {
        const q = filters.searchTerm.toLowerCase();
        const fields = [b.guestName, b.guestEmail, b.guestPhone, b.confirmationCode];
        if (!fields.some((f) => f?.toLowerCase().includes(q))) return false;
      }

      return true;
    });
  }, [outstandingBookings, filters]);

  const hasActiveFilters =
    filters.paymentStatus !== "all" ||
    filters.roomCategory !== "all" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.minOutstanding !== "" ||
    filters.maxOutstanding !== "" ||
    filters.overdueOnly ||
    filters.searchTerm !== "";

  const handleClearFilters = () => {
    setFilters({
      searchTerm: "", paymentStatus: "all", roomCategory: "all",
      startDate: "", endDate: "", minOutstanding: "", maxOutstanding: "", overdueOnly: false,
    });
  };

  const openDetail = (b: Booking, openRecordPayment = false) => {
    setSelected(b);
    setAutoOpenRecordPayment(openRecordPayment);
    setSheetOpen(true);
  };

  const filteredIds = filteredBookings.map((b) => b._id);

  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    await useBookingStore.getState().exportOutstandingCSV(filteredIds);
    setIsExportingCSV(false);
  };
  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    await useBookingStore.getState().exportOutstandingExcel(filteredIds);
    setIsExportingExcel(false);
  };
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await useBookingStore.getState().exportOutstandingPDF(filteredIds);
    setIsExportingPDF(false);
  };

  const statCards = outstandingSummary ? [
    {
      label: "Total Outstanding", value: fmtMoney(outstandingSummary.totalOutstandingAmount),
      color: "text-red-600", bg: "bg-red-50", border: "border-l-red-500",
      icon: <DollarSign className="h-5 w-5 text-red-500" />,
    },
    {
      label: "Outstanding Bookings", value: outstandingSummary.outstandingCount,
      color: "text-foreground", bg: "bg-muted", border: "border-l-gray-400",
      icon: <Wallet className="h-5 w-5 text-muted-foreground" />,
    },
    {
      label: "Fully Paid", value: outstandingSummary.fullyPaidCount,
      color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-emerald-500",
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    },
    {
      label: "Partially Paid", value: outstandingSummary.partiallyPaidCount,
      color: "text-orange-600", bg: "bg-orange-50", border: "border-l-orange-500",
      icon: <Clock className="h-5 w-5 text-orange-500" />,
    },
    {
      label: "Overdue", value: outstandingSummary.overdueCount,
      color: "text-amber-700", bg: "bg-amber-50", border: "border-l-amber-500",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    },
  ] : [];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Outstanding Balances</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasActiveFilters
              ? `Showing ${filteredBookings.length} of ${outstandingBookings.length} bookings`
              : `${outstandingBookings.length} booking${outstandingBookings.length !== 1 ? "s" : ""} with a balance due`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Filters"}
            {hasActiveFilters && <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-xs">On</Badge>}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExportingCSV || filteredBookings.length === 0} className="gap-2">
            {isExportingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExportingExcel || filteredBookings.length === 0} className="gap-2">
            {isExportingExcel ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPDF || filteredBookings.length === 0} className="gap-2">
            {isExportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {isLoadingOutstanding && !outstandingSummary ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {statCards.map((s) => (
            <Card key={s.label} className={cn("border-l-4", s.border)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>{s.icon}</div>
                <div className="min-w-0 overflow-hidden">
                  <p className="text-xs text-muted-foreground leading-tight truncate">{s.label}</p>
                  <p className={cn("text-sm sm:text-base md:text-xl font-bold leading-tight truncate", s.color)}>{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, email, phone, or confirmation code..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Payment Status</Label>
                <Select value={filters.paymentStatus} onValueChange={(v) => setFilters({ ...filters, paymentStatus: v as any })}>
                  <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="partial">Partially Paid</SelectItem>
                    <SelectItem value="pending">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Room Category</Label>
                <Select value={filters.roomCategory} onValueChange={(v) => setFilters({ ...filters, roomCategory: v })}>
                  <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {roomCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Check-Out From</Label>
                <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Check-Out To</Label>
                <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Min Outstanding (₦)</Label>
                <Input type="number" min={0} value={filters.minOutstanding} onChange={(e) => setFilters({ ...filters, minOutstanding: e.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Max Outstanding (₦)</Label>
                <Input type="number" min={0} value={filters.maxOutstanding} onChange={(e) => setFilters({ ...filters, maxOutstanding: e.target.value })} />
              </div>

              <div className="flex items-end pb-1.5">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.overdueOnly}
                    onChange={(e) => setFilters({ ...filters, overdueOnly: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Overdue only
                </label>
              </div>
            </div>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {isLoadingOutstanding && outstandingBookings.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">Loading outstanding balances...</CardContent></Card>
      ) : filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Wallet className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {hasActiveFilters ? "No Bookings Match Filters" : "No Outstanding Balances"}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasActiveFilters ? "Try adjusting or clearing your filters." : "Every booking is fully paid right now."}
              </p>
            </div>
            {hasActiveFilters && <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="p-3 text-left font-medium text-muted-foreground">Guest</th>
                  {isSuperAdmin && <th className="p-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Branch</th>}
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Room</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Check-Out</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Total</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Paid</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Outstanding</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((b) => {
                  const room = getBookingRoomDisplay(b);
                  const outstanding = b.outstanding ?? ((b.totalAmount ?? 0) - (b.amountPaid ?? 0));
                  return (
                    <tr key={b._id} className="border-b hover:bg-muted/40 transition-colors">
                      <td className="p-3">
                        <p className="font-medium text-foreground truncate max-w-[160px]">{b.guestName}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{b.guestEmail}</p>
                      </td>
                      {isSuperAdmin && (
                        <td className="p-3 hidden lg:table-cell text-muted-foreground">
                          {typeof b.hotelId === "object" ? b.hotelId?.name : "—"}
                        </td>
                      )}
                      <td className="p-3 hidden md:table-cell text-muted-foreground">{room.label}</td>
                      <td className="p-3 hidden md:table-cell whitespace-nowrap">
                        <span className={cn(b.overdue && "text-red-600 font-medium")}>{fmtDate(b.checkOutDate)}</span>
                        {b.overdue && (
                          <Badge className="ml-2 text-[10px] bg-red-100 text-red-700 border-red-200">Overdue</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">{fmtMoney(b.totalAmount)}</td>
                      <td className="p-3 text-right whitespace-nowrap text-emerald-600">{fmtMoney(b.amountPaid ?? 0)}</td>
                      <td className="p-3 text-right whitespace-nowrap font-bold text-red-600">{fmtMoney(outstanding)}</td>
                      <td className="p-3 text-center">
                        <Badge className={cn("text-xs border", PAYMENT_STATUS_BADGE[b.paymentStatus] ?? PAYMENT_STATUS_BADGE.pending)}>
                          {b.paymentStatus === "pending" ? "Unpaid" : b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openDetail(b)}>
                            View
                          </Button>
                          {canRecordPayment && (
                            <Button
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => openDetail(b, true)}
                            >
                              Record Payment
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <BookingDetailContent
              booking={selected}
              canRecordPayment={canRecordPayment}
              canEditOrAdjust={canEditOrAdjust}
              autoOpenRecordPayment={autoOpenRecordPayment}
              onAutoOpenHandled={() => setAutoOpenRecordPayment(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Detail Sheet content ─────────────────────────────────────────────────
function BookingDetailContent({
  booking: b,
  canRecordPayment,
  canEditOrAdjust,
  autoOpenRecordPayment,
  onAutoOpenHandled,
}: {
  booking: Booking;
  canRecordPayment: boolean;
  canEditOrAdjust: boolean;
  autoOpenRecordPayment: boolean;
  onAutoOpenHandled: () => void;
}) {
  const room = getBookingRoomDisplay(b);
  const nights = Math.max(1, Math.round((new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) / 86_400_000));
  const outstanding = (b.totalAmount ?? 0) - (b.amountPaid ?? 0);

  const [recordOpen, setRecordOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);

  useEffect(() => {
    if (autoOpenRecordPayment) {
      setRecordOpen(true);
      onAutoOpenHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenRecordPayment]);

  const handleReceipt = async () => {
    setIsDownloadingReceipt(true);
    await useBookingStore.getState().exportPaymentReceipt(b._id, b.confirmationCode);
    setIsDownloadingReceipt(false);
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <SheetHeader>
        <SheetTitle>Outstanding Balance Details</SheetTitle>
      </SheetHeader>

      {/* Guest */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Guest</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <DetailField label="Full Name" value={b.guestName} />
          <DetailField label="Email" value={b.guestEmail} />
          <DetailField label="Phone" value={b.guestPhone} />
          <DetailField label="Confirmation Code" value={b.confirmationCode} mono />
        </div>
      </div>

      {/* Booking */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">Booking</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <DetailField label="Booking Status" value={b.bookingStatus} capitalize />
          <DetailField label="Booked On" value={fmtDate(b.createdAt)} />
          <DetailField label="Check-In" value={fmtDate(b.checkInDate)} />
          <DetailField label="Check-Out" value={fmtDate(b.checkOutDate)} />
          <DetailField label="Nights" value={String(nights)} />
          <DetailField label="Room" value={room.label} />
        </div>
      </div>

      {/* Payment Summary */}
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
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Outstanding Balance</span>
            <span className={cn("text-base font-bold", outstanding > 0 ? "text-red-500" : "text-emerald-600")}>
              {outstanding > 0 ? fmtMoney(outstanding) : "Fully Paid"}
            </span>
          </div>
        </div>
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          {canRecordPayment && (
            <Button size="sm" onClick={() => setRecordOpen(true)} disabled={outstanding <= 0}>
              <DollarSign className="h-3.5 w-3.5 mr-1.5" /> Record Payment
            </Button>
          )}
          {canEditOrAdjust && (
            <Button size="sm" variant="outline" onClick={() => setAdjustOpen(true)} disabled={outstanding <= 0}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" /> Record Adjustment
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleReceipt} disabled={isDownloadingReceipt}>
            {isDownloadingReceipt ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Printer className="h-3.5 w-3.5 mr-1.5" />}
            Receipt
          </Button>
        </div>
      </div>

      {/* Payment History (ledger) */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Payment History</h3>
        {b.payments && b.payments.length > 0 ? (
          <div className="space-y-3">
            {b.payments.map((entry) => {
              const badge = entry.type === 'payment'
                ? { label: 'Payment', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
                : entry.type === 'refund'
                ? { label: 'Refund', cls: 'bg-rose-100 text-rose-700 border-rose-200' }
                : { label: 'Adjustment', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
              const recordedByName = typeof entry.recordedBy === 'object'
                ? `${entry.recordedBy.firstName} ${entry.recordedBy.lastName}`
                : null;
              return (
                <div key={entry._id} className="flex items-start gap-3">
                  <div className={cn("h-7 w-7 rounded-full border flex items-center justify-center shrink-0", badge.cls)}>
                    <Receipt className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs border", badge.cls)}>{badge.label}</Badge>
                        <span className={cn("text-sm font-bold", entry.type === 'refund' ? "text-rose-600" : "text-emerald-700")}>
                          {entry.type === 'refund' ? '-' : ''}{fmtMoney(entry.amount)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{fmtDate(entry.paymentDate)}</span>
                        {canEditOrAdjust && entry.type === 'payment' && (
                          <button
                            type="button"
                            className="text-xs text-primary underline"
                            onClick={() => setEditingEntry(entry)}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {entry.method?.replace('_', ' ')}
                      {entry.referenceNumber ? ` · Ref: ${entry.referenceNumber}` : ""}
                    </p>
                    {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                    {recordedByName && (
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <User className="h-3 w-3" /> Recorded by {recordedByName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">No payment records found</p>
        )}
      </div>

      {/* Activity Log — reused verbatim from BookingHistory.tsx */}
      <BookingActivityLog bookingId={b._id} confirmationCode={b.confirmationCode} />

      <RecordPaymentDialog booking={b} open={recordOpen} onOpenChange={setRecordOpen} />
      <RecordAdjustmentDialog booking={b} open={adjustOpen} onOpenChange={setAdjustOpen} />
      <EditPaymentEntryDialog
        booking={b}
        entry={editingEntry}
        open={!!editingEntry}
        onOpenChange={(open) => { if (!open) setEditingEntry(null); }}
      />
    </div>
  );
}

function DetailField({ label, value, mono, capitalize }: { label: string; value?: string; mono?: boolean; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className={cn("text-sm text-foreground break-all", mono && "font-mono text-xs", capitalize && "capitalize")}>{value || "—"}</p>
    </div>
  );
}

// ── Record Payment Dialog — all three roles ──────────────────────────────
function RecordPaymentDialog({ booking, open, onOpenChange }: { booking: Booking; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { recordPayment } = useBookingStore();
  const outstanding = (booking.totalAmount ?? 0) - (booking.amountPaid ?? 0);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setAmount(""); setMethod("cash"); setReferenceNumber(""); setNotes(""); };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setLoading(true);
    const result = await recordPayment(booking._id, { amount: amt, method, referenceNumber: referenceNumber || undefined, notes: notes || undefined });
    setLoading(false);
    if (result.success) {
      onOpenChange(false);
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Outstanding balance: {fmtMoney(outstanding)}. Recording a payment updates the amount paid and payment status automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="payment-amount">Amount Received (₦)</Label>
            <Input id="payment-amount" type="number" min={0} max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="payment-ref">Reference Number (optional)</Label>
            <Input id="payment-ref" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="e.g. POS/transfer reference" />
          </div>
          <div>
            <Label htmlFor="payment-notes">Notes (optional)</Label>
            <Textarea id="payment-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !amount || parseFloat(amount) <= 0}>
            {loading ? "Recording..." : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Payment Entry Dialog — admin/superadmin only ────────────────────
function EditPaymentEntryDialog({
  booking, entry, open, onOpenChange,
}: { booking: Booking; entry: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { editPayment } = useBookingStore();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entry) {
      setAmount(String(entry.amount ?? ""));
      setMethod(entry.method || "cash");
      setReferenceNumber(entry.referenceNumber || "");
      setNotes(entry.notes || "");
      setReason("");
    }
  }, [entry]);

  const handleSubmit = async () => {
    if (!entry || !reason.trim()) return;
    setLoading(true);
    const result = await editPayment(booking._id, entry._id, {
      amount: amount ? parseFloat(amount) : undefined,
      method,
      referenceNumber: referenceNumber || undefined,
      notes: notes || undefined,
      reason,
    });
    setLoading(false);
    if (result.success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Payment Entry</DialogTitle>
          <DialogDescription>Every field change is recorded in the Activity Log with the reason below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="edit-amount">Amount (₦)</Label>
            <Input id="edit-amount" type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-ref">Reference Number</Label>
            <Input id="edit-ref" value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="edit-reason">Reason for Change (required)</Label>
            <Textarea id="edit-reason" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Corrected amount entered at reception" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !reason.trim()}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Record Adjustment (write-off) Dialog — admin/superadmin only ─────────
function RecordAdjustmentDialog({ booking, open, onOpenChange }: { booking: Booking; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { recordAdjustment } = useBookingStore();
  const outstanding = (booking.totalAmount ?? 0) - (booking.amountPaid ?? 0);

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => { setAmount(""); setReason(""); };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !reason.trim()) return;
    setLoading(true);
    const result = await recordAdjustment(booking._id, { amount: amt, reason });
    setLoading(false);
    if (result.success) {
      onOpenChange(false);
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Balance Adjustment</DialogTitle>
          <DialogDescription>
            A write-off, never a raw balance edit — this is recorded as its own auditable entry, distinct from a real payment.
            Outstanding balance: {fmtMoney(outstanding)}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label htmlFor="adjust-amount">Amount to Write Off (₦)</Label>
            <Input id="adjust-amount" type="number" min={0} max={outstanding} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="adjust-reason">Reason (required)</Label>
            <Textarea id="adjust-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Goodwill gesture approved by branch manager" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !amount || parseFloat(amount) <= 0 || !reason.trim()}>
            {loading ? "Recording..." : "Record Adjustment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
