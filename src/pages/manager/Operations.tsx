// Operations.tsx (Updated)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bed, Users, Utensils, Sparkles, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { useOperationsStore } from '../../store/useOperationsStore.ts'; // **Import your store**
import { useEffect } from 'react';
import { useAuthStore } from "@/store/useAuthStore.ts";
import { useStaffStore } from "@/store/useStaffStore.ts";
// --- Placeholder Hook for Auth/Context ---
// **REPLACE THIS with your actual logic to get hotelId and token.**
// In a real application, this would come from an AuthContext or another Zustand store.
const useUserHotelContext = () => {
    const { user } = useAuthStore();
    const hotelId = user?.hotelId || null; // Example Hotel ID (should be dynamic)
    const token = user?.token || null; // Example Bearer Token (should be dynamic)
    return { hotelId, token };
};
// --- End Placeholder Hook ---
const statusColors: Record<string, string> = {
    occupied: "bg-primary text-primary-foreground",
    available: "bg-success text-success-foreground",
    cleaning: "bg-warning text-warning-foreground",
    maintenance: "bg-destructive text-destructive-foreground",
    pending: "bg-warning text-warning-foreground",
    "in progress": "bg-info text-info-foreground",
    completed: "bg-success text-success-foreground",
    served: "bg-info text-info-foreground",
    // Ensure all possible statuses from your backend are covered
};
export default function Operations() {
    // 1. Get state and actions from the store
    const {
        roomsStatus,
        cleaningTasks,
        restaurantOrders,
        allRoomDetails,
        isLoading,
        error,
        fetchOperationsData,
        fetchRoomDetails,
        connectSocket,
        disconnectSocket
    } = useOperationsStore();
    const { staff, fetchStaffByLoggedInUserHotel } = useStaffStore();
    const { hotelId, token } = useUserHotelContext();
    // const context = { hotelId, token };
    // 3. Fetch data on component mount
   useEffect(() => {
        if (hotelId && token) {
            // Initial Data Fetch
            fetchOperationsData();
            fetchRoomDetails();
           
            // Connect to Socket.IO for real-time updates
            connectSocket();
        }
        fetchStaffByLoggedInUserHotel();
       
        // Cleanup function runs on unmount
        return () => {
            disconnectSocket();
        };
    }, [hotelId, token, fetchOperationsData, fetchRoomDetails, connectSocket, disconnectSocket, fetchStaffByLoggedInUserHotel]);
   
    // Derived State (for quick stats)
    const occupiedRoomsCount = roomsStatus.filter(r => r.status === "occupied").length;
    const pendingCleaningTasksCount = cleaningTasks.filter(t => t.status !== "completed").length;
    const activeOrdersCount = restaurantOrders.filter(o => o.orderStatus !== "delivered" && o.orderStatus !== "cancelled").length;
    // Note: Staff on duty is still static as there's no staff API here.
    const handleRefresh = () => {
        if (hotelId && token) {
            fetchOperationsData();
            fetchRoomDetails();
        }
    };

    console.log(allRoomDetails);
   
    // Convert backend data structure to match previous frontend usage (if necessary)
    // Note: The backend models don't expose guest name/checkout directly on the Room model.
    // This is a common gap in real-world data fetching where an additional query/model merge is needed.
    // For simplicity, we'll map the available fields and use placeholders for missing ones.
    // Optionally merge with allRoomDetails for richer display (e.g., full type name)
    const mappedRoomStatus = roomsStatus.map(room => {
        const fullRoom = allRoomDetails.find(r => r._id === room.roomTypeId?._id);
        return {
            room: room.roomNumber,
            type: fullRoom?.name || room.roomTypeId?.name || "Unknown",
            status: room.status,
            guest: room.status === 'occupied' ? "Guest Info Needed" : null, // ⚠️ Requires real Guest/Booking data
            checkOut: room.status === 'occupied' ? "Date Needed" : null, // ⚠️ Requires real Guest/Booking data
        };
    });
    const mappedCleaningTasks = cleaningTasks
    .filter(t => t.status !== 'completed')
    .map(task => ({
        id: task._id,
        room: task.roomId?.roomNumber || "N/A",
        cleaner: task.assignedCleaner?.name || "Unassigned",
        priority: "High", // ⚠️ Backend doesn't provide priority field; using static value
        status: task.status,
        startTime: new Date(task.createdAt).toLocaleTimeString(),
    }));
    const mappedRestaurantOrders = restaurantOrders
    .filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled')
    .map(order => ({
        id: order._id,
        table: order.tableNumber || (order.orderType === 'room service' ? 'Room' : 'N/A'),
        waiter: "Staff Info Needed", // ⚠️ Requires populating staff/waiter ID
        items: order.items.length,
        total: `₦${order.totalAmount.toLocaleString()}`,
        status: order.orderStatus,
        time: new Date(order.createdAt).toLocaleTimeString(),
    }));
    if (error) {
        return (
            <div className="p-6 text-center text-destructive border border-destructive rounded-lg">
                <AlertTriangle className="h-6 w-6 inline mr-2" />
                Error loading operations data: **{error}**
                <Button variant="ghost" onClick={handleRefresh} className="ml-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }
    if (isLoading && roomsStatus.length === 0) {
        return (
            <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-3 text-lg text-muted-foreground">Loading hotel operations data...</p>
            </div>
        );
    }
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Operations Monitoring</h1>
                <p className="text-muted-foreground">Real-time branch operations overview</p>
                <div className="flex justify-end pt-2">
                    <Button onClick={handleRefresh} disabled={isLoading} variant="outline" size="sm">
                        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        {isLoading ? "Refreshing..." : "Refresh Data"}
                    </Button>
                </div>
            </div>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Occupied Rooms</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {occupiedRoomsCount}
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
                                    {pendingCleaningTasksCount}
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
                                    {activeOrdersCount}
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
                                <p className="text-2xl font-bold text-foreground">
                                 {staff.length}
                                 </p> {/* Static */}
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
                                    {mappedRoomStatus.map((room) => (
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
                                    {mappedCleaningTasks.map((task) => (
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
                                    {mappedRestaurantOrders.map((order) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">ORD-{order.id}</TableCell>
                                            <TableCell>{order.table}</TableCell>
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