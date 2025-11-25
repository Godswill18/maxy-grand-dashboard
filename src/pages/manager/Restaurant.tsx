// Frontend: Restaurant.tsx (Updated with Order Details Modal)
import { useEffect, useMemo, useState, useCallback } from 'react';
import { debounce } from 'lodash'; // Assume lodash is installed, or implement custom debounce
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Search, DollarSign, User, Clock, Filter, CheckCircle, X, Menu, Utensils } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as ShadcnCalendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useOrderStore } from '@/store/useOrderStore';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuthStore } from '@/store/useAuthStore';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'; // Import react-big-calendar
import moment from 'moment'; // For localizer
import 'react-big-calendar/lib/css/react-big-calendar.css'; // Import styles
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const statusColors = {
  pending: 'bg-warning',
  confirmed: 'bg-blue-500',
  preparing: 'bg-yellow-500',
  ready: 'bg-green-500',
  delivered: 'bg-success',
  cancelled: 'bg-destructive',
};

// Localizer for react-big-calendar
const localizer = momentLocalizer(moment);

const OrderRow = ({ order, onSelect }: { order: any; onSelect: (order: any) => void }) => (
  <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => onSelect(order)}>
    <TableCell>{order._id}</TableCell>
    <TableCell>{order.customerName || order.roomNumber || order.tableNumber}</TableCell>
    <TableCell>{order.items.map((i: any) => i.name).join(', ')}</TableCell>
    <TableCell>₦{order.totalAmount.toFixed(2)}</TableCell>
    <TableCell>
      <Badge className={statusColors[order.orderStatus as keyof typeof statusColors] || 'bg-gray-500'}>
        {order.orderStatus}
      </Badge>
    </TableCell>
    <TableCell>{order.waiterId?.name || 'Unassigned'}</TableCell>
    <TableCell>{format(new Date(order.createdAt), 'PPP')}</TableCell>
  </TableRow>
);

const OrderDetailsModal = ({ order, isOpen, onClose }: { order: any; isOpen: boolean; onClose: () => void }) => {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details - #{order._id}</DialogTitle>
          <DialogDescription>Full details for order placed on {format(new Date(order.createdAt), 'PPP p')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Customer</h3>
              <p>{order.customerName || order.roomNumber ? `Room ${order.roomNumber}` : `Table ${order.tableNumber}`}</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Clock className="h-4 w-4" /> Type</h3>
              <p>{order.orderType.replace('_', ' ')}</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Badge className={statusColors[order.orderStatus as keyof typeof statusColors]}>Status</Badge></h3>
              <p>{order.orderStatus}</p>
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Waiter</h3>
              <p>{order.waiterId?.name || 'Unassigned'}</p>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2"><Menu className="h-4 w-4" /> Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₦{item.price.toFixed(2)}</TableCell>
                    <TableCell>₦{(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Total and Payment */}
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold">Total Amount</h3>
            <p className="text-2xl font-bold">₦{order.totalAmount.toFixed(2)}</p>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div>
              <h3 className="font-semibold flex items-center gap-2 mb-2"><Utensils className="h-4 w-4" /> Special Instructions</h3>
              <p className="p-3 bg-accent rounded-md">{order.specialInstructions}</p>
            </div>
          )}

          {/* Payment Status */}
          <div className="flex justify-between items-center">
            <span>Payment Status: <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>{order.paymentStatus}</Badge></span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SummaryCard = ({ title, value, icon: Icon }: { title: string; value: number; icon: any }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
);

export default function Restaurant() {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [amountSearch, setAmountSearch] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState<'createdAt' | 'totalAmount' | 'orderStatus'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedAmount, setDebouncedAmount] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>('list');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PAGE_SIZE = 20;
  const DEBOUNCE_DELAY = 500; // 500ms debounce for inputs

  const { orders, summary, hotels, isLoading, fetchOrders, fetchSummary, fetchHotels, initSocketListeners, closeSocketListeners } = useOrderStore();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';
  const [selectedHotelId, setSelectedHotelId] = useState(isSuperAdmin ? '' : user?.hotelId || '');

  // Debounced amount search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAmount(amountSearch);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [amountSearch]);

  // Debounced fetch function
  const debouncedFetchOrders = useCallback(
    debounce((params: any) => {
      fetchOrders(params);
      fetchSummary(selectedHotelId);
    }, DEBOUNCE_DELAY),
    [fetchOrders, fetchSummary, selectedHotelId]
  );

  useEffect(() => {
    fetchOrders();
    fetchSummary(selectedHotelId);
    if (isSuperAdmin) fetchHotels();
    initSocketListeners();
    return () => closeSocketListeners();
  }, [selectedHotelId]); // Only on hotel change initially

  // Apply filters only after debounce or on discrete changes like status/sort/date
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: PAGE_SIZE,
      sortBy,
      sortDir,
      hotelId: selectedHotelId,
    };
    if (statusFilter) params.status = statusFilter;
    if (fromDate) params.fromDate = fromDate.toISOString().split('T')[0];
    if (toDate) params.toDate = toDate.toISOString().split('T')[0];
    if (debouncedAmount) params.amount = debouncedAmount;
    debouncedFetchOrders(params);
    setCurrentPage(1);
  }, [selectedHotelId, statusFilter, fromDate, toDate, sortBy, sortDir, debouncedAmount, debouncedFetchOrders, currentPage]);

  const paginatedOrders = useMemo(() => {
    // Since backend handles pagination, just use orders
    return orders;
  }, [orders]);

  const totalPages = 1; // Backend returns pages, but for UI assume from store if extended

  // Map orders to calendar events
  const calendarEvents = useMemo(() => {
    return orders.map((order: any) => ({
      id: order._id,
      title: `Order #${order._id.slice(-4)} - ₦${order.totalAmount.toFixed(0)} (${order.orderStatus})`,
      start: new Date(order.createdAt),
      end: new Date(order.createdAt), // Point event, or extend if needed
      allDay: false,
      resource: { waiter: order.waiterId?.name || 'Unassigned', status: order.orderStatus },
      backgroundColor: statusColors[order.orderStatus as keyof typeof statusColors] || '#ccc',
    }));
  }, [orders]);

  const handleSelectEvent = useCallback((event: any) => {
    // Find the full order data
    const fullOrder = orders.find((o: any) => o._id === event.id);
    if (fullOrder) {
      setSelectedOrder(fullOrder);
      setIsModalOpen(true);
    }
    toast.info(`Selected order: ${event.title}`);
  }, [orders]);

  const handleRowClick = useCallback((order: any) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  }, []);

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">Restaurant Orders</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Completed Today" value={summary?.dailyCompleted || 0} icon={CheckCircle} />
        <SummaryCard title="Orders This Week" value={summary?.weeklyOrders || 0} icon={CalendarIcon} />
        <SummaryCard title="Total This Month" value={summary?.monthlyOrders || 0} icon={DollarSign} />
      </div>

      {/* Hotel Toggle for SuperAdmin */}
      {isSuperAdmin && (
        <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
          <SelectTrigger>
            <SelectValue placeholder="Select Branch" />
          </SelectTrigger>
          <SelectContent>
            {hotels.map((h) => <SelectItem key={h._id} value={h._id}>{h.name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label>Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  {/* Add others */}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label>Amount (₦)</label>
              <Input 
                type="number" 
                value={amountSearch || ''} 
                onChange={(e) => setAmountSearch(e.target.value ? Number(e.target.value) : undefined)} 
                placeholder="Enter amount"
              />
              <p className="text-xs text-muted-foreground mt-1">Updates after {DEBOUNCE_DELAY}ms</p>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild><Button variant="outline"><CalendarIcon className="h-4 w-4 mr-1" /> From</Button></PopoverTrigger>
                <PopoverContent><ShadcnCalendar mode="single" selected={fromDate} onSelect={setFromDate} /></PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline"><CalendarIcon className="h-4 w-4 mr-1" /> To</Button></PopoverTrigger>
                <PopoverContent><ShadcnCalendar mode="single" selected={toDate} onSelect={setToDate} /></PopoverContent>
              </Popover>
            </div>
            <Button onClick={() => { 
              setStatusFilter(''); 
              setAmountSearch(undefined); 
              setFromDate(undefined); 
              setToDate(undefined); 
              setDebouncedAmount(undefined);
            }}>Reset</Button>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date</SelectItem>
                <SelectItem value="totalAmount">Amount</SelectItem>
                <SelectItem value="orderStatus">Status</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List ({orders.length})</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Waiter</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders match the current filters. New orders will appear in real-time.
                </TableCell>
              </TableRow>
            ) : (
              paginatedOrders.map((order) => <OrderRow key={order._id} order={order} onSelect={handleRowClick} />)
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination - Simplified, extend store for full pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <Button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <Button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Calendar View */}
      <Tabs value={activeTab} onValueChange={setActiveTab as any}>
        <TabsList>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          {/* List content already here */}
        </TabsContent>
        <TabsContent value="calendar" className="p-0">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month', 'week', 'day', 'agenda'] as Views[]}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={(event) => ({
                style: { backgroundColor: event.backgroundColor, borderRadius: '5px' },
              })}
              messages={{
                next: 'Next',
                previous: 'Previous',
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                agenda: 'Agenda',
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Order Details Modal */}
      <OrderDetailsModal 
        order={selectedOrder} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}