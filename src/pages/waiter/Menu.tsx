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
import { Plus, ShoppingCart, Edit, Trash2, AlertCircle, History } from "lucide-react";
import { toast } from "sonner";
import { useMenuStore } from "@/store/menuStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Switch } from "@/components/ui/switch";

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

  // Get user from authStore
  const { user } = useAuthStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("restaurant");
  const [newMenuItem, setNewMenuItem] = useState({
    name: "",
    description: "",
    price: "",
    category: "restaurant" as "bar" | "restaurant" | "room service",
    estimatedPrepTime: "",
    tags: "",
  });
  const [menuImages, setMenuImages] = useState<FileList | null>(null);
  const [orderData, setOrderData] = useState<OrderData>({
    orderType: "table service",
    specialInstructions: "",
  });
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTrackedOrdersOpen, setIsTrackedOrdersOpen] = useState(false);

  useEffect(() => {
    // Initialize cart from localStorage on mount
    initializeCart();
    fetchMenuItems();
  }, [fetchMenuItems, initializeCart]);

  useEffect(() => {
    // Load tracked orders when user is available
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
    
    if (newMenuItem.tags) {
      const tagsArray = newMenuItem.tags.split(",").map(tag => tag.trim());
      formData.append("tags", JSON.stringify(tagsArray));
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
      setNewMenuItem({
        name: "",
        description: "",
        price: "",
        category: "restaurant",
        estimatedPrepTime: "",
        tags: "",
      });
      setMenuImages(null);
      await fetchMenuItems();
    } catch (error: any) {
      console.error("Create menu item error:", error);
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

    // Validate order type specific fields
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
      // createOrder currently does not return a value, so await it and show a generic success message
      await createOrder(orderData);
      toast.success("Order placed successfully");
      setIsOrderDialogOpen(false);
      setOrderData({
        orderType: "table service",
        specialInstructions: "",
      });
    } catch (error: any) {
      console.error("Create order error:", error);
      toast.error(error.message || "Failed to place order");
    }
  };

  const total = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredMenuItems = menuItems.filter(
    (item) => item.category === selectedCategory
  );

  const VITE_BACKEND_IMAGE_URL = (import.meta as any).env?.VITE_BACKEND_IMAGE_URL ?? 'http://localhost:5000';

  return (
    <div className="space-y-6 p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Restaurant Menu</h2>
          <p className="text-muted-foreground">
            {canPlaceOrder() ? "Select items to create a new order" : "Browse our menu"}
          </p>
          {user && (
            <p className="text-sm text-muted-foreground mt-1">
              Logged in as: <span className="font-semibold">{user.firstName} {user.lastName}</span>
              <span className="ml-2">• {user.role}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {canPlaceOrder() && trackedOrderIds.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsTrackedOrdersOpen(true)}
            >
              <History className="h-4 w-4 mr-2" />
              My Orders ({trackedOrderIds.length})
            </Button>
          )}

          {canCreateMenu() && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Menu Item</DialogTitle>
                  <DialogDescription>
                    Add a new item to the menu
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newMenuItem.name}
                      onChange={(e) =>
                        setNewMenuItem({ ...newMenuItem, name: e.target.value })
                      }
                      placeholder="e.g., Grilled Chicken"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newMenuItem.description}
                      onChange={(e) =>
                        setNewMenuItem({ ...newMenuItem, description: e.target.value })
                      }
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
                        onChange={(e) =>
                          setNewMenuItem({ ...newMenuItem, price: e.target.value })
                        }
                        placeholder="e.g., 4500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newMenuItem.category}
                        onValueChange={(value: any) =>
                          setNewMenuItem({ ...newMenuItem, category: value })
                        }
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
                      onChange={(e) =>
                        setNewMenuItem({
                          ...newMenuItem,
                          estimatedPrepTime: e.target.value,
                        })
                      }
                      placeholder="e.g., 15"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newMenuItem.tags}
                      onChange={(e) =>
                        setNewMenuItem({ ...newMenuItem, tags: e.target.value })
                      }
                      placeholder="e.g., vegetarian, spicy, popular"
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

          {canPlaceOrder() && currentOrder.length > 0 && (
            <>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                <ShoppingCart className="h-4 w-4 mr-2" />
                {currentOrder.length} items
              </Badge>
              <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Place Order</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Complete Order</DialogTitle>
                    <DialogDescription>
                      Enter order details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="orderType">Order Type</Label>
                      <Select
                        value={orderData.orderType}
                        onValueChange={(value: any) =>
                          setOrderData({ ...orderData, orderType: value })
                        }
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
                          onChange={(e) =>
                            setOrderData({ ...orderData, roomNumber: e.target.value })
                          }
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
                          onChange={(e) =>
                            setOrderData({ ...orderData, tableNumber: e.target.value })
                          }
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
                          onChange={(e) =>
                            setOrderData({ ...orderData, customerName: e.target.value })
                          }
                          placeholder="Customer name"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="instructions">Special Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={orderData.specialInstructions}
                        onChange={(e) =>
                          setOrderData({
                            ...orderData,
                            specialInstructions: e.target.value,
                          })
                        }
                        placeholder="Any special requests..."
                      />
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-primary">₦{total.toLocaleString()}</span>
                      </div>
                    </div>

                    <Button onClick={handlePlaceOrder} className="w-full" disabled={loading}>
                      {loading ? "Processing..." : "Confirm Order"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" onClick={clearCart}>
                Clear Cart
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
          <TabsTrigger value="bar">Bar</TabsTrigger>
          <TabsTrigger value="room service">Room Service</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory}>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading menu items...</p>
            </div>
          ) : filteredMenuItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No items available in this category
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredMenuItems.map((item) => (
                <Card key={item._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    {canCreateMenu() && (
                      <div className="flex items-center gap-2 mb-3"> 
                        <span className="text-sm">Availability:</span>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={async (value) => {
                            await updateMenuItem(item._id, { isAvailable: value });
                            toast.success(value ? "Meal is now available" : "Meal set to out of stock");
                          }}
                        />
                      </div>
                    )}
                    <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img
                          src={`${VITE_BACKEND_IMAGE_URL}/${item.images[0]}`}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🍽️</span>
                      )}
                    </div>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      {canCreateMenu() && (
                        <div className="flex items-center gap-2">  
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditItem(item);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setDeleteItem(item);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {item.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        ₦{item.price.toLocaleString()}
                      </span>
                      {!item.isAvailable && (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </div>
                    {item.estimatedPrepTime && (
                      <p className="text-sm text-muted-foreground">
                        Prep time: ~{item.estimatedPrepTime} mins
                      </p>
                    )}
                    {item.tags && Array.isArray(item.tags) && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {item.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setViewItem(item);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      View Details
                    </Button>

                    {canPlaceOrder() && item.isAvailable && (
                      <Button
                        className="w-full"
                        onClick={() => handleAddToCart(item)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {canPlaceOrder() && currentOrder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Cart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentOrder.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateCartQuantity(item.menuItemId, item.quantity - 1)
                        }
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateCartQuantity(item.menuItemId, item.quantity + 1)
                        }
                      >
                        +
                      </Button>
                    </div>
                    <span className="font-semibold w-24 text-right">
                      ₦{(item.price * item.quantity).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFromCart(item.menuItemId)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4 border-t text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">₦{total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Item Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.name}</DialogTitle>
            <DialogDescription>Full item details</DialogDescription>
          </DialogHeader>

          {viewItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {viewItem.images?.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={`${VITE_BACKEND_IMAGE_URL}/${img}`}
                    alt={viewItem.name}
                    className="rounded-lg w-full h-auto object-cover"
                  />
                ))}
              </div>

              <p className="text-muted-foreground">{viewItem.description}</p>

              <p className="font-semibold">₦{viewItem.price.toLocaleString()}</p>

              <div>
                <h4 className="font-semibold mb-1">Tags:</h4>
                <div className="flex gap-2 flex-wrap">
                  {viewItem.tags?.map((tag: string, i: number) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>

              <p className="text-sm">
                <span className="font-semibold">Estimated Prep Time:</span>{" "}
                {viewItem.estimatedPrepTime} mins
              </p>

              <p>
                <span className="font-semibold">Availability:</span>{" "}
                {viewItem.isAvailable ? (
                  <Badge className="bg-green-500">Available</Badge>
                ) : (
                  <Badge className="bg-red-500">Out of Stock</Badge>
                )}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Menu Item Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <p>Are you sure you want to delete <strong>{deleteItem?.name}</strong>?</p>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
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

      {/* Edit Menu Item Dialog */}
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
                  onChange={(e) =>
                    setEditItem({ ...editItem, description: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Price</Label>
                <Input
                  type="number"
                  value={editItem.price}
                  onChange={(e) =>
                    setEditItem({ ...editItem, price: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={editItem.tags.join(", ")}
                  onChange={(e) =>
                    setEditItem({
                      ...editItem,
                      tags: e.target.value.split(",").map((t) => t.trim()),
                    })
                  }
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