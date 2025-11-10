import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, DollarSign, Clock, CheckCircle, XCircle, Plus } from "lucide-react";

const requests = [
  { id: 1, title: "Equipment Purchase", amount: 5000, purpose: "New cleaning equipment and supplies", status: "Pending", date: "2024-06-15" },
  { id: 2, title: "Staff Training Budget", amount: 3000, purpose: "Professional development for reception staff", status: "Approved", date: "2024-06-10" },
  { id: 3, title: "Maintenance Request", amount: 8000, purpose: "HVAC system upgrade in rooms 201-210", status: "Pending", date: "2024-06-12" },
  { id: 4, title: "Marketing Materials", amount: 2500, purpose: "Promotional materials and local advertising", status: "Rejected", date: "2024-06-08" },
  { id: 5, title: "Furniture Replacement", amount: 6500, purpose: "Replace worn furniture in 5 guest rooms", status: "Approved", date: "2024-06-05" },
];

const statusConfig: Record<string, { color: string; icon: any }> = {
  Pending: { color: "bg-warning text-warning-foreground", icon: Clock },
  Approved: { color: "bg-success text-success-foreground", icon: CheckCircle },
  Rejected: { color: "bg-destructive text-destructive-foreground", icon: XCircle },
};

export default function ManagerRequests() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Requests Management</h1>
          <p className="text-muted-foreground">Create and track branch requests</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title</Label>
                <Input id="title" placeholder="e.g., Equipment Purchase" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input id="amount" type="number" placeholder="5000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea id="purpose" placeholder="Describe the purpose of this request..." rows={4} />
              </div>
              <Button className="w-full">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{requests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter(r => r.status === "Pending").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">
                  {requests.filter(r => r.status === "Approved").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-foreground">
                  ₦{requests.filter(r => r.status === "Pending").reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 gap-4">
        {requests.map((request, index) => (
          <Card key={request.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{request.title}</h3>
                      <p className="text-sm text-muted-foreground">Submitted on {new Date(request.date).toLocaleDateString()}</p>
                    </div>
                    <Badge className={statusConfig[request.status].color}>
                      {request.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{request.purpose}</p>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">₦{request.amount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {request.status === "Pending" && (
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
