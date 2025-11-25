import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, CheckCircle, AlertCircle, User, Edit, CalendarIcon, Bed } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useHousekeepingStore } from "@/store/useHousekeepingStore"; // Adjust path

interface UnassignedRoomCardProps {
  room: any; // CleaningRoom
  onAssign: (roomId: string, cleanerId: string, notes: string) => void;
  cleaners: any[]; // Cleaner[]
}

const UnassignedRoomCard: React.FC<UnassignedRoomCardProps> = ({ room, onAssign, cleaners }) => {
  const [selectedCleanerId, setSelectedCleanerId] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Room {room.roomNumber}</CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Needs Assignment
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{room.roomTypeId.name}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Assign Cleaner</label>
          <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a cleaner" />
            </SelectTrigger>
            <SelectContent>
              {cleaners.map((cleaner) => (
                <SelectItem key={cleaner._id} value={cleaner._id}>
                  {cleaner.firstName} {cleaner.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Notes (optional)</label>
          <Textarea
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>
        <Button
          size="sm"
          className="w-full"
          onClick={() => {
            if (!selectedCleanerId) {
              toast.error("Please select a cleaner");
              return;
            }
            onAssign(room._id, selectedCleanerId, notes);
            setSelectedCleanerId("");
            setNotes("");
          }}
          disabled={!selectedCleanerId}
        >
          <User className="h-4 w-4 mr-2" />
          Assign Cleaner
        </Button>
      </CardContent>
    </Card>
  );
};

const AssignedTaskCard: React.FC<{ task: any }> = ({ task }) => {
  const startTime = new Date(task.createdAt).toLocaleString();
  const finishTime = task.status === "completed" ? new Date(task.updatedAt).toLocaleString() : "N/A";

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Room {task.roomId.roomNumber}</CardTitle>
          <Badge className="bg-blue-100 text-blue-800">Assigned</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{task.roomId.roomTypeId.name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{task.assignedCleaner.firstName} {task.assignedCleaner.lastName}</span>

          </div>
          {task.notes && (
            <div className="flex items-start gap-2 text-sm p-2 bg-info/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-info mt-0.5" />
              <span className="text-info">{task.notes}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Start: {startTime}</span>
          </div>
          {finishTime !== "N/A" && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Finish: {finishTime}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const DatePicker = ({
  date,
  setDate,
}: {
  date?: Date;
  setDate: (date?: Date) => void;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-[280px] justify-start text-left font-normal ${
            !date && "text-muted-foreground"
          }`}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

const LoadingSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-6 w-20" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function Housekeeping() {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const {
    cleaningRooms,
    pendingTasks,
    completedTasks,
    cleaners,
    fetchCleaningRooms,
    fetchAllRequests,
    fetchCleaners,
    assignCleaner,
  } = useHousekeepingStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchCleaningRooms(),
        fetchAllRequests(),
        fetchCleaners(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchCleaningRooms, fetchAllRequests, fetchCleaners]);

  const unassignedRooms = useMemo(
    () =>
      cleaningRooms.filter(
        (room) => !pendingTasks.some((task) => task.roomId._id === room._id)
      ),
    [cleaningRooms, pendingTasks]
  );

  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter((task) => {
      const taskDate = new Date(task.updatedAt);
      if (fromDate && taskDate < fromDate) return false;
      if (toDate && taskDate > toDate) return false;
      return true;
    });
  }, [completedTasks, fromDate, toDate]);

  const stats = [
    { label: "Rooms Needing Cleaning", value: cleaningRooms.length, color: "text-warning" },
    { label: "Assigned", value: pendingTasks.length, color: "text-info" },
    { label: "Completed", value: filteredCompletedTasks.length, color: "text-success" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((_, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-96" />
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Housekeeping Management</h1>
        <p className="text-muted-foreground">Manage cleaning assignments for your branch</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="unassigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unassigned">
            Unassigned ({unassignedRooms.length})
          </TabsTrigger>
          <TabsTrigger value="assigned">Assigned ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filteredCompletedTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="unassigned" className="space-y-4">
          {unassignedRooms.length === 0 ? (
            <p className="text-muted-foreground">No unassigned cleaning rooms.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unassignedRooms.map((room) => (
                <UnassignedRoomCard
                  key={room._id}
                  room={room}
                  cleaners={cleaners}
                  onAssign={assignCleaner}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="assigned" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingTasks.map((task) => (
              <AssignedTaskCard key={task._id} task={task} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-1">From Date</label>
              <DatePicker date={fromDate} setDate={setFromDate} />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium block mb-1">To Date</label>
              <DatePicker date={toDate} setDate={setToDate} />
            </div>
          </div>
          {filteredCompletedTasks.length === 0 ? (
            <p className="text-muted-foreground">No completed tasks match the filter.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompletedTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}