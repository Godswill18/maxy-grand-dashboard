import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Star, Award } from "lucide-react";

export default function TipsPerformance() {
  const dailyTips = [
    { day: "Mon", tips: 5200 },
    { day: "Tue", tips: 6800 },
    { day: "Wed", tips: 4500 },
    { day: "Thu", tips: 7200 },
    { day: "Fri", tips: 9500 },
    { day: "Sat", tips: 11200 },
    { day: "Sun", tips: 8900 },
  ];

  const monthlyPerformance = [
    { month: "Jan", orders: 180, tips: 45000 },
    { month: "Feb", orders: 220, tips: 58000 },
    { month: "Mar", orders: 195, tips: 52000 },
    { month: "Apr", orders: 240, tips: 65000 },
    { month: "May", orders: 260, tips: 72000 },
    { month: "Jun", orders: 285, tips: 78000 },
  ];

  const stats = [
    {
      title: "Today's Tips",
      value: "₦11,200",
      icon: DollarSign,
      change: "+18%",
      color: "text-success",
    },
    {
      title: "Monthly Tips",
      value: "₦78,000",
      icon: TrendingUp,
      change: "+12%",
      color: "text-info",
    },
    {
      title: "Average Rating",
      value: "4.8",
      icon: Star,
      change: "+0.3",
      color: "text-warning",
    },
    {
      title: "Completed Orders",
      value: "285",
      icon: Award,
      change: "+25",
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className={`text-sm font-medium ${stat.color}`}>
                    {stat.change} from last period
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-primary/10`}>
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Tips Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTips}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`₦${value.toLocaleString()}`, "Tips"]}
                />
                <Line
                  type="monotone"
                  dataKey="tips"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [value.toLocaleString(), ""]}
                />
                <Bar dataKey="orders" fill="hsl(var(--info))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Best Day</p>
              <p className="text-2xl font-bold text-primary">Saturday</p>
              <p className="text-sm text-muted-foreground">₦11,200 in tips</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Most Popular Table</p>
              <p className="text-2xl font-bold text-success">Table 5</p>
              <p className="text-sm text-muted-foreground">18 orders this month</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Customer Feedback</p>
              <p className="text-2xl font-bold text-warning">4.8/5.0</p>
              <p className="text-sm text-muted-foreground">Based on 156 reviews</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Average Tip</p>
              <p className="text-2xl font-bold text-info">₦273</p>
              <p className="text-sm text-muted-foreground">Per order</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
