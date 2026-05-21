// src/pages/superAdmin/Bookings.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Bed,
  DollarSign,
  AlertCircle,
  Trash,
  Search,
  CalendarIcon,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useBookingStore } from "../../store/useBookingStore";
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
import BookingCalendar from "@/components/BookingCalendar";
import { format } from "date-fns";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";
import { BookingCardSkeleton, CalendarSkeleton } from "@/components/skeleton/BookingsSkeletion";
import { cn } from "@/lib/utils";

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
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

export default function Bookings() {
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

  const { user } = useAuthStore();
  const role = user?.role;
  const defaultHotelId = user?.hotelId;

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState(
    role === "superadmin" ? "" : defaultHotelId || ""
  );
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  const canManage = role === "superadmin";

  useEffect(() => {
    fetchBookings();
    initSocketListeners();
    return () => closeSocketListeners();
  }, [fetchBookings, initSocketListeners, closeSocketListeners]);

  useEffect(() => {
    if (role === "superadmin") fetchHotels();
  }, [role, fetchHotels]);

  useEffect(() => {
    const hotelIdToUse = role === "superadmin" ? selectedHotelId : defaultHotelId;
    if (hotelIdToUse) {
      fetchBookings(hotelIdToUse);
      setCurrentPage(1);
    }
  }, [selectedHotelId, role, defaultHotelId, fetchBookings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, statusFilter]);

  const stats = useMemo(
    () => ({
      total:      bookings.length,
      pending:    bookings.filter((b) => b.bookingStatus === "pending").length,
      confirmed:  bookings.filter((b) => b.bookingStatus === "confirmed").length,
      checkedIn:  bookings.filter((b) => b.bookingStatus === "checked-in").length,
      checkedOut: bookings.filter((b) => b.bookingStatus === "checked-out").length,
      cancelled:  bookings.filter((b) => b.bookingStatus === "cancelled").length,
    }),
    [bookings]
  );

  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    if (statusFilter) {
      filtered = filtered.filter((b) => b.bookingStatus === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((b) =>
        b.guestName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateRange?.from && dateRange?.to) {
      const start = new Date(dateRange.from);
      const end = new Date(dateRange.to);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((b) => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        return checkIn <= end && checkOut >= start;
      });
    }

    return filtered;
  }, [bookings, statusFilter, searchQuery, dateRange]);

  const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const paginatedBookings = useMemo(
    () => filteredBookings.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredBookings, currentPage]
  );

  const resetFilters = () => {
    setSearchQuery("");
    setDateRange(undefined);
    setStatusFilter(null);
  };

  if (role === "superadmin" && !selectedHotelId && hotels.length > 0) {
    setSelectedHotelId(hotels[0]?._id || "");
    return null;
  }

  if (role !== "superadmin" && !defaultHotelId) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold">No Hotel Branch Assigned</h3>
        <p className="text-muted-foreground">Please contact superadmin to assign a branch.</p>
      </div>
    );
  }

  const statusTabs = [
    { key: null,          label: "All",         count: stats.total },
    { key: "pending",     label: "Pending",      count: stats.pending },
    { key: "confirmed",   label: "Confirmed",    count: stats.confirmed },
    { key: "checked-in",  label: "Checked In",   count: stats.checkedIn },
    { key: "checked-out", label: "Checked Out",  count: stats.checkedOut },
    { key: "cancelled",   label: "Cancelled",    count: stats.cancelled },
  ];

  const statCards = [
    { label: "Total",       value: stats.total,     color: "text-foreground",    filter: null },
    { label: "Pending",     value: stats.pending,   color: "text-amber-600",     filter: "pending" },
    { label: "Confirmed",   value: stats.confirmed, color: "text-green-600",     filter: "confirmed" },
    { label: "Checked In",  value: stats.checkedIn, color: "text-blue-600",      filter: "checked-in" },
    { label: "Checked Out", value: stats.checkedOut,color: "text-gray-500",      filter: "checked-out" },
    { label: "Cancelled",   value: stats.cancelled, color: "text-red-500",       filter: "cancelled" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Booking Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filteredBookings.length} booking{filteredBookings.length !== 1 ? "s" : ""} · real-time updates enabled
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {statCards.map(({ label, value, color, filter }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(filter)}
            className={cn(
              "flex flex-col items-center min-w-[88px] rounded-xl border p-3 transition-colors shrink-0",
              statusFilter === filter
                ? "bg-primary/5 border-primary"
                : "bg-card hover:bg-accent"
            )}
          >
            <span className={cn("text-2xl font-bold leading-tight", color)}>{value}</span>
            <span className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">{label}</span>
          </button>
        ))}
      </div>

      {/* Filter Row */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {role === "superadmin" && (
              <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                <SelectTrigger className="w-full sm:w-[200px] shrink-0">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {hotels.map((hotel) => (
                    <SelectItem key={hotel._id} value={hotel._id}>
                      {hotel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by guest name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto justify-start text-left font-normal min-w-[200px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} – {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span className="text-muted-foreground">Pick date range</span>
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
            <Button onClick={resetFilters} variant="ghost" size="sm" className="shrink-0">
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {statusTabs.map(({ key, label, count }) => (
          <button
            key={key ?? "all"}
            onClick={() => setStatusFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
              statusFilter === key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
            )}
          >
            {label} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4">
          <CalendarSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-5 flex items-center gap-4">
            <AlertCircle className="h-6 w-6 text-destructive shrink-0" />
            <div>
              <h3 className="font-semibold text-destructive">Error Fetching Bookings</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <BookingCalendar bookings={filteredBookings} />

      {/* Bookings List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {statusFilter ? statusConfig[statusFilter]?.label : "All"} Bookings
            </h2>
            <span className="text-sm text-muted-foreground">{filteredBookings.length} results</span>
          </div>

          {paginatedBookings.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No Bookings Found</h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {statusFilter || searchQuery || dateRange
                    ? "No bookings match your current filters. Try adjusting or resetting them."
                    : "New bookings will appear here in real-time."}
                </p>
                {(statusFilter || searchQuery || dateRange) && (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {paginatedBookings.map((booking, index) => (
                <Card
                  key={booking._id}
                  className="hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex flex-col gap-3">
                      {/* Top row: avatar + identity + badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-sm">
                            {getInitials(booking.guestName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground leading-tight truncate">
                              {booking.guestName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Room {booking.roomTypeId?.roomNumber || "N/A"} ·{" "}
                              {booking.hotelId?.name || "N/A"}
                            </p>
                            {booking.confirmationCode && (
                              <p className="text-xs text-muted-foreground font-mono">
                                #{booking.confirmationCode}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                          {booking.bookingType && (
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {booking.bookingType}
                            </Badge>
                          )}
                          <Badge
                            className={cn(
                              "text-xs border",
                              paymentConfig[booking.paymentStatus]?.className
                            )}
                          >
                            {paymentConfig[booking.paymentStatus]?.label ||
                              booking.paymentStatus}
                          </Badge>
                          <Badge
                            className={cn(
                              "text-xs border",
                              statusConfig[booking.bookingStatus]?.className
                            )}
                          >
                            {statusConfig[booking.bookingStatus]?.label ||
                              booking.bookingStatus}
                          </Badge>
                        </div>
                      </div>

                      <div className="border-t" />

                      {/* Middle row: dates + amounts */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Check In</p>
                          <p className="font-medium">{formatDate(booking.checkInDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Check Out</p>
                          <p className="font-medium">{formatDate(booking.checkOutDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold">
                            ₦{booking.totalAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="font-semibold">
                            ₦{(booking.amountPaid ?? 0).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Actions row */}
                      {canManage && (
                        <>
                          <div className="border-t" />
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Manage
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateBookingStatus(booking._id, "confirmed")
                                  }
                                >
                                  Set as Confirmed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateBookingStatus(booking._id, "checked-in")
                                  }
                                >
                                  Set as Checked In
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateBookingStatus(booking._id, "checked-out")
                                  }
                                >
                                  Set as Checked Out
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    updateBookingStatus(booking._id, "cancelled")
                                  }
                                >
                                  Set as Cancelled
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="shrink-0"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the booking for{" "}
                                    <span className="font-semibold">
                                      {booking.guestName}
                                    </span>
                                    . This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteBooking(booking._id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground text-center">
                Page {currentPage} of {totalPages}
                <span className="hidden sm:inline">
                  {" "}· {filteredBookings.length} bookings
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
