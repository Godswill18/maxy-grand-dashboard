// src/components/CreateRoomTypeModal.tsx
// Creates a Room Category (sellable category) — no roomNumber here, that's added
// separately per physical unit via AddRoomUnitModal.
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRoomTypeV2Store } from "@/store/useRoomTypeV2Store";
import { useBranchStore } from "@/store/useBranchStore";
import { useAuthStore } from "@/store/useAuthStore";

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
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const formSchema = z.object({
  hotelId: z.string().min(1, "Hotel ID is required"),
  description: z.string().optional(),
  bedConfig: z.string().optional(),
  amenities: z.array(z.string()).default([]),
  basePrice: z.coerce.number().min(1, "Base price must be at least 1"),
  maxOccupancy: z.coerce.number().min(1, "Max occupancy must be at least 1"),
  categoryTag: z.string().min(1, "Category tag is required"),
  isBookable: z.boolean().default(true),
  images: z.instanceof(FileList).refine((files) => files.length > 0, "At least one image is required"),
});

interface CreateRoomTypeModalProps {
  onCreated?: () => void;
}

export function CreateRoomTypeModal({ onCreated }: CreateRoomTypeModalProps = {}) {
  const { isCreateModalOpen, closeCreateModal, createRoomType, isLoading, error, roomTypes } = useRoomTypeV2Store();
  const { branches, fetchBranches, isLoading: isBranchesLoading } = useBranchStore();
  const { user } = useAuthStore();

  const [fileInputKey, setFileInputKey] = useState(Date.now().toString());

  // Freeform tag suggestions drawn from whatever's already in use — not a
  // separate managed list. See merge plan: RoomCategory folded into
  // RoomTypeV2's own categoryTag field.
  const existingCategoryTags = Array.from(
    new Set(roomTypes.map((rt) => rt.categoryTag).filter((t): t is string => !!t))
  ).sort();

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hotelId: "",
      description: "",
      bedConfig: "",
      amenities: [],
      basePrice: 0,
      maxOccupancy: 1,
      categoryTag: "",
      isBookable: true,
      images: undefined,
    },
  });

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (isAdmin && user?.hotelId) {
      form.setValue("hotelId", user.hotelId);
    }
  }, [isAdmin, user?.hotelId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const formData = new FormData();
    formData.append("hotelId", values.hotelId);
    if (values.description) formData.append("description", values.description);
    if (values.bedConfig) formData.append("bedConfig", values.bedConfig);
    values.amenities.forEach((a) => formData.append("amenities", a));
    formData.append("basePrice", values.basePrice.toString());
    formData.append("maxOccupancy", values.maxOccupancy.toString());
    formData.append("isBookable", values.isBookable.toString());
    formData.append("categoryTag", values.categoryTag);
    if (values.images) {
      for (let i = 0; i < values.images.length; i++) {
        formData.append("images", values.images[i]);
      }
    }

    const result = await createRoomType(formData);

    if (result.success) {
      toast.success("Room category created successfully!");
      form.reset();
      if (isAdmin && user?.hotelId) {
        form.setValue("hotelId", user.hotelId);
      }
      setFileInputKey(Date.now().toString());
      closeCreateModal();
      onCreated?.();
    } else {
      toast.error(`Failed to create room category: ${result.error || error}`);
    }
  }

  return (
    <Dialog open={isCreateModalOpen} onOpenChange={(o) => (o ? undefined : closeCreateModal())}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Room Category</DialogTitle>
          <DialogDescription>
            Create a sellable category, tagged by group (e.g. "Suites"). Add physical rooms to it afterward.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hotelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hotel Branch</FormLabel>
                  <FormControl>
                    <Select
                      disabled={isAdmin}
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className={isAdmin ? "opacity-70 cursor-not-allowed bg-muted" : ""}>
                        <SelectValue
                          placeholder={isBranchesLoading ? "Loading branches..." : "Select a hotel branch"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {branches?.length > 0 ? (
                          branches
                            .filter((branch) => isSuperAdmin || (isAdmin && branch._id === user.hotelId))
                            .map((branch) => (
                              <SelectItem key={branch._id} value={branch._id}>
                                {branch.name}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem disabled value="no-branches">
                            {isBranchesLoading ? "Loading..." : "No branches available"}
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
              name="categoryTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Tag</FormLabel>
                  <FormControl>
                    <>
                      <Input
                        list="category-tag-suggestions"
                        placeholder="e.g., Suites"
                        {...field}
                      />
                      <datalist id="category-tag-suggestions">
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

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Category Images</FormLabel>
                  <FormControl>
                    <Input
                      key={fileInputKey}
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
              name="isBookable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Bookable by Guests</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeCreateModal}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Room Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
