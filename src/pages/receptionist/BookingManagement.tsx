import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Search, User, Phone, Mail, BedDouble } from "lucide-react";
import { toast } from "sonner";

interface Booking {
  id: string;
  guestName: string;
  email: string;
  phone: string;
  roomType: string;
  roomNumber?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: "Confirmed" | "Pending" | "Cancelled" | "Completed";
  bookingDate: string;
  specialRequests?: string;
}

export default function BookingManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "BK-1001",
      guestName: "John Doe",
      email: "john.doe@email.com",
      phone: "+234 801 234 5678",
      roomType: "Deluxe",
      roomNumber: "205",
      checkIn: "Dec 22, 2024",
      checkOut: "Dec 25, 2024",
      guests: 2,
      totalAmount: 135000,
      status: "Confirmed",
      bookingDate: "Dec 15, 2024",
      specialRequests: "Non-smoking room"
    },
    {
      id: "BK-1002",
      guestName: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+234 802 345 6789",
      roomType: "Suite",
      checkIn: "Dec 23, 2024",
      checkOut: "Dec 26, 2024",
      guests: 3,
      totalAmount: 255000,
      status: "Pending",
      bookingDate: "Dec 18, 2024"
    },
    {
      id: "BK-1003",
      guestName: "Mike Wilson",
      email: "mike.w@email.com",
      phone: "+234 803 456 7890",
      roomType: "Standard",
      roomNumber: "102",
      checkIn: "Dec 20, 2024",
      checkOut: "Dec 22, 2024",
      guests: 1,
      totalAmount: 50000,
      status: "Completed",
      bookingDate: "Dec 10, 2024"
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed": return "bg-success/10 text-success hover:bg-success/20";
      case "Pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Cancelled": return "bg-error/10 text-error hover:bg-error/20";
      case "Completed": return "bg-info/10 text-info hover:bg-info/20";
      default: return "";
    }
  };

  const cancelBooking = (bookingId: string) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: "Cancelled" as const } : booking
    ));
    toast.success(`Booking ${bookingId} cancelled`);
  };

  const confirmBooking = (bookingId: string) => {
    setBookings(bookings.map(booking =>
      booking.id === bookingId ? { ...booking, status: "Confirmed" as const } : booking
    ));
    toast.success(`Booking ${bookingId} confirmed`);
  };

  const filteredBookings = bookings.filter(booking =>
    booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmed = filteredBookings.filter(b => b.status === "Confirmed");
  const pending = filteredBookings.filter(b => b.status === "Pending");
  const cancelled = filteredBookings.filter(b => b.status === "Cancelled");
  const completed = filteredBookings.filter(b => b.status === "Completed");

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{booking.guestName}</CardTitle>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{booking.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{booking.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span>{booking.roomType} {booking.roomNumber ? `- Room ${booking.roomNumber}` : ""}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{booking.checkIn} - {booking.checkOut}</span>
          </div>
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Guests:</span>
            <span className="font-medium">{booking.guests}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-bold text-primary">₦{booking.totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Booking ID:</span>
            <span className="font-medium">{booking.id}</span>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="p-2 bg-info/10 rounded-md">
            <p className="text-xs text-info"><strong>Special Requests:</strong> {booking.specialRequests}</p>
          </div>
        )}

        <div className="flex gap-2">
          {booking.status === "Pending" && (
            <>
              <Button size="sm" className="flex-1" onClick={() => confirmBooking(booking.id)}>
                Confirm
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => cancelBooking(booking.id)}>
                Cancel
              </Button>
            </>
          )}
          {booking.status === "Confirmed" && (
            <Button size="sm" variant="outline" className="flex-1" onClick={() => cancelBooking(booking.id)}>
              Cancel Booking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">Manage hotel reservations and bookings</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <Input placeholder="John Doe" />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input placeholder="+234 801 234 5678" />
                </div>
              </div>
              <div>
                <Label>Email Address</Label>
                <Input type="email" placeholder="guest@email.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Date</Label>
                  <Input type="date" />
                </div>
                <div>
                  <Label>Check-out Date</Label>
                  <Input type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="presidential">Presidential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Guests</Label>
                  <Input type="number" placeholder="2" />
                </div>
              </div>
              <div>
                <Label>Special Requests</Label>
                <Input placeholder="Any special requirements..." />
              </div>
              <Button className="w-full" onClick={() => toast.success("Booking created successfully")}>
                Create Booking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-3xl font-bold">{bookings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Confirmed</p>
            <p className="text-3xl font-bold text-success">{confirmed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-warning">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-info">{completed.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by guest name, booking ID, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredBookings.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {confirmed.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cancelled.map(booking => <BookingCard key={booking.id} booking={booking} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
