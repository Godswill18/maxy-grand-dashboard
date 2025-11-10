import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, CheckCircle, AlertTriangle, Search, Bed } from "lucide-react";
import { toast } from "sonner";

interface Room {
  number: string;
  floor: number;
  status: "Clean" | "Dirty" | "Inspected" | "Out of Service";
  lastCleaned?: string;
  nextScheduled?: string;
  guestStatus: "Occupied" | "Vacant" | "Check-out Today";
}

export default function RoomStatus() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rooms, setRooms] = useState<Room[]>([
    { number: "101", floor: 1, status: "Clean", lastCleaned: "Today 8:00 AM", guestStatus: "Vacant" },
    { number: "102", floor: 1, status: "Dirty", guestStatus: "Check-out Today", nextScheduled: "10:00 AM" },
    { number: "103", floor: 1, status: "Inspected", lastCleaned: "Today 9:30 AM", guestStatus: "Vacant" },
    { number: "201", floor: 2, status: "Dirty", guestStatus: "Occupied" },
    { number: "202", floor: 2, status: "Clean", lastCleaned: "Today 7:45 AM", guestStatus: "Occupied" },
    { number: "203", floor: 2, status: "Out of Service", guestStatus: "Vacant" },
    { number: "301", floor: 3, status: "Dirty", guestStatus: "Check-out Today", nextScheduled: "11:00 AM" },
    { number: "302", floor: 3, status: "Clean", lastCleaned: "Yesterday 4:00 PM", guestStatus: "Occupied" },
    { number: "303", floor: 3, status: "Inspected", lastCleaned: "Today 8:30 AM", guestStatus: "Vacant" },
  ]);

  const updateStatus = (roomNumber: string, newStatus: Room["status"]) => {
    setRooms(rooms.map(room =>
      room.number === roomNumber
        ? { ...room, status: newStatus, lastCleaned: newStatus === "Clean" ? "Just now" : room.lastCleaned }
        : room
    ));
    toast.success(`Room ${roomNumber} marked as ${newStatus}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Clean": return "bg-success/10 text-success hover:bg-success/20";
      case "Inspected": return "bg-info/10 text-info hover:bg-info/20";
      case "Dirty": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Out of Service": return "bg-error/10 text-error hover:bg-error/20";
      default: return "";
    }
  };

  const getGuestStatusColor = (status: string) => {
    switch (status) {
      case "Vacant": return "bg-success/10 text-success";
      case "Occupied": return "bg-info/10 text-info";
      case "Check-out Today": return "bg-warning/10 text-warning";
      default: return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Clean": return <CheckCircle className="h-8 w-8 text-success" />;
      case "Inspected": return <CheckCircle className="h-8 w-8 text-info" />;
      case "Dirty": return <Sparkles className="h-8 w-8 text-warning" />;
      case "Out of Service": return <AlertTriangle className="h-8 w-8 text-error" />;
      default: return <Bed className="h-8 w-8" />;
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.guestStatus.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    clean: rooms.filter(r => r.status === "Clean").length,
    dirty: rooms.filter(r => r.status === "Dirty").length,
    inspected: rooms.filter(r => r.status === "Inspected").length,
    outOfService: rooms.filter(r => r.status === "Out of Service").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Room Status</h1>
        <p className="text-muted-foreground">Monitor and update room cleaning status</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Clean Rooms</p>
            <p className="text-3xl font-bold text-success">{stats.clean}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Needs Cleaning</p>
            <p className="text-3xl font-bold text-warning">{stats.dirty}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Inspected</p>
            <p className="text-3xl font-bold text-info">{stats.inspected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Out of Service</p>
            <p className="text-3xl font-bold text-error">{stats.outOfService}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room number, status, or guest status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <Card key={room.number} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Room {room.number}</CardTitle>
                <Badge className={getStatusColor(room.status)}>
                  {room.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center p-4">
                {getStatusIcon(room.status)}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Floor:</span>
                  <span className="font-medium">{room.floor}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Guest Status:</span>
                  <Badge className={getGuestStatusColor(room.guestStatus)}>
                    {room.guestStatus}
                  </Badge>
                </div>
                {room.lastCleaned && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last Cleaned:</span>
                    <span className="font-medium text-xs">{room.lastCleaned}</span>
                  </div>
                )}
                {room.nextScheduled && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Scheduled:</span>
                    <span className="font-medium text-xs">{room.nextScheduled}</span>
                  </div>
                )}
              </div>

              {room.status === "Dirty" && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => updateStatus(room.number, "Clean")}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Clean
                </Button>
              )}
              {room.status === "Clean" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => updateStatus(room.number, "Inspected")}
                >
                  Mark as Inspected
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
