import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Calendar, Search, X, Eye, Book, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useStaffStore } from "../../store/useUserStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Booking {
  _id: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  totalAmount: number;
  roomTypeId?: {
    roomNumber: string;
    name: string;
  };
  hotelId?: {
    name: string;
  };
}

interface GuestWithBookings {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  bookings?: Booking[];
  totalBookings?: number;
  upcomingBookings?: number;
  pastBookings?: number;
}

export default function Users() {
  const guests = useStaffStore((state) => state.guests);
  const isLoading = useStaffStore((state) => state.isLoading);
  const error = useStaffStore((state) => state.error);
  const fetchGuests = useStaffStore((state: any) => state.fetchGuests);

  // ✅ Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // ✅ Booking modal state
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean;
    guest: GuestWithBookings | null;
    isLoadingBookings: boolean;
  }>({
    open: false,
    guest: null,
    isLoadingBookings: false,
  });

  useEffect(() => {
    if (!guests.length) fetchGuests();
  }, []);

  // ✅ Fetch guest bookings
  const fetchGuestBookings = async (guestId: string, guestInfo: any) => {
    setBookingDialog({
      open: true,
      guest: { ...guestInfo, bookings: [], totalBookings: 0, upcomingBookings: 0, pastBookings: 0 },
      isLoadingBookings: true,
    });

    try {
      const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
      const token = sessionStorage.getItem('token');

      const response = await fetch(`${VITE_API_URL}/api/bookings/guest/${guestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      const bookings: Booking[] = data.data || [];

      // Calculate stats
      const now = new Date();
      const upcoming = bookings.filter(b => new Date(b.checkInDate) > now && b.bookingStatus !== 'cancelled');
      const past = bookings.filter(b => new Date(b.checkOutDate) < now || b.bookingStatus === 'checked-out');

      setBookingDialog({
        open: true,
        guest: {
          ...guestInfo,
          bookings,
          totalBookings: bookings.length,
          upcomingBookings: upcoming.length,
          pastBookings: past.length,
        },
        isLoadingBookings: false,
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch guest bookings');
      setBookingDialog({
        open: false,
        guest: null,
        isLoadingBookings: false,
      });
    }
  };

  // ✅ Handle view bookings
  const handleViewBookings = (guest: any) => {
    fetchGuestBookings(guest._id, guest);
  };

  // ✅ Filter guests based on search and status
  const filteredGuests = guests.filter((guest) => {
    // Search filter
    const matchesSearch = 
      guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.phoneNumber.includes(searchQuery);

    // Status filter
    const matchesStatus = 
      statusFilter === "all" ||
      (statusFilter === "active" && guest.isActive) ||
      (statusFilter === "inactive" && !guest.isActive);

    return matchesSearch && matchesStatus;
  });

  // ✅ Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // ✅ Check if filters are active
  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Guest Management</h1>
          <p className="text-muted-foreground">View and manage registered guests</p>
        </div>
      </div>

      {/* ✅ Search and Filter Section */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleClearFilters}
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* ✅ Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchQuery}"
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setSearchQuery("")}
                  />
                </Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Status: {statusFilter}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => setStatusFilter("all")}
                  />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Results Count */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredGuests.length} of {guests.length} guest{guests.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* --- LOADING SKELETON --- */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="border-muted animate-pulse bg-muted/40"
            >
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="h-5 w-3/4 bg-muted rounded-md" />
                  <div className="h-4 w-1/3 bg-muted rounded-md" />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    <div className="h-3 w-2/3 bg-muted rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    <div className="h-3 w-1/2 bg-muted rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted rounded-full" />
                    <div className="h-3 w-1/3 bg-muted rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- ERROR STATE --- */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-destructive">Error: {error}</p>
        </div>
      )}

      {/* --- EMPTY STATE (No guests at all) --- */}
      {!isLoading && !error && guests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No guests found.</p>
        </div>
      )}

      {/* ✅ NO RESULTS STATE (Guests exist but filter returned nothing) */}
      {!isLoading && !error && guests.length > 0 && filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg mb-2">No guests match your filters</p>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
        </div>
      )}

      {/* --- DATA DISPLAY --- */}
      {!isLoading && !error && filteredGuests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuests.map((user, index) => (
            <Card
              key={user._id}
              className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">
                      {user.firstName} {user.lastName}
                    </h3>
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phoneNumber}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* View Bookings Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => handleViewBookings(user)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Bookings
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      <Dialog
        open={bookingDialog.open}
        onOpenChange={(open) => {
          if (!open) setBookingDialog({ open: false, guest: null, isLoadingBookings: false });
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Booking History - {bookingDialog.guest?.firstName} {bookingDialog.guest?.lastName}
            </DialogTitle>
            <DialogDescription>
              Complete booking history and statistics for this guest
            </DialogDescription>
          </DialogHeader>

          {bookingDialog.isLoadingBookings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded-lg">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : bookingDialog.guest ? (
            <div className="space-y-6">
              {/* Booking Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-3xl font-bold text-primary">{bookingDialog.guest.totalBookings || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                    <p className="text-3xl font-bold text-blue-600">{bookingDialog.guest.upcomingBookings || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Past Bookings</p>
                    <p className="text-3xl font-bold text-gray-600">{bookingDialog.guest.pastBookings || 0}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bookings List */}
              {!bookingDialog.guest.bookings || bookingDialog.guest.bookings.length === 0 ? (
                <div className="text-center py-12 border rounded-lg">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No bookings found for this guest</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">All Bookings</h3>
                  {bookingDialog.guest.bookings.map((booking) => {
                    const isUpcoming = new Date(booking.checkInDate) > new Date() && booking.bookingStatus !== 'cancelled';
                    const isPast = new Date(booking.checkOutDate) < new Date() || booking.bookingStatus === 'checked-out';

                    return (
                      <Card key={booking._id} className={isPast ? 'opacity-75' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold">{booking.hotelId?.name || 'Hotel'}</h4>
                                {isUpcoming && (
                                  <Badge className="bg-blue-500">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Upcoming
                                  </Badge>
                                )}
                                {isPast && (
                                  <Badge variant="secondary">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Past
                                  </Badge>
                                )}
                                <Badge
                                  variant={
                                    booking.bookingStatus === 'confirmed' ? 'default' :
                                    booking.bookingStatus === 'checked-in' ? 'default' :
                                    booking.bookingStatus === 'cancelled' ? 'destructive' :
                                    'secondary'
                                  }
                                >
                                  {booking.bookingStatus}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium">Room:</span> {booking.roomTypeId?.roomNumber || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Check-in:</span> {new Date(booking.checkInDate).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Check-out:</span> {new Date(booking.checkOutDate).toLocaleDateString()}
                                </div>
                                <div>
                                  <span className="font-medium">Amount:</span> ₦{booking.totalAmount.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}