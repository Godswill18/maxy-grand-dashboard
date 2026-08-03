import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  History,
  ChevronLeft,
  ChevronRight,
  User,
  ArrowRight,
  Download,
  Loader2,
  FileText,
  RefreshCw,
  CheckCircle2,
  Ban,
  Timer,
  LogIn,
  LogOut,
  CalendarDays,
  Banknote,
  Undo2,
  PencilLine,
  ScrollText,
  AlertTriangle,
} from "lucide-react";
import { useBookingStore, type AuditLogEntry } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

// Extracted from BookingHistory.tsx so the same Activity Log — sort toggle,
// export, pagination, event rendering — can be reused by any page showing a
// single booking's history (BookingHistory.tsx and OutstandingBalances.tsx),
// without forking these icon/color/label maps into two divergent copies.
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
  payment_edited: PencilLine,
  payment_adjusted: ScrollText,
  payment_overdue: AlertTriangle,
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
  payment_edited: "bg-sky-100 border-sky-200 text-sky-600",
  payment_adjusted: "bg-amber-100 border-amber-200 text-amber-600",
  payment_overdue: "bg-red-100 border-red-200 text-red-600",
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
  payment_edited: "Payment Edited",
  payment_adjusted: "Balance Adjusted",
  payment_overdue: "Payment Overdue",
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtDateForDisplay = (d: string) => {
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? d : parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const fmtFieldValue = (v: any) => {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return fmtDateForDisplay(v);
  return String(v);
};

interface BookingActivityLogProps {
  bookingId: string;
  confirmationCode?: string;
}

export default function BookingActivityLog({ bookingId, confirmationCode }: BookingActivityLogProps) {
  const { user } = useAuthStore();
  const {
    auditLog, auditLogPage, auditLogTotalPages, auditLogSort, isLoadingAuditLog,
    fetchBookingAuditLog, setAuditLogSort, exportBookingAuditLog,
  } = useBookingStore();

  const canViewAuditLog = user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (canViewAuditLog && bookingId) {
      fetchBookingAuditLog(bookingId, 1, auditLogSort);
    }
    // Only re-fetch when the booking being viewed changes — auditLogSort
    // changes are driven by handleSortToggle below, which fetches itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleSortToggle = (sort: 'newest' | 'oldest') => {
    setAuditLogSort(sort);
    fetchBookingAuditLog(bookingId, 1, sort);
  };

  const handleAuditPageChange = (nextPage: number) => {
    fetchBookingAuditLog(bookingId, nextPage, auditLogSort);
  };

  const handleExport = async () => {
    setIsExporting(true);
    await exportBookingAuditLog(bookingId, confirmationCode);
    setIsExporting(false);
  };

  if (!canViewAuditLog) return null;

  return (
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
              <Button variant="outline" size="sm" onClick={() => handleAuditPageChange(auditLogPage - 1)} disabled={auditLogPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">Page {auditLogPage} of {auditLogTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => handleAuditPageChange(auditLogPage + 1)} disabled={auditLogPage >= auditLogTotalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
