// src/components/AddRoomUnitModal.tsx
// Adds a physical Room Unit (e.g. "204") to an existing Room Type. Opened
// from within a room type's detail page — roomTypeId comes from that page,
// not from global state, since it only makes sense in that context.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoomTypeV2Store } from "@/store/useRoomTypeV2Store";

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
import { toast } from "sonner";

const formSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required"),
  floor: z.coerce.number().optional(),
});

interface AddRoomUnitModalProps {
  roomTypeId: string;
}

export function AddRoomUnitModal({ roomTypeId }: AddRoomUnitModalProps) {
  const { isAddUnitModalOpen, closeAddUnitModal, addRoomUnit, isLoading, error } = useRoomTypeV2Store();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { roomNumber: "", floor: undefined },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await addRoomUnit(roomTypeId, values);

    if (result.success) {
      toast.success("Room unit added successfully!");
      form.reset();
      closeAddUnitModal();
    } else {
      toast.error(`Failed to add room unit: ${result.error || error}`);
    }
  }

  return (
    <Dialog open={isAddUnitModalOpen} onOpenChange={(o) => (o ? undefined : closeAddUnitModal())}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Room Unit</DialogTitle>
          <DialogDescription>
            Add a physical room to this room type. Price, amenities, and images are already set at the room type level.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 204" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Floor (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAddUnitModal}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Add Unit"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
