import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, DollarSign, Clock, CheckCircle, XCircle, Plus, Loader2, Edit, Eye, Search, Filter, X } from "lucide-react";
import { useRequestStore, useRequestActions, FinancialRequest, RequestStatus } from "@/store/useRequestStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

type LucideIcon = React.ComponentType<{ className?: string }>;
const statusConfig: Record<RequestStatus, { color: string; icon: LucideIcon }> = {
  pending: { color: "bg-warning text-warning-foreground", icon: Clock },
  approved: { color: "bg-success text-success-foreground", icon: CheckCircle },
  rejected: { color: "bg-destructive text-destructive-foreground", icon: XCircle },
};

// --- SKELETON COMPONENTS ---
const RequestCardSkeleton = () => (
    <Card className="animate-pulse">
        <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-24" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const ViewRequestSkeleton = () => (
    <div className="space-y-4 py-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex justify-between pt-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-32" />
        </div>
    </div>
);

export default function ManagerRequests() {
  const { requests, isLoading } = useRequestStore();
  const { fetchAllRequests, createRequest, editRequest, updateRequestStatus } = useRequestActions();
  const { user } = useAuthStore();
  
  // Modal state variables
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<FinancialRequest | null>(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    description: "",
  });

  // ✅ NEW: Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const isAdmin = user?.role === 'admin';
  const canCreate = isAdmin;
  const loggedInUserId = user?._id;

  // --- Data Fetching ---
  useEffect(() => {
    if (user?.role) {
      fetchAllRequests(isAdmin); 
    }
  }, [user?.role, fetchAllRequests, isAdmin]);

  // ✅ NEW: Filter and Search Logic
  const filteredAndSortedRequests = useMemo(() => {
    let filtered = [...requests];

    // 1. Search filter (title, description, raised by name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(query) ||
        request.description.toLowerCase().includes(query) ||
        `${request.raisedBy?.firstName} ${request.raisedBy?.lastName}`.toLowerCase().includes(query)
      );
    }

    // 2. Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // 3. Sorting
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      } else {
        // Sort by amount
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return filtered;
  }, [requests, searchQuery, statusFilter, sortBy, sortOrder]);

  // ✅ NEW: Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortBy("date");
    setSortOrder("desc");
  };

  // ✅ NEW: Check if any filters are active
  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all" || sortBy !== "date" || sortOrder !== "desc";

  // --- Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    if (isCreateDialogOpen) {
        setFormData(prev => ({ 
            ...prev, 
            [id]: type === 'number' ? parseFloat(value) || 0 : value 
        }));
    } else if (isEditDialogOpen && currentRequest) {
        setCurrentRequest(prev => prev ? { 
            ...prev, 
            [id as 'title' | 'description' | 'amount']: type === 'number' ? parseFloat(value) || 0 : value 
        } as FinancialRequest : null);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.title || !formData.description || formData.amount <= 0) {
      toast.error("Please fill in the title, description, and a valid amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createRequest({
          title: formData.title,
          amount: formData.amount,
          description: formData.description,
      });
      setFormData({ title: "", amount: 0, description: "" });
      setIsCreateDialogOpen(false);
    } catch (error) {
      // Error toast handled in store
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRequest = async () => {
      if (!currentRequest) return;
      
      const payload = {
          title: currentRequest.title,
          amount: currentRequest.amount,
          description: currentRequest.description,
      };

      if (!payload.title || !payload.description || payload.amount <= 0) {
        toast.error("Please fill in the title, description, and a valid amount for the edit.");
        return;
      }

      setIsSubmitting(true);
      try {
          await editRequest(currentRequest._id, payload);
          setIsEditDialogOpen(false);
      } catch (error) {
          // Error toast handled in store
      } finally {
          setIsSubmitting(false);
      }
  };

  const openRequestModal = (request: FinancialRequest, type: 'view' | 'edit') => {
    setCurrentRequest(request);
    if (type === 'edit') {
        setIsEditDialogOpen(true);
    } else {
        setIsViewDialogOpen(true);
    }
  };
  
  // ✅ UPDATED: Calculate stats from filtered results
  const totalPending = filteredAndSortedRequests.filter(r => r.status === "pending").length;
  const totalApproved = filteredAndSortedRequests.filter(r => r.status === "approved").length;
  const pendingAmount = filteredAndSortedRequests.filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0);

  // --- Render ---
  if (isLoading) {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Requests Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
            </div>
            <div className="grid grid-cols-1 gap-4">
                {[...Array(5)].map((_, i) => <RequestCardSkeleton key={i} />)}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* -------------------- HEADER & CREATE MODAL -------------------- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requests Management</h1>
          <p className="text-muted-foreground">
              {isAdmin ? 'Create and track your hotel branch requests' : 'Manage all outstanding financial requests'}
          </p>
        </div>
        
        {canCreate && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Request Title</Label>
                    <Input id="title" placeholder="e.g., Equipment Purchase" value={formData.title} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₦)</Label>
                    <Input id="amount" type="number" placeholder="5000" value={formData.amount} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Describe the description of this request..." rows={4} value={formData.description} onChange={handleInputChange} />
                  </div>
                  <Button className="w-full" onClick={handleCreateRequest} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                    ) : 'Submit Request'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
        )}
      </div>

      {/* ✅ NEW: SEARCH & FILTER BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, description, or submitter name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="shrink-0"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as RequestStatus | "all")}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as "date" | "amount")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order</Label>
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as "asc" | "desc")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Descending" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ UPDATED: Show result count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredAndSortedRequests.length} of {requests.length} requests
          </span>
          <Button variant="link" onClick={clearFilters} className="h-auto p-0">
            Clear all filters
          </Button>
        </div>
      )}

      {/* -------------------- STATS -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Requests</p><p className="text-2xl font-bold text-foreground">{filteredAndSortedRequests.length}</p></div><FileText className="h-8 w-8 text-primary" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-foreground">{totalPending}</p></div><Clock className="h-8 w-8 text-warning" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-foreground">{totalApproved}</p></div><CheckCircle className="h-8 w-8 text-success" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Amount</p><p className="text-2xl font-bold text-foreground">₦{pendingAmount.toLocaleString()}</p></div><DollarSign className="h-8 w-8 text-info" /></div></CardContent></Card>
      </div>

      {/* -------------------- REQUESTS LIST -------------------- */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAndSortedRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No requests found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more results"
                  : "Create your first request to get started"
                }
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedRequests.map((request, index) => (
            <Card key={request._id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{request?.title || 'Untitled Request'}</h3>
                        <span className="text-sm text-muted-foreground">Submitted by: {request.raisedBy?.firstName} {request.raisedBy?.lastName}</span>
                        <p className="text-sm text-muted-foreground">Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge className={statusConfig[request.status].color}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">₦{request.amount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openRequestModal(request, 'view')}>
                      <Eye className="h-4 w-4 mr-2" /> View Details
                    </Button>
                    
                    {isAdmin && request.status === "pending" && request.raisedBy._id === loggedInUserId && (
                      <Button variant="outline" size="sm" onClick={() => openRequestModal(request, 'edit')}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* -------------------- VIEW REQUEST MODAL -------------------- */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>View Request: {currentRequest?.title}</DialogTitle>
          </DialogHeader>
          {currentRequest ? (
            <>
              {(() => {
                const statusEntry = statusConfig[currentRequest.status];
                const Icon = statusEntry.icon;
                const statusText = currentRequest.status.charAt(0).toUpperCase() + currentRequest.status.slice(1);
                return (
                  <div className="space-y-4 py-4">
                    <div className="flex justify-between items-center border-b pb-2">
                        <h3 className="text-xl font-bold">{currentRequest.title}</h3>
                        <Badge className={statusEntry.color}>
                            {Icon && <Icon className="h-4 w-4 mr-1" />}
                            {statusText}
                        </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <p className="text-sm text-muted-foreground">Raised By: <span className="font-medium text-foreground">{currentRequest.raisedBy?.firstName} {currentRequest.raisedBy?.lastName}</span></p>
                        <p className="text-sm text-muted-foreground">Amount: <span className="font-medium text-foreground">₦{currentRequest.amount.toLocaleString()}</span></p>
                        {typeof currentRequest.hotelId !== 'string' && (
                          <p className="text-sm text-muted-foreground">Hotel: <span className="font-medium text-foreground">{currentRequest.hotelId.name}</span></p>
                        )}
                        <p className="text-sm text-muted-foreground">Date: <span className="font-medium text-foreground">{new Date(currentRequest.createdAt).toLocaleDateString()}</span></p>
                    </div>

                    <div className="space-y-2 pt-4">
                        <Label className="text-base font-semibold">Detailed Description</Label>
                        <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-md min-h-[100px] whitespace-pre-wrap">
                            {currentRequest.description}
                        </p>
                    </div>
                    
                    {currentRequest.approvedBy && typeof currentRequest.approvedBy !== 'string' && (
                        <p className="text-xs text-success-foreground pt-2">
                            Reviewed by: {currentRequest.approvedBy.firstName} {currentRequest.approvedBy.lastName}
                        </p>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <ViewRequestSkeleton />
          )}
        </DialogContent>
      </Dialog>
      
      {/* -------------------- EDIT REQUEST MODAL -------------------- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Request: {currentRequest?.title}</DialogTitle>
            <DialogDescription>
                You can only edit this request because the status is currently **pending**.
            </DialogDescription>
          </DialogHeader>
          {currentRequest ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title</Label>
                <Input 
                    id="title" 
                    placeholder="e.g., Equipment Purchase" 
                    value={currentRequest.title} 
                    onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input 
                    id="amount" 
                    type="number" 
                    placeholder="5000" 
                    value={currentRequest.amount} 
                    onChange={handleInputChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                    id="description" 
                    placeholder="Describe the description of this request..." 
                    rows={4} 
                    value={currentRequest.description} 
                    onChange={handleInputChange} 
                />
              </div>
              <Button className="w-full" onClick={handleEditRequest} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Changes...</>
                ) : 'Save Changes'}
              </Button>
            </div>
          ) : (
            <p>Loading form data...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}