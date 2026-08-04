import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, CheckCircle, AlertCircle, User, Edit, CalendarIcon, Bed, Timer, Building2, ClipboardList, Ban } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format, formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { useHousekeepingStore, type CleaningRequest } from "@/store/useHousekeepingStore";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  checkout: "Guest Checkout",
  "guest-request": "Guest Cleaning Request",
  "staff-request": "Receptionist Request",
  manual: "Manual",
};

// Room is populated identically whether it came from roomId (legacy) or
// roomUnitId (v2/category model) — exactly one of the pair is ever set.
const getRequestRoom = (r: CleaningRequest) => r.roomId ?? r.roomUnitId ?? null;
const getRequestCategory = (r: CleaningRequest) =>
  getRequestRoom(r)?.roomTypeId?.categoryTag || getRequestRoom(r)?.roomTypeId?.name || "Unknown category";
const getRequestBranch = (r: CleaningRequest) =>
  typeof r.hotelId === "object" ? r.hotelId?.name : undefined;

// Authorized staff (receptionist/branch manager/superadmin — this page is
// reachable by all three) explicitly cancelling a housekeeping request:
// removes it from the cleaner's list, notifies them, records an audit entry
// (if linked to a booking), and leaves the booking itself untouched.
const CancelRequestButton: React.FC<{ requestId: string; roomNumber?: string }> = ({ requestId, roomNumber }) => {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const cancelCleaningRequest = useHousekeepingStore((s) => s.cancelCleaningRequest);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
          <Ban className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel housekeeping request?</AlertDialogTitle>
          <AlertDialogDescription>
            {roomNumber ? `Room ${roomNumber}'s` : "This"} cleaning request will be removed from the cleaner's task
            list. The guest's booking is not affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1 py-2">
          <label className="text-sm font-medium">Reason (optional)</label>
          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Guest withdrew the request"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason("")}>Keep Request</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              cancelCleaningRequest(requestId, reason || undefined);
              setReason("");
            }}
          >
            Cancel Request
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface UnassignedRoomCardProps {
  request: CleaningRequest;
  onAssign: (requestId: string, cleanerId: string) => void;
  cleaners: any[]; // Cleaner[]
}

const UnassignedRoomCard: React.FC<UnassignedRoomCardProps> = ({ request, onAssign, cleaners }) => {
  const [selectedCleanerId, setSelectedCleanerId] = useState("");
  const room = getRequestRoom(request);
  const branch = getRequestBranch(request);
  const requestType = request.requestType || "manual";
  const guestName = request.bookingId?.guestName;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Room {room?.roomNumber ?? 'N/A'}</CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Needs Assignment
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{getRequestCategory(request)}</span>
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
              <User className="h-4 w-4" />
              <span>Guest: {guestName}</span>
            </div>
          )}
          {requestType === "checkout" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Checked out {formatDistanceToNow(new Date(request.createdAt))} ago</span>
            </div>
          )}
          {request.notes && (
            <div className="flex items-start gap-2 text-sm p-2 bg-blue-50 rounded-md border border-blue-100">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <span className="text-blue-700">{request.notes}</span>
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
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              if (!selectedCleanerId) {
                toast.error("Please select a cleaner");
                return;
              }
              onAssign(request._id, selectedCleanerId);
              setSelectedCleanerId("");
            }}
            disabled={!selectedCleanerId}
          >
            <User className="h-4 w-4 mr-2" />
            Assign Cleaner
          </Button>
          <CancelRequestButton requestId={request._id} roomNumber={room?.roomNumber} />
        </div>
      </CardContent>
    </Card>
  );
};

const AssignedTaskCard: React.FC<{ task: CleaningRequest }> = ({ task }) => {
  const room = getRequestRoom(task);
  const branch = getRequestBranch(task);
  const requestType = task.requestType || "manual";
  const guestName = task.bookingId?.guestName;

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
          <CardTitle className="text-lg">Room {room?.roomNumber ?? 'N/A'}</CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Bed className="h-4 w-4 text-muted-foreground" />
            <span>{getRequestCategory(task)}</span>
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
              <User className="h-4 w-4" />
              <span>Guest: {guestName}</span>
            </div>
          )}
          {task.priority && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Priority: {task.priority}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{task.assignedCleaner?.firstName} {task.assignedCleaner?.lastName}</span>
          </div>

          {/* Estimated Duration */}
          {task.estimatedDuration && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>Estimated: {task.estimatedDuration}</span>
            </div>
          )}

          {/* Checkout-triggered tasks are created at the exact moment of
              checkout (inside the same transaction) — createdAt IS the
              checkout time for these; label it accordingly. */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{requestType === "checkout" ? "Checked out" : "Assigned"} {formatDistanceToNow(new Date(task.createdAt))} ago</span>
          </div>

          {/* Time when task was started (for in-progress tasks) */}
          {task.status === 'in-progress' && task.startTime && (
            <div className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-200">
              <Clock className="h-4 w-4" />
              <span>Started {formatDistanceToNow(new Date(task.startTime))} ago</span>
            </div>
          )}

          {/* Actual duration for completed tasks */}
          {task.status === 'completed' && task.actualDuration !== undefined && (
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-2 rounded-md border border-green-200">
              <CheckCircle className="h-4 w-4" />
              <span>Completed in {task.actualDuration} minutes</span>
            </div>
          )}

          {/* Completion time for completed tasks */}
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
        {(task.status === "pending" || task.status === "in-progress") && (
          <CancelRequestButton requestId={task._id} roomNumber={room?.roomNumber} />
        )}
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
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [requestTypeFilter, setRequestTypeFilter] = useState<string>("all");

  const {
    unassignedRequests,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    allRequests,
    cleaners,
    fetchUnassignedRequests,
    fetchAllRequests,
    fetchCleaners,
    assignCleanerToRequest,
    initSocketListeners,
    closeSocketListeners,
  } = useHousekeepingStore();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchUnassignedRequests(),
        fetchAllRequests(),
        fetchCleaners(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchUnassignedRequests, fetchAllRequests, fetchCleaners]);

  // Live updates (new checkout/guest-request tasks, status changes from
  // other sessions) — without this the board was fetch-on-mount only.
  useEffect(() => {
    initSocketListeners();
    return () => closeSocketListeners();
  }, [initSocketListeners, closeSocketListeners]);

  const availableCategories = useMemo(
    () => Array.from(new Set(allRequests.map(getRequestCategory))).sort(),
    [allRequests]
  );

  const matchesFilters = (task: CleaningRequest) => {
    if (priorityFilter !== "all" && (task.priority || "Medium") !== priorityFilter) return false;
    if (categoryFilter !== "all" && getRequestCategory(task) !== categoryFilter) return false;
    if (requestTypeFilter !== "all" && (task.requestType || "manual") !== requestTypeFilter) return false;
    return true;
  };

  const filteredUnassigned = useMemo(() => unassignedRequests.filter(matchesFilters), [unassignedRequests, priorityFilter, categoryFilter, requestTypeFilter]);
  const actualPendingTasks = useMemo(() => pendingTasks.filter(matchesFilters), [pendingTasks, priorityFilter, categoryFilter, requestTypeFilter]);
  const filteredInProgressTasks = useMemo(() => inProgressTasks.filter(matchesFilters), [inProgressTasks, priorityFilter, categoryFilter, requestTypeFilter]);

  const filteredCompletedTasks = useMemo(() => {
    return completedTasks.filter((task) => {
      if (!matchesFilters(task)) return false;
      const taskDate = new Date(task.updatedAt);
      if (fromDate && taskDate < fromDate) return false;
      if (toDate && taskDate > toDate) return false;
      return true;
    });
  }, [completedTasks, fromDate, toDate, priorityFilter, categoryFilter, requestTypeFilter]);

  const stats = [
    { label: "Rooms Needing Cleaning", value: unassignedRequests.length, color: "text-warning" },
    { label: "Assigned", value: pendingTasks.length + inProgressTasks.length, color: "text-info" },
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
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Priority</label>
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
            <label className="text-sm font-medium block mb-1">Room Category</label>
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
            <label className="text-sm font-medium block mb-1">Request Type</label>
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
        </CardContent>
      </Card>
      <Tabs defaultValue="unassigned" className="space-y-4">
        <TabsList>
          <TabsTrigger value="unassigned">
            Unassigned ({filteredUnassigned.length})
          </TabsTrigger>
          <TabsTrigger value="pending">Pending ({actualPendingTasks.length})</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress ({filteredInProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({filteredCompletedTasks.length})</TabsTrigger>
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
                    No unassigned cleaning requests.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUnassigned.map((request) => (
                <UnassignedRoomCard
                  key={request._id}
                  request={request}
                  cleaners={cleaners}
                  onAssign={assignCleanerToRequest}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="space-y-4">
          {actualPendingTasks.length === 0 ? (
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
              {actualPendingTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="in-progress" className="space-y-4">
          {filteredInProgressTasks.length === 0 ? (
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
              {filteredInProgressTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} />
              ))}
            </div>
          )}
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