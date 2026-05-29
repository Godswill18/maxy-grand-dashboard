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
  Calendar,
  CreditCard,
  Printer,
  ClipboardList,
  XCircle,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { socket } from "@/lib/socket";
import { printReceipt } from "@/utils/printReceipt";

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


const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100   text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready:     'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100  text-green-800',
  cancelled: 'bg-red-100    text-red-800',
};

const STATUS_BORDER: Record<string, string> = {
  pending:   'border-l-4 border-l-yellow-400',
  confirmed: 'border-l-4 border-l-blue-400',
  preparing: 'border-l-4 border-l-orange-400',
  ready:     'border-l-4 border-l-purple-500',
  delivered: 'border-l-4 border-l-green-500',
  cancelled: 'border-l-4 border-l-red-400',
};

const PAYMENT_COLOR: Record<string, string> = {
  paid:     'bg-green-100 text-green-800',
  pending:  'bg-yellow-100 text-yellow-800',
  refunded: 'bg-blue-100  text-blue-800',
};

const STATUS_BG: Record<string, string> = {
  pending:   'bg-yellow-400',
  confirmed: 'bg-blue-400',
  preparing: 'bg-orange-400',
  ready:     'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-400',
};

const STAT_CARD_BORDER: Record<string, string> = {
  pending:    'border-b-2 border-b-yellow-400',
  inProgress: 'border-b-2 border-b-orange-400',
  ready:      'border-b-2 border-b-purple-500',
  unpaid:     'border-b-2 border-b-red-400',
};

function StatCard({
  label, value, icon: Icon, iconBg, iconColor, accentClass,
}: {
  label: string; value: number; icon: React.ElementType;
  iconBg: string; iconColor: string; accentClass?: string;
}) {
  return (
    <Card className={accentClass}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function playOrderSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

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
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("all");
  const [isConnected, setIsConnected] = useState(false);
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Socket.IO real-time order updates
  useEffect(() => {
    if (!user) return;

    const handleConnect = () => {
      setIsConnected(true);
      if (user?._id) socket.emit('authenticate', user._id);
      socket.emit('join_hotel', user.hotelId);
      socket.emit('join_role', user.role);
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleOrderCreated = (newOrder: Order) => {
      fetchOrders();
      playOrderSound();
      setNewOrderIds((prev) => new Set([...prev, newOrder._id]));
      setTimeout(() => {
        setNewOrderIds((prev) => {
          const next = new Set(prev);
          next.delete(newOrder._id);
          return next;
        });
      }, 1500);
      toast.success(`New order #${newOrder._id.slice(-6)} received!`, {
        icon: <Bell className="h-4 w-4" />,
      });
    };

    const handleOrderUpdated = (updatedOrder: Order) => {
      fetchOrders();
      toast.info(`Order #${updatedOrder._id.slice(-6)} status: ${updatedOrder.orderStatus}`);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('orderCreated', handleOrderCreated);
    socket.on('orderUpdated', handleOrderUpdated);

    if (socket.connected) {
      setIsConnected(true);
      if (user?._id) socket.emit('authenticate', user._id);
      socket.emit('join_hotel', user.hotelId);
      socket.emit('join_role', user.role);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('orderCreated', handleOrderCreated);
      socket.off('orderUpdated', handleOrderUpdated);
    };
  }, [user, fetchOrders]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Keep selectedOrder in sync with live order updates
  useEffect(() => {
    if (selectedOrder && orders.length > 0) {
      const updated = orders.find((o: Order) => o._id === selectedOrder._id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, order?: Order) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus as Order['orderStatus'] });
      }
      if (newStatus === 'confirmed' && user?.role === 'headWaiter' && order) {
        printReceipt(order, `${user.firstName} ${user.lastName}`);
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
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus as 'paid' | 'pending' | 'refunded' });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment status");
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchOrders();
      toast.success("Orders refreshed");
    } catch {
      toast.error("Failed to refresh orders");
    }
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case "room service": return <MapPin className="h-4 w-4" />;
      case "pickup":       return <ShoppingBag className="h-4 w-4" />;
      case "table service":return <User className="h-4 w-4" />;
      default:             return null;
    }
  };

  const getOrderTypeLabel = (order: Order) => {
    switch (order.orderType) {
      case "room service":  return `Room ${order.roomNumber}`;
      case "pickup":        return `Pickup: ${order.customerName}`;
      case "table service": return `Table ${order.tableNumber}`;
      default:              return "Unknown";
    }
  };

  const getNextStatus = (current: string): string | null =>
    ({ pending: 'confirmed', confirmed: 'preparing', preparing: 'ready', ready: 'delivered' }[current] ?? null);

  const getNextStatusLabel = (current: string): string =>
    ({ pending: 'Confirm', confirmed: 'Start Preparing', preparing: 'Mark Ready', ready: 'Mark Delivered' }[current] ?? 'Update');

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toDateString() === new Date().toDateString()
      ? formatTime(d)
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatFullDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long',
      day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
    });

  const getTimeSince = (d: string): string => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`;
    return formatDate(d);
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  const hotelOrders = orders.filter((order: Order) => {
    if (['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')) return true;
    if (user?.role === 'waiter') {
      const wid = typeof order.waiterId === 'object' ? (order.waiterId as any)?._id : order.waiterId;
      return wid === user?._id;
    }
    if (String(user?.role) === 'guest') return order.guestId === user?._id;
    return false;
  });

  const activeOrders    = hotelOrders.filter((o: Order) => !['delivered', 'cancelled'].includes(o.orderStatus));
  const completedOrders = hotelOrders.filter((o: Order) =>  ['delivered', 'cancelled'].includes(o.orderStatus));

  const statusCounts: Record<string, number> = {
    all:       hotelOrders.length,
    pending:   hotelOrders.filter(o => o.orderStatus === 'pending').length,
    confirmed: hotelOrders.filter(o => o.orderStatus === 'confirmed').length,
    preparing: hotelOrders.filter(o => o.orderStatus === 'preparing').length,
    ready:     hotelOrders.filter(o => o.orderStatus === 'ready').length,
    delivered: hotelOrders.filter(o => o.orderStatus === 'delivered').length,
    cancelled: hotelOrders.filter(o => o.orderStatus === 'cancelled').length,
  };

  const filteredOrders = hotelOrders.filter((o: Order) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      o._id.toLowerCase().includes(q) ||
      o.roomNumber?.toLowerCase().includes(q) ||
      o.tableNumber?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.items.some(i => i.name.toLowerCase().includes(q));
    return matchSearch
      && (activeTab === 'all' || o.orderStatus === activeTab)
      && (orderTypeFilter === 'all' || o.orderType === orderTypeFilter);
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const pri: Record<string, number> = { pending: 1, confirmed: 2, preparing: 3, ready: 4, delivered: 5, cancelled: 6 };
    const diff = (pri[a.orderStatus] ?? 9) - (pri[b.orderStatus] ?? 9);
    return diff !== 0 ? diff : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // ── Access guard ───────────────────────────────────────────────────────────

  if (!canPlaceOrder()) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground">You don't have permission to view orders.</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-4 sm:p-6 animate-in fade-in duration-500">

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
          <h2 className="text-2xl font-bold tracking-tight">Orders Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {['headWaiter', 'admin', 'superAdmin'].includes(user?.role || '')
              ? 'Manage and track all hotel orders in real-time'
              : 'Manage and track your orders in real-time'}
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
            <span>{isConnected ? 'Live' : 'Offline'}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg bg-muted/40 border">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search order, table, room, customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px] bg-background">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="table service">Table Service</SelectItem>
            <SelectItem value="room service">Room Service</SelectItem>
            <SelectItem value="pickup">Pickup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-5">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="all">
            All <span className="ml-1.5 text-xs opacity-70">({statusCounts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending <span className="ml-1.5 text-xs opacity-70">({statusCounts.pending})</span>
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmed <span className="ml-1.5 text-xs opacity-70">({statusCounts.confirmed})</span>
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Preparing <span className="ml-1.5 text-xs opacity-70">({statusCounts.preparing})</span>
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready <span className="ml-1.5 text-xs opacity-70">({statusCounts.ready})</span>
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered <span className="ml-1.5 text-xs opacity-70">({statusCounts.delivered})</span>
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled <span className="ml-1.5 text-xs opacity-70">({statusCounts.cancelled})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-5">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Pending"
                value={activeOrders.filter((o: Order) => o.orderStatus === 'pending').length}
                icon={Clock}
                iconBg="bg-yellow-100"
                iconColor="text-yellow-600"
                accentClass={STAT_CARD_BORDER.pending}
              />
              <StatCard
                label="In Progress"
                value={activeOrders.filter((o: Order) => ['confirmed', 'preparing'].includes(o.orderStatus)).length}
                icon={RefreshCw}
                iconBg="bg-orange-100"
                iconColor="text-orange-600"
                accentClass={STAT_CARD_BORDER.inProgress}
              />
              <StatCard
                label="Ready"
                value={activeOrders.filter((o: Order) => o.orderStatus === 'ready').length}
                icon={CheckCircle}
                iconBg="bg-purple-100"
                iconColor="text-purple-600"
                accentClass={STAT_CARD_BORDER.ready}
              />
              <StatCard
                label="Unpaid"
                value={activeOrders.filter((o: Order) => o.paymentStatus === 'pending').length}
                icon={DollarSign}
                iconBg="bg-red-100"
                iconColor="text-red-600"
                accentClass={STAT_CARD_BORDER.unpaid}
              />
            </div>

          {/* ── Loading skeleton ─────────────────────────────────────── */}
          {loading && orders.length === 0 ? (
            <>
              {/* Desktop skeleton table */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-1.5 p-0" />
                      <TableHead>Order</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i} className="hover:bg-transparent">
                        <TableCell className="p-0 w-1.5"><div className="w-1.5 min-h-[56px] bg-muted" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16 mt-1.5" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile skeleton cards */}
              <div className="grid gap-4 sm:grid-cols-2 md:hidden">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                    <div className="flex gap-1.5"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-24 rounded-full" /></div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </>

          ) : sortedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <ClipboardList className="h-14 w-14 opacity-25" />
              <p className="font-semibold text-foreground">No orders found</p>
              <p className="text-sm">
                {searchQuery || activeTab !== 'all' || orderTypeFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No orders at the moment'}
              </p>
            </div>

          ) : (
            <>
              {/* ── Desktop Table ─────────────────────────────────────── */}
              <div className="hidden md:block rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-1.5 p-0" />
                      <TableHead className="font-semibold">Order</TableHead>
                      <TableHead className="font-semibold">Items</TableHead>
                      <TableHead className="font-semibold w-28">Total</TableHead>
                      <TableHead className="font-semibold w-32">Status</TableHead>
                      <TableHead className="font-semibold w-28">Payment</TableHead>
                      <TableHead className="font-semibold w-28">Time</TableHead>
                      <TableHead className="font-semibold w-36 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrders.map((order: Order) => (
                      <TableRow
                        key={order._id}
                        className={`cursor-pointer hover:bg-muted/40 transition-colors ${
                          newOrderIds.has(order._id) ? 'animate-in slide-in-from-top-4 duration-300' : ''
                        } ${
                          user?.role === 'headWaiter' && order.orderStatus === 'pending'
                            ? 'border-l-2 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                            : ''
                        }`}
                        onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                      >
                        {/* Status color strip */}
                        <TableCell className="p-0 w-1.5">
                          <div className={`w-1.5 min-h-[56px] ${STATUS_BG[order.orderStatus] ?? 'bg-gray-300'}`} />
                        </TableCell>

                        {/* Order # + location */}
                        <TableCell>
                          <p className="font-semibold text-sm">#{order._id.slice(-6)}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            {getOrderTypeIcon(order.orderType)}
                            <span>{getOrderTypeLabel(order)}</span>
                          </div>
                          {typeof order.waiterId === 'object' && order.waiterId?.firstName && (
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{order.waiterId.firstName} {order.waiterId.lastName}</span>
                            </div>
                          )}
                        </TableCell>

                        {/* Items */}
                        <TableCell>
                          <p className="text-sm truncate max-w-[180px]">
                            {order.items[0]?.quantity}× {order.items[0]?.name}
                          </p>
                          {order.items.length > 1 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              +{order.items.length - 1} more item{order.items.length > 2 ? 's' : ''}
                            </p>
                          )}
                        </TableCell>

                        {/* Total */}
                        <TableCell className="font-bold text-primary">
                          ₦{order.totalAmount.toLocaleString()}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Badge className={`${STATUS_COLOR[order.orderStatus] ?? ''} text-xs`}>
                            {capitalize(order.orderStatus)}
                          </Badge>
                        </TableCell>

                        {/* Payment */}
                        <TableCell>
                          <Badge variant="outline" className={`${PAYMENT_COLOR[order.paymentStatus] ?? ''} text-xs`}>
                            {capitalize(order.paymentStatus)}
                          </Badge>
                        </TableCell>

                        {/* Time */}
                        <TableCell className="text-xs text-muted-foreground">
                          {getTimeSince(order.createdAt)}
                        </TableCell>

                        {/* Action */}
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {getNextStatus(order.orderStatus) ? (
                            <Button
                              size="sm"
                              disabled={loading}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateOrderStatus(order._id, getNextStatus(order.orderStatus)!, order);
                              }}
                            >
                              {getNextStatusLabel(order.orderStatus)}
                            </Button>
                          ) : (
                            <span className={`text-xs font-medium flex items-center justify-end gap-1 ${order.orderStatus === 'delivered' ? 'text-green-600' : 'text-red-500'}`}>
                              {order.orderStatus === 'delivered'
                                ? <><CheckCircle className="h-3.5 w-3.5" /> Delivered</>
                                : <><XCircle className="h-3.5 w-3.5" /> Cancelled</>}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile Cards ──────────────────────────────────────── */}
              <div className="grid gap-4 sm:grid-cols-2 md:hidden">
                {sortedOrders.map((order: Order) => (
                  <Card
                    key={order._id}
                    className={`cursor-pointer group hover:shadow-md transition-all duration-200 overflow-hidden ${STATUS_BORDER[order.orderStatus] ?? ''} ${newOrderIds.has(order._id) ? 'animate-in slide-in-from-top-4 duration-300' : ''}`}
                    onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold">
                            #{order._id.slice(-6)}
                          </CardTitle>
                          <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                            {getOrderTypeIcon(order.orderType)}
                            <span className="truncate">{getOrderTypeLabel(order)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge className={`${STATUS_COLOR[order.orderStatus] ?? ''} text-xs`}>
                            {capitalize(order.orderStatus)}
                          </Badge>
                          <Badge variant="outline" className={`${PAYMENT_COLOR[order.paymentStatus] ?? ''} text-xs`}>
                            {capitalize(order.paymentStatus)}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{getTimeSince(order.createdAt)}</p>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 px-4 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <span key={idx} className="text-xs bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground">
                            {item.quantity}× {item.name}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-xs text-primary font-medium">+{order.items.length - 3} more</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                        <span className="text-lg font-bold text-primary">₦{order.totalAmount.toLocaleString()}</span>
                        {getNextStatus(order.orderStatus) ? (
                          <Button size="sm" disabled={loading} onClick={(e) => { e.stopPropagation(); handleUpdateOrderStatus(order._id, getNextStatus(order.orderStatus)!, order); }}>
                            {getNextStatusLabel(order.orderStatus)}
                          </Button>
                        ) : order.orderStatus === 'delivered' ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Delivered</span>
                        ) : (
                          <span className="text-xs text-red-500 font-medium flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Cancelled</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Order Detail Sheet ─────────────────────────────────────────────── */}
      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col gap-0 p-0">
          {selectedOrder && (
            <>
              {/* Sheet header with colored status strip */}
              <div className={`px-6 pt-6 pb-4 border-b ${STATUS_BORDER[selectedOrder.orderStatus] ?? ''}`}>
                <SheetHeader className="text-left">
                  <SheetTitle className="text-xl">Order #{selectedOrder._id.slice(-6)}</SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
                    <Badge className={`${STATUS_COLOR[selectedOrder.orderStatus] ?? ''}`}>
                      {capitalize(selectedOrder.orderStatus)}
                    </Badge>
                    <Badge variant="outline" className={`${PAYMENT_COLOR[selectedOrder.paymentStatus] ?? ''}`}>
                      {capitalize(selectedOrder.paymentStatus)}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-1">{getTimeSince(selectedOrder.createdAt)}</span>
                  </SheetDescription>
                </SheetHeader>
              </div>

              <div className="px-6 py-5 space-y-5 flex-1">

                {/* Order metadata grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                    <div className="flex items-center gap-2 font-medium">
                      {getOrderTypeIcon(selectedOrder.orderType)}
                      <span>{getOrderTypeLabel(selectedOrder)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Order Time</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>{formatFullDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>

                  {typeof selectedOrder.waiterId === 'object' && selectedOrder.waiterId?.firstName && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Waiter</p>
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.waiterId.firstName} {selectedOrder.waiterId.lastName}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xl font-bold text-primary">
                        ₦{selectedOrder.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Payment toggle */}
                {selectedOrder.orderStatus !== 'cancelled' && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                    <div>
                      <p className="text-sm font-medium">Payment Status</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedOrder.paymentStatus === 'paid' ? 'This order has been paid' : 'Payment is still pending'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedOrder.paymentStatus === 'paid'}
                        onCheckedChange={(checked) => handleUpdatePaymentStatus(selectedOrder._id, checked)}
                        disabled={loading}
                      />
                      <Label className="text-sm">Paid</Label>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Items */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Order Items ({selectedOrder.items.length})</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted/30 border rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₦{item.price.toLocaleString()} each</p>
                        </div>
                        <div className="text-right ml-3 shrink-0">
                          <p className="font-semibold text-sm">×{item.quantity}</p>
                          <p className="text-xs text-muted-foreground">
                            ₦{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special instructions */}
                {selectedOrder.specialInstructions && (
                  <>
                    <Separator />
                    <div className="space-y-1.5">
                      <h4 className="font-semibold text-sm">Special Instructions</h4>
                      <p className="text-sm text-muted-foreground p-3 bg-muted/40 rounded-lg leading-relaxed">
                        {selectedOrder.specialInstructions}
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                  {getNextStatus(selectedOrder.orderStatus) && (
                    <Button
                      className="flex-1 sm:flex-none"
                      onClick={() => handleUpdateOrderStatus(selectedOrder._id, getNextStatus(selectedOrder.orderStatus)!, selectedOrder)}
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {getNextStatusLabel(selectedOrder.orderStatus)}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    onClick={() => {
                      const waiterName = typeof selectedOrder.waiterId === 'object' && selectedOrder.waiterId?.firstName
                        ? `${selectedOrder.waiterId.firstName} ${selectedOrder.waiterId.lastName}`
                        : undefined;
                      printReceipt(selectedOrder, waiterName);
                    }}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print Receipt
                  </Button>

                  {selectedOrder.orderStatus !== 'cancelled' && selectedOrder.orderStatus !== 'delivered' && (
                    <Button
                      variant="destructive"
                      className="flex-1 sm:flex-none"
                      onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'cancelled')}
                      disabled={loading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Order
                    </Button>
                  )}
                </div>

                {/* Metadata */}
                <p className="text-xs text-muted-foreground pt-1 border-t">
                  Order ID: {selectedOrder._id} · Last updated: {formatFullDate(selectedOrder.updatedAt)}
                </p>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
