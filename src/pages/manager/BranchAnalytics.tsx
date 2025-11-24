import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAnalyticsStore } from "@/store/useAnalyticsStore"; // IMPORT THE NEW STORE
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/useAuthStore"; // Used to check hotel context

const COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

// Helper function to convert satisfaction data (rating count) into the format needed for the BarChart
const formatSatisfactionData = (data: { _id: number, count: number }[]) => {
    // Convert numerical rating to descriptive category
    const categories: Record<number, string> = { 5: "Excellent", 4: "Good", 3: "Average", 2: "Poor", 1: "Bad" };
    return data
        .map(item => ({ category: categories[item._id] || `Rating ${item._id}`, count: item.count }))
        .sort((a, b) => b.count - a.count); // Sort by count descending
};


export default function BranchAnalytics() {
    const { 
        quickStats, 
        monthlyRevenue, 
        roomTypeRevenue, 
        customerSatisfaction, 
        isLoading, 
        fetchBranchAnalytics 
    } = useAnalyticsStore();
    
    const { user } = useAuthStore();

    // 1. Fetch data on component mount
    useEffect(() => {
        fetchBranchAnalytics();
    }, [fetchBranchAnalytics]);
    
    const satisfactionDataFormatted = formatSatisfactionData(customerSatisfaction);
    const lastMonthRevenue = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 1].revenue : 0;
    const secondLastMonthRevenue = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 1 : 1;
    const revenueChange = lastMonthRevenue && secondLastMonthRevenue 
        ? ((lastMonthRevenue - secondLastMonthRevenue) / secondLastMonthRevenue) * 100 
        : 0;
    
    // --- Skeleton/Loading State ---
    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }
    
    // --- Component JSX (using store data) ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Branch Analytics 📈</h1>
                <p className="text-muted-foreground">
                    Detailed performance metrics for {user?.hotelId ? `Hotel ID: ${user.hotelId}` : 'Downtown Branch'}
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Total Revenue ({monthlyRevenue[monthlyRevenue.length - 1]?.month || 'N/A'})</p>
                        <p className="text-2xl font-bold text-foreground">₦{quickStats.totalRevenue.toLocaleString()}</p>
                        <p className={`text-xs ${revenueChange >= 0 ? 'text-success' : 'text-destructive'} mt-1`}>
                           {revenueChange.toFixed(1)}% {revenueChange >= 0 ? 'up' : 'down'} from last month
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Avg Occupancy</p>
                        <p className="text-2xl font-bold text-foreground">{quickStats.avgOccupancy}%</p>
                        <p className="text-xs text-success mt-1">Mock +5% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                        <p className="text-2xl font-bold text-foreground">{quickStats.totalBookings}</p>
                        <p className="text-xs text-success mt-1">Mock +8% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                        <p className="text-2xl font-bold text-foreground">{quickStats.avgRating}/5</p>
                        <p className="text-xs text-success mt-1">Mock +0.2 from last month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="revenue" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
                    <TabsTrigger value="satisfaction">Satisfaction</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Revenue & Bookings</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" className="text-xs" />
                                        <YAxis yAxisId="left" className="text-xs" />
                                        <YAxis yAxisId="right" orientation="right" className="text-xs" />
                                        <Tooltip contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }} />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} name="Revenue (₦)" />
                                        <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="hsl(var(--success))" strokeWidth={2} name="Bookings" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Room Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={roomTypeRevenue}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ type, value }) => `${type} (₦${value.toLocaleString()})`}
                                            outerRadius={100}
                                            fill="hsl(var(--primary))"
                                            dataKey="value"
                                        >
                                            {roomTypeRevenue.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="occupancy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Room Occupancy Trends</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={monthlyRevenue}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis className="text-xs" />
                                    <Tooltip contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }} />
                                    <Legend />
                                    <Bar dataKey="bookings" fill="hsl(var(--info))" name="Total Bookings" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="satisfaction">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Satisfaction</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={satisfactionDataFormatted} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis type="number" className="text-xs" />
                                    <YAxis dataKey="category" type="category" className="text-xs" />
                                    <Tooltip contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px'
                                    }} />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" name="Review Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}