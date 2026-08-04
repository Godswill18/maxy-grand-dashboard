import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useBranchStore } from "@/store/useBranchStore";
import { useRoomTypeV2Store } from "@/store/useRoomTypeV2Store";
import { useMaintenanceStore, type IssueType, type MaintenancePriority } from "@/store/useMaintenanceStore";

const ISSUE_TYPES: IssueType[] = [
  "Plumbing", "Electrical", "Furniture", "Air Conditioning", "Internet",
  "Television", "Water Supply", "Door/Lock", "Bathroom",
  "Cleaning Complaint", "Noise Complaint", "Other",
];

const PRIORITIES: MaintenancePriority[] = ["Low", "Medium", "High", "Critical"];

interface CreateMaintenanceRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Hand-rolled form (no shared upload component exists in this codebase —
// every existing form, e.g. CreateRoomModal.tsx, hand-rolls its own file
// inputs the same way). v2 (RoomUnit) rooms only.
export default function CreateMaintenanceRequestModal({ open, onOpenChange, onSuccess }: CreateMaintenanceRequestModalProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';
  const { branches, fetchBranches } = useBranchStore();
  const { unitsBoard, fetchUnitsBoard } = useRoomTypeV2Store();
  const { createRequest } = useMaintenanceStore();

  const [hotelId, setHotelId] = useState<string>(isSuperAdmin ? "" : (user?.hotelId as string) || "");
  const [roomUnitId, setRoomUnitId] = useState("");
  const [issueType, setIssueType] = useState<IssueType | "">("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<MaintenancePriority>("Medium");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [videos, setVideos] = useState<FileList | null>(null);
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && isSuperAdmin) fetchBranches();
  }, [open, isSuperAdmin, fetchBranches]);

  useEffect(() => {
    if (open && hotelId) fetchUnitsBoard(hotelId);
  }, [open, hotelId, fetchUnitsBoard]);

  const resetForm = () => {
    setRoomUnitId(""); setIssueType(""); setTitle(""); setDescription("");
    setPriority("Medium"); setPhotos(null); setVideos(null); setDocuments(null);
    if (isSuperAdmin) setHotelId("");
  };

  const handleSubmit = async () => {
    if (!hotelId) { toast.error("Please select a branch"); return; }
    if (!roomUnitId) { toast.error("Please select a room"); return; }
    if (!issueType) { toast.error("Please select an issue type"); return; }
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (!description.trim()) { toast.error("Please enter a description"); return; }

    const formData = new FormData();
    if (isSuperAdmin) formData.append("hotelId", hotelId);
    formData.append("roomUnitId", roomUnitId);
    formData.append("issueType", issueType);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("priority", priority);
    Array.from(photos || []).forEach((f) => formData.append("photos", f));
    Array.from(videos || []).forEach((f) => formData.append("videos", f));
    Array.from(documents || []).forEach((f) => formData.append("documents", f));

    setIsSubmitting(true);
    const result = await createRequest(formData);
    setIsSubmitting(false);
    if (result.success) {
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const isComplaint = issueType === "Cleaning Complaint" || issueType === "Noise Complaint";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raise {isComplaint ? "Complaint" : "Maintenance Request"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {isSuperAdmin && (
            <div className="space-y-1">
              <Label>Branch</Label>
              <Select value={hotelId} onValueChange={(v) => { setHotelId(v); setRoomUnitId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b: any) => (
                    <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1">
            <Label>Room</Label>
            <Select value={roomUnitId} onValueChange={setRoomUnitId} disabled={!hotelId || unitsBoard.length === 0}>
              <SelectTrigger><SelectValue placeholder={hotelId ? "Select room" : "Select a branch first"} /></SelectTrigger>
              <SelectContent>
                {unitsBoard.map((unit) => {
                  const category = typeof unit.roomTypeId === "object" ? unit.roomTypeId : null;
                  return (
                    <SelectItem key={unit._id} value={unit._id}>
                      Room {unit.roomNumber} {category ? `— ${category.name}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Issue Type</Label>
              <Select value={issueType} onValueChange={(v) => setIssueType(v as IssueType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as MaintenancePriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AC not cooling" />
          </div>

          <div className="space-y-1">
            <Label>Detailed Description</Label>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Photos</Label>
              <Input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Videos</Label>
              <Input type="file" accept="video/*" multiple onChange={(e) => setVideos(e.target.files)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Documents</Label>
              <Input type="file" multiple onChange={(e) => setDocuments(e.target.files)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
