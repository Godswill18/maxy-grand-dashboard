import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

interface ExtendStayDialogProps {
  bookingId: string;
  guestName: string;
  currentCheckOut: string;
  roomRate: number;
  onExtend: (bookingId: string, days: number, additionalAmount: number) => Promise<void>;
}

export default function ExtendStayDialog({ 
  bookingId, 
  guestName, 
  currentCheckOut, 
  roomRate,
  onExtend 
}: ExtendStayDialogProps) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(false);

  const additionalAmount = days * roomRate;
  const newCheckOutDate = new Date(currentCheckOut);
  newCheckOutDate.setDate(newCheckOutDate.getDate() + days);

  const handleExtend = async () => {
    if (days < 1 || days > 30) {
      toast.error("Please enter a valid number of days (1-30)");
      return;
    }

    setLoading(true);
    try {
      await onExtend(bookingId, days, additionalAmount);
      toast.success(`Stay extended by ${days} day(s) successfully!`);
      setOpen(false);
      setDays(1); // Reset
    } catch (error) {
      toast.error("Failed to extend stay");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            <Label htmlFor="days">Number of Additional Days</Label>
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
              <span className="text-sm text-muted-foreground">days</span>
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
                <span className="text-sm font-semibold">Additional Charges:</span>
                <span className="text-lg font-bold text-primary">
                  ₦{additionalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> The additional charges will be added to the total booking amount. 
              Please ensure payment is collected before extending the stay.
            </p>
          </div>
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
            {loading ? "Extending..." : `Extend Stay by ${days} Day(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}