import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Plus } from "lucide-react";

const staffMembers = [
  { id: 1, name: "Sarah Johnson", role: "Receptionist", email: "sarah.j@maxygrand.com", phone: "+1 234 567 8902", shift: "Morning", active: true },
  { id: 2, name: "Michael Brown", role: "Cleaner", email: "michael.b@maxygrand.com", phone: "+1 234 567 8903", shift: "Evening", active: true },
  { id: 3, name: "Emily Davis", role: "Waiter", email: "emily.d@maxygrand.com", phone: "+1 234 567 8904", shift: "Morning", active: true },
  { id: 4, name: "Robert Taylor", role: "Waiter", email: "robert.t@maxygrand.com", phone: "+1 234 567 8907", shift: "Evening", active: true },
  { id: 5, name: "Jessica Lee", role: "Cleaner", email: "jessica.l@maxygrand.com", phone: "+1 234 567 8908", shift: "Morning", active: false },
  { id: 6, name: "Daniel Martinez", role: "Receptionist", email: "daniel.m@maxygrand.com", phone: "+1 234 567 8909", shift: "Night", active: true },
];

const roleColors: Record<string, string> = {
  Receptionist: "bg-secondary text-secondary-foreground",
  Cleaner: "bg-info text-info-foreground",
  Waiter: "bg-warning text-warning-foreground",
};

export default function StaffManagement() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff for Downtown Branch</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Staff</p>
            <p className="text-2xl font-bold text-foreground">6</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Receptionists</p>
            <p className="text-2xl font-bold text-foreground">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cleaners</p>
            <p className="text-2xl font-bold text-foreground">2</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Waiters</p>
            <p className="text-2xl font-bold text-foreground">2</p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffMembers.map((staff, index) => (
          <Card key={staff.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{staff.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={roleColors[staff.role]}>{staff.role}</Badge>
                    <Badge variant="outline">{staff.shift}</Badge>
                  </div>
                </div>
                <Switch checked={staff.active} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{staff.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{staff.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Downtown Branch</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
