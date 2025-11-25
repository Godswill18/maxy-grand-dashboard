// src/components/Bookings.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Bed, DollarSign, Loader2, AlertCircle, Trash, Search, CalendarIcon } from "lucide-react";
import { useBookingStore } from "../store/useBookingStore"; 
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BookingCalendar from "@/components/BookingCalendar"; // add at the top
import { format } from "date-fns"; // ensure imported
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar"; // NEW
import { DateRange } from "react-day-picker"; // NEW
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";
import { BookingCardSkeleton, CalendarSkeleton } from "@/components/skeleton/BookingsSkeletion";

// Map bookingStatus to colors
const statusColors: Record<string, string> = {
  confirmed: "bg-success text-success-foreground",
  'checked-in': "bg-blue-500 text-white", // Custom for 'checked-in'
  'checked-out': "bg-gray-500 text-white", // Custom for 'checked-out'
  pending: "bg-warning text-warning-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};



// Helper to format dates
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function Bookings() {
  // --- Get state and actions from Zustand store ---
  const {
    bookings,
    hotels,
    isLoading,
    error,
    fetchBookings,
    fetchHotels,
    updateBookingStatus,
    deleteBooking,
    initSocketListeners,
    closeSocketListeners,
  } = useBookingStore();

  // const useUserHotelContext = () => {
  //     const hotelId = user?.hotelId || null; // Example Hotel ID (should be dynamic)
  //     const token = user?.token || null; // Example Bearer Token (should be dynamic)
  //     return { hotelId, token };
  // };
  
  const { user } = useAuthStore();
  const role = user?.role;
  const defaultHotelId = user?.hotelId;

  // console.log(user)
  
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState(role === 'superadmin' ? '' : defaultHotelId || '');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const canManage = role === 'superadmin';

  // --- Fetch data and set up listeners on mount ---
  useEffect(() => {
    fetchBookings(); // Initial fetch with current selected/default
    initSocketListeners(); // Start listening for real-time updates

    // Clean up listeners on component unmount
    return () => {
      closeSocketListeners();
    };
  }, [fetchBookings, initSocketListeners, closeSocketListeners]);

  useEffect(() => {
    if (role === 'superadmin') {
      fetchHotels();
    }
  }, [role, fetchHotels]);

  // Refetch when hotel changes
  useEffect(() => {
    const hotelIdToUse = role === 'superadmin' ? selectedHotelId : defaultHotelId;
    if (hotelIdToUse) {
      fetchBookings(hotelIdToUse);
      setCurrentPage(1);
    }
  }, [selectedHotelId, role, defaultHotelId, fetchBookings]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, statusFilter]);

  // --- Filtered and paginated bookings using useMemo ---
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter((booking) => booking.bookingStatus === statusFilter);
    }

    // Filter by search query (guest name)
    if (searchQuery) {
      filtered = filtered.filter((booking) =>
        booking.guestName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by date range
    if (dateRange?.from && dateRange?.to) {
      const filterStart = new Date(dateRange.from);
      const filterEnd = new Date(dateRange.to);
      
      // Set time to cover the entire day
      filterStart.setHours(0, 0, 0, 0);
      filterEnd.setHours(23, 59, 59, 999);

      filtered = filtered.filter((booking) => {
        const bookingCheckIn = new Date(booking.checkInDate);
        const bookingCheckOut = new Date(booking.checkOutDate);

        // Check for overlap
        return bookingCheckIn <= filterEnd && bookingCheckOut >= filterStart;
      });
    }

    return filtered;
  }, [bookings, statusFilter, searchQuery, dateRange]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const paginatedBookings = useMemo(
    () => filteredBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredBookings, currentPage]
  );
  
  // Helper to reset filters
  const resetFilters = () => {
    setSearchQuery("");
    setDateRange(undefined);
    setStatusFilter(null);
  };

  if (role === 'superadmin' && !selectedHotelId && hotels.length > 0) {
    // Auto-select first hotel if none selected
    setSelectedHotelId(hotels[0]?._id || '');
    return null; // Or loading
  }

  if (role !== 'superadmin' && !defaultHotelId) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold">No Hotel Branch Assigned</h3>
        <p className="text-muted-foreground">Please contact superadmin to assign a branch.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
        <p className="text-muted-foreground">View and manage all room bookings</p>
      </div>

      {/* Hotel Branch Toggle for Superadmin */}
      {role === 'superadmin' && (
        <Card>
          <CardContent className="p-4">
            <label className="text-sm font-medium mb-2 block">Select Hotel Branch</label>
            <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a branch" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel._id} value={hotel._id}>
                    {hotel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* --- Filter UI --- */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by guest name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter ?? "all"} onValueChange={(v) => setStatusFilter(v === "all" ? null : v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="checked-out">Checked Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full sm:w-[300px] justify-start text-left font-normal flex-1"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePickerCalendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            <Button onClick={resetFilters} variant="ghost">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* --- End of Filter UI --- */}

      {/* --- Loading State --- */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          <CalendarSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      )}

      {/* --- Error State --- */}
      {error && (
        <Card className="bg-destructive border-none">
          <CardContent className="p-6 flex items-center gap-4 text-destructive-foreground">
            <AlertCircle className="h-8 w-8" />
            <div>
              <h3 className="font-bold">Error Fetching Bookings</h3>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* --- Future Bookings Calendar --- */}
      <BookingCalendar bookings={filteredBookings} />

      {/* --- Upcoming Bookings --- */}
      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-3">Upcoming Bookings</h2>
        {filteredBookings
          .filter((b) => new Date(b.checkInDate) > new Date())
          .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime())
          .length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming bookings match your filter.</p>
        ) : (
          filteredBookings
            .filter((b) => new Date(b.checkInDate) > new Date())
            .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime())
            .map((b) => (
              <div key={b._id} className="border-b py-3 flex justify-between">
                <div>
                  <p className="font-semibold">{b.guestName}</p>
                  <p className="text-sm text-muted-foreground">
                    Room {b.roomId?.roomNumber} — {format(new Date(b.checkInDate), "PP")}
                  </p>
                </div>
                <Badge>{b.bookingStatus}</Badge>
              </div>
            ))
        )}
      </div>

      {/* --- Data State --- */}
      {!isLoading && !error && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {paginatedBookings.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <h3 className="text-xl font-semibold">No Bookings Found</h3>
                <p>New bookings will appear here in real-time.</p>
              </div>
            ) : (
              paginatedBookings.map((booking, index) => (
                <Card 
                  key={booking._id} 
                  className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-lg text-foreground">{booking.guestName}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Bed className="h-4 w-4" />
                            <span>Room {booking.roomId?.roomNumber || 'N/A'} ({booking.hotelId?.name || 'N/A'})</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Check In</p>
                            <p className="font-medium text-foreground">{formatDate(booking.checkInDate)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Check Out</p>
                            <p className="font-medium text-foreground">{formatDate(booking.checkOutDate)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold text-foreground">₦ {booking.totalAmount.toFixed(2)}</p>
                          </div>
                        </div>

                        <Badge className={`${statusColors[booking.bookingStatus.toLowerCase()]} capitalize`}>
                          {booking.bookingStatus.replace('-', ' ')}
                        </Badge>
                        
                        {/* --- Management Buttons (only for superadmin) --- */}
                        {canManage && (
                          <div className="flex gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">Manage</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => updateBookingStatus(booking._id, 'confirmed')}>
                                  Set as Confirmed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateBookingStatus(booking._id, 'checked-in')}>
                                  Set as Checked In
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateBookingStatus(booking._id, 'checked-out')}>
                                  Set as Checked Out
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => updateBookingStatus(booking._id, 'cancelled')}>
                                  Set as Cancelled
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="shrink-0">
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the booking for <span className="font-bold">{booking.guestName}</span>.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteBooking(booking._id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : totalPages - 4 + i + 1 >= totalPages 
                    ? totalPages - 4 + i + 1 
                    : currentPage - 2 + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="px-2 py-1 text-sm text-muted-foreground">...</span>
                )}
              </div>
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => prev + 1)}
              >
                Next
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
