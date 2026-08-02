import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Clock, CheckCircle, MapPin, AlertCircle, Loader2, Calendar, X, Building2, User as UserIcon, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useHousekeeperStore, CleaningTask } from "@/store/useHousekeeperStore";
import { formatDistanceToNow } from "date-fns";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  checkout: "Guest Checkout",
  "guest-request": "Guest Cleaning Request",
  "staff-request": "Receptionist Request",
  manual: "Manual",
};

// Room is populated identically whether it came from roomId (legacy) or
// roomUnitId (v2/category model) — exactly one of the pair is ever set.
const getTaskRoom = (task: CleaningTask) => task.roomId ?? task.roomUnitId ?? null;
const getTaskCategory = (task: CleaningTask) =>
  getTaskRoom(task)?.roomTypeId?.categoryTag || getTaskRoom(task)?.roomTypeId?.name || "Unknown category";
const getTaskBranch = (task: CleaningTask) =>
  typeof task.hotelId === "object" ? task.hotelId?.name : undefined;

export default function CleaningTasks() {
  const {
    tasks,
    unassignedTasks,
    isLoading,
    error,
    fetchMyTasks,
    fetchUnassignedTasks,
    acceptTask,
    startTask,
    completeTask,
    initSocketListeners,
    closeSocketListeners,
  } = useHousekeeperStore();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyTasks();
    fetchUnassignedTasks();
  }, [fetchMyTasks, fetchUnassignedTasks]);

  // Live task updates (new checkout/guest-request tasks assigned to this
  // cleaner, status changes from other sessions) — without this, the page
  // was fetch-on-mount only and needed a manual reload to show anything new.
  useEffect(() => {
    initSocketListeners();
    return () => closeSocketListeners();
  }, [initSocketListeners, closeSocketListeners]);

  const handleStartTask = async (taskId: string) => {
    try {
      await startTask(taskId);
      toast.success("Task started successfully");
    } catch (error) {
      toast.error("Failed to start task");
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      toast.success("Task completed successfully");
    } catch (error) {
      toast.error("Failed to complete task");
    }
  };

  const handleAcceptTask = async (taskId: string, roomNumber: string) => {
    setAcceptingId(taskId);
    try {
      await acceptTask(taskId);
      toast.success(`Accepted cleaning request for Room ${roomNumber}`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to accept task — it may already be taken");
    } finally {
      setAcceptingId(null);
    }
  };

  // Filter tasks by date range + priority/category/request-type — applied
  // uniformly under every status tab below.
  const filterTasksByDate = (taskList: CleaningTask[]) => {
    return taskList.filter(task => {
      if (startDate || endDate) {
        const taskDate = new Date(task.createdAt);
        taskDate.setHours(0, 0, 0, 0);
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (taskDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (taskDate > end) return false;
        }
      }
      if (priorityFilter !== "all" && (task.priority || "Medium") !== priorityFilter) return false;
      if (categoryFilter !== "all" && getTaskCategory(task) !== categoryFilter) return false;
      if (requestTypeFilter !== "all" && (task.requestType || "manual") !== requestTypeFilter) return false;
      return true;
    });
  };

  const availableCategories = Array.from(new Set(tasks.map(getTaskCategory))).sort();

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setRequestTypeFilter("all");
  };

  const getPriorityColor = (priority: string = "Medium") => {
    switch (priority) {
      case "High": return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      case "Medium": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
      case "Low": return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-700 border-green-200";
      case "in-progress": return "bg-blue-100 text-blue-700 border-blue-200"; // Fixed: hyphen
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Unassigned pool cards use a distinct "Accept Task" action instead of
  // Start/Complete — an unassigned request has no assignedCleaner yet, so
  // /start would 403 until it's accepted first.
  const renderUnassignedCard = (task: CleaningTask) => {
    const priority = task.priority || "Medium";
    const room = getTaskRoom(task);
    const branch = getTaskBranch(task);
    const requestType = task.requestType || "manual";
    const guestName = task.bookingId?.guestName;

    return (
      <Card key={task._id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-400">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Room {room?.roomNumber ?? 'N/A'}</CardTitle>
            <Badge variant="outline" className={getPriorityColor(priority)}>
              {priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{getTaskCategory(task)}</span>
            </div>

            {branch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{branch}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              <span>{REQUEST_TYPE_LABELS[requestType] || requestType}</span>
            </div>

            {guestName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>Guest: {guestName}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Posted {formatDistanceToNow(new Date(task.createdAt))} ago</span>
            </div>

            {task.notes && (
              <div className="flex items-start gap-2 text-sm p-2 bg-blue-50 rounded-md border border-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-blue-700">{task.notes}</span>
              </div>
            )}
          </div>

          <Button
            size="sm"
            className="w-full"
            disabled={acceptingId === task._id}
            onClick={() => handleAcceptTask(task._id, room?.roomNumber ?? 'N/A')}
          >
            {acceptingId === task._id ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Accept Task
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderTaskCard = (task: CleaningTask) => {
    // Normalize status for display
    const displayStatus = task.status === 'in-progress' ? 'In Progress' : 
                          task.status.charAt(0).toUpperCase() + task.status.slice(1);

    const priority = task.priority || "Medium";
    const room = getTaskRoom(task);
    const branch = getTaskBranch(task);
    const requestType = task.requestType || "manual";
    const guestName = task.bookingId?.guestName;

    return (
      <Card key={task._id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Room {room?.roomNumber ?? 'N/A'}</CardTitle>
            <Badge variant="outline" className={getPriorityColor(priority)}>
              {priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{getTaskCategory(task)}</span>
            </div>

            {branch && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>{branch}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              <span>{REQUEST_TYPE_LABELS[requestType] || requestType}</span>
            </div>

            {guestName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>Guest: {guestName}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Requested by: {task.requestedBy?.firstName} {task.requestedBy?.lastName}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Posted {formatDistanceToNow(new Date(task.createdAt))} ago</span>
            </div>

            {task.estimatedDuration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Estimated Duration: {task.estimatedDuration}</span>
              </div>
            )}

            {task.status === 'in-progress' && task.startTime && (
              <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-200">
                <Clock className="h-4 w-4" />
                <span>Started {formatDistanceToNow(new Date(task.startTime))} ago</span>
              </div>
            )}

            {task.status === 'completed' && task.actualDuration && (
              <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
                <CheckCircle className="h-4 w-4" />
                <span>Completed in {task.actualDuration} minutes</span>
              </div>
            )}

            {task.notes && (
              <div className="flex items-start gap-2 text-sm p-2 bg-blue-50 rounded-md border border-blue-100">
                <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-blue-700">{task.notes}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getStatusColor(task.status)}>
              {displayStatus}
            </Badge>
          </div>

          <div className="flex gap-2 pt-2">
            {task.status === "pending" && (
              <Button
                size="sm"
                className="flex-1"
                onClick={() => handleStartTask(task._id)}
              >
                Start Task
              </Button>
            )}
            {task.status === "in-progress" && (
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleCompleteTask(task._id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Complete
              </Button>
            )}
             {task.status === "completed" && (
              <Button size="sm" variant="outline" className="flex-1" disabled>
                Completed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Fixed: Filter using 'in-progress' with hyphen, then apply date filter
  const filteredTasks = filterTasksByDate(tasks);
  const filteredUnassigned = filterTasksByDate(unassignedTasks);
  const pendingTasks = filterTasksByDate(tasks.filter(t => t.status === "pending"));
  const inProgressTasks = filterTasksByDate(tasks.filter(t => t.status === "in-progress"));
  const completedTasks = filterTasksByDate(tasks.filter(t => t.status === "completed"));

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-md" />
          
          {/* Task Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Cleaning Tasks</h1>
        <p className="text-muted-foreground">Manage your assigned cleaning requests</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Room Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Request Type</Label>
              <Select value={requestTypeFilter} onValueChange={setRequestTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="checkout">Guest Checkout</SelectItem>
                  <SelectItem value="guest-request">Guest Cleaning Request</SelectItem>
                  <SelectItem value="staff-request">Receptionist Request</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || undefined}
              />
            </div>
            {(startDate || endDate || priorityFilter !== "all" || categoryFilter !== "all" || requestTypeFilter !== "all") && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
          {(startDate || endDate) && (
            <p className="text-sm text-muted-foreground mt-3">
              Showing tasks {startDate && `from ${new Date(startDate).toLocaleDateString()}`}
              {startDate && endDate && " "}
              {endDate && `to ${new Date(endDate).toLocaleDateString()}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Unassigned (Available)</p>
            <p className="text-3xl font-bold text-orange-600">{filteredUnassigned.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">In Progress</p>
            <p className="text-3xl font-bold text-blue-600">{inProgressTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedTasks.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="unassigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unassigned">Unassigned ({filteredUnassigned.length})</TabsTrigger>
          <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="unassigned" className="space-y-4">
          {filteredUnassigned.length === 0 ? (
            <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-2">
                    No unassigned cleaning requests available to accept.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUnassigned.map(renderUnassignedCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">
                    {(startDate || endDate) ? "No Tasks Found" : "All Caught Up!"}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {(startDate || endDate)
                      ? "No cleaning tasks found for the selected date range."
                      : "No cleaning tasks assigned to you."}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>

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
                    No pending cleaning tasks.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {inProgressTasks.length === 0 ? (
           <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-2">
                    No in-progress cleaning tasks.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedTasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center h-[50vh]">
              <Card className="w-full max-w-md border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg">All Caught Up!</h3>
                  <p className="text-muted-foreground mt-2">
                    No completed cleaning tasks.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}