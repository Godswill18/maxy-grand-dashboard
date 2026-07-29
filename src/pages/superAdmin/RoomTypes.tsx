// src/pages/superAdmin/RoomTypes.tsx
// Room Type (category) management for the new two-level room model.
// Used by both superadmin (/room-types-v2) and manager (/manager/room-types-v2),
// same pattern as the legacy Rooms.tsx / /manager/rooms-type split.
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Search, DoorOpen, BedDouble, Users, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRoomTypeV2Store } from "@/store/useRoomTypeV2Store";
import { useBranchStore } from "@/store/useBranchStore";
import { useAuthStore } from "@/store/useAuthStore";
import { CreateRoomTypeModal } from "@/components/CreateRoomTypeModal";
import { resolveImageUrl } from "@/lib/utils";

const RoomTypeCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-48 w-full rounded-md mb-4" />
      <Skeleton className="h-6 w-32 mb-2" />
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

export default function RoomTypes() {
  const {
    roomTypes,
    isLoading,
    error,
    fetchRoomTypesByHotel,
    fetchAllRoomTypes,
    openCreateModal,
    toggleRoomTypeBookable,
  } = useRoomTypeV2Store();
  const { branches, fetchBranches, isLoading: isBranchesLoading } = useBranchStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isSuperAdmin) {
      fetchBranches();
      fetchAllRoomTypes();
    } else if (user?.hotelId) {
      fetchRoomTypesByHotel(user.hotelId);
    }
  }, [isSuperAdmin, user?.hotelId, fetchBranches, fetchAllRoomTypes, fetchRoomTypesByHotel]);

  const handleBookableToggle = async (id: string) => {
    const result = await toggleRoomTypeBookable(id);
    if (result.success) {
      toast.success("Room type visibility updated");
    } else {
      toast.error(result.error || "Failed to update room type");
    }
  };

  const filteredRoomTypes = useMemo(() => {
    let filtered = [...roomTypes];

    if (isSuperAdmin && selectedBranchId) {
      filtered = filtered.filter((rt) => {
        const hotelId = typeof rt.hotelId === "object" ? rt.hotelId._id : rt.hotelId;
        return hotelId === selectedBranchId;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((rt) => rt.name.toLowerCase().includes(q));
    }

    return filtered;
  }, [roomTypes, isSuperAdmin, selectedBranchId, searchQuery]);

  const stats = useMemo(() => ({
    total: filteredRoomTypes.length,
    bookable: filteredRoomTypes.filter((rt) => rt.isBookable).length,
    totalUnits: filteredRoomTypes.reduce((sum, rt) => sum + (rt.unitCount || 0), 0),
  }), [filteredRoomTypes]);

  const getBranchName = (rt: typeof roomTypes[number]) =>
    typeof rt.hotelId === "object" ? rt.hotelId.name : (isSuperAdmin ? "Unknown Branch" : "My Branch");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Room Types</h1>
          <p className="text-muted-foreground">
            Manage sellable room categories — add physical units from a room type's detail page
          </p>
        </div>
        <Button onClick={openCreateModal}>Add Room Type</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search room types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Room Types</p>
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
              <p className="text-sm font-medium text-muted-foreground">Bookable</p>
              <h2 className="text-3xl font-bold text-success">{stats.bookable}</h2>
            </div>
            <div className="p-3 bg-success/10 rounded-full">
              <BedDouble className="h-6 w-6 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Units</p>
              <h2 className="text-3xl font-bold">{stats.totalUnits}</h2>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

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
          {[...Array(6)].map((_, i) => <RoomTypeCardSkeleton key={i} />)}
        </div>
      )}

      {error && !isLoading && (
        <div className="text-destructive-foreground bg-destructive p-4 rounded-md">
          <p>Error fetching room types: {error}</p>
        </div>
      )}

      {!isLoading && !error && (
        filteredRoomTypes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DoorOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No room types found</h3>
              <p className="text-sm text-muted-foreground">
                Get started by adding your first room type.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoomTypes.map((rt, index) => (
              <Card
                key={rt._id}
                className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6">
                  {rt.images?.length > 0 ? (
                    <img
                      src={resolveImageUrl(rt.images[0])}
                      alt={rt.name}
                      className="h-48 w-full object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="h-48 w-full bg-muted rounded-md mb-4 flex items-center justify-center">
                      <span className="text-4xl">🏨</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-xl text-foreground truncate">{rt.name}</h3>
                    <Badge variant={rt.isBookable ? "default" : "secondary"} className="shrink-0">
                      {(rt.activeUnitCount ?? rt.unitCount ?? 0)} unit{(rt.unitCount ?? 0) === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">₦{rt.basePrice?.toLocaleString()} / night</span>
                      <span>· up to {rt.maxOccupancy} guest{rt.maxOccupancy === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate min-w-0">{getBranchName(rt)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2 border-t">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium">Bookable by Guests</span>
                        <span className="text-xs text-muted-foreground">
                          {rt.isBookable ? 'Visible to guests' : 'Hidden from guests'}
                        </span>
                      </div>
                      <Switch
                        className="shrink-0"
                        checked={rt.isBookable}
                        onCheckedChange={() => handleBookableToggle(rt._id)}
                      />
                    </div>
                  </div>

                  <Link to={isSuperAdmin ? `/room-types-v2/${rt._id}` : `/manager/room-types-v2/${rt._id}`}>
                    <Button variant="outline" className="w-full">View Details</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <CreateRoomTypeModal
        onCreated={() => {
          if (isSuperAdmin) {
            fetchAllRoomTypes();
          } else if (user?.hotelId) {
            fetchRoomTypesByHotel(user.hotelId);
          }
        }}
      />
    </div>
  );
}
