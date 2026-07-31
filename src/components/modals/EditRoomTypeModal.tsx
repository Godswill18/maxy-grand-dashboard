// src/components/modals/EditRoomTypeModal.tsx
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoomTypeV2Store } from "@/store/useRoomTypeV2Store";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ROOM_AMENITIES = [
  'WiFi', 'Smart TV', 'Cable TV',
  'Air Conditioning', 'Ceiling Fan', 'Heating',
  'Bathtub', 'Shower', 'Hair Dryer',
  'Mini Bar', 'Refrigerator', 'Microwave', 'Kettle', 'Coffee Maker',
  'Safe', 'Iron & Ironing Board', 'Work Desk', 'Wardrobe',
  'Room Service', 'Laundry Service', 'Telephone',
  'Balcony', 'City View', 'Pool View', 'Sea View',
  'Pool Access', 'Gym Access', 'Parking', 'Breakfast Included',
  'King Bed', 'Queen Bed', 'Sofa Bed',
  'Non-Smoking', 'Pet Friendly', 'Wheelchair Accessible',
];

interface EditRoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomType: any;
}

const formSchema = z.object({
  description: z.string().optional(),
  bedConfig: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  basePrice: z.coerce.number().min(1, "Base price must be at least 1"),
  maxOccupancy: z.coerce.number().min(1, "Max occupancy must be at least 1"),
  categoryTag: z.string().min(1, "Category tag is required"),
});

export function EditRoomTypeModal({ isOpen, onClose, roomType }: EditRoomTypeModalProps) {
  const { updateRoomType, isLoading, roomTypes } = useRoomTypeV2Store();

  // Freeform tag suggestions drawn from whatever's already in use — not a
  // separate managed list. See merge plan: RoomCategory folded into
  // RoomTypeV2's own categoryTag field.
  const existingCategoryTags = Array.from(
    new Set(roomTypes.map((rt) => rt.categoryTag).filter((t): t is string => !!t))
  ).sort();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      bedConfig: "",
      amenities: [],
      basePrice: 0,
      maxOccupancy: 1,
      categoryTag: "",
    },
  });

  useEffect(() => {
    if (roomType && isOpen) {
      form.reset({
        description: roomType.description ?? "",
        bedConfig: roomType.bedConfig ?? "",
        amenities: Array.isArray(roomType.amenities) ? roomType.amenities : [],
        basePrice: roomType.basePrice ?? 0,
        maxOccupancy: roomType.maxOccupancy ?? 1,
        categoryTag: roomType.categoryTag ?? "",
      });
    }
  }, [roomType?._id, isOpen]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!roomType) return;

    const result = await updateRoomType(roomType._id, values);

    if (result.success) {
      toast.success("Room category updated successfully!");
      onClose();
    } else {
      toast.error(result.error || "Failed to update room category.");
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Room Category</DialogTitle>
          <DialogDescription>
            Update the category-level details. Physical units are managed separately below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Tag</FormLabel>
                  <FormControl>
                    <>
                      <Input
                        list="category-tag-suggestions-edit"
                        placeholder="e.g., Suites"
                        {...field}
                      />
                      <datalist id="category-tag-suggestions-edit">
                        {existingCategoryTags.map((tag) => (
                          <option key={tag} value={tag} />
                        ))}
                      </datalist>
                    </>
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
              name="bedConfig"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bed Configuration</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 1 King Bed" {...field} />
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                      {ROOM_AMENITIES.map((amenity) => {
                        const selected = (field.value as string[]).includes(amenity);
                        return (
                          <button
                            key={amenity}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? (field.value as string[]).filter((a) => a !== amenity)
                                : [...(field.value as string[]), amenity];
                              field.onChange(next);
                            }}
                            className={[
                              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left',
                              selected
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-foreground border-border hover:bg-muted',
                            ].join(' ')}
                          >
                            <span className="shrink-0 text-xs">{selected ? '✓' : '+'}</span>
                            <span className="truncate">{amenity}</span>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(field.value as string[]).length} selected
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="basePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price (per night)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxOccupancy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Occupancy</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
