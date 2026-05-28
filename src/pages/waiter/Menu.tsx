import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Minus, X,
  ShoppingCart, Edit, Trash2, AlertCircle,
  History, UtensilsCrossed, Clock, CheckCircle2, Printer, Search,
} from "lucide-react";
import { toast } from "sonner";
import { useMenuStore } from "@/store/menuStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { printReceipt } from "@/utils/printReceipt";

interface OrderData {
  orderType: 'room service' | 'pickup' | 'table service';
  roomNumber?: string;
  tableNumber?: string;
  customerName?: string;
  specialInstructions?: string;
}

export default function Menu() {
  const {
    menuItems,
    currentOrder,
    loading,
    error,
    canCreateMenu,
    canPlaceOrder,
    fetchMenuItems,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    createOrder,
    initializeCart,
    loadTrackedOrders,
    trackedOrderIds,
  } = useMenuStore();

  const { user } = useAuthStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("restaurant");
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "restaurant" as "bar" | "restaurant" | "room service",
    estimatedPrepTime: "",
  });
  const [menuImages, setMenuImages] = useState<FileList | null>(null);
  const [orderData, setOrderData] = useState<OrderData>({
    orderType: "table service",
    specialInstructions: "",
  });
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTrackedOrdersOpen, setIsTrackedOrdersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    initializeCart();
    fetchMenuItems();
  }, [fetchMenuItems, initializeCart]);

  useEffect(() => {
    if (user) {
      loadTrackedOrders();
    }
  }, [user, loadTrackedOrders]);

  const handleCreateMenuItem = async () => {
    if (!canCreateMenu()) {
      toast.error("Unauthorized: Only head waiters can create menu items");
      return;
    }

    if (!newMenuItem.name || !newMenuItem.price) {
      toast.error("Name and price are required");
      return;
    }

    if (!user?.hotelId) {
      toast.error("Hotel ID is missing. Please contact support.");
      return;
    }

    const formData = new FormData();
    formData.append("name", newMenuItem.name);
    formData.append("description", newMenuItem.description);
    formData.append("price", newMenuItem.price);
    formData.append("category", newMenuItem.category);

    if (newMenuItem.estimatedPrepTime) {
      formData.append("estimatedPrepTime", newMenuItem.estimatedPrepTime);
    }

    if (menuImages) {
      Array.from(menuImages).forEach((file) => {
        formData.append("images", file);
      });
    }

    try {
      await createMenuItem(formData);
      toast.success("Menu item created successfully");
      setIsCreateDialogOpen(false);
      setNewMenuItem({ name: "", description: "", price: "", category: "restaurant", estimatedPrepTime: "" });
      setMenuImages(null);
      await fetchMenuItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to create menu item");
    }
  };

  const handleAddToCart = (item: any, quantity: number = 1) => {
    if (!canPlaceOrder()) {
      toast.error("You don't have permission to place orders");
      return;
    }
    addToCart(item, quantity);
    toast.success(`${item.name} added to cart`);
  };

  const handlePlaceOrder = async () => {
    if (!canPlaceOrder()) {
      toast.error("You don't have permission to place orders");
      return;
    }

    if (currentOrder.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (orderData.orderType === 'room service' && !orderData.roomNumber) {
      toast.error("Room number is required for room service");
      return;
    }
    if (orderData.orderType === 'table service' && !orderData.tableNumber) {
      toast.error("Table number is required for table service");
      return;
    }
    if (orderData.orderType === 'pickup' && !orderData.customerName) {
      toast.error("Customer name is required for pickup orders");
      return;
    }

    try {
      const newOrder = await createOrder(orderData);
      toast.success("Order placed successfully");
      setIsOrderDialogOpen(false);
      setOrderData({ orderType: "table service", specialInstructions: "" });
      if (newOrder) {
        const waiterName = user ? `${user.firstName} ${user.lastName}` : undefined;
        printReceipt(newOrder, waiterName);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    }
  };

  const total = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const filteredMenuItems = menuItems.filter(
    (item) =>
      item.category === selectedCategory &&
      (searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const VITE_BACKEND_IMAGE_URL = (import.meta as any).env?.VITE_BACKEND_IMAGE_URL ?? 'http://localhost:5000';
  const imgUrl = (path: string) =>
    `${VITE_BACKEND_IMAGE_URL.replace(/\/$/, '')}/${path.replace(/\\/g, '/')}`;

  // Derived state for cart and category counts
  const cartMap = new Map(currentOrder.map((item) => [item.menuItemId, item]));
  const categoryCounts = {
    restaurant: menuItems.filter((i) => i.category === "restaurant").length,
    bar: menuItems.filter((i) => i.category === "bar").length,
    "room service": menuItems.filter((i) => i.category === "room service").length,
  };
  const cartQuantityTotal = currentOrder.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 animate-in fade-in duration-500">

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Restaurant Menu</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {canPlaceOrder() ? "Select items to add to your order" : "Browse our menu"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {canPlaceOrder() && trackedOrderIds.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsTrackedOrdersOpen(true)}>
              <History className="h-4 w-4 mr-2" />
              My Orders
              <span className="ml-1.5 text-xs opacity-70">({trackedOrderIds.length})</span>
            </Button>
          )}

          {canCreateMenu() && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Menu Item</DialogTitle>
                  <DialogDescription>Add a new item to the menu</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newMenuItem.name}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, name: e.target.value })}
                      placeholder="e.g., Grilled Chicken"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newMenuItem.description}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, description: e.target.value })}
                      placeholder="Brief description of the item"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">Price (₦) *</Label>
                      <Input
                        id="price"
                        type="number"
                        value={newMenuItem.price}
                        onChange={(e) => setNewMenuItem({ ...newMenuItem, price: e.target.value })}
                        placeholder="e.g., 4500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newMenuItem.category}
                        onValueChange={(value: any) => setNewMenuItem({ ...newMenuItem, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="restaurant">Restaurant</SelectItem>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="room service">Room Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="prepTime">Estimated Prep Time (minutes)</Label>
                    <Input
                      id="prepTime"
                      type="number"
                      value={newMenuItem.estimatedPrepTime}
                      onChange={(e) => setNewMenuItem({ ...newMenuItem, estimatedPrepTime: e.target.value })}
                      placeholder="e.g., 15"
                    />
                  </div>
                  <div>
                    <Label htmlFor="images">Images (up to 5)</Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setMenuImages(e.target.files)}
                    />
                  </div>
                  <Button onClick={handleCreateMenuItem} className="w-full" disabled={loading}>
                    {loading ? "Creating..." : "Create Menu Item"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Cart button with floating count badge */}
          {canPlaceOrder() && (
            <Button
              variant="outline"
              size="sm"
              className="relative"
              onClick={() => setIsCartSheetOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {cartQuantityTotal > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center leading-none">
                  {cartQuantityTotal > 9 ? "9+" : cartQuantityTotal}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setSearchQuery(""); }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="restaurant">
            Restaurant
            <span className="ml-1.5 text-xs opacity-70">({categoryCounts.restaurant})</span>
          </TabsTrigger>
          <TabsTrigger value="bar">
            Bar
            <span className="ml-1.5 text-xs opacity-70">({categoryCounts.bar})</span>
          </TabsTrigger>
          <TabsTrigger value="room service">
            Room Service
            <span className="ml-1.5 text-xs opacity-70">({categoryCounts["room service"]})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory}>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <Skeleton className="aspect-square w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-9 w-full mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
              <UtensilsCrossed className="h-14 w-14 opacity-30" />
              <p className="text-base font-medium text-foreground">No items in this category</p>
              {canCreateMenu() && (
                <p className="text-sm">Add your first item using the button above.</p>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMenuItems.map((item) => (
                <Card
                  key={item._id}
                  className={`group hover:shadow-lg transition-all duration-200 overflow-hidden${!item.isAvailable ? ' opacity-60' : ''}`}
                >
                  {/* Card image — square aspect ratio */}
                  <div className="relative aspect-square bg-gradient-to-br from-muted/60 to-muted flex items-center justify-center overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img
                        src={imgUrl(item.images[0])}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
                    )}

                    {/* Out of Stock badge or In-Cart indicator (mutually exclusive) */}
                    {!item.isAvailable ? (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                      </div>
                    ) : (
                      canPlaceOrder() && cartMap.has(item._id) && (
                        <div className="absolute top-2 right-2">
                          <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      )
                    )}

                    {/* Availability toggle for head waiters */}
                    {canCreateMenu() && (
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1">
                        <span className="text-xs text-muted-foreground">Available</span>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={async (value) => {
                            await updateMenuItem(item._id, { isAvailable: value });
                            toast.success(value ? "Meal is now available" : "Meal set to out of stock");
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{item.name}</CardTitle>
                      {canCreateMenu() && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditItem(item); setIsEditDialogOpen(true); }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => { setDeleteItem(item); setIsDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-primary">₦{item.price.toLocaleString()}</span>
                      {item.estimatedPrepTime && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          ~{item.estimatedPrepTime} min
                        </span>
                      )}
                    </div>

                    {/* View Details → opens Sheet */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => { setViewItem(item); setIsViewSheetOpen(true); }}
                    >
                      View Details
                    </Button>

                    {/* In-cart quantity controls OR Add to Cart */}
                    {canPlaceOrder() && item.isAvailable && (
                      cartMap.has(item._id) ? (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateCartQuantity(item._id, cartMap.get(item._id)!.quantity - 1)}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </Button>
                            <span className="w-8 text-center text-sm font-semibold">
                              {cartMap.get(item._id)!.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateCartQuantity(item._id, cartMap.get(item._id)!.quantity + 1)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <span className="text-sm font-semibold text-primary">
                            ₦{(item.price * cartMap.get(item._id)!.quantity).toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <Button size="sm" className="w-full" onClick={() => handleAddToCart(item)}>
                          <Plus className="h-4 w-4 mr-1.5" />
                          Add to Cart
                        </Button>
                      )
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Cart Sheet ─────────────────────────────────────────────── */}
      <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
        <SheetContent side="right" className="flex flex-col p-0 sm:max-w-sm w-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
              <span className="text-sm font-normal text-muted-foreground ml-1">
                ({cartQuantityTotal} {cartQuantityTotal === 1 ? "item" : "items"})
              </span>
            </SheetTitle>
          </SheetHeader>

          {currentOrder.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground px-6">
              <ShoppingCart className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">Your cart is empty</p>
              <p className="text-xs opacity-70">Add items from the menu to get started</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 px-6">
              <div className="py-4 space-y-3">
                {currentOrder.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-snug truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">₦{item.price.toLocaleString()} each</p>
                      <p className="text-xs font-semibold text-primary mt-1">
                        ₦{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mt-0.5 -mr-0.5 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(item.menuItemId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateCartQuantity(item.menuItemId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {currentOrder.length > 0 && (
            <SheetFooter className="flex-col gap-3 px-6 py-4 border-t shrink-0 sm:flex-col">
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-primary">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 w-full">
                <Button variant="outline" size="sm" className="w-24" onClick={clearCart}>
                  Clear
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => { setIsCartSheetOpen(false); setIsOrderDialogOpen(true); }}
                  disabled={loading}
                >
                  Place Order
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Place Order Dialog (controlled-only, no trigger) ──────── */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Place Order</DialogTitle>
            <DialogDescription>Review your items and confirm order details</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">

            {/* Items summary */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Order Summary
              </p>
              <div className="rounded-lg border bg-muted/30 divide-y">
                {currentOrder.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="font-medium truncate flex-1 pr-3">{item.name}</span>
                    <span className="text-muted-foreground shrink-0 mr-3">×{item.quantity}</span>
                    <span className="font-semibold shrink-0">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order type form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="orderType">Order Type</Label>
                <Select
                  value={orderData.orderType}
                  onValueChange={(value: any) => setOrderData({ ...orderData, orderType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table service">Table Service</SelectItem>
                    <SelectItem value="room service">Room Service</SelectItem>
                    <SelectItem value="pickup">Pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {orderData.orderType === "room service" && (
                <div>
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input
                    id="roomNumber"
                    value={orderData.roomNumber || ""}
                    onChange={(e) => setOrderData({ ...orderData, roomNumber: e.target.value })}
                    placeholder="e.g., 205"
                  />
                </div>
              )}

              {orderData.orderType === "table service" && (
                <div>
                  <Label htmlFor="tableNumber">Table Number</Label>
                  <Input
                    id="tableNumber"
                    value={orderData.tableNumber || ""}
                    onChange={(e) => setOrderData({ ...orderData, tableNumber: e.target.value })}
                    placeholder="e.g., 12"
                  />
                </div>
              )}

              {orderData.orderType === "pickup" && (
                <div>
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input
                    id="customerName"
                    value={orderData.customerName || ""}
                    onChange={(e) => setOrderData({ ...orderData, customerName: e.target.value })}
                    placeholder="Customer name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="instructions">Special Instructions</Label>
                <Textarea
                  id="instructions"
                  value={orderData.specialInstructions}
                  onChange={(e) => setOrderData({ ...orderData, specialInstructions: e.target.value })}
                  placeholder="Any special requests..."
                  rows={2}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-base font-semibold">Total</span>
              <span className="text-2xl font-bold text-primary">₦{total.toLocaleString()}</span>
            </div>

            <Button onClick={handlePlaceOrder} className="w-full" disabled={loading}>
              {loading ? "Processing..." : "Confirm Order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Item Sheet ────────────────────────────────────────── */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent side="right" className="flex flex-col p-0 sm:max-w-md w-full">
          {viewItem && (
            <>
              {/* Hero image */}
              <div className="relative aspect-video w-full shrink-0 bg-gradient-to-br from-muted/60 to-muted overflow-hidden">
                {viewItem.images && viewItem.images.length > 0 ? (
                  <img
                    src={imgUrl(viewItem.images[0])}
                    alt={viewItem.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed className="h-14 w-14 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute bottom-3 left-3">
                  {viewItem.isAvailable
                    ? <Badge className="bg-green-500 text-white shadow-md">Available</Badge>
                    : <Badge variant="destructive" className="shadow-md">Out of Stock</Badge>}
                </div>
              </div>

              {/* Thumbnail strip — only if multiple images */}
              {viewItem.images && viewItem.images.length > 1 && (
                <div className="flex gap-2 px-6 pt-3 shrink-0 overflow-x-auto pb-1">
                  {viewItem.images.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={imgUrl(img)}
                      alt={`${viewItem.name} ${i + 1}`}
                      className="h-14 w-14 rounded-md object-cover border-2 border-transparent hover:border-primary cursor-pointer shrink-0 bg-muted transition-colors"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ))}
                </div>
              )}

              {/* Scrollable detail content */}
              <ScrollArea className="flex-1 px-6">
                <div className="py-5 space-y-3">
                  <h2 className="text-xl font-bold leading-tight">{viewItem.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">
                      ₦{viewItem.price.toLocaleString()}
                    </span>
                    {viewItem.estimatedPrepTime && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        ~{viewItem.estimatedPrepTime} min
                      </span>
                    )}
                  </div>
                  {viewItem.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{viewItem.description}</p>
                  )}
                </div>
              </ScrollArea>

              {/* Footer — Add to Cart or in-cart controls */}
              {canPlaceOrder() && viewItem.isAvailable && (
                <div className="px-6 py-4 border-t shrink-0">
                  {cartMap.has(viewItem._id) ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateCartQuantity(viewItem._id, cartMap.get(viewItem._id)!.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold text-lg">
                          {cartMap.get(viewItem._id)!.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => updateCartQuantity(viewItem._id, cartMap.get(viewItem._id)!.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-bold text-primary text-lg">
                        ₦{(viewItem.price * cartMap.get(viewItem._id)!.quantity).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => handleAddToCart(viewItem)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Cart — ₦{viewItem.price.toLocaleString()}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirm Dialog ──────────────────────────────────── */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <p className="text-sm">
            Are you sure you want to delete <strong>{deleteItem?.name}</strong>?
          </p>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteMenuItem(deleteItem._id);
                toast.success("Menu item deleted");
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Menu Item Dialog ──────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editItem.description}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  value={editItem.price}
                  onChange={(e) => setEditItem({ ...editItem, price: e.target.value })}
                />
              </div>
              <Button
                className="w-full"
                onClick={async () => {
                  await updateMenuItem(editItem._id, editItem);
                  toast.success("Menu item updated");
                  setIsEditDialogOpen(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
