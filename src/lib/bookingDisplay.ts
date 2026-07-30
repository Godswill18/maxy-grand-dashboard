// src/lib/bookingDisplay.ts
// Single source of truth for "how does a booking's room/category read on
// screen" — reused by every surface that shows a booking (Bookings table,
// Booking Calendar, Booking Details, Guest History, Booking History,
// receptionist dashboard widgets). A booking has exactly one of
// roomTypeId/roomTypeV2Id (the booked category — immutable once set) and,
// separately, roomId/roomUnitId (the assigned physical room — null until
// staff assign one at check-in). Never show a room number before one is
// assigned; never let a category name get overwritten by an assignment.
export interface BookingRoomFields {
  roomTypeId?: { name?: string; roomNumber?: string } | string | null;
  roomTypeV2Id?: { name?: string; basePrice?: number } | string | null;
  roomId?: { roomNumber?: string } | string | null;
  roomUnitId?: { roomNumber?: string; status?: string } | string | null;
}

export interface BookingRoomDisplay {
  category: string;
  roomNumber: string | null;
  label: string;
}

const isPopulated = <T,>(value: T | string | null | undefined): value is T =>
  !!value && typeof value === "object";

export function getBookingRoomDisplay(booking: BookingRoomFields): BookingRoomDisplay {
  const isV2 = isPopulated(booking.roomTypeV2Id) || typeof booking.roomTypeV2Id === "string";

  const category = isV2
    ? (isPopulated(booking.roomTypeV2Id) ? booking.roomTypeV2Id.name : undefined)
    : (isPopulated(booking.roomTypeId) ? booking.roomTypeId.name : undefined);

  const roomNumber = isV2
    ? (isPopulated(booking.roomUnitId) ? booking.roomUnitId.roomNumber : undefined)
    : (isPopulated(booking.roomId) ? booking.roomId.roomNumber : undefined);

  const categoryLabel = category || "Unknown Category";

  return {
    category: categoryLabel,
    roomNumber: roomNumber || null,
    label: roomNumber
      ? `${categoryLabel} – Room ${roomNumber}`
      : `${categoryLabel} — Assigned Room: Not assigned`,
  };
}
