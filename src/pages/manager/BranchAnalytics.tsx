import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useAnalyticsStore } from "@/store/useAnalyticsStore";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

const COLORS = ['hsl(var(--success))', 'hsl(var(--primary))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

// Helper function to convert satisfaction data (rating count) into the format needed for the BarChart
const formatSatisfactionData = (data: { _id: number; count: number }[]) => {
    const categories: Record<number, string> = { 
        5: "Excellent", 
        4: "Good", 
        3: "Average", 
        2: "Poor", 
        1: "Bad" 
    };
    
    return data
        .map(item => ({ 
            category: categories[item._id] || `Rating ${item._id}`, 
            count: item.count 
        }))
        .sort((a, b) => {
            const order = ["Excellent", "Good", "Average", "Poor", "Bad"];
            return order.indexOf(a.category) - order.indexOf(b.category);
        });
};

// Format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export default function BranchAnalytics() {
    const { 
        quickStats, 
        monthlyRevenue, 
        roomTypeRevenue, 
        customerSatisfaction, 
        isLoading,
        error,
        fetchBranchAnalytics 
    } = useAnalyticsStore();

    // Fetch data on component mount
    useEffect(() => {
        fetchBranchAnalytics();
        
        // Set up auto-refresh every 10 minutes
        const interval = setInterval(() => {
            fetchBranchAnalytics();
        }, 10 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, [fetchBranchAnalytics]);
    
    const satisfactionDataFormatted = formatSatisfactionData(customerSatisfaction);
    
    // Calculate revenue change percentage
    const lastMonthRevenue = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 1].revenue : 0;
    const secondLastMonthRevenue = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2]?.revenue || 1 : 1;
    const revenueChange = lastMonthRevenue && secondLastMonthRevenue 
        ? ((lastMonthRevenue - secondLastMonthRevenue) / secondLastMonthRevenue) * 100 
        : 0;
    
    // Calculate bookings change percentage
    const lastMonthBookings = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 1].bookings : 0;
    const secondLastMonthBookings = monthlyRevenue.length > 1 ? monthlyRevenue[monthlyRevenue.length - 2]?.bookings || 1 : 1;
    const bookingsChange = lastMonthBookings && secondLastMonthBookings 
        ? ((lastMonthBookings - secondLastMonthBookings) / secondLastMonthBookings) * 100 
        : 0;
    
    // --- Error State ---
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Card className="w-full max-w-md">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                            <div>
                                <p className="font-semibold">Error Loading Analytics</p>
                                <p className="text-sm text-muted-foreground">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    // --- Loading State ---
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
    
    // --- Component JSX ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Branch Analytics 📈</h1>
                    <p className="text-muted-foreground">
                        Detailed performance metrics for your branch
                    </p>
                </div>
                {isLoading && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                        <span className="text-sm">Refreshing...</span>
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">
                            Total Revenue {monthlyRevenue.length > 0 ? `(${monthlyRevenue[monthlyRevenue.length - 1]?.month})` : ''}
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(lastMonthRevenue)}
                        </p>
                        {monthlyRevenue.length > 1 && (
                            <p className={`text-xs ${revenueChange >= 0 ? 'text-success' : 'text-destructive'} mt-1`}>
                                {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}% from last month
                            </p>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Avg Occupancy</p>
                        <p className="text-2xl font-bold text-foreground">{quickStats.avgOccupancy}%</p>
                        <p className="text-xs text-muted-foreground mt-1">Current occupancy rate</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Total Bookings</p>
                        <p className="text-2xl font-bold text-foreground">{quickStats.totalBookings}</p>
                        {monthlyRevenue.length > 1 && (
                            <p className={`text-xs ${bookingsChange >= 0 ? 'text-success' : 'text-destructive'} mt-1`}>
                                {bookingsChange >= 0 ? '↑' : '↓'} {Math.abs(bookingsChange).toFixed(1)}% from last month
                            </p>
                        )}
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                        <p className="text-2xl font-bold text-foreground">{quickStats.avgRating}/5</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Based on {customerSatisfaction.reduce((sum, item) => sum + item.count, 0)} reviews
                        </p>
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
                                {monthlyRevenue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyRevenue}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="month" className="text-xs" />
                                            <YAxis yAxisId="left" className="text-xs" />
                                            <YAxis yAxisId="right" orientation="right" className="text-xs" />
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value: number, name: string) => {
                                                    if (name === 'Revenue (₦)') {
                                                        return formatCurrency(value);
                                                    }
                                                    return value;
                                                }}
                                            />
                                            <Legend />
                                            <Line 
                                                yAxisId="left" 
                                                type="monotone" 
                                                dataKey="revenue" 
                                                stroke="hsl(var(--primary))" 
                                                strokeWidth={2} 
                                                name="Revenue (₦)" 
                                            />
                                            <Line 
                                                yAxisId="right" 
                                                type="monotone" 
                                                dataKey="bookings" 
                                                stroke="hsl(var(--success))" 
                                                strokeWidth={2} 
                                                name="Bookings" 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                        <p>No revenue data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue by Room Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {roomTypeRevenue.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie className="text-white"
                                                data={roomTypeRevenue}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ type, value }) => `${type}: ${formatCurrency(value)}`}
                                                outerRadius={100}
                                                fill="hsl(var(--primary))"
                                                dataKey="value"
                                                
                                            >
                                                {roomTypeRevenue.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ 
                                                    backgroundColor: 'hsl(var(--card))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '8px'
                                                }}
                                                formatter={(value: number) => formatCurrency(value)}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                        <p>No room type data available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="occupancy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Monthly Bookings Trend</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {monthlyRevenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={monthlyRevenue}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" className="text-xs" />
                                        <YAxis className="text-xs" />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }} 
                                        />
                                        <Legend />
                                        <Bar 
                                            dataKey="bookings" 
                                            fill="hsl(var(--info))" 
                                            name="Total Bookings" 
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                                    <p>No booking data available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="satisfaction">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Satisfaction Distribution</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {satisfactionDataFormatted.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={satisfactionDataFormatted} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" className="text-xs" />
                                        <YAxis dataKey="category" type="category" className="text-xs" width={80} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px'
                                            }} 
                                        />
                                        <Bar 
                                            dataKey="count" 
                                            fill="hsl(var(--primary))" 
                                            name="Review Count" 
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                                    <p>No customer reviews available</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}