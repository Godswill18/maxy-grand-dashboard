import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Lock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Building,
  User,
  Shield,
  Clock,
} from "lucide-react";
import { useStaffStore, StaffUser } from "@/store/useUserStore";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

// Capitalize helper
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Format date helper
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const roleColors: Record<string, string> = {
  superadmin: "bg-danger text-danger-foreground",
  admin: "bg-primary text-primary-foreground",
  receptionist: "bg-secondary text-secondary-foreground",
  cleaner: "bg-info text-info-foreground",
  waiter: "bg-warning text-warning-foreground",
  headWaiter: "bg-warning text-warning-foreground",
};

const roleDescriptions: Record<string, string> = {
  superadmin: "Full system access and control",
  admin: "Branch management and operations",
  receptionist: "Front desk and guest services",
  cleaner: "Housekeeping and room maintenance",
  waiter: "Restaurant and dining services",
  headWaiter: "Restaurant management and staff coordination",
};

export default function Staffs() {
  const {
    staff,
    isLoading,
    error,
    fetchAllStaff,
    initializeSocket,
    disconnectSocket,
    updateStaffStatus,
    updateStaffRole,
  } = useStaffStore();
  const { user } = useAuthStore();
  const userRole = user?.role;

  // State for staff details modal
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    staffMember: StaffUser | null;
  }>({
    open: false,
    staffMember: null,
  });

  // State for deactivation confirmation
  const [deactivateDialog, setDeactivateDialog] = useState<{
    open: boolean;
    staffMember: StaffUser | null;
    newStatus: boolean;
  }>({
    open: false,
    staffMember: null,
    newStatus: false,
  });

  // State for role change confirmation
  const [roleChangeDialog, setRoleChangeDialog] = useState<{
    open: boolean;
    staffMember: StaffUser | null;
    currentRole: string;
    newRole: string;
  }>({
    open: false,
    staffMember: null,
    currentRole: "",
    newRole: "",
  });

  useEffect(() => {
    initializeSocket();
    fetchAllStaff();

    return () => {
      disconnectSocket();
    };
  }, [initializeSocket, fetchAllStaff, disconnectSocket]);

  // View staff details
  const handleViewDetails = (staffMember: StaffUser) => {
    setDetailsDialog({
      open: true,
      staffMember,
    });
  };

  // Toggle active status
  const handleToggleActive = (staffMember: StaffUser, checked: boolean) => {
    if (staffMember.role === "superadmin" || staffMember.role === "guest") {
      toast.error("Cannot change status for this role.");
      return;
    }

    if (!checked) {
      setDeactivateDialog({
        open: true,
        staffMember,
        newStatus: checked,
      });
      return;
    }

    performStatusUpdate(staffMember, checked);
  };

  const performStatusUpdate = (staffMember: StaffUser, newStatus: boolean) => {
    updateStaffStatus(staffMember._id, newStatus);

    if (newStatus) {
      toast.success(
        `${staffMember.firstName} ${staffMember.lastName} can now login to the system.`,
        { duration: 4000 }
      );
    } else {
      toast.warning(
        `${staffMember.firstName} ${staffMember.lastName} has been deactivated and will be logged out.`,
        { duration: 5000 }
      );
    }
  };

  // Handle role change
  const handleRoleChange = (staffMember: StaffUser, newRole: string) => {
    if (staffMember.role === "superadmin") {
      toast.error("Cannot change superadmin role.");
      return;
    }

    // Show confirmation dialog
    setRoleChangeDialog({
      open: true,
      staffMember,
      currentRole: staffMember.role,
      newRole,
    });
  };

  const performRoleChange = () => {
    if (roleChangeDialog.staffMember) {
      updateStaffRole(roleChangeDialog.staffMember._id, roleChangeDialog.newRole);
      toast.success(
        `${roleChangeDialog.staffMember.firstName} ${roleChangeDialog.staffMember.lastName}'s role updated to ${capitalize(roleChangeDialog.newRole)}.`
      );
    }
    setRoleChangeDialog({
      open: false,
      staffMember: null,
      currentRole: "",
      newRole: "",
    });
  };

  const handleConfirmDeactivation = () => {
    if (deactivateDialog.staffMember) {
      performStatusUpdate(deactivateDialog.staffMember, deactivateDialog.newStatus);
    }
    setDeactivateDialog({ open: false, staffMember: null, newStatus: false });
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
            className={`hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom ${
              !staffMember.isActive ? "opacity-75 border-destructive/30" : ""
            }`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              {/* Header with name, role, and status toggle */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg text-foreground">
                      {staffMember.firstName} {staffMember.lastName}
                    </h3>
                    {/* Active/Inactive indicator */}
                    {staffMember.isActive ? (
                      <Tooltip>
                        <TooltipTrigger>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Active - Can login</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Inactive - Cannot login</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <Badge
                    className={`mt-1 ${
                      roleColors[staffMember.role] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {capitalize(staffMember.role)}
                  </Badge>
                </div>

                {/* Status Toggle Switch */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Switch
                        checked={staffMember.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleActive(staffMember, checked)
                        }
                        disabled={
                          staffMember.role === "superadmin" ||
                          staffMember.role === "guest"
                        }
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {staffMember.role === "superadmin" || staffMember.role === "guest"
                      ? "Cannot deactivate this role"
                      : staffMember.isActive
                      ? "Click to deactivate (user will be logged out)"
                      : "Click to activate (user can login)"}
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Account Status Banner */}
              {!staffMember.isActive && (
                <div className="mb-4 p-2 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
                  <Lock className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-destructive font-medium">
                    Account Deactivated - Cannot Login
                  </span>
                </div>
              )}

              {/* Role Change Dropdown (Superadmin only) */}
              {userRole === "superadmin" && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Change Role:
                  </label>
                  <select
                    value={staffMember.role}
                    onChange={(e) => handleRoleChange(staffMember, e.target.value)}
                    className="w-full border border-input bg-background text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    disabled={staffMember.role === "superadmin"}
                  >
                    <option value="admin">Admin (Branch Manager)</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="waiter">Waiter</option>
                    <option value="headWaiter">Head Waiter</option>
                  </select>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{staffMember.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{staffMember.phoneNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span>{staffMember.hotelId?.name || "No branch assigned"}</span>
                </div>
              </div>

              {/* View Details Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleViewDetails(staffMember)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage all hotel staff across branches. Inactive staff cannot login.
          </p>
        </div>
      </div>

      {/* Staff Grid */}
      {renderContent()}

      {/* Staff Details Modal */}
      <Dialog
        open={detailsDialog.open}
        onOpenChange={(open) => {
          if (!open) setDetailsDialog({ open: false, staffMember: null });
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {detailsDialog.staffMember?.firstName}{" "}
              {detailsDialog.staffMember?.lastName}
            </DialogDescription>
          </DialogHeader>

          {detailsDialog.staffMember && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">First Name</p>
                    <p className="font-medium">{detailsDialog.staffMember.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Name</p>
                    <p className="font-medium">{detailsDialog.staffMember.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{detailsDialog.staffMember.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{detailsDialog.staffMember.phoneNumber}</p>
                  </div>
                </div>
              </div>

              {/* Employment Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Employment Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <Badge
                      className={
                        roleColors[detailsDialog.staffMember.role] ||
                        "bg-muted text-muted-foreground"
                      }
                    >
                      {capitalize(detailsDialog.staffMember.role)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {roleDescriptions[detailsDialog.staffMember.role] ||
                        "No description"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Status</p>
                    <div className="flex items-center gap-2 mt-1">
                      {detailsDialog.staffMember.isActive ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="font-medium text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span className="font-medium text-destructive">Inactive</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {detailsDialog.staffMember.isActive
                        ? "Can login to the system"
                        : "Cannot login to the system"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Branch Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Branch Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Branch</p>
                    <p className="font-medium">
                      {detailsDialog.staffMember.hotelId?.name || "No branch assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Branch ID</p>
                    <p className="font-mono text-sm">
                      {detailsDialog.staffMember.hotelId?._id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Account Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{detailsDialog.staffMember._id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Account Created</p>
                    <p className="font-medium">
                      {formatDate(detailsDialog.staffMember.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {formatDate(detailsDialog.staffMember.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Access Permissions */}
              {!detailsDialog.staffMember.isActive && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive mb-1">
                        Account Inactive
                      </h4>
                      <p className="text-sm text-destructive/90">
                        This staff member cannot login to the system. To grant access,
                        activate their account using the toggle switch.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivation Confirmation Dialog */}
      <AlertDialog
        open={deactivateDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setDeactivateDialog({ open: false, staffMember: null, newStatus: false });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Deactivate Staff Member
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to deactivate{" "}
                <strong>
                  {deactivateDialog.staffMember?.firstName}{" "}
                  {deactivateDialog.staffMember?.lastName}
                </strong>
                ?
              </p>
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium">
                  ⚠️ This will immediately:
                </p>
                <ul className="mt-2 text-sm text-destructive/90 space-y-1 ml-4 list-disc">
                  <li>Prevent them from logging in</li>
                  <li>Log them out if they're currently logged in</li>
                  <li>Revoke their access to the system</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                You can reactivate their account at any time by toggling the switch back
                on.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setDeactivateDialog({ open: false, staffMember: null, newStatus: false })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeactivation}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Change Confirmation Dialog */}
      <AlertDialog
        open={roleChangeDialog.open}
        onOpenChange={(open) => {
          if (!open)
            setRoleChangeDialog({
              open: false,
              staffMember: null,
              currentRole: "",
              newRole: "",
            });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Confirm Role Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to change the role for{" "}
                <strong>
                  {roleChangeDialog.staffMember?.firstName}{" "}
                  {roleChangeDialog.staffMember?.lastName}
                </strong>
                ?
              </p>
              <div className="p-4 bg-muted rounded-md space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Role:</span>
                  <Badge
                    className={
                      roleColors[roleChangeDialog.currentRole] ||
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {capitalize(roleChangeDialog.currentRole)}
                  </Badge>
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-2xl">→</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Role:</span>
                  <Badge
                    className={
                      roleColors[roleChangeDialog.newRole] ||
                      "bg-muted text-muted-foreground"
                    }
                  >
                    {capitalize(roleChangeDialog.newRole)}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-md">
                <p className="text-sm text-primary font-medium mb-2">
                  ℹ️ Role Change Effects:
                </p>
                <ul className="text-sm text-primary/90 space-y-1 ml-4 list-disc">
                  <li>User's permissions will update immediately</li>
                  <li>User may need to refresh their session</li>
                  <li>Dashboard and navigation will change accordingly</li>
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">
                The user will see their new role after logging in again or refreshing the
                page.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setRoleChangeDialog({
                  open: false,
                  staffMember: null,
                  currentRole: "",
                  newRole: "",
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={performRoleChange}>
              Confirm Role Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}