import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Award, Clock, CheckCircle, Target, Star } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const monthlyData = [
  { month: "Jan", completed: 245, rating: 4.7 },
  { month: "Feb", completed: 268, rating: 4.8 },
  { month: "Mar", completed: 290, rating: 4.9 },
  { month: "Apr", completed: 275, rating: 4.8 },
  { month: "May", completed: 312, rating: 4.9 },
  { month: "Jun", completed: 298, rating: 5.0 },
];

const taskTypeData = [
  { name: "Standard Clean", value: 156, color: "hsl(var(--info))" },
  { name: "Deep Clean", value: 89, color: "hsl(var(--primary))" },
  { name: "Turndown", value: 45, color: "hsl(var(--success))" },
  { name: "Inspection", value: 8, color: "hsl(var(--warning))" },
];

const performanceData = [
  { metric: "Speed", score: 92 },
  { metric: "Quality", score: 95 },
  { metric: "Consistency", score: 88 },
  { metric: "Attention to Detail", score: 96 },
];

const weeklyProductivity = [
  { day: "Mon", tasks: 12, avgTime: 32 },
  { day: "Tue", tasks: 15, avgTime: 30 },
  { day: "Wed", tasks: 10, avgTime: 35 },
  { day: "Thu", tasks: 14, avgTime: 31 },
  { day: "Fri", tasks: 16, avgTime: 29 },
  { day: "Sat", tasks: 18, avgTime: 28 },
  { day: "Sun", tasks: 13, avgTime: 33 },
];

export default function CleanerPerformance() {
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
            <div className="text-2xl font-bold">298</div>
            <p className="text-xs text-success">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.0</div>
            <p className="text-xs text-success">Perfect score!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Time/Task</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31 min</div>
            <p className="text-xs text-success">-3 min improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">93%</div>
            <p className="text-xs text-success">Top 10% performer</p>
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
                    <YAxis yAxisId="right" orientation="right" />
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
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={taskTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {taskTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData} layout="vertical">
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
            {[
              { title: "Speed Demon", description: "Complete 100 tasks in record time", icon: Clock, achieved: true },
              { title: "Perfectionist", description: "Maintain 5-star rating for 30 days", icon: Star, achieved: true },
              { title: "Team Player", description: "Help colleagues with 50 tasks", icon: Award, achieved: true },
              { title: "Early Bird", description: "Start 50 tasks before scheduled time", icon: TrendingUp, achieved: true },
              { title: "Consistency King", description: "Work 30 consecutive days", icon: Target, achieved: false },
              { title: "Master Cleaner", description: "Complete 500 tasks", icon: CheckCircle, achieved: false },
            ].map((achievement, index) => (
              <Card key={index} className={achievement.achieved ? "border-success" : "opacity-60"}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${achievement.achieved ? "bg-success/10" : "bg-muted"}`}>
                      <achievement.icon className={`h-6 w-6 ${achievement.achieved ? "text-success" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{achievement.title}</CardTitle>
                      {achievement.achieved && (
                        <span className="text-xs text-success">Unlocked!</span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
