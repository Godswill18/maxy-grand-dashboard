// src/components/modals/EditRoomModal.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoomStore} from "@/store/useRoomStore"; // Adjust path as needed
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Define the shape of the room prop
interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any;
}

// Validation schema for text-only fields
const formSchema = z.object({
  name: z.string().min(1, "Room name/type is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  description: z.string().min(1, "Description is required"),
  amenities: z.string().min(1, "Amenities are required (comma-separated)"),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  isAvailable: z.boolean().default(true),
  hotelId: z.string().min(1, "Hotel ID is required"), // Added hotelId
});

export function EditRoomModal({ isOpen, onClose, room }: EditRoomModalProps) {
  // Get update action and loading state from the store
  const { updateRoom, isLoading } = useRoomStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      roomNumber: "",
      description: "",
      amenities: "",
      price: 0,
      capacity: 1,
      isAvailable: true,
      hotelId: "",
    },
  });

  // When the modal opens or the room data changes, reset the form
  useEffect(() => {
    if (room) {
      form.reset({
        ...room,
        // Handle if amenities is an array (convert to string for form)
        amenities: Array.isArray(room.amenities)
          ? room.amenities.join(", ")
          : room.amenities,
      });
    }
  }, [room, form, isOpen]);

  // Handle the text-only update
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!room) return;

    // Convert amenities string back to array if needed by your schema,
    // or just send the string if your backend handles it.
    const dataToUpdate: any = {
      ...values,
      // amenities: values.amenities.split(',').map(s => s.trim()), // Example
    };

    const result = await updateRoom(room._id, dataToUpdate);

    if (result.success) {
      toast.success("Room details updated successfully!");
      onClose();
    } else {
      toast.error("Failed to update room details.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Room Details</DialogTitle>
          <DialogDescription>
            Update the text-based information for this room.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* --- Form fields (name, roomNumber, etc.) --- */}
            {/* I'm including a few key fields as an example */}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Type (Name)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Deluxe King" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roomNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 101" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A spacious room with..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (per night)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
             <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenities (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., WiFi, AC, TV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}