// ✅ UPDATED: Rooms.tsx with filters, search, and 'occupied-needs-cleaning' status

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, BedDouble, CheckCircle, Sparkles, DoorOpen, AlertCircle, Search, Filter, X, SlidersHorizontal } from "lucide-react";
import { useRoomStore } from "../../store/useRoomStore";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { useBranchStore } from "../../store/useBranchStore";
import { useAuthStore } from "../../store/useAuthStore";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  available: "bg-success text-success-foreground",
  occupied: "bg-destructive text-destructive-foreground",
  'occupied-needs-cleaning': "bg-orange-500 text-white",
  booked: "bg-warning text-warning-foreground",
  cleaning: "bg-info text-info-foreground",
  maintenance: "bg-muted text-muted-foreground",
  'out-of-service': "bg-gray-500 text-white",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  'occupied-needs-cleaning': "Needs Cleaning",
  booked: "Booked",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
  'out-of-service': "Out of Service",
};

const VITE_BACKEND_IMAGE_URL = 'http://localhost:5000';

const StatCardSkeleton = () => (
  <Card>
    <CardContent className="p-6 flex items-center justify-between">
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-12" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </CardContent>
  </Card>
);

const RoomCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-48 w-full rounded-md mb-4" />
      <div className="flex items-start justify-between mb-4">
        <div>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-36" />
      </div>
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

const getSafeHotelName = (hotelData: any) => {
  if (!hotelData) return "Unknown Branch";
  if (typeof hotelData === 'object' && hotelData.name) {
    return hotelData.name;
  }
  if (typeof hotelData === 'string') {
    return hotelData; 
  }
  return "Unknown Branch";
};

export default function Rooms() {
  const { rooms, isLoading, error, fetchRoomsAdmin, openModal, toggleRoomAvailability } = useRoomStore();
  const { branches, fetchBranches, isLoading: isBranchesLoading } = useBranchStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Handle room availability toggle
  const handleAvailabilityToggle = async (roomId: string, currentAvailability: boolean) => {
    const newAvailability = !currentAvailability;
    const result = await toggleRoomAvailability(roomId, newAvailability);

    if (result.success) {
      toast.success(`Room ${newAvailability ? 'enabled' : 'disabled'} for guest bookings`);
      fetchRoomsAdmin(); // Refresh the room list
    } else {
      toast.error('Failed to update room availability');
    }
  };
  
  // ✅ NEW: Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<"all" | "low" | "medium" | "high">("all");
  const [sortBy, setSortBy] = useState<"roomNumber" | "price">("roomNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRoomsAdmin();
    if (isSuperAdmin) {
      fetchBranches();
    }
  }, [fetchRoomsAdmin, fetchBranches, isSuperAdmin]);

  const branchNameMap = useMemo(() =>
    new Map(branches.map(branch => [branch._id, branch.name]))
  , [branches]);

  // ✅ NEW: Advanced Filtering Logic
  const filteredAndSortedRooms = useMemo(() => {
    let filtered = [...rooms];

    // 1. Branch filter (existing)
    if (selectedBranchId) {
      filtered = filtered.filter((room) => {
        if (!room.hotelId) return false;
        const roomHotelId = typeof room.hotelId === "object" ? room.hotelId._id : room.hotelId;
        return roomHotelId === selectedBranchId;
      });
    }

    // 2. Search filter (room number or name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => 
        room.roomNumber.toLowerCase().includes(query) ||
        room.name.toLowerCase().includes(query)
      );
    }

    // 3. Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(room => room.status === statusFilter);
    }

    // 4. Price range filter
    if (priceRange !== "all") {
      filtered = filtered.filter(room => {
        const price = room.price || 0;
        switch (priceRange) {
          case "low": return price < 50000;
          case "medium": return price >= 50000 && price < 100000;
          case "high": return price >= 100000;
          default: return true;
        }
      });
    }

    // 5. Sorting
    filtered.sort((a, b) => {
      if (sortBy === "roomNumber") {
        const aNum = parseInt(a.roomNumber) || 0;
        const bNum = parseInt(b.roomNumber) || 0;
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      } else {
        // Sort by price
        const aPrice = a.price || 0;
        const bPrice = b.price || 0;
        return sortOrder === "asc" ? aPrice - bPrice : bPrice - aPrice;
      }
    });

    return filtered;
  }, [rooms, selectedBranchId, searchQuery, statusFilter, priceRange, sortBy, sortOrder]);

  // ✅ NEW: Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriceRange("all");
    setSortBy("roomNumber");
    setSortOrder("asc");
    setSelectedBranchId(null);
  };

  // ✅ NEW: Check if any filters are active
  const hasActiveFilters = 
    searchQuery !== "" || 
    statusFilter !== "all" || 
    priceRange !== "all" || 
    sortBy !== "roomNumber" || 
    sortOrder !== "asc" ||
    selectedBranchId !== null;

  // ✅ UPDATED: Calculate statistics from filtered rooms
  const stats = useMemo(() => {
    return {
      total: filteredAndSortedRooms.length,
      available: filteredAndSortedRooms.filter(r => r.status === 'available').length,
      occupied: filteredAndSortedRooms.filter(r => r.status === 'occupied').length,
      needsCleaning: filteredAndSortedRooms.filter(r => r.status === 'occupied-needs-cleaning').length,
      cleaning: filteredAndSortedRooms.filter(r => r.status === 'cleaning').length,
      maintenance: filteredAndSortedRooms.filter(r => r.status === 'maintenance').length,
    };
  }, [filteredAndSortedRooms]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground">Manage all rooms across branches</p>
        </div>
        <Button onClick={openModal}>Add New Room</Button>
      </div>

      {/* ✅ NEW: SEARCH & FILTER BAR */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Filter Toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by room number or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="shrink-0"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filter Controls */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                {/* Status Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="occupied-needs-cleaning">Needs Cleaning</SelectItem>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="out-of-service">Out of Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Price Range</Label>
                  <Select value={priceRange} onValueChange={(value) => setPriceRange(value as typeof priceRange)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Prices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="low">Under ₦50,000</SelectItem>
                      <SelectItem value="medium">₦50,000 - ₦100,000</SelectItem>
                      <SelectItem value="high">Above ₦100,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Sort By</Label>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Room Number" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roomNumber">Room Number</SelectItem>
                      <SelectItem value="price">Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Order */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Order</Label>
                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ascending" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Ascending</SelectItem>
                      <SelectItem value="desc">Descending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ NEW: Show result count */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredAndSortedRooms.length} of {rooms.length} rooms
          </span>
          <Button variant="link" onClick={clearFilters} className="h-auto p-0">
            Clear all filters
          </Button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rooms</p>
                  <h2 className="text-3xl font-bold">{stats.total}</h2>
                </div>
                <div className="p-3 bg-primary/10 rounded-full">
                  <DoorOpen className="h-6 w-6 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Available</p>
                  <h2 className="text-3xl font-bold text-success">{stats.available}</h2>
                </div>
                <div className="p-3 bg-success/10 rounded-full">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Needs Cleaning</p>
                  <h2 className="text-3xl font-bold text-orange-500">{stats.needsCleaning}</h2>
                  <p className="text-xs text-muted-foreground mt-1">Guest Occupied</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Occupied</p>
                  <h2 className="text-3xl font-bold text-destructive">{stats.occupied}</h2>
                </div>
                <div className="p-3 bg-destructive/10 rounded-full">
                  <BedDouble className="h-6 w-6 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Branch Filter Bar (for SuperAdmin) */}
      {isSuperAdmin && !isBranchesLoading && branches.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant={selectedBranchId === null ? 'default' : 'outline'}
            onClick={() => setSelectedBranchId(null)}
            className="rounded-full"
          >
            All Branches
          </Button>
          {branches.map((branch) => (
            <Button
              key={branch._id}
              variant={selectedBranchId === branch._id ? 'default' : 'outline'}
              onClick={() => setSelectedBranchId(branch._id)}
              className="rounded-full"
            >
              {branch.name}
            </Button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <RoomCardSkeleton key={i} />)}
        </div>
      )}

      {error && (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          <p>Error fetching rooms: {error}</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          {filteredAndSortedRooms.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <DoorOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters 
                    ? "Try adjusting your filters to see more results"
                    : "No rooms available at the moment"
                  }
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedRooms.map((room, index) => {
                const rawStatus = room.status || 'available';
                const status = rawStatus.toLowerCase();
                const displayStatus = statusLabels[status] || rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

                const getBranchName = () => {
                  const mappedName = typeof room.hotelId === 'string' ? branchNameMap.get(room.hotelId) : null;
                  
                  if (mappedName) return mappedName;

                  if (room.hotelId && typeof room.hotelId === 'object' && (room.hotelId as any).name) {
                    return (room.hotelId as any).name;
                  }

                  return isSuperAdmin ? "Unknown Branch" : "My Branch";
                };
                
                return (
                  <Card 
                    key={room._id} 
                    className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" 
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-6">
                      {room.images?.length > 0 ? (
                        <img 
                          src={`${VITE_BACKEND_IMAGE_URL}/${room.images[0]}`}
                          alt={room.name} 
                          className="h-48 w-full object-cover rounded-md mb-4"
                        />
                      ) : (
                        <div className="h-48 w-full bg-muted rounded-md mb-4 flex items-center justify-center">
                          <span className="text-4xl">🏨</span>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-xl text-foreground">
                            Room {room.roomNumber}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {room.name}
                          </p>
                        </div>
                        <Badge className={`${statusColors[status] || "bg-secondary"} flex items-center gap-1`}>
                          {status === 'occupied-needs-cleaning' && (
                            <AlertCircle className="h-3 w-3" />
                          )}
                          {displayStatus}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <p className="font-bold">₦</p>
                          <span className="font-semibold text-foreground">₦ {room?.price?.toLocaleString()} / night</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{getBranchName()}</span>
                        </div>

                        {/* Availability Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">Available for Booking</span>
                            <span className="text-xs text-muted-foreground">
                              {room.isAvailable ? 'Visible to guests' : 'Hidden from guests'}
                            </span>
                          </div>
                          <Switch
                            checked={room.isAvailable}
                            onCheckedChange={() => handleAvailabilityToggle(room._id, room.isAvailable)}
                          />
                        </div>
                      </div>

                      <Link to={isSuperAdmin ? `/rooms/${room._id}` : `/manager/rooms-type/${room._id}`}>
                        <Button variant="outline" className="w-full">View Details</Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <CreateRoomModal />
    </div>
  );
}