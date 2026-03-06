import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Award, Clock, CheckCircle, Target, Star, Loader2, AlertCircle } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import usePerformanceStore from "../../store/performanceStore";
import { Button } from "@/components/ui/button";
import PerformanceSkeleton from "../../components/skeleton/PerformanceSkeleton";

const iconMap = {
  Clock,
  Star,
  Award,
  TrendingUp,
  Target,
  CheckCircle,
};

export default function CleanerPerformance() {
  const { performanceData, isLoading, error, fetchPerformanceData, clearError } = usePerformanceStore();

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  if (isLoading) {
    return <PerformanceSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-destructive mt-1" />
              <div className="space-y-2">
                <h3 className="font-semibold">Error Loading Performance Data</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button 
                  onClick={() => {
                    clearError();
                    fetchPerformanceData();
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

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No performance data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { keyMetrics, monthlyData, taskTypeData, performanceMetrics, weeklyProductivity, achievements } = performanceData;

  // Calculate percentage change
  const tasksChange = keyMetrics.tasksLastMonth > 0
    ? Math.round(((keyMetrics.tasksThisMonth - keyMetrics.tasksLastMonth) / keyMetrics.tasksLastMonth) * 100)
    : 0;
  
  const timeChange = keyMetrics.previousAvgTime > 0
    ? Math.round(keyMetrics.previousAvgTime - keyMetrics.avgTimePerTask)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Performance Metrics</h1>
        <p className="text-muted-foreground">Track your cleaning performance and achievements</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks This Month</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.tasksThisMonth}</div>
            <p className={`text-xs ${tasksChange >= 0 ? 'text-success' : 'text-destructive'}`}>
              {tasksChange >= 0 ? '+' : ''}{tasksChange}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.averageRating.toFixed(1)}</div>
            <p className={`text-xs ${keyMetrics.averageRating >= 4.8 ? 'text-success' : 'text-muted-foreground'}`}>
              {keyMetrics.averageRating >= 5.0 ? 'Perfect score!' : keyMetrics.averageRating >= 4.8 ? 'Excellent!' : 'Keep improving!'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time/Task</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.avgTimePerTask} min</div>
            <p className={`text-xs ${timeChange > 0 ? 'text-success' : timeChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {timeChange !== 0 ? `${timeChange > 0 ? '-' : '+'}${Math.abs(timeChange)} min ${timeChange > 0 ? 'improvement' : 'slower'}` : 'No change'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.efficiencyScore}%</div>
            <p className="text-xs text-success">
              Top {100 - keyMetrics.percentile}% performer
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="productivity">Productivity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="completed" stroke="hsl(var(--primary))" name="Tasks Completed" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="rating" stroke="hsl(var(--warning))" name="Avg Rating" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {taskTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taskTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {(() => {
                          const palette = ['#6366f1','#f59e0b','#10b981','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6'];
                          return taskTypeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color && !entry.color.includes('var(') ? entry.color : palette[index % palette.length]}
                            />
                          ));
                        })()}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px]">
                    <p className="text-muted-foreground">No task data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceMetrics} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="metric" type="category" />
                    <Tooltip />
                    <Bar dataKey="score" fill="hsl(var(--success))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="productivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={weeklyProductivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tasks" fill="hsl(var(--primary))" name="Tasks Completed" />
                  <Bar yAxisId="right" dataKey="avgTime" fill="hsl(var(--info))" name="Avg Time (min)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {achievements.map((achievement, index) => {
              const Icon = iconMap[achievement.icon as keyof typeof iconMap] || CheckCircle;
              return (
                <Card key={index} className={achievement.achieved ? "border-success" : "opacity-60"}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${achievement.achieved ? "bg-success/10" : "bg-muted"}`}>
                        <Icon className={`h-6 w-6 ${achievement.achieved ? "text-success" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{achievement.title}</CardTitle>
                        {achievement.achieved ? (
                          <span className="text-xs text-success">Unlocked!</span>
                        ) : achievement.progress !== undefined && achievement.target !== undefined ? (
                          <span className="text-xs text-muted-foreground">
                            {achievement.progress}/{achievement.target}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {!achievement.achieved && achievement.progress !== undefined && achievement.target !== undefined && (
                      <div className="mt-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}