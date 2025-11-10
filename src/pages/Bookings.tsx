import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Bed, DollarSign } from "lucide-react";

const bookings = [
  { id: 1, guest: "Alice Cooper", room: "101 - Deluxe", checkIn: "2024-05-15", checkOut: "2024-05-18", amount: 450, status: "Confirmed" },
  { id: 2, guest: "Bob Martin", room: "202 - Deluxe", checkIn: "2024-05-16", checkOut: "2024-05-20", amount: 600, status: "Checked In" },
  { id: 3, guest: "Carol White", room: "301 - Suite", checkIn: "2024-05-17", checkOut: "2024-05-22", amount: 1250, status: "Confirmed" },
  { id: 4, guest: "Dan Lee", room: "302 - Presidential", checkIn: "2024-05-18", checkOut: "2024-05-25", amount: 3500, status: "Pending" },
];

const statusColors: Record<string, string> = {
  Confirmed: "bg-success text-success-foreground",
  "Checked In": "bg-info text-info-foreground",
  Pending: "bg-warning text-warning-foreground",
  Cancelled: "bg-destructive text-destructive-foreground",
};

export default function Bookings() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
        <p className="text-muted-foreground">View and manage all room bookings</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {bookings.map((booking, index) => (
          <Card key={booking.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg text-foreground">{booking.guest}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Bed className="h-4 w-4" />
                      <span>{booking.room}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check In</p>
                      <p className="font-medium text-foreground">{booking.checkIn}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check Out</p>
                      <p className="font-medium text-foreground">{booking.checkOut}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="font-bold text-foreground">${booking.amount}</p>
                    </div>
                  </div>

                  <Badge className={statusColors[booking.status]}>{booking.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
