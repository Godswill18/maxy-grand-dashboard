// src/store/useAnalyticsStore.ts

import { create } from 'zustand';
import { toast } from 'sonner';

// --- Type Definitions ---
interface QuickStats {
    totalRevenue: number;
    totalBookings: number;
    avgOccupancy: number;
    avgRating: number;
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
        set({ isLoading: true, error: null });
        
        try {
            const response = await fetch(`${VITE_API_URL}/api/analytics/branch-data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies/sessions
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch analytics');
            }

            const result = await response.json();
            
            if (result.success) {
                set({
                    quickStats: result.data.quickStats,
                    monthlyRevenue: result.data.monthlyRevenue,
                    roomTypeRevenue: result.data.roomTypeRevenue,
                    customerSatisfaction: result.data.customerSatisfaction,
                    isLoading: false,
                    error: null,
                });
            } else {
                throw new Error(result.message || 'Failed to load analytics');
            }
        } catch (err) {
            const error = err as Error;
            const errorMessage = error.message || 'Failed to load branch analytics.';
            
            set({ 
                error: errorMessage, 
                isLoading: false 
            });
            
            toast.error(errorMessage);
            console.error('Error fetching analytics:', error);
        }
    },
}));