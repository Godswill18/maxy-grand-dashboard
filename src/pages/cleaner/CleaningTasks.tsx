import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Clock, CheckCircle, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useHousekeeperStore, CleaningTask } from "@/store/useHousekeeperStore"; // Import your store
import { formatDistanceToNow } from "date-fns"; // Recommended for "Time ago" display

export default function CleaningTasks() {
  const { tasks, isLoading, error, fetchMyTasks, startTask, completeTask } = useHousekeeperStore();

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  const handleStartTask = (taskId: string) => {
    startTask(taskId);
    toast.success("Task started");
  };

  const handleCompleteTask = async (taskId: string) => {
    await completeTask(taskId);
    toast.success("Task completed successfully");
  };

  // Helper to map backend priority (not in schema, so mocking or inferring)
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
      case "in_progress": return "bg-blue-100 text-blue-700 border-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const renderTaskCard = (task: CleaningTask) => {
    // Normalize status for display
    const displayStatus = task.status === 'in_progress' ? 'In Progress' : 
                          task.status.charAt(0).toUpperCase() + task.status.slice(1);

    // Mock priority since it's not in your schema, or derive it
    const priority = "Medium"; 

    return (
      <Card key={task._id} className="hover:shadow-lg transition-shadow border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Room {task.roomId.roomNumber}</CardTitle>
            <Badge variant="outline" className={getPriorityColor(priority)}>
              {priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {/* Assuming floor is part of roomNumber or not available */}
              <span>{task.roomId.roomTypeId.name}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Requested by: {task.requestedBy.firstName} {task.requestedBy.lastName}</span>
            </div>

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
            {task.status === "in_progress" && (
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

  // Filtering tasks based on status
  const pendingTasks = tasks.filter(t => t.status === "pending");
  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const completedTasks = tasks.filter(t => t.status === "completed");

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingTasks.length})</TabsTrigger>
          <TabsTrigger value="progress">In Progress ({inProgressTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No tasks assigned.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map(renderTaskCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingTasks.map(renderTaskCard)}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inProgressTasks.map(renderTaskCard)}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completedTasks.map(renderTaskCard)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}