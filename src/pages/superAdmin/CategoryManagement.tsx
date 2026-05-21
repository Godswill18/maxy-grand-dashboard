import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, BedDouble } from "lucide-react";
import { useCategoryStore, type Category } from "@/store/useCategoryStore";
import { useAuthStore } from "@/store/useAuthStore";

// ── Form Dialog (Create / Edit) ──────────────────────────────────────────────
interface CategoryFormDialogProps {
    isOpen: boolean;
    onClose: () => void;
    category?: Category | null;
}

function CategoryFormDialog({ isOpen, onClose, category }: CategoryFormDialogProps) {
    const { createCategory, updateCategory } = useCategoryStore();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEditing = !!category;

    useEffect(() => {
        if (isOpen) {
            setName(category?.name ?? "");
            setDescription(category?.description ?? "");
            setIsActive(category?.isActive ?? true);
        }
    }, [isOpen, category]);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Category name is required");
            return;
        }
        setIsSubmitting(true);
        const result = isEditing
            ? await updateCategory(category!._id, { name, description, isActive })
            : await createCategory({ name, description });

        if (result.success) {
            toast.success(isEditing ? "Category updated" : "Category created");
            onClose();
        } else {
            toast.error(result.error || "Something went wrong");
        }
        setIsSubmitting(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Category" : "Add New Category"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the name, description, or visibility of this category."
                            : "Create a new room category to group and filter rooms."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1">
                        <Label htmlFor="cat-name">Name *</Label>
                        <Input
                            id="cat-name"
                            placeholder="e.g. Presidential Suite"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="cat-desc">Description</Label>
                        <Textarea
                            id="cat-desc"
                            placeholder="Optional description..."
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    {isEditing && (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium">Active</p>
                                <p className="text-xs text-muted-foreground">
                                    Inactive categories are hidden from guest filtering
                                </p>
                            </div>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Category"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Delete Confirmation Dialog ────────────────────────────────────────────────
interface DeleteDialogProps {
    isOpen: boolean;
    category: Category | null;
    allCategories: Category[];
    onClose: () => void;
}

function DeleteCategoryDialog({ isOpen, category, allCategories, onClose }: DeleteDialogProps) {
    const { deleteCategory } = useCategoryStore();
    const [reassignTo, setReassignTo] = useState<string>("");
    const [isDeleting, setIsDeleting] = useState(false);
    const hasRooms = (category?.roomCount ?? 0) > 0;
    const otherCategories = allCategories.filter((c) => c._id !== category?._id);

    useEffect(() => {
        if (isOpen) setReassignTo("");
    }, [isOpen]);

    const handleDelete = async () => {
        if (!category) return;
        setIsDeleting(true);
        const result = await deleteCategory(category._id, reassignTo || undefined);
        if (result.success) {
            toast.success("Category deleted successfully");
            onClose();
        } else {
            toast.error(result.error || "Failed to delete category");
        }
        setIsDeleting(false);
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete "{category?.name}"?</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3">
                            <p>This action cannot be undone.</p>
                            {hasRooms && (
                                <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                                    <p className="font-medium text-destructive mb-2">
                                        {category?.roomCount} room(s) are assigned to this category.
                                    </p>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Reassign rooms to (optional)</Label>
                                        <Select value={reassignTo} onValueChange={setReassignTo}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Leave unassigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="">Leave unassigned</SelectItem>
                                                {otherCategories.map((c) => (
                                                    <SelectItem key={c._id} value={c._id}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function CategoryManagement() {
    const { categories, isLoading, fetchCategoriesAdmin } = useCategoryStore();
    const { user } = useAuthStore();
    const isSuperAdmin = user?.role === "superadmin";

    const [formOpen, setFormOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

    useEffect(() => {
        fetchCategoriesAdmin();
    }, [fetchCategoriesAdmin]);

    const openCreate = () => {
        setEditingCategory(null);
        setFormOpen(true);
    };

    const openEdit = (cat: Category) => {
        setEditingCategory(cat);
        setFormOpen(true);
    };

    const openDelete = (cat: Category) => setDeleteTarget(cat);

    const handleFormClose = () => {
        setFormOpen(false);
        setEditingCategory(null);
        fetchCategoriesAdmin();
    };

    const handleDeleteClose = () => {
        setDeleteTarget(null);
        fetchCategoriesAdmin();
    };

    const totalRooms = categories.reduce((sum, c) => sum + (c.roomCount ?? 0), 0);
    const activeCount = categories.filter((c) => c.isActive).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Room Categories</h1>
                    <p className="text-muted-foreground">
                        Organise rooms into groups for filtering and management
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                    { label: "Total Categories", value: categories.length, color: "text-foreground", bg: "bg-muted",    border: "border-l-gray-400",  icon: <Tag      className="h-5 w-5 text-muted-foreground" /> },
                    { label: "Active",           value: activeCount,        color: "text-green-600", bg: "bg-green-50", border: "border-l-green-400", icon: <Tag      className="h-5 w-5 text-green-500" /> },
                    { label: "Rooms Assigned",   value: totalRooms,         color: "text-blue-600",  bg: "bg-blue-50",  border: "border-l-blue-400",  icon: <BedDouble className="h-5 w-5 text-blue-500" /> },
                ].map((s) => (
                    <Card key={s.label} className={cn("border-l-4", s.border)}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.bg)}>
                                {s.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                                <p className={cn("text-2xl font-bold leading-tight", s.color)}>
                                    {isLoading ? "—" : s.value}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Category List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border p-4 border-l-4 border-l-muted">
                                    <div className="flex items-start gap-3">
                                        <Skeleton className="w-8 h-8 rounded-md shrink-0" />
                                        <div className="space-y-1.5">
                                            <Skeleton className="h-4 w-36" />
                                            <Skeleton className="h-3 w-48" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Skeleton className="w-8 h-8 rounded-md" />
                                        <Skeleton className="w-8 h-8 rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : categories.length === 0 ? (
                        <Card className="border-dashed bg-muted/20">
                            <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                    <Tag className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">No categories yet</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">
                                        Create your first room category to start organising rooms.
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" onClick={openCreate}>
                                    <Plus className="h-4 w-4 mr-2" /> Add Category
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <div
                                    key={cat._id}
                                    className={cn(
                                        "flex items-center justify-between rounded-lg border border-l-4 p-4 hover:bg-muted/30 transition-colors",
                                        cat.isActive ? "border-l-green-400" : "border-l-gray-300"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-primary/10 rounded-md mt-0.5">
                                            <Tag className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium">{cat.name}</p>
                                                <Badge
                                                    className={cn(
                                                        "text-xs border",
                                                        cat.isActive
                                                            ? "bg-green-100 text-green-700 border-green-200"
                                                            : "bg-muted text-muted-foreground"
                                                    )}
                                                >
                                                    {cat.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </div>
                                            {cat.description && (
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    {cat.description}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                slug: <span className="font-mono">{cat.slug}</span>
                                                {" · "}
                                                <span className="font-medium text-foreground">
                                                    {cat.roomCount ?? 0}
                                                </span>{" "}
                                                room{(cat.roomCount ?? 0) !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openEdit(cat)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        {isSuperAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => openDelete(cat)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <CategoryFormDialog
                isOpen={formOpen}
                onClose={handleFormClose}
                category={editingCategory}
            />
            <DeleteCategoryDialog
                isOpen={!!deleteTarget}
                category={deleteTarget}
                allCategories={categories}
                onClose={handleDeleteClose}
            />
        </div>
    );
}
