import { create } from 'zustand';
import axios from 'axios';

// --- Types ---

interface HotelStub {
  _id: string;
  name: string;
}

interface BookingStub {
  confirmationCode?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface Review {
  _id: string;
  hotelId: HotelStub;
  bookingId?: BookingStub;
  guestName: string;
  rating: number;
  comment: string;
  title?: string | null;
  serviceRating?: number | null;
  cleanlinessRating?: number | null;
  wouldRecommend?: boolean | null;
  createdAt: string;
}

interface ReviewState {
  reviews: Review[];
  hotels: HotelStub[];
  selectedHotelId: string;    // 'all' or a hotel _id
  ratingFilter: number | null; // null = all ratings
  startDate: string;           // ISO date string or ''
  endDate: string;
  isLoading: boolean;
  error: string | null;
}

interface ReviewActions {
  fetchHotels: () => Promise<void>;
  fetchReviews: (role?: string) => Promise<void>;
  setHotelFilter: (hotelId: string, role?: string) => void;
  setRatingFilter: (rating: number | null, role?: string) => void;
  setDateRange: (start: string, end: string, role?: string) => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${sessionStorage.getItem('token')}`,
});

// --- Store ---

export const useReviewStore = create<ReviewState & { actions: ReviewActions }>(
  (set, get) => ({
    reviews: [],
    hotels: [],
    selectedHotelId: 'all',
    ratingFilter: null,
    startDate: '',
    endDate: '',
    isLoading: false,
    error: null,

    actions: {
      fetchHotels: async () => {
        try {
          const response = await axios.get<HotelStub[]>(
            `${VITE_API_URL}/api/hotels/list`,
            { headers: getAuthHeaders(), withCredentials: true }
          );
          set({ hotels: response.data });
        } catch (err: any) {
          console.error('Failed to fetch hotels:', err);
        }
      },

      /**
       * Fetches reviews.
       * - Branch manager (role='admin') → GET /api/reviews/branch (server-enforced hotel filter)
       * - Superadmin                   → GET /api/reviews (with optional hotelId param)
       */
      fetchReviews: async (role?: string) => {
        set({ isLoading: true, error: null });
        const { selectedHotelId, ratingFilter, startDate, endDate } = get();

        const params = new URLSearchParams();

        if (role !== 'admin' && selectedHotelId && selectedHotelId !== 'all') {
          params.set('hotelId', selectedHotelId);
        }
        if (ratingFilter !== null) params.set('rating', String(ratingFilter));
        if (startDate) params.set('startDate', startDate);
        if (endDate)   params.set('endDate', endDate);

        const endpoint = role === 'admin' ? '/api/reviews/branch' : '/api/reviews/';
        const query = params.toString() ? `?${params.toString()}` : '';
        const url = `${VITE_API_URL}${endpoint}${query}`;

        try {
          const response = await axios.get<{ success: boolean; data: Review[] }>(url, {
            headers: getAuthHeaders(),
            withCredentials: true,
          });
          // Handle both old array response and new {success, data} shape
          const data = Array.isArray(response.data)
            ? response.data
            : response.data.data ?? [];
          set({ reviews: data, isLoading: false });
        } catch (err: any) {
          const error = err.response?.data?.message || err.message;
          set({ isLoading: false, error });
        }
      },

      setHotelFilter: (hotelId: string, role?: string) => {
        set({ selectedHotelId: hotelId });
        get().actions.fetchReviews(role);
      },

      setRatingFilter: (rating: number | null, role?: string) => {
        set({ ratingFilter: rating });
        get().actions.fetchReviews(role);
      },

      setDateRange: (start: string, end: string, role?: string) => {
        set({ startDate: start, endDate: end });
        get().actions.fetchReviews(role);
      },
    },
  })
);

// --- Custom Hooks ---

export const useReviewState = () => ({
  reviews:        useReviewStore((s) => s.reviews),
  hotels:         useReviewStore((s) => s.hotels),
  selectedHotelId: useReviewStore((s) => s.selectedHotelId),
  ratingFilter:   useReviewStore((s) => s.ratingFilter),
  startDate:      useReviewStore((s) => s.startDate),
  endDate:        useReviewStore((s) => s.endDate),
  isLoading:      useReviewStore((s) => s.isLoading),
  error:          useReviewStore((s) => s.error),
});

export const useReviewActions = () => useReviewStore((s) => s.actions);
