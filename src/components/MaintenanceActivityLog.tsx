import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { History, ChevronLeft, ChevronRight, User, ArrowRight, FileText, RefreshCw, CheckCircle2, Flag, PencilLine } from "lucide-react";
import { useMaintenanceStore, type MaintenanceAuditLogEntry } from "@/store/useMaintenanceStore";
import { cn } from "@/lib/utils";

// Near-verbatim port of BookingActivityLog.tsx, re-keyed to
// MaintenanceAuditLog's eventType enum instead of BookingAuditLog's.
const AUDIT_EVENT_ICON: Record<string, React.ElementType> = {
  request_created: Flag,
  status_changed: RefreshCw,
  priority_changed: PencilLine,
  resolved: CheckCircle2,
  updated: FileText,
};

const AUDIT_EVENT_COLOR: Record<string, string> = {
  request_created: "bg-blue-100 border-blue-200 text-blue-600",
  status_changed: "bg-gray-100 border-gray-200 text-gray-600",
  priority_changed: "bg-amber-100 border-amber-200 text-amber-600",
  resolved: "bg-green-100 border-green-200 text-green-600",
  updated: "bg-violet-100 border-violet-200 text-violet-600",
};

const AUDIT_EVENT_LABEL: Record<string, string> = {
  request_created: "Request Created",
  status_changed: "Status Updated",
  priority_changed: "Priority Changed",
  resolved: "Resolved",
  updated: "Request Updated",
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const fmtFieldValue = (v: any) => (v === null || v === undefined || v === "" ? "—" : String(v));

interface MaintenanceActivityLogProps {
  maintenanceRequestId: string;
}

export default function MaintenanceActivityLog({ maintenanceRequestId }: MaintenanceActivityLogProps) {
  const { auditLog, auditLogPage, auditLogTotalPages, auditLogSort, isLoadingAuditLog, fetchAuditLog, setAuditLogSort } = useMaintenanceStore();

  useEffect(() => {
    if (maintenanceRequestId) fetchAuditLog(maintenanceRequestId, 1, auditLogSort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maintenanceRequestId]);

  const handleSortToggle = (sort: 'newest' | 'oldest') => {
    setAuditLogSort(sort);
    fetchAuditLog(maintenanceRequestId, 1, sort);
  };

  const handlePageChange = (nextPage: number) => {
    fetchAuditLog(maintenanceRequestId, nextPage, auditLogSort);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Audit Trail</h3>
        </div>
        <div className="flex rounded-md border overflow-hidden text-xs">
          <button type="button" onClick={() => handleSortToggle('newest')} className={cn("px-2 py-1", auditLogSort === 'newest' ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
            Newest
          </button>
          <button type="button" onClick={() => handleSortToggle('oldest')} className={cn("px-2 py-1", auditLogSort === 'oldest' ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}>
            Oldest
          </button>
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
            {auditLog.map((entry: MaintenanceAuditLogEntry) => {
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
              <Button variant="outline" size="sm" onClick={() => handlePageChange(auditLogPage - 1)} disabled={auditLogPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">Page {auditLogPage} of {auditLogTotalPages}</span>
              <Button variant="outline" size="sm" onClick={() => handlePageChange(auditLogPage + 1)} disabled={auditLogPage >= auditLogTotalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
