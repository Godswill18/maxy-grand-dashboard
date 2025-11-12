// src/pages/Cleaners.tsx
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, User, Bed } from "lucide-react";
import { useCleaningStore } from "@/store/useCleaningStore";

const statusConfig: Record<string, { color: string; icon: any }> = {
  completed: { color: "bg-green-200 text-green-800", icon: CheckCircle },
  pending: { color: "bg-yellow-200 text-yellow-800", icon: Clock },
  cleaning: { color: "bg-blue-200 text-blue-800", icon: Clock },
};

export default function Cleaners() {
  const { requests, fetchRequests, isLoading } = useCleaningStore();

  useEffect(() => {
    fetchRequests("cleaner"); // or "admin" depending on role
  }, [fetchRequests]);

  if (isLoading) return <p>Loading cleaning data...</p>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cleaning Management</h1>
        <p className="text-muted-foreground">Live cleaning tasks and status updates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((item, index) => {
          const status = statusConfig[item.status] || statusConfig.pending;
          const Icon = status.icon;
          return (
            <Card key={item._id} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bed className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        Room {item.roomId?.roomNumber}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={status.color}>{item.status}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{item.assignedCleaner?.name || "Unassigned"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
