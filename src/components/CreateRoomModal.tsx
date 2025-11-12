// src/components/CreateRoomModal.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoomStore } from "@/store/useRoomStore";
import { useBranchStore } from "@/store/useBranchStore"

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner"; // Using sonner for toast notifications\
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

// Validation schema
const formSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  name: z.string().min(1, "Room name/type is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  description: z.string().min(1, "Description is required"),
  amenities: z.string().min(1, "Amenities are required (comma-separated)"),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  isAvailable: z.boolean().default(true),
  images: z.instanceof(FileList).refine(files => files.length > 0, "At least one image is required"),
});

export function CreateRoomModal() {
  const { isModalOpen, closeModal, createRoom, isLoading, error } = useRoomStore();
  const { branches, fetchBranches, isLoading: isBranchesLoading } = useBranchStore();
  const [fileInputKey, setFileInputKey] = useState(Date.now().toString()); // To reset file input

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hotelId: "", // You might get this from context or a prop
      name: "",
      roomNumber: "",
      description: "",
      amenities: "",
      price: 0,
      capacity: 1,
      isAvailable: true,
      images: undefined,
    },
  });

    // ✅ Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    
    // Append all text fields
    formData.append("hotelId", values.hotelId);
    formData.append("name", values.name);
    formData.append("roomNumber", values.roomNumber);
    formData.append("description", values.description);
    
    // Your backend expects 'amenities' - it's unclear if it's an array or string.
    // This sends it as a comma-separated string.
    formData.append("amenities", values.amenities);
    
    formData.append("price", values.price.toString());
    formData.append("capacity", values.capacity.toString());
    formData.append("isAvailable", values.isAvailable.toString());

    // Append all image files
    if (values.images) {
      for (let i = 0; i < values.images.length; i++) {
        formData.append("images", values.images[i]);
      }
    }

    const result = await createRoom(formData);

    if (result.success) {
      toast.success("Room created successfully!");
      form.reset();
      setFileInputKey(Date.now().toString()); // Reset file input
      closeModal();
    } else {
      toast.error(`Failed to create room: ${error}`);
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={closeModal}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new room.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            
                         {/* ✅ Hotel Branch Dropdown */}
            <FormField
              control={form.control}
              name="hotelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hotel Branch</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isBranchesLoading
                              ? "Loading branches..."
                              : "Select a hotel branch"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.length > 0 ? (
                          branches.map((branch) => (
                            <SelectItem key={branch._id} value={branch._id}>
                              {branch.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem disabled value="">
                            No branches available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


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
            
            <FormField
              control={form.control}
      
              name="amenities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amenities</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., WiFi, AC, TV" {...field} />
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
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Images</FormLabel>
                  <FormControl>
                    <Input
                      key={fileInputKey} // Add this key
                      type="file"
                      multiple
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Available for Booking</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}