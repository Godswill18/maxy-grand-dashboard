import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, MapPin, CheckCircle, XCircle } from "lucide-react";

// --- Import your Zustand store and hooks ---
import { useRequestStore, useRequestActions, RequestStatus } from "@/store/useRequestStore"; // Adjust path
// SKELETON: Import the new skeleton component
import { RequestSkeleton } from "@/components/skeleton/RequestSkeleton"; // Adjust path

// Status config now uses the backend's exact status strings
const statusConfig: Record<RequestStatus, { color: string; icon: any }> = {
  pending: { color: "bg-warning text-warning-foreground", icon: FileText },
  approved: { color: "bg-success text-success-foreground", icon: CheckCircle },
  rejected: { color: "bg-destructive text-destructive-foreground", icon: XCircle },
};

export default function Requests() {
  // --- Get state and actions from the store ---
  const { requests, isLoading, error } = useRequestStore();
  const { fetchAllRequests, updateRequestStatus } = useRequestActions();

  // --- Fetch data on component mount ---
  useEffect(() => {
    fetchAllRequests();
  }, [fetchAllRequests]); // Dependency array ensures it runs once

  // --- Handle Loading State ---
  // SKELETON: Show the skeleton component while loading
  if (isLoading && requests.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Request Management</h1>
          <p className="text-muted-foreground">Review and manage branch requests</p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {/* Render 3 skeleton cards as placeholders */}
          {Array.from({ length: 3 }).map((_, index) => (
            <RequestSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  // --- Handle Error State ---
  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-destructive">Error</h1>
        <p className="text-lg text-destructive-foreground">{error}</p>
        <Button onClick={fetchAllRequests}>Try Again</Button>
      </div>
    );
  }
  
  // --- Handle Empty State (No requests found) ---
  if (!isLoading && requests.length === 0) {
     return (
       <div className="space-y-6 animate-in fade-in duration-500">
         <div>
           <h1 className="text-3xl font-bold text-foreground">Request Management</h1>
           <p className="text-muted-foreground">Review and manage branch requests</p>
         </div>
         <p className="text-muted-foreground">No requests found.</p>
       </div>
     );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Request Management</h1>
        <p className="text-muted-foreground">Review and manage branch requests</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* --- Map over the requests from the store --- */}
        {requests.map((request, index) => (
          <Card
            key={request._id} // Use database ID
            className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {request.description}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {/* FIX: Use optional chaining (?.) to prevent crash if raisedBy is null */}
                        Requested by {request.raisedBy?.name || 'Unknown User'}
                      </p>
                    </div>
                    <Badge className={statusConfig[request.status]?.color || statusConfig.pending.color}>
                      {/* Capitalize first letter */}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {/* FIX: Use optional chaining (?.) to prevent crash if hotelId is null */}
                        {request.hotelId?.name || 'Unknown Branch'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">
                        ₦ {request.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- Button click handlers are now connected --- */}
                {request.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRequestStatus(request._id, 'rejected')}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateRequestStatus(request._id, 'approved')}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}