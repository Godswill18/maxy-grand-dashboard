import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { BedDouble, Search, Loader2, Clock, ArrowRightLeft, AlertTriangle, Eye, Settings } from "lucide-react";
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
    <div className={`flex items-center gap-2 text-sm font-bold ${isOverdue ? 'text-red-700' : 'text-green-700'}`}>
      <Clock className="h-5 w-5" />
      {isOverdue ? (
        <span className="text-base">Overdue: {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
      ) : (
        <span className="text-base">Checkout: {pad(timeLeft.hours)}:{pad(timeLeft.minutes)}:{pad(timeLeft.seconds)}</span>
      )}
    </div>
  );
};

// Occupant Details Dialog
interface OccupantDetailsDialogProps {
  room: ReceptionistRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function OccupantDetailsDialog({ room, open, onOpenChange }: OccupantDetailsDialogProps) {
  const booking = room.currentBookingId;
  
  if (!booking) return null;

  const checkInDate = new Date(room.checkInDate || '');
  const checkOutDate = new Date(room.checkOutDate || '');
  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = (room.roomTypeId?.price || 0) * nights;

  // Check if overdue
  const checkoutTime = new Date(room.checkOutDate || '');
  checkoutTime.setHours(12, 0, 0, 0);
  const isOverdue = new Date() > checkoutTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Occupant Details - Room {room.roomNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Alert */}
          {isOverdue && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Checkout Overdue!</p>
                <p>This guest has exceeded their checkout time.</p>
              </div>
            </div>
          )}

          {/* Guest Information */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">Guest Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-blue-600 mb-1">Guest Name</p>
                <p className="text-sm font-medium text-blue-900">{booking.guestName}</p>
              </div>
              <div>
                <p className="text-xs text-blue-600 mb-1">Booking ID</p>
                <p className="text-sm font-mono text-blue-900">{booking._id}</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Check-In Date</p>
                <p className="text-sm font-medium">{checkInDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</p>
                <p className="text-xs text-muted-foreground">{checkInDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Check-Out Date</p>
                <p className="text-sm font-medium">{checkOutDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}</p>
                <p className="text-xs text-muted-foreground">12:00 PM</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Number of Nights</p>
                <p className="text-sm font-medium">{nights} {nights === 1 ? 'night' : 'nights'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Booking Status</p>
                <Badge className={isOverdue ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                  {isOverdue ? 'Overdue' : 'Active'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Room Information */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-semibold text-purple-900 mb-3">Room Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-purple-600 mb-1">Room Number</p>
                <p className="text-sm font-medium text-purple-900">{room.roomNumber}</p>
              </div>
              <div>
                <p className="text-xs text-purple-600 mb-1">Room Type</p>
                <p className="text-sm font-medium text-purple-900">{room.roomTypeId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-purple-600 mb-1">Capacity</p>
                <p className="text-sm font-medium text-purple-900">{room.roomTypeId?.capacity || 'N/A'} guests</p>
              </div>
              <div>
                <p className="text-xs text-purple-600 mb-1">Price per Night</p>
                <p className="text-sm font-medium text-purple-900">₦{room.roomTypeId?.price?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>

            {/* Amenities */}
            {room.roomTypeId && Array.isArray(room.roomTypeId.amenities) && room.roomTypeId.amenities.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-purple-600 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {room.roomTypeId.amenities.map((amenity, index) => (
                    <span key={index} className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-sm font-semibold text-green-900 mb-3">Financial Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-green-700">Rate per night</p>
                <p className="text-sm font-medium text-green-900">₦{room.roomTypeId?.price?.toLocaleString() || 'N/A'}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-green-700">Number of nights</p>
                <p className="text-sm font-medium text-green-900">{nights}</p>
              </div>
              <div className="h-px bg-green-200 my-2"></div>
              <div className="flex justify-between items-center">
                <p className="text-sm font-semibold text-green-900">Total Amount</p>
                <p className="text-lg font-bold text-green-900">₦{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Time Remaining */}
          {!isOverdue && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <p className="text-sm font-medium text-amber-900">Time until checkout</p>
                </div>
                <CheckoutCountdown checkOutDate={room.checkOutDate || ''} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Room Reassignment Dialog
interface ReassignRoomDialogProps {
  currentRoom: ReceptionistRoom;
  availableRooms: ReceptionistRoom[];
  onReassign: (currentRoomId: string, newRoomId: string) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ✅ NEW: Room Status Update Dialog
interface UpdateStatusDialogProps {
  room: ReceptionistRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (roomId: string, status: ReceptionistRoom['status']) => Promise<void>;
}

function UpdateStatusDialog({ room, open, onOpenChange, onUpdateStatus }: UpdateStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<ReceptionistRoom['status']>(room.status);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSelectedStatus(room.status);
  }, [room.status, open]);

  const handleUpdateStatus = async () => {
    if (selectedStatus === room.status) {
      return toast.info("Status hasn't changed");
    }

    setIsLoading(true);
    try {
      await onUpdateStatus(room._id, selectedStatus);
      onOpenChange(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: ReceptionistRoom['status']) => {
    switch (status) {
      case 'available':
        return { label: 'Available', color: 'bg-green-100 text-green-800', icon: '✓' };
      case 'occupied':
        return { label: 'Occupied', color: 'bg-green-700 text-white', icon: '●' };
      case 'cleaning':
        return { label: 'Cleaning', color: 'bg-yellow-100 text-yellow-800', icon: '🧹' };
      case 'reserved':
        return { label: 'Reserved', color: 'bg-blue-100 text-blue-800', icon: '📅' };
      case 'maintenance':
        return { label: 'Maintenance', color: 'bg-gray-200 text-gray-800', icon: '🔧' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800', icon: '' };
    }
  };

  const currentStatusInfo = getStatusInfo(room.status);
  const newStatusInfo = getStatusInfo(selectedStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Room Status</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Room Info */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <p className="text-sm font-medium mb-2">Room Details</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Room:</span>
                <span className="ml-2 font-medium">{room.roomNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium">{room.roomTypeId?.name}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Current Status:</span>
                <Badge className={`ml-2 ${currentStatusInfo.color}`}>
                  {currentStatusInfo.icon} {currentStatusInfo.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <Label>Select New Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ReceptionistRoom['status'])}>
              <SelectTrigger>
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">
                  <span className="flex items-center gap-2">
                    <span>✓</span>
                    <span>Available</span>
                  </span>
                </SelectItem>
                <SelectItem value="cleaning">
                  <span className="flex items-center gap-2">
                    <span>🧹</span>
                    <span>Cleaning</span>
                  </span>
                </SelectItem>
                <SelectItem value="maintenance">
                  <span className="flex items-center gap-2">
                    <span>🔧</span>
                    <span>Maintenance</span>
                  </span>
                </SelectItem>
                <SelectItem value="reserved" disabled={!room.currentBookingId}>
                  <span className="flex items-center gap-2">
                    <span>📅</span>
                    <span>Reserved</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Note: "Occupied" status is set automatically during check-in
            </p>
          </div>

          {/* Status Change Preview */}
          {selectedStatus !== room.status && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={currentStatusInfo.color}>
                    {currentStatusInfo.icon} {currentStatusInfo.label}
                  </Badge>
                  <span className="text-blue-600">→</span>
                  <Badge className={newStatusInfo.color}>
                    {newStatusInfo.icon} {newStatusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Warning for occupied rooms */}
          {room.status === 'occupied' && selectedStatus !== 'occupied' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Warning:</p>
                <p>This room is currently occupied. Changing the status may affect the guest's booking.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleUpdateStatus} 
            disabled={isLoading || selectedStatus === room.status}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ✅ Room Status Update Dialog
interface StatusUpdateDialogProps {
  room: ReceptionistRoom;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (roomId: string, newStatus: string) => Promise<void>;
}

function StatusUpdateDialog({ room, open, onOpenChange, onUpdateStatus }: StatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState(room.status);
  const [isLoading, setIsLoading] = useState(false);

  // Reset selected status when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedStatus(room.status);
    }
  }, [open, room.status]);

  const handleUpdateStatus = async () => {
    if (selectedStatus === room.status) {
      return;
    }

    setIsLoading(true);
    try {
      await onUpdateStatus(room._id, selectedStatus);
      onOpenChange(false);
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusInfo = (status: ReceptionistRoom['status']) => {
    switch (status) {
      case 'available':
        return { label: 'Available', color: 'bg-green-200 text-green-800 border-green-400', icon: '✓' };
      case 'occupied':
        return { label: 'Occupied', color: 'bg-green-700 text-white border-green-800', icon: '●' };
      case 'cleaning':
        return { label: 'Cleaning', color: 'bg-yellow-200 text-yellow-800 border-yellow-400', icon: '🧹' };
      case 'reserved':
        return { label: 'Reserved', color: 'bg-blue-200 text-blue-800 border-blue-400', icon: '📅' };
      case 'maintenance':
        return { label: 'Maintenance', color: 'bg-gray-300 text-gray-800 border-gray-500', icon: '🔧' };
      default:
        return { label: status, color: 'bg-gray-200 text-gray-700', icon: '' };
    }
  };

  const currentStatusInfo = getStatusInfo(room.status);
  const newStatusInfo = getStatusInfo(selectedStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Room Status - Room {room.roomNumber}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Current Status</p>
            <Badge className={currentStatusInfo.color}>
              {currentStatusInfo.icon} {currentStatusInfo.label}
            </Badge>
          </div>

          {/* Status Selection */}
          <div>
            <Label>Select New Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ReceptionistRoom['status'])}>
              <SelectTrigger>
                <SelectValue placeholder="Choose status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">✓ Available</SelectItem>
                <SelectItem value="occupied">● Occupied</SelectItem>
                <SelectItem value="cleaning">🧹 Cleaning</SelectItem>
                <SelectItem value="reserved">📅 Reserved</SelectItem>
                <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Change Preview */}
          {selectedStatus !== room.status && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={currentStatusInfo.color}>
                    {currentStatusInfo.icon} {currentStatusInfo.label}
                  </Badge>
                  <span className="text-blue-600">→</span>
                  <Badge className={newStatusInfo.color}>
                    {newStatusInfo.icon} {newStatusInfo.label}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Warning for occupied status */}
          {selectedStatus === 'occupied' && room.status !== 'occupied' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Note:</p>
                <p>Setting status to "Occupied" requires an active booking. Make sure a guest has been checked in.</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleUpdateStatus} 
            disabled={isLoading || selectedStatus === room.status}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
          <div className="p-3  rounded-lg">
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
  const { rooms, isLoading, error, fetchRooms, updateRoomStatus } = useRecepRoomStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [reassignDialogOpen, setReassignDialogOpen] = useState<Record<string, boolean>>({});
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<Record<string, boolean>>({});
  const [statusDialogOpen, setStatusDialogOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchRooms();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchRooms, 30000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // ✅ Professional Color Scheme Function - DEEPER COLORS
  const getRoomCardStyle = (room: ReceptionistRoom) => {
    const baseStyle = "hover:shadow-xl transition-all duration-300 border-2";
    
    // Check if overdue (for occupied rooms)
    if (room.status === 'occupied' && room.checkOutDate) {
      const checkoutTime = new Date(room.checkOutDate);
      checkoutTime.setHours(12, 0, 0, 0);
      const isOverdue = new Date() > checkoutTime;
      
      if (isOverdue) {
        // ✅ DEEP RED for Overdue Checkout
        return `${baseStyle} bg-red-100 border-red-400`;
      }
    }

    switch (room.status) {
      case "available":
        // ✅ NO BACKGROUND for Available (clean white)
        return `${baseStyle} border-gray-300`;
      case "occupied":
        // ✅ DEEP GREEN for Occupied
        return `${baseStyle} bg-green-100 border-green-400`;
      case "cleaning":
        // ✅ DEEP YELLOW for Cleaning
        return `${baseStyle} bg-yellow-100 border-yellow-400`;
      case "reserved":
        // ✅ DEEP Blue for Reserved
        return `${baseStyle} bg-blue-100 border-blue-400`;
      case "maintenance":
        // ✅ DEEP Gray for Maintenance
        return `${baseStyle} bg-gray-200 border-gray-400`;
      default:
        return `${baseStyle} bg-white border-gray-300`;
    }
  };

  const getStatusBadge = (room: ReceptionistRoom) => {
    // Check if overdue
    if (room.status === 'occupied' && room.checkOutDate) {
      const checkoutTime = new Date(room.checkOutDate);
      checkoutTime.setHours(12, 0, 0, 0);
      const isOverdue = new Date() > checkoutTime;
      
      if (isOverdue) {
        return <Badge className="bg-red-200 text-red-800 border-red-400">⚠️ Overdue</Badge>;
      }
    }

    switch (room.status) {
      case "available":
        return <Badge className="bg-green-200 text-green-800 border-green-400">✓ Available</Badge>;
      case "occupied":
        return <Badge className="bg-green-700 text-white border-green-800">● Occupied</Badge>;
      case "cleaning":
        return <Badge className="bg-yellow-200 text-yellow-800 border-yellow-400">🧹 Cleaning</Badge>;
      case "reserved":
        return <Badge className="bg-blue-200 text-blue-800 border-blue-400">📅 Reserved</Badge>;
      case "maintenance":
        return <Badge className="bg-gray-300 text-gray-800 border-gray-500">🔧 Maintenance</Badge>;
      default:
        return <Badge>{room.status}</Badge>;
    }
  };

  // ✅ Get text color based on room status
  const getTextColors = (room: ReceptionistRoom) => {
    // Check if overdue
    if (room.status === 'occupied' && room.checkOutDate) {
      const checkoutTime = new Date(room.checkOutDate);
      checkoutTime.setHours(12, 0, 0, 0);
      const isOverdue = new Date() > checkoutTime;
      
      if (isOverdue) {
        return { text: 'text-red-900', muted: 'text-red-600' };
      }
    }

    switch (room.status) {
      case "occupied":
        return { text: 'text-green-900', muted: 'text-green-600' };
      case "cleaning":
        return { text: 'text-yellow-900', muted: 'text-yellow-600' };
      case "reserved":
        return { text: 'text-blue-900', muted: 'text-blue-600' };
      case "maintenance":
        return { text: 'text-gray-700', muted: 'text-gray-500' };
      default:
        return { text: 'text-gray-400', muted: 'text-muted-foreground' };
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

      {/* ✅ Stats Cards with Deeper Professional Colors */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-gray-300">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Available</p>
            <p className="text-3xl font-bold text-green-700">{stats.available}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-100 border-green-400">
          <CardContent className="p-4">
            <p className="text-sm text-green-800">Occupied</p>
            <p className="text-3xl font-bold text-green-900">{stats.occupied}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-100 border-blue-400">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">Reserved</p>
            <p className="text-3xl font-bold text-blue-900">{stats.reserved}</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-100 border-yellow-400">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">Cleaning</p>
            <p className="text-3xl font-bold text-yellow-900">{stats.cleaning}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-200 border-gray-400">
          <CardContent className="p-4">
            <p className="text-sm text-gray-700">Maintenance</p>
            <p className="text-3xl font-bold text-gray-800">{stats.maintenance}</p>
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

      {/* ✅ Room Grid with Professional Colors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => {
          const colors = getTextColors(room);

          return (
            <Card key={room._id} className={getRoomCardStyle(room)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg ${colors.text}`}>Room {room.roomNumber}</CardTitle>
                  {getStatusBadge(room)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Countdown Timer for Occupied Rooms */}
                {room.status === 'occupied' && room.checkOutDate && (
                  <div className="p-3 rounded-md bg-white/70 backdrop-blur-sm border-2 border-gray-300">
                    <CheckoutCountdown checkOutDate={room.checkOutDate} />
                  </div>
                )}

                <div className={`flex items-center justify-center p-6 rounded-lg ${
                  room.status === 'occupied' && room.checkOutDate && new Date() > new Date(room.checkOutDate) 
                    ? 'bg-red-200' 
                    : room.status === 'occupied' 
                    ? 'bg-green-200' 
                    : room.status === 'cleaning' 
                    ? 'bg-yellow-200' 
                    : 'bg-gray-200'
                }`}>
                  <BedDouble className={`h-16 w-16 ${
                    room.status === 'occupied' && room.checkOutDate && new Date() > new Date(room.checkOutDate)
                      ? 'text-red-700'
                      : room.status === 'occupied'
                      ? 'text-green-700'
                      : room.status === 'cleaning'
                      ? 'text-yellow-700'
                      : 'text-gray-500'
                  }`} />
                </div>

                {/* Room Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.muted}`}>Type:</span>
                    <Badge variant="outline" className={colors.text}>
                      {room.roomTypeId?.name || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.muted}`}>Capacity:</span>
                    <span className={`font-medium ${colors.text}`}>{room.roomTypeId?.capacity || "N/A"} guests</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${colors.muted}`}>Price/Night:</span>
                    <span className={`font-bold ${colors.text}`}>
                      ₦{room.roomTypeId?.price?.toLocaleString() || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Guest Info */}
                {room.currentBookingId && (
                  <div className={`p-3 rounded-md border-2 ${
                    room.status === 'occupied' && room.checkOutDate && new Date() > new Date(room.checkOutDate)
                      ? 'bg-red-200 border-red-400'
                      : 'bg-white/70 border-gray-300'
                  }`}>
                    <p className={`text-sm font-medium ${colors.text}`}>Guest: {room.currentBookingId.guestName}</p>
                    <p className={`text-xs ${colors.muted}`}>Booking: {room.currentBookingId._id}</p>
                  </div>
                )}

                {/* Amenities */}
                <div className="flex flex-wrap gap-2">
                  {room.roomTypeId && Array.isArray(room.roomTypeId.amenities) 
                    ? room.roomTypeId.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className={`text-xs px-2 py-1 rounded-full bg-white/70 border-2 border-gray-300 ${colors.muted}`}>
                          {amenity}
                        </span>
                      ))
                    : null
                  }
                </div>

                {/* Action Buttons for Occupied Rooms */}
                {room.status === "occupied" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setDetailsDialogOpen({ ...detailsDialogOpen, [room._id]: true })}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {availableRooms.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setReassignDialogOpen({ ...reassignDialogOpen, [room._id]: true })}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        Reassign
                      </Button>
                    )}
                  </div>
                )}

                {/* Status Update Button for All Rooms */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setStatusDialogOpen({ ...statusDialogOpen, [room._id]: true })}
                >
                  Update Status
                </Button>
              </CardContent>

              {/* Occupant Details Dialog */}
              {detailsDialogOpen[room._id] && (
                <OccupantDetailsDialog
                  room={room}
                  open={detailsDialogOpen[room._id]}
                  onOpenChange={(open) => setDetailsDialogOpen({ ...detailsDialogOpen, [room._id]: open })}
                />
              )}

              {/* Status Update Dialog */}
              {statusDialogOpen[room._id] && (
                <StatusUpdateDialog
                  room={room}
                  open={statusDialogOpen[room._id]}
                  onOpenChange={(open) => setStatusDialogOpen({ ...statusDialogOpen, [room._id]: open })}
                  onUpdateStatus={updateRoomStatus}
                />
              )}

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