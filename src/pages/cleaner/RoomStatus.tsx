import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, CheckCircle, AlertTriangle, Search, Bed, Clock, User, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { useRoomStatusStore, RoomStatus as RoomStatusType, CleaningRequest } from "@/store/useRoomStatusStore";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDistanceToNow } from "date-fns";

export default function RoomStatus() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuthStore();
  const {
    rooms,
    cleaningRequests,
    isLoading,
    error,
    fetchAllRooms,
    fetchCleaningRequests,
    acceptCleaningRequest,
    updateRoomStatus,
  } = useRoomStatusStore();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchAllRooms(),
        fetchCleaningRequests(),
      ]);
    };
    loadData();
  }, [fetchAllRooms, fetchCleaningRequests]);

  // Combine room data with cleaning request data
  const roomsWithRequests = useMemo(() => {
    return rooms.map(room => {
      const activeRequest = cleaningRequests.find(
        req => req.roomId._id === room._id && req.status !== 'completed'
      );
      return {
        ...room,
        cleaningRequest: activeRequest,
        hasActiveRequest: !!activeRequest,
      };
    });
  }, [rooms, cleaningRequests]);

  // Filter rooms based on search
  const filteredRooms = roomsWithRequests.filter(room =>
    room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.roomTypeId.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAcceptRequest = async (requestId: string, roomNumber: string) => {
    try {
      await acceptCleaningRequest(requestId);
      toast.success(`Accepted cleaning request for Room ${roomNumber}`);
    } catch (error) {
      toast.error("Failed to accept cleaning request");
    }
  };

  const handleMarkAsClean = async (roomId: string, roomNumber: string) => {
    try {
      await updateRoomStatus(roomId, 'available');
      toast.success(`Room ${roomNumber} marked as clean`);
    } catch (error) {
      toast.error("Failed to update room status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      case "cleaning": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
      case "occupied": return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
      case "maintenance": return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200";
      case "out-of-service": return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700";
      case "in-progress": return "bg-blue-100 text-blue-700";
      case "pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string, hasRequest: boolean) => {
    if (hasRequest) {
      return <Sparkles className="h-8 w-8 text-yellow-500" />;
    }
    
    switch (status) {
      case "available": return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "cleaning": return <Sparkles className="h-8 w-8 text-yellow-500" />;
      case "occupied": return <User className="h-8 w-8 text-blue-500" />;
      case "maintenance": return <AlertTriangle className="h-8 w-8 text-orange-500" />;
      case "out-of-service": return <AlertTriangle className="h-8 w-8 text-red-500" />;
      default: return <Bed className="h-8 w-8" />;
    }
  };

  const stats = {
    available: rooms.filter(r => r.status === "available").length,
    cleaning: rooms.filter(r => r.status === "cleaning").length,
    occupied: rooms.filter(r => r.status === "occupied").length,
    pendingRequests: cleaningRequests.filter(r => r.status === "pending").length,
  };

  const isCleaner = user?.role === 'cleaner';

  if (isLoading && rooms.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Room Status</h1>
        <p className="text-muted-foreground">Monitor and manage room cleaning status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Available Rooms</p>
            <p className="text-3xl font-bold text-green-600">{stats.available}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cleaning</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.cleaning}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Occupied</p>
            <p className="text-3xl font-bold text-blue-600">{stats.occupied}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Requests</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pendingRequests}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room number, status, or room type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => {
          const request = room.cleaningRequest;
          const canAccept = isCleaner && request?.status === 'pending' && !request?.assignedCleaner;
          const isAssignedToMe = request?.assignedCleaner?._id === user?._id;

          return (
            <Card key={room._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
                  <Badge className={getStatusColor(room.status)}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center p-4">
                  {getStatusIcon(room.status, room.hasActiveRequest)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Room Type:</span>
                    <span className="font-medium">{room.roomTypeId.name}</span>
                  </div>
                  
                  {room.floor && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Floor:</span>
                      <span className="font-medium">{room.floor}</span>
                    </div>
                  )}

                  {/* Show cleaning request info if available */}
                  {request && (
                    <>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-muted-foreground font-medium">Cleaning Request:</span>
                          <Badge className={getRequestStatusColor(request.status)}>
                            {request.status === 'in-progress' ? 'In Progress' : 
                             request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <User className="h-3 w-3" />
                          <span>Requested by: {request.requestedBy.firstName} {request.requestedBy.lastName}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDistanceToNow(new Date(request.createdAt))} ago</span>
                        </div>

                        {request.assignedCleaner && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <User className="h-3 w-3" />
                            <span>Assigned to: {request.assignedCleaner.firstName} {request.assignedCleaner.lastName}</span>
                          </div>
                        )}

                        {request.notes && (
                          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded-md mt-2">
                            <span className="font-medium">Notes:</span> {request.notes}
                          </div>
                        )}

                        {request.priority && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-muted-foreground">Priority:</span>
                            <Badge variant="outline" className={
                              request.priority === 'High' ? 'border-red-200 text-red-700' :
                              request.priority === 'Medium' ? 'border-yellow-200 text-yellow-700' :
                              'border-green-200 text-green-700'
                            }>
                              {request.priority}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons based on role and status */}
                <div className="space-y-2">
                  {canAccept && (
                    <Button
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleAcceptRequest(request._id, room.roomNumber)}
                    >
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Accept & Start Cleaning
                    </Button>
                  )}

                  {isAssignedToMe && request?.status === 'in-progress' && (
                    <Button
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleMarkAsClean(room._id, room.roomNumber)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Clean
                    </Button>
                  )}

                  {!request && room.status === 'cleaning' && isCleaner && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleMarkAsClean(room._id, room.roomNumber)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Clean
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-10 text-muted-foreground">
          No rooms found matching your search.
        </div>
      )}
    </div>
  );
}