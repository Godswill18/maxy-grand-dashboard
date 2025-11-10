import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, Clock, UtensilsCrossed, CalendarDays } from "lucide-react";

export default function WaiterDashboard() {
  const stats = [
    {
      title: "Total Orders Today",
      value: "24",
      icon: ClipboardList,
      color: "primary" as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Pending Orders",
      value: "8",
      icon: Clock,
      color: "warning" as const,
    },
    {
      title: "Completed Orders",
      value: "16",
      icon: CheckCircle,
      color: "success" as const,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Tables Assigned",
      value: "6",
      icon: UtensilsCrossed,
      color: "info" as const,
    },
    {
      title: "Reservations Today",
      value: "12",
      icon: CalendarDays,
      color: "secondary" as const,
    },
  ];

  const recentOrders = [
    { id: "ORD-024", table: 5, items: 3, total: "₦9,500", status: "Pending", time: "12:45 PM" },
    { id: "ORD-023", table: 3, items: 2, total: "₦7,800", status: "Served", time: "12:30 PM" },
    { id: "ORD-022", table: 8, items: 5, total: "₦15,200", status: "Completed", time: "11:50 AM" },
    { id: "ORD-021", table: 2, items: 4, total: "₦11,300", status: "Completed", time: "11:20 AM" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "text-warning bg-warning/10";
      case "Served": return "text-info bg-info/10";
      case "Completed": return "text-success bg-success/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{order.id}</span>
                    <span className="text-sm text-muted-foreground">Table {order.table}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.items} items • {order.time}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg">{order.total}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-primary/10 rounded-lg">
                <ClipboardList className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">View All Orders</h3>
                <p className="text-sm text-muted-foreground">Manage and update order statuses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-success/10 rounded-lg">
                <UtensilsCrossed className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Check Tables</h3>
                <p className="text-sm text-muted-foreground">View assigned tables and statuses</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
