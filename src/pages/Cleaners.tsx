import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  CalendarIcon, 
  Bed, 
  Timer,
  Building2,
  RefreshCw 
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useCleaningStore } from "@/store/useCleaningStore"; // (1)

interface UnassignedRoomCardProps {
  room: any;
  onAssign: (roomId: string, cleanerId: string, notes: string) => void;
  cleaners: any[];
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
          {room.branchId && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{room.branchId.name}</span>
            </div>
          )}
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
  const getStatusBadge = () => {
    switch (task.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Room {task.roomId.roomNumber}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{task.roomId.roomTypeId.name}</span>
          </div>
          
          {task.roomId.branchId && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>{task.roomId.branchId.name}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{task.assignedCleaner.firstName} {task.assignedCleaner.lastName}</span>
          </div>

          {task.estimatedDuration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>Estimated: {task.estimatedDuration}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Assigned {formatDistanceToNow(new Date(task.createdAt))} ago</span>
          </div>

          {task.status === 'in-progress' && task.startTime && (
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-200">
              <Clock className="h-4 w-4" />
              <span>Started {formatDistanceToNow(new Date(task.startTime))} ago</span>
            </div>
          )}

          {task.status === 'completed' && task.actualDuration !== undefined && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
              <CheckCircle className="h-4 w-4" />
              <span>Completed in {task.actualDuration} minutes</span>
            </div>
          )}

          {task.status === 'completed' && task.finishTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>Finished {formatDistanceToNow(new Date(task.finishTime))} ago</span>
            </div>
          )}

          {task.notes && (
            <div className="flex items-start gap-2 text-sm p-2 bg-blue-50 rounded-md border border-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">{task.notes}</span>
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

export default function Cleaners() {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const {
    cleaningRooms,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    cleaners,
    branches,
    selectedBranchId,
    isLoading,
    fetchBranches,
    fetchCleaningRooms,
    fetchAllRequests,
    fetchCleaners,
    assignCleaner,
    setSelectedBranch,
  } = useCleaningStore();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchBranches(),
        fetchCleaningRooms(),
        fetchAllRequests(),
        fetchCleaners(),
      ]);
    };
    loadData();
  }, [fetchBranches, fetchCleaningRooms, fetchAllRequests, fetchCleaners]);

  const unassignedRooms = useMemo(
    () =>
      cleaningRooms.filter(
        (room) => !pendingTasks.some((task) => task.roomId._id === room._id) &&
                  !inProgressTasks.some((task) => task.roomId._id === room._id)
      ),
    [cleaningRooms, pendingTasks, inProgressTasks]
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
    { label: "Pending", value: pendingTasks.length, color: "text-yellow-600" },
    { label: "In Progress", value: inProgressTasks.length, color: "text-info" },
    { label: "Completed", value: filteredCompletedTasks.length, color: "text-success" },
  ];

  const handleBranchChange = (branchId: string) => {
    if (branchId === "all") {
      setSelectedBranch(null);
    } else {
      setSelectedBranch(branchId);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchCleaningRooms(),
      fetchAllRequests(),
      fetchCleaners(),
    ]);
    toast.success('Data refreshed');
  };

  if (isLoading && cleaningRooms.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Cleaning Management</h1>
        <p className="text-muted-foreground">Manage cleaning assignments across all branches</p>
      </div>

      {/* Branch Selector & Refresh */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-xs">
          <label className="text-sm font-medium block mb-2">Filter by Branch</label>
          <Select 
            value={selectedBranchId || "all"} 
            onValueChange={handleBranchChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch._id} value={branch._id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-shrink-0 mt-6">
          <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unassigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unassigned">
            Unassigned ({unassignedRooms.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({filteredCompletedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* Unassigned Tab */}
        <TabsContent value="unassigned" className="space-y-4">
          {unassignedRooms.length === 0 ? (
            <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-2">
                    No unassigned cleaning rooms.
                  </p>
                </CardContent>
              </Card>
            </div>
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

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingTasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-2">
                    No pending tasks.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* In Progress Tab */}
        <TabsContent value="in-progress" className="space-y-4">
          {inProgressTasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-2">
                    No tasks in progress.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed Tab */}
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
            <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-2">
                    No completed tasks match the filter.
                  </p>
                </CardContent>
              </Card>
            </div>
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