import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { BedDouble, Search, Loader2, Clock, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRoomStore as useRecepRoomStore, ReceptionistRoom } from "@/store/useRecepRoomStore";
import { Skeleton } from "@/components/ui/skeleton";

// Countdown Timer Component
const CheckoutCountdown = ({ checkOutDate }: { checkOutDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const targetDate = new Date(checkOutDate);
    targetDate.setHours(12, 0, 0, 0); // Checkout at 12:00 PM

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance <= 0) {
        setIsOverdue(true);
        const overdueDistance = Math.abs(distance);
        setTimeLeft({
          hours: Math.floor(overdueDistance / (1000 * 60 * 60)),
          minutes: Math.floor((overdueDistance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((overdueDistance % (1000 * 60)) / 1000),
        });
      } else {
        setIsOverdue(false);
        setTimeLeft({
          hours: Math.floor(distance / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [checkOutDate]);

  const pad = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 text-xs font-medium ${isOverdue ? 'text-white' : 'text-white/90'}`}>
      <Clock className="h-3 w-3" />
      {isOverdue ? (
        <span>Overdue: {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
      ) : (
        <span>Checkout: {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
      )}
    </div>
  );
};

// Room Reassignment Dialog
interface ReassignRoomDialogProps {
  currentRoom: ReceptionistRoom;
  availableRooms: ReceptionistRoom[];
  onReassign: (currentRoomId: string, newRoomId: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ReassignRoomDialog({ currentRoom, availableRooms, onReassign, open, onOpenChange }: ReassignRoomDialogProps) {
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReassign = async () => {
    if (!selectedRoomId) {
      return toast.error("Please select a room to reassign");
    }

    setIsLoading(true);
    try {
      await onReassign(currentRoom._id, selectedRoomId);
      onOpenChange(false);
      setSelectedRoomId("");
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoom = availableRooms.find(r => r._id === selectedRoomId);
  const currentPrice = currentRoom.roomTypeId?.price || 0;
  const newPrice = selectedRoom?.roomTypeId?.price || 0;
  const priceDiff = newPrice - currentPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reassign Room {currentRoom.roomNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Room Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium mb-2">Current Room</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Room:</span>
                <span className="ml-2 font-medium">{currentRoom.roomNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium">{currentRoom.roomTypeId?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Guest:</span>
                <span className="ml-2 font-medium">{currentRoom.currentBookingId?.guestName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Price:</span>
                <span className="ml-2 font-medium">₦{currentPrice.toLocaleString()}/night</span>
              </div>
            </div>
          </div>

          {/* New Room Selection */}
          <div>
            <Label>Select New Room</Label>
            <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose available room" />
              </SelectTrigger>
              <SelectContent>
                {availableRooms.map((room) => (
                  <SelectItem key={room._id} value={room._id}>
                    Room {room.roomNumber} - {room.roomTypeId?.name} (₦{room.roomTypeId?.price.toLocaleString()}/night)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price Comparison */}
          {selectedRoom && (
            <div className={`p-3 rounded-lg ${priceDiff > 0 ? 'bg-green-50 border border-green-200' : priceDiff < 0 ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {priceDiff > 0 ? 'Upgrade' : priceDiff < 0 ? 'Downgrade' : 'Same Price'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoom.roomTypeId?.name} - Room {selectedRoom.roomNumber}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${priceDiff > 0 ? 'text-green-600' : priceDiff < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {priceDiff > 0 ? '+' : ''}{priceDiff !== 0 ? `₦${Math.abs(priceDiff).toLocaleString()}` : 'No change'}
                  </p>
                  {priceDiff !== 0 && (
                    <p className="text-xs text-muted-foreground">per night</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Important:</p>
              <p>The guest will be moved to the new room. Ensure payment adjustments are made if there's a price difference.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleReassign} disabled={isLoading || !selectedRoomId}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reassigning...
              </>
            ) : (
              <>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Confirm Reassignment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function RoomReceptionist() {
  const { rooms, isLoading, error, fetchRooms } = useRecepRoomStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reassignDialogOpen, setReassignDialogOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRooms();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Get room background color based on status
  const getRoomCardStyle = (room: ReceptionistRoom) => {
    const baseStyle = "hover:shadow-xl transition-all duration-300";
    
    // Check if overdue (for occupied rooms)
    if (room.status === 'occupied' && room.checkOutDate) {
      const checkoutTime = new Date(room.checkOutDate);
      checkoutTime.setHours(12, 0, 0, 0);
      const isOverdue = new Date() > checkoutTime;
      
      if (isOverdue) {
        return `${baseStyle} bg-gradient-to-br from-[#962E2A] to-[#7a251f] text-white border-[#962E2A]`;
      }
    }

    switch (room.status) {
      case "available":
        return `${baseStyle} bg-gradient-to-br from-[#080205] to-[#1a0f16] text-white border-[#080205]`;
      case "occupied":
        return `${baseStyle} bg-gradient-to-br from-[#00246B] to-[#001a4d] text-white border-[#00246B]`;
      case "cleaning":
        return `${baseStyle} bg-gradient-to-br from-[#E58D2E] to-[#c77424] text-white border-[#E58D2E]`;
      case "reserved":
        return `${baseStyle} bg-gradient-to-br from-[#144058] to-[#0f3244] text-white border-[#144058]`;
      case "maintenance":
        return `${baseStyle} bg-gray-100 border-gray-300`;
      default:
        return `${baseStyle} bg-white border-gray-200`;
    }
  };

  const getStatusBadge = (room: ReceptionistRoom) => {
    // Check if overdue
    if (room.status === 'occupied' && room.checkOutDate) {
      const checkoutTime = new Date(room.checkOutDate);
      checkoutTime.setHours(12, 0, 0, 0);
      const isOverdue = new Date() > checkoutTime;
      
      if (isOverdue) {
        return <Badge className="bg-white/20 text-white border-white/30">Overdue</Badge>;
      }
    }

    const isDark = ['occupied', 'cleaning', 'reserved', 'available'].includes(room.status) || 
                   (room.status === 'occupied' && room.checkOutDate && new Date() > new Date(room.checkOutDate));

    switch (room.status) {
      case "available":
        return <Badge className="bg-white/20 text-white border-white/30">Available</Badge>;
      case "occupied":
        return <Badge className="bg-white/20 text-white border-white/30">Occupied</Badge>;
      case "cleaning":
        return <Badge className="bg-white/20 text-white border-white/30">Cleaning</Badge>;
      case "reserved":
        return <Badge className="bg-white/20 text-white border-white/30">Reserved</Badge>;
      case "maintenance":
        return <Badge className="bg-gray-200 text-gray-700">Maintenance</Badge>;
      default:
        return <Badge>{room.status}</Badge>;
    }
  };

  const filteredRooms = rooms.filter(room => {
    const guestName = room.currentBookingId?.guestName || "";
    const bookingId = room.currentBookingId?._id || "";

    const matchesSearch = 
      room.roomNumber.includes(searchQuery) ||
      guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookingId.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = filterType === "all" || (room.roomTypeId && room.roomTypeId.name === filterType);
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    available: rooms.filter(r => r.status === "available").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    reserved: rooms.filter(r => r.status === "reserved").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length,
    maintenance: rooms.filter(r => r.status === "maintenance").length,
  };

  const handleReassignRoom = async (currentRoomId: string, newRoomId: string) => {
    try {
      // Call your backend API to reassign the room
      const response = await fetch(`${(import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000'}/api/receptionist/rooms/reassign`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentRoomId, newRoomId }),
      });

      if (!response.ok) throw new Error('Failed to reassign room');

      toast.success('Room reassigned successfully!');
      await fetchRooms();
    } catch (error) {
      toast.error('Failed to reassign room. Please try again.');
      throw error;
    }
  };

  if (isLoading && rooms.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full md:w-[180px]" />
          <Skeleton className="h-10 w-full md:w-[180px]" />
        </div>

        {/* Room Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <Skeleton className="h-16 w-16 rounded" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>

                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-error/10 p-4 rounded-lg">
        <h2 className="text-2xl font-bold text-error">Failed to load rooms</h2>
        <p className="text-error">{error}</p>
        <Button onClick={fetchRooms} className="mt-4">Try Again</Button>
      </div>
    );
  }

  const availableRooms = rooms.filter(r => r.status === 'available');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rooms</h1>
        <p className="text-muted-foreground">Manage room availability and guest assignments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card style={{ backgroundColor: '#080205' }}>
          <CardContent className="p-4">
            <p className="text-sm text-white/70">Available</p>
            <p className="text-3xl font-bold text-white">{stats.available}</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#00246B' }}>
          <CardContent className="p-4">
            <p className="text-sm text-white/70">Occupied</p>
            <p className="text-3xl font-bold text-white">{stats.occupied}</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#144058' }}>
          <CardContent className="p-4">
            <p className="text-sm text-white/70">Reserved</p>
            <p className="text-3xl font-bold text-white">{stats.reserved}</p>
          </CardContent>
        </Card>
        <Card style={{ backgroundColor: '#E58D2E' }}>
          <CardContent className="p-4">
            <p className="text-sm text-white/70">Cleaning</p>
            <p className="text-3xl font-bold text-white">{stats.cleaning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Maintenance</p>
            <p className="text-3xl font-bold text-gray-600">{stats.maintenance}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Room Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => {
          const isDark = ['occupied', 'cleaning', 'reserved', 'available'].includes(room.status) || 
                         (room.status === 'occupied' && room.checkOutDate && new Date() > new Date(room.checkOutDate));
          const textColor = isDark ? 'text-white' : 'text-gray-900';
          const mutedColor = isDark ? 'text-white/70' : 'text-muted-foreground';

          return (
            <Card key={room._id} className={getRoomCardStyle(room)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg ${textColor}`}>Room {room.roomNumber}</CardTitle>
                  {getStatusBadge(room)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Countdown Timer for Occupied Rooms */}
                {room.status === 'occupied' && room.checkOutDate && (
                  <div className="p-2 rounded-md bg-white/10 backdrop-blur-sm">
                    <CheckoutCountdown checkOutDate={room.checkOutDate} />
                  </div>
                )}

                <div className="flex items-center justify-center p-6 bg-white/10 rounded-lg backdrop-blur-sm">
                  <BedDouble className={`h-16 w-16 ${isDark ? 'text-white/80' : 'text-primary'}`} />
                </div>

                {/* Room Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${mutedColor}`}>Type:</span>
                    <Badge className={isDark ? 'bg-white/20 text-white border-white/30' : ''}>
                      {room.roomTypeId?.name || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${mutedColor}`}>Capacity:</span>
                    <span className={`font-medium ${textColor}`}>{room.roomTypeId?.capacity || "N/A"} guests</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${mutedColor}`}>Price/Night:</span>
                    <span className={`font-bold ${textColor}`}>
                      ₦{room.roomTypeId?.price?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Guest Info */}
                {room.currentBookingId && (
                  <div className="p-3 bg-white/10 rounded-md backdrop-blur-sm">
                    <p className={`text-sm font-medium ${textColor}`}>Guest: {room.currentBookingId.guestName}</p>
                    <p className={`text-xs ${mutedColor}`}>Booking: {room.currentBookingId._id}</p>
                  </div>
                )}

                {/* Amenities */}
                <div className="flex flex-wrap gap-2">
                  {room.roomTypeId && Array.isArray(room.roomTypeId.amenities) 
                    ? room.roomTypeId.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-white/10 text-white/80' : 'bg-muted'}`}>
                          {amenity}
                        </span>
                      ))
                    : null
                  }
                </div>

                {/* Action Button */}
                {room.status === "occupied" && availableRooms.length > 0 && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => setReassignDialogOpen({ ...reassignDialogOpen, [room._id]: true })}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Reassign Room
                  </Button>
                )}
              </CardContent>

              {/* Reassign Dialog */}
              {reassignDialogOpen[room._id] && (
                <ReassignRoomDialog
                  currentRoom={room}
                  availableRooms={availableRooms}
                  onReassign={handleReassignRoom}
                  open={reassignDialogOpen[room._id]}
                  onOpenChange={(open) => setReassignDialogOpen({ ...reassignDialogOpen, [room._id]: open })}
                />
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}