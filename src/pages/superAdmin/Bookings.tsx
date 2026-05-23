// src/pages/superAdmin/Bookings.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/store/useAuthStore";
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
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

const getNights = (checkIn: string, checkOut: string) => {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
};

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
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<any>(null);
  const PAGE_SIZE = 20;

  const canManage = role === "superadmin";

  useEffect(() => {
    initSocketListeners();
    return () => closeSocketListeners();
  }, [initSocketListeners, closeSocketListeners]);

  useEffect(() => {
    if (role === "superadmin") fetchHotels();
  }, [role, fetchHotels]);

  useEffect(() => {
    fetchBookings(selectedHotelId === "all" ? undefined : selectedHotelId);
    setCurrentPage(1);
  }, [selectedHotelId, fetchBookings]);

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

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  const openDetail = (booking: any) => {
    setDetailBooking(booking);
    setDetailOpen(true);
  };

  if (role !== "superadmin" && !defaultHotelId) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold">No Hotel Branch Assigned</h3>
        <p className="text-muted-foreground">Please contact superadmin to assign a branch.</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total",       value: stats.total,      color: "text-foreground",  filter: null },
    { label: "Pending",     value: stats.pending,    color: "text-amber-600",   filter: "pending" },
    { label: "Confirmed",   value: stats.confirmed,  color: "text-green-600",   filter: "confirmed" },
    { label: "Checked In",  value: stats.checkedIn,  color: "text-blue-600",    filter: "checked-in" },
    { label: "Checked Out", value: stats.checkedOut, color: "text-gray-500",    filter: "checked-out" },
    { label: "Cancelled",   value: stats.cancelled,  color: "text-red-500",     filter: "cancelled" },
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
                  <SelectItem value="all">All branches</SelectItem>
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

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-8">#</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Guest</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Room · Hotel</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check-in</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Check-out</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nights</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Payment</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                {canManage && (
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <tr key={i} className="border-b border-l-4 border-l-muted">
                      <td className="px-4 py-3"><Skeleton className="h-4 w-4" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                      {canManage && <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>}
                    </tr>
                  ))}
                </>
              )}

              {!isLoading && paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={canManage ? 10 : 9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-semibold">No Bookings Found</p>
                      <p className="text-muted-foreground text-xs max-w-xs">
                        {statusFilter || searchQuery || dateRange
                          ? "No bookings match your filters."
                          : "New bookings will appear here in real-time."}
                      </p>
                      {(statusFilter || searchQuery || dateRange) && (
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Reset Filters
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                paginatedBookings.map((booking, index) => (
                  <tr
                    key={booking._id}
                    className={cn(
                      "border-b border-l-4 cursor-pointer hover:bg-muted/50 transition-colors",
                      STATUS_ROW[booking.bookingStatus] ?? "border-l-gray-200"
                    )}
                    onClick={() => openDetail(booking)}
                  >
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-semibold text-xs">
                          {getInitials(booking.guestName)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[140px]">{booking.guestName}</p>
                          {booking.confirmationCode && (
                            <p className="text-xs text-muted-foreground font-mono">
                              #{booking.confirmationCode}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{booking.roomTypeId?.roomNumber || "N/A"}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {booking.hotelId?.name || "N/A"}
                      </p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(booking.checkInDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(booking.checkOutDate)}
                    </td>
                    <td className="px-4 py-3">
                      {getNights(booking.checkInDate, booking.checkOutDate)}
                    </td>
                    <td className="px-4 py-3 font-semibold whitespace-nowrap">
                      ₦{booking.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "text-xs border",
                          paymentConfig[booking.paymentStatus]?.className
                        )}
                      >
                        {paymentConfig[booking.paymentStatus]?.label || booking.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={cn(
                          "text-xs border",
                          statusConfig[booking.bookingStatus]?.className
                        )}
                      >
                        {statusConfig[booking.bookingStatus]?.label || booking.bookingStatus}
                      </Badge>
                    </td>
                    {canManage && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs px-2">
                                Manage
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => updateBookingStatus(booking._id, "confirmed")}
                              >
                                Set as Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateBookingStatus(booking._id, "checked-in")}
                              >
                                Set as Checked In
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateBookingStatus(booking._id, "checked-out")}
                              >
                                Set as Checked Out
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => updateBookingStatus(booking._id, "cancelled")}
                              >
                                Set as Cancelled
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the booking for{" "}
                                  <span className="font-semibold">{booking.guestName}</span>.
                                  This action cannot be undone.
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
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
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
            <span className="hidden sm:inline"> · {filteredBookings.length} bookings</span>
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

      {/* Booking Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Booking Details</SheetTitle>
          </SheetHeader>
          {detailBooking && (
            <div className="mt-6 space-y-6">
              {/* Guest Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {getInitials(detailBooking.guestName)}
                  </div>
                  <div>
                    <p className="font-semibold text-lg leading-tight">
                      {detailBooking.guestName}
                    </p>
                    <p className="text-sm text-muted-foreground">{detailBooking.guestEmail}</p>
                  </div>
                </div>
                {detailBooking.guestPhone && (
                  <p className="text-sm text-muted-foreground pl-1">{detailBooking.guestPhone}</p>
                )}
              </div>

              <Separator />

              {/* Booking Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Booking Info
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {detailBooking.confirmationCode && (
                    <div>
                      <p className="text-xs text-muted-foreground">Confirmation Code</p>
                      <p className="font-mono font-semibold">#{detailBooking.confirmationCode}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Booking Type</p>
                    <p className="font-medium capitalize">{detailBooking.bookingType || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="font-medium">{detailBooking.roomTypeId?.roomNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Hotel</p>
                    <p className="font-medium">{detailBooking.hotelId?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-in</p>
                    <p className="font-medium">{formatDate(detailBooking.checkInDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Check-out</p>
                    <p className="font-medium">{formatDate(detailBooking.checkOutDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Nights</p>
                    <p className="font-medium">
                      {getNights(detailBooking.checkInDate, detailBooking.checkOutDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Guests</p>
                    <p className="font-medium">{detailBooking.numberOfGuests || "N/A"}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Financial */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Financial
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">
                      ₦{(detailBooking.totalAmount ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paid</p>
                    <p className="font-semibold">
                      ₦{(detailBooking.amountPaid ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="font-semibold">
                      ₦{(
                        (detailBooking.totalAmount ?? 0) - (detailBooking.amountPaid ?? 0)
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "text-xs border",
                    paymentConfig[detailBooking.paymentStatus]?.className
                  )}
                >
                  {paymentConfig[detailBooking.paymentStatus]?.label ||
                    detailBooking.paymentStatus}
                </Badge>
              </div>

              <Separator />

              {/* Status */}
              <div className="space-y-2">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                  Status
                </h3>
                <Badge
                  className={cn(
                    "text-xs border",
                    statusConfig[detailBooking.bookingStatus]?.className
                  )}
                >
                  {statusConfig[detailBooking.bookingStatus]?.label ||
                    detailBooking.bookingStatus}
                </Badge>
                {detailBooking.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last updated {new Date(detailBooking.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Special Requests */}
              {(detailBooking.preferences?.specialRequests ||
                detailBooking.specialRequests) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      Special Requests
                    </h3>
                    <p className="text-sm bg-muted p-3 rounded-md">
                      {detailBooking.preferences?.specialRequests ||
                        detailBooking.specialRequests}
                    </p>
                  </div>
                </>
              )}

              {/* Actions */}
              {canManage && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wide">
                      Actions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Change Status
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Set Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              updateBookingStatus(detailBooking._id, "confirmed");
                              setDetailOpen(false);
                            }}
                          >
                            Set as Confirmed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              updateBookingStatus(detailBooking._id, "checked-in");
                              setDetailOpen(false);
                            }}
                          >
                            Set as Checked In
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              updateBookingStatus(detailBooking._id, "checked-out");
                              setDetailOpen(false);
                            }}
                          >
                            Set as Checked Out
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              updateBookingStatus(detailBooking._id, "cancelled");
                              setDetailOpen(false);
                            }}
                          >
                            Set as Cancelled
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the booking for{" "}
                              <span className="font-semibold">{detailBooking.guestName}</span>.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteBooking(detailBooking._id);
                                setDetailOpen(false);
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
