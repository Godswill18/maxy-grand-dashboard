import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  CreditCard,
  ShoppingBag,
  AlertCircle,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardStore } from "@/store/waiterDashboardStore";
import { useMenuStore } from "@/store/menuStore";
import { OrderDetailSkeleton } from "@/components/skeleton/waiterDashboardSkeleton";

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { updateOrderStatus, updateOrderPaymentStatus } = useMenuStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch from API
        const token = sessionStorage.getItem('authToken');
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'

        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch order');
        }
        
        const data = await response.json();
        setOrder(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    
    try {
      await updateOrderStatus(order._id, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      
      // Update local state
      setOrder({
        ...order,
        orderStatus: newStatus
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
    }
  };

  const handleUpdatePayment = async (isPaid: boolean) => {
    if (!order) return;
    
    try {
      const newStatus = isPaid ? 'paid' : 'pending';
      await updateOrderPaymentStatus(order._id, newStatus);
      toast.success(`Payment marked as ${newStatus}`);
      
      // Update local state
      setOrder({
        ...order,
        paymentStatus: newStatus
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "preparing": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
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

  const getOrderTypeLabel = (order: any) => {
    if (!order) return "Unknown";
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
      pending: "Confirm Order",
      confirmed: "Start Preparing",
      preparing: "Mark as Ready",
      ready: "Mark as Delivered",
    };
    return labels[currentStatus] || "Update Status";
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

  if (loading) {
    return <OrderDetailSkeleton />;
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center h-96 p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
          <p className="text-muted-foreground mb-4">
            {error || "The order you're looking for doesn't exist"}
          </p>
          <Button onClick={() => navigate('/waiter')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">
            Order #{order._id.slice(-6).toUpperCase()}
          </h2>
          <p className="text-muted-foreground">
            {formatFullDate(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={getStatusColor(order.orderStatus)}>
            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
          </Badge>
          <Badge className={getPaymentStatusColor(order.paymentStatus)}>
            {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                {getOrderTypeIcon(order.orderType)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Type</p>
                <p className="font-semibold">{getOrderTypeLabel(order)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CreditCard className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="font-semibold text-lg">
                  ₦{order.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Clock className="h-4 w-4 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Status</p>
                <p className="font-semibold capitalize">{order.orderStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Information */}
      <Card>
        <CardHeader>
          <CardTitle>Order Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Order Time</span>
              </div>
              <p className="text-sm">{formatFullDate(order.createdAt)}</p>
            </div>

            {typeof order.waiterId === 'object' && order.waiterId?.firstName && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">Waiter</span>
                </div>
                <p className="text-sm font-semibold">
                  {order.waiterId.firstName} {order.waiterId.lastName}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                {getOrderTypeIcon(order.orderType)}
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-sm font-semibold">{getOrderTypeLabel(order)}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Payment Status</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </Badge>
                {order.orderStatus !== 'cancelled' && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={order.paymentStatus === 'paid'}
                      onCheckedChange={(checked) => handleUpdatePayment(checked)}
                      disabled={loading}
                    />
                    <Label className="text-xs">Paid</Label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="h-4 w-4" />
                <span className="text-sm font-medium">Items Count</span>
              </div>
              <p className="text-sm font-semibold">
                {order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} items
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm font-medium">Last Updated</span>
              </div>
              <p className="text-sm">{formatFullDate(order.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map((item: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border rounded-lg"
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

          <Separator className="my-4" />

          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">
              ₦{order.totalAmount.toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Special Instructions */}
      {order.specialInstructions && (
        <Card>
          <CardHeader>
            <CardTitle>Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm p-4 bg-muted rounded-lg">
              {order.specialInstructions}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {getNextStatus(order.orderStatus) && (
          <Button
            className="flex-1"
            onClick={() => handleUpdateStatus(getNextStatus(order.orderStatus)!)}
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {getNextStatusLabel(order.orderStatus)}
          </Button>
        )}

        {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
          <Button
            variant="destructive"
            onClick={() => handleUpdateStatus('cancelled')}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Order
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => navigate(-1)}
        >
          Close
        </Button>
      </div>

      {/* Order Metadata */}
      <Card>
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Order ID: {order._id}</p>
            <p>Hotel ID: {order.hotelId}</p>
            {order.guestId && <p>Guest ID: {order.guestId}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}