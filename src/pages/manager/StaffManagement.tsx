import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Plus, Users } from "lucide-react";
// Import the new store and interfaces
import { useStaffStore } from "@/store/useStaffStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner"; // Assuming you use sonner for notifications

// Define StaffRole to match the store's type
type StaffRole = 'receptionist' | 'cleaner' | 'waiter' | 'admin';

const roleColors: Record<string, string> = {
  Receptionist: "bg-secondary text-secondary-foreground",
  Cleaner: "bg-info text-info-foreground",
  Waiter: "bg-warning text-warning-foreground",
  Admin: "bg-primary text-primary-foreground",
};

export default function StaffManagement() {
  // 1. FIX: Destructure the new store action `fetchStaffByLoggedInUserHotel` and `createStaff`
  const { 
    staff, 
    isLoading, 
    fetchStaffByLoggedInUserHotel, // The new action
    updateStaffStatus, 
    updateStaffRole, 
    createStaff // The action for creating new staff
  } = useStaffStore();
  
  const { user } = useAuthStore();
  const hotelId = user?.hotelId; // Assuming user has hotelId
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // To disable button during creation
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "receptionist" as StaffRole, // Use the defined StaffRole type
  });


  useEffect(() => {
    if (hotelId) {
      fetchStaffByLoggedInUserHotel();
    }
  }, [hotelId]);


  const handleStatusToggle = (staffId: string, currentActive: boolean) => {
    updateStaffStatus(staffId, !currentActive);
  };

  const handleRoleChange = (staffId: string, newRole: string) => {
    // Ensure the role is correctly typed and lowercased before calling the store
    updateStaffRole(staffId, newRole.toLowerCase() as StaffRole);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 3. FIX: Uncomment and implement the staff creation logic
  const handleCreateStaff = async () => {
    // Simple client-side validation check
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields (Name, Email, Password).");
      return;
    }
    
    setIsCreating(true);
    try {
      // The store handles the API call, error toast, and state update
      const newStaff = await createStaff(formData);
      
      if (newStaff) {
         // Reset form and close dialog only on success
         setIsDialogOpen(false);
         setFormData({
             firstName: "",
             lastName: "",
             email: "",
             phoneNumber: "",
             password: "",
             role: "receptionist",
         });
      }
    } finally {
      setIsCreating(false);
    }
  };

  // --- Render Logic (Unchanged Skeleton/Stats/Grid) ---

  if (isLoading) {
    // ... (Skeleton remains unchanged)
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management 🧑‍💼</h1>
          <p className="text-muted-foreground">Manage staff for **{user?.hotelId ? 'your hotel' : 'Downtown Branch'}**</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            {/* 4. FIX: Uncomment Add Staff button */}
            <Button disabled={isCreating}>
              <Plus className="h-4 w-4 mr-2" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
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
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Password</Label>
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
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as StaffRole }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="cleaner">Cleaner</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* 5. FIX: Uncomment Create Staff button and connect handleCreateStaff */}
              <Button 
                className="w-full" 
                onClick={handleCreateStaff}
                disabled={isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Staff'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold text-foreground">{staff.filter(s => s.role === 'admin').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staff.map((staffMember, index) => (
          <Card key={staffMember._id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{staffMember.firstName} {staffMember.lastName}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={roleColors[staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)] || "bg-secondary text-secondary-foreground"}>
                      {staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}
                    </Badge>
                  </div>
                </div>
                <Switch 
                  checked={staffMember.isActive} 
                  onCheckedChange={() => handleStatusToggle(staffMember._id, staffMember.isActive)}
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
                  <span>{staffMember.hotelId || hotelId ? 'Your Hotel' : 'Downtown Branch'}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Select onValueChange={(value) => handleRoleChange(staffMember._id, value)}>
                  <SelectTrigger className="w-full h-9">
                    {/* Display the current role in the trigger */}
                    <SelectValue placeholder={`Role: ${staffMember.role.charAt(0).toUpperCase() + staffMember.role.slice(1)}`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="cleaner">Cleaner</SelectItem>
                    <SelectItem value="waiter">Waiter</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}