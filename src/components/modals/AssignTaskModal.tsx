import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHousekeepingStore } from "@/store/useHousekeepingStore";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssignTaskModal({ isOpen, onClose }: AssignTaskModalProps) {
  const { rooms, cleaners, assignTask, isLoading } = useHousekeepingStore();
  
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedCleaner, setSelectedCleaner] = useState("");
  const [notes, setNotes] = useState("");

  // Filter rooms: Only show rooms that are NOT currently being cleaned
  const assignableRooms = rooms.filter(room => room.status !== 'cleaning');

  const handleAssign = async () => {
    if (!selectedRoom || !selectedCleaner) {
      toast.error("Please select both a room and a cleaner");
      return;
    }

    const success = await assignTask(selectedRoom, selectedCleaner, notes);
    if (success) {
      toast.success("Cleaning task assigned successfully");
      setNotes("");
      setSelectedRoom("");
      setSelectedCleaner("");
      onClose();
    } else {
      toast.error("Failed to assign task");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Cleaning Task</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          
          {/* Room Selection */}
          <div className="grid gap-2">
            <Label htmlFor="room">Select Room</Label>
            <Select onValueChange={setSelectedRoom} value={selectedRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room..." />
              </SelectTrigger>
              <SelectContent>
                {assignableRooms.map((room) => (
                  <SelectItem key={room._id} value={room._id}>
                    Room {room.roomNumber} ({room.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cleaner Selection */}
          <div className="grid gap-2">
            <Label htmlFor="cleaner">Assign Cleaner</Label>
            <Select onValueChange={setSelectedCleaner} value={selectedCleaner}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff..." />
              </SelectTrigger>
              <SelectContent>
                {cleaners.length > 0 ? (
                  cleaners.map((cleaner) => (
                    <SelectItem key={cleaner._id} value={cleaner._id}>
                      {cleaner.name || cleaner.email}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No cleaners found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Special Instructions</Label>
            <Textarea 
              id="notes" 
              placeholder="e.g. Deep clean required, Guest allergies..." 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}