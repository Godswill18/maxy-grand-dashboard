// src/app/rooms/[id]/page.tsx
'use client'; // This must be a client component to use hooks

import { useEffect, useState } from 'react';
import { useParams, useNavigate, NavLink, Link } from 'react-router-dom';
import { useRoomStore } from '@/store/useRoomStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, Bed, Wifi, Tv, ImagePlus, XCircle, Loader2, Home, ChevronRight } from 'lucide-react'; // Example icons
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog';
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
import { formatMoney } from '@/components/utils/formatMoney';
import { EditRoomModal } from '@/components/modals/EditRoomModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// A placeholder for the edit modal
// const EditRoomModal = ({ isOpen, onClose, room }: { isOpen: boolean, onClose: () => void, room: any }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
//       <div className="bg-white p-6 rounded-lg">
//         <h2 className="text-xl font-bold mb-4">Edit Room (Modal Placeholder)</h2>
//         <p>This is where the form to edit '{room.name}' would go.</p>
//         <Button onClick={onClose} className="mt-4">Close</Button>
//       </div>
//     </div>
//   );
// };

export default function RoomDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const navigate = useNavigate();

  const { currentRoom, isLoading, error, fetchRoomById, updateRoom, deleteRoom, addImages, deleteImage } = useRoomStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null); // Track which image is deleting

 const [form, setForm] = useState({
  name: '',
  description: '',
  price: 0,
  capacity: 1,
  amenities: [] as string[],
  isAvailable: true,
  images: [] as string[],
  newImages: [] as File[], // for new uploads
});

useEffect(() => {
  if (currentRoom && !isModalOpen) {
    setForm({
      name: currentRoom.name || '',
      description: currentRoom.description || '',
      price: currentRoom.price || 0,
      capacity: currentRoom.capacity || 1,
      amenities: currentRoom.amenities || [],
      isAvailable: currentRoom.isAvailable ?? true,
      images: currentRoom.images || [],
      newImages: [],
    });
  }
}, [currentRoom, isModalOpen]);
  // Note: dependency updated below in the patch

  useEffect(() => {
    if (id) {
      fetchRoomById(id);
    }
  }, [id, fetchRoomById]);

//  const handleSave = async () => {
//   if (!id || !currentRoom) return;

//   const formData = new FormData();
//   formData.append("hotelId", currentRoom.hotelId);
//   formData.append("roomNumber", currentRoom.roomNumber);
//   formData.append("name", form.name);
//   formData.append("description", form.description);
//   formData.append("price", String(form.price));
//   formData.append("capacity", String(form.capacity));
//   formData.append("isAvailable", String(form.isAvailable));
//   formData.append("amenities", String(form.amenities));
//   formData.append("images", JSON.stringify(form.images)); // keep remaining old ones

//   form.newImages.forEach((file) => {
//     formData.append("newImages", file); // your backend should handle this field
//   });

//   const res = await updateRoom(id, formData as any);

//   if (res && res.success) {
//     toast.success("Room updated successfully");
//     setIsModalOpen(false);
//   } else {
//     toast.error("Failed to update room");
//   }
// };



  const handleDelete = async () => {
    if (!id) return;
    const res = await deleteRoom(id);
    if (res && (res as any).success) {
      toast.success('Room deleted');
      navigate('/rooms');
    } else {
      toast.error('Failed to delete room');
    }
  };

  // --- 👇 NEW: Handler for ADDING images ---
  const handleAddImages = async () => {
    if (!id || !selectedFiles || selectedFiles.length === 0) {
      toast.info("Please select one or more images to upload.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    // 'images' must match your multer key in roomsRoutes.js
    Array.from(selectedFiles).forEach(file => {
      formData.append('images', file); 
    });

    const { success } = await addImages(id, formData);
    
    if (success) {
      toast.success('Images added successfully.');
      setSelectedFiles(null);
      // Clear the file input element
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } else {
      toast.error('Failed to add images.');
    }
    setIsUploading(false);
  };

  // --- Handler for DELETING a single image ---
  const handleDeleteImage = async (imagePath: string) => {
    if (!id) return;
    setIsDeletingImage(imagePath); // Set loading state for this specific image

    const { success } = await deleteImage(id, imagePath);
    
    if (success) {
      toast.success('Image deleted successfully.');
    } else {
      toast.error('Failed to delete image.');
    }
    setIsDeletingImage(null); // Clear loading state
  };
  // --- deleting image end ---

  if (isLoading) {
    return <RoomDetailSkeleton />;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  if (!currentRoom) {
    return <div>Room not found.</div>;
  }

  const VITE_API_URL = import.meta.env.VITE_BACKEND_IMAGE_URL;

  return (
    <>
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in">

     <nav aria-label="Breadcrumb" className="mb-4 flex items-center text-sm text-muted-foreground">
  {/* 1. Dashboard / Home Root */}
  <Link 
    to="/manager" 
    className="flex items-center hover:text-foreground transition-colors"
  >
    <Home className="h-4 w-4" />
    <span className="sr-only">Dashboard</span>
  </Link>

  <ChevronRight className="h-4 w-4 mx-2" />

  {/* 2. Parent Link (The "Back to Rooms" part) */}
  <Link 
    to="/manager/rooms" 
    className="hover:text-foreground transition-colors"
  >
    Rooms
  </Link>

  <ChevronRight className="h-4 w-4 mx-2" />

  {/* 3. Current Page (Static text, not a link) */}
  <span className="font-medium text-foreground">
    Room Details {/* Replace this with dynamic content like `Room ${roomNumber}` or "Edit Room" */}
  </span>
</nav>
      {/* Image Carousel/Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(currentRoom.images || []).slice(0, 4).map((image, index) => (
            // {console.log(`${import.meta.env.VITE_BACKEND_IMAGE_URL}${image}`)}
          <img
            key={index}
            src={`${VITE_API_URL}${image}`}
            alt={`${currentRoom.name} image ${index + 1}`}
            className={`w-auto h-auto object-fit rounded-lg ${index === 0 ? 'md:col-span-2 md:h-96' : ''}`}
          />
        ))}
      </div>


      {/* Room Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            {currentRoom.name} - Room {currentRoom.roomNumber}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">{currentRoom.description}</p>
        </div>
        <div className="mt-4 md:mt-0 md:text-right">
          <div className="flex items-center justify-end gap-3">
            <Badge className={currentRoom.isAvailable ? 'bg-success' : 'bg-destructive'}>
              {currentRoom.isAvailable ? 'Available' : 'Unavailable'}
            </Badge>

            <>
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>Edit</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete room</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete <strong>{currentRoom.name}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          </div>

          <div className="text-3xl font-bold text-primary mt-2">
             {formatMoney(currentRoom.price)}
            <span className="text-lg font-normal text-muted-foreground">/night</span>
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-2xl font-semibold mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-4">
              {/* Assuming amenities is an array. If it's a string, split it */}
          <p>
             {currentRoom.amenities}
          </p>
                    {/* <Badge variant="secondary" className="text-sm p-2">
                      <Wifi className="h-4 w-4 mr-2" /> {currentRoom.amenities}
                    </Badge> */}
                
              {/* {(Array.isArray(currentRoom.amenities)
                    ? currentRoom.amenities
                    : typeof currentRoom.amenities === 'string'
                      ? (currentRoom.amenities as string).split(',') // cast to string to satisfy TypeScript
                      : []
                  ).map((amenity: string) => (
                    <Badge key={amenity} variant="secondary" className="text-sm p-2">
                      <Wifi className="h-4 w-4 mr-2" /> {amenity.trim()}
                    </Badge>
                  ))} */}
            </div>
          </div>
        </div>
        
        <div className="bg-muted/50 p-6 rounded-lg">
          <h3 className="text-2xl font-semibold mb-4">At a Glance</h3>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <span>Up to {currentRoom.capacity} guests</span>
            </li>
            <li className="flex items-center gap-3">
              <Bed className="h-5 w-5 text-primary" />
              <span>King Size Bed (example)</span>
            </li>
            <li className="flex items-center gap-3">
              <Tv className="h-5 w-5 text-primary" />
              <span>55" Smart TV (example)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* --- 👇 NEW: Image Management Card --- */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Images</CardTitle>
            <CardDescription>Add new images or remove existing ones for this room.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* --- Add New Images --- */}
            <div>
              <Label htmlFor="image-upload" className="text-base font-medium">Add New Images</Label>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  onChange={(e) => setSelectedFiles(e.target.files)}
                  className="flex-grow"
                />
                <Button onClick={handleAddImages} disabled={isUploading || !selectedFiles || selectedFiles.length === 0}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                  Upload
                </Button>
              </div>
            </div>

            {/* --- Existing Images Grid --- */}
            <div>
              <h4 className="text-base font-medium mb-4">Existing Images</h4>
              {currentRoom.images.length === 0 ? (
                <p className="text-muted-foreground">This room has no images.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {currentRoom.images.map((imagePath) => (
                    <div key={imagePath} className="relative group">
                      <img
                        src={`${VITE_API_URL}${imagePath}`}
                        alt={currentRoom.name}
                        className="w-full h-32 object-cover rounded-md border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteImage(imagePath)}
                        disabled={isDeletingImage === imagePath}
                      >
                        {isDeletingImage === imagePath ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* --- 👆 End of new card --- */}
    </div>

      {/* Edit dialog */}
        <EditRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={currentRoom}
      />

      </>
  );
}


// Loading skeleton for the details page
const RoomDetailSkeleton = () => (
  <div className="container mx-auto p-6 space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Skeleton className="w-full h-96 md:col-span-2" />
      <Skeleton className="w-full h-64" />
      <Skeleton className="w-full h-64" />
    </div>
    <div className="flex flex-col md:flex-row justify-between md:items-center">
      <div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-6 w-full mt-4" />
      </div>
      <div className="mt-4 md:mt-0 md:text-right">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-40 mt-2" />
      </div>
    </div>
  </div>
);