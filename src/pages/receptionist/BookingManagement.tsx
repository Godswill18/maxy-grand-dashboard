import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import CheckInForm, { CheckInFormData } from "@/components/modals/CheckInForm";
import { useCheckInStore } from "@/store/useCheckInStore";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Phone, Mail, BedDouble, Edit, X, UserPlus, Calendar, Users2, CheckCircle, LogOut, Star, CreditCard, MapPin, AlertCircle, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { useBookingStore } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import BookingManagementSkeleton from "../../components/skeleton/BookingManagementSkeleton";
import BookGuestForm from "@/components/BookGuestForm";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const STATUS_ROW: Record<string, string> = {
  pending:       "border-l-amber-400  bg-amber-50/30  dark:bg-amber-900/10",
  confirmed:     "border-l-green-400  bg-green-50/30  dark:bg-green-900/10",
  "checked-in":  "border-l-blue-400   bg-blue-50/30   dark:bg-blue-900/10",
  "checked-out": "border-l-gray-300   bg-gray-50/30   dark:bg-gray-800/10",
  cancelled:     "border-l-red-400    bg-red-50/30    dark:bg-red-900/10",
};

const statusConfig: Record<string, { label: string; className: string }> = {
  pending:       { label: "Pending",     className: "bg-amber-100 text-amber-700 border-amber-200" },
  confirmed:     { label: "Confirmed",   className: "bg-green-100 text-green-700 border-green-200" },
  "checked-in":  { label: "Checked In",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  "checked-out": { label: "Checked Out", className: "bg-gray-100 text-gray-600 border-gray-200" },
  cancelled:     { label: "Cancelled",   className: "bg-red-100 text-red-600 border-red-200" },
};

const paymentConfig: Record<string, { label: string; className: string }> = {
  paid:    { label: "Paid",    className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  partial: { label: "Partial", className: "bg-orange-100 text-orange-700 border-orange-200" },
  pending: { label: "Unpaid",  className: "bg-rose-100 text-rose-700 border-rose-200" },
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

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
  const { checkInWithRegistration } = useCheckInStore();
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

  // Check-in Sheet
  const [checkInSheetOpen, setCheckInSheetOpen] = useState(false);
  const [checkInBooking,   setCheckInBooking]   = useState<any>(null);

  // Change Room Dialog
  const [changeRoomOpen,     setChangeRoomOpen]     = useState(false);
  const [changeRoomBooking,  setChangeRoomBooking]  = useState<any>(null);
  const [changeRoomRooms,    setChangeRoomRooms]    = useState<AvailableRoom[]>([]);
  const [changeRoomSelected, setChangeRoomSelected] = useState("");
  const [changeRoomLoading,  setChangeRoomLoading]  = useState(false);

  const [earlyCheckInErrorOpen, setEarlyCheckInErrorOpen] = useState(false);
  const [earlyCheckInMessage, setEarlyCheckInMessage] = useState("");

  const [checkOutConfirmOpen, setCheckOutConfirmOpen] = useState(false);
  const [bookingToCheckOut, setBookingToCheckOut] = useState<any>(null);

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
        setEditFormData(prev => ({ ...prev, totalAmount: total, roomId: selectedRoom._id }));
      }
    }
  }, [editFormData.roomTypeId, editFormData.checkInDate, editFormData.checkOutDate, availableRooms]);

  const fetchAvailableRoomsForEdit = async () => {
    if (!editFormData.checkInDate || !editFormData.checkOutDate) return;

    setLoadingRooms(true);
    try {
      const response = await fetch(
        `${VITE_API_URL}/api/rooms/available_rooms?checkIn=${editFormData.checkInDate}&checkOut=${editFormData.checkOutDate}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
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

  const handleBookConfirm = async (_formData: any) => {
    try {
      setIsBookDialogOpen(false);
      await fetchBookings();
      toast.success("Guest booked successfully!");
    } catch {
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

    if (!validateEditStep(4)) return;

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
    if (!open) resetEditForm();
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

  const handleCheckIn = (booking: any) => {
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    checkInDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (today < checkInDate) {
      const formattedDate = checkInDate.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', year: 'numeric',
      });
      setEarlyCheckInMessage(`Guest cannot check in before the scheduled check-in date (${formattedDate}).`);
      setEarlyCheckInErrorOpen(true);
      return;
    }

    setCheckInBooking(booking);
    setCheckInSheetOpen(true);
  };

  const handleCheckInConfirm = async (formData: CheckInFormData) => {
    if (!checkInBooking) return;
    await checkInWithRegistration(checkInBooking._id, formData);
    setCheckInSheetOpen(false);
    setCheckInBooking(null);
    await fetchBookings();
  };

  const handleOpenChangeRoom = async (booking: any) => {
    setChangeRoomBooking(booking);
    setChangeRoomSelected("");
    setChangeRoomOpen(true);
    setChangeRoomLoading(true);
    try {
      const hotelId = user?.hotelId;
      const checkIn  = new Date(booking.checkInDate).toISOString().split("T")[0];
      const checkOut = new Date(booking.checkOutDate).toISOString().split("T")[0];
      const res = await fetch(
        `${VITE_API_URL}/api/rooms/available_rooms?checkIn=${checkIn}&checkOut=${checkOut}&hotelId=${hotelId}`,
        { credentials: "include" }
      );
      const data = await res.json();
      setChangeRoomRooms(data.data || []);
    } catch {
      toast.error("Failed to load available rooms.");
    } finally {
      setChangeRoomLoading(false);
    }
  };

  const confirmChangeRoom = async () => {
    if (!changeRoomBooking || !changeRoomSelected) return;
    setChangeRoomLoading(true);
    try {
      await updateBooking(changeRoomBooking._id, { roomId: changeRoomSelected });
      toast.success("Room changed successfully.");
      setChangeRoomOpen(false);
      setChangeRoomBooking(null);
      await fetchBookings();
    } catch {
      toast.error("Failed to change room.");
    } finally {
      setChangeRoomLoading(false);
    }
  };

  const handleCheckOut = (booking: any) => {
    setBookingToCheckOut(booking);
    setCheckOutConfirmOpen(true);
  };

  const confirmCheckOut = async () => {
    if (!bookingToCheckOut) return;

    try {
      const response = await fetch(
        `${VITE_API_URL}/api/receptionist/${bookingToCheckOut._id}/check-out`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Check-out failed");

      toast.success(`${bookingToCheckOut.guestName} checked out successfully!`);
      setCheckOutConfirmOpen(false);
      setBookingToCheckOut(null);
      await fetchBookings();
    } catch (error: any) {
      console.error('Check-out error:', error);
      toast.error(error.message || "Check-out failed");
    }
  };

  // Filter bookings by hotelId
  const hotelBookings = bookings.filter(booking => {
    if (!user?.hotelId) return false;
    if (typeof booking.hotelId === "string") return booking.hotelId === user.hotelId;
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

  const confirmed   = filteredBookings.filter(b => b.bookingStatus === "confirmed");
  const pending     = filteredBookings.filter(b => b.bookingStatus === "pending");
  const cancelled   = filteredBookings.filter(b => b.bookingStatus === "cancelled");
  const checkedIn   = filteredBookings.filter(b => b.bookingStatus === "checked-in");
  const completed   = filteredBookings.filter(b => b.bookingStatus === "checked-out");

  const CheckoutCountdownTimer = ({ booking }: { booking: any }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
      const calculateTimeLeft = () => {
        const checkOutTime = new Date(booking.checkOutDate);
        checkOutTime.setHours(12, 0, 0, 0);
        const difference = checkOutTime.getTime() - new Date().getTime();

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
          const minutes = Math.floor((difference / 1000 / 60) % 60);
          const seconds = Math.floor((difference / 1000) % 60);

          if (days > 0) setTimeLeft(`${days}d ${hours}h`);
          else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
          else setTimeLeft(`${minutes}m ${seconds}s`);
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
        <div className="text-2xl font-bold text-red-600 animate-pulse flex items-center justify-center gap-1">
          <LogOut className="h-5 w-5" />
          {timeLeft}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Until check-out (12:00 PM)</p>
      </div>
    );
  };

  // Table renderer for a given list of bookings
  const renderTable = (bookingList: any[]) => (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8">#</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Guest</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Room</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check-in</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check-out</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookingList.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground text-sm">
                  No bookings found
                </td>
              </tr>
            ) : (
              bookingList.map((booking, index) => {
                const isWalkIn = booking.bookingType === "walk-in";
                const isOnline = booking.bookingType === "online";
                return (
                  <tr
                    key={booking._id}
                    className={cn(
                      "border-b border-l-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      STATUS_ROW[booking.bookingStatus] ?? "border-l-gray-200"
                    )}
                    onClick={() => handleViewDetails(booking)}
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-xs">
                          {getInitials(booking.guestName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[130px]">{booking.guestName}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[130px]">
                            {booking.guestEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">
                        {booking.roomTypeId?.roomNumber || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.roomTypeId?.name || ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(booking.checkInDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(booking.checkOutDate)}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          isWalkIn
                            ? "border-orange-200 text-orange-700"
                            : "border-blue-200 text-blue-700"
                        )}
                      >
                        {isWalkIn ? "Walk-in" : "Online"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      ₦{(booking.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "text-xs border",
                          paymentConfig[booking.paymentStatus]?.className ?? ""
                        )}
                      >
                        {paymentConfig[booking.paymentStatus]?.label || booking.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "text-xs border",
                          statusConfig[booking.bookingStatus]?.className ?? ""
                        )}
                      >
                        {statusConfig[booking.bookingStatus]?.label || booking.bookingStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 flex-wrap">
                        {booking.bookingStatus === "confirmed" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2 bg-green-600 hover:bg-green-700"
                            onClick={() => handleCheckIn(booking)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Check In
                          </Button>
                        )}
                        {booking.bookingStatus === "checked-in" && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2 bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleCheckOut(booking)}
                          >
                            <LogOut className="h-3 w-3 mr-1" />
                            Out
                          </Button>
                        )}
                        {(booking.bookingStatus === "confirmed" ||
                          booking.bookingStatus === "pending" ||
                          booking.bookingStatus === "checked-in") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 text-purple-600 border-purple-300 hover:bg-purple-50"
                            onClick={() => handleOpenChangeRoom(booking)}
                          >
                            <ArrowLeftRight className="h-3 w-3 mr-1" />
                            Room
                          </Button>
                        )}
                        {(booking.bookingStatus === "confirmed" ||
                          booking.bookingStatus === "checked-in") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => handleEdit(booking)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {(booking.bookingStatus === "confirmed" ||
                          booking.bookingStatus === "pending") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => openCancelDialog(booking._id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

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

      {/* Early Check-in Error Modal */}
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

      {/* Edit Booking Dialog */}
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
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                      currentStep >= step
                        ? 'bg-primary border-primary text-white'
                        : 'border-muted-foreground text-muted-foreground'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-0.5 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Step {currentStep} of 4:{" "}
              {currentStep === 1 ? "Guest Information" :
               currentStep === 2 ? "Booking Details" :
               currentStep === 3 ? "Guest Details" :
               "Payment & Preferences"}
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
                      onValueChange={(value) =>
                        setEditFormData(prev => ({ ...prev, roomTypeId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={loadingRooms ? "Loading rooms..." : "Select a room"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRooms.length > 0 ? (
                          availableRooms.map(room => (
                            <SelectItem key={room._id} value={room._id}>
                              Room {room.roomNumber} - {room.roomTypeId?.name || 'Unknown'}
                              {room.roomTypeId?.price
                                ? ` (₦${room.roomTypeId.price.toLocaleString()}/night)`
                                : ''}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-rooms" disabled>
                            {editFormData.checkInDate && editFormData.checkOutDate
                              ? "No rooms available"
                              : "Select dates first"}
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
                      <span className="text-2xl font-bold text-primary">
                        ₦{editFormData.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    {editFormData.checkInDate && editFormData.checkOutDate && (
                      <div className="text-xs text-muted-foreground">
                        {Math.ceil(
                          (new Date(editFormData.checkOutDate).getTime() -
                            new Date(editFormData.checkInDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        night(s)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit-extraBedding"
                      checked={editFormData.extraBedding}
                      onCheckedChange={(checked) =>
                        handleEditCheckboxChange('extraBedding', checked as boolean)
                      }
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
              <Button onClick={handleEditNext}>Next</Button>
            ) : (
              <Button onClick={handleEditSubmit} className="bg-success hover:bg-success/90">
                Update Booking
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-in Sheet — full registration form */}
      <Sheet open={checkInSheetOpen} onOpenChange={setCheckInSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="p-6 pb-0">
            <SheetTitle className="flex items-center gap-2">
              Check In — {checkInBooking?.guestName}
              {checkInBooking?.bookingType === "online" && (
                <Badge className="bg-blue-100 text-blue-700 border border-blue-200">Online Booking</Badge>
              )}
            </SheetTitle>
          </SheetHeader>
          {checkInBooking && (
            <CheckInForm
              bookingId={checkInBooking._id}
              guestName={checkInBooking.guestName}
              bookingType={checkInBooking.bookingType}
              onConfirm={handleCheckInConfirm}
              onCancel={() => { setCheckInSheetOpen(false); setCheckInBooking(null); }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Change Room Dialog */}
      <Dialog open={changeRoomOpen} onOpenChange={setChangeRoomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Room</DialogTitle>
            <DialogDescription>
              Reassign {changeRoomBooking?.guestName} to a different available room.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg border bg-muted/40 text-sm">
            <p className="text-muted-foreground">Current Room</p>
            <p className="font-medium mt-0.5">
              {(changeRoomBooking?.roomId as any)?.roomNumber
                ?? (changeRoomBooking?.roomTypeId as any)?.roomNumber
                ?? (changeRoomBooking?.roomTypeId as any)?.name
                ?? "Not yet assigned"}
            </p>
          </div>

          {changeRoomLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading available rooms...</p>
          ) : changeRoomRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No other rooms available for these dates.</p>
          ) : (
            <div className="space-y-1.5">
              <Label>Select New Room</Label>
              <Select value={changeRoomSelected} onValueChange={setChangeRoomSelected}>
                <SelectTrigger><SelectValue placeholder="Choose a room" /></SelectTrigger>
                <SelectContent>
                  {changeRoomRooms.map((r) => (
                    <SelectItem key={r._id} value={r._id}>
                      Room {r.roomNumber} — {r.roomTypeId?.name} (₦{r.roomTypeId?.price?.toLocaleString()}/night)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setChangeRoomOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={confirmChangeRoom}
              disabled={!changeRoomSelected || changeRoomLoading}
            >
              {changeRoomLoading ? "Saving..." : "Change Room"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-out Confirmation Modal */}
      <AlertDialog open={checkOutConfirmOpen} onOpenChange={setCheckOutConfirmOpen}>
        <AlertDialogContent className="z-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Check Out Guest?</AlertDialogTitle>
            <AlertDialogDescription>
              {bookingToCheckOut && (
                <div className="space-y-2 mt-4">
                  <p><strong>Guest:</strong> {bookingToCheckOut.guestName}</p>
                  <p>
                    <strong>Room:</strong> {bookingToCheckOut.roomTypeId?.roomNumber || 'N/A'}
                  </p>
                  <p>
                    <strong>Check-out Date:</strong>{" "}
                    {new Date(bookingToCheckOut.checkOutDate).toLocaleDateString()}
                  </p>
                  <p className="mt-4 text-sm">
                    This will mark the booking as completed and make the room available for new bookings.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBookingToCheckOut(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCheckOut}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Confirm Check-out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Booking Details Modal */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-50">
          <DialogHeader>
            <DialogTitle>Complete Booking Details</DialogTitle>
          </DialogHeader>
          {viewingBooking && (
            <div className="space-y-4">
              {/* Status bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={cn(
                      "text-xs border",
                      statusConfig[viewingBooking.bookingStatus]?.className ?? ""
                    )}
                  >
                    {statusConfig[viewingBooking.bookingStatus]?.label ||
                      viewingBooking.bookingStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Booking Type</p>
                  <Badge
                    variant={viewingBooking.bookingType === 'walk-in' ? 'secondary' : 'default'}
                  >
                    {viewingBooking.bookingType === 'walk-in' ? '🚶 Walk-in' : '💻 Online'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <Badge
                    className={cn(
                      "text-xs border",
                      paymentConfig[viewingBooking.paymentStatus]?.className ?? ""
                    )}
                  >
                    {paymentConfig[viewingBooking.paymentStatus]?.label ||
                      viewingBooking.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-sm">{viewingBooking._id.substring(0, 8)}...</p>
                </div>
              </div>

              {/* Checkout countdown for checked-in bookings */}
              {viewingBooking.bookingStatus === "checked-in" && (
                <div className="py-3 bg-red-50 dark:bg-red-900/10 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <CheckoutCountdownTimer booking={viewingBooking} />
                </div>
              )}

              {/* Guest Information */}
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

              {/* Room & Dates */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BedDouble className="h-4 w-4" />
                  Room & Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-muted rounded">
                  <div>
                    <p className="text-xs text-muted-foreground">Room Number</p>
                    <p className="font-medium text-lg">
                      {viewingBooking.roomTypeId?.roomNumber || 'TBA'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Room Type</p>
                    <p className="font-medium">{viewingBooking.roomTypeId?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in Date</p>
                    <p className="font-medium">
                      {new Date(viewingBooking.checkInDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out Date</p>
                    <p className="font-medium">
                      {new Date(viewingBooking.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment & Pricing */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Payment & Pricing
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-muted rounded">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="font-bold text-primary text-lg">
                      ₦{viewingBooking.totalAmount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount Paid</p>
                    <p className="font-medium">
                      ₦{(viewingBooking.amountPaid || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="font-medium">
                      ₦{(
                        viewingBooking.totalAmount - (viewingBooking.amountPaid || 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              {viewingBooking.guestDetails &&
                (viewingBooking.guestDetails.address ||
                  viewingBooking.guestDetails.city ||
                  viewingBooking.guestDetails.state) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address Information
                    </h3>
                    <div className="p-3 bg-muted rounded space-y-2 text-sm">
                      {viewingBooking.guestDetails.address && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Street Address:</span>
                          <span className="font-medium text-right">
                            {viewingBooking.guestDetails.address}
                          </span>
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
                          <span className="font-medium">
                            {viewingBooking.guestDetails.arrivingFrom}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Emergency Contact */}
              {viewingBooking.guestDetails &&
                (viewingBooking.guestDetails.nextOfKinName ||
                  viewingBooking.guestDetails.nextOfKinPhone) && (
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Emergency Contact
                    </h3>
                    <div className="p-3 bg-muted rounded space-y-2 text-sm">
                      {viewingBooking.guestDetails.nextOfKinName && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium">
                            {viewingBooking.guestDetails.nextOfKinName}
                          </span>
                        </div>
                      )}
                      {viewingBooking.guestDetails.nextOfKinPhone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">
                            {viewingBooking.guestDetails.nextOfKinPhone}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Room Preferences */}
              {viewingBooking.preferences &&
                (viewingBooking.preferences.extraBedding ||
                  viewingBooking.preferences.specialRequests) && (
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
                          <p className="font-medium italic">
                            {viewingBooking.preferences.specialRequests}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Confirmation Code (Online Bookings) */}
              {viewingBooking.bookingType === 'online' && viewingBooking.confirmationCode && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900 mb-1">Confirmation Code</p>
                  <p className="font-mono text-lg text-blue-900">
                    {viewingBooking.confirmationCode}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="p-3 bg-muted rounded text-xs text-muted-foreground space-y-1">
                <div>Created: {new Date(viewingBooking.createdAt).toLocaleString()}</div>
                {viewingBooking.updatedAt && (
                  <div>Last Updated: {new Date(viewingBooking.updatedAt).toLocaleString()}</div>
                )}
              </div>

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

      {/* Bookings Table Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredBookings.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="checked-in">Checked In ({checkedIn.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelled.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">{renderTable(filteredBookings)}</TabsContent>
        <TabsContent value="confirmed">{renderTable(confirmed)}</TabsContent>
        <TabsContent value="checked-in">{renderTable(checkedIn)}</TabsContent>
        <TabsContent value="pending">{renderTable(pending)}</TabsContent>
        <TabsContent value="completed">{renderTable(completed)}</TabsContent>
        <TabsContent value="cancelled">{renderTable(cancelled)}</TabsContent>
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
