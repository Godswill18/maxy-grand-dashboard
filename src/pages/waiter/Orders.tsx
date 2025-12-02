import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Search, 
  RefreshCw, 
  AlertCircle,
  User,
  MapPin,
  ShoppingBag,
  Bell,
  Eye,
  Calendar,
  Phone,
  CreditCard
} from "lucide-react";
import { toast } from "sonner";
import { useMenuStore } from "@/store/menuStore";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { io, Socket } from "socket.io-client";

interface Order {
  _id: string;
  hotelId: string;
  guestId?: string;
  orderType: 'room service' | 'pickup' | 'table service';
  roomNumber?: string;
  tableNumber?: string;
  customerName?: string;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  specialInstructions?: string;
  waiterId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export default function Orders() {
  const { 
    orders, 
    loading, 
    error,
    fetchOrders, 
    updateOrderStatus,
    updateOrderPaymentStatus,
    canPlaceOrder,
  } = useMenuStore();
  
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  // Socket.IO connection
  useEffect(() => {
    if (user && canPlaceOrder()) {
      const newSocket = io(VITE_API_URL, {
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      // Listen for new orders
      newSocket.on('orderCreated', (newOrder: Order) => {
        // Only show notification if order belongs to user's hotel
        if (newOrder.hotelId === user.hotelId) {
          console.log('New order received:', newOrder);
          toast.success(`New order #${newOrder._id.slice(-6)} received!`, {
            icon: <Bell className="h-4 w-4" />,
          });
          fetchOrders();
        }
      });

      // Listen for order updates
      newSocket.on('orderUpdated', (updatedOrder: Order) => {
        // Only process if order belongs to user's hotel
        if (updatedOrder.hotelId === user.hotelId) {
          // console.log('Order updated:', updatedOrder);
          toast.info(`Order #${updatedOrder._id.slice(-6)} updated to ${updatedOrder.orderStatus}`);
          fetchOrders();
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, canPlaceOrder, fetchOrders]);

  // Fetch orders on mount
  useEffect(() => {
    if (user && canPlaceOrder()) {
      fetchOrders();
    }
  }, [user, canPlaceOrder, fetchOrders]);

  // Update selectedOrder when orders change (for real-time updates)
  useEffect(() => {
    if (selectedOrder && orders.length > 0) {
      const updatedOrder = orders.find((o: Order) => o._id === selectedOrder._id);
      if (updatedOrder) {
        // Only update if there's an actual change
        if (JSON.stringify(updatedOrder) !== JSON.stringify(selectedOrder)) {
          setSelectedOrder(updatedOrder);
        }
      }
    }
  }, [orders, selectedOrder]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      
      // Immediately update selectedOrder if viewing in modal
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: newStatus as Order['orderStatus']
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update order status");
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, isPaid: boolean) => {
    try {
      const newStatus = isPaid ? 'paid' : 'pending';
      await updateOrderPaymentStatus(orderId, newStatus);
      toast.success(`Payment marked as ${newStatus}`);
      
      // Immediately update the selectedOrder with the new payment status
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: newStatus as 'paid' | 'pending' | 'refunded'
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment status");
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchOrders();
      toast.success("Orders refreshed");
    } catch (error) {
      toast.error("Failed to refresh orders");
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "confirmed": return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "preparing": return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      case "ready": return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "delivered": return "bg-green-100 text-green-800 hover:bg-green-200";
      case "cancelled": return "bg-red-100 text-red-800 hover:bg-red-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "refunded": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case "room service": return <MapPin className="h-4 w-4" />;
      case "pickup": return <ShoppingBag className="h-4 w-4" />;
      case "table service": return <User className="h-4 w-4" />;
      default: return null;
    }
  };

  const getOrderTypeLabel = (order: Order) => {
    switch (order.orderType) {
      case "room service": return `Room ${order.roomNumber}`;
      case "pickup": return `Pickup: ${order.customerName}`;
      case "table service": return `Table ${order.tableNumber}`;
      default: return "Unknown";
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "ready",
      ready: "delivered",
    };
    return statusFlow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      pending: "Confirm",
      confirmed: "Start Preparing",
      preparing: "Mark Ready",
      ready: "Mark Delivered",
    };
    return labels[currentStatus] || "Update";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return formatTime(dateString);
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeSinceOrder = (dateString: string): string => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes === 1) return '1 min ago';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    return formatDate(dateString);
  };

  // Filter orders by hotelId and user role
  const hotelOrders = orders.filter((order: Order) => {
    // First check if order belongs to user's hotel
    if (order.hotelId !== user?.hotelId) {
      return false;
    }
    
    // HeadWaiters and Admins see all orders in their hotel
    if (['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')) {
      return true;
    }
    
    // Regular waiters only see their own orders
    if (user?.role === 'waiter') {
      // Check if waiterId matches (handle both object and string cases)
      const orderWaiterId = typeof order.waiterId === 'object' 
        ? order.waiterId?._id 
        : order.waiterId;
      return orderWaiterId === user._id;
    }
    
    // Guests see their own orders (if they have guestId)
    if (String(user?.role) === 'guest') {
      return order.guestId === user._id;
    }
    
    return false;
  });

  // Separate active and completed orders
  const activeOrders = hotelOrders.filter((order: Order) => 
    !['delivered', 'cancelled'].includes(order.orderStatus)
  );

  const completedOrders = hotelOrders.filter((order: Order) => 
    ['delivered', 'cancelled'].includes(order.orderStatus)
  );

  // Apply filters to the current tab's orders
  const currentOrders = activeTab === "active" ? activeOrders : completedOrders;
  
  const filteredOrders = currentOrders.filter((order: Order) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      order._id.toLowerCase().includes(searchLower) ||
      order.roomNumber?.toLowerCase().includes(searchLower) ||
      order.tableNumber?.toLowerCase().includes(searchLower) ||
      order.customerName?.toLowerCase().includes(searchLower) ||
      order.items.some(item => item.name.toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "all" || order.orderStatus === statusFilter;
    const matchesOrderType = orderTypeFilter === "all" || order.orderType === orderTypeFilter;

    return matchesSearch && matchesStatus && matchesOrderType;
  });

  // Sort orders by status priority and time
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const statusPriority: Record<string, number> = {
      pending: 1,
      confirmed: 2,
      preparing: 3,
      ready: 4,
      delivered: 5,
      cancelled: 6,
    };
    
    const priorityDiff = statusPriority[a.orderStatus] - statusPriority[b.orderStatus];
    if (priorityDiff !== 0) return priorityDiff;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (!canPlaceOrder()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to view orders
          </p>
        </div>
      </div>
    );
  }

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
          <h2 className="text-2xl font-bold">Orders Dashboard</h2>
          <p className="text-muted-foreground">
            {['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')
              ? 'Manage and track all orders in real-time'
              : 'Manage and track your orders in real-time'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID, table, room, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="table service">Table Service</SelectItem>
            <SelectItem value="room service">Room Service</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for Active vs History */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">
            Active Orders ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Order History ({completedOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {/* Orders Summary (only for active tab) */}
          {activeTab === "active" && (
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">
                        {activeOrders.filter((o: Order) => o.orderStatus === 'pending').length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                      <p className="text-2xl font-bold">
                        {activeOrders.filter((o: Order) => ['confirmed', 'preparing'].includes(o.orderStatus)).length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Ready</p>
                      <p className="text-2xl font-bold">
                        {activeOrders.filter((o: Order) => o.orderStatus === 'ready').length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Unpaid</p>
                      <p className="text-2xl font-bold">
                        {activeOrders.filter((o: Order) => o.paymentStatus === 'pending').length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Orders Grid */}
          {loading && orders.length === 0 ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading orders...</p>
            </div>
          ) : sortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || orderTypeFilter !== "all"
                  ? "Try adjusting your filters"
                  : activeTab === "active" 
                    ? "No active orders at the moment" 
                    : "No completed orders yet"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-10">
              {sortedOrders.map((order: Order) => (
                <Card 
                  key={order._id} 
                  className={`hover:shadow-lg transition-shadow ${
                    order.orderStatus === 'pending' ? 'border-l-4 border-l-yellow-500' :
                    order.orderStatus === 'ready' ? 'border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-lg">
                        #{order._id.slice(-6)}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(order.orderStatus)}>
                          {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getOrderTypeIcon(order.orderType)}
                        <span className="font-medium">{getOrderTypeLabel(order)}</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        {getTimeSinceOrder(order.createdAt)}
                      </p>

                      {typeof order.waiterId === 'object' && order.waiterId?.firstName && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{order.waiterId.firstName} {order.waiterId.lastName}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Items ({order.items.length}):</p>
                      <ul className="text-sm text-muted-foreground space-y-1 max-h-24 overflow-y-auto">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="flex justify-between">
                            <span>• {item.name}</span>
                            <span className="font-medium">x{item.quantity}</span>
                          </li>
                        ))}
                        {order.items.length > 3 && (
                          <li className="text-xs text-primary">+{order.items.length - 3} more items</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="font-semibold">Total:</span>
                      <span className="text-lg font-bold text-primary">
                        ₦{order.totalAmount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Payment:</span>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      
                      {getNextStatus(order.orderStatus) && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUpdateOrderStatus(
                            order._id, 
                            getNextStatus(order.orderStatus)!
                          )}
                          disabled={loading}
                        >
                          {getNextStatusLabel(order.orderStatus)}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?._id.slice(-6)}</DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Status and Payment */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <Badge className={getStatusColor(selectedOrder.orderStatus)}>
                    {selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <div className="flex items-center gap-3">
                    <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1)}
                    </Badge>
                    {selectedOrder.orderStatus !== 'cancelled' && (
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={selectedOrder.paymentStatus === 'paid'}
                          onCheckedChange={(checked) => 
                            handleUpdatePaymentStatus(selectedOrder._id, checked)
                          }
                          disabled={loading}
                        />
                        <Label className="text-sm">Mark as Paid</Label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Order Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {getOrderTypeIcon(selectedOrder.orderType)}
                    <span className="text-sm font-medium">Order Type</span>
                  </div>
                  <p className="text-lg font-semibold">{getOrderTypeLabel(selectedOrder)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Order Time</span>
                  </div>
                  <p className="text-sm">{formatFullDate(selectedOrder.createdAt)}</p>
                </div>

                {typeof selectedOrder.waiterId === 'object' && selectedOrder.waiterId?.firstName && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">Waiter</span>
                    </div>
                    <p className="text-lg font-semibold">{selectedOrder.waiterId.firstName} {selectedOrder.waiterId.lastName}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Amount</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ₦{selectedOrder.totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Items List */}
              <div className="space-y-3">
                <h4 className="font-semibold">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₦{item.price.toLocaleString()} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">x{item.quantity}</p>
                        <p className="text-sm text-muted-foreground">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-semibold">Special Instructions</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                      {selectedOrder.specialInstructions}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-3">
                {getNextStatus(selectedOrder.orderStatus) && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleUpdateOrderStatus(
                        selectedOrder._id, 
                        getNextStatus(selectedOrder.orderStatus)!
                      );
                    }}
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {getNextStatusLabel(selectedOrder.orderStatus)}
                  </Button>
                )}
                
                {selectedOrder.orderStatus !== 'cancelled' && 
                 selectedOrder.orderStatus !== 'delivered' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleUpdateOrderStatus(selectedOrder._id, 'cancelled');
                    }}
                    disabled={loading}
                  >
                    Cancel Order
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={() => setIsDetailModalOpen(false)}
                >
                  Close
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground pt-4 border-t">
                <p>Order ID: {selectedOrder._id}</p>
                <p>Last Updated: {formatFullDate(selectedOrder.updatedAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}