import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Reservation {
  id: string;
  guestName: string;
  table: number;
  time: string;
  guests: number;
  status: "Upcoming" | "Checked-in" | "Completed";
  phone: string;
}

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "RES-001",
      guestName: "John Doe",
      table: 5,
      time: "6:00 PM",
      guests: 4,
      status: "Upcoming",
      phone: "+234 801 234 5678",
    },
    {
      id: "RES-002",
      guestName: "Sarah Smith",
      table: 3,
      time: "6:30 PM",
      guests: 2,
      status: "Checked-in",
      phone: "+234 802 345 6789",
    },
    {
      id: "RES-003",
      guestName: "Mike Johnson",
      table: 8,
      time: "7:00 PM",
      guests: 6,
      status: "Upcoming",
      phone: "+234 803 456 7890",
    },
    {
      id: "RES-004",
      guestName: "Emma Wilson",
      table: 2,
      time: "5:30 PM",
      guests: 2,
      status: "Completed",
      phone: "+234 804 567 8901",
    },
    {
      id: "RES-005",
      guestName: "David Brown",
      table: 6,
      time: "7:30 PM",
      guests: 4,
      status: "Upcoming",
      phone: "+234 805 678 9012",
    },
  ]);

  const updateStatus = (id: string, newStatus: Reservation["status"]) => {
    setReservations(reservations.map(res =>
      res.id === id ? { ...res, status: newStatus } : res
    ));
    toast.success(`Reservation ${id} marked as ${newStatus}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Upcoming": return "bg-info/10 text-info hover:bg-info/20";
      case "Checked-in": return "bg-success/10 text-success hover:bg-success/20";
      case "Completed": return "bg-muted text-muted-foreground";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Reservations</p>
            <p className="text-3xl font-bold">{reservations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Upcoming</p>
            <p className="text-3xl font-bold text-info">
              {reservations.filter(r => r.status === "Upcoming").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Checked-in</p>
            <p className="text-3xl font-bold text-success">
              {reservations.filter(r => r.status === "Checked-in").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reservations.map((reservation) => (
          <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{reservation.id}</CardTitle>
                <Badge className={getStatusColor(reservation.status)}>
                  {reservation.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{reservation.guestName}</p>
                    <p className="text-sm text-muted-foreground">{reservation.phone}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Table {reservation.table}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{reservation.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-secondary/10 rounded-md">
                  <Users className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium">{reservation.guests} Guests</span>
                </div>
              </div>

              <div className="flex gap-2">
                {reservation.status === "Upcoming" && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => updateStatus(reservation.id, "Checked-in")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Check In
                  </Button>
                )}
                {reservation.status === "Checked-in" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => updateStatus(reservation.id, "Completed")}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
