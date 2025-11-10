import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, DollarSign, MapPin } from "lucide-react";

const rooms = [
  { id: 1, number: "101", type: "Deluxe", price: 150, branch: "Downtown Branch", status: "Available", image: "🏨" },
  { id: 2, number: "102", type: "Suite", price: 250, branch: "Downtown Branch", status: "Occupied", image: "🏨" },
  { id: 3, number: "201", type: "Standard", price: 100, branch: "Airport Branch", status: "Available", image: "🏨" },
  { id: 4, number: "202", type: "Deluxe", price: 150, branch: "Airport Branch", status: "Booked", image: "🏨" },
  { id: 5, number: "301", type: "Suite", price: 250, branch: "Beach Branch", status: "Available", image: "🏨" },
  { id: 6, number: "302", type: "Presidential", price: 500, branch: "Beach Branch", status: "Available", image: "🏨" },
];

const statusColors: Record<string, string> = {
  Available: "bg-success text-success-foreground",
  Occupied: "bg-destructive text-destructive-foreground",
  Booked: "bg-warning text-warning-foreground",
  Inactive: "bg-muted text-muted-foreground",
};

export default function Rooms() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground">Manage all rooms across branches</p>
        </div>
        <Button>Add New Room</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room, index) => (
          <Card key={room.id} className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" style={{ animationDelay: `${index * 50}ms` }}>
            <CardContent className="p-6">
              <div className="text-6xl text-center mb-4">{room.image}</div>
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-xl text-foreground">Room {room.number}</h3>
                  <p className="text-sm text-muted-foreground">{room.type}</p>
                </div>
                <Badge className={statusColors[room.status]}>{room.status}</Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold text-foreground">${room.price}/night</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{room.branch}</span>
                </div>
              </div>

              <Button variant="outline" className="w-full">View Details</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
