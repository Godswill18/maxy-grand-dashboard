import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import BookingCalendar from "@/components/BookingCalendar";
import { useBookingStore } from "@/store/useBookingStore";
import { useAuthStore } from "@/store/useAuthStore";

const STATUS_BADGE: Record<string, string> = {
  pending:       "bg-amber-100  text-amber-700  border border-amber-200",
  confirmed:     "bg-green-100  text-green-700  border border-green-200",
  "checked-in":  "bg-blue-100   text-blue-700   border border-blue-200",
  "checked-out": "bg-gray-100   text-gray-600   border border-gray-200",
  cancelled:     "bg-red-100    text-red-700    border border-red-200",
};

export default function BookingCalendarPage() {
  const { bookings, fetchBookings, hotels, fetchHotels } = useBookingStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === "superadmin";
  const [selectedHotelId, setSelectedHotelId] = useState("all");

  useEffect(() => {
    if (isSuperAdmin) fetchHotels();
  }, [isSuperAdmin, fetchHotels]);

  useEffect(() => {
    fetchBookings(selectedHotelId === "all" ? undefined : selectedHotelId);
  }, [selectedHotelId, fetchBookings]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Booking Calendar</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Visual overview of all room bookings by date
          </p>
        </div>
        {isSuperAdmin && (
          <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
            <SelectTrigger className="w-[200px]">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All branches" />
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
      </div>

      {/* Status legend */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_BADGE).map(([status, cls]) => (
          <Badge key={status} className={cls}>
            {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
          </Badge>
        ))}
      </div>

      {/* Calendar */}
      <Card>
        <CardContent className="p-4">
          <BookingCalendar bookings={bookings} />
        </CardContent>
      </Card>
    </div>
  );
}
