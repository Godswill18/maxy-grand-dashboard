import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, Clock, TrendingUp, Sparkles, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import useDashboardStore from "../../store/useCleanerDashboardStore";
import { Button } from "@/components/ui/button";
import DashboardSkeleton from "../../components/skeleton/Dashboardskeleton";
import { format } from "date-fns";

export default function CleanerDashboard() {
  const { dashboardData, isLoading, error, fetchDashboardData, clearError } = useDashboardStore();

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Error Loading Dashboard</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => {
                    clearError();
                    fetchDashboardData();
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

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No dashboard data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { stats, weeklyData, performanceData, urgentTasks } = dashboardData;

  // Calculate changes
  const completedChange = stats.completedYesterday > 0
    ? stats.completedToday - stats.completedYesterday
    : 0;

  const performanceChange = stats.previousMonthScore > 0
    ? Math.round(((stats.performanceScore - stats.previousMonthScore) / stats.previousMonthScore) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cleaner Dashboard</h1>
          <p className="text-muted-foreground">Overview of your cleaning tasks and performance</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Today</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasksToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedToday} completed, {stats.pendingToday} pending
              {stats.inProgressToday > 0 && `, ${stats.inProgressToday} in progress`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.completedToday}</div>
            <p className={`text-xs ${completedChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {completedChange >= 0 ? '+' : ''}{completedChange} from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingToday}</div>
            <p className="text-xs text-muted-foreground">
              {stats.urgentCount} urgent, {stats.standardCount} standard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.performanceScore}%</div>
            <p className={`text-xs ${performanceChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {performanceChange >= 0 ? '+' : ''}{performanceChange}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(var(--success))" name="Completed" />
                  <Bar dataKey="inProgress" fill="hsl(var(--info))" name="In Progress" />
                  <Bar dataKey="pending" fill="hsl(var(--warning))" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No weekly data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    name="Score %" 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <p className="text-muted-foreground">No performance data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Urgent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Urgent Tasks
            {urgentTasks.length > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {urgentTasks.length} task{urgentTasks.length !== 1 ? 's' : ''}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {urgentTasks.length > 0 ? (
            <div className="space-y-4">
              {urgentTasks.map((task) => (
                <div 
                  key={task._id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Sparkles className="h-8 w-8 text-warning" />
                    <div>
                      <p className="font-semibold">{task.room}</p>
                      <p className="text-sm text-muted-foreground">{task.type}</p>
                      {task.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          Note: {task.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                      {task.priority}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.estimatedStartTime 
                        ? format(new Date(task.estimatedStartTime), 'h:mm a')
                        : format(new Date(task.createdAt), 'h:mm a')
                      }
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
              <p className="text-muted-foreground">No urgent tasks at the moment</p>
              <p className="text-sm text-muted-foreground mt-1">Great job staying on top of things!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}