import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRoomTypeV2Store, type RoomUnit } from "@/store/useRoomTypeV2Store";
import { getBookingRoomDisplay } from "@/lib/bookingDisplay";
import { cn } from "@/lib/utils";

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

interface ReassignRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: any;
  // Excludes an entire category from the picker, not just the guest's
  // current unit — used when this dialog is opened as the remedy for a
  // BLOCKED_CAPACITY stay extension: moving to another room in the SAME
  // category the extension was blocked on doesn't free any category-level
  // capacity, so offering it as an option would be a no-op.
  excludeCategoryId?: string;
  onSuccess?: () => void;
}

/**
 * Shared "move a guest to a different available room" dialog — v2/category-
 * model bookings only. The booked category (roomTypeV2Id) is never changed;
 * this records an authorized move (possibly cross-category) with its price
 * delta, atomically on the backend (reassignRoomV2).
 *
 * Extracted from BookingManagement.tsx's inline implementation so the same
 * flow can also be triggered from ExtendStayDialog's blocked-capacity
 * remedy — behavior for BookingManagement's own callers is unchanged.
 */
export default function ReassignRoomDialog({
  open,
  onOpenChange,
  booking,
  excludeCategoryId,
  onSuccess,
}: ReassignRoomDialogProps) {
  const { reassignRoom } = useRoomTypeV2Store();

  const [units, setUnits] = useState<RoomUnit[]>([]);
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState<"upgrade" | "downgrade" | "lateral" | "other">("lateral");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !booking) return;

    setSelected("");
    setReason("lateral");
    setNote("");
    setLoading(true);

    (async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/api/room-types-v2/units/board`, { credentials: "include" });
        const data = await res.json();
        const currentUnitId = booking.roomUnitId?._id;
        const available = ((data.data || []) as RoomUnit[]).filter((u) => {
          if (u.status !== "available" || !u.isActive || u._id === currentUnitId) return false;
          if (excludeCategoryId) {
            const catId = typeof u.roomTypeId === "object" ? u.roomTypeId._id : u.roomTypeId;
            if (catId === excludeCategoryId) return false;
          }
          return true;
        });
        setUnits(available);
      } catch {
        toast.error("Failed to load available rooms.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, booking, excludeCategoryId]);

  // Price comparison baseline: the booked category's rate. (A guest who was
  // already reassigned once would ideally compare against their most recent
  // rate, but that history isn't populated on the booking object passed in
  // here — the backend's own delta calculation, which does use the correct
  // baseline, is authoritative; this is just a client-side preview.)
  const currentCategoryPrice = typeof booking?.roomTypeV2Id === "object"
    ? booking.roomTypeV2Id.basePrice
    : undefined;

  const selectedUnit = units.find((u) => u._id === selected);
  const nights = booking
    ? Math.max(1, Math.round((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / 86400000))
    : 1;
  const newPrice = selectedUnit && typeof selectedUnit.roomTypeId === "object"
    ? selectedUnit.roomTypeId.basePrice
    : undefined;
  const pricePreview = newPrice !== undefined && currentCategoryPrice !== undefined
    ? Math.round(nights * (newPrice - currentCategoryPrice))
    : null;

  const handleConfirm = async () => {
    if (!booking || !selected) return;
    setLoading(true);
    try {
      const result = await reassignRoom(booking._id, selected, reason, note || undefined);
      if (result.success) {
        toast.success("Room reassigned successfully.");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to reassign room.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reassign Room</DialogTitle>
          <DialogDescription>
            Move {booking?.guestName} to a different available room — same or a different category.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 rounded-lg border bg-muted/40 text-sm">
          <p className="text-muted-foreground">Currently</p>
          <p className="font-medium mt-0.5">
            {booking ? getBookingRoomDisplay(booking).label : ""}
          </p>
        </div>

        {loading && units.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading available rooms...</p>
        ) : units.length === 0 ? (
          <p className="text-sm text-destructive py-4 text-center">No other rooms available right now.</p>
        ) : (
          <div className="space-y-1.5">
            <Label>Select New Room</Label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder="Choose a room" /></SelectTrigger>
              <SelectContent>
                {units.map((u) => {
                  const catName = (typeof u.roomTypeId === "object" ? u.roomTypeId.name : "") || "Unknown Category";
                  const catPrice = typeof u.roomTypeId === "object" ? u.roomTypeId.basePrice : undefined;
                  return (
                    <SelectItem key={u._id} value={u._id}>
                      Room {u.roomNumber} — {catName}{catPrice !== undefined ? ` (₦${catPrice.toLocaleString()}/night)` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Reason</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="upgrade">Upgrade</SelectItem>
              <SelectItem value="downgrade">Downgrade</SelectItem>
              <SelectItem value="lateral">Same category / lateral move</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Note (optional)</Label>
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. guest requested a quieter room" />
        </div>

        {selected && pricePreview !== null && pricePreview !== 0 && (
          <div className={cn(
            "p-3 rounded-lg border text-sm font-medium",
            pricePreview > 0 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-blue-300 bg-blue-50 text-blue-800"
          )}>
            {pricePreview > 0
              ? `Guest owes ₦${pricePreview.toLocaleString()} more — recorded as due at desk.`
              : `Guest overpaid by ₦${Math.abs(pricePreview).toLocaleString()} — recorded for manual resolution.`}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!selected || loading}
          >
            {loading ? "Saving..." : "Confirm Reassignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
