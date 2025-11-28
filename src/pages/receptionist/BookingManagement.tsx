import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Plus, Search, Phone, Mail, BedDouble, Edit, X } from "lucide-react";
import { toast } from "sonner";
import { useBookingStore } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import BookingManagementSkeleton from "../../components/skeleton/BookingManagementSkeleton";

interface BookingFormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  roomId: string;
  guests: number;
  totalAmount: number;
  specialRequests?: string;
}

export default function BookingManagement() {
  const { bookings, isLoading, fetchBookings, createBooking, updateBooking, cancelBooking } = useBookingStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    checkInDate: "",
    checkOutDate: "",
    roomId: "",
    guests: 1,
    totalAmount: 0,
    specialRequests: "",
  });
  const [availableRooms, setAvailableRooms] = useState<{ id: string; number: string; type: string }[]>([]);

  useEffect(() => {
    if (user?.hotelId) {
      fetchBookings();
    }
    // Mock available rooms - in real app, fetch from /api/rooms/available
    setAvailableRooms([
      { id: "room1", number: "101", type: "Standard" },
      { id: "room2", number: "102", type: "Deluxe" },
      { id: "room3", number: "201", type: "Suite" },
    ]);
  }, [user?.hotelId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/10 text-success hover:bg-success/20";
      case "pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "cancelled": return "bg-error/10 text-error hover:bg-error/20";
      case "checked-out": return "bg-info/10 text-info hover:bg-info/20";
      default: return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.hotelId) {
      toast.error("Hotel ID not found. Please log in again.");
      return;
    }

    try {
      if (isEditMode && editingBookingId) {
        // Update existing booking
        await updateBooking(editingBookingId, {
          ...formData,
          hotelId: user.hotelId,
        });
        toast.success("Booking updated successfully!");
      } else {
        // Create new booking
        await createBooking({
          ...formData,
          hotelId: user.hotelId,
          bookingType: "in-person",
          amountPaid: 0,
          paymentStatus: "pending",
          bookingStatus: "confirmed",
        });
        toast.success("Booking created successfully!");
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(isEditMode ? "Failed to update booking." : "Failed to create booking.");
    }
  };

  const handleEdit = (booking: any) => {
    setIsEditMode(true);
    setEditingBookingId(booking._id);
    setFormData({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
      checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0],
      roomId: typeof booking.roomId === 'string' ? booking.roomId : booking.roomId._id,
      guests: booking.guests || 1,
      totalAmount: booking.totalAmount || 0,
      specialRequests: booking.specialRequests || "",
    });
    setIsDialogOpen(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      await cancelBooking(bookingToCancel);
      toast.success("Booking cancelled successfully!");
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    } catch (error) {
      toast.error("Failed to cancel booking.");
    }
  };

  const openCancelDialog = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      checkInDate: "",
      checkOutDate: "",
      roomId: "",
      guests: 1,
      totalAmount: 0,
      specialRequests: "",
    });
    setIsEditMode(false);
    setEditingBookingId(null);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  // Filter bookings by hotelId
const hotelBookings = bookings.filter(booking => {
    if (!user?.hotelId) return false;
    // If hotelId is a string compare directly
    if (typeof booking.hotelId === "string") {
      return booking.hotelId === user.hotelId;
    }
    // If hotelId is an object with _id, compare _id
    if (booking.hotelId && typeof booking.hotelId === "object" && "_id" in booking.hotelId) {
      return (booking.hotelId as { _id: string })._id === user.hotelId;
    }
    return false;
  });

  const filteredBookings = hotelBookings.filter(booking =>
    booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.guestEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const confirmed = filteredBookings.filter(b => b.bookingStatus === "confirmed");
  const pending = filteredBookings.filter(b => b.bookingStatus === "pending");
  const cancelled = filteredBookings.filter(b => b.bookingStatus === "cancelled");
  const completed = filteredBookings.filter(b => b.bookingStatus === "checked-out");

  const BookingCard = ({ booking }: { booking: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{booking.guestName}</CardTitle>
          <Badge className={getStatusColor(booking.bookingStatus)}>
            {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{booking.guestEmail}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{booking.guestPhone}</span>
          </div>
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span>{booking.roomId.roomNumber ? `Room ${booking.roomId.roomNumber}` : booking.roomId?.roomTypeId?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="pt-2 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Guests:</span>
            <span className="font-medium">{booking.guests || 1}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-bold text-primary">₦{booking.totalAmount?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Booking ID:</span>
            <span className="font-medium text-xs">{booking._id}</span>
          </div>
        </div>

        {booking.specialRequests && (
          <div className="p-2 bg-info/10 rounded-md">
            <p className="text-xs text-info"><strong>Special Requests:</strong> {booking.specialRequests}</p>
          </div>
        )}

        <div className="flex gap-2">
          {booking.bookingStatus !== "cancelled" && booking.bookingStatus !== "checked-out" && (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => handleEdit(booking)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive" 
                className="flex-1"
                onClick={() => openCancelDialog(booking._id)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          )}
          {booking.bookingStatus === "cancelled" && (
            <div className="w-full text-center text-sm text-muted-foreground py-2">
              Booking Cancelled
            </div>
          )}
          {booking.bookingStatus === "checked-out" && (
            <div className="w-full text-center text-sm text-muted-foreground py-2">
              Booking Completed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <BookingManagementSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">Manage hotel reservations and bookings</p>
        </div>
        {/* <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isEditMode ? "Edit Booking" : "Create New Booking"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <Input name="guestName" placeholder="John Doe" value={formData.guestName} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input name="guestPhone" placeholder="+234 801 234 5678" value={formData.guestPhone} onChange={handleInputChange} />
                </div>
              </div>
              <div>
                <Label>Email Address</Label>
                <Input name="guestEmail" type="email" placeholder="guest@email.com" value={formData.guestEmail} onChange={handleInputChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Date</Label>
                  <Input name="checkInDate" type="date" value={formData.checkInDate} onChange={handleInputChange} />
                </div>
                <div>
                  <Label>Check-out Date</Label>
                  <Input name="checkOutDate" type="date" value={formData.checkOutDate} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room</Label>
                  <Select name="roomId" value={formData.roomId} onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>{`${room.number} - ${room.type}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Number of Guests</Label>
                  <Input name="guests" type="number" placeholder="2" value={formData.guests} onChange={handleInputChange} />
                </div>
              </div>
              <div>
                <Label>Total Amount (₦)</Label>
                <Input name="totalAmount" type="number" placeholder="100000" value={formData.totalAmount} onChange={handleInputChange} />
              </div>
              <div>
                <Label>Special Requests</Label>
                <Input name="specialRequests" placeholder="Any special requirements..." value={formData.specialRequests} onChange={handleInputChange} />
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                {isEditMode ? "Update Booking" : "Create Booking"}
              </Button>
            </div>
          </DialogContent>
        </Dialog> */}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-3xl font-bold">{hotelBookings.length}</p>
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
            {filteredBookings.length > 0 ? (
              filteredBookings.map(booking => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">No bookings found</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {confirmed.length > 0 ? (
              confirmed.map(booking => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">No confirmed bookings</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.length > 0 ? (
              pending.map(booking => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">No pending bookings</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.length > 0 ? (
              completed.map(booking => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">No completed bookings</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cancelled.length > 0 ? (
              cancelled.map(booking => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">No cancelled bookings</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingToCancel(null)}>No, Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} className="bg-destructive hover:bg-destructive/90">
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}