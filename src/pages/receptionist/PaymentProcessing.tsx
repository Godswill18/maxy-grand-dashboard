import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, DollarSign, Search, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Payment {
  id: string;
  bookingId: string;
  guestName: string;
  amount: number;
  method: "Card" | "Cash" | "Bank Transfer" | "Online";
  status: "Paid" | "Pending" | "Failed" | "Refunded";
  date: string;
  description: string;
}

const dailyRevenue = [
  { day: "Mon", revenue: 285000, transactions: 12 },
  { day: "Tue", revenue: 345000, transactions: 15 },
  { day: "Wed", revenue: 298000, transactions: 11 },
  { day: "Thu", revenue: 412000, transactions: 18 },
  { day: "Fri", revenue: 485000, transactions: 21 },
  { day: "Sat", revenue: 625000, transactions: 28 },
  { day: "Sun", revenue: 542000, transactions: 24 },
];

export default function PaymentProcessing() {
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: "PAY-001",
      bookingId: "BK-1001",
      guestName: "John Doe",
      amount: 135000,
      method: "Card",
      status: "Paid",
      date: "Dec 22, 2024 10:30 AM",
      description: "Room payment - 3 nights"
    },
    {
      id: "PAY-002",
      bookingId: "BK-1002",
      guestName: "Sarah Johnson",
      amount: 255000,
      method: "Bank Transfer",
      status: "Pending",
      date: "Dec 22, 2024 11:15 AM",
      description: "Suite booking - 3 nights"
    },
    {
      id: "PAY-003",
      bookingId: "BK-1003",
      guestName: "Mike Wilson",
      amount: 50000,
      method: "Cash",
      status: "Paid",
      date: "Dec 22, 2024 9:00 AM",
      description: "Standard room - 2 nights"
    },
    {
      id: "PAY-004",
      bookingId: "BK-1004",
      guestName: "Emma Davis",
      amount: 85000,
      method: "Online",
      status: "Failed",
      date: "Dec 22, 2024 2:30 PM",
      description: "Deluxe room - 2 nights"
    },
  ]);

  const processPayment = (paymentId: string) => {
    setPayments(payments.map(payment =>
      payment.id === paymentId ? { ...payment, status: "Paid" as const } : payment
    ));
    toast.success(`Payment ${paymentId} processed successfully`);
  };

  const refundPayment = (paymentId: string) => {
    setPayments(payments.map(payment =>
      payment.id === paymentId ? { ...payment, status: "Refunded" as const } : payment
    ));
    toast.success(`Payment ${paymentId} refunded`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid": return "bg-success/10 text-success hover:bg-success/20";
      case "Pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Failed": return "bg-error/10 text-error hover:bg-error/20";
      case "Refunded": return "bg-info/10 text-info hover:bg-info/20";
      default: return "";
    }
  };

  const getMethodIcon = (method: string) => {
    return <CreditCard className="h-4 w-4" />;
  };

  const filteredPayments = payments.filter(payment =>
    payment.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.bookingId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paid = filteredPayments.filter(p => p.status === "Paid");
  const pending = filteredPayments.filter(p => p.status === "Pending");
  const failed = filteredPayments.filter(p => p.status === "Failed");
  const refunded = filteredPayments.filter(p => p.status === "Refunded");

  const totalRevenue = payments.filter(p => p.status === "Paid").reduce((sum, p) => sum + p.amount, 0);

  const PaymentCard = ({ payment }: { payment: Payment }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{payment.guestName}</h3>
              <p className="text-sm text-muted-foreground">{payment.description}</p>
            </div>
            <Badge className={getStatusColor(payment.status)}>
              {payment.status}
            </Badge>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payment ID:</span>
              <span className="font-medium">{payment.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Booking ID:</span>
              <span className="font-medium">{payment.bookingId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Method:</span>
              <div className="flex items-center gap-2">
                {getMethodIcon(payment.method)}
                <span className="font-medium">{payment.method}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium text-xs">{payment.date}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-bold text-lg text-primary">₦{payment.amount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {payment.status === "Pending" && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="flex-1">
                    Process Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Process Payment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Guest Name</Label>
                      <Input value={payment.guestName} disabled />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input value={`₦${payment.amount.toLocaleString()}`} disabled />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select defaultValue={payment.method.toLowerCase()}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={() => processPayment(payment.id)}>
                      Confirm Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {payment.status === "Paid" && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => refundPayment(payment.id)}
              >
                Refund
              </Button>
            )}
            {payment.status === "Failed" && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => processPayment(payment.id)}
              >
                Retry Payment
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Processing</h1>
          <p className="text-muted-foreground">Manage guest payments and transactions</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <DollarSign className="h-4 w-4 mr-2" />
              New Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Process New Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Booking ID</Label>
                <Input placeholder="BK-1001" />
              </div>
              <div>
                <Label>Guest Name</Label>
                <Input placeholder="John Doe" />
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" placeholder="50000" />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input placeholder="Room payment" />
              </div>
              <Button className="w-full" onClick={() => toast.success("Payment recorded successfully")}>
                Process Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-success">+15% from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-3xl font-bold text-success">{paid.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-warning">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-3xl font-bold text-error">{failed.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue & Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" name="Revenue (₦)" />
              <Bar yAxisId="right" dataKey="transactions" fill="hsl(var(--success))" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by guest name, payment ID, or booking ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({filteredPayments.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paid.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failed.length})</TabsTrigger>
          <TabsTrigger value="refunded">Refunded ({refunded.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPayments.map(payment => <PaymentCard key={payment.id} payment={payment} />)}
          </div>
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paid.map(payment => <PaymentCard key={payment.id} payment={payment} />)}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.map(payment => <PaymentCard key={payment.id} payment={payment} />)}
          </div>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {failed.map(payment => <PaymentCard key={payment.id} payment={payment} />)}
          </div>
        </TabsContent>

        <TabsContent value="refunded" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {refunded.map(payment => <PaymentCard key={payment.id} payment={payment} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
