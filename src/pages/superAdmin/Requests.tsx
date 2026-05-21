import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useRequestStore, useRequestActions, RequestStatus } from "@/store/useRequestStore";
import { cn } from "@/lib/utils";

const statusConfig: Record<RequestStatus, { label: string; badge: string; border: string }> = {
  pending:  { label: "Pending",  badge: "bg-amber-100 text-amber-700 border-amber-200", border: "border-l-amber-400" },
  approved: { label: "Approved", badge: "bg-green-100 text-green-700 border-green-200", border: "border-l-green-400" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-600 border-red-200",       border: "border-l-red-400"  },
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 gap-3">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="border-l-4 border-l-muted">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3.5 w-36" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-px w-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-24" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function Requests() {
  const { requests, isLoading, error } = useRequestStore();
  const { fetchAllRequests, updateRequestStatus } = useRequestActions();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");

  useEffect(() => {
    fetchAllRequests(false);
  }, [fetchAllRequests]);

  const filteredRequests = useMemo(() => {
    let result = [...requests];
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          `${r.raisedBy?.firstName} ${r.raisedBy?.lastName}`.toLowerCase().includes(q) ||
          (typeof r.hotelId !== "string" && r.hotelId?.name?.toLowerCase().includes(q))
      );
    }
    return result;
  }, [requests, statusFilter, searchQuery]);

  const counts = useMemo(
    () => ({
      total:    requests.length,
      pending:  requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  );

  const statCards = [
    { label: "Total Requests", value: counts.total,    color: "text-foreground",  bg: "bg-muted",     border: "border-l-gray-400",  icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
    { label: "Pending",        value: counts.pending,  color: "text-amber-600",   bg: "bg-amber-50",  border: "border-l-amber-400", icon: <Clock className="h-5 w-5 text-amber-500" /> },
    { label: "Approved",       value: counts.approved, color: "text-green-600",   bg: "bg-green-50",  border: "border-l-green-400", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { label: "Rejected",       value: counts.rejected, color: "text-red-500",     bg: "bg-red-50",    border: "border-l-red-400",   icon: <XCircle className="h-5 w-5 text-red-400" /> },
  ];

  const statusTabs: { key: RequestStatus | "all"; label: string; count: number }[] = [
    { key: "all",      label: "All",      count: requests.length },
    { key: "pending",  label: "Pending",  count: counts.pending  },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Request Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? "s" : ""}
          {statusFilter !== "all" || searchQuery ? ` · filtered from ${requests.length}` : ""}
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className={cn("border-l-4", s.border)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight truncate">{s.label}</p>
                <p className={cn("text-2xl font-bold leading-tight", s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Row */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, description, hotel, or submitter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
            {statusTabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                  statusFilter === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
                )}
              >
                {label} <span className="opacity-70">({count})</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-5 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Error loading requests</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={() => fetchAllRequests(false)} variant="outline" size="sm" className="ml-auto shrink-0">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && requests.length === 0 && <LoadingSkeleton />}

      {/* Empty State */}
      {!isLoading && !error && filteredRequests.length === 0 && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No Requests Found</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {statusFilter !== "all" || searchQuery
                  ? "No requests match your current filters."
                  : "No branch requests have been submitted yet."}
              </p>
            </div>
            {(statusFilter !== "all" || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Cards */}
      {!isLoading && !error && filteredRequests.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {filteredRequests.map((request, index) => {
            const cfg = statusConfig[request.status] ?? statusConfig.pending;
            const hotelName =
              typeof request.hotelId === "string"
                ? request.hotelId
                : request.hotelId?.name || "Unknown Branch";

            return (
              <Card
                key={request._id}
                className={cn(
                  "border-l-4 hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-1",
                  cfg.border
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {request.title || "Untitled Request"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        by {request.raisedBy?.firstName} {request.raisedBy?.lastName}
                        {" · "}
                        {format(new Date(request.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <Badge className={cn("text-xs border shrink-0", cfg.badge)}>
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {request.description}
                  </p>

                  <div className="border-t" />

                  {/* Meta + amount */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>{hotelName}</span>
                    </div>
                    <span className="font-bold text-foreground">
                      ₦{request.amount.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions for pending */}
                  {request.status === "pending" && (
                    <>
                      <div className="border-t" />
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateRequestStatus(request._id, "rejected")}
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateRequestStatus(request._id, "approved")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Approve
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
