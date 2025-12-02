import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Phone, Mail, BedDouble, Edit, X, UserPlus, Calendar, Home, Users2 } from "lucide-react";
import { toast } from "sonner";
import { useBookingStore } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect } from "react";
import BookingManagementSkeleton from "../../components/skeleton/BookingManagementSkeleton";
import BookGuestForm from "@/components/BookGuestForm";
import { useLocation } from "react-router-dom";

interface EditBookingFormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  roomId: string;
  numberOfGuests: number;
  address: string;
  city: string;
  state: string;
  arrivingFrom: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  totalAmount: number;
  // amountPaid: number;
  // paymentMethod: string;
  extraBedding: boolean;
  specialRequests: string;
}

interface AvailableRoom {
  _id: string;
  roomNumber: string;
  roomTypeId: {
    _id: string;
    name: string;
    price: number;
  };
}

export default function BookingManagement() {
  const { bookings, isLoading, fetchBookings, updateBooking, cancelBooking } = useBookingStore();
  const { user } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isBookDialogOpen, setIsBookDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
   
  
  const [editFormData, setEditFormData] = useState<EditBookingFormData>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    checkInDate: "",
    checkOutDate: "",
    roomId: "",
    numberOfGuests: 0,
    address: "",
    city: "",
    state: "",
    arrivingFrom: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    totalAmount: 0,
    // amountPaid: 0,
    // paymentMethod: "cash",
    extraBedding: false,
    specialRequests: "",
  });

  const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

  useEffect(() => {
    if (user?.hotelId) {
      fetchBookings();
      //  window.scrollTo(0, 0);
    }
  }, [user?.hotelId, fetchBookings]);

  // Fetch available rooms when editing dates change
  useEffect(() => {
    if (editFormData.checkInDate && editFormData.checkOutDate && isEditDialogOpen) {
      fetchAvailableRoomsForEdit();
    }
  }, [editFormData.checkInDate, editFormData.checkOutDate, isEditDialogOpen]);

  // Calculate total amount when room is selected during edit
  useEffect(() => {
    if (editFormData.roomId && editFormData.checkInDate && editFormData.checkOutDate) {
      const selectedRoom = availableRooms.find(r => r._id === editFormData.roomId);
      if (selectedRoom) {
        const checkIn = new Date(editFormData.checkInDate);
        const checkOut = new Date(editFormData.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const total = nights * selectedRoom.roomTypeId.price;
        setEditFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }
  }, [editFormData.roomId, editFormData.checkInDate, editFormData.checkOutDate, availableRooms]);

  const fetchAvailableRoomsForEdit = async () => {
    if (!editFormData.checkInDate || !editFormData.checkOutDate) {
      return;
    }

    setLoadingRooms(true);
    try {
      const response = await fetch(
        `${VITE_API_URL}/api/rooms/available?checkIn=${editFormData.checkInDate}&checkOut=${editFormData.checkOutDate}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableRooms(data.data || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to fetch available rooms");
        setAvailableRooms([]);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Error loading available rooms");
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-success/10 text-success hover:bg-success/20";
      case "pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "cancelled": return "bg-error/10 text-error hover:bg-error/20";
      case "checked-in": return "bg-primary/10 text-primary hover:bg-primary/20";
      case "checked-out": return "bg-info/10 text-info hover:bg-info/20";
      default: return "";
    }
  };

  const handleBookConfirm = async (formData: any) => {
    try {
      // Booking already created in BookGuestForm via useBookingStore
      setIsBookDialogOpen(false);
      await fetchBookings(); // Refresh list
      toast.success("Guest booked successfully!");
    } catch (err) {
      toast.error("Failed to complete booking.");
    }
  };

  const handleBookCancel = () => {
    setIsBookDialogOpen(false);
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCheckboxChange = (name: string, checked: boolean) => {
    setEditFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateEditStep = (step: number) => {
    switch (step) {
      case 1:
        if (!editFormData.guestName || !editFormData.guestEmail || !editFormData.guestPhone) {
          toast.error("Please fill in all guest information");
          return false;
        }
        if (!editFormData.guestEmail.includes('@')) {
          toast.error("Please enter a valid email address");
          return false;
        }
        break;
      case 2:
        if (!editFormData.checkInDate || !editFormData.checkOutDate || !editFormData.roomId) {
          toast.error("Please select check-in/out dates and room");
          return false;
        }
        if (new Date(editFormData.checkOutDate) <= new Date(editFormData.checkInDate)) {
          toast.error("Check-out date must be after check-in date");
          return false;
        }
        break;
      case 3:
        if (!editFormData.city || !editFormData.state) {
          toast.error("Please fill in city and state");
          return false;
        }
        break;
    }
    return true;
  };

  const handleEditNext = () => {
    if (validateEditStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleEditPrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleEditSubmit = async () => {
    if (!user?.hotelId || !editingBookingId) {
      toast.error("Missing required information");
      return;
    }

    if (!validateEditStep(4)) {
      return;
    }

    try {
      const updateData = {
        hotelId: user.hotelId,
        roomId: editFormData.roomId,
        guestName: editFormData.guestName,
        guestEmail: editFormData.guestEmail,
        guestPhone: editFormData.guestPhone,
        checkInDate: editFormData.checkInDate,
        checkOutDate: editFormData.checkOutDate,
        numberOfGuests: editFormData.numberOfGuests,
        totalAmount: editFormData.totalAmount,
        // amountPaid: editFormData.amountPaid,
        // paymentStatus: editFormData.amountPaid >= editFormData.totalAmount ? "paid" : editFormData.amountPaid > 0 ? "partial" : "pending",
        guestDetails: {
          address: editFormData.address,
          city: editFormData.city,
          state: editFormData.state,
          arrivingFrom: editFormData.arrivingFrom,
          nextOfKinName: editFormData.nextOfKinName,
          nextOfKinPhone: editFormData.nextOfKinPhone,
        },
        preferences: {
          extraBedding: editFormData.extraBedding,
          specialRequests: editFormData.specialRequests,
        },
      };

      await updateBooking(editingBookingId, updateData);
      resetEditForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Edit booking error:", error);
    }
  };

  const handleEdit = (booking: any) => {
    setEditingBookingId(booking._id);
    setEditFormData({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
      checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0],
      roomId: typeof booking.roomId === 'string' ? booking.roomId : booking.roomId._id,
      numberOfGuests: booking.numberOfGuests,
      address: booking.guestDetails?.address || "",
      city: booking.guestDetails?.city || "",
      state: booking.guestDetails?.state || "",
      arrivingFrom: booking.guestDetails?.arrivingFrom || "",
      nextOfKinName: booking.guestDetails?.nextOfKinName || "",
      nextOfKinPhone: booking.guestDetails?.nextOfKinPhone || "",
      totalAmount: booking.totalAmount || 0,
      // amountPaid: booking.amountPaid || 0,
      // paymentMethod: "cash",
      extraBedding: booking.preferences?.extraBedding || false,
      specialRequests: booking.preferences?.specialRequests || booking.specialRequests || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetEditForm = () => {
    setEditFormData({
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      checkInDate: "",
      checkOutDate: "",
      roomId: "",
      numberOfGuests: 2,
      address: "",
      city: "",
      state: "",
      arrivingFrom: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      totalAmount: 0,
      // amountPaid: 0,
      // paymentMethod: "cash",
      extraBedding: false,
      specialRequests: "",
    });
    setEditingBookingId(null);
    setCurrentStep(1);
    setAvailableRooms([]);
  };

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      resetEditForm();
    }
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;

    try {
      await cancelBooking(bookingToCancel);
      setCancelDialogOpen(false);
      setBookingToCancel(null);
    } catch (error) {
      console.error("Cancel booking error:", error);
    }
  };

  const openCancelDialog = (bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
  };

  // Filter bookings by hotelId
  const hotelBookings = bookings.filter(booking => {
    if (!user?.hotelId) return false;
    if (typeof booking.hotelId === "string") {
      return booking.hotelId === user.hotelId;
    }
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
  const checkedIn = filteredBookings.filter(b => b.bookingStatus === "checked-in");
  const completed = filteredBookings.filter(b => b.bookingStatus === "checked-out");

  const BookingCard = ({ booking }: { booking: any }) => {
    // Safely extract values with defaults
    const guestName = booking.guestName || 'Unknown Guest';
    const guestEmail = booking.guestEmail || 'No email provided';
    const guestPhone = booking.guestPhone || 'No phone provided';
    const roomNumber = booking.roomId?.roomNumber || booking.roomId?.roomTypeId?.name || 'N/A';
    const totalAmount = booking.totalAmount || 0;
    // const amountPaid = booking.amountPaid || 0;
    const numberOfGuests = booking.numberOfGuests ;
    // const paymentStatus = booking.paymentStatus || 'pending';
    const bookingStatus = booking.bookingStatus || 'pending';
    const specialRequests = booking.preferences?.specialRequests || booking.specialRequests || '';
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{guestName}</CardTitle>
            <Badge className={getStatusColor(bookingStatus)}>
              {bookingStatus === "checked-in" ? "Checked In" :
               bookingStatus === "checked-out" ? "Checked Out" :
               bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{guestEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{guestPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <BedDouble className="h-4 w-4 text-muted-foreground" />
              <span>Room {roomNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {booking.checkInDate ? new Date(booking.checkInDate).toLocaleDateString() : 'N/A'} - {booking.checkOutDate ? new Date(booking.checkOutDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Guests:</span>
              <span className="font-medium">{numberOfGuests}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-bold text-primary">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
            {/* <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount Paid:</span>
              <span className="font-medium">
                ₦{amountPaid.toLocaleString()}
              </span>
            </div> */}
            {/* <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment Status:</span>
              <Badge variant="outline" className="text-xs">
                {paymentStatus.toUpperCase()}
              </Badge>
            </div> */}
          </div>

          {specialRequests && (
            <div className="p-2 bg-info/10 rounded-md">
              <p className="text-xs text-info">
                <strong>Special Requests:</strong> {specialRequests}
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {bookingStatus !== "cancelled" && bookingStatus !== "checked-out" && (
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
            {bookingStatus === "cancelled" && (
              <div className="w-full text-center text-sm text-muted-foreground py-2">
                Booking Cancelled
              </div>
            )}
            {bookingStatus === "checked-out" && (
              <div className="w-full text-center text-sm text-muted-foreground py-2">
                Booking Completed
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading && bookings.length === 0) return <BookingManagementSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Booking Management</h1>
          <p className="text-muted-foreground">Manage hotel reservations and bookings</p>
        </div>
        
        <Dialog open={isBookDialogOpen} onOpenChange={setIsBookDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <UserPlus className="h-5 w-5" />
              Book Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Book New Guest (Walk-in)</DialogTitle>
            </DialogHeader>
            <BookGuestForm 
              guestName="" 
              bookingId="" 
              bookingType="walk-in"
              onConfirm={handleBookConfirm} 
              onCancel={handleBookCancel} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Booking</DialogTitle>
            <div className="flex items-center gap-2 mt-4">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep >= step ? 'bg-primary border-primary text-white' : 'border-muted-foreground text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && <div className={`flex-1 h-0.5 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of 4: {
                currentStep === 1 ? "Guest Information" :
                currentStep === 2 ? "Booking Details" :
                currentStep === 3 ? "Guest Details" :
                "Payment & Preferences"
              }
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Step 1: Guest Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Guest Information</h3>
                </div>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit-guestName">Full Name *</Label>
                    <Input
                      id="edit-guestName"
                      name="guestName"
                      placeholder="John Doe"
                      value={editFormData.guestName}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-guestEmail">Email Address *</Label>
                      <Input
                        id="edit-guestEmail"
                        name="guestEmail"
                        type="email"
                        placeholder="guest@email.com"
                        value={editFormData.guestEmail}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-guestPhone">Phone Number *</Label>
                      <Input
                        id="edit-guestPhone"
                        name="guestPhone"
                        placeholder="+234 801 234 5678"
                        value={editFormData.guestPhone}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Booking Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Booking Details</h3>
                </div>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-checkInDate">Check-in Date *</Label>
                      <Input
                        id="edit-checkInDate"
                        name="checkInDate"
                        type="date"
                        value={editFormData.checkInDate}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-checkOutDate">Check-out Date *</Label>
                      <Input
                        id="edit-checkOutDate"
                        name="checkOutDate"
                        type="date"
                        value={editFormData.checkOutDate}
                        onChange={handleEditInputChange}
                        min={editFormData.checkInDate}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-roomId">Select Room *</Label>
                    <Select
                      value={editFormData.roomId}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, roomId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingRooms ? "Loading rooms..." : "Select a room"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.length > 0 ? (
                          availableRooms.map(room => (
                            <SelectItem key={room._id} value={room._id}>
                              Room {room.roomNumber} - {room.roomTypeId?.name || 'Unknown'} 
                              {room.roomTypeId?.price ? ` (₦${room.roomTypeId.price.toLocaleString()}/night)` : ''}
                            </SelectItem>
                            
                          ))
                        ) : (
                          <SelectItem value="no-rooms" disabled>
                            {editFormData.checkInDate && editFormData.checkOutDate ? "No rooms available" : "Select dates first"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-numberOfGuests">Number of Guests</Label>
                    <Input
                      id="edit-numberOfGuests"
                      name="numberOfGuests"
                      type="number"
                      min="1"
                      value={editFormData.numberOfGuests}
                      onChange={handleEditInputChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Guest Details */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Home className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Guest Details</h3>
                </div>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="edit-address">Address</Label>
                    <Input
                      id="edit-address"
                      name="address"
                      placeholder="123 Main Street"
                      value={editFormData.address}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-city">City *</Label>
                      <Input
                        id="edit-city"
                        name="city"
                        placeholder="Lagos"
                        value={editFormData.city}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-state">State *</Label>
                      <Input
                        id="edit-state"
                        name="state"
                        placeholder="Lagos"
                        value={editFormData.state}
                        onChange={handleEditInputChange}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-arrivingFrom">Arriving From</Label>
                    <Input
                      id="edit-arrivingFrom"
                      name="arrivingFrom"
                      placeholder="Abuja"
                      value={editFormData.arrivingFrom}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users2 className="h-4 w-4" />
                      Next of Kin
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-nextOfKinName">Name</Label>
                        <Input
                          id="edit-nextOfKinName"
                          name="nextOfKinName"
                          placeholder="Jane Doe"
                          value={editFormData.nextOfKinName}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-nextOfKinPhone">Phone</Label>
                        <Input
                          id="edit-nextOfKinPhone"
                          name="nextOfKinPhone"
                          placeholder="+234 801 234 5678"
                          value={editFormData.nextOfKinPhone}
                          onChange={handleEditInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Payment & Preferences */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <BedDouble className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Payment & Preferences</h3>
                </div>
                <div className="grid gap-4">
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary">₦{editFormData.totalAmount.toLocaleString()}</span>
                    </div>
                    {editFormData.checkInDate && editFormData.checkOutDate && (
                      <div className="text-xs text-muted-foreground">
                        {Math.ceil((new Date(editFormData.checkOutDate).getTime() - new Date(editFormData.checkInDate).getTime()) / (1000 * 60 * 60 * 24))} night(s)
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* <div>
                      <Label htmlFor="edit-amountPaid">Amount Paid</Label>
                      <Input
                        id="edit-amountPaid"
                        name="amountPaid"
                        type="number"
                        placeholder="0"
                        value={editFormData.amountPaid}
                        onChange={handleEditInputChange}
                      />
                    </div> */}
                    {/* <div>
                      <Label htmlFor="edit-paymentMethod">Payment Method</Label>
                      <Select
                        value={editFormData.paymentMethod}
                        onValueChange={(value) => setEditFormData(prev => ({ ...prev, paymentMethod: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="transfer">Bank Transfer</SelectItem>
                          <SelectItem value="pos">POS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div> */}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-extraBedding"
                      checked={editFormData.extraBedding}
                      onCheckedChange={(checked) => handleEditCheckboxChange('extraBedding', checked as boolean)}
                    />
                    <Label htmlFor="edit-extraBedding" className="cursor-pointer">
                      Extra Bedding Required
                    </Label>
                  </div>

                  <div>
                    <Label htmlFor="edit-specialRequests">Special Requests</Label>
                    <Textarea
                      id="edit-specialRequests"
                      name="specialRequests"
                      placeholder="Any special requirements..."
                      value={editFormData.specialRequests}
                      onChange={handleEditInputChange}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleEditPrevious}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            {currentStep < 4 ? (
              <Button onClick={handleEditNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleEditSubmit} className="bg-success hover:bg-success/90" disabled={isLoading}>
                Update Booking
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <p className="text-sm text-muted-foreground">Checked In</p>
            <p className="text-3xl font-bold text-primary">{checkedIn.length}</p>
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
          <TabsTrigger value="checked-in">Checked In ({checkedIn.length})</TabsTrigger>
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

        <TabsContent value="checked-in" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {checkedIn.length > 0 ? (
              checkedIn.map(booking => <BookingCard key={booking._id} booking={booking} />)
            ) : (
              <p className="text-muted-foreground col-span-full text-center py-8">No checked-in bookings</p>
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
            <AlertDialogCancel onClick={() => setBookingToCancel(null)}>
              No, Keep Booking
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelBooking} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Cancel Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}