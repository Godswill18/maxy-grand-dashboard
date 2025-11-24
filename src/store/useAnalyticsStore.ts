// src/store/useAnalyticsStore.ts

import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from './useAuthStore';

// --- Type Definitions ---
interface QuickStats {
    totalRevenue: number;
    totalBookings: number;
    avgOccupancy: number; // Placeholder for now
    avgRating: number;    // Placeholder for now
}

interface MonthlyData {
    month: string;
    revenue: number;
    bookings: number;
}

interface RoomTypeData {
    type: string;
    value: number; // Absolute revenue
}

interface SatisfactionData {
    _id: number; // Rating (e.g., 1 to 5)
    count: number;
}

interface AnalyticsState {
    quickStats: QuickStats;
    monthlyRevenue: MonthlyData[];
    roomTypeRevenue: RoomTypeData[];
    customerSatisfaction: SatisfactionData[];
    isLoading: boolean;
    error: string | null;
    fetchBranchAnalytics: () => Promise<void>;
}

// --- Store Implementation ---
const getToken = () => useAuthStore.getState().token;
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const initialQuickStats: QuickStats = {
    totalRevenue: 0,
    totalBookings: 0,
    avgOccupancy: 0,
    avgRating: 0,
};

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
    quickStats: initialQuickStats,
    monthlyRevenue: [],
    roomTypeRevenue: [],
    customerSatisfaction: [],
    isLoading: false,
    error: null,

    fetchBranchAnalytics: async () => {
        const { user } = useAuthStore.getState();
        if (!user || !user.hotelId) {
            set({ error: "User is not associated with a hotel.", isLoading: false });
            toast.warning("Cannot fetch analytics: Hotel ID is missing.");
            return;
        }

        set({ isLoading: true, error: null });
        try {
            const token = getToken();
            
            // NOTE: Use the new dedicated route
            const response = await axios.get(`${VITE_API_URL}/api/analytics/branch-data`, {
                headers: { Authorization: `Bearer ${token}` },
                withCredentials: true,
            });

            const data = response.data.data;

            set({
                quickStats: data.quickStats,
                monthlyRevenue: data.monthlyRevenue,
                roomTypeRevenue: data.roomTypeRevenue,
                customerSatisfaction: data.customerSatisfaction,
                isLoading: false,
            });
        } catch (err) {
            const error = err as AxiosError;
            const errorMessage = error.message || 'Failed to load branch analytics.';
            set({ error: errorMessage, isLoading: false });
            toast.error(errorMessage);
        }
    },
}));