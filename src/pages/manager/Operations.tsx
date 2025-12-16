// Operations.tsx (Optimized with better modal handling)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bed, Users, Utensils, Sparkles, Loader2, RefreshCw, AlertTriangle, ArrowUpDown, Eye } from "lucide-react";
import { useOperationsStore } from '../../store/useOperationsStore.ts';
import { useStaffStore } from "@/store/useStaffStore.ts";
import { useAuthStore } from "@/store/useAuthStore.ts";
import { useEffect, useState, useMemo } from 'react';

// Import components
import { TableViewModal } from "@/components/operations/TableViewModal.tsx";
import { DataTablePagination } from "@/components/operations/DataTablePagination.tsx";
import { TableSkeleton } from "@/components/skeleton/TableSkeleton.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

// --- Utility Functions ---

const useUserHotelContext = () => {
    const { user } = useAuthStore();
    const hotelId = user?.hotelId || null;
    const token = sessionStorage.getItem("token");
    return { hotelId, token };
};

const statusColors: Record<string, string> = {
    occupied: "bg-primary text-primary-foreground",
    available: "bg-success text-success-foreground",
    cleaning: "bg-warning text-warning-foreground",
    maintenance: "bg-destructive text-destructive-foreground",
    pending: "bg-warning text-warning-foreground",
    "in progress": "bg-info text-info-foreground",
    completed: "bg-success text-success-foreground",
    served: "bg-info text-info-foreground",
};

type SortDirection = 'asc' | 'desc';

interface TableState {
    pageIndex: number;
    pageSize: number;
    sortBy: string | null;
    sortDirection: SortDirection;
}

// Global Sort Function
const sortData = <T extends Record<string, any>>(
    data: T[],
    key: keyof T | null,
    direction: SortDirection
): T[] => {
    if (!key) return data;
    const sorted = [...data].sort((a, b) => {
        const aVal = a[key] ?? '';
        const bVal = b[key] ?? '';
        
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
            comparison = String(aVal).localeCompare(String(bVal));
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
            comparison = aVal - bVal;
        } else {
            comparison = String(aVal).localeCompare(String(bVal));
        }

        return direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
};

// --- Sub-Components for Tables ---

interface OperationsTableProps<T> {
    data: T[];
    columns: { key: keyof T; label: string; render?: (item: T) => React.ReactNode; sortable?: boolean }[];
    entityName: string;
    onViewDetails: (item: T) => void;
}

const PaginatedSortableTable = <T extends Record<string, any>>({
    data,
    columns,
    entityName,
    onViewDetails,
}: OperationsTableProps<T>) => {
    const [state, setState] = useState<TableState>({
        pageIndex: 0,
        pageSize: 10,
        sortBy: null,
        sortDirection: 'asc',
    });

    useEffect(() => {
        setState(prev => ({ ...prev, pageIndex: 0 }));
    }, [data, state.sortBy, state.sortDirection]);

    const handleSort = (key: string) => {
        setState(prev => ({
            ...prev,
            sortBy: key,
            sortDirection: prev.sortBy === key && prev.sortDirection === 'asc' ? 'desc' : 'asc',
        }));
    };

    const sortedData = useMemo(() => {
        if (!state.sortBy) return data;
        return sortData(data, state.sortBy, state.sortDirection);
    }, [data, state.sortBy, state.sortDirection]);

    const paginatedData = useMemo(() => {
        const start = state.pageIndex * state.pageSize;
        return sortedData.slice(start, start + state.pageSize);
    }, [sortedData, state.pageIndex, state.pageSize]);

    return (
        <>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col) => (
                                <TableHead key={col.key as string}>
                                    {col.sortable ? (
                                        <Button
                                            variant="ghost"
                                            className="-ml-4 h-8"
                                            onClick={() => handleSort(col.key as string)}
                                        >
                                            {col.label}
                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                            {state.sortBy === col.key && (
                                                <span className="ml-1 text-xs text-primary">
                                                    {state.sortDirection === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </Button>
                                    ) : (
                                        col.label
                                    )}
                                </TableHead>
                            ))}
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((item, index) => (
                                <TableRow key={index}>
                                    {columns.map((col) => (
                                        <TableCell key={col.key as string}>
                                            {col.render ? col.render(item) : String(item[col.key] ?? '-')}
                                        </TableCell>
                                    ))}
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => onViewDetails(item)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                                    No {entityName} data to display.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination
                pageIndex={state.pageIndex}
                pageSize={state.pageSize}
                dataLength={data.length}
                onPageChange={(index) => setState(prev => ({ ...prev, pageIndex: index }))}
            />
        </>
    );
};

// --- Main Component ---

export default function Operations() {
    const [modalState, setModalState] = useState<{ isOpen: boolean; title: string; data: any | null }>({
        isOpen: false,
        title: "",
        data: null,
    });

    const {
        allRoomDetails,
        cleaningTasks,
        restaurantOrders,
        isLoading,
        error,
        fetchOperationsData,
        fetchRoomDetails,
        connectSocket,
        disconnectSocket
    } = useOperationsStore();
    const { staff, fetchStaffByLoggedInUserHotel } = useStaffStore();
    const { hotelId, token } = useUserHotelContext();

    useEffect(() => {
        if (hotelId) {
            fetchOperationsData();
            fetchRoomDetails();
            connectSocket();
        }
        fetchStaffByLoggedInUserHotel();
        
        return () => {
            disconnectSocket();
        };
    }, [hotelId, token, fetchOperationsData, fetchRoomDetails, connectSocket, disconnectSocket, fetchStaffByLoggedInUserHotel]);
    
    // Derived State
    const occupiedRoomsCount = allRoomDetails.filter(r => r.status === "occupied").length;
    const pendingCleaningTasksCount = cleaningTasks.filter(t => t.status !== "completed").length;
    const activeOrdersCount = restaurantOrders.filter(o => o.orderStatus !== "delivered" && o.orderStatus !== "cancelled").length;
    const activeStaffCount = staff.filter(s => s.isActive && s.role !== 'admin' && s.role !== 'superadmin').length;
    
    const handleRefresh = () => {
        if (hotelId) {
            fetchOperationsData();
            fetchRoomDetails();
            fetchStaffByLoggedInUserHotel();
        }
    };

    // ✅ FIXED: Extract guest name from currentBookingId object
    const getGuestNameFromBooking = (booking: any): string => {
        if (!booking) return "-";
        if (typeof booking === 'string') return booking;
        if (booking.guestName) return booking.guestName;
        if (booking.firstName && booking.lastName) return `${booking.firstName} ${booking.lastName}`;
        return "-";
    };

    // ✅ FIXED: Extract booking ID from currentBookingId object
    const getBookingIdDisplay = (booking: any): string => {
        if (!booking) return "-";
        if (typeof booking === 'string') return booking;
        if (booking._id) return booking._id.slice(-8); // Show last 8 chars
        if (booking.id) return booking.id.slice(-8);
        return "-";
    };

    const handleViewDetails = (title: string, data: any) => {
        setModalState({ isOpen: true, title, data });
    };

    const roomColumns = [
        { key: "roomNumber" as const, label: "Room", sortable: true },
        { key: "roomTypeId" as const, label: "Type", sortable: true, render: (r: any) => r.roomTypeId?.name || "Unknown" },
        { key: "status" as const, label: "Status", sortable: true, render: (r: any) => <Badge className={statusColors[r.status]}>{r.status}</Badge> },
        { key: "guestName" as const, label: "Guest", render: (r: any) => getGuestNameFromBooking(r.currentBookingId) },
        { key: "currentBookingId" as const, label: "Booking ID", sortable: false, render: (r: any) => getBookingIdDisplay(r.currentBookingId) },
    ];

    const cleaningColumns = [
        { key: "roomId" as const, label: "Room", sortable: true, render: (t: any) => t.roomId?.roomNumber || "N/A" },
        { key: "assignedCleaner" as const, label: "Cleaner", sortable: true, render: (t: any) => t.assignedCleaner?.name || "Unassigned" },
        { key: "priority" as const, label: "Priority", sortable: true, render: () => <Badge variant="destructive">High</Badge> },
        { key: "status" as const, label: "Status", sortable: true, render: (t: any) => <Badge className={statusColors[t.status]}>{t.status}</Badge> },
        { key: "createdAt" as const, label: "Start Time", sortable: true, render: (t: any) => new Date(t.createdAt).toLocaleTimeString() },
    ];

    const restaurantColumns = [
        { key: "_id" as const, label: "Order ID", sortable: true, render: (o: any) => `ORD-${o._id.slice(-6)}` },
        { key: "tableNumber" as const, label: "Table/Room", sortable: true, render: (o: any) => o.tableNumber || (o.orderType === 'room service' ? `Room ${o.roomNumber}` : 'N/A') },
        { key: "waiterId" as const, label: "Waiter", sortable: true, render: (o: any) => o.waiterId?.firstName + " " + o.waiterId?.lastName || 'Unassigned' },
        { key: "items" as const, label: "Items", sortable: false, render: (o: any) => `${o.items.length} items` },
        { key: "totalAmount" as const, label: "Total", sortable: true, render: (o: any) => `₦${o.totalAmount.toLocaleString()}` },
        { key: "orderStatus" as const, label: "Status", sortable: true, render: (o: any) => <Badge className={statusColors[o.orderStatus]}>{o.orderStatus}</Badge> },
        { key: "createdAt" as const, label: "Time", sortable: true, render: (o: any) => new Date(o.createdAt).toLocaleTimeString() },
    ];

    const nonCompletedCleaningTasks = cleaningTasks.filter(t => t.status !== 'completed');
    const activeRestaurantOrders = restaurantOrders.filter(o => o.orderStatus !== 'delivered' && o.orderStatus !== 'cancelled');

    if (error) {
        return (
            <div className="p-6 text-center text-destructive border border-destructive rounded-lg">
                <AlertTriangle className="h-6 w-6 inline mr-2" />
                Error loading operations data: {error}
                <Button variant="ghost" onClick={handleRefresh} className="ml-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    const tableLoading = isLoading && allRoomDetails.length === 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <TableViewModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ ...modalState, isOpen: false })}
                title={modalState.title}
                data={modalState.data}
            />

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
                                <div className="text-2xl font-bold text-foreground">
                                    {tableLoading ? <Skeleton className="h-7 w-12" /> : occupiedRoomsCount}
                                </div>
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
                                <div className="text-2xl font-bold text-foreground">
                                    {tableLoading ? <Skeleton className="h-7 w-12" /> : pendingCleaningTasksCount}
                                </div>
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
                                <div className="text-2xl font-bold text-foreground">
                                    {tableLoading ? <Skeleton className="h-7 w-12" /> : activeOrdersCount}
                                </div>
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
                                <div className="text-2xl font-bold text-foreground">
                                    {tableLoading ? <Skeleton className="h-7 w-12" /> : activeStaffCount}
                                </div>
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

                {/* --- Room Status Table --- */}
                <TabsContent value="rooms">
                    <Card>
                        <CardHeader>
                            <CardTitle>Current Room Status</CardTitle>
                        </CardHeader>
                        {tableLoading ? (
                            <TableSkeleton columns={roomColumns.length + 1} rows={10} />
                        ) : (
                            <CardContent className="pt-6">
                                <PaginatedSortableTable
                                    data={allRoomDetails}
                                    columns={roomColumns}
                                    entityName="Room"
                                    onViewDetails={(room) => handleViewDetails("Room", room)}
                                />
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>

                {/* --- Cleaning Tasks Table --- */}
                <TabsContent value="cleaning">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cleaning Tasks</CardTitle>
                        </CardHeader>
                        {tableLoading ? (
                            <TableSkeleton columns={cleaningColumns.length + 1} rows={10} />
                        ) : (
                            <CardContent className="pt-6">
                                <PaginatedSortableTable
                                    data={nonCompletedCleaningTasks}
                                    columns={cleaningColumns as any}
                                    entityName="Cleaning Task"
                                    onViewDetails={(task) => handleViewDetails("Cleaning Task", task)}
                                />
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>

                {/* --- Restaurant Orders Table --- */}
                <TabsContent value="restaurant">
                    <Card>
                        <CardHeader>
                            <CardTitle>Restaurant Orders</CardTitle>
                        </CardHeader>
                        {tableLoading ? (
                            <TableSkeleton columns={restaurantColumns.length + 1} rows={10} />
                        ) : (
                            <CardContent className="pt-6">
                                <PaginatedSortableTable
                                    data={activeRestaurantOrders}
                                    columns={restaurantColumns as any}
                                    entityName="Restaurant Order"
                                    onViewDetails={(order) => handleViewDetails("Restaurant Order", order)}
                                />
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}