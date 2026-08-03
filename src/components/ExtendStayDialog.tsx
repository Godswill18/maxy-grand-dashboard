import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export interface BlockedCapacityData {
  blockedDate: string;
  roomTypeId: string;
  roomTypeName?: string;
  totalUnits: number;
  bookedCount: number;
  currentCheckOutDate: string;
  requestedNewCheckOutDate: string;
}

interface ExtendStayDialogProps {
  bookingId: string;
  guestName: string;
  currentCheckOut: string;
  roomRate: number;
  // v2 bookings go through capacity checking + payment collection in the
  // same request; legacy bookings keep today's simpler, unchanged flow
  // (no availability check exists for them — see extendStayV2's doc
  // comment on why legacy is out of scope for this feature).
  isV2: boolean;
  onExtendLegacy: (bookingId: string, days: number, additionalAmount: number) => Promise<void>;
  onExtendV2: (bookingId: string, additionalNights: number, amountCollected: number, paymentNote?: string) => Promise<any>;
  // Called when the server reports the category is at capacity for the
  // added nights — Phase C wires this to an inline reassignment dialog;
  // until then this just surfaces the message with a pointer to Booking
  // Management, where reassignment already exists.
  onBlockedCapacity?: (data: BlockedCapacityData) => void;
}

export default function ExtendStayDialog({
  bookingId,
  guestName,
  currentCheckOut,
  roomRate,
  isV2,
  onExtendLegacy,
  onExtendV2,
  onBlockedCapacity,
}: ExtendStayDialogProps) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(1);
  const [amountCollected, setAmountCollected] = useState(0);
  const [balanceAcknowledged, setBalanceAcknowledged] = useState(false);
  const [paymentNote, setPaymentNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState<BlockedCapacityData | null>(null);

  // Estimate only — the server always recomputes this from the booking's
  // current effective category rate and is the authoritative source once
  // the request succeeds.
  const estimatedAmount = days * roomRate;
  const newCheckOutDate = new Date(currentCheckOut);
  newCheckOutDate.setDate(newCheckOutDate.getDate() + days);

  const resetForm = () => {
    setDays(1);
    setAmountCollected(0);
    setBalanceAcknowledged(false);
    setPaymentNote("");
    setBlocked(null);
  };

  const handleExtend = async () => {
    if (days < 1 || days > 30) {
      toast.error("Please enter a valid number of days (1-30)");
      return;
    }

    if (!isV2) {
      // Legacy path — unchanged behavior.
      setLoading(true);
      try {
        await onExtendLegacy(bookingId, days, estimatedAmount);
        toast.success(`Stay extended by ${days} day(s) successfully!`);
        setOpen(false);
        resetForm();
      } catch (error) {
        toast.error("Failed to extend stay");
      } finally {
        setLoading(false);
      }
      return;
    }

    // v2 path — payment collected in the same request; short of the full
    // estimate requires explicit acknowledgment that the guest will settle
    // the balance later (partial payment is tolerated, same as everywhere
    // else in this app).
    if (amountCollected < estimatedAmount && !balanceAcknowledged) {
      toast.error("Please collect the full amount or confirm the guest will settle the balance later");
      return;
    }

    setLoading(true);
    try {
      const result = await onExtendV2(bookingId, days, amountCollected, paymentNote || undefined);

      if (result?.success) {
        toast.success(result.message || `Stay extended by ${days} night(s) successfully!`);
        setOpen(false);
        resetForm();
      } else if (result?.error === "BLOCKED_CAPACITY") {
        setBlocked(result.data as BlockedCapacityData);
      } else {
        toast.error(result?.message || result?.error || "Failed to extend stay");
      }
    } catch (error) {
      toast.error("Failed to extend stay");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1">
          <Clock className="h-4 w-4 mr-2" />
          Extend Stay
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Guest Stay</DialogTitle>
        </DialogHeader>

        {blocked ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-800">
                  {blocked.roomTypeName || "This room category"} has no availability on{" "}
                  {new Date(blocked.blockedDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
                <p className="text-xs text-red-700">
                  {blocked.bookedCount}/{blocked.totalUnits} units booked for that night — the stay can't be
                  extended through the requested checkout date on the current room category.
                </p>
                <p className="text-xs text-red-700">
                  Moving to another room in the same category won't help — it doesn't free any extra category
                  capacity. Move the guest to a different room category with availability (Booking Management →
                  Reassign Room), then retry this extension.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setBlocked(null)}>
                Try Fewer Nights
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onBlockedCapacity?.(blocked);
                  setOpen(false);
                }}
              >
                Go to Reassign Room
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label>Guest Name</Label>
                <Input value={guestName} disabled />
              </div>

              <div>
                <Label>Current Check-out Date</Label>
                <Input
                  value={new Date(currentCheckOut).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="days">Number of Additional {isV2 ? "Nights" : "Days"}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="days"
                    type="number"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">{isV2 ? "nights" : "days"}</span>
                </div>
              </div>

              <div className="p-4 bg-primary/5 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">New Check-out Date:</span>
                  </div>
                  <span className="text-sm font-bold">
                    {newCheckOutDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Room Rate/Night:</span>
                  </div>
                  <span className="text-sm">₦{roomRate.toLocaleString()}</span>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Estimated Additional Charges:</span>
                    <span className="text-lg font-bold text-primary">
                      ₦{estimatedAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimate only — the final amount is confirmed by the server when you submit.
                  </p>
                </div>
              </div>

              {isV2 ? (
                <div className="p-4 border rounded-lg space-y-3">
                  <Label htmlFor="amountCollected">Amount Collected Now (₦)</Label>
                  <Input
                    id="amountCollected"
                    type="number"
                    min="0"
                    value={amountCollected}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setAmountCollected(Number.isFinite(v) && v >= 0 ? v : 0);
                    }}
                  />
                  {amountCollected < estimatedAmount && (
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="balanceAcknowledged"
                        checked={balanceAcknowledged}
                        onCheckedChange={(checked) => setBalanceAcknowledged(checked as boolean)}
                      />
                      <Label htmlFor="balanceAcknowledged" className="text-xs font-normal leading-tight cursor-pointer">
                        Guest will pay the remaining balance (₦{(estimatedAmount - amountCollected).toLocaleString()}) before departure
                      </Label>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="paymentNote" className="text-xs">Note (optional)</Label>
                    <Input
                      id="paymentNote"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder="e.g. cash, POS reference"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800">
                    <strong>Note:</strong> The additional charges will be added to the total booking amount.
                    Please ensure payment is collected before extending the stay.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleExtend}
                disabled={loading}
              >
                {loading ? "Extending..." : `Extend Stay by ${days} ${isV2 ? "Night" : "Day"}${days > 1 ? "s" : ""}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
