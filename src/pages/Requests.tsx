import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, MapPin, CheckCircle, XCircle } from "lucide-react";

const requests = [
  { id: 1, title: "Equipment Purchase", branch: "Downtown Branch", manager: "John Smith", amount: 5000, purpose: "New cleaning equipment and supplies", status: "Pending" },
  { id: 2, title: "Staff Training Budget", branch: "Airport Branch", manager: "Maria Garcia", amount: 3000, purpose: "Professional development for reception staff", status: "Approved" },
  { id: 3, title: "Maintenance Request", branch: "Beach Branch", manager: "David Chen", amount: 8000, purpose: "HVAC system upgrade in rooms 201-210", status: "Pending" },
  { id: 4, title: "Marketing Campaign", branch: "City Center", manager: "Sarah Wilson", amount: 4500, purpose: "Local advertising and promotional materials", status: "Rejected" },
];

const statusConfig: Record<string, { color: string; icon: any }> = {
  Pending: { color: "bg-warning text-warning-foreground", icon: FileText },
  Approved: { color: "bg-success text-success-foreground", icon: CheckCircle },
  Rejected: { color: "bg-destructive text-destructive-foreground", icon: XCircle },
};

export default function Requests() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Request Management</h1>
        <p className="text-muted-foreground">Review and manage branch requests</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {requests.map((request, index) => (
          <Card key={request.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{request.title}</h3>
                      <p className="text-sm text-muted-foreground">Requested by {request.manager}</p>
                    </div>
                    <Badge className={statusConfig[request.status].color}>
                      {request.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{request.purpose}</p>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{request.branch}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">${request.amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {request.status === "Pending" && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button size="sm">
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
