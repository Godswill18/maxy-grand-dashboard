import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
  Edit,
  Eye,
  Search,
  Filter,
  X,
  TrendingUp,
} from "lucide-react";
import {
  useRequestStore,
  useRequestActions,
  FinancialRequest,
  RequestStatus,
} from "@/store/useRequestStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const statusConfig: Record<RequestStatus, { label: string; badge: string; border: string }> = {
  pending:  { label: "Pending",  badge: "bg-amber-100 text-amber-700 border-amber-200", border: "border-l-amber-400" },
  approved: { label: "Approved", badge: "bg-green-100 text-green-700 border-green-200", border: "border-l-green-400" },
  rejected: { label: "Rejected", badge: "bg-red-100 text-red-600 border-red-200",       border: "border-l-red-400"  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const DetailField = ({ label, value }: { label: string; value?: string }) => (
  <div>
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
    <p className="text-sm font-medium text-foreground">{value || "—"}</p>
  </div>
);

// ── Skeletons ────────────────────────────────────────────────────────────────
const RequestCardSkeleton = () => (
  <Card className="border-l-4 border-l-muted">
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
        <Skeleton className="h-5 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function ManagerRequests() {
  const { requests, isLoading } = useRequestStore();
  const { fetchAllRequests, createRequest, editRequest } = useRequestActions();
  const { user } = useAuthStore();

  // Dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<FinancialRequest | null>(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: "", amount: 0, description: "" });

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = user?.role === "admin";
  const canCreate = isAdmin;
  const loggedInUserId = user?._id;

  useEffect(() => {
    if (user?.role) fetchAllRequests(isAdmin);
  }, [user?.role, fetchAllRequests, isAdmin]);

  // Filtered + sorted requests
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...requests];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          `${r.raisedBy?.firstName} ${r.raisedBy?.lastName}`.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return sortOrder === "desc" ? diff : -diff;
      }
      return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
    });

    return filtered;
  }, [requests, searchQuery, statusFilter, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || sortBy !== "date" || sortOrder !== "desc";

  // Stats
  const totalPending = filteredAndSortedRequests.filter((r) => r.status === "pending").length;
  const totalApproved = filteredAndSortedRequests.filter((r) => r.status === "approved").length;
  const pendingAmount = filteredAndSortedRequests
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + r.amount, 0);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    const parsed = type === "number" ? parseFloat(value) || 0 : value;
    if (isCreateDialogOpen) {
      setFormData((prev) => ({ ...prev, [id]: parsed }));
    } else if (isEditDialogOpen && currentRequest) {
      setCurrentRequest(
        (prev) =>
          prev
            ? ({ ...prev, [id as "title" | "description" | "amount"]: parsed } as FinancialRequest)
            : null
      );
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.title || !formData.description || formData.amount <= 0) {
      toast.error("Please fill in the title, description, and a valid amount.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createRequest({ title: formData.title, amount: formData.amount, description: formData.description });
      setFormData({ title: "", amount: 0, description: "" });
      setIsCreateDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = async () => {
    if (!currentRequest) return;
    if (!currentRequest.title || !currentRequest.description || currentRequest.amount <= 0) {
      toast.error("Please fill in the title, description, and a valid amount.");
      return;
    }
    setIsSubmitting(true);
    try {
      await editRequest(currentRequest._id, {
        title: currentRequest.title,
        amount: currentRequest.amount,
        description: currentRequest.description,
      });
      setIsEditDialogOpen(false);
    } catch {
      // toast handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRequestModal = (request: FinancialRequest, type: "view" | "edit") => {
    setCurrentRequest(request);
    if (type === "edit") setIsEditDialogOpen(true);
    else setIsViewDialogOpen(true);
  };

  const statCards = [
    { label: "Total Requests",  value: filteredAndSortedRequests.length, color: "text-foreground",  bg: "bg-muted",    border: "border-l-gray-400",  icon: <FileText className="h-5 w-5 text-muted-foreground" /> },
    { label: "Pending",         value: totalPending,                     color: "text-amber-600",   bg: "bg-amber-50", border: "border-l-amber-400", icon: <Clock className="h-5 w-5 text-amber-500" /> },
    { label: "Approved",        value: totalApproved,                    color: "text-green-600",   bg: "bg-green-50", border: "border-l-green-400", icon: <CheckCircle className="h-5 w-5 text-green-500" /> },
    { label: "Pending Amount",  value: `₦${pendingAmount.toLocaleString()}`, color: "text-blue-600", bg: "bg-blue-50", border: "border-l-blue-400",  icon: <TrendingUp className="h-5 w-5 text-blue-500" /> },
  ];

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-5 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3">
          {[...Array(4)].map((_, i) => <RequestCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Requests Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? "Create and track your hotel branch requests" : "Manage all outstanding financial requests"}
            {" · "}{filteredAndSortedRequests.length} of {requests.length} shown
          </p>
        </div>

        {canCreate && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="shrink-0 self-start gap-2">
                <Plus className="h-4 w-4" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Request</DialogTitle>
                <DialogDescription>Submit a new financial request for your hotel branch.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs uppercase tracking-wide text-muted-foreground">Request Title</Label>
                  <Input id="title" placeholder="e.g., Equipment Purchase" value={formData.title} onChange={handleInputChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="amount" className="text-xs uppercase tracking-wide text-muted-foreground">Amount (₦)</Label>
                  <Input id="amount" type="number" placeholder="5000" value={formData.amount || ""} onChange={handleInputChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                  <Textarea id="description" placeholder="Describe the purpose of this request..." rows={4} value={formData.description} onChange={handleInputChange} />
                </div>
                <Button className="w-full" onClick={handleCreateRequest} disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
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
                <p className={cn("text-xl font-bold leading-tight", s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or submitter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0 gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-primary" />}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 h-9 w-9">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RequestStatus | "all")}>
                  <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Sort By</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "amount")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Order</Label>
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Newest First</SelectItem>
                    <SelectItem value="asc">Oldest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredAndSortedRequests.length === 0 && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No Requests Found</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasActiveFilters
                  ? "Try adjusting your filters to see more results."
                  : "Create your first request to get started."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request Cards */}
      {filteredAndSortedRequests.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {filteredAndSortedRequests.map((request, index) => {
            const cfg = statusConfig[request.status] ?? statusConfig.pending;
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
                  <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>

                  <div className="border-t" />

                  {/* Amount + Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-bold text-foreground text-base">
                      ₦{request.amount.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openRequestModal(request, "view")}>
                        <Eye className="h-4 w-4 mr-1.5" /> View
                      </Button>
                      {isAdmin && request.status === "pending" && request.raisedBy?._id === loggedInUserId && (
                        <Button variant="outline" size="sm" onClick={() => openRequestModal(request, "edit")}>
                          <Edit className="h-4 w-4 mr-1.5" /> Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Request Modal */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">
              {currentRequest?.title || "Request Details"}
            </DialogTitle>
          </DialogHeader>
          {currentRequest ? (
            <div className="space-y-5 py-2">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <Badge
                  className={cn(
                    "text-xs border",
                    statusConfig[currentRequest.status]?.badge
                  )}
                >
                  {statusConfig[currentRequest.status]?.label}
                </Badge>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailField
                  label="Raised By"
                  value={`${currentRequest.raisedBy?.firstName} ${currentRequest.raisedBy?.lastName}`}
                />
                <DetailField
                  label="Amount"
                  value={`₦${currentRequest.amount.toLocaleString()}`}
                />
                {typeof currentRequest.hotelId !== "string" && (
                  <DetailField label="Hotel Branch" value={currentRequest.hotelId?.name} />
                )}
                <DetailField
                  label="Date Submitted"
                  value={format(new Date(currentRequest.createdAt), "MMM dd, yyyy")}
                />
                {currentRequest.approvedBy && typeof currentRequest.approvedBy !== "string" && (
                  <DetailField
                    label="Reviewed By"
                    value={`${currentRequest.approvedBy.firstName} ${currentRequest.approvedBy.lastName}`}
                  />
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
                <p className="text-sm text-foreground bg-muted/40 p-3 rounded-md min-h-[80px] whitespace-pre-wrap">
                  {currentRequest.description}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              <Skeleton className="h-5 w-32 rounded-full" />
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Request Modal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
            <DialogDescription>
              You can edit this request because it is still pending review.
            </DialogDescription>
          </DialogHeader>
          {currentRequest ? (
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs uppercase tracking-wide text-muted-foreground">Request Title</Label>
                <Input id="title" placeholder="e.g., Equipment Purchase" value={currentRequest.title} onChange={handleInputChange} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs uppercase tracking-wide text-muted-foreground">Amount (₦)</Label>
                <Input id="amount" type="number" placeholder="5000" value={currentRequest.amount} onChange={handleInputChange} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
                <Textarea id="description" placeholder="Describe the purpose of this request..." rows={4} value={currentRequest.description} onChange={handleInputChange} />
              </div>
              <Button className="w-full" onClick={handleEditRequest} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4">Loading form data...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
