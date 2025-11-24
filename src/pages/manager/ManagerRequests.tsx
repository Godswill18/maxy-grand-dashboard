import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, DollarSign, Clock, CheckCircle, XCircle, Plus, Loader2, Edit, Eye } from "lucide-react";
import { useRequestStore, useRequestActions, FinancialRequest, RequestStatus } from "@/store/useRequestStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

// FIX: Use status from the store's RequestStatus type
// Also improve typing for icons (Lucide icons are React components)
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
// -----------------------------


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

  const isAdmin = user?.role === 'admin';
  // const isSuperAdmin = user?.role === 'superadmin';
  const canCreate = isAdmin; // Since isSuperAdmin is commented out
  const loggedInUserId = user?._id; // Assuming user.id is the user's Mongoose ID


  // --- Data Fetching ---
  useEffect(() => {
    if (user?.role) {
      fetchAllRequests(isAdmin); 
    }
  }, [user?.role, fetchAllRequests, isAdmin]);


  // --- Handlers ---

  // Handle input change for ALL forms (Create and Edit)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    // Use the appropriate state setter based on which modal is open
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

  // 1. New Request Submission
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

  // 2. Edit Request Submission
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


  // --- UI Control Helpers ---

  // Sets the request to view/edit, then opens the corresponding modal
  const openRequestModal = (request: FinancialRequest, type: 'view' | 'edit') => {
    setCurrentRequest(request);
    if (type === 'edit') {
        setIsEditDialogOpen(true);
    } else {
        setIsViewDialogOpen(true);
    }
  };
  
  // Calculate stats using live data
  const totalPending = requests.filter(r => r.status === "pending").length;
  const totalApproved = requests.filter(r => r.status === "approved").length;
  const pendingAmount = requests.filter(r => r.status === "pending").reduce((sum, r) => sum + r.amount, 0);


  // --- Render ---

  if (isLoading) {
    // 3. FIX: Implement skeleton while loading
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

      {/* -------------------- STATS -------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Stats cards remain the same, using calculated values */}
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Requests</p><p className="text-2xl font-bold text-foreground">{requests.length}</p></div><FileText className="h-8 w-8 text-primary" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-foreground">{totalPending}</p></div><Clock className="h-8 w-8 text-warning" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-foreground">{totalApproved}</p></div><CheckCircle className="h-8 w-8 text-success" /></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending Amount</p><p className="text-2xl font-bold text-foreground">₦{pendingAmount.toLocaleString()}</p></div><DollarSign className="h-8 w-8 text-info" /></div></CardContent></Card>
      </div>

      {/* -------------------- REQUESTS LIST -------------------- */}
      <div className="grid grid-cols-1 gap-4">
        {requests.map((request, index) => (
          <Card key={request._id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{request?.title || 'Untitled Request'}</h3>
                      <span className="text-sm text-muted-foreground">Submited by: {request.raisedBy?.firstName} {request.raisedBy?.lastName}</span>
                      <p className="text-sm text-muted-foreground">Date: {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Badge className={statusConfig[request.status].color}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{request.description}</p>
                  
                  {/* {isSuperAdmin && typeof request.hotelId !== 'string' && (
                     <div className="flex items-center gap-2 text-xs text-info-foreground">
                        <span className="font-medium">Hotel:</span> {request.hotelId.name}
                     </div>
                  )} */}

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">₦{request.amount.toLocaleString()}</span>
                  </div>
                </div>

                {/* 4. FIX: Action Buttons - View & Edit */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openRequestModal(request, 'view')}>
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Button>
                  
                  {/* Admin can only edit if it's pending and they are the creator */}
                  {isAdmin && request.status === "pending" && request.raisedBy._id === loggedInUserId && (
                    <Button variant="outline" size="sm" onClick={() => openRequestModal(request, 'edit')}>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  )}
                  
                  {/* SuperAdmin actions (uncommented for completeness) */}
                  {/* {isSuperAdmin && request.status === "pending" && (
                     <>
                       <Button variant="success" size="sm" onClick={() => updateRequestStatus(request._id, 'approved')}>
                         Approve
                       </Button>
                       <Button variant="destructive" size="sm" onClick={() => updateRequestStatus(request._id, 'rejected')}>
                         Reject
                       </Button>
                     </>
                  )} */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* -------------------- VIEW REQUEST MODAL -------------------- */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>View Request: {currentRequest?.title}</DialogTitle>
          </DialogHeader>
          {currentRequest ? (
            <>
              {/* Extract icon component to fix dynamic rendering */}
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
                    
                    {/* Approval/Rejection details */}
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
            // 5. FIX: Use view skeleton if currentRequest is unexpectedly null
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