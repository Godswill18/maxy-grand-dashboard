import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { BedDouble, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
// Import the new store and room type
import { useRoomStore as useRecepRoomStore, ReceptionistRoom } from "@/store/useRecepRoomStore"; // <-- Renamed store

// ===================================================================
// REFACTORED DIALOG COMPONENT
// ===================================================================
interface AssignRoomDialogProps {
  room: ReceptionistRoom;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

function AssignRoomDialog({ room, open, onOpenChange }: AssignRoomDialogProps) {
  const [bookingId, setBookingId] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const { checkIn, isLoading } = useRecepRoomStore(); // <-- Use renamed store

  const handleSubmit = async () => {
    if (!bookingId || !confirmationCode) {
      toast.error("Please fill in both Booking ID and Confirmation Code.");
      return;
    }

    const result = await checkIn(bookingId, confirmationCode);
    if (result.success) {
      onOpenChange(false); // Close dialog on success
      setBookingId(""); // Reset fields
      setConfirmationCode("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          Assign Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Room {room.roomNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="bookingId">Booking ID</Label>
            <Input 
              id="bookingId" 
              placeholder="Enter booking ID (e.g., BK-1005)" 
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmationCode">Confirmation Code</Label>
            <Input 
              id="confirmationCode" 
              placeholder="Enter confirmation code" 
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===================================================================
// MAIN RECEPTIONIST COMPONENT
// ===================================================================
export default function RoomReceptionist() {
  // --- Get state from Zustand store ---
  const { rooms, isLoading, error, fetchRooms } = useRecepRoomStore(); // <-- Use renamed store

  // --- Local state for filters and dialogs ---
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [openDialogs, setOpenDialogs] = useState<Record<string, boolean>>({});

  // --- Fetch data on component mount ---
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // --- Helper Functions (Updated) ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-success/10 text-success hover:bg-success/20";
      case "occupied": return "bg-error/10 text-error hover:bg-error/20";
      case "reserved": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "cleaning": return "bg-info/10 text-info hover:bg-info/20"; // Added
      case "maintenance": return "bg-muted text-muted-foreground hover:bg-muted";
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

  // --- Filtering Logic (Updated) ---
  const filteredRooms = rooms.filter(room => {
    const guestName = room.currentBookingId?.guestName || "";
    const bookingId = room.currentBookingId?._id || "";

    const matchesSearch = 
      room.roomNumber.includes(searchQuery) ||
      guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookingId.toLowerCase().includes(searchQuery.toLowerCase());
      
    // FIX: Add a check for room.roomTypeId to prevent crash if data is bad
    const matchesType = filterType === "all" || (room.roomTypeId && room.roomTypeId.name === filterType);
    const matchesStatus = filterStatus === "all" || room.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // --- Stats Calculation (Updated) ---
  const stats = {
    available: rooms.filter(r => r.status === "available").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    reserved: rooms.filter(r => r.status === "reserved").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length, // Added
    maintenance: rooms.filter(r => r.status === "maintenance").length,
  };

  // --- Render Loading and Error States ---
  if (isLoading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading Rooms...</span>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Rooms</h1>
        <p className="text-muted-foreground">Manage room availability and guest assignments</p>
      </div>

      {/* Stats Cards (Added Cleaning) */}
      <div className="grid gap-4 md:grid-cols-5">
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
            <p className="text-sm text-muted-foreground">Cleaning</p>
            <p className="text-3xl font-bold text-info">{stats.cleaning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Maintenance</p>
            <p className="text-3xl font-bold text-muted-foreground">{stats.maintenance}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter UI (Added Cleaning) */}
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

      {/* Room Grid (Updated to new data structure) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <Card key={room._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                <Badge className={getStatusColor(room.status)}>
                  {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center p-6 bg-primary/5 rounded-lg">
                <BedDouble className="h-16 w-16 text-primary" />
              </div>

              {/* Room Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  {/* Add check for roomTypeId before accessing name */}
                  <Badge className={getTypeColor(room.roomTypeId?.name)}>
                    {room.roomTypeId?.name || "N/A"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Capacity:</span>
                  <span className="font-medium">{room.roomTypeId?.capacity || "N/A"} guests</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price/Night:</span>
                  <span className="font-bold text-primary">
                    ₦{room.roomTypeId?.price?.toLocaleString() || "N/A"}
                  </span>
                </div>
              </div>

              {/* === VVV THIS IS THE NEW/FIXED BLOCK VVV === */}
              {/* Show Reservation Date if Reserved */}
              {room.status === 'reserved' && room.currentBookingId && (
                <div className="p-3 bg-warning/10 rounded-md space-y-1">
                  <p className="text-sm font-bold text-warning-foreground">
                    Reserved for: {new Date(room.checkInDate!).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm font-medium">Guest: {room.currentBookingId.guestName}</p>
                  <p className="text-xs text-muted-foreground">Booking: {room.currentBookingId._id}</p>
                </div>
              )}

              {/* Show Guest Info if Occupied */}
              {room.status === 'occupied' && room.currentBookingId && (
                <div className="p-3 bg-error/10 rounded-md"> {/* Matches "Occupied" badge color */}
                  <p className="text-sm font-medium">Guest: {room.currentBookingId.guestName}</p>
                  <p className="text-xs text-muted-foreground">Booking: {room.currentBookingId._id}</p>
                </div>
              )}
              {/* === ^^^ END OF NEW/FIXED BLOCK ^^^ === */}


              {/* Amenities (Fixed and de-duplicated) */}
              <div className="flex flex-wrap gap-2">
                {room.roomTypeId && Array.isArray(room.roomTypeId.amenities) 
                  ? room.roomTypeId.amenities.map((amenity, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-muted rounded-full">
                        {amenity}
                      </span>
                    ))
                  : (
                    <span className="text-xs text-muted-foreground italic">No amenities listed.</span>
                  )
                }
              </div>

              {/* Dialog (Updated) */}
              {room.status === "available" && (
                <AssignRoomDialog 
                  room={room}
                  open={openDialogs[room._id] || false}
                  onOpenChange={(isOpen) => 
                    setOpenDialogs(prev => ({ ...prev, [room._id]: isOpen }))
                  }
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}