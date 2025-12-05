import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Plus, Eye, AlertTriangle, UserCheck, UserX, Shield } from "lucide-react";
import { useStaffStore } from "@/store/useStaffStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription 
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type StaffRole = 'receptionist' | 'cleaner' | 'waiter' | 'admin';

// Define interface for staff member
interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: StaffRole;
  isActive: boolean;
  hotelId?: string;
  createdAt?: string;
  updatedAt?: string;
}

const roleColors: Record<string, string> = {
  Receptionist: "bg-secondary text-secondary-foreground",
  Cleaner: "bg-info text-info-foreground",
  Waiter: "bg-warning text-warning-foreground",
  Admin: "bg-primary text-primary-foreground",
};

const roleIcons: Record<string, any> = {
  receptionist: UserCheck,
  cleaner: UserCheck,
  waiter: UserCheck,
  admin: Shield,
};

export default function StaffManagement() {
  const { 
    staff, 
    isLoading, 
    fetchStaffByLoggedInUserHotel,
    updateStaffStatus, 
    updateStaffRole, 
    createStaff
  } = useStaffStore();
  
  const { user } = useAuthStore();
  const hotelId = user?.hotelId;
  
  // State for Add Staff Dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "receptionist" as StaffRole,
  });

  // State for View Details Dialog
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<any | null>(null);

  // State for Role Change Confirmation
  const [roleChangeDialog, setRoleChangeDialog] = useState({
    isOpen: false,
    staffId: "",
    staffName: "",
    currentRole: "",
    newRole: "",
  });

  // State for Status Toggle Confirmation
  const [statusToggleDialog, setStatusToggleDialog] = useState({
    isOpen: false,
    staffId: "",
    staffName: "",
    currentStatus: false,
    newStatus: false,
  });

  useEffect(() => {
    if (hotelId) {
      fetchStaffByLoggedInUserHotel();
    }
  }, [hotelId]);

  // ============= HANDLERS =============

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateStaff = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields (Name, Email, Password).");
      return;
    }
    
    setIsCreating(true);
    try {
      const newStaff = await createStaff(formData);
      
      if (newStaff) {
        setIsAddDialogOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          password: "",
          role: "receptionist",
        });
        toast.success("Staff member created successfully!");
      }
    } finally {
      setIsCreating(false);
    }
  };

  // ============= VIEW DETAILS =============
    const handleViewDetails = (staffMember: any) => {
      setSelectedStaff(staffMember);
      setIsViewDialogOpen(true);
    };

  // ============= STATUS TOGGLE WITH CONFIRMATION =============
    const handleStatusToggleClick = (staffMember: any) => {
      setStatusToggleDialog({
        isOpen: true,
        staffId: staffMember._id,
        staffName: `${staffMember.firstName} ${staffMember.lastName}`,
        currentStatus: staffMember.isActive,
        newStatus: !staffMember.isActive,
      });
    };

  const confirmStatusToggle = async () => {
    try {
      await updateStaffStatus(statusToggleDialog.staffId, statusToggleDialog.newStatus);
      
      const action = statusToggleDialog.newStatus ? "activated" : "deactivated";
      toast.success(`${statusToggleDialog.staffName} has been ${action} successfully!`);
      
      setStatusToggleDialog({
        isOpen: false,
        staffId: "",
        staffName: "",
        currentStatus: false,
        newStatus: false,
      });
    } catch (error) {
      toast.error("Failed to update staff status. Please try again.");
    }
  };

  // ============= ROLE CHANGE WITH CONFIRMATION =============
    const handleRoleChangeClick = (staffMember: any, newRole: string) => {
      if (newRole === staffMember.role) {
        return; // No change needed
      }
  
      setRoleChangeDialog({
        isOpen: true,
        staffId: staffMember._id,
        staffName: `${staffMember.firstName} ${staffMember.lastName}`,
        currentRole: staffMember.role,
        newRole: newRole,
      });
    };

  const confirmRoleChange = async () => {
    try {
      await updateStaffRole(roleChangeDialog.staffId, roleChangeDialog.newRole.toLowerCase() as StaffRole);
      
      toast.success(`${roleChangeDialog.staffName}'s role has been updated to ${roleChangeDialog.newRole}!`);
      
      setRoleChangeDialog({
        isOpen: false,
        staffId: "",
        staffName: "",
        currentRole: "",
        newRole: "",
      });
    } catch (error) {
      toast.error("Failed to update staff role. Please try again.");
    }
  };

  // ============= RENDER LOADING STATE =============
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="space-y-2 mb-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============= MAIN RENDER =============
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management 🧑‍💼</h1>
          <p className="text-muted-foreground">Manage staff for your hotel</p>
        </div>
        
        {/* Add Staff Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account. They will receive login credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="staff@hotel.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="+234 801 234 5678"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as StaffRole }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="cleaner">Housekeeper</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="admin">Branch Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateStaff}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Staff Member'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Staff</p>
            <p className="text-2xl font-bold text-foreground">{staff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">{staff.filter(s => s.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-destructive">{staff.filter(s => !s.isActive).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Receptionists</p>
            <p className="text-2xl font-bold text-foreground">{staff.filter(s => s.role === 'receptionist').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Housekeepers</p>
            <p className="text-2xl font-bold text-foreground">{staff.filter(s => s.role === 'cleaner').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Waiters</p>
            <p className="text-2xl font-bold text-foreground">{staff.filter(s => s.role === 'waiter').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Managers</p>
            <p className="text-2xl font-bold text-foreground">{staff.filter(s => s.role === 'admin').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((staffMember, index) => {
          const RoleIcon = roleIcons[staffMember.role] || UserCheck;
          
          return (
            <Card 
              key={staffMember._id} 
              className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" 
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <RoleIcon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg text-foreground">
                        {staffMember.firstName} {staffMember.lastName}
                      </h3>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge className={roleColors[staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)] || "bg-secondary text-secondary-foreground"}>
                        {staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}
                      </Badge>
                      <Badge variant={staffMember.isActive ? "default" : "secondary"}>
                        {staffMember.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Switch 
                      checked={staffMember.isActive} 
                      onCheckedChange={() => handleStatusToggleClick(staffMember)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {staffMember.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{staffMember.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{staffMember.phoneNumber || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{staffMember.hotelId || hotelId ? 'Your Hotel' : 'Downtown Branch'}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewDetails(staffMember)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Select 
                    value={staffMember.role}
                    onValueChange={(value) => handleRoleChangeClick(staffMember, value)}
                  >
                    <SelectTrigger className="flex-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="cleaner">Housekeeper</SelectItem>
                      <SelectItem value="waiter">Waiter</SelectItem>
                      <SelectItem value="admin">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ============= VIEW DETAILS DIALOG ============= */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>
              Complete information about this staff member
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              {/* Profile Section */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {selectedStaff.firstName.charAt(0)}{selectedStaff.lastName.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={roleColors[selectedStaff.role.charAt(0).toUpperCase() + selectedStaff.role.slice(1)]}>
                      {selectedStaff.role.charAt(0).toUpperCase() + selectedStaff.role.slice(1)}
                    </Badge>
                    <Badge variant={selectedStaff.isActive ? "default" : "secondary"}>
                      {selectedStaff.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium">{selectedStaff.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{selectedStaff.phoneNumber || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">
                        {selectedStaff.hotelId || hotelId ? 'Your Hotel' : 'Downtown Branch'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase">Account Information</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Staff ID</p>
                    <p className="text-sm font-mono truncate">{selectedStaff._id}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="text-sm font-medium">
                      {selectedStaff.isActive ? (
                        <span className="text-success flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="text-destructive flex items-center gap-1">
                          <UserX className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============= ROLE CHANGE CONFIRMATION DIALOG ============= */}
      <AlertDialog open={roleChangeDialog.isOpen} onOpenChange={(open) => 
        setRoleChangeDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-warning" />
              Confirm Role Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>You are about to change the role for:</p>
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <p className="font-semibold text-foreground">{roleChangeDialog.staffName}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">
                    Current: {roleChangeDialog.currentRole.charAt(0).toUpperCase() + roleChangeDialog.currentRole.slice(1)}
                  </Badge>
                  <span>→</span>
                  <Badge>
                    New: {roleChangeDialog.newRole.charAt(0).toUpperCase() + roleChangeDialog.newRole.slice(1)}
                  </Badge>
                </div>
              </div>
              <p className="text-sm">
                This will update their permissions and access level. Are you sure you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRoleChange}>
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ============= STATUS TOGGLE CONFIRMATION DIALOG ============= */}
      <AlertDialog open={statusToggleDialog.isOpen} onOpenChange={(open) => 
        setStatusToggleDialog(prev => ({ ...prev, isOpen: open }))
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {statusToggleDialog.newStatus ? (
                <UserCheck className="h-5 w-5 text-success" />
              ) : (
                <UserX className="h-5 w-5 text-destructive" />
              )}
              {statusToggleDialog.newStatus ? "Activate Staff Member" : "Deactivate Staff Member"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {statusToggleDialog.newStatus 
                  ? "You are about to activate:" 
                  : "You are about to deactivate:"}
              </p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-semibold text-foreground">{statusToggleDialog.staffName}</p>
              </div>
              {statusToggleDialog.newStatus ? (
                <p className="text-sm">
                  <strong>Activating this account will:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Allow them to log in to the system</li>
                    <li>Restore their access and permissions</li>
                    <li>Enable them to perform their duties</li>
                  </ul>
                </p>
              ) : (
                <p className="text-sm">
                  <strong className="text-destructive">Warning:</strong> Deactivating this account will:
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Immediately block their access to the system</li>
                    <li>Log them out of all active sessions</li>
                    <li>Prevent them from logging in until reactivated</li>
                  </ul>
                </p>
              )}
              <p className="text-sm font-medium">Are you sure you want to continue?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusToggle}
              className={statusToggleDialog.newStatus ? "" : "bg-destructive hover:bg-destructive/90"}
            >
              {statusToggleDialog.newStatus ? "Activate" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}