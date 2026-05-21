import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  CalendarIcon,
  Bed,
  Timer,
  Building2,
  RefreshCw,
  Hotel as HotelIcon,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useCleaningStore } from "@/store/useCleaningStore";
import { cn } from "@/lib/utils";

const taskStatusConfig: Record<string, { label: string; badge: string; border: string }> = {
  pending:       { label: "Pending",     badge: "bg-amber-100 text-amber-700 border-amber-200", border: "border-l-amber-400" },
  "in-progress": { label: "In Progress", badge: "bg-blue-100 text-blue-700 border-blue-200",    border: "border-l-blue-400"  },
  completed:     { label: "Completed",   badge: "bg-green-100 text-green-700 border-green-200", border: "border-l-green-400" },
};

// ── Unassigned Room Card ────────────────────────────────────────────────────
interface UnassignedRoomCardProps {
  room: any;
  onAssign: (roomId: string, cleanerId: string, notes: string) => void;
  cleaners: any[];
  showHotelName: boolean;
}

const UnassignedRoomCard: React.FC<UnassignedRoomCardProps> = ({
  room,
  onAssign,
  cleaners,
  showHotelName,
}) => {
  const [selectedCleanerId, setSelectedCleanerId] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <Card className="border-l-4 border-l-orange-400 hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">Room {room.roomNumber}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Bed className="h-3.5 w-3.5 shrink-0" />
              <span>{room.roomTypeId?.name}</span>
              {showHotelName && room.hotelId && (
                <>
                  <span>·</span>
                  <span>{room.hotelId.name}</span>
                </>
              )}
            </div>
          </div>
          <Badge className="bg-orange-100 text-orange-700 border border-orange-200 text-xs shrink-0">
            Unassigned
          </Badge>
        </div>

        <div className="border-t" />

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Assign Cleaner
          </label>
          <Select value={selectedCleanerId} onValueChange={setSelectedCleanerId}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select a cleaner" />
            </SelectTrigger>
            <SelectContent>
              {cleaners.length === 0 ? (
                <SelectItem value="__none__" disabled>
                  No cleaners available
                </SelectItem>
              ) : (
                cleaners.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Notes (optional)
          </label>
          <Textarea
            placeholder="Special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
        </div>

        <Button
          size="sm"
          className="w-full"
          disabled={!selectedCleanerId}
          onClick={() => {
            if (!selectedCleanerId) {
              toast.error("Please select a cleaner");
              return;
            }
            onAssign(room._id, selectedCleanerId, notes);
            setSelectedCleanerId("");
            setNotes("");
          }}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Cleaner
        </Button>
      </CardContent>
    </Card>
  );
};

// ── Assigned Task Card ──────────────────────────────────────────────────────
interface AssignedTaskCardProps {
  task: any;
  showHotelName: boolean;
}

const AssignedTaskCard: React.FC<AssignedTaskCardProps> = ({ task, showHotelName }) => {
  const cfg = taskStatusConfig[task.status] ?? {
    label: task.status,
    badge: "bg-gray-100 text-gray-700 border-gray-200",
    border: "border-l-gray-400",
  };

  const initials =
    (task.assignedCleaner?.firstName?.[0] ?? "") +
    (task.assignedCleaner?.lastName?.[0] ?? "");

  return (
    <Card className={cn("border-l-4 hover:shadow-md transition-shadow", cfg.border)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-foreground">Room {task.roomId?.roomNumber}</h3>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Bed className="h-3.5 w-3.5 shrink-0" />
              <span>{task.roomId?.roomTypeId?.name}</span>
              {task.hotelId && (
                <>
                  <span>·</span>
                  <span>{task.hotelId.name}</span>
                </>
              )}
            </div>
          </div>
          <Badge className={cn("text-xs border shrink-0", cfg.badge)}>{cfg.label}</Badge>
        </div>

        <div className="border-t" />

        {/* Cleaner avatar + name */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary text-xs font-semibold uppercase">
            {initials || <User className="h-4 w-4" />}
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">
              {task.assignedCleaner?.firstName} {task.assignedCleaner?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              Assigned {formatDistanceToNow(new Date(task.createdAt))} ago
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-1.5">
          {task.estimatedDuration && task.status !== "completed" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5 shrink-0" />
              <span>Est. {task.estimatedDuration}</span>
            </div>
          )}

          {task.status === "in-progress" && task.startTime && (
            <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-100">
              <Timer className="h-3.5 w-3.5 shrink-0" />
              <span>Started {formatDistanceToNow(new Date(task.startTime))} ago</span>
            </div>
          )}

          {task.status === "completed" && (
            <div className="grid grid-cols-2 gap-2">
              {task.actualDuration !== undefined && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1.5 rounded-md border border-green-100">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{task.actualDuration} min</span>
                </div>
              )}
              {task.finishTime && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1.5 rounded-md">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Done {formatDistanceToNow(new Date(task.finishTime))} ago</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {task.notes && (
          <div className="flex items-start gap-2 text-xs p-2.5 bg-amber-50 rounded-md border border-amber-100">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <span className="text-amber-700">{task.notes}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ── Date Picker ─────────────────────────────────────────────────────────────
const DatePicker = ({
  date,
  setDate,
  label,
}: {
  date?: Date;
  setDate: (d?: Date) => void;
  label: string;
}) => (
  <div className="flex flex-col gap-1.5 flex-1">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
      {label}
    </label>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal text-sm",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {date ? format(date, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  </div>
);

// ── Empty State ─────────────────────────────────────────────────────────────
const EmptyState = ({ message }: { message: string }) => (
  <Card className="border-dashed bg-muted/20">
    <CardContent className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <CheckCircle className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <h3 className="font-semibold">All Caught Up!</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
      </div>
    </CardContent>
  </Card>
);

// ── Loading Skeleton ────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <Card key={i} className="border-l-4 border-l-muted">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
        </CardContent>
      </Card>
    ))}
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────
export default function Cleaners() {
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const {
    cleaningRooms,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    cleaners,
    hotels,
    viewMode,
    selectedHotelId,
    isLoading,
    fetchHotels,
    fetchCleaningRooms,
    fetchAllRequests,
    fetchCleaners,
    assignCleaner,
    setViewMode,
    setSelectedHotel,
    refreshData,
  } = useCleaningStore();

  const safeHotels = Array.isArray(hotels) ? hotels : [];

  useEffect(() => {
    Promise.all([
      fetchHotels(),
      fetchCleaningRooms(),
      fetchAllRequests(),
      fetchCleaners(),
    ]);
  }, [fetchHotels, fetchCleaningRooms, fetchAllRequests, fetchCleaners]);

  const unassignedRooms = useMemo(
    () =>
      cleaningRooms.filter(
        (room) =>
          !pendingTasks.some((t) => t.roomId?._id === room?._id) &&
          !inProgressTasks.some((t) => t.roomId?._id === room?._id)
      ),
    [cleaningRooms, pendingTasks, inProgressTasks]
  );

  const filteredCompletedTasks = useMemo(
    () =>
      completedTasks.filter((task) => {
        const d = new Date(task.updatedAt);
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      }),
    [completedTasks, fromDate, toDate]
  );

  const handleRefresh = async () => {
    await refreshData();
    toast.success("Data refreshed");
  };

  const handleHotelToggleChange = (value: string) => {
    if (!value) return;
    if (value === "all-hotels") {
      setViewMode("all-hotels");
    } else {
      setViewMode("single-hotel");
      setSelectedHotel(value);
    }
  };

  const selectedHotelName =
    selectedHotelId
      ? safeHotels.find((h) => h._id === selectedHotelId)?.name ?? "selected hotel"
      : "selected hotel";

  const showHotelName = viewMode === "all-hotels";
  const currentToggleValue = viewMode === "all-hotels" ? "all-hotels" : selectedHotelId || "";

  const statCards = [
    {
      label: "Needs Cleaning",
      value: cleaningRooms.length,
      color: "text-orange-600",
      bg: "bg-orange-50",
      icon: <Sparkles className="h-5 w-5 text-orange-500" />,
      border: "border-l-orange-400",
    },
    {
      label: "Pending",
      value: pendingTasks.length,
      color: "text-amber-600",
      bg: "bg-amber-50",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      border: "border-l-amber-400",
    },
    {
      label: "In Progress",
      value: inProgressTasks.length,
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: <Timer className="h-5 w-5 text-blue-500" />,
      border: "border-l-blue-400",
    },
    {
      label: "Completed",
      value: filteredCompletedTasks.length,
      color: "text-green-600",
      bg: "bg-green-50",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      border: "border-l-green-400",
    },
  ];

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading && cleaningRooms.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Cleaning Management
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {viewMode === "all-hotels"
              ? "Managing all hotel branches"
              : `Managing ${selectedHotelName}`}
            {" "}· {cleaners.length} cleaner{cleaners.length !== 1 ? "s" : ""} available
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="shrink-0 self-start"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Hotel Branch Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <HotelIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Hotel Branch</span>
          </div>
          <div className="overflow-x-auto pb-1 scrollbar-hide">
            <ToggleGroup
              type="single"
              value={currentToggleValue}
              onValueChange={handleHotelToggleChange}
              className="justify-start flex-nowrap gap-2 w-max"
            >
              <ToggleGroupItem
                value="all-hotels"
                aria-label="All Hotels"
                className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground whitespace-nowrap"
              >
                <HotelIcon className="h-4 w-4 mr-2" />
                All Hotels
              </ToggleGroupItem>
              {safeHotels.map((hotel) => (
                <ToggleGroupItem
                  key={hotel._id}
                  value={hotel._id}
                  aria-label={hotel.name}
                  className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground whitespace-nowrap"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {hotel.name}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Card key={s.label} className={cn("border-l-4", s.border)}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  s.bg
                )}
              >
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight truncate">{s.label}</p>
                <p className={cn("text-2xl font-bold leading-tight", s.color)}>{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="unassigned" className="space-y-4">
        <div className="overflow-x-auto pb-1 scrollbar-hide">
          <TabsList className="flex w-max gap-1">
            <TabsTrigger value="unassigned" className="whitespace-nowrap">
              Unassigned ({unassignedRooms.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="whitespace-nowrap">
              Pending ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="in-progress" className="whitespace-nowrap">
              In Progress ({inProgressTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="whitespace-nowrap">
              Completed ({filteredCompletedTasks.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Unassigned */}
        <TabsContent value="unassigned" className="mt-0 space-y-4">
          {unassignedRooms.length === 0 ? (
            <EmptyState message="No unassigned rooms. All rooms are covered." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {unassignedRooms.map((room) => (
                <UnassignedRoomCard
                  key={room._id}
                  room={room}
                  cleaners={cleaners}
                  onAssign={assignCleaner}
                  showHotelName={showHotelName}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pending */}
        <TabsContent value="pending" className="mt-0 space-y-4">
          {pendingTasks.length === 0 ? (
            <EmptyState message="No pending tasks. All assigned rooms are being cleaned or done." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} showHotelName={showHotelName} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* In Progress */}
        <TabsContent value="in-progress" className="mt-0 space-y-4">
          {inProgressTasks.length === 0 ? (
            <EmptyState message="No tasks currently in progress." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} showHotelName={showHotelName} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Completed */}
        <TabsContent value="completed" className="mt-0 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <DatePicker date={fromDate} setDate={setFromDate} label="From Date" />
                <DatePicker date={toDate} setDate={setToDate} label="To Date" />
                {(fromDate || toDate) && (
                  <div className="flex items-end sm:pb-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFromDate(undefined);
                        setToDate(undefined);
                      }}
                      className="whitespace-nowrap"
                    >
                      Clear Dates
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {filteredCompletedTasks.length === 0 ? (
            <EmptyState
              message={
                fromDate || toDate
                  ? "No completed tasks in the selected date range."
                  : "No completed tasks yet."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompletedTasks.map((task) => (
                <AssignedTaskCard key={task._id} task={task} showHotelName={showHotelName} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
