// src/components/BookingCalendar.tsx
import { useMemo, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { format } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import moment from "moment";


const localizer = momentLocalizer(moment);

interface BookingCalendarProps {
  bookings: any[];
}

export default function BookingCalendar({ bookings }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBookings, setSelectedBookings] = useState<any[]>([]);

  // Map bookings to calendar events
  const events = useMemo(
    () =>
      bookings.map((b) => ({
        id: b._id,
        title: `Guest: ${b.guestName}, Hotel: (${b.hotelId?.name || "N/A"})`,
        start: new Date(b.checkInDate),
        end: new Date(b.checkOutDate),
        resource: b,
      })),
    [bookings]
  );

  const toDateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const showBookingsForDate = (date: Date) => {
    const clicked = toDateOnly(date);
    const found = bookings.filter((b) => {
      const checkIn = toDateOnly(new Date(b.checkInDate));
      const checkOut = toDateOnly(new Date(b.checkOutDate));
      return checkIn <= clicked && checkOut >= clicked;
    });
    setSelectedDate(date);
    setSelectedBookings(found);
  };

  // Fires immediately on single click/tap of an event — no delay
  const handleSelectEvent = (event: any) => {
    showBookingsForDate(event.start);
  };

  // Fires on slot click (kept for clicking empty date cells)
  const handleSelectSlot = (slotInfo: any) => {
    showBookingsForDate(slotInfo.start);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h2 className="text-2xl font-semibold mb-3">📅 Future Bookings Calendar</h2>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          selectable
          longPressThreshold={10}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          views={["month"]}
        />
      </Card>

      {/* Modal for bookings on selected date */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Bookings for {selectedDate ? format(selectedDate, "PPP") : ""}
            </DialogTitle>
          </DialogHeader>
          {selectedBookings.length > 0 ? (
            <div className="space-y-3">
              {selectedBookings.map((b) => (
                <Card key={b._id}>
                  <CardContent className="p-4 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">{b.guestName}</h3>
                      <Badge>{b.bookingStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Room: <span className="font-medium">{b.roomTypeId?.roomNumber}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check-in: {format(new Date(b.checkInDate), "PP")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Check-out: {format(new Date(b.checkOutDate), "PP")}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No bookings for this date.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
