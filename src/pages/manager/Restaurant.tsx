import { useEffect, useState, useCallback, useMemo } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  CalendarDays,
  BarChart3,
  Flame,
  User,
  BedDouble,
  UtensilsCrossed,
  ShoppingBag,
  CalendarIcon,
  ArrowUpDown,
  RotateCcw,
  ChefHat,
  Clock,
  CreditCard,
  Building2,
  Loader2,
} from "lucide-react";
import { useOrderStore } from "@/store/useOrderStore";
import { useAuthStore } from "@/store/useAuthStore";

// ── Color maps ─────────────────────────────────────────────────────────────
const STATUS_CLS: Record<string, string> = {
  pending:   "bg-amber-100  text-amber-700  border border-amber-200",
  confirmed: "bg-blue-100   text-blue-700   border border-blue-200",
  preparing: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  ready:     "bg-green-100  text-green-700  border border-green-200",
  delivered: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  cancelled: "bg-red-100    text-red-700    border border-red-200",
};

const PAYMENT_CLS: Record<string, string> = {
  paid:     "bg-emerald-100 text-emerald-700 border border-emerald-200",
  pending:  "bg-rose-100    text-rose-700    border border-rose-200",
  refunded: "bg-orange-100  text-orange-700  border border-orange-200",
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  room_service: "Room Service",
  dine_in:      "Dine In",
  takeaway:     "Takeaway",
};

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "pending",   label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "ready",     label: "Ready" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "preparing", "ready"]);

// ── Helpers ────────────────────────────────────────────────────────────────
const itemName = (item: any): string =>
  item.name ?? item.menuItemId?.name ?? "Unknown item";

const fmtMoney = (n: number) =>
  `₦${(n ?? 0).toLocaleString("en-NG")}`;

const customerLabel = (order: any): string => {
  if (order.customerName) return order.customerName;
  if (order.roomNumber)   return `Room ${order.roomNumber}`;
  if (order.tableNumber)  return `Table ${order.tableNumber}`;
  return "—";
};

const shortId = (id: string) => id.slice(-6).toUpperCase();

// ── Sub-components ─────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderDetailSheet({
  order,
  open,
  onClose,
  showHotel,
}: {
  order: any;
  open: boolean;
  onClose: () => void;
  showHotel?: boolean;
}) {
  if (!order) return null;

  const items: any[] = order.items ?? [];
  const total = items.reduce(
    (sum: number, i: any) => sum + (i.price ?? 0) * (i.quantity ?? 1),
    0
  );

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[500px] flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="text-xl font-bold">
            Order #{shortId(order._id)}
          </SheetTitle>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge className={STATUS_CLS[order.orderStatus] ?? ""}>
              {order.orderStatus}
            </Badge>
            {order.orderType && (
              <Badge variant="outline" className="capitalize text-xs">
                {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground ml-auto">
              {format(new Date(order.createdAt), "MMM d, yyyy · HH:mm")}
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Customer */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</p>
            <div className="flex items-center gap-2 text-sm">
              {order.roomNumber ? (
                <BedDouble className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="font-medium">{customerLabel(order)}</span>
            </div>
            {showHotel && order.hotelId?.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 shrink-0" />
                <span>{order.hotelId.name}</span>
              </div>
            )}
          </section>

          <Separator />

          {/* Items */}
          <section className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</p>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs py-2">Item</TableHead>
                    <TableHead className="text-xs py-2 text-right">Qty</TableHead>
                    <TableHead className="text-xs py-2 text-right">Price</TableHead>
                    <TableHead className="text-xs py-2 text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-4">
                        No items
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm py-2">{itemName(item)}</TableCell>
                        <TableCell className="text-sm py-2 text-right">{item.quantity ?? 1}</TableCell>
                        <TableCell className="text-sm py-2 text-right">{fmtMoney(item.price ?? 0)}</TableCell>
                        <TableCell className="text-sm py-2 text-right font-medium">
                          {fmtMoney((item.price ?? 0) * (item.quantity ?? 1))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <Separator />

          {/* Total */}
          <section className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Total Amount</p>
              <p className="text-2xl font-bold">{fmtMoney(order.totalAmount ?? total)}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Payment</p>
              <Badge className={PAYMENT_CLS[order.paymentStatus] ?? ""}>
                {order.paymentStatus ?? "—"}
              </Badge>
            </div>
          </section>

          {/* Special instructions */}
          {order.specialInstructions && (
            <>
              <Separator />
              <section className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Special Instructions</p>
                <p className="text-sm bg-muted/40 rounded-lg p-3 italic text-muted-foreground">
                  {order.specialInstructions}
                </p>
              </section>
            </>
          )}

          <Separator />

          {/* Waiter + timestamps */}
          <section className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Waiter</p>
              <div className="flex items-center gap-1.5">
                <ChefHat className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {order.waiterId?.firstName
                    ? `${order.waiterId.firstName} ${order.waiterId.lastName}`
                    : "Unassigned"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Updated</p>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs">{format(new Date(order.updatedAt), "MMM d, HH:mm")}</span>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function Restaurant() {
  const { orders, summary, isLoading, isFetching, fetchOrders, fetchSummary, initSocketListeners, closeSocketListeners } =
    useOrderStore();
  const { user } = useAuthStore();

  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate]         = useState<Date | undefined>();
  const [toDate, setToDate]             = useState<Date | undefined>();
  const [sortBy, setSortBy]             = useState<"createdAt" | "totalAmount">("createdAt");
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [sheetOpen, setSheetOpen]         = useState(false);

  const load = useCallback(() => {
    const params: any = { sortBy, sortDir };
    if (statusFilter) params.status = statusFilter;
    if (fromDate) params.fromDate = format(fromDate, "yyyy-MM-dd");
    if (toDate)   params.toDate   = format(toDate,   "yyyy-MM-dd");
    fetchOrders(params);
    fetchSummary();
  }, [statusFilter, fromDate, toDate, sortBy, sortDir, fetchOrders, fetchSummary]);

  useEffect(() => {
    load();
    initSocketListeners();
    return () => closeSocketListeners();
  }, []);

  useEffect(() => { load(); }, [statusFilter, fromDate, toDate, sortBy, sortDir]);

  const activeCount = useMemo(
    () => orders.filter((o: any) => ACTIVE_STATUSES.has(o.orderStatus)).length,
    [orders]
  );

  const handleReset = () => {
    setStatusFilter("");
    setFromDate(undefined);
    setToDate(undefined);
    setSortBy("createdAt");
    setSortDir("desc");
  };

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setSheetOpen(true);
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Restaurant Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Track and manage all restaurant orders in real-time
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Completed Today"  value={summary?.dailyCompleted ?? 0}  icon={CheckCircle2}  color="bg-emerald-500" />
        <StatCard title="Orders This Week"  value={summary?.weeklyOrders   ?? 0}  icon={CalendarDays}  color="bg-blue-500"    />
        <StatCard title="Total This Month"  value={summary?.monthlyOrders  ?? 0}  icon={BarChart3}     color="bg-violet-500"  />
        <StatCard title="Active Now"        value={activeCount}                   icon={Flame}         color="bg-amber-500"   />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={[
                  "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                  statusFilter === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:bg-muted",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Date + sort row */}
          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {fromDate ? format(fromDate, "MMM d") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <ShadcnCalendar mode="single" selected={fromDate} onSelect={setFromDate} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {toDate ? format(toDate, "MMM d") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <ShadcnCalendar mode="single" selected={toDate} onSelect={setToDate} />
              </PopoverContent>
            </Popover>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="h-8 text-xs w-[130px]">
                <ArrowUpDown className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Sort by Date</SelectItem>
                <SelectItem value="totalAmount">Sort by Amount</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortDir} onValueChange={(v) => setSortDir(v as any)}>
              <SelectTrigger className="h-8 text-xs w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>

            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto" />
            )}
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Orders
            <span className="ml-2 text-sm font-normal text-muted-foreground">({orders.length})</span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Order</TableHead>
                <TableHead className="text-xs">Customer</TableHead>
                <TableHead className="text-xs">Items</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Payment</TableHead>
                <TableHead className="text-xs">Waiter</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <UtensilsCrossed className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No orders match the current filters</p>
                    <p className="text-xs mt-1">New orders will appear in real-time</p>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: any) => {
                  const items: any[] = order.items ?? [];
                  const firstItem = items[0] ? itemName(items[0]) : "—";
                  const moreCount = items.length > 1 ? items.length - 1 : 0;

                  return (
                    <TableRow
                      key={order._id}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => openDetail(order)}
                    >
                      <TableCell className="font-mono text-xs font-medium">
                        #{shortId(order._id)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1.5">
                          {order.roomNumber ? (
                            <BedDouble className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]">{customerLabel(order)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="truncate max-w-[140px] block">
                          {firstItem}
                          {moreCount > 0 && (
                            <span className="text-xs text-primary ml-1">+{moreCount}</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {fmtMoney(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize whitespace-nowrap">
                          {ORDER_TYPE_LABEL[order.orderType] ?? order.orderType ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_CLS[order.orderStatus] ?? "bg-gray-100 text-gray-600 border border-gray-200"}>
                          {order.orderStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={PAYMENT_CLS[order.paymentStatus] ?? "bg-gray-100 text-gray-600 border"}>
                          {order.paymentStatus ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.waiterId?.firstName
                          ? `${order.waiterId.firstName} ${order.waiterId.lastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(order.createdAt), "MMM d, HH:mm")}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail sheet */}
      <OrderDetailSheet
        order={selectedOrder}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        showHotel={false}
      />
    </div>
  );
}
