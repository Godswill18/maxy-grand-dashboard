import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserCircle,
  Building2,
  Bed,
  Sparkles,
  UserCheck,
  Coffee,
  BedDouble,
  AlertCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const stats = [
  { title: "Total Staff", value: "248", icon: Users, color: "primary" as const, trend: { value: 12, isPositive: true } },
  { title: "Total Users", value: "1,824", icon: UserCircle, color: "info" as const, trend: { value: 8, isPositive: true } },
  { title: "Branch Managers", value: "15", icon: UserCheck, color: "secondary" as const },
  { title: "Hotel Branches", value: "12", icon: Building2, color: "success" as const },
  { title: "Total Rooms", value: "342", icon: Bed, color: "primary" as const },
  { title: "Cleaners", value: "86", icon: Sparkles, color: "info" as const },
  { title: "Receptionists", value: "42", icon: UserCheck, color: "secondary" as const },
  { title: "Waiters", value: "68", icon: Coffee, color: "warning" as const },
  { title: "Available Rooms", value: "187", icon: BedDouble, color: "success" as const, trend: { value: 5, isPositive: false } },
  { title: "To Be Cleaned", value: "23", icon: AlertCircle, color: "warning" as const },
];

const bookingData = [
  { name: "Mon", daily: 12, weekly: 42, monthly: 180 },
  { name: "Tue", daily: 19, weekly: 58, monthly: 195 },
  { name: "Wed", daily: 15, weekly: 48, monthly: 188 },
  { name: "Thu", daily: 22, weekly: 64, monthly: 205 },
  { name: "Fri", daily: 28, weekly: 72, monthly: 220 },
  { name: "Sat", daily: 35, weekly: 88, monthly: 245 },
  { name: "Sun", daily: 31, weekly: 78, monthly: 235 },
];

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 48000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 58000 },
  { month: "Jun", revenue: 67000 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div key={stat.title} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${index * 50}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <Card className="animate-in fade-in slide-in-from-left duration-500">
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={bookingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="daily" stroke="hsl(var(--primary))" strokeWidth={2} name="Daily" />
                <Line type="monotone" dataKey="weekly" stroke="hsl(var(--secondary))" strokeWidth={2} name="Weekly" />
                <Line type="monotone" dataKey="monthly" stroke="hsl(var(--info))" strokeWidth={2} name="Monthly" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card className="animate-in fade-in slide-in-from-right duration-500">
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--success))" radius={[8, 8, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="animate-in fade-in slide-in-from-bottom duration-500">
        <CardHeader>
          <CardTitle>Quick Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Today's Bookings</p>
              <p className="text-2xl font-bold text-primary">28</p>
              <p className="text-xs text-success">+15% from yesterday</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold text-secondary">156</p>
              <p className="text-xs text-success">+8% from last week</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-info">642</p>
              <p className="text-xs text-success">+12% from last month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
