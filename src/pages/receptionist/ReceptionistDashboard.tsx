import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Users, BedDouble, CreditCard, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const checkInData = [
  { time: "8 AM", checkins: 2, checkouts: 5 },
  { time: "10 AM", checkins: 8, checkouts: 3 },
  { time: "12 PM", checkins: 15, checkouts: 2 },
  { time: "2 PM", checkins: 12, checkouts: 7 },
  { time: "4 PM", checkins: 6, checkouts: 10 },
  { time: "6 PM", checkins: 4, checkouts: 8 },
];

const revenueData = [
  { day: "Mon", revenue: 45000 },
  { day: "Tue", revenue: 52000 },
  { day: "Wed", revenue: 48000 },
  { day: "Thu", revenue: 61000 },
  { day: "Fri", revenue: 72000 },
  { day: "Sat", revenue: 85000 },
  { day: "Sun", revenue: 78000 },
];

export default function ReceptionistDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Front Desk Dashboard</h1>
        <p className="text-muted-foreground">Manage guest check-ins, bookings, and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">12 completed, 6 pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Check-outs</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">8 completed, 7 pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Rooms</CardTitle>
            <BedDouble className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68/80</div>
            <p className="text-xs text-muted-foreground">85% occupancy rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦425,000</div>
            <p className="text-xs text-success">+12% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Check-in/Check-out Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={checkInData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="checkins" fill="hsl(var(--success))" name="Check-ins" />
                <Bar dataKey="checkouts" fill="hsl(var(--warning))" name="Check-outs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `₦${value.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-success" />
              Pending Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "John Doe", room: "205", time: "2:00 PM", booking: "BK-1001" },
                { name: "Sarah Johnson", room: "312", time: "3:30 PM", booking: "BK-1002" },
                { name: "Mike Wilson", room: "108", time: "4:00 PM", booking: "BK-1003" },
              ].map((guest, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div>
                    <p className="font-semibold">{guest.name}</p>
                    <p className="text-sm text-muted-foreground">Room {guest.room} • {guest.time}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{guest.booking}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Expected Check-outs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Emma Davis", room: "401", time: "11:00 AM", status: "Completed" },
                { name: "James Brown", room: "215", time: "12:00 PM", status: "Pending" },
                { name: "Lisa Anderson", room: "307", time: "1:00 PM", status: "Pending" },
              ].map((guest, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                  <div>
                    <p className="font-semibold">{guest.name}</p>
                    <p className="text-sm text-muted-foreground">Room {guest.room} • {guest.time}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    guest.status === "Completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}>
                    {guest.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
