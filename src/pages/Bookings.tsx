// src/components/Bookings.tsx
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Bed, DollarSign, Loader2, AlertCircle, Trash } from "lucide-react";
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

// Map bookingStatus to colors
const statusColors: Record<string, string> = {
  confirmed: "bg-success text-success-foreground",
  'checked-in': "bg-blue-500 text-white", // Custom for 'checked-in'
  'checked-out': "bg-gray-500 text-white", // Custom for 'checked-out'
  pending: "bg-warning text-warning-foreground",
  cancelled: "bg-destructive text-destructive-foreground",
};

// Loading Skeleton
const BookingCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const CalendarSkeleton = () => (
  <Card className="p-6">
    <div className="flex justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
    <div className="grid grid-cols-7 gap-2">
      {Array.from({ length: 35 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-md" />
      ))}
    </div>
  </Card>
);

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
    isLoading,
    error,
    fetchBookings,
    updateBookingStatus,
    deleteBooking,
    initSocketListeners,
    closeSocketListeners,
  } = useBookingStore();

  // --- Fetch data and set up listeners on mount ---
  useEffect(() => {
    fetchBookings(); // Fetch initial data
    initSocketListeners(); // Start listening for real-time updates

    // Clean up listeners on component unmount
    return () => {
      closeSocketListeners();
    };
  }, [fetchBookings, initSocketListeners, closeSocketListeners]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Booking Management</h1>
        <p className="text-muted-foreground">View and manage all room bookings</p>
      </div>

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
    <BookingCalendar bookings={bookings} />

    {/* --- Upcoming Bookings --- */}
    <div className="mt-6">
      <h2 className="text-2xl font-semibold mb-3">Upcoming Bookings</h2>
      {bookings
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
        ))}
    </div>

      {/* --- Data State --- */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 gap-4">
          {bookings.length === 0 ? (
             <div className="text-center text-muted-foreground py-16">
              <h3 className="text-xl font-semibold">No Bookings Found</h3>
              <p>New bookings will appear here in real-time.</p>
            </div>
          ) : (
            bookings.map((booking, index) => (
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
                        <p className="font-bold text-foreground">${booking.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    <Badge className={`${statusColors[booking.bookingStatus.toLowerCase()]} capitalize`}>
                      {booking.bookingStatus.replace('-', ' ')}
                    </Badge>
                    
                    {/* --- Management Buttons --- */}
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
                  </div>
                </div>
              </CardContent>
            </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}