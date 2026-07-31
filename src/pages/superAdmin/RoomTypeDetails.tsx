// src/pages/superAdmin/RoomTypeDetails.tsx
// A Room Category's details plus the list of physical Room Units
// that belong to it. Used by both superadmin (/room-types-v2/:id) and
// manager (/manager/room-types-v2/:id).
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, MapPin, Users, BedDouble, Pencil, Trash2, Plus, Check, X, ImagePlus, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRoomTypeV2Store, type RoomUnit } from "@/store/useRoomTypeV2Store";
import { useAuthStore } from "@/store/useAuthStore";
import { EditRoomTypeModal } from "@/components/modals/EditRoomTypeModal";
import { AddRoomUnitModal } from "@/components/AddRoomUnitModal";
import { resolveImageUrl } from "@/lib/utils";

// 'occupied' is deliberately excluded — it can only be set by the check-in
// flow (checkInAndAssignRoom), never manually here. While a unit IS occupied,
// only 'maintenance' remains selectable (see the filter at the Select below);
// 'available'/'cleaning' require checking the guest out first (backend-enforced).
const UNIT_STATUS_OPTIONS: { value: RoomUnit['status']; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
];

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
};

const statusColors: Record<string, string> = {
  available: "bg-success text-success-foreground",
  occupied: "bg-destructive text-destructive-foreground",
  cleaning: "bg-orange-500 text-white",
  maintenance: "bg-yellow-500 text-white",
};

export default function RoomTypeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';

  const {
    currentRoomType, units, isLoading,
    fetchRoomTypeById, deleteRoomType, updateRoomUnitStatus, updateRoomUnit, deleteRoomUnit,
    openAddUnitModal, addRoomTypeImages, deleteRoomTypeImage, replaceRoomTypeImage,
  } = useRoomTypeV2Store();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [unitPendingDelete, setUnitPendingDelete] = useState<RoomUnit | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editRoomNumber, setEditRoomNumber] = useState("");
  const [editFloor, setEditFloor] = useState("");

  // Manage Images state
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);
  const [isReplacingImage, setIsReplacingImage] = useState<string | null>(null);
  const replaceTargetPath = useRef<string | null>(null);
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) fetchRoomTypeById(id);
  }, [id, fetchRoomTypeById]);

  const backHref = isSuperAdmin ? '/room-types-v2' : '/manager/room-types-v2';

  const handleDeleteRoomType = async () => {
    if (!currentRoomType) return;
    const result = await deleteRoomType(currentRoomType._id);
    if (result.success) {
      toast.success("Room type deleted successfully");
      navigate(backHref);
    } else {
      toast.error(result.error || "Failed to delete room category");
    }
    setIsDeleteOpen(false);
  };

  const handleStatusChange = async (unitId: string, status: RoomUnit['status']) => {
    const result = await updateRoomUnitStatus(unitId, status);
    if (result.success) {
      toast.success("Room unit status updated");
    } else {
      toast.error(result.error || "Failed to update status");
    }
  };

  const startEditingUnit = (unit: RoomUnit) => {
    setEditingUnitId(unit._id);
    setEditRoomNumber(unit.roomNumber);
    setEditFloor(unit.floor !== undefined ? String(unit.floor) : "");
  };

  const saveUnitEdit = async (unitId: string) => {
    const result = await updateRoomUnit(unitId, {
      roomNumber: editRoomNumber,
      floor: editFloor === "" ? undefined : Number(editFloor),
    });
    if (result.success) {
      toast.success("Room unit updated");
      setEditingUnitId(null);
    } else {
      toast.error(result.error || "Failed to update room unit");
    }
  };

  const handleDeleteUnit = async () => {
    if (!unitPendingDelete) return;
    const result = await deleteRoomUnit(unitPendingDelete._id);
    if (result.success) {
      toast.success("Room unit deleted");
    } else {
      toast.error(result.error || "Failed to delete room unit");
    }
    setUnitPendingDelete(null);
  };

  const handleAddImages = async () => {
    if (!currentRoomType || !selectedFiles || selectedFiles.length === 0) {
      toast.info("Please select one or more images to upload.");
      return;
    }
    setIsUploadingImages(true);
    const formData = new FormData();
    Array.from(selectedFiles).forEach((file) => formData.append("images", file));
    const { success, error } = await addRoomTypeImages(currentRoomType._id, formData);
    if (success) {
      toast.success("Images added successfully.");
      setSelectedFiles(null);
      const el = document.getElementById("room-type-image-upload") as HTMLInputElement | null;
      if (el) el.value = "";
    } else {
      toast.error(error || "Failed to add images.");
    }
    setIsUploadingImages(false);
  };

  const handleDeleteImage = async (imagePath: string) => {
    if (!currentRoomType) return;
    setIsDeletingImage(imagePath);
    const { success, error } = await deleteRoomTypeImage(currentRoomType._id, imagePath);
    if (success) toast.success("Image deleted.");
    else toast.error(error || "Failed to delete image.");
    setIsDeletingImage(null);
  };

  // "Select the image that should be edited" — clicking Edit on a specific
  // thumbnail opens a file picker scoped to that exact image; the chosen
  // file replaces it in place (same position in the gallery), rather than
  // deleting and re-adding at the end.
  const handleEditImageClick = (imagePath: string) => {
    replaceTargetPath.current = imagePath;
    replaceFileInputRef.current?.click();
  };

  const handleReplaceFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const oldPath = replaceTargetPath.current;
    e.target.value = ""; // allow re-selecting the same file later
    if (!file || !oldPath || !currentRoomType) return;

    setIsReplacingImage(oldPath);
    const { success, error } = await replaceRoomTypeImage(currentRoomType._id, oldPath, file);
    if (success) toast.success("Image replaced successfully.");
    else toast.error(error || "Failed to replace image.");
    setIsReplacingImage(null);
  };

  if (isLoading || !currentRoomType) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-md" />
      </div>
    );
  }

  const hotelName = typeof currentRoomType.hotelId === 'object' ? currentRoomType.hotelId.name : 'My Branch';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate(backHref)} className="pl-0">
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Room Categories
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {currentRoomType.images?.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 mb-6">
                {currentRoomType.images.map((img, i) => (
                  <img
                    key={i}
                    src={resolveImageUrl(img)}
                    alt={`${currentRoomType.name} ${i + 1}`}
                    className={`rounded-md object-cover ${i === 0 ? 'col-span-3 h-64' : 'h-24'}`}
                  />
                ))}
              </div>
            ) : (
              <div className="h-64 w-full bg-muted rounded-md mb-6 flex items-center justify-center">
                <span className="text-5xl">🏨</span>
              </div>
            )}

            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{currentRoomType.name}</h1>
                  <Badge variant={currentRoomType.isBookable ? "default" : "secondary"}>
                    {currentRoomType.isBookable ? "Bookable" : "Hidden"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {hotelName}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </div>

            {currentRoomType.description && (
              <p className="text-muted-foreground mb-4">{currentRoomType.description}</p>
            )}

            {currentRoomType.amenities?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentRoomType.amenities.map((a) => (
                  <Badge key={a} variant="outline">{a}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Facts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Base Price</span>
              <span className="font-semibold">₦{currentRoomType.basePrice?.toLocaleString()}/night</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-4 w-4" /> Max Occupancy</span>
              <span className="font-semibold">{currentRoomType.maxOccupancy}</span>
            </div>
            {currentRoomType.bedConfig && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-1"><BedDouble className="h-4 w-4" /> Bed Config</span>
                <span className="font-semibold">{currentRoomType.bedConfig}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Physical Units</span>
              <span className="font-semibold">{units.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Room Units ({units.length})</CardTitle>
          <Button size="sm" onClick={openAddUnitModal}>
            <Plus className="h-4 w-4 mr-1" /> Add Unit
          </Button>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No physical rooms yet — add the first unit for this room category.
            </p>
          ) : (
            <div className="space-y-2">
              {units.map((unit) => (
                <div key={unit._id} className="flex items-center gap-3 p-3 rounded-lg border">
                  {editingUnitId === unit._id ? (
                    <>
                      <Input
                        value={editRoomNumber}
                        onChange={(e) => setEditRoomNumber(e.target.value)}
                        className="w-28"
                        placeholder="Room #"
                      />
                      <Input
                        value={editFloor}
                        onChange={(e) => setEditFloor(e.target.value)}
                        className="w-24"
                        type="number"
                        placeholder="Floor"
                      />
                      <div className="flex gap-1 ml-auto">
                        <Button size="icon" variant="ghost" onClick={() => saveUnitEdit(unit._id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingUnitId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0">
                        <p className="font-semibold">Room {unit.roomNumber}</p>
                        {unit.floor !== undefined && (
                          <p className="text-xs text-muted-foreground">Floor {unit.floor}</p>
                        )}
                      </div>
                      <Badge className={statusColors[unit.status] || "bg-secondary"}>
                        {STATUS_LABELS[unit.status] || unit.status}
                      </Badge>
                      {!unit.isActive && <Badge variant="outline">Inactive</Badge>}

                      <div className="flex items-center gap-2 ml-auto">
                        <Select
                          value={unit.status === 'occupied' ? undefined : unit.status}
                          onValueChange={(value) => handleStatusChange(unit._id, value as RoomUnit['status'])}
                        >
                          <SelectTrigger className="w-44">
                            <SelectValue placeholder={unit.status === 'occupied' ? 'Occupied — check out first' : undefined} />
                          </SelectTrigger>
                          <SelectContent>
                            {(unit.status === 'occupied'
                              ? UNIT_STATUS_OPTIONS.filter((o) => o.value === 'maintenance')
                              : UNIT_STATUS_OPTIONS
                            ).map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" onClick={() => startEditingUnit(unit)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setUnitPendingDelete(unit)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Images</CardTitle>
          <CardDescription>
            Upload new photos, replace an existing one, or remove one entirely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload area */}
          <div className="border-2 border-dashed border-border rounded-xl p-5 space-y-3">
            <Label htmlFor="room-type-image-upload" className="text-sm font-medium">
              Add New Images
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="room-type-image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="flex-grow"
              />
              <Button
                onClick={handleAddImages}
                disabled={isUploadingImages || !selectedFiles || selectedFiles.length === 0}
                className="gap-2 shrink-0"
              >
                {isUploadingImages ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                {isUploadingImages ? "Uploading…" : "Upload"}
              </Button>
            </div>
            {selectedFiles && selectedFiles.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} selected
              </p>
            )}
          </div>

          {/* Hidden input driving the per-image "Edit" (replace) action */}
          <input
            ref={replaceFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleReplaceFileSelected}
          />

          {/* Existing images */}
          <div>
            <h4 className="text-sm font-medium mb-3">
              Existing Images{currentRoomType.images.length > 0 && ` (${currentRoomType.images.length})`}
            </h4>
            {currentRoomType.images.length === 0 ? (
              <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {currentRoomType.images.map((imagePath) => {
                  const busy = isDeletingImage === imagePath || isReplacingImage === imagePath;
                  return (
                    <div key={imagePath} className="relative group rounded-lg overflow-hidden border border-border">
                      <img
                        src={resolveImageUrl(imagePath)}
                        alt={currentRoomType.name}
                        className="w-full h-28 object-cover"
                      />
                      <div
                        className={`absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity ${
                          busy ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        }`}
                      >
                        {busy ? (
                          <Loader2 className="h-5 w-5 text-white animate-spin" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditImageClick(imagePath)}
                              aria-label="Edit image"
                              title="Replace this image"
                              className="text-white hover:text-accent transition-colors"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteImage(imagePath)}
                              aria-label="Delete image"
                              title="Delete this image"
                              className="text-white hover:text-destructive transition-colors"
                            >
                              <XCircle className="h-6 w-6" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditRoomTypeModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} roomType={currentRoomType} />
      <AddRoomUnitModal roomTypeId={currentRoomType._id} />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room category?</AlertDialogTitle>
            <AlertDialogDescription>
              {units.length > 0
                ? `This room category still has ${units.length} room unit(s). Delete or reassign them first — this action will be blocked until then.`
                : "This will permanently delete the room category and its images. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoomType} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!unitPendingDelete} onOpenChange={(open) => !open && setUnitPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room {unitPendingDelete?.roomNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this physical room from the room category. Blocked while occupied.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUnit} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
