import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff, ImageOff } from 'lucide-react';
import { useAnnouncementStore, Announcement } from '@/store/useAnnouncementStore';
import { AnnouncementModal } from '@/components/modals/AnnouncementModal';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const audienceLabel: Record<string, string> = {
  guest: 'Guests',
  staff: 'Staff',
  both: 'Both',
};

export default function ManagerAnnouncements() {
  const { announcements, fetchAnnouncements, deleteAnnouncement, toggleVisibility, isLoading } =
    useAnnouncementStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements(); // admin middleware on backend auto-scopes to their hotelId
  }, []);

  const handleEdit = (ann: Announcement) => {
    setEditTarget(ann);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleToggle = async (id: string) => {
    const ok = await toggleVisibility(id);
    if (ok) toast.success('Visibility updated');
    else toast.error('Failed to update visibility');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteAnnouncement(deleteTarget);
    setDeleteTarget(null);
    if (ok) toast.success('Announcement deleted');
    else toast.error('Failed to delete announcement');
  };

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString() : '—');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Announcements & Promotions</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Announcement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Branch Announcements ({announcements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No announcements yet. Create your first one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements.map((ann) => (
                    <TableRow key={ann._id}>
                      <TableCell>
                        {ann.imageUrl ? (
                          <img
                            src={`${VITE_API_URL}/${ann.imageUrl}`}
                            alt={ann.title}
                            className="h-10 w-14 object-cover rounded"
                          />
                        ) : (
                          <div className="h-10 w-14 bg-muted rounded flex items-center justify-center">
                            <ImageOff className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[220px] truncate">
                        {ann.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{audienceLabel[ann.targetAudience]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            ann.status === 'active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-100'
                          }
                        >
                          {ann.status === 'active' ? 'Active' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(ann.startDate)}</TableCell>
                      <TableCell className="text-sm">{formatDate(ann.endDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            title={ann.status === 'active' ? 'Deactivate' : 'Activate'}
                            onClick={() => handleToggle(ann._id)}
                          >
                            {ann.status === 'active' ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Edit"
                            onClick={() => handleEdit(ann)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(ann._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AnnouncementModal
        open={modalOpen}
        onClose={handleModalClose}
        announcement={editTarget}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the announcement. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
