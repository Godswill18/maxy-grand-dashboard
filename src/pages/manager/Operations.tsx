import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, AlertTriangle, Bed, Users, Utensils, Sparkles } from "lucide-react";

const roomStatus = [
  { room: "101", type: "Deluxe", status: "Occupied", guest: "John Doe", checkOut: "2024-06-20" },
  { room: "102", type: "Suite", status: "Cleaning", guest: null, checkOut: null },
  { room: "103", type: "Standard", status: "Available", guest: null, checkOut: null },
  { room: "104", type: "Deluxe", status: "Occupied", guest: "Jane Smith", checkOut: "2024-06-18" },
  { room: "105", type: "Suite", status: "Maintenance", guest: null, checkOut: null },
];

const cleaningTasks = [
  { id: 1, room: "102", cleaner: "Michael Brown", priority: "High", status: "In Progress", startTime: "10:30 AM" },
  { id: 2, room: "205", cleaner: "Jessica Lee", priority: "Medium", status: "Pending", startTime: null },
  { id: 3, room: "308", cleaner: "Michael Brown", priority: "Low", status: "Completed", startTime: "09:00 AM" },
];

const restaurantOrders = [
  { id: 1, table: 5, waiter: "Emily Davis", items: 3, total: "₦9,500", status: "Pending", time: "12:45 PM" },
  { id: 2, table: 8, waiter: "Robert Taylor", items: 2, total: "₦6,200", status: "Served", time: "12:30 PM" },
  { id: 3, table: 12, waiter: "Emily Davis", items: 4, total: "₦12,300", status: "Completed", time: "11:45 AM" },
];

const statusColors: Record<string, string> = {
  Occupied: "bg-primary text-primary-foreground",
  Available: "bg-success text-success-foreground",
  Cleaning: "bg-warning text-warning-foreground",
  Maintenance: "bg-destructive text-destructive-foreground",
  Pending: "bg-warning text-warning-foreground",
  "In Progress": "bg-info text-info-foreground",
  Completed: "bg-success text-success-foreground",
  Served: "bg-info text-info-foreground",
};

export default function Operations() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Operations Monitoring</h1>
        <p className="text-muted-foreground">Real-time branch operations overview</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Occupied Rooms</p>
                <p className="text-2xl font-bold text-foreground">
                  {roomStatus.filter(r => r.status === "Occupied").length}
                </p>
              </div>
              <Bed className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cleaning Tasks</p>
                <p className="text-2xl font-bold text-foreground">
                  {cleaningTasks.filter(t => t.status !== "Completed").length}
                </p>
              </div>
              <Sparkles className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold text-foreground">
                  {restaurantOrders.filter(o => o.status !== "Completed").length}
                </p>
              </div>
              <Utensils className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Staff On Duty</p>
                <p className="text-2xl font-bold text-foreground">18</p>
              </div>
              <Users className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rooms">Room Status</TabsTrigger>
          <TabsTrigger value="cleaning">Cleaning Tasks</TabsTrigger>
          <TabsTrigger value="restaurant">Restaurant</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms">
          <Card>
            <CardHeader>
              <CardTitle>Current Room Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomStatus.map((room) => (
                    <TableRow key={room.room}>
                      <TableCell className="font-medium">{room.room}</TableCell>
                      <TableCell>{room.type}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[room.status]}>{room.status}</Badge>
                      </TableCell>
                      <TableCell>{room.guest || "-"}</TableCell>
                      <TableCell>{room.checkOut || "-"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cleaning">
          <Card>
            <CardHeader>
              <CardTitle>Cleaning Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>Cleaner</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cleaningTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.room}</TableCell>
                      <TableCell>{task.cleaner}</TableCell>
                      <TableCell>
                        <Badge variant={task.priority === "High" ? "destructive" : "outline"}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.status]}>{task.status}</Badge>
                      </TableCell>
                      <TableCell>{task.startTime || "-"}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">Update</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restaurant">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Waiter</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurantOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">ORD-{order.id}</TableCell>
                      <TableCell>Table {order.table}</TableCell>
                      <TableCell>{order.waiter}</TableCell>
                      <TableCell>{order.items} items</TableCell>
                      <TableCell className="font-semibold">{order.total}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{order.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
