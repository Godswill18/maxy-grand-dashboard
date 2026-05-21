import { Fragment, useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  DollarSign,
  Filter,
  X,
  Download,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";
import { usePaymentStore } from "@/store/usePaymentStore";
import { useAuthStore } from "@/store/useAuthStore";
import { format, isWithinInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

// ── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name?: string) =>
  (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

const safeFormatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  try {
    return format(new Date(dateStr), "MMM dd, yyyy");
  } catch {
    return "—";
  }
};

// ── Sub-components ───────────────────────────────────────────────────────────
const DetailField = ({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  capitalize?: boolean;
}) => (
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
    <p className={cn("text-sm text-foreground break-all", mono && "font-mono text-xs", capitalize && "capitalize")}>
      {value || "—"}
    </p>
  </div>
);

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-green-100 text-green-700 border-green-200" },
  pending:   { label: "Pending",   className: "bg-amber-100 text-amber-700 border-amber-200" },
  failed:    { label: "Failed",    className: "bg-red-100 text-red-600 border-red-200"   },
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <Badge className={cn("text-xs border whitespace-nowrap", cfg.className)}>{cfg.label}</Badge>
  );
};

const BookingTypeBadge = ({ type }: { type?: string }) => {
  if (!type) return <span className="text-muted-foreground">—</span>;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs capitalize",
        type === "online" ? "border-blue-400 text-blue-700" : "border-gray-400 text-gray-600"
      )}
    >
      {type}
    </Badge>
  );
};

// ── Loading Skeleton ─────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <Card>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b bg-muted/50">
          <tr>
            {["w-10", "w-48", "w-28", "w-24", "w-28", "w-24", "w-24"].map((w, i) => (
              <th key={i} className="p-3">
                <Skeleton className={`h-4 ${w}`} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i} className="border-b">
              <td className="p-3 pl-4">
                <Skeleton className="h-4 w-4" />
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </td>
              <td className="p-3">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="p-3 hidden md:table-cell">
                <Skeleton className="h-5 w-16 rounded-full" />
              </td>
              <td className="p-3 hidden md:table-cell">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="p-3">
                <Skeleton className="h-5 w-20 ml-auto" />
              </td>
              <td className="p-3">
                <Skeleton className="h-5 w-20 mx-auto rounded-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);

// ── Main Component ───────────────────────────────────────────────────────────
export default function Transactions() {
  const { user } = useAuthStore();
  const { payments, isLoading, fetchPayments } = usePaymentStore();

  const PAGE_SIZE = 15;
  const [showFilters, setShowFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
    bookingType: "all",
    searchTerm: "",
  });

  useEffect(() => {
    fetchPayments(user?.hotelId);
  }, [user?.hotelId, fetchPayments]);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (filters.status !== "all" && payment.status !== filters.status) return false;
      if (filters.bookingType !== "all" && payment.bookingId?.bookingType !== filters.bookingType) return false;

      if (filters.startDate || filters.endDate) {
        const paymentDate = parseISO(payment.createdAt);
        if (filters.startDate && filters.endDate) {
          const start = parseISO(filters.startDate);
          const end = parseISO(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (!isWithinInterval(paymentDate, { start, end })) return false;
        } else if (filters.startDate) {
          if (paymentDate < parseISO(filters.startDate)) return false;
        } else if (filters.endDate) {
          const end = parseISO(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (paymentDate > end) return false;
        }
      }

      if (filters.searchTerm) {
        const q = filters.searchTerm.toLowerCase();
        const fields = [
          payment.bookingId?.guestName,
          payment.bookingId?.guestEmail,
          payment.bookingId?.confirmationCode,
          payment.gatewayRef,
        ];
        if (!fields.some((f) => f?.toLowerCase().includes(q))) return false;
      }

      return true;
    });
  }, [payments, filters]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set());
  }, [filters]);

  const totalPages = Math.ceil(filteredPayments.length / PAGE_SIZE);

  const paginatedPayments = useMemo(
    () => filteredPayments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredPayments, currentPage]
  );

  const handleClearFilters = () => {
    setFilters({ status: "all", startDate: "", endDate: "", bookingType: "all", searchTerm: "" });
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.bookingType !== "all" ||
    filters.startDate !== "" ||
    filters.endDate !== "" ||
    filters.searchTerm !== "";

  const totalRevenue = filteredPayments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const completedCount = filteredPayments.filter((p) => p.status === "completed").length;
  const pendingFailedCount = filteredPayments.filter(
    (p) => p.status === "pending" || p.status === "failed"
  ).length;

  const handleExport = () => {
    const headers = ["Date", "Guest", "Email", "Booking Type", "Amount", "Status", "Reference", "Room"];
    const rows = filteredPayments.map((p) => [
      format(new Date(p.createdAt), "yyyy-MM-dd HH:mm"),
      p.bookingId?.guestName || "N/A",
      p.bookingId?.guestEmail || "N/A",
      p.bookingId?.bookingType || "N/A",
      p.amount,
      p.status,
      p.gatewayRef || "N/A",
      p.bookingId?.roomTypeId?.name || "N/A",
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: "Total Transactions",
      value: filteredPayments.length,
      color: "text-foreground",
      bg: "bg-muted",
      border: "border-l-gray-400",
      icon: <DollarSign className="h-5 w-5 text-muted-foreground" />,
    },
    {
      label: "Total Revenue",
      value: `₦${totalRevenue.toLocaleString()}`,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-l-green-500",
      icon: <TrendingUp className="h-5 w-5 text-green-500" />,
    },
    {
      label: "Completed",
      value: completedCount,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-l-blue-500",
      icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />,
    },
    {
      label: "Pending / Failed",
      value: pendingFailedCount,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-l-amber-500",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasActiveFilters
              ? `Showing ${filteredPayments.length} of ${payments.length} transactions`
              : `${payments.length} payment transaction${payments.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Filters"}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-0.5 px-1.5 py-0 text-xs">
                On
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredPayments.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className={cn("border-l-4", s.border)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  s.bg
                )}
              >
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight truncate">{s.label}</p>
                <p className={cn("text-xl font-bold leading-tight", s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name, email, confirmation code, or reference..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(v) => setFilters({ ...filters, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Booking Type</Label>
                <Select
                  value={filters.bookingType}
                  onValueChange={(v) => setFilters({ ...filters, bookingType: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
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
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <CreditCard className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                {hasActiveFilters ? "No Transactions Match Filters" : "No Transactions Found"}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasActiveFilters
                  ? "Try adjusting or clearing your filters."
                  : "Transactions will appear here once bookings are made."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="w-10 p-3" />
                  <th className="p-3 text-left font-medium text-muted-foreground">Guest</th>
                  <th className="p-3 text-left font-medium text-muted-foreground whitespace-nowrap">Date</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="p-3 text-left font-medium text-muted-foreground hidden md:table-cell">Room</th>
                  <th className="p-3 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map((payment) => {
                  const isExpanded = expandedRows.has(payment._id);
                  const roomLabel = [
                    payment.bookingId?.roomTypeId?.name,
                    payment.bookingId?.roomTypeId?.roomNumber
                      ? `#${payment.bookingId.roomTypeId.roomNumber}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <Fragment key={payment._id}>
                      {/* Main row */}
                      <tr
                        className={cn(
                          "border-b cursor-pointer hover:bg-muted/40 transition-colors",
                          isExpanded && "bg-muted/20"
                        )}
                        onClick={() => toggleRow(payment._id)}
                      >
                        <td className="p-3 pl-4">
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform duration-200",
                              isExpanded && "rotate-90"
                            )}
                          />
                        </td>

                        {/* Guest */}
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 uppercase">
                              {getInitials(payment.bookingId?.guestName)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate max-w-[140px]">
                                {payment.bookingId?.guestName || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[140px] hidden sm:block">
                                {payment.bookingId?.guestEmail}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-3 whitespace-nowrap">
                          <p className="text-foreground">
                            {format(new Date(payment.createdAt), "MMM dd, yyyy")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.createdAt), "HH:mm")}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="p-3 hidden md:table-cell">
                          <BookingTypeBadge type={payment.bookingId?.bookingType} />
                        </td>

                        {/* Room */}
                        <td className="p-3 hidden md:table-cell text-muted-foreground">
                          {roomLabel || "—"}
                        </td>

                        {/* Amount */}
                        <td className="p-3 text-right font-bold text-foreground whitespace-nowrap">
                          ₦{payment.amount.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <StatusBadge status={payment.status} />
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr className="border-b bg-muted/10">
                          <td />
                          <td colSpan={6} className="px-5 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                              <DetailField
                                label="Email"
                                value={payment.bookingId?.guestEmail}
                              />
                              <DetailField
                                label="Confirmation Code"
                                value={payment.bookingId?.confirmationCode}
                                mono
                              />
                              <DetailField
                                label="Gateway Reference"
                                value={payment.gatewayRef}
                                mono
                              />
                              <DetailField
                                label="Booking Total"
                                value={
                                  payment.bookingId?.totalAmount != null
                                    ? `₦${payment.bookingId.totalAmount.toLocaleString()}`
                                    : undefined
                                }
                              />
                              <DetailField
                                label="Check-In"
                                value={safeFormatDate(payment.bookingId?.checkInDate)}
                              />
                              <DetailField
                                label="Check-Out"
                                value={safeFormatDate(payment.bookingId?.checkOutDate)}
                              />
                              <DetailField
                                label="Room"
                                value={roomLabel || undefined}
                              />
                              <DetailField
                                label="Booking Type"
                                value={payment.bookingId?.bookingType}
                                capitalize
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer / pagination */}
          <div className="px-4 py-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground order-2 sm:order-1">
              Showing {filteredPayments.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filteredPayments.length)} of{" "}
              {filteredPayments.length} transaction{filteredPayments.length !== 1 ? "s" : ""}
              {hasActiveFilters && ` (filtered from ${payments.length})`}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "…" ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        variant={item === currentPage ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => setCurrentPage(item as number)}
                      >
                        {item}
                      </Button>
                    )
                  )}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
