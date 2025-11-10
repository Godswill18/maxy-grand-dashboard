import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, User, Bed } from "lucide-react";

const cleaningHistory = [
  { id: 1, room: "101", cleaner: "Michael Brown", date: "2024-05-14", time: "10:30 AM", status: "Completed" },
  { id: 2, room: "202", cleaner: "Lisa Anderson", date: "2024-05-14", time: "11:00 AM", status: "Completed" },
  { id: 3, room: "301", cleaner: "Michael Brown", date: "2024-05-14", time: "02:15 PM", status: "Completed" },
  { id: 4, room: "102", cleaner: "Lisa Anderson", date: "2024-05-14", time: "03:30 PM", status: "In Progress" },
  { id: 5, room: "201", cleaner: "James Wilson", date: "2024-05-14", time: "-", status: "Pending" },
  { id: 6, room: "302", cleaner: "James Wilson", date: "2024-05-14", time: "-", status: "Pending" },
];

const statusConfig: Record<string, { color: string; icon: any }> = {
  Completed: { color: "bg-success text-success-foreground", icon: CheckCircle },
  "In Progress": { color: "bg-info text-info-foreground", icon: Clock },
  Pending: { color: "bg-warning text-warning-foreground", icon: Clock },
};

export default function Cleaners() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Cleaning Management</h1>
        <p className="text-muted-foreground">Track room cleaning history and assignments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cleaningHistory.map((item, index) => (
          <Card key={item.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bed className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Room {item.room}</h3>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <Badge className={statusConfig[item.status].color}>{item.status}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{item.cleaner}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{item.time}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
