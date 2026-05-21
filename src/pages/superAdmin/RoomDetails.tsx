import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRoomStore } from '@/store/useRoomStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import {
  Home,
  ChevronRight,
  ImagePlus,
  XCircle,
  Loader2,
  Building2,
  Users,
  Hash,
  DollarSign,
  Layers,
  CheckCircle2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatMoney } from '@/components/utils/formatMoney';
import { EditRoomModal } from '@/components/modals/EditRoomModal';
import { useAuthStore } from '@/store/useAuthStore';

const IMG_BASE = (() => {
  const b = import.meta.env.VITE_BACKEND_IMAGE_URL ?? 'http://localhost:5000';
  return b.endsWith('/') ? b : `${b}/`;
})();

const statusConfig: Record<string, { label: string; className: string }> = {
  available:              { label: 'Available',            className: 'bg-green-100 text-green-700 border-green-300' },
  occupied:               { label: 'Occupied',             className: 'bg-blue-100 text-blue-700 border-blue-300' },
  'occupied-needs-cleaning': { label: 'Needs Cleaning',   className: 'bg-purple-100 text-purple-700 border-purple-300' },
  cleaning:               { label: 'Cleaning',             className: 'bg-amber-100 text-amber-700 border-amber-300' },
  maintenance:            { label: 'Maintenance',          className: 'bg-orange-100 text-orange-700 border-orange-300' },
  'out-of-service':       { label: 'Out of Service',       className: 'bg-red-100 text-red-700 border-red-300' },
};

const parseAmenities = (raw: string | string[] | undefined): string[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.flatMap((a) => a.split(',').map((s) => s.trim())).filter(Boolean);
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const { currentRoom, isLoading, error, fetchRoomById, deleteRoom, addImages, deleteImage } =
    useRoomStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchRoomById(id);
  }, [id, fetchRoomById]);

  const handleDelete = async () => {
    if (!id) return;
    const res = await deleteRoom(id);
    if (res?.success) {
      toast.success('Room deleted');
      navigate(isSuperAdmin ? '/rooms' : '/manager/rooms', { replace: true });
    } else {
      toast.error('Failed to delete room');
    }
  };

  const handleAddImages = async () => {
    if (!id || !selectedFiles || selectedFiles.length === 0) {
      toast.info('Please select one or more images to upload.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => formData.append('images', file));
    const { success } = await addImages(id, formData);
    if (success) {
      toast.success('Images added successfully.');
      setSelectedFiles(null);
      const el = document.getElementById('image-upload') as HTMLInputElement;
      if (el) el.value = '';
    } else {
      toast.error('Failed to add images.');
    }
    setIsUploading(false);
  };

  const handleDeleteImage = async (imagePath: string) => {
    if (!id) return;
    setIsDeletingImage(imagePath);
    const { success } = await deleteImage(id, imagePath);
    if (success) toast.success('Image deleted.');
    else toast.error('Failed to delete image.');
    setIsDeletingImage(null);
  };

  if (isLoading) return <RoomDetailSkeleton />;
  if (error) return (
    <div className="container mx-auto p-6">
      <p className="text-destructive font-medium">Error: {error}</p>
    </div>
  );
  if (!currentRoom) return (
    <div className="container mx-auto p-6 text-muted-foreground">Room not found.</div>
  );

  const images = currentRoom.images || [];
  const [heroImage, ...thumbImages] = images;
  const amenities = parseAmenities(currentRoom.amenities as any);
  const status = currentRoom.status ?? 'available';
  const statusMeta = statusConfig[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };

  return (
    <>
      <div className="container mx-auto p-4 md:p-6 space-y-7 animate-in fade-in duration-400">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center text-sm text-muted-foreground gap-1">
          <Link to={isSuperAdmin ? '/' : '/manager'} className="hover:text-foreground transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link
            to={isSuperAdmin ? '/rooms' : '/manager/rooms'}
            className="hover:text-foreground transition-colors"
          >
            Rooms
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">
            Room {currentRoom.roomNumber}
          </span>
        </nav>

        {/* ── Image Gallery ── */}
        <div className="space-y-3">
          {/* Hero */}
          {heroImage ? (
            <div className="w-full h-80 md:h-[440px] rounded-xl overflow-hidden">
              <img
                src={`${IMG_BASE}${heroImage}`}
                alt={`${currentRoom.name} — main`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-80 md:h-[440px] rounded-xl bg-muted flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Building2 className="h-14 w-14 opacity-30" />
              <p className="text-sm">No images uploaded for this room.</p>
            </div>
          )}

          {/* Thumbnails */}
          {thumbImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {thumbImages.slice(0, 3).map((img, i) => (
                <div key={i} className="h-40 rounded-lg overflow-hidden">
                  <img
                    src={`${IMG_BASE}${img}`}
                    alt={`${currentRoom.name} image ${i + 2}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Title / Price / Actions row ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-medium ${currentRoom.isAvailable ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}
              >
                {currentRoom.isAvailable ? 'Available for Booking' : 'Unavailable'}
              </Badge>
              <Badge variant="outline" className={`text-xs font-medium ${statusMeta.className}`}>
                {statusMeta.label}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{currentRoom.name}</h1>
            <p className="text-muted-foreground text-sm">Room #{currentRoom.roomNumber}</p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <div className="text-left md:text-right">
              <p className="text-3xl font-bold text-primary leading-none">
                {formatMoney(currentRoom.price)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">per night</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete room</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{currentRoom.name}</strong>? This
                      action cannot be undone and will remove all associated images.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* ── 3-col info grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Quick Facts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Facts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Hash,        label: 'Room Number', value: currentRoom.roomNumber },
                { icon: Users,       label: 'Capacity',    value: `${currentRoom.capacity} guest${currentRoom.capacity !== 1 ? 's' : ''}` },
                { icon: DollarSign,  label: 'Price/Night', value: formatMoney(currentRoom.price) },
                ...(currentRoom.floor != null
                  ? [{ icon: Layers, label: 'Floor', value: `Floor ${currentRoom.floor}` }]
                  : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <span className="text-sm font-medium text-foreground">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              {amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No amenities listed.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((a) => (
                    <Badge key={a} variant="secondary" className="gap-1.5 text-xs py-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      {a}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentRoom.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Manage Images ── */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Images</CardTitle>
            <CardDescription>
              Upload new photos or remove existing ones for this room.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload area */}
            <div className="border-2 border-dashed border-border rounded-xl p-5 space-y-3">
              <Label htmlFor="image-upload" className="text-sm font-medium">
                Add New Images
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="flex-grow"
                />
                <Button
                  onClick={handleAddImages}
                  disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
                  className="gap-2 shrink-0"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ImagePlus className="h-4 w-4" />
                  )}
                  {isUploading ? 'Uploading…' : 'Upload'}
                </Button>
              </div>
              {selectedFiles && selectedFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            {/* Existing images */}
            <div>
              <h4 className="text-sm font-medium mb-3">
                Existing Images{images.length > 0 && ` (${images.length})`}
              </h4>
              {images.length === 0 ? (
                <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {images.map((imagePath) => (
                    <div key={imagePath} className="relative group rounded-lg overflow-hidden border border-border">
                      <img
                        src={`${IMG_BASE}${imagePath}`}
                        alt={currentRoom.name}
                        className="w-full h-28 object-cover"
                      />
                      <button
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(imagePath)}
                        disabled={isDeletingImage === imagePath}
                        aria-label="Delete image"
                      >
                        {isDeletingImage === imagePath ? (
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                          <XCircle className="h-6 w-6 text-white" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <EditRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={currentRoom}
      />
    </>
  );
}

const RoomDetailSkeleton = () => (
  <div className="container mx-auto p-6 space-y-7">
    {/* breadcrumb */}
    <Skeleton className="h-4 w-48" />
    {/* hero */}
    <Skeleton className="w-full h-80 md:h-[440px] rounded-xl" />
    {/* thumbnails */}
    <div className="grid grid-cols-3 gap-3">
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
    </div>
    {/* title row */}
    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
      <div className="space-y-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2 text-right">
        <Skeleton className="h-9 w-32" />
        <div className="flex gap-2 justify-end">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
    {/* cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  </div>
);
