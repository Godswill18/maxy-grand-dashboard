import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton"; // For loading
import { AlertCircle, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { useStaffStore, StaffUser } from "@/store/useUserStore"; // Use alias path
import { toast } from "sonner";

// Capitalize helper
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const roleColors: Record<string, string> = {
  superadmin: "bg-danger text-danger-foreground",
  admin: "bg-primary text-primary-foreground",
  receptionist: "bg-secondary text-secondary-foreground",
  cleaner: "bg-info text-info-foreground",
  waiter: "bg-warning text-warning-foreground",
};

export default function Staffs() {
  const { 
    staff, 
    isLoading, 
    error, 
    fetchAllStaff, 
    initializeSocket, 
    disconnectSocket,
    updateStaffStatus
  } = useStaffStore();

  useEffect(() => {
    // Connect to sockets and fetch initial data
    initializeSocket();
    fetchAllStaff();

    // Disconnect on component unmount
    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, fetchAllStaff, disconnectSocket]);

  const handleToggleActive = (user: StaffUser, checked: boolean) => {
    // Optimistic update (show change immediately)
    // The socket event will confirm it
    if (user.role === 'superadmin' || user.role === 'guest') {
      toast.error("Cannot change status for this role.");
      return;
    }
    // Call the store action
    updateStaffStatus(user._id, checked);
  };

  const renderContent = () => {
    if (isLoading && staff.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="col-span-full bg-danger/10 border-danger">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-danger" />
            <div>
              <h3 className="font-semibold text-danger">Error Fetching Staff</h3>
              <p className="text-danger/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (staff.length === 0) {
      return (
        <Card className="col-span-full">
          <CardContent className="p-6 text-center text-muted-foreground">
            No staff members found.
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {(staff || []).map((staffMember, index) => (
          <Card 
            key={staffMember._id} 
            className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" 
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {staffMember.firstName} {staffMember.lastName}
                  </h3>
                  <Badge className={`mt-1 ${roleColors[staffMember.role] || 'bg-muted text-muted-foreground'}`}>
                    {capitalize(staffMember.role)}
                  </Badge>
                </div>
                <Switch 
                  checked={staffMember.isActive} 
                  onCheckedChange={(checked) => handleToggleActive(staffMember, checked)}
                  disabled={staffMember.role === 'superadmin' || staffMember.role === 'guest'}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{staffMember.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{staffMember.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{staffMember.hotelId?.name || 'No branch assigned'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage all hotel staff across branches</p>
        </div>
        {/* You can add a "Create Staff" button here later */}
      </div>

      {renderContent()}
    </div>
  );
}