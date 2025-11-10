import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BedDouble, Users, DollarSign, Wifi, Coffee, Tv, Search } from "lucide-react";
import { toast } from "sonner";

interface Room {
  number: string;
  floor: number;
  type: "Standard" | "Deluxe" | "Suite" | "Presidential";
  status: "Available" | "Occupied" | "Reserved" | "Maintenance";
  guest?: string;
  bookingId?: string;
  price: number;
  capacity: number;
  amenities: string[];
}

export default function RoomAssignment() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [rooms, setRooms] = useState<Room[]>([
    {
      number: "101",
      floor: 1,
      type: "Standard",
      status: "Available",
      price: 25000,
      capacity: 2,
      amenities: ["Wifi", "TV", "AC"]
    },
    {
      number: "102",
      floor: 1,
      type: "Standard",
      status: "Occupied",
      guest: "John Doe",
      bookingId: "BK-1001",
      price: 25000,
      capacity: 2,
      amenities: ["Wifi", "TV", "AC"]
    },
    {
      number: "201",
      floor: 2,
      type: "Deluxe",
      status: "Reserved",
      guest: "Sarah Johnson",
      bookingId: "BK-1005",
      price: 45000,
      capacity: 3,
      amenities: ["Wifi", "TV", "AC", "Mini Bar"]
    },
    {
      number: "202",
      floor: 2,
      type: "Deluxe",
      status: "Available",
      price: 45000,
      capacity: 3,
      amenities: ["Wifi", "TV", "AC", "Mini Bar"]
    },
    {
      number: "301",
      floor: 3,
      type: "Suite",
      status: "Occupied",
      guest: "Mike Wilson",
      bookingId: "BK-1008",
      price: 85000,
      capacity: 4,
      amenities: ["Wifi", "TV", "AC", "Mini Bar", "Jacuzzi"]
    },
    {
      number: "302",
      floor: 3,
      type: "Suite",
      status: "Maintenance",
      price: 85000,
      capacity: 4,
      amenities: ["Wifi", "TV", "AC", "Mini Bar", "Jacuzzi"]
    },
    {
      number: "401",
      floor: 4,
      type: "Presidential",
      status: "Available",
      price: 150000,
      capacity: 6,
      amenities: ["Wifi", "TV", "AC", "Mini Bar", "Jacuzzi", "Butler Service"]
    },
  ]);

  const assignRoom = (roomNumber: string, guestName: string, bookingId: string) => {
    setRooms(rooms.map(room =>
      room.number === roomNumber
        ? { ...room, status: "Occupied" as const, guest: guestName, bookingId }
        : room
    ));
    toast.success(`Room ${roomNumber} assigned to ${guestName}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Available": return "bg-success/10 text-success hover:bg-success/20";
      case "Occupied": return "bg-error/10 text-error hover:bg-error/20";
      case "Reserved": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Maintenance": return "bg-muted text-muted-foreground hover:bg-muted";
      default: return "";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Standard": return "bg-info/10 text-info";
      case "Deluxe": return "bg-primary/10 text-primary";
      case "Suite": return "bg-warning/10 text-warning";
      case "Presidential": return "bg-error/10 text-error";
      default: return "";
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.includes(searchQuery) ||
                         room.guest?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         room.bookingId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || room.type === filterType;
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    available: rooms.filter(r => r.status === "Available").length,
    occupied: rooms.filter(r => r.status === "Occupied").length,
    reserved: rooms.filter(r => r.status === "Reserved").length,
    maintenance: rooms.filter(r => r.status === "Maintenance").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Room Assignment</h1>
        <p className="text-muted-foreground">Manage room availability and guest assignments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available</p>
            <p className="text-3xl font-bold text-success">{stats.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="text-3xl font-bold text-error">{stats.occupied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Reserved</p>
            <p className="text-3xl font-bold text-warning">{stats.reserved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Maintenance</p>
            <p className="text-3xl font-bold text-muted-foreground">{stats.maintenance}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room, guest, or booking ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Deluxe">Deluxe</SelectItem>
            <SelectItem value="Suite">Suite</SelectItem>
            <SelectItem value="Presidential">Presidential</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Reserved">Reserved</SelectItem>
            <SelectItem value="Maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <Card key={room.number} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room {room.number}</CardTitle>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center p-6 bg-primary/5 rounded-lg">
                <BedDouble className="h-16 w-16 text-primary" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge className={getTypeColor(room.type)}>
                    {room.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Floor:</span>
                  <span className="font-medium">{room.floor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{room.capacity} guests</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price/Night:</span>
                  <span className="font-bold text-primary">₦{room.price.toLocaleString()}</span>
                </div>
              </div>

              {room.guest && (
                <div className="p-3 bg-info/10 rounded-md">
                  <p className="text-sm font-medium">Guest: {room.guest}</p>
                  <p className="text-xs text-muted-foreground">Booking: {room.bookingId}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {room.amenities.map((amenity, index) => (
                  <span key={index} className="text-xs px-2 py-1 bg-muted rounded-full">
                    {amenity}
                  </span>
                ))}
              </div>

              {room.status === "Available" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" className="w-full">
                      Assign Room
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Room {room.number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Guest Name</Label>
                        <Input id="guestName" placeholder="Enter guest name" />
                      </div>
                      <div>
                        <Label>Booking ID</Label>
                        <Input id="bookingId" placeholder="Enter booking ID" />
                      </div>
                      <div>
                        <Label>Number of Guests</Label>
                        <Input type="number" placeholder="1" max={room.capacity} />
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => {
                          const guestName = (document.getElementById("guestName") as HTMLInputElement)?.value;
                          const bookingId = (document.getElementById("bookingId") as HTMLInputElement)?.value;
                          if (guestName && bookingId) {
                            assignRoom(room.number, guestName, bookingId);
                          }
                        }}
                      >
                        Confirm Assignment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
