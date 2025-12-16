import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBranchStore } from '../../store/useBranchStore';
import { useStaffStore } from '../../store/useUserStore';
import { useRoomStore } from '../../store/useRoomStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, MapPin, Phone, Users, Bed, User, Building, Trash, Edit, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BranchModal } from '../../components/modals/BranchModal';
import { Badge } from '@/components/ui/badge';

export default function BranchDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentBranch,
    isLoading,
    error,
    fetchBranchById,
    deleteBranch,
  } = useBranchStore();

  const { admins, staff, fetchAdmins, fetchAllStaff, isLoading: staffLoading } = useStaffStore();
  const { fetchRoomsAdmin, isLoading: roomsLoading, calculateRoomCountByHotelId } = useRoomStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ✅ Fetch all required data once on mount
  useEffect(() => {
    if (id) {
      fetchBranchById(id);
    }
  }, [id, fetchBranchById]);

  // ✅ Fetch admin and staff data once
  useEffect(() => {
    fetchAdmins();
    fetchAllStaff();
    fetchRoomsAdmin();
  }, [fetchAdmins, fetchAllStaff, fetchRoomsAdmin]);

  // ✅ Memoized staff count calculation
  const staffCount = useMemo(() => {
    if (!id || !Array.isArray(staff)) return 0;
    return staff.filter((s) => {
      if (!s.hotelId) return false;
      const staffHotelId = typeof s.hotelId === 'object' 
        ? s.hotelId._id 
        : s.hotelId;
      return staffHotelId === id;
    }).length;
  }, [staff, id]);

  // ✅ Memoized room count calculation using store function
  const roomCount = useMemo(() => {
    if (!id) return 0;
    return calculateRoomCountByHotelId(id);
  }, [id, calculateRoomCountByHotelId]);

  // ✅ Memoized manager name lookup
  const managerName = useMemo(() => {
    if (staffLoading) return 'Loading...';
    
    if (!Array.isArray(admins) || !currentBranch?.manager) {
      return currentBranch?.manager || 'N/A';
    }

    const mgr = admins.find((a) => a._id === currentBranch.manager);
    
    if (mgr) {
      return `${mgr.firstName} ${mgr.lastName}`;
    }

    return currentBranch.manager || 'N/A';
  }, [admins, currentBranch?.manager, staffLoading]);

  // ✅ Handle branch deletion
  const handleDelete = useCallback(async () => {
    if (!id) return;
    setIsDeleting(true);
    const success = await deleteBranch(id);
    if (success) {
      toast.success('Branch deleted successfully.');
      navigate('/branches');
    } else {
      toast.error('Failed to delete branch.');
      setIsDeleting(false);
    }
  }, [id, deleteBranch, navigate]);

  // ✅ Loading state - showing spinner
  if (isLoading && !currentBranch) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center text-destructive space-y-4">
        <AlertCircle className="h-12 w-12" />
        <div>
          <h2 className="text-2xl font-semibold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
        </div>
        <Button asChild>
          <Link to="/branches">Go Back</Link>
        </Button>
      </div>
    );
  }

  // ✅ Not found state
  if (!currentBranch) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center space-y-4">
        <Building className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-2xl font-semibold mb-2">Branch Not Found</h2>
          <p className="mb-4 text-muted-foreground">The branch you're looking for doesn't exist.</p>
        </div>
        <Button asChild>
          <Link to="/branches">Go Back</Link>
        </Button>
      </div>
    );
  }

  // ✅ Main render
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Button */}
      <Button variant="outline" size="sm" onClick={() => navigate('/branches')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Branches
      </Button>

      {/* Main Card */}
      <Card>
        {/* Header with Title and Actions */}
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-3xl font-bold mb-2 break-words">{currentBranch.name}</CardTitle>
            <Badge variant={currentBranch.isActive ? 'default' : 'destructive'}>
              {currentBranch.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    branch <span className="font-bold">{currentBranch.name}</span>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        {/* Content Grid */}
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column - Location Info */}
          <div className="space-y-4">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-lg text-foreground break-words">{currentBranch.address}</p>
              </div>
            </div>

            {/* City */}
            <div className="flex items-start gap-3">
              <Building className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">City</p>
                <p className="text-lg text-foreground">{currentBranch.city}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg text-foreground">{currentBranch.phoneNumber}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Staff & Rooms Info */}
          <div className="space-y-4">
            {/* Manager */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Manager</p>
                <p className="text-lg text-foreground break-words">{managerName}</p>
              </div>
            </div>

            {/* Staff Count */}
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Staff Count</p>
                <p className="text-lg text-foreground">
                  {staffLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    staffCount
                  )}
                </p>
              </div>
            </div>

            {/* Room Count */}
            <div className="flex items-start gap-3">
              <Bed className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Room Count</p>
                <p className="text-lg text-foreground">
                  {roomsLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    roomCount
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <BranchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        branch={currentBranch}
      />
    </div>
  );
}