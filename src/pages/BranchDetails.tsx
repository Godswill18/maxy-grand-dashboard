import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBranchStore } from '../store/useBranchStore'; // Changed path
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
import { BranchModal } from '../components/modals/BranchModal'; // Changed path
import { Badge } from '@/components/ui/badge';
import { useStaffStore } from '../store/useStaffStore';

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

  const { admins, fetchAdmins, isLoading: adminsLoading } = useStaffStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBranchById(id);
    }
    // fetch admins so we can resolve the manager id to a name
    fetchAdmins();
  }, [id, fetchBranchById]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    const success = await deleteBranch(id);
    if (success) {
      toast.success('Branch deleted successfully.');
      navigate('/branches'); // Navigate back to the list
    } else {
      toast.error('Failed to delete branch.');
      setIsDeleting(false);
    }
  };

  if (isLoading && !currentBranch) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center text-destructive">
        <AlertCircle className="h-12 w-12 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p className="mb-4">{error}</p>
        <Button asChild>
          <Link to="/branches">Go Back</Link>
        </Button>
      </div>
    );
  }

  if (!currentBranch) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center text-center">
        <Building className="h-12 w-12 mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-semibold mb-2">Branch Not Found</h2>
        <p className="mb-4 text-muted-foreground">The branch you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/branches">Go Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="outline" size="sm" onClick={() => navigate('/branches')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Branches
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold">{currentBranch.name}</CardTitle>
            <Badge className="mt-2" variant={currentBranch.isActive ? 'default' : 'destructive'}>
              {currentBranch.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash className="mr-2 h-4 w-4" />}
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
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p className="text-lg text-foreground">{currentBranch.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">City</p>
                <p className="text-lg text-foreground">{currentBranch.city}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg text-foreground">{currentBranch.phoneNumber}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manager</p>
                <p className="text-lg text-foreground">{
                  (() => {
                    const mgr = admins.find((a) => a._id === currentBranch.manager);
                    if (mgr) return `${mgr.firstName} ${mgr.lastName}`;
                    if (adminsLoading) return 'Loading...';
                    return currentBranch.manager || 'N/A';
                  })()
                }</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staff Count</p>
                <p className="text-lg text-foreground">{currentBranch.staffCount || 0}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Bed className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Room Count</p>
                <p className="text-lg text-foreground">{currentBranch.roomCount || 0}</p>
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