import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, LogOut, Search, Phone, Mail, Calendar, BedDouble } from "lucide-react";
import { toast } from "sonner";

interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  bookingId: string;
  room: string;
  checkInDate: string;
  checkOutDate: string;
  status: "Pending Check-in" | "Checked In" | "Checked Out";
  guests: number;
  specialRequests?: string;
}

export default function CheckInOut() {
  const [searchQuery, setSearchQuery] = useState("");
  const [guests, setGuests] = useState<Guest[]>([
    {
      id: "G001",
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+234 801 234 5678",
      bookingId: "BK-1001",
      room: "205",
      checkInDate: "Today 2:00 PM",
      checkOutDate: "Dec 25, 2:00 PM",
      status: "Pending Check-in",
      guests: 2,
      specialRequests: "Non-smoking room"
    },
    {
      id: "G002",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+234 802 345 6789",
      bookingId: "BK-1002",
      room: "312",
      checkInDate: "Today 12:00 PM",
      checkOutDate: "Dec 26, 12:00 PM",
      status: "Checked In",
      guests: 1
    },
    {
      id: "G003",
      name: "Emma Davis",
      email: "emma.davis@email.com",
      phone: "+234 803 456 7890",
      bookingId: "BK-1003",
      room: "401",
      checkInDate: "Dec 20, 3:00 PM",
      checkOutDate: "Today 11:00 AM",
      status: "Checked In",
      guests: 3,
      specialRequests: "Extra pillows"
    },
  ]);

  const handleCheckIn = (guestId: string) => {
    setGuests(guests.map(guest =>
      guest.id === guestId ? { ...guest, status: "Checked In" as const } : guest
    ));
    toast.success("Guest checked in successfully");
  };

  const handleCheckOut = (guestId: string) => {
    setGuests(guests.map(guest =>
      guest.id === guestId ? { ...guest, status: "Checked Out" as const } : guest
    ));
    toast.success("Guest checked out successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Check-in": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Checked In": return "bg-success/10 text-success hover:bg-success/20";
      case "Checked Out": return "bg-info/10 text-info hover:bg-info/20";
      default: return "";
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.room.includes(searchQuery)
  );

  const pendingCheckIns = filteredGuests.filter(g => g.status === "Pending Check-in");
  const checkedIn = filteredGuests.filter(g => g.status === "Checked In");
  const checkedOut = filteredGuests.filter(g => g.status === "Checked Out");

  const GuestCard = ({ guest }: { guest: Guest }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{guest.name}</CardTitle>
          <Badge className={getStatusColor(guest.status)}>
            {guest.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span>Room {guest.room}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{guest.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{guest.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{guest.checkInDate} - {guest.checkOutDate}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-muted-foreground">Booking ID:</span>
            <span className="font-medium">{guest.bookingId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Guests:</span>
            <span className="font-medium">{guest.guests}</span>
          </div>
          {guest.specialRequests && (
            <div className="p-2 bg-info/10 rounded-md">
              <p className="text-xs text-info"><strong>Note:</strong> {guest.specialRequests}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {guest.status === "Pending Check-in" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Check-in Guest</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Guest Name</Label>
                    <Input value={guest.name} disabled />
                  </div>
                  <div>
                    <Label>Room Number</Label>
                    <Input value={guest.room} disabled />
                  </div>
                  <div>
                    <Label>ID Verification</Label>
                    <Input placeholder="ID Number" />
                  </div>
                  <div>
                    <Label>Payment Method</Label>
                    <Input placeholder="Card/Cash" />
                  </div>
                  <Button className="w-full" onClick={() => handleCheckIn(guest.id)}>
                    Confirm Check-in
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {guest.status === "Checked In" && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="flex-1">
                  <LogOut className="h-4 w-4 mr-2" />
                  Check Out
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Check-out Guest</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Guest Name</Label>
                    <Input value={guest.name} disabled />
                  </div>
                  <div>
                    <Label>Room Number</Label>
                    <Input value={guest.room} disabled />
                  </div>
                  <div>
                    <Label>Additional Charges</Label>
                    <Input placeholder="₦0.00" />
                  </div>
                  <div>
                    <Label>Payment Status</Label>
                    <Input placeholder="Paid/Pending" />
                  </div>
                  <Button className="w-full" onClick={() => handleCheckOut(guest.id)}>
                    Confirm Check-out
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Check-In / Check-Out</h1>
        <p className="text-muted-foreground">Manage guest arrivals and departures</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Check-ins</p>
            <p className="text-3xl font-bold text-warning">{pendingCheckIns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Currently Checked In</p>
            <p className="text-3xl font-bold text-success">{checkedIn.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Checked Out Today</p>
            <p className="text-3xl font-bold text-info">{checkedOut.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, booking ID, or room number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredGuests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Check-in ({pendingCheckIns.length})</TabsTrigger>
          <TabsTrigger value="checkedin">Checked In ({checkedIn.length})</TabsTrigger>
          <TabsTrigger value="checkedout">Checked Out ({checkedOut.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGuests.map(guest => <GuestCard key={guest.id} guest={guest} />)}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingCheckIns.map(guest => <GuestCard key={guest.id} guest={guest} />)}
          </div>
        </TabsContent>

        <TabsContent value="checkedin" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {checkedIn.map(guest => <GuestCard key={guest.id} guest={guest} />)}
          </div>
        </TabsContent>

        <TabsContent value="checkedout" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {checkedOut.map(guest => <GuestCard key={guest.id} guest={guest} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
