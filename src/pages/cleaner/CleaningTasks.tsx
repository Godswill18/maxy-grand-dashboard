import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Clock, CheckCircle, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  room: string;
  floor: number;
  type: "Standard" | "Deep Clean" | "Turndown" | "Inspection";
  priority: "High" | "Medium" | "Low";
  status: "Pending" | "In Progress" | "Completed";
  assignedTime: string;
  estimatedDuration: string;
  specialInstructions?: string;
}

export default function CleaningTasks() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "T001",
      room: "Room 205",
      floor: 2,
      type: "Deep Clean",
      priority: "High",
      status: "Pending",
      assignedTime: "10:00 AM",
      estimatedDuration: "45 min",
      specialInstructions: "Guest requested hypoallergenic products"
    },
    {
      id: "T002",
      room: "Room 312",
      floor: 3,
      type: "Standard",
      priority: "Medium",
      status: "Pending",
      assignedTime: "11:30 AM",
      estimatedDuration: "30 min"
    },
    {
      id: "T003",
      room: "Room 418",
      floor: 4,
      type: "Turndown",
      priority: "Low",
      status: "Pending",
      assignedTime: "6:00 PM",
      estimatedDuration: "15 min"
    },
    {
      id: "T004",
      room: "Room 125",
      floor: 1,
      type: "Standard",
      priority: "High",
      status: "In Progress",
      assignedTime: "9:00 AM",
      estimatedDuration: "30 min"
    },
  ]);

  const startTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: "In Progress" as const } : task
    ));
    toast.success("Task started");
  };

  const completeTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: "Completed" as const } : task
    ));
    toast.success("Task completed successfully");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "bg-error/10 text-error hover:bg-error/20";
      case "Medium": return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Low": return "bg-success/10 text-success hover:bg-success/20";
      default: return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-success/10 text-success hover:bg-success/20";
      case "In Progress": return "bg-info/10 text-info hover:bg-info/20";
      case "Pending": return "bg-warning/10 text-warning hover:bg-warning/20";
      default: return "";
    }
  };

  const renderTaskCard = (task: Task) => (
    <Card key={task.id} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{task.room}</CardTitle>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>Floor {task.floor}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span>{task.type}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{task.assignedTime} • {task.estimatedDuration}</span>
          </div>
          {task.specialInstructions && (
            <div className="flex items-start gap-2 text-sm p-2 bg-info/10 rounded-md">
              <AlertCircle className="h-4 w-4 text-info mt-0.5" />
              <span className="text-info">{task.specialInstructions}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(task.status)}>
            {task.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          {task.status === "Pending" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => startTask(task.id)}
            >
              Start Task
            </Button>
          )}
          {task.status === "In Progress" && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => completeTask(task.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const pendingTasks = tasks.filter(t => t.status === "Pending");
  const inProgressTasks = tasks.filter(t => t.status === "In Progress");
  const completedTasks = tasks.filter(t => t.status === "Completed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cleaning Tasks</h1>
        <p className="text-muted-foreground">Manage your assigned cleaning tasks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold text-warning">{pendingTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">In Progress</p>
            <p className="text-3xl font-bold text-info">{inProgressTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-3xl font-bold text-success">{completedTasks.length}</p>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map(renderTaskCard)}
          </div>
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
