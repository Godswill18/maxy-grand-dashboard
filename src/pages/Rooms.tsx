// src/components/Rooms.tsx
import { useEffect, useMemo, useState } from "react"; // <-- Import useState
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";
import { useRoomStore } from "../store/useRoomStore"; // <-- Fix: Relative path
import { CreateRoomModal } from "@/components/CreateRoomModal"; // <-- Fix: Relative path
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useBranchStore } from "../store/useBranchStore"; // <-- Fix: Relative path

const statusColors: Record<string, string> = {
  Available: "bg-success text-success-foreground",
  Occupied: "bg-destructive text-destructive-foreground",
  Booked: "bg-warning text-warning-foreground",
  Inactive: "bg-muted text-muted-foreground",
};

// --- Fix: Define backend URL without import.meta ---
// This value is based on the fallback in your store.
// Adjust this if your backend runs on a different port.
const VITE_BACKEND_IMAGE_URL = 'http://localhost:5000';

// A loading skeleton component for the card
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
  const { rooms, isLoading, error, fetchRooms, openModal } = useRoomStore();
  const { branches, fetchBranches, isLoading: isBranchesLoading } = useBranchStore();

  // --- 1. Add state for the selected filter ---
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  // Fetch data when the component mounts
  useEffect(() => {
    fetchRooms();
    fetchBranches();
  }, [fetchRooms, fetchBranches]);

  // Create a performance-friendly lookup map for branch names
  const branchNameMap = useMemo(() =>
    new Map(branches.map(branch => [branch._id, branch.name]))
  , [branches]);

  // --- 2. Create a memoized list of filtered rooms ---
  const filteredRooms = useMemo(() => {
    // If no filter is selected, return all rooms
    if (!selectedBranchId) {
      return rooms;
    }
    // Otherwise, filter by the selected branch ID
    return rooms.filter(room => room.hotelId === selectedBranchId);
  }, [rooms, selectedBranchId]); // Re-calculate only when rooms or the filter changes


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Management</h1>
          <p className="text-muted-foreground">Manage all rooms across branches</p>
        </div>
        <Button onClick={openModal}>Add New Room</Button>
      </div>

      {/* --- 3. Add the Filter Toggle Bar --- */}
      {!isBranchesLoading && branches.length > 0 && (
        <div className="flex flex-wrap gap-2">
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

      {/* Handle Loading and Error States */}
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

      {/* Render Rooms */}
      {!isLoading && !error && (
        <>
          {/* --- 4. Add check for empty filtered results --- */}
          {filteredRooms.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <h3 className="text-xl font-semibold">No Rooms Found</h3>
              <p>No rooms match the selected filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* --- 5. Map over filteredRooms instead of all rooms --- */}
              {(filteredRooms || []).map((room, index) => {
                const status = room.isAvailable ? "Available" : "Inactive";
                
                const getBranchName = () => {
                  if (isBranchesLoading) return 'Loading branch...';
                  const name = branchNameMap.get(room.hotelId);
                  return name || room.hotelId;
                };
                
                return (
                  <Card 
                    key={room._id} 
                    className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" 
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <CardContent className="p-6">
                      {room.images.length > 0 ? (
                        <img 
                          src={`${VITE_BACKEND_IMAGE_URL}/${room.images[0]}`}  // <-- Fix: Use variable
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
                        <Badge className={statusColors[status]}>{status}</Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <p className="h-4 w-4">₦</p>
                          <span className="font-semibold text-foreground">₦ {room.price} / night</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{getBranchName()}</span> 
                        </div>
                      </div>

                      <Link to={`/rooms/${room._id}`}>
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

      {/* Render the modal (it's controlled by Zustand) */}
      <CreateRoomModal />
    </div>
  );
}