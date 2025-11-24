import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserCheck, LogOut, Search, Phone, Mail, Calendar, BedDouble, Clock } from "lucide-react";
// --- FIX: Updated import path from aliased to relative ---
import { useCheckInStore, Guest } from "../../store/useCheckInStore"; // Import from new store
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import BookGuestForm from "@/components/BookGuestForm";
import { toast } from "sonner"; // Added import for toast in onConfirm

// Helper to format time (e.g., 9 -> "09")
const formatTime = (time: number) => time.toString().padStart(2, '0');

/**
 * A component that displays a countdown timer to a specific checkout date.
 * Checkout time is always 12:00 PM (noon).
 */
const CheckoutTimer = ({ checkOutIsoDate }: { checkOutIsoDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!checkOutIsoDate) return;

    // --- This is the key logic ---
    // 1. Get the check-out date from the prop
    const targetDate = new Date(checkOutIsoDate);
    // 2. Set the *actual* checkout time to 12:00 PM (noon) on that day
    targetDate.setHours(12, 0, 0, 0); 
    // --- End of key logic ---

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        // Time is up
        setIsOverdue(true);
        // Calculate *how long* it's overdue
        const overdueDistance = Math.abs(distance);
        setTimeLeft({
          days: Math.floor(overdueDistance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((overdueDistance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((overdueDistance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: 0, // No need for seconds on overdue
        });
      } else {
        // Time is remaining
        setIsOverdue(false);
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(timer);
  }, [checkOutIsoDate]);

  const { days, hours, minutes, seconds } = timeLeft;
  // Set color to red if overdue, green if not
  const timerColor = isOverdue ? "text-destructive" : "text-success";

  return (
    <div className={`flex items-center gap-2 p-2 rounded-md ${isOverdue ? 'bg-destructive/10' : 'bg-success/10'}`}>
      <Clock className={`h-4 w-4 ${timerColor}`} />
      <span className={`text-sm font-medium ${timerColor}`}>
        {isOverdue
          ? `Checkout Overdue by: ${days}d ${hours}h ${minutes}m`
          : `Checkout in: ${days}d ${formatTime(hours)}h ${formatTime(minutes)}m ${formatTime(seconds)}s`}
      </span>
    </div>
  );
};

// GuestCard Component
// Moved logic into its own component to handle dialog state
const GuestCard = ({ guest }: { guest: Guest }) => {
  const { checkInWithRegistration, checkOutGuest } = useCheckInStore();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Check-in": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Checked In": return "bg-success/10 text-success hover:bg-success/20";
      case "Checked Out": return "bg-info/10 text-info hover:bg-info/20";
      default: return "";
    }
  };
  

 const handleCheckInConfirm = async (formData: any) => {
    await checkInWithRegistration(guest.id, formData);
    setIsCheckInOpen(false);
  };

  const handleCheckOut = async () => {
    await checkOutGuest(guest.id);
    setIsCheckOutOpen(false); // Close dialog
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          {/* {console.log(guest)} */}
          <CardTitle className="text-lg">{guest.name}</CardTitle>
          <Badge className={getStatusColor(guest.status)}>
            {guest.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Only show the timer if the guest is "Checked In" and we have the date */}
        {guest.status === "Checked In" && guest.rawCheckOutDate && (
          <CheckoutTimer checkOutIsoDate={guest.rawCheckOutDate} />
        )}
        
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
            <Dialog open={isCheckInOpen} onOpenChange={setIsCheckInOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Check In
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Check-in Guest: {guest.name}</DialogTitle>
                </DialogHeader>
                <BookGuestForm 
                  guestName={guest.name}
                  bookingId={guest.id}
                  initialEmail={guest.email}
                  initialPhone={guest.phone}
                  onConfirm={handleCheckInConfirm}
                  onCancel={() => setIsCheckInOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
          {guest.status === "Checked In" && (
            <Dialog open={isCheckOutOpen} onOpenChange={setIsCheckOutOpen}>
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
                  <Button className="w-full" onClick={handleCheckOut}>
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
};

// Loading Skeleton Card Component
const GuestCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-3/5" />
        <Skeleton className="h-6 w-1/4" />
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

export default function CheckInOut() {
  const [searchQuery, setSearchQuery] = useState("");
  // Get all state and actions from the Zustand store
  const { guests, loading, error, fetchGuests, createBooking } = useCheckInStore();
  const [openForm, setOpenForm] = useState(false);


  // Fetch guests on component mount
  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guest.room.includes(searchQuery)
  );

  const pendingCheckIns = filteredGuests.filter(g => g.status === "Pending Check-in");
  const checkedIn = filteredGuests.filter(g => g.status === "Checked In");
  const checkedOut = filteredGuests.filter(g => g.status === "Checked Out");

  // Handler for booking confirmation (for new guests)
  const handleBookConfirm = async (formData: any) => {
    try {
      await createBooking(formData);
      setOpenForm(false);
      // Refetch to update the list
      fetchGuests();
    } catch (err) {
      toast.error("Failed to book guest.");
    }
  };

  const handleBookCancel = () => {
    setOpenForm(false);
  };

  return (
    <div className="space-y-6">
     

      <div className="flex items-center justify-between">
  <div>
    <h1 className="text-3xl font-bold">Check-In / Check-Out</h1>
    <p className="text-muted-foreground">Manage guest arrivals and departures</p>
  </div>

  <Dialog open={openForm} onOpenChange={setOpenForm}>
    <DialogTrigger asChild>
      <Button className="bg-primary text-white">
        Book Guest
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle>Book New Guest</DialogTitle>
      </DialogHeader>
      <BookGuestForm 
        guestName="" 
        bookingId="" 
        onConfirm={handleBookConfirm} 
        onCancel={handleBookCancel} 
      />
    </DialogContent>
  </Dialog>
</div>


      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Check-ins</p>
            <p className="text-3xl font-bold text-warning">{loading ? "-" : pendingCheckIns.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Currently Checked In</p>
            <p className="text-3xl font-bold text-success">{loading ? "-" : checkedIn.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Checked Out Today</p>
            <p className="text-3xl font-bold text-info">{loading ? "-" : checkedOut.length}</p>
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

      {/* Handle Error State */}
      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">
          <p><strong>Error:</strong> {error}</p>
        </div>
      )}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({loading ? "..." : filteredGuests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Check-in ({loading ? "..." : pendingCheckIns.length})</TabsTrigger>
          <TabsTrigger value="checkedin">Checked In ({loading ? "..." : checkedIn.length})</TabsTrigger>
          <TabsTrigger value="checkedout">Checked Out ({loading ? "..." : checkedOut.length})</TabsTrigger>
        </TabsList>

        {/* Handle Loading State */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <GuestCardSkeleton />
            <GuestCardSkeleton />
            <GuestCardSkeleton />
          </div>
        ) : (
          <>
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
          </>
        )}
      </Tabs>
    </div>
  );
}