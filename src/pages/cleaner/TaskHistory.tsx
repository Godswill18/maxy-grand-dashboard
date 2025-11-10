import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon, Sparkles, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface HistoryTask {
  id: string;
  room: string;
  floor: number;
  type: "Standard" | "Deep Clean" | "Turndown" | "Inspection";
  completedAt: string;
  duration: string;
  rating?: number;
  feedback?: string;
}

export default function TaskHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [date, setDate] = useState<Date>();

  const historyTasks: HistoryTask[] = [
    {
      id: "H001",
      room: "Room 205",
      floor: 2,
      type: "Deep Clean",
      completedAt: "Today 11:30 AM",
      duration: "42 min",
      rating: 5,
      feedback: "Excellent work, very thorough"
    },
    {
      id: "H002",
      room: "Room 125",
      floor: 1,
      type: "Standard",
      completedAt: "Today 9:45 AM",
      duration: "28 min",
      rating: 5
    },
    {
      id: "H003",
      room: "Room 308",
      floor: 3,
      type: "Turndown",
      completedAt: "Yesterday 7:15 PM",
      duration: "12 min",
      rating: 4
    },
    {
      id: "H004",
      room: "Room 412",
      floor: 4,
      type: "Standard",
      completedAt: "Yesterday 2:30 PM",
      duration: "31 min",
      rating: 5,
      feedback: "Room was spotless"
    },
    {
      id: "H005",
      room: "Room 217",
      floor: 2,
      type: "Deep Clean",
      completedAt: "2 days ago",
      duration: "48 min",
      rating: 5
    },
    {
      id: "H006",
      room: "Room 103",
      floor: 1,
      type: "Inspection",
      completedAt: "2 days ago",
      duration: "15 min",
      rating: 5
    },
    {
      id: "H007",
      room: "Room 324",
      floor: 3,
      type: "Standard",
      completedAt: "3 days ago",
      duration: "29 min",
      rating: 4
    },
    {
      id: "H008",
      room: "Room 506",
      floor: 5,
      type: "Deep Clean",
      completedAt: "3 days ago",
      duration: "45 min",
      rating: 5,
      feedback: "Great attention to detail"
    },
  ];

  const filteredTasks = historyTasks.filter(task => {
    const matchesSearch = task.room.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || task.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Deep Clean": return "bg-primary/10 text-primary";
      case "Standard": return "bg-info/10 text-info";
      case "Turndown": return "bg-success/10 text-success";
      case "Inspection": return "bg-warning/10 text-warning";
      default: return "";
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
            <p className="text-3xl font-bold">{historyTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Duration</p>
            <p className="text-3xl font-bold">32 min</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold">4.8</p>
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
            <Button variant="outline" className="w-full md:w-[200px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : "Pick a date"}
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
                    Task ID: {task.id}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
