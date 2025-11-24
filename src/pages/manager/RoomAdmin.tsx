// /pages/RoomAdmin.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, RefreshCw, AlertTriangle, UserPlus, Image } from "lucide-react";
import { useOperationsStore, RoomDetails } from '@/store/useOperationsStore';
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";

// --- Dialogs (Skeletal Components - you need to create these) ---
const CreateRoomDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => <div>Create Room Form/Dialog</div>;
const EditRoomDialog = ({ room, isOpen, onClose }: { room: RoomDetails | null, isOpen: boolean, onClose: () => void }) => <div>Edit Room Form/Dialog for {room?.roomNumber}</div>;
const AssignCleanerDialog = ({ room, isOpen, onClose }: { room: RoomDetails | null, isOpen: boolean, onClose: () => void }) => <div>Assign Cleaner Form/Dialog for {room?.roomNumber}</div>;
// --- End Dialogs ---


const useUserHotelContext = () => {
    const { user } = useAuthStore();
    const hotelId = user?.hotelId || '';
    const token = user?.token || '';
    return { hotelId, token };
};

export default function RoomAdmin() {
    const { hotelId, token } = useUserHotelContext();
    const { 
        allRoomDetails, 
        fetchRoomDetails, 
        deleteRoom, 
        isSubmitting, 
        error,
        connectSocket, 
        disconnectSocket 
    } = useOperationsStore();
    
    // State for Dialogs
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isAssignCleanerOpen, setIsAssignCleanerOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<RoomDetails | null>(null);

    const context = { hotelId, token };

    // --- Data Fetching & Real-Time Connection ---
    useEffect(() => {
        if (hotelId && token) {
            fetchRoomDetails(context);
            connectSocket(hotelId); // Connect to Socket.IO when component mounts
        }
        return () => {
            disconnectSocket(); // Disconnect when component unmounts
        };
    }, [hotelId, token, connectSocket, disconnectSocket, fetchRoomDetails]);
    // --- End Data Fetching & Real-Time Connection ---


    const handleDelete = async (roomId: string) => {
        if (window.confirm("Are you sure you want to permanently delete this room and its images?")) {
            await deleteRoom(roomId, context);
        }
    };

    const handleEdit = (room: RoomDetails) => {
        setSelectedRoom(room);
        setIsEditOpen(true);
    };

    const handleAssignCleaner = (room: RoomDetails) => {
        setSelectedRoom(room);
        setIsAssignCleanerOpen(true);
    };

    const handleRefresh = () => fetchRoomDetails(context);

    // --- Filter Rooms by hotelId (if not already done by backend fetch) ---
    // Note: The store already filters, but this handles the case where the admin might see other hotel data.
    const roomsToDisplay = allRoomDetails.filter(room => room.hotelId === hotelId);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Room & Housekeeping Management</h1>
                <div className="flex space-x-2">
                    <Button onClick={handleRefresh} disabled={isSubmitting} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)} disabled={isSubmitting}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Room
                    </Button>
                </div>
            </header>

            {error && (
                <div className="p-4 text-center text-destructive border border-destructive rounded-lg bg-red-50">
                    <AlertTriangle className="h-5 w-5 inline mr-2" />
                    Management Error: **{error}**
                </div>
            )}
            
            <Card>
                <CardHeader>
                    <CardTitle>Hotel Room Inventory ({roomsToDisplay.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Room No</TableHead>
                                <TableHead>Name/Type</TableHead>
                                <TableHead>Price (₦)</TableHead>
                                <TableHead>Capacity</TableHead>
                                <TableHead>Availability</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {roomsToDisplay.map((room) => (
                                <TableRow key={room._id}>
                                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                                    <TableCell>{room.name}</TableCell>
                                    <TableCell>{room.price.toLocaleString()}</TableCell>
                                    <TableCell>{room.capacity}</TableCell>
                                    <TableCell>
                                        <Badge variant={room.isAvailable ? "default" : "secondary"}>
                                            {room.isAvailable ? "Available" : "Hidden"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button 
                                            variant="secondary" 
                                            size="sm" 
                                            onClick={() => handleAssignCleaner(room)}
                                            title="Assign Cleaner"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEdit(room)}
                                            title="Edit Room Details/Images"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => handleDelete(room._id)}
                                            disabled={isSubmitting}
                                            title="Delete Room"
                                        >
                                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Skeletal Dialogs/Modals */}
            <CreateRoomDialog 
                isOpen={isCreateOpen} 
                onClose={() => setIsCreateOpen(false)} 
            />
            <EditRoomDialog 
                room={selectedRoom} 
                isOpen={isEditOpen} 
                onClose={() => setIsEditOpen(false)} 
            />
            <AssignCleanerDialog 
                room={selectedRoom} 
                isOpen={isAssignCleanerOpen} 
                onClose={() => setIsAssignCleanerOpen(false)} 
            />
        </div>
    );
}