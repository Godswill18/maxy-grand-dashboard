import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Phone,
  Calendar,
  Search,
  X,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useStaffStore } from "../../store/useUserStore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

const AVATAR_COLORS = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

const BOOKING_STATUS_CLASSES: Record<string, string> = {
  confirmed:    "bg-green-100 text-green-700 border border-green-200",
  "checked-in": "bg-blue-100 text-blue-700 border border-blue-200",
  "checked-out":"bg-gray-100 text-gray-600 border border-gray-200",
  cancelled:    "bg-red-100 text-red-700 border border-red-200",
  pending:      "bg-amber-100 text-amber-700 border border-amber-200",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
  _id: string;
  guestName: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  totalAmount: number;
  roomTypeId?: { roomNumber: string; name: string };
  hotelId?: { name: string };
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function avatarColor(firstName: string, lastName: string) {
  return AVATAR_COLORS[(firstName.charCodeAt(0) + lastName.charCodeAt(0)) % AVATAR_COLORS.length];
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const guests    = useStaffStore((s) => s.guests);
  const isLoading = useStaffStore((s) => s.isLoading);
  const error     = useStaffStore((s) => s.error);
  const fetchGuests = useStaffStore((s: any) => s.fetchGuests);

  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage,  setCurrentPage]  = useState(1);

  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean;
    guest: GuestWithBookings | null;
    isLoadingBookings: boolean;
  }>({ open: false, guest: null, isLoadingBookings: false });

  useEffect(() => {
    if (!guests.length) fetchGuests();
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // ── Derived state ──────────────────────────────────────────────────────────
  const activeCount   = useMemo(() => guests.filter((g) => g.isActive).length, [guests]);
  const inactiveCount = useMemo(() => guests.filter((g) => !g.isActive).length, [guests]);

  const filteredGuests = useMemo(
    () =>
      guests.filter((g) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          g.firstName.toLowerCase().includes(q) ||
          g.lastName.toLowerCase().includes(q) ||
          g.email.toLowerCase().includes(q) ||
          g.phoneNumber.includes(q);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active"   && g.isActive) ||
          (statusFilter === "inactive" && !g.isActive);
        return matchesSearch && matchesStatus;
      }),
    [guests, searchQuery, statusFilter]
  );

  const totalPages    = Math.max(1, Math.ceil(filteredGuests.length / PAGE_SIZE));
  const safePage      = Math.min(currentPage, totalPages);
  const paginatedGuests = useMemo(
    () => filteredGuests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredGuests, safePage]
  );

  const showStart = filteredGuests.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showEnd   = Math.min(safePage * PAGE_SIZE, filteredGuests.length);

  const hasActiveFilters = searchQuery !== "" || statusFilter !== "all";

  // ── Booking fetch ──────────────────────────────────────────────────────────
  const fetchGuestBookings = async (guestId: string, guestInfo: any) => {
    setBookingDialog({
      open: true,
      guest: { ...guestInfo, bookings: [], totalBookings: 0, upcomingBookings: 0, pastBookings: 0 },
      isLoadingBookings: true,
    });

    try {
      const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:5000";
      const token = localStorage.getItem('token');

      const response = await fetch(`${VITE_API_URL}/api/bookings/guest/${guestId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch bookings");

      const data = await response.json();
      const bookings: Booking[] = data.data || [];

      const now = new Date();
      const upcoming = bookings.filter(
        (b) => new Date(b.checkInDate) > now && b.bookingStatus !== "cancelled"
      );
      const past = bookings.filter(
        (b) => new Date(b.checkOutDate) < now || b.bookingStatus === "checked-out"
      );

      setBookingDialog({
        open: true,
        guest: {
          ...guestInfo,
          bookings,
          totalBookings:    bookings.length,
          upcomingBookings: upcoming.length,
          pastBookings:     past.length,
        },
        isLoadingBookings: false,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch guest bookings");
      setBookingDialog({ open: false, guest: null, isLoadingBookings: false });
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Guest Management</h1>
        <p className="text-muted-foreground">View and manage registered guests</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            label: "Total Guests",
            value: guests.length,
            color:  "text-foreground",
            bg:     "bg-muted",
            border: "border-l-gray-400",
            icon:   <Users className="h-5 w-5 text-muted-foreground" />,
          },
          {
            label: "Active",
            value: activeCount,
            color:  "text-green-600",
            bg:     "bg-green-50",
            border: "border-l-green-400",
            icon:   <UserCheck className="h-5 w-5 text-green-500" />,
          },
          {
            label: "Inactive",
            value: inactiveCount,
            color:  "text-red-600",
            bg:     "bg-red-50",
            border: "border-l-red-400",
            icon:   <UserX className="h-5 w-5 text-red-500" />,
          },
        ].map((s) => (
          <Card key={s.label} className={cn("border-l-4", s.border)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                <p className={cn("text-2xl font-bold leading-tight", s.color)}>
                  {isLoading ? "—" : s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status pill tabs */}
        <div className="flex gap-1.5 shrink-0">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium capitalize border transition-colors",
                statusFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              {f === "all"
                ? `All (${guests.length})`
                : f === "active"
                ? `Active (${activeCount})`
                : `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <Button variant="outline" size="icon" onClick={handleClearFilters} title="Clear filters">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-14 gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchGuests()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty — no guests at all */}
      {!isLoading && !error && guests.length === 0 && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No guests yet</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Registered guests will appear here.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty — filters returned nothing */}
      {!isLoading && !error && guests.length > 0 && filteredGuests.length === 0 && (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">No guests match your filters</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Try adjusting your search or status filter.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Guest Card Grid */}
      {!isLoading && !error && paginatedGuests.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedGuests.map((user) => {
              const color = avatarColor(user.firstName, user.lastName);
              return (
                <Card
                  key={user._id}
                  className={cn(
                    "border-l-4 hover:shadow-md transition-shadow",
                    user.isActive ? "border-l-green-400" : "border-l-gray-300"
                  )}
                >
                  <CardContent className="p-5">
                    {/* Header row: avatar + name + badge */}
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0",
                          color
                        )}
                      >
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground leading-tight truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <Badge
                          className={cn(
                            "mt-1 text-xs",
                            user.isActive
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-muted text-muted-foreground border"
                          )}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{user.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          Joined {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => fetchGuestBookings(user._id, user)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Bookings
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {showStart}–{showEnd} of {filteredGuests.length} guest{filteredGuests.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm font-medium px-2 tabular-nums">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking History Modal */}
      <Dialog
        open={bookingDialog.open}
        onOpenChange={(open) => {
          if (!open) setBookingDialog({ open: false, guest: null, isLoadingBookings: false });
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Booking History — {bookingDialog.guest?.firstName} {bookingDialog.guest?.lastName}
            </DialogTitle>
            <DialogDescription>
              Complete booking history and statistics for this guest
            </DialogDescription>
          </DialogHeader>

          {bookingDialog.isLoadingBookings ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-l-4 border-l-muted">
                    <CardContent className="p-4 space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-12" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : bookingDialog.guest ? (
            <div className="space-y-6">
              {/* Booking Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Bookings", value: bookingDialog.guest.totalBookings ?? 0,    color: "text-foreground", bg: "bg-muted",    border: "border-l-primary"   },
                  { label: "Upcoming",        value: bookingDialog.guest.upcomingBookings ?? 0, color: "text-blue-600",   bg: "bg-blue-50",  border: "border-l-blue-400"  },
                  { label: "Past Bookings",   value: bookingDialog.guest.pastBookings ?? 0,     color: "text-gray-600",   bg: "bg-gray-50",  border: "border-l-gray-400"  },
                ].map((s) => (
                  <Card key={s.label} className={cn("border-l-4", s.border)}>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bookings List */}
              {!bookingDialog.guest.bookings || bookingDialog.guest.bookings.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">No bookings found</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        This guest has not made any bookings yet.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">
                    All Bookings ({bookingDialog.guest.bookings.length})
                  </h3>
                  {bookingDialog.guest.bookings.map((booking) => {
                    const now = new Date();
                    const isUpcoming =
                      new Date(booking.checkInDate) > now && booking.bookingStatus !== "cancelled";
                    const isPast =
                      new Date(booking.checkOutDate) < now ||
                      booking.bookingStatus === "checked-out";
                    const statusClass =
                      BOOKING_STATUS_CLASSES[booking.bookingStatus] ??
                      "bg-muted text-muted-foreground border";

                    return (
                      <Card
                        key={booking._id}
                        className={cn(
                          "border-l-4",
                          isUpcoming
                            ? "border-l-blue-400"
                            : isPast
                            ? "border-l-gray-300"
                            : "border-l-muted"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h4 className="font-semibold truncate">
                                  {booking.hotelId?.name || "Hotel"}
                                </h4>
                                {isUpcoming && (
                                  <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Upcoming
                                  </Badge>
                                )}
                                {isPast && (
                                  <Badge className="bg-gray-100 text-gray-600 border border-gray-200 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Past
                                  </Badge>
                                )}
                                <Badge className={cn("text-xs", statusClass)}>
                                  {booking.bookingStatus}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <div>
                                  <span className="font-medium text-foreground">Room:</span>{" "}
                                  {booking.roomTypeId?.roomNumber || "N/A"}
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">Check-in:</span>{" "}
                                  {format(new Date(booking.checkInDate), "MMM d, yyyy")}
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">Check-out:</span>{" "}
                                  {format(new Date(booking.checkOutDate), "MMM d, yyyy")}
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">Amount:</span>{" "}
                                  ₦{booking.totalAmount.toLocaleString()}
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
