import { create } from 'zustand';
import { socket } from '../lib/socket';
import { useAuthStore } from './useAuthStore';

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

interface OccupancyDay {
  date: string;
  day: string;
  occupancy: number;
}

interface OccupancyTrend {
  series: OccupancyDay[];
  todayOccupancy: number;
  weeklyAverage: number;
  previousWeekAverage: number;
  totalRooms: number;
  model: 'v2' | 'legacy' | null;
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

const MANAGER_DASHBOARD_TTL = 2 * 60 * 1000; // 2 minutes

interface ManagerDashboardState {
  // Data
  staff: StaffMember[];
  requests: Request[];
  rooms: Room[];
  bookings: Booking[];
  stats: DashboardStats;
  revenueData: RevenueData[];
  occupancy: OccupancyTrend | null;
  isLoadingOccupancy: boolean;

  lastFetched: number | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardData: (force?: boolean) => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchRequests: () => Promise<void>;
  fetchRooms: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  fetchOccupancy: () => Promise<void>;
  calculateStats: () => void;
  calculateRevenueData: () => void;
  initSocketListeners: () => void;
  closeSocketListeners: () => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Module-level handler refs so closeSocketListeners only removes THIS
// store's handlers — same pattern as useMaintenanceStore.ts/useHousekeepingStore.ts.
let _mgrConnectHandler: (() => void) | null = null;
let _mgrRoomUnitHandler: (() => void) | null = null;
let _mgrRoomHandler: (() => void) | null = null;
let _mgrBookingHandler: (() => void) | null = null;
let _mgrOccupancyDebounce: ReturnType<typeof setTimeout> | null = null;

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
  occupancy: null,
  isLoadingOccupancy: false,
  isLoading: false,
  error: null,
  lastFetched: null,

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
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set({ error: (error as Error).message });
    }
  },

  // Weekly occupancy — backend-computed (handles both the legacy Room and
  // v2 RoomUnit models correctly, includes checked-out bookings for
  // already-elapsed days). Also drives the top "Occupancy Rate" StatCard.
  fetchOccupancy: async () => {
    set({ isLoadingOccupancy: true });
    try {
      const response = await fetch(`${VITE_API_URL}/api/analytics/occupancy-weekly`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch occupancy');
      const data = await response.json();
      if (data.success) {
        set((state) => ({
          occupancy: data.data,
          isLoadingOccupancy: false,
          stats: { ...state.stats, occupancyRate: data.data.todayOccupancy },
        }));
      }
    } catch (error) {
      console.error('Error fetching occupancy:', error);
      set({ isLoadingOccupancy: false, error: (error as Error).message });
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
    
    // Occupancy rate is owned by fetchOccupancy() (backend-computed, handles
    // both room models correctly) — deliberately not recomputed here from
    // the legacy-Room-only `rooms` array, which silently read 0 on any
    // hotel migrated to the v2 RoomUnit model.

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
    
    // Merge rather than replace — preserves whatever occupancyRate
    // fetchOccupancy() already set (or will set), regardless of call order.
    set((state) => ({
      stats: {
        ...state.stats,
        totalStaff,
        monthlyRevenue,
        pendingTasks,
        activeRequests,
        approvedThisMonth,
        availableRooms,
      },
    }));
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

  // Fetch all dashboard data
  fetchDashboardData: async (force = false) => {
    const { lastFetched } = get();
    if (lastFetched && Date.now() - lastFetched < MANAGER_DASHBOARD_TTL && !force) return;

    set({ isLoading: true, error: null });

    try {
      await Promise.all([
        get().fetchStaff(),
        get().fetchRequests(),
        get().fetchRooms(),
        get().fetchBookings(),
        get().fetchOccupancy(),
      ]);

      // Recalculate all stats after fetching
      get().calculateStats();
      get().calculateRevenueData();
      set({ lastFetched: Date.now() });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Live updates — this store previously had zero socket listeners, so the
  // Weekly Occupancy chart was fetch-on-mount-plus-5-minute-poll only.
  // bookingUpdated is emitted globally (unscoped), not hotel-scoped like the
  // other two, so this may debounce-refetch on another branch's booking
  // activity too — a minor inefficiency (the fetch itself is still
  // server-side hotel-scoped), not a correctness issue.
  initSocketListeners: () => {
    const hotelId = useAuthStore.getState().user?.hotelId;
    if (!hotelId) return;

    if (_mgrConnectHandler) socket.off('connect', _mgrConnectHandler);
    _mgrConnectHandler = () => socket.emit('join_hotel', hotelId);
    socket.on('connect', _mgrConnectHandler);
    if (socket.connected) socket.emit('join_hotel', hotelId);

    const debouncedRefetch = () => {
      if (_mgrOccupancyDebounce) clearTimeout(_mgrOccupancyDebounce);
      _mgrOccupancyDebounce = setTimeout(() => {
        get().fetchOccupancy();
        get().fetchRooms();
        get().fetchBookings();
      }, 1500);
    };

    if (_mgrRoomUnitHandler) socket.off('roomUnitUpdated', _mgrRoomUnitHandler);
    _mgrRoomUnitHandler = debouncedRefetch;
    socket.on('roomUnitUpdated', _mgrRoomUnitHandler);

    if (_mgrRoomHandler) socket.off('roomUpdated', _mgrRoomHandler);
    _mgrRoomHandler = debouncedRefetch;
    socket.on('roomUpdated', _mgrRoomHandler);

    if (_mgrBookingHandler) socket.off('bookingUpdated', _mgrBookingHandler);
    _mgrBookingHandler = debouncedRefetch;
    socket.on('bookingUpdated', _mgrBookingHandler);
  },

  closeSocketListeners: () => {
    if (_mgrConnectHandler) socket.off('connect', _mgrConnectHandler);
    if (_mgrRoomUnitHandler) socket.off('roomUnitUpdated', _mgrRoomUnitHandler);
    if (_mgrRoomHandler) socket.off('roomUpdated', _mgrRoomHandler);
    if (_mgrBookingHandler) socket.off('bookingUpdated', _mgrBookingHandler);
    if (_mgrOccupancyDebounce) clearTimeout(_mgrOccupancyDebounce);
    _mgrConnectHandler = null;
    _mgrRoomUnitHandler = null;
    _mgrRoomHandler = null;
    _mgrBookingHandler = null;
    _mgrOccupancyDebounce = null;
  },
}));

export default useManagerDashboardStore;