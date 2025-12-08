import { create } from 'zustand';
import axios from 'axios';
import { shallow } from 'zustand/shallow';

// --- 1. Define Types ---
interface HotelStub {
  _id: string;
  name: string;
}

export interface Review {
  _id: string;
  hotelId: HotelStub;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string; // This is an ISO date string
}

interface ReviewState {
  reviews: Review[];
  hotels: HotelStub[]; // For the filter
  selectedHotelId: string; // 'all' or a hotel _id
  isLoading: boolean;
  error: string | null;
}

interface ReviewActions {
  fetchHotels: () => Promise<void>;
  fetchReviews: () => Promise<void>;
  setHotelFilter: (hotelId: string) => void;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// TODO: You MUST send an auth token (e.g., from a user/auth store)
const getAuthHeaders = () => {
return { Authorization: `Bearer ${sessionStorage.getItem('token')}` };
};

// --- 2. Create the Store ---
export const useReviewStore = create<ReviewState & { actions: ReviewActions }>(
  (set, get) => ({
    // --- Initial State ---
    reviews: [],
    hotels: [],
    selectedHotelId: 'all',
    isLoading: false,
    error: null,

    // --- Actions ---
    actions: {
      /**
       * Fetches the list of hotels for the filter toggle
       */
      fetchHotels: async () => {
        try {
          const response = await axios.get<HotelStub[]>(
            `${VITE_API_URL}/api/hotels/list`,
            { headers: getAuthHeaders(), withCredentials: true }
          );
          set({ hotels: response.data });
        } catch (err: any) {
          console.error('Failed to fetch hotels:', err);
          // Don't set a main error, as reviews might still load
        }
      },

      /**
       * Fetches reviews based on the currently selected hotel filter
       */
      fetchReviews: async () => {
        set({ isLoading: true, error: null });
        const { selectedHotelId } = get();

        let url = `${VITE_API_URL}/api/reviews/`;
        if (selectedHotelId !== 'all') {
          url += `?hotelId=${selectedHotelId}`;
        }

        try {
          const response = await axios.get<Review[]>(url, {
            headers: getAuthHeaders(), withCredentials: true,
          });
          set({ reviews: response.data, isLoading: false });
        } catch (err: any) {
          const error = err.response?.data?.message || err.message;
          set({ isLoading: false, error });
        }
      },

      /**
       * Sets the hotel filter and triggers a refetch of reviews
       */
      setHotelFilter: (hotelId: string) => {
        set({ selectedHotelId: hotelId, isLoading: true });
        get().actions.fetchReviews(); // Refetch reviews for the new filter
      },
    },
  })
);

// --- Custom Hooks for easier access ---
export const useReviewState = () => ({
      reviews: useReviewStore((state) => state.reviews),
      hotels: useReviewStore((state) => state.hotels),
      selectedHotelId: useReviewStore((state) => state.selectedHotelId),
      isLoading: useReviewStore((state) => state.isLoading),
      error: useReviewStore((state) => state.error),
    });


//     export const useReportState = () => ({
//     timeseriesData: useReportStore((s) => s.timeseriesData),
//     sourceData: useReportStore((s) => s.sourceData),
//     period: useReportStore((s) => s.period),
//     isLoading: useReportStore((s) => s.isLoading),
//     error: useReportStore((s) => s.error),
//   });
  

export const useReviewActions = () => useReviewStore((state) => state.actions);