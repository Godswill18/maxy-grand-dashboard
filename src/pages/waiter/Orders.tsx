import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, Clock, DollarSign, Search } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  table: number;
  items: string[];
  total: string;
  status: "Pending" | "Served" | "Completed";
  time: string;
  tip?: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-001",
      table: 5,
      items: ["Grilled Chicken", "Mojito", "Caesar Salad"],
      total: "₦9,500",
      status: "Pending",
      time: "12:45 PM",
    },
    {
      id: "ORD-002",
      table: 3,
      items: ["Pasta Alfredo", "Lemonade"],
      total: "₦7,800",
      status: "Served",
      time: "12:30 PM",
    },
    {
      id: "ORD-003",
      table: 8,
      items: ["Beef Burger", "Fries", "Coke", "Ice Cream"],
      total: "₦12,400",
      status: "Pending",
      time: "12:20 PM",
    },
    {
      id: "ORD-004",
      table: 2,
      items: ["Sushi Platter", "Green Tea"],
      total: "₦15,200",
      status: "Completed",
      time: "11:50 AM",
      tip: "₦2,000",
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");

  const updateOrderStatus = (orderId: string, newStatus: Order["status"]) => {
    setOrders(orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
    toast.success(`Order ${orderId} marked as ${newStatus}`);
  };

  const addTip = (orderId: string) => {
    const tip = prompt("Enter tip amount (₦):");
    if (tip) {
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, tip: `₦${tip}` } : order
      ));
      toast.success(`Tip of ₦${tip} added to ${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Served": return "bg-info/10 text-info hover:bg-info/20";
      case "Completed": return "bg-success/10 text-success hover:bg-success/20";
      default: return "";
    }
  };

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.table.toString().includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order ID or table number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{order.id}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {order.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Table {order.table} • {order.time}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Items:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {order.items.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-primary">{order.total}</span>
              </div>

              {order.tip && (
                <div className="flex items-center gap-2 p-2 bg-success/10 rounded-md">
                  <DollarSign className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">Tip: {order.tip}</span>
                </div>
              )}

              <div className="flex gap-2">
                {order.status === "Pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => updateOrderStatus(order.id, "Served")}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Mark Served
                  </Button>
                )}
                {order.status === "Served" && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => updateOrderStatus(order.id, "Completed")}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
                {order.status === "Completed" && !order.tip && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => addTip(order.id)}
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Add Tip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
