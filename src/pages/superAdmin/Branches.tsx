import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Users, Bed, Loader2, AlertCircle, Building, Plus } from "lucide-react";
import { useBranchStore } from "../../store/useBranchStore";
import { useStaffStore } from "../../store/useUserStore";
import { useRoomStore } from "../../store/useRoomStore";
import { BranchModal } from "../../components/modals/BranchModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Branches() {
  const navigate = useNavigate();
  const { branches, isLoading, error, fetchBranches, updateBranch } = useBranchStore();
  const { admins, staff, fetchAdmins, fetchAllStaff, isLoading: adminsLoading } = useStaffStore();
  const { fetchRoomsAdmin, isLoading: roomsLoading, calculateRoomCountByHotelId } = useRoomStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ✅ Fetch all data on mount
  useEffect(() => {
    fetchBranches();
    fetchAdmins();
    fetchAllStaff();
    fetchRoomsAdmin();
  }, [fetchBranches, fetchAdmins, fetchAllStaff, fetchRoomsAdmin]);

  // ✅ Memoized function to calculate staff count
  const calculateStaffCount = useCallback((hotelId: string) => {
    if (!Array.isArray(staff) || !hotelId) return 0;
    return staff.filter((s) => {
      if (!s.hotelId) return false;
      const staffHotelId = typeof s.hotelId === 'object' 
        ? s.hotelId._id 
        : s.hotelId;
      return staffHotelId === hotelId;
    }).length;
  }, [staff]);

  // ✅ Enrich branches with calculated counts
  const enrichedBranches = useMemo(() => {
    if (!Array.isArray(branches)) return [];
    return branches.map((branch) => ({
      ...branch,
      staffCount: calculateStaffCount(branch._id),
      roomCount: calculateRoomCountByHotelId(branch._id),
    }));
  }, [branches, calculateStaffCount, calculateRoomCountByHotelId]);

  const handleToggleActive = async (branchId: string, currentStatus: boolean) => {
    const success = await updateBranch(branchId, { isActive: !currentStatus });
    if (success) {
      toast.success(`Branch status ${!currentStatus ? 'activated' : 'deactivated'}.`);
    } else {
      toast.error('Failed to update status.');
    }
  };

  const renderContent = () => {
    // ✅ Show loading skeleton
    if ((isLoading || roomsLoading) && enrichedBranches.length === 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-6" />
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // ✅ Show error
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-64 bg-card rounded-lg border border-destructive/20">
          <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
          <h2 className="text-2xl font-semibold mb-2">Error Fetching Branches</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      );
    }

    // ✅ Show empty state
    if (enrichedBranches.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center h-64 bg-card rounded-lg border border-dashed">
          <Building className="h-12 w-12 mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No Branches Found</h2>
          <p className="text-muted-foreground mb-4">Get started by adding a new branch.</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Branch
          </Button>
        </div>
      );
    }

    // ✅ Render branches
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {enrichedBranches.map((branch, index) => (
          <Card 
            key={branch._id} 
            className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom" 
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-6">
              {/* Branch Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-xl text-foreground">{branch.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manager:&nbsp;
                    {adminsLoading ? (
                      <span>Loading...</span>
                    ) : (
                      (() => {
                        const manager =
                          admins.find((a) => a._id === branch.manager) ||
                          staff.find((s) => s._id === branch.manager);
                        return manager
                          ? `${manager.firstName} ${manager.lastName}`
                          : 'N/A';
                      })()
                    )}
                  </p>
                </div>
                <Switch 
                  checked={branch.isActive} 
                  onCheckedChange={() => handleToggleActive(branch._id, branch.isActive)}
                  disabled={isLoading}
                  aria-label="Toggle branch status"
                />
              </div>

              {/* Branch Address */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="line-clamp-1">{branch.address}</span>
              </div>

              {/* Branch Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Users className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-foreground">{branch.staffCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Staff</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Bed className="h-5 w-5 text-primary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-lg font-semibold text-foreground">{branch.roomCount || 0}</p>
                    <p className="text-xs text-muted-foreground">Rooms</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/branches/${branch._id}`)}
                  className="flex-shrink-0"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Branch Management</h1>
          <p className="text-muted-foreground">Manage all hotel branches and locations</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Branch
        </Button>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Create Modal */}
      <BranchModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}