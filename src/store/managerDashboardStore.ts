import { create } from 'zustand';

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
}

interface Request {
  _id: string;
  title: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface Room {
  _id: string;
  roomNumber: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out-of-service';
}

interface Booking {
  _id: string;
  totalAmount: number;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  createdAt: string;
}

interface RevenueData {
  month: string;
  revenue: number;
  expenses: number;
}

interface OccupancyData {
  day: string;
  occupancy: number;
}

interface DashboardStats {
  totalStaff: number;
  monthlyRevenue: number;
  occupancyRate: number;
  pendingTasks: number;
  activeRequests: number;
  approvedThisMonth: number;
  availableRooms: number;
}

interface ManagerDashboardState {
  // Data
  staff: StaffMember[];
  requests: Request[];
  rooms: Room[];
  bookings: Booking[];
  stats: DashboardStats;
  revenueData: RevenueData[];
  occupancyData: OccupancyData[];
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchDashboardData: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  calculateStats: () => void;
  calculateRevenueData: () => void;
  calculateOccupancyData: () => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const useManagerDashboardStore = create<ManagerDashboardState>((set, get) => ({
  // Initial state
  staff: [],
  requests: [],
  rooms: [],
  bookings: [],
  stats: {
    totalStaff: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
    pendingTasks: 0,
    activeRequests: 0,
    approvedThisMonth: 0,
    availableRooms: 0,
  },
  revenueData: [],
  occupancyData: [],
  isLoading: false,
  error: null,

  // Fetch all staff members
  fetchStaff: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/users/get-hotel-staffs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies/sessions
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ staff: data.data });
        get().calculateStats();
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch all requests (you'll need to create this endpoint)
  fetchRequests: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/requests/get-hotel-requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ requests: data.data });
        get().calculateStats();
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch all rooms
  fetchRooms: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/rooms/get-hotel-rooms`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ rooms: data.data });
        get().calculateStats();
        get().calculateOccupancyData();
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set({ error: (error as Error).message });
    }
  },

  // Fetch all bookings
  fetchBookings: async () => {
    try {
      const response = await fetch(`${VITE_API_URL}/api/bookings/get-hotel-bookings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      
      if (data.success) {
        set({ bookings: data.data });
        get().calculateStats();
        get().calculateRevenueData();
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      set({ error: (error as Error).message });
    }
  },

  // Calculate dashboard statistics
  calculateStats: () => {
    const { staff, requests, rooms, bookings } = get();
    
    // Total active staff
    const totalStaff = staff.filter(s => s.isActive).length;
    
    // Calculate monthly revenue (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyRevenue = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return (
          bookingDate.getMonth() === currentMonth &&
          bookingDate.getFullYear() === currentYear &&
          (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'checked-in' || booking.bookingStatus === 'checked-out')
        );
      })
      .reduce((sum, booking) => sum + booking.totalAmount, 0);
    
    // Calculate occupancy rate
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
    
   // Pending tasks - count rooms that need cleaning
    const pendingTasks = rooms.filter(r => r.status === 'cleaning').length;
    
    // Active requests
    const activeRequests = requests.filter(r => r.status === 'pending').length;
    
    // Approved this month
    const approvedThisMonth = requests.filter(request => {
      const requestDate = new Date(request.createdAt);
      return (
        request.status === 'approved' &&
        requestDate.getMonth() === currentMonth &&
        requestDate.getFullYear() === currentYear
      );
    }).length;
    
    // Available rooms
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    
    set({
      stats: {
        totalStaff,
        monthlyRevenue,
        occupancyRate,
        pendingTasks,
        activeRequests,
        approvedThisMonth,
        availableRooms,
      },
    });
  },

  // Calculate revenue data for the last 6 months
  calculateRevenueData: () => {
    const { bookings } = get();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap = new Map<string, { revenue: number; expenses: number }>();
    
    // Get last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = monthNames[date.getMonth()];
      revenueMap.set(monthKey, { revenue: 0, expenses: 0 });
    }
    
    // Calculate revenue from bookings
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      const monthKey = `${bookingDate.getFullYear()}-${bookingDate.getMonth()}`;
      
      if (revenueMap.has(monthKey) && 
          (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'checked-in' || booking.bookingStatus === 'checked-out')) {
        const current = revenueMap.get(monthKey)!;
        current.revenue += booking.totalAmount;
        // Estimate expenses as 60% of revenue (adjust as needed)
        current.expenses = Math.round(current.revenue * 0.6);
      }
    });
    
    // Convert to array format
    const revenueData: RevenueData[] = [];
    const now2 = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now2.getFullYear(), now2.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = monthNames[date.getMonth()];
      const data = revenueMap.get(monthKey) || { revenue: 0, expenses: 0 };
      
      revenueData.push({
        month: monthLabel,
        revenue: data.revenue,
        expenses: data.expenses,
      });
    }
    
    set({ revenueData });
  },

  // Calculate occupancy data for the last 7 days
  calculateOccupancyData: () => {
    const { rooms, bookings } = get();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const occupancyData: OccupancyData[] = [];
    
    const totalRooms = rooms.length;
    if (totalRooms === 0) {
      set({ occupancyData: [] });
      return;
    }
    
    // Calculate for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      // Count bookings that overlap with this day
      const occupiedOnDay = bookings.filter(booking => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        
        return (
          (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'checked-in') &&
          checkIn <= nextDay &&
          checkOut >= date
        );
      }).length;
      
      const occupancy = Math.round((occupiedOnDay / totalRooms) * 100);
      
      occupancyData.push({
        day: dayNames[date.getDay()],
        occupancy: Math.min(occupancy, 100), // Cap at 100%
      });
    }
    
    set({ occupancyData });
  },

  // Fetch all dashboard data
  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      await Promise.all([
        get().fetchStaff(),
        get().fetchRequests(),
        get().fetchRooms(),
        get().fetchBookings(),
      ]);
      
      // Recalculate all stats after fetching
      get().calculateStats();
      get().calculateRevenueData();
      get().calculateOccupancyData();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useManagerDashboardStore;