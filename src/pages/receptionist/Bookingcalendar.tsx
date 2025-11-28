import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Mail, Phone, BedDouble, Clock, DollarSign } from "lucide-react";
import { useBookingStore } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";
import CalendarSkeleton from "@/components/skeleton/CalendarSkeleton";

interface BookingEvent {
  id: string;
  title: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomNumber: string;
  checkInDate: Date;
  checkOutDate: Date;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'pending';
  totalAmount: number;
  guests: number;
  specialRequests?: string;
}

export default function BookingCalendar() {
  const { bookings, isLoading, fetchBookings } = useBookingStore();
  const { user } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookingEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    if (user?.hotelId) {
      fetchBookings();
    }
  }, [user?.hotelId]);

  // Filter bookings by hotelId
const hotelBookings = bookings.filter(booking => {
    if (!user?.hotelId) return false;
    // If hotelId is a string compare directly
    if (typeof booking.hotelId === "string") {
      return booking.hotelId === user.hotelId;
    }
    // If hotelId is an object with _id, compare _id
    if (booking.hotelId && typeof booking.hotelId === "object" && "_id" in booking.hotelId) {
      return (booking.hotelId as { _id: string })._id === user.hotelId;
    }
    return false;
  });

  // Convert bookings to calendar events
  const events: BookingEvent[] = hotelBookings.map(booking => ({
    id: booking._id,
    title: booking.guestName,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    roomNumber: booking.roomId?.roomNumber || 'N/A',
    checkInDate: new Date(booking.checkInDate),
    checkOutDate: new Date(booking.checkOutDate),
    status: booking.bookingStatus,
    totalAmount: booking.totalAmount,
    guests: booking.guests || 1,
    specialRequests: booking.specialRequests,
  }));

  // Status colors matching the theme
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/90 border-emerald-600/50 text-white';
      case 'checked-in': return 'bg-blue-500/90 border-blue-600/50 text-white';
      case 'checked-out': return 'bg-slate-500/90 border-slate-600/50 text-white';
      case 'pending': return 'bg-amber-500/90 border-amber-600/50 text-white';
      case 'cancelled': return 'bg-red-500/90 border-red-600/50 text-white';
      default: return 'bg-gray-500/90 border-gray-600/50 text-white';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
      case 'checked-in': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'checked-out': return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-700 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return events.filter(event => {
      const checkIn = new Date(event.checkInDate);
      const checkOut = new Date(event.checkOutDate);
      checkIn.setHours(0, 0, 0, 0);
      checkOut.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      return targetDate >= checkIn && targetDate < checkOut;
    });
  };

  // Check if a date is today
  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = Array.from({ length: 42 }, (_, i) => i - firstDay + 1);

  const handleEventClick = (event: BookingEvent) => {
    setSelectedBooking(event);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
    <CalendarSkeleton/>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 md:p-8">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        .calendar-header {
          font-family: 'Playfair Display', serif;
        }
        
        .calendar-body {
          font-family: 'DM Sans', sans-serif;
        }

        .event-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .dark .event-card:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
        }

        .day-cell {
          transition: all 0.2s ease;
        }

        .day-cell:hover {
          background: rgba(59, 130, 246, 0.05);
        }

        .dark .day-cell:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        .legend-item {
          transition: all 0.2s ease;
        }

        .legend-item:hover {
          transform: scale(1.05);
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="calendar-header text-4xl md:text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Booking Calendar
            </h1>
            <p className="calendar-body text-slate-600 dark:text-slate-400 mt-2 text-lg">
              Visual timeline of all hotel reservations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={goToToday}
              className="calendar-body font-medium border-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700 transition-all dark:border-slate-700 dark:text-slate-200"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Today
            </Button>
          </div>
        </div>

        {/* Legend */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="calendar-body font-semibold text-slate-700 dark:text-slate-300 mr-2">Status Legend:</span>
              {[
                { status: 'confirmed', label: 'Confirmed' },
                { status: 'checked-in', label: 'Checked In' },
                { status: 'checked-out', label: 'Checked Out' },
                { status: 'pending', label: 'Pending' },
                { status: 'cancelled', label: 'Cancelled' },
              ].map(({ status, label }) => (
                <div key={status} className="legend-item flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status).split(' ')[0]}`} />
                  <span className="calendar-body text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Navigation */}
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-700/50 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                onClick={goToPreviousMonth}
                className="calendar-body border-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-700 dark:text-slate-200"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <h2 className="calendar-header text-3xl font-black text-slate-900 dark:text-slate-100">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>

              <Button
                variant="outline"
                onClick={goToNextMonth}
                className="calendar-body border-2 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 dark:border-slate-700 dark:text-slate-200"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="calendar-body">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                  <div
                    key={day}
                    className="text-center font-bold text-slate-600 dark:text-slate-400 text-sm py-2 border-b-2 border-slate-200 dark:border-slate-700"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const isValidDay = day > 0 && day <= daysInMonth;
                  const dayEvents = isValidDay ? getEventsForDay(day) : [];
                  const isTodayDate = isValidDay && isToday(day);

                  return (
                    <div
                      key={index}
                      className={`
                        day-cell min-h-[120px] p-2 border-2 rounded-lg
                        ${isValidDay ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50/30 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800'}
                        ${isTodayDate ? 'ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-slate-900 border-blue-300 dark:border-blue-600' : ''}
                      `}
                    >
                      {isValidDay && (
                        <>
                          <div className={`
                            text-sm font-bold mb-2 
                            ${isTodayDate ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}
                          `}>
                            {day}
                          </div>
                          <div className="space-y-1 max-h-[80px] overflow-y-auto">
                            {dayEvents.map(event => (
                              <button
                                key={event.id}
                                onClick={() => handleEventClick(event)}
                                className={`
                                  event-card w-full text-left px-2 py-1 rounded text-xs font-medium
                                  border cursor-pointer
                                  ${getStatusColor(event.status)}
                                `}
                              >
                                <div className="truncate font-semibold">{event.guestName}</div>
                                <div className="text-xs opacity-90">Room {event.roomNumber}</div>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', count: events.length, color: 'bg-slate-500' },
            { label: 'Confirmed', count: events.filter(e => e.status === 'confirmed').length, color: 'bg-emerald-500' },
            { label: 'Checked In', count: events.filter(e => e.status === 'checked-in').length, color: 'bg-blue-500' },
            { label: 'Checked Out', count: events.filter(e => e.status === 'checked-out').length, color: 'bg-slate-500' },
            { label: 'Pending', count: events.filter(e => e.status === 'pending').length, color: 'bg-amber-500' },
          ].map(stat => (
            <Card key={stat.label} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-2 border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4">
                <div className={`w-12 h-12 rounded-full ${stat.color} flex items-center justify-center mb-3`}>
                  <span className="calendar-header text-2xl font-black text-white">{stat.count}</span>
                </div>
                <p className="calendar-body text-sm font-semibold text-slate-600 dark:text-slate-400">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Booking Detail Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="calendar-body max-w-2xl bg-white dark:bg-slate-900">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="calendar-header text-3xl font-black text-slate-900 dark:text-slate-100">
                Booking Details
              </DialogTitle>
              <Badge className={`${getStatusBadgeColor(selectedBooking?.status || '')} border font-semibold px-3 py-1`}>
                {selectedBooking?.status.charAt(0).toUpperCase()}
                {selectedBooking?.status.slice(1).replace('-', ' ')}
              </Badge>
            </div>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 mt-4">
              {/* Guest Information */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-blue-950/30 rounded-xl p-6 border-2 border-slate-200/50 dark:border-slate-700/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Guest Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Guest Name</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedBooking.guestName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Email</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedBooking.guestEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Phone</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedBooking.guestPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50/30 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-xl p-6 border-2 border-slate-200/50 dark:border-slate-700/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  Booking Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <BedDouble className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Room Number</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedBooking.roomNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Guests</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{selectedBooking.guests}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Check-in</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {selectedBooking.checkInDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Check-out</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {selectedBooking.checkOutDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="bg-gradient-to-br from-emerald-50 to-slate-50/30 dark:from-emerald-950/30 dark:to-slate-800 rounded-xl p-6 border-2 border-slate-200/50 dark:border-slate-700/50">
                <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Financial Details
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Amount</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    ₦{selectedBooking.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="bg-amber-50/50 dark:bg-amber-950/30 rounded-xl p-6 border-2 border-amber-200/50 dark:border-amber-900/50">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-2">Special Requests</h3>
                  <p className="text-slate-700 dark:text-slate-300">{selectedBooking.specialRequests}</p>
                </div>
              )}

              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:to-blue-700 text-white font-bold py-6 text-lg shadow-lg"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}