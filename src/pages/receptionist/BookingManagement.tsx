import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Phone, Mail, BedDouble, Edit, X, UserPlus, Calendar, Home, Users2, Eye, Clock, CheckCircle, LogOut, Star, CreditCard, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useBookingStore } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect as useEffectDep } from "react";
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
  roomTypeId: string;
  numberOfGuests: number;
  address: string;
  city: string;
  state: string;
  arrivingFrom: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  totalAmount: number;
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
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // ✅ Walk-in check-in confirmation
  const [walkInConfirmOpen, setWalkInConfirmOpen] = useState(false);
  const [walkInBookingToCheck, setWalkInBookingToCheck] = useState<any>(null);
  
  // ✅ Online booking confirmation code
  const [onlineConfirmOpen, setOnlineConfirmOpen] = useState(false);
  const [onlineBookingToCheck, setOnlineBookingToCheck] = useState<any>(null);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  
  // ✅ Early check-in error modal
  const [earlyCheckInErrorOpen, setEarlyCheckInErrorOpen] = useState(false);
  const [earlyCheckInMessage, setEarlyCheckInMessage] = useState("");
  
  
  const [editFormData, setEditFormData] = useState<EditBookingFormData>({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    checkInDate: "",
    checkOutDate: "",
    roomId: "",
    roomTypeId: "",
    numberOfGuests: 0,
    address: "",
    city: "",
    state: "",
    arrivingFrom: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    totalAmount: 0,
    extraBedding: false,
    specialRequests: "",
  });

  const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

  useEffect(() => {
    if (user?.hotelId) {
      fetchBookings();
    }
  }, [user?.hotelId, fetchBookings]);

  useEffect(() => {
    if (editFormData.checkInDate && editFormData.checkOutDate && isEditDialogOpen) {
      fetchAvailableRoomsForEdit();
    }
  }, [editFormData.checkInDate, editFormData.checkOutDate, isEditDialogOpen]);

  useEffect(() => {
    if (editFormData.roomTypeId && editFormData.checkInDate && editFormData.checkOutDate) {
      const selectedRoom = availableRooms.find(r => r._id === editFormData.roomTypeId);
      if (selectedRoom) {
        const checkIn = new Date(editFormData.checkInDate);
        const checkOut = new Date(editFormData.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const total = nights * selectedRoom.roomTypeId.price;
        // ✅ Also update roomId when roomTypeId changes
        setEditFormData(prev => ({ ...prev, totalAmount: total, roomId: selectedRoom._id }));
      }
    }
  }, [editFormData.roomTypeId, editFormData.checkInDate, editFormData.checkOutDate, availableRooms]);

  const fetchAvailableRoomsForEdit = async () => {
    if (!editFormData.checkInDate || !editFormData.checkOutDate) {
      return;
    }

    setLoadingRooms(true);
    try {
      const response = await fetch(
        `${VITE_API_URL}/api/rooms/available_rooms?checkIn=${editFormData.checkInDate}&checkOut=${editFormData.checkOutDate}`,
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
      setIsBookDialogOpen(false);
      await fetchBookings();
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
        if (!editFormData.checkInDate || !editFormData.checkOutDate || !editFormData.roomTypeId) {
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

  const handleViewDetails = (booking: any) => {
    setViewingBooking(booking);
    setIsViewDetailsOpen(true);
  };

  const handleEdit = (booking: any) => {
    setEditingBookingId(booking._id);
    setEditFormData({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkInDate: new Date(booking.checkInDate).toISOString().split('T')[0],
      checkOutDate: new Date(booking.checkOutDate).toISOString().split('T')[0],
      roomId: typeof booking.roomTypeId === 'string' ? booking.roomTypeId : booking.roomTypeId._id,
      roomTypeId: typeof booking.roomTypeId === 'string' ? booking.roomTypeId : booking.roomTypeId._id,
      numberOfGuests: booking.numberOfGuests,
      address: booking.guestDetails?.address || "",
      city: booking.guestDetails?.city || "",
      state: booking.guestDetails?.state || "",
      arrivingFrom: booking.guestDetails?.arrivingFrom || "",
      nextOfKinName: booking.guestDetails?.nextOfKinName || "",
      nextOfKinPhone: booking.guestDetails?.nextOfKinPhone || "",
      totalAmount: booking.totalAmount || 0,
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
      roomTypeId: "",
      numberOfGuests: 2,
      address: "",
      city: "",
      state: "",
      arrivingFrom: "",
      nextOfKinName: "",
      nextOfKinPhone: "",
      totalAmount: 0,
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

  // ✅ NEW: Walk-in check-in with date validation
  const handleWalkInCheckIn = (booking: any) => {
    // ✅ Validate check-in date
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    checkInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (today < checkInDate) {
      const formattedCheckInDate = checkInDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
      setEarlyCheckInMessage(`Guest cannot check in before the scheduled check-in date (${formattedCheckInDate}).`);
      setEarlyCheckInErrorOpen(true);
      return;
    }

    setWalkInBookingToCheck(booking);
    setWalkInConfirmOpen(true);
  };

  const confirmWalkInCheckIn = async () => {
    if (!walkInBookingToCheck) return;
    
    try {
      const response = await fetch(
        `${VITE_API_URL}/api/receptionist/${walkInBookingToCheck._id}/check-in`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            guestDetails: walkInBookingToCheck.guestDetails || {},
            preferences: walkInBookingToCheck.preferences || {},
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check-in failed");

      toast.success(`${walkInBookingToCheck.guestName} checked in successfully!`);
      setWalkInConfirmOpen(false);
      setWalkInBookingToCheck(null);
      await fetchBookings();
    } catch (error: any) {
      console.error('Walk-in check-in error:', error);
      toast.error(error.message || "Check-in failed");
    }
  };

  // ✅ Online booking confirmation code with date validation
  const handleOnlineCheckIn = (booking: any) => {
    // ✅ Validate check-in date FIRST
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    checkInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (today < checkInDate) {
      const formattedCheckInDate = checkInDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
      setEarlyCheckInMessage(`Guest cannot check in before the scheduled check-in date (${formattedCheckInDate}).`);
      setEarlyCheckInErrorOpen(true);
      return;
    }

    setOnlineBookingToCheck(booking);
    setConfirmationCode("");
    setOnlineConfirmOpen(true);
  };

  // ✅ Verify and check-in for online bookings
  const verifyAndCheckIn = async () => {
    if (!onlineBookingToCheck || !confirmationCode) {
      toast.error("Please enter confirmation code");
      return;
    }

    setIsVerifyingCode(true);
    try {
      const response = await fetch(
        `${VITE_API_URL}/api/receptionist/${onlineBookingToCheck._id}/check-in`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            confirmationCode,
            guestDetails: onlineBookingToCheck.guestDetails || {},
            preferences: onlineBookingToCheck.preferences || {},
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check-in failed");

      toast.success(`${onlineBookingToCheck.guestName} checked in successfully!`);
      setOnlineConfirmOpen(false);
      setOnlineBookingToCheck(null);
      setConfirmationCode("");
      await fetchBookings();
    } catch (error: any) {
      console.error('Online check-in error:', error);
      toast.error(error.message || "Check-in failed");
    } finally {
      setIsVerifyingCode(false);
    }
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

  // Countdown timer for checkou

const CheckoutCountdownTimer = ({ booking }: { booking: any }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      // ✅ FIXED: Explicitly set checkout time to 12:00 PM (noon)
      const checkOutTime = new Date(booking.checkOutDate);
      checkOutTime.setHours(12, 0, 0, 0); // Set to 12:00:00 PM
      
      const now = new Date().getTime();
      const difference = checkOutTime.getTime() - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        setTimeLeft("Checkout Due!");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [booking.checkOutDate]);

  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-red-600 animate-pulse flex items-center justify-center gap-2">
        <LogOut className="h-6 w-6" />
        {timeLeft}
      </div>
      <p className="text-xs text-muted-foreground mt-1">Time until check-out (12:00 PM)</p>
    </div>
  );
};

  const BookingCard = ({ booking }: { booking: any }) => {
    const guestName = booking.guestName || 'Unknown Guest';
    const guestEmail = booking.guestEmail || 'No email provided';
    const guestPhone = booking.guestPhone || 'No phone provided';
    const roomNumber = booking.roomTypeId.roomNumber || booking.roomTypeId?.name || 'N/A';
    const totalAmount = booking.totalAmount || 0;
    const numberOfGuests = booking.numberOfGuests;
    const bookingStatus = booking.bookingStatus || 'pending';
    const specialRequests = booking.preferences?.specialRequests || booking.specialRequests || '';
    const isWalkIn = booking.bookingType === 'walk-in';
    const isOnline = booking.bookingType === 'online';
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg">{guestName}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge className={isWalkIn ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}>
                {isWalkIn ? "🚶 Walk-in" : "💻 Online"}
              </Badge>
              <Badge className={getStatusColor(bookingStatus)}>
                {bookingStatus === "checked-in" ? "Checked In" :
                 bookingStatus === "checked-out" ? "Checked Out" :
                 bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}
              </Badge>
            </div>
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

          {bookingStatus === "checked-in" && (
            <div className="py-3 bg-red-50 rounded-lg border-2 border-red-200">
              <CheckoutCountdownTimer booking={booking} />
            </div>
          )}

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
          </div>

          {specialRequests && (
            <div className="p-2 bg-info/10 rounded-md">
              <p className="text-xs text-info">
                <strong>Special Requests:</strong> {specialRequests}
              </p>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleViewDetails(booking)}
              className="flex-1"
            >
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Button>

            {bookingStatus === "confirmed" && (
              <>
                {isWalkIn && (
                  <Button 
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleWalkInCheckIn(booking)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Check In
                  </Button>
                )}

                {isOnline && (
                  <Button 
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleOnlineCheckIn(booking)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verify & Check In
                  </Button>
                )}

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

            {bookingStatus === "checked-in" && (
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
              </>
            )}

            {(bookingStatus === "cancelled" || bookingStatus === "checked-out") && (
              <div className="w-full text-center text-sm text-muted-foreground py-2">
                {bookingStatus === "cancelled" ? "Booking Cancelled" : "Booking Completed"}
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
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden z-50">
    <DialogHeader>
      <DialogTitle>Book New Guest (Walk-in)</DialogTitle>
      <DialogDescription>
        Fill in the guest information to create a new walk-in booking
      </DialogDescription>
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

      {/* ✅ Early Check-in Error Modal */}
      <AlertDialog open={earlyCheckInErrorOpen} onOpenChange={setEarlyCheckInErrorOpen}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Cannot Check In Early
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {earlyCheckInMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setEarlyCheckInErrorOpen(false)}>
              Understood
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Edit Booking Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-50">
    <DialogHeader>
      <DialogTitle className="text-2xl">Edit Booking</DialogTitle>
      <DialogDescription>
        Update booking information. Complete all steps to save changes
      </DialogDescription>
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

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <span className="h-5 w-5 text-primary">1</span>
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

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <span className="h-5 w-5 text-primary">2</span>
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
                      value={editFormData.roomTypeId}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, roomTypeId: value }))}
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

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <span className="h-5 w-5 text-primary">3</span>
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

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <span className="h-5 w-5 text-primary">4</span>
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
              <Button onClick={handleEditSubmit} className="bg-success hover:bg-success/90">
                Update Booking
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* ✅ Walk-in Check-in Confirmation Modal */}
      <AlertDialog open={walkInConfirmOpen} onOpenChange={setWalkInConfirmOpen}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Check In Walk-in Guest?</AlertDialogTitle>
            <AlertDialogDescription>
              {walkInBookingToCheck && (
                <div className="space-y-2 mt-4">
                  <p><strong>Guest:</strong> {walkInBookingToCheck.guestName}</p>
                  <p><strong>Room:</strong> {walkInBookingToCheck.roomTypeId?.roomNumber || 'TBA'}</p>
                  <p><strong>Check-in:</strong> {new Date(walkInBookingToCheck.checkInDate).toLocaleDateString()}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWalkInBookingToCheck(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmWalkInCheckIn}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Check-in
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Online Booking Confirmation Code Modal */}
      <Dialog open={onlineConfirmOpen} onOpenChange={setOnlineConfirmOpen}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>Enter Confirmation Code</DialogTitle>
          </DialogHeader>
          {onlineBookingToCheck && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-blue-200">
                <p className="text-sm"><strong>Guest:</strong> {onlineBookingToCheck.guestName}</p>
                <p className="text-sm"><strong>Check-in:</strong> {new Date(onlineBookingToCheck.checkInDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label htmlFor="confirmCode">Confirmation Code</Label>
                <Input
                  id="confirmCode"
                  placeholder="Enter 6-digit code"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  maxLength={10}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setOnlineConfirmOpen(false);
                  setOnlineBookingToCheck(null);
                  setConfirmationCode("");
                }}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={verifyAndCheckIn}
                  disabled={isVerifyingCode || !confirmationCode}
                >
                  {isVerifyingCode ? "Verifying..." : "Verify & Check In"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ✅ View Booking Details Modal */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-50">
    <DialogHeader>
      <DialogTitle>Complete Booking Details</DialogTitle>
    </DialogHeader>
    {viewingBooking && (
      <div className="space-y-4">
        {/* Booking Status Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge className={getStatusColor(viewingBooking.bookingStatus)}>
              {viewingBooking.bookingStatus.charAt(0).toUpperCase() + viewingBooking.bookingStatus.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booking Type</p>
            <Badge variant={viewingBooking.bookingType === 'walk-in' ? 'secondary' : 'default'}>
              {viewingBooking.bookingType === 'walk-in' ? '🚶 Walk-in' : '💻 Online'}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Payment Status</p>
            <Badge variant="outline">
              {viewingBooking.paymentStatus.charAt(0).toUpperCase() + viewingBooking.paymentStatus.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Booking ID</p>
            <p className="font-mono text-sm">{viewingBooking._id.substring(0, 8)}...</p>
          </div>
        </div>

        {/* Guest Information Section */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Guest Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted rounded">
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="font-medium">{viewingBooking.guestName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email Address</p>
              <p className="font-medium text-sm break-all">{viewingBooking.guestEmail}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone Number</p>
              <p className="font-medium">{viewingBooking.guestPhone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Number of Guests</p>
              <p className="font-medium">{viewingBooking.numberOfGuests}</p>
            </div>
          </div>
        </div>

        {/* Room & Dates Section */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <BedDouble className="h-4 w-4" />
            Room & Dates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted rounded">
            <div>
              <p className="text-xs text-muted-foreground">Room Number</p>
              <p className="font-medium text-lg">{viewingBooking.roomTypeId?.roomNumber || 'TBA'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Room Type</p>
              <p className="font-medium">{viewingBooking.roomTypeId?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-in Date</p>
              <p className="font-medium">{new Date(viewingBooking.checkInDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Check-out Date</p>
              <p className="font-medium">{new Date(viewingBooking.checkOutDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Payment & Pricing Section */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment & Pricing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted rounded">
            <div>
              <p className="text-xs text-muted-foreground">Total Amount</p>
              <p className="font-bold text-primary text-lg">₦{viewingBooking.totalAmount?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount Paid</p>
              <p className="font-medium">₦{(viewingBooking.amountPaid || 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="font-medium">
                ₦{(viewingBooking.totalAmount - (viewingBooking.amountPaid || 0)).toLocaleString()}
              </p>
              {/* {console.log(viewingBooking)} */}
            </div>
          </div>
        </div>

        {/* Address Information (After Check-in) */}
        {viewingBooking.guestDetails && (viewingBooking.guestDetails.address || viewingBooking.guestDetails.city || viewingBooking.guestDetails.state) && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>
            <div className="p-3 bg-muted rounded space-y-2 text-sm">
              {viewingBooking.guestDetails.address && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Street Address:</span>
                  <span className="font-medium text-right">{viewingBooking.guestDetails.address}</span>
                </div>
              )}
              {viewingBooking.guestDetails.city && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">City:</span>
                  <span className="font-medium">{viewingBooking.guestDetails.city}</span>
                </div>
              )}
              {viewingBooking.guestDetails.state && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State:</span>
                  <span className="font-medium">{viewingBooking.guestDetails.state}</span>
                </div>
              )}
              {viewingBooking.guestDetails.arrivingFrom && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Arriving From:</span>
                  <span className="font-medium">{viewingBooking.guestDetails.arrivingFrom}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Emergency Contact (After Check-in) */}
        {viewingBooking.guestDetails && (viewingBooking.guestDetails.nextOfKinName || viewingBooking.guestDetails.nextOfKinPhone) && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Emergency Contact
            </h3>
            <div className="p-3 bg-muted rounded space-y-2 text-sm">
              {viewingBooking.guestDetails.nextOfKinName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{viewingBooking.guestDetails.nextOfKinName}</span>
                </div>
              )}
              {viewingBooking.guestDetails.nextOfKinPhone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{viewingBooking.guestDetails.nextOfKinPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Room Preferences (After Check-in) */}
        {viewingBooking.preferences && (viewingBooking.preferences.extraBedding || viewingBooking.preferences.specialRequests) && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Star className="h-4 w-4" />
              Room Preferences
            </h3>
            <div className="p-3 bg-muted rounded space-y-2 text-sm">
              {viewingBooking.preferences.extraBedding && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span>Extra Bedding Requested</span>
                </div>
              )}
              {viewingBooking.preferences.specialRequests && (
                <div>
                  <p className="text-muted-foreground mb-1">Special Requests:</p>
                  <p className="font-medium italic">{viewingBooking.preferences.specialRequests}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Special Requests (Alternate location) */}
        {viewingBooking.specialRequests && (
          <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-900 mb-1">Special Requests</p>
            <p className="text-sm text-yellow-800">{viewingBooking.specialRequests}</p>
          </div>
        )}

        {/* Confirmation Code (Online Bookings) */}
        {viewingBooking.bookingType === 'online' && viewingBooking.confirmationCode && (
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-1">Confirmation Code</p>
            <p className="font-mono text-lg text-blue-900">{viewingBooking.confirmationCode}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="p-3 bg-muted rounded text-xs text-muted-foreground space-y-1">
          <div>Created: {new Date(viewingBooking.createdAt).toLocaleString()}</div>
          {viewingBooking.updatedAt && (
            <div>Last Updated: {new Date(viewingBooking.updatedAt).toLocaleString()}</div>
          )}
        </div>

        {/* Close Button */}
        <Button className="w-full" onClick={() => setIsViewDetailsOpen(false)}>
          Close Details
        </Button>
      </div>
    )}
  </DialogContent>
</Dialog>

      {/* Stats Cards */}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by guest name, booking ID, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bookings Grid */}
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

      {/* Cancel Booking Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="z-50">
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