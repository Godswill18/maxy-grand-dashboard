import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, CheckCircle, XCircle, Plus, Minus, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useCheckInStore } from "@/store/useCheckInStore";
import { useBookingStore } from "@/store/useBookingStore"; // NEW: Import booking store
import { useAuthStore } from "@/store/useAuthStore"; // NEW: Import auth store
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { format } from "date-fns";

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const fetchUserByEmail = async (email: string) => {
  try {
    const response = await fetch(`${VITE_API_URL}/api/users/find-by-email?email=${email}`, {
      method: 'GET',
      credentials: 'include',
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Verification failed.");
    const data = await response.json();
    return data.data;
  } catch (error) {
    toast.error((error as Error).message || "Could not verify user.");
    return null;
  }
};

const fetchAvailableRooms = async (checkInDate: Date, checkOutDate: Date) => {
  try {
    const response = await fetch(`${VITE_API_URL}/api/receptionist/rooms/available-range`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
      }),
    });
    
    if (!response.ok) throw new Error("Failed to fetch available rooms");
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    toast.error((error as Error).message || "Could not fetch available rooms");
    return [];
  }
};

interface BookGuestFormProps {
  guestName?: string;
  bookingId?: string;
  initialEmail?: string;
  initialPhone?: string;
  bookingType?: 'online' | 'walk-in';
  onConfirm: (formData: any) => Promise<void>;
  onCancel: () => void;
}

export default function BookGuestForm({ 
  guestName = "", 
  bookingId = "", 
  initialEmail = "", 
  initialPhone = "", 
  bookingType = 'walk-in',
  onConfirm, 
  onCancel 
}: BookGuestFormProps) {
  const { createGuestAccountAndCheckIn, verifyConfirmationCode } = useCheckInStore();
  const { createBooking } = useBookingStore(); // NEW: Get createBooking from store
  const { user } = useAuthStore(); // NEW: Get user for hotelId
  const [currentTab, setCurrentTab] = useState<"guest" | "booking">("guest");
  const [isLoading, setIsLoading] = useState(false);
  
  // Guest Form State
  const [isNewGuest, setIsNewGuest] = useState(true);
  const [isUserFound, setIsUserFound] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'verified' | 'notfound'>('idle');
  
  // Booking Form State
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [checkInDate, setCheckInDate] = useState<Date>(new Date());
  const [checkOutDate, setCheckOutDate] = useState<Date>(new Date(Date.now() + 86400000)); // Tomorrow

  const [guestData, setGuestData] = useState({
    firstName: "",
    lastName: "",
    email: initialEmail,
    phoneNumber: initialPhone,
    password: "",
    userId: "",
  });

  const [bookingData, setBookingData] = useState({
    numberOfGuests: 2,
    specialRequests: "",
    address: "",
    city: "",
    state: "",
    arrivingFrom: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    extraBedding: false,
  });

  useEffect(() => {
    if (guestName) {
      const parts = guestName.split(" ");
      setGuestData(prev => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      }));
    }
  }, [guestName]);

  useEffect(() => {
    if (initialEmail) {
      setIsNewGuest(false);
      handleEmailVerification();
    }
  }, []);

  const handleGuestDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGuestData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'email' && emailStatus !== 'idle') {
      setEmailStatus('idle');
      setIsUserFound(false);
      setGuestData(prev => ({ ...prev, userId: "" }));
    }
  };

  const handleBookingDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailVerification = async () => {
    if (!guestData.email) return toast.error("Email is required for verification.");
    setIsVerifying(true);
    setEmailStatus('loading');
   
    const user = await fetchUserByEmail(guestData.email);
    if (user) {
      setIsUserFound(true);
      setGuestData(prev => ({
        ...prev,
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        password: "",
      }));
      toast.success(`User ${user.firstName} found. Guest account ready.`);
      setEmailStatus('verified');
    } else {
      setIsUserFound(false);
      setGuestData(prev => ({ ...prev, userId: "" }));
      toast.warning("New guest. Please fill in account details.");
      setEmailStatus('notfound');
    }
    setIsVerifying(false);
  };

  const handleSearchRooms = async () => {
    if (!checkInDate || !checkOutDate) {
      return toast.error("Please select check-in and check-out dates");
    }

    if (checkOutDate <= checkInDate) {
      return toast.error("Check-out date must be after check-in date");
    }

    setLoadingRooms(true);
    const rooms = await fetchAvailableRooms(checkInDate, checkOutDate);
    setAvailableRooms(rooms);
    setLoadingRooms(false);

    if (rooms.length === 0) {
      toast.warning("No rooms available for selected dates");
    } else {
      toast.success(`Found ${rooms.length} available room(s)`);
    }
  };

  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const calculateTotalAmount = () => {
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    return selectedRooms.reduce((total, roomId) => {
      const room = availableRooms.find(r => r._id === roomId);
      return total + (room?.roomTypeId?.price || 0) * nights;
    }, 0);
  };

  const handleNext = () => {
    if (currentTab === "guest") {
      // Validate guest data
      if (isNewGuest && !isUserFound) {
        const { email, firstName, lastName, phoneNumber, password } = guestData;
        if (!email || !firstName || !lastName || !phoneNumber || !password) {
          return toast.error("Please fill in all guest account fields");
        }
      }
      setCurrentTab("booking");
    }
  };

  const handleBack = () => {
    if (currentTab === "booking") {
      setCurrentTab("guest");
    }
  };

  const handleSubmit = async () => {
    // Validate booking data
    if (selectedRooms.length === 0) {
      return toast.error("Please select at least one room");
    }

    if (bookingData.numberOfGuests < 1) {
      return toast.error("Number of guests must be at least 1");
    }

    if (!user?.hotelId) {
      return toast.error("Hotel information not found. Please log in again.");
    }

    setIsLoading(true);
    try {
      let finalUserId = guestData.userId;
      
      // Create account if new guest and not found
      if (isNewGuest && !isUserFound) {
        const { firstName, lastName, email, phoneNumber, password } = guestData;
        
        if (!firstName || !lastName || !email || !phoneNumber || !password) {
          setIsLoading(false);
          return toast.error("Please fill in all required guest fields");
        }

        finalUserId = await createGuestAccountAndCheckIn({
          firstName,
          lastName,
          email,
          phoneNumber,
          password,
        });
      }

      // Calculate totals
      const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalAmount = calculateTotalAmount();
      
      // Get primary room details
      const primaryRoom = availableRooms.find(r => r._id === selectedRooms[0]);
      
      // Prepare booking payload matching your backend schema
      const bookingPayload = {
        hotelId: user.hotelId,
        roomId: selectedRooms[0], // Primary room ID
        guestId: finalUserId || null, // Link to user account if exists
        guestName: `${guestData.firstName} ${guestData.lastName}`,
        guestEmail: guestData.email,
        guestPhone: guestData.phoneNumber,
        checkInDate: checkInDate.toISOString(),
        checkOutDate: checkOutDate.toISOString(),
        bookingType: bookingType,
        totalAmount: totalAmount,
        amountPaid: 0, // Initial payment
        paymentStatus: 'pending',
        bookingStatus: 'confirmed',
        numberOfGuests: bookingData.numberOfGuests,
        specialRequests: bookingData.specialRequests,
        
        // Guest details for check-in
        guestDetails: {
          address: bookingData.address,
          city: bookingData.city,
          state: bookingData.state,
          arrivingFrom: bookingData.arrivingFrom,
          nextOfKinName: bookingData.nextOfKinName,
          nextOfKinPhone: bookingData.nextOfKinPhone,
        },
        
        // Preferences
        preferences: {
          extraBedding: bookingData.extraBedding,
          specialRequests: bookingData.specialRequests,
        }
      };

      // Create the booking using the store
      await createBooking(bookingPayload);
      
      // If multiple rooms selected, create additional bookings
      if (selectedRooms.length > 1) {
        for (let i = 1; i < selectedRooms.length; i++) {
          const additionalRoom = availableRooms.find(r => r._id === selectedRooms[i]);
          const additionalNights = nights;
          const additionalAmount = (additionalRoom?.roomTypeId?.price || 0) * additionalNights;
          
          const additionalBookingPayload = {
            ...bookingPayload,
            roomId: selectedRooms[i],
            totalAmount: additionalAmount,
            guestName: `${guestData.firstName} ${guestData.lastName} (Additional Room ${i})`,
          };
          
          await createBooking(additionalBookingPayload);
        }
      }

      toast.success(`Booking created successfully! ${selectedRooms.length} room(s) booked.`);
      
      // Call the onConfirm callback to close dialog and refresh
      if (onConfirm) {
        await onConfirm(bookingPayload);
      }
      
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error(error.message || "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
      {/* Header with Booking Type Badge */}
      <div className="flex items-center justify-between mb-4 sticky top-0 bg-background z-10 pb-2 border-b">
        <h3 className="text-lg font-semibold">New Booking</h3>
        <Badge variant={bookingType === 'online' ? 'default' : 'secondary'}>
          {bookingType === 'online' ? 'Online Booking' : 'Walk-in'}
        </Badge>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => setCurrentTab(value as "guest" | "booking")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="guest">1. Guest Details</TabsTrigger>
          <TabsTrigger value="booking" disabled={isNewGuest && !isUserFound && emailStatus !== 'verified'}>
            2. Booking Details
          </TabsTrigger>
        </TabsList>

        {/* =============== GUEST TAB =============== */}
        <TabsContent value="guest" className="space-y-4">
          {/* Toggle: New Guest or Existing Guest */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Guest Type</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="guest-toggle" className="text-sm">
                    {isNewGuest ? "New Guest" : "Existing Guest"}
                  </Label>
                  <Switch
                    id="guest-toggle"
                    checked={!isNewGuest}
                    onCheckedChange={(checked) => setIsNewGuest(!checked)}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Existing Guest Lookup */}
          {!isNewGuest && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4 space-y-3">
                <Label className="text-black">Search Existing Guest by Email</Label>
                <div className="flex gap-2">
                  <Input
                    name="email"
                    placeholder="guest@example.com"
                    value={guestData.email}
                    onChange={handleGuestDataChange}
                    onBlur={handleEmailVerification}
                    disabled={isUserFound || isVerifying}
                  />
                  <Button 
                    onClick={handleEmailVerification} 
                    disabled={isVerifying || isUserFound}
                    size="sm"
                  >
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                
                {emailStatus !== 'idle' && (
                  <div className="flex items-center gap-1">
                    {emailStatus === 'loading' ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : emailStatus === 'verified' ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500" />
                    )}
                    <p className={`text-xs ${emailStatus === 'verified' ? 'text-green-600' : 'text-red-600'}`}>
                      {emailStatus === 'verified' ? 'Guest found' : 'Guest not found'}
                    </p>
                  </div>
                )}

                {isUserFound && (
                  <div className="pt-2 space-y-2 border-t">
                    <p className="text-sm font-medium">Guest Information:</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium text-black">{guestData.firstName} {guestData.lastName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium text-black">{guestData.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* New Guest Account Creation */}
          {isNewGuest && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create Guest Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input name="firstName" value={guestData.firstName} onChange={handleGuestDataChange} />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input name="lastName" value={guestData.lastName} onChange={handleGuestDataChange} />
                  </div>
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input name="email" type="email" value={guestData.email} onChange={handleGuestDataChange} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input name="phoneNumber" value={guestData.phoneNumber} onChange={handleGuestDataChange} />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input 
                      name="password" 
                      type="password" 
                      placeholder="Create password"
                      value={guestData.password} 
                      onChange={handleGuestDataChange} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Guest Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Additional Details (Optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Address</Label>
                  <Input name="address" value={bookingData.address} onChange={handleBookingDataChange} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input name="city" value={bookingData.city} onChange={handleBookingDataChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Input name="state" value={bookingData.state} onChange={handleBookingDataChange} />
                </div>
                <div>
                  <Label>Arriving From</Label>
                  <Input name="arrivingFrom" placeholder="Airport, City, etc." value={bookingData.arrivingFrom} onChange={handleBookingDataChange} />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="font-medium text-sm">Next of Kin</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input name="nextOfKinName" value={bookingData.nextOfKinName} onChange={handleBookingDataChange} />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input name="nextOfKinPhone" value={bookingData.nextOfKinPhone} onChange={handleBookingDataChange} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleNext}>
              Next: Booking Details
            </Button>
          </div>
        </TabsContent>

        {/* =============== BOOKING TAB =============== */}
        <TabsContent value="booking" className="space-y-4">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Check-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(checkInDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkInDate}
                        onSelect={(date) => date && setCheckInDate(date)}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Check-out Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(checkOutDate, "PPP")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={checkOutDate}
                        onSelect={(date) => date && setCheckOutDate(date)}
                        disabled={(date) => date <= checkInDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button onClick={handleSearchRooms} disabled={loadingRooms} className="w-full">
                {loadingRooms ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search Available Rooms
              </Button>
            </CardContent>
          </Card>

          {/* Room Selection */}
          {availableRooms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Room(s)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedRooms.length} room(s) selected
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {availableRooms.map((room) => (
                  <div
                    key={room._id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRooms.includes(room._id)
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                    onClick={() => toggleRoomSelection(room._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Room {room.roomNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {room.roomTypeId?.name} - {room.roomTypeId?.capacity} Guests
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₦{room.roomTypeId?.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">per night</p>
                      </div>
                    </div>
                    {selectedRooms.includes(room._id) && (
                      <CheckCircle className="h-5 w-5 text-primary absolute top-3 right-3" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Number of guests</Label>
                <Input
                  type="number"
                  name="numberOfGuests"
                  min="1"
                  value={bookingData.numberOfGuests}
                  onChange={handleBookingDataChange}
                />
              </div>

              <div className="flex items-center justify-between border p-3 rounded-md">
                <Label>Extra Bedding Required?</Label>
                <Switch
                  checked={bookingData.extraBedding}
                  onCheckedChange={(checked) => setBookingData(prev => ({ ...prev, extraBedding: checked }))}
                />
              </div>

              <div>
                <Label>Special Requests</Label>
                <Textarea
                  name="specialRequests"
                  placeholder="Any special requirements..."
                  value={bookingData.specialRequests}
                  onChange={handleBookingDataChange}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          {selectedRooms.length > 0 && (
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Dates:</span>
                  <span className="font-medium">
                    {format(checkInDate, "MMM dd")} - {format(checkOutDate, "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nights:</span>
                  <span className="font-medium">
                    {Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Room(s):</span>
                  <span className="font-medium">{selectedRooms.length}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">
                    ₦{calculateTotalAmount().toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading || selectedRooms.length === 0} className="flex-1">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Booking
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" className="w-full" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  );
}