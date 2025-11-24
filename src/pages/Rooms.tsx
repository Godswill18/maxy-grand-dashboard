// src/components/Rooms.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, BedDouble, CheckCircle, Sparkles, DoorOpen } from "lucide-react"; // Added icons
import { useRoomStore } from "../store/useRoomStore";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useBranchStore } from "../store/useBranchStore";
import { useAuthStore } from "../store/useAuthStore";

const statusColors: Record<string, string> = {
  available: "bg-success text-success-foreground", // Lowercase to match backend usually
  occupied: "bg-destructive text-destructive-foreground",
  booked: "bg-warning text-warning-foreground",
  cleaning: "bg-info text-info-foreground",
  maintenance: "bg-muted text-muted-foreground",
};

const VITE_BACKEND_IMAGE_URL = 'http://localhost:5000';

// --- Skeleton for Stat Cards ---
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

export default function Rooms() {
  const { rooms, isLoading, error, fetchRoomsAdmin, openModal } = useRoomStore();
  const { branches, fetchBranches, isLoading: isBranchesLoading } = useBranchStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    fetchRoomsAdmin();
    if (isSuperAdmin) {
      fetchBranches();
    }
  }, [fetchRoomsAdmin, fetchBranches, isSuperAdmin]);

  const branchNameMap = useMemo(() =>
    new Map(branches.map(branch => [branch._id, branch.name]))
  , [branches]);

  const filteredRooms = useMemo(() => {
    if (!selectedBranchId) {
      return rooms;
    }
    return rooms.filter(room => room.hotelId === selectedBranchId);
  }, [rooms, selectedBranchId]);

  // --- Calculate Statistics ---
  const stats = useMemo(() => {
    return {
      total: filteredRooms.length,
      // available: filteredRooms.filter(r => r.status === 'available' || r.isAvailable).length, // Handle different backend schemas
      // cleaning: filteredRooms.filter(r => r.status === 'cleaning').length,
      // occupied: filteredRooms.filter(r => r.status === 'occupied' ).length,
    };
  }, [filteredRooms]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground">Manage all rooms across branches</p>
        </div>
        <Button onClick={openModal}>Add New Room</Button>
      </div>

      {/* --- Statistics Cards --- */}
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
            {/* <Card>
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
                  <p className="text-sm font-medium text-muted-foreground">Cleaning</p>
                  <h2 className="text-3xl font-bold text-info">{stats.cleaning}</h2>
                </div>
                <div className="p-3 bg-info/10 rounded-full">
                  <Sparkles className="h-6 w-6 text-info" />
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
            </Card> */}
          </>
        )}
      </div>

      {/* --- Filter Bar --- */}
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
          {filteredRooms.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <h3 className="text-xl font-semibold">No Rooms Found</h3>
              <p>No rooms match the selected criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(filteredRooms || []).map((room, index) => {
                // Normalize status casing for the badge color lookup
                const rawStatus = room.status || (room.isAvailable ? "available" : "inactive");
                const status = rawStatus.toLowerCase(); // Ensure it matches keys in statusColors
                const displayStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1); // Capitalize for display

                const getBranchName = () => {
                  const name = branchNameMap.get(room.hotelId);
                  return name || (isSuperAdmin ? room.hotelId : "My Branch");
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
                        <Badge className={statusColors[status] || "bg-secondary"}>
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
                      </div>

                      <Link to={isSuperAdmin ? `/rooms/${room._id}` : `/manager/rooms/${room._id}`}>
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