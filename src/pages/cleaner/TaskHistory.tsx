import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon, Sparkles, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { format, isToday, isYesterday, differenceInDays } from "date-fns";
import useTaskHistoryStore from "../../store/taskHistoryStore";
import TaskHistorySkeleton from "../../components/skeleton/TaskHistorySkeleton";

interface HistoryTask {
  id: string;
  room: string;
  floor: number;
  type: string;
  completedAt: string;
  duration: string;
  rating?: number;
  feedback?: string;
}

export default function TaskHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [date, setDate] = useState<Date>();

  const { completedTasks, isLoading, error, fetchCompletedTasks, clearError } = useTaskHistoryStore();

  useEffect(() => {
    fetchCompletedTasks();
  }, [fetchCompletedTasks]);

  // Transform backend data to frontend format
  const transformedTasks: HistoryTask[] = completedTasks.map((task) => {
    let completedAt = "Unknown date";
    
    try {
      const finishDate = new Date(task.finishTime);
      
      // Check if date is valid
      if (!isNaN(finishDate.getTime())) {
        if (isToday(finishDate)) {
          completedAt = `Today ${format(finishDate, "h:mm a")}`;
        } else if (isYesterday(finishDate)) {
          completedAt = `Yesterday ${format(finishDate, "h:mm a")}`;
        } else {
          const daysAgo = differenceInDays(new Date(), finishDate);
          completedAt = daysAgo <= 7 ? `${daysAgo} days ago` : format(finishDate, "MMM d, yyyy");
        }
      }
    } catch (error) {
      console.error("Error parsing date for task:", task._id, error);
    }

    // Extract floor number from room number (e.g., "205" -> floor 2)
    const roomNumber = task.roomId?.roomNumber || "Unknown";
    const floor = roomNumber !== "Unknown" ? parseInt(roomNumber.charAt(0)) || 1 : 1;

    return {
      id: task._id,
      room: `Room ${roomNumber}`,
      floor,
      type: task.roomId?.roomTypeId?.name || "Standard",
      completedAt,
      duration: task.actualDuration ? `${task.actualDuration} min` : task.estimatedDuration,
      rating: task.rating,
      feedback: task.feedback,
    };
  });

  const filteredTasks = transformedTasks.filter(task => {
    const matchesSearch = task.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || task.type === filterType;
    
    // Date filter
    let matchesDate = true;
    if (date) {
      const taskData = completedTasks.find(t => t._id === task.id);
      if (taskData && taskData.finishTime) {
        const taskDate = new Date(taskData.finishTime);
        if (!isNaN(taskDate.getTime())) {
          // Compare only the date part (year, month, day)
          matchesDate = 
            taskDate.getFullYear() === date.getFullYear() &&
            taskDate.getMonth() === date.getMonth() &&
            taskDate.getDate() === date.getDate();
        }
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  // Calculate statistics
  const totalCompleted = completedTasks.length;
  
  const averageDuration = completedTasks.length > 0
    ? Math.round(
        completedTasks
          .filter(task => task.actualDuration && task.actualDuration > 0)
          .reduce((sum, task) => sum + (task.actualDuration || 0), 0) / 
        Math.max(completedTasks.filter(task => task.actualDuration && task.actualDuration > 0).length, 1)
      )
    : 0;
    
  const tasksWithRatings = completedTasks.filter(task => task.rating && task.rating > 0);
  const averageRating = tasksWithRatings.length > 0
    ? (
        tasksWithRatings.reduce((sum, task) => sum + (task.rating || 0), 0) /
        tasksWithRatings.length
      ).toFixed(1)
    : "0.0";

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Deep Clean": return "bg-primary/10 text-primary";
      case "Standard": return "bg-info/10 text-info";
      case "Turndown": return "bg-success/10 text-success";
      case "Inspection": return "bg-warning/10 text-warning";
      default: return "bg-secondary/10 text-secondary";
    }
  };

  const renderRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? "text-warning" : "text-muted-foreground"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <TaskHistorySkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Error Loading Tasks</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => {
                    clearError();
                    fetchCompletedTasks();
                  }}
                  size="sm"
                  className="mt-4"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task History</h1>
        <p className="text-muted-foreground">View your completed cleaning tasks and performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Completed</p>
            <p className="text-3xl font-bold">{totalCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Duration</p>
            <p className="text-3xl font-bold">{averageDuration} min</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">{averageRating}</p>
              <span className="text-warning text-2xl">★</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by room or task type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Standard">Standard</SelectItem>
            <SelectItem value="Deep Clean">Deep Clean</SelectItem>
            <SelectItem value="Turndown">Turndown</SelectItem>
            <SelectItem value="Inspection">Inspection</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full md:w-[200px] justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
              {date && (
                <X
                  className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDate(undefined);
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters */}
      {(filterType !== "all" || date || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchQuery}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearchQuery("")}
              />
            </Badge>
          )}
          {filterType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Type: {filterType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilterType("all")}
              />
            </Badge>
          )}
          {date && (
            <Badge variant="secondary" className="gap-1">
              Date: {format(date, "MMM d, yyyy")}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setDate(undefined)}
              />
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setFilterType("all");
              setDate(undefined);
            }}
            className="h-6 text-xs"
          >
            Clear all
          </Button>
        </div>
      )}

      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Completed Tasks</h3>
            <p className="text-muted-foreground">
              {completedTasks.length === 0
                ? "You haven't completed any tasks yet. Start cleaning to see your history here!"
                : "No tasks match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-success/10 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{task.room}</h3>
                        <Badge className={getTypeColor(task.type)}>
                          {task.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-4 w-4" />
                          Floor {task.floor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {task.duration}
                        </span>
                        <span>{task.completedAt}</span>
                      </div>
                      {task.feedback && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          "{task.feedback}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderRatingStars(task.rating)}
                    <span className="text-xs text-muted-foreground">
                      Task ID: {task.id.slice(-6)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}