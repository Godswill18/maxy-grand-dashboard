import { create } from 'zustand';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';
// import { shallow } from 'zustand/react/shallow';

// --- 1. Define Types ---
export type ReportPeriod = 'day' | 'month' | 'year';

export interface TimeSeriesData {
  label: string; // e.g., "2025-11-12" or "2025-11" or "2025"
  totalRevenue: number;
  totalBookings: number;
}

export interface SourceData {
  name: string; // e.g., "Direct", "Walk-in"
  value: number;
}

interface ReportState {
  timeseriesData: TimeSeriesData[];
  sourceData: SourceData[];
  period: ReportPeriod;
  isLoading: boolean;
  error: string | null;
  socket: Socket | null;
}

interface ReportActions {
  setPeriod: (period: ReportPeriod) => void;
  fetchReportData: () => Promise<void>;
  initSocket: (backendUrl: string) => void;
  disconnectSocket: () => void;
  exportToExcel: () => void;
}

// TODO: You MUST send an auth token (e.g., from a user/auth store)
const getAuthHeaders = () => {
  // const token = useAuthStore.getState().token;
  // return { Authorization: `Bearer ${token}` };
  return {
    // 'Authorization': `Bearer YOUR_TOKEN_HERE`
  };
};

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// --- 2. Create the Store ---
export const useReportStore = create<ReportState & { actions: ReportActions }>(
  (set, get) => ({
    // --- Initial State ---
    timeseriesData: [],
    sourceData: [],
    period: 'month', // Default period
    isLoading: false,
    error: null,
    socket: null,

    // --- Actions ---
    actions: {
      /**
       * Sets the time period and triggers a data refetch.
       */
      setPeriod: (period) => {
        set({ period, isLoading: true }); // Set new period
        get().actions.fetchReportData(); // Fetch data for the new period
      },

      /**
       * Fetches new data from the backend based on the current period.
       */
      fetchReportData: async () => {
        set({ isLoading: true, error: null });
        const { period } = get();
        try {
          const response = await axios.get(
            `${VITE_API_URL}/api/reports/analytics?period=${period}`,
            {
              headers: getAuthHeaders(),
              withCredentials: true,
            }
          );
          set({
            timeseriesData: response.data.timeseries || [],
            sourceData: response.data.sources || [],
            isLoading: false,
          });
        } catch (err: any) {
          const error = err.response?.data?.message || err.message;
          set({ isLoading: false, error });
        }
      },

      /**
       * Initializes the socket connection and sets up listeners.
       */
      initSocket: (backendUrl) => {
        if (get().socket) return; // Prevent multiple connections

        const newSocket = io(backendUrl, {
          // You might need auth here
          // query: { token: useAuthStore.getState().token }
        });

        newSocket.on('connect', () => {
          console.log('Socket.io connected for reports.');
        });

        newSocket.on('report:update', () => {
          console.log('Report update received from server. Refetching data...');
          get().actions.fetchReportData();
        });

        newSocket.on('disconnect', () => {
          console.log('Socket.io disconnected.');
        });

        set({ socket: newSocket });
      },

      /**
       * Disconnects the socket.
       */
      disconnectSocket: () => {
        get().socket?.disconnect();
        set({ socket: null });
      },

      /**
       * Exports the current timeseries data to a CSV file.
       */
      exportToExcel: () => {
        const { timeseriesData, period } = get();
        if (timeseriesData.length === 0) {
          alert('No data to export.');
          return;
        }

        const headers = ['Period', 'TotalRevenue', 'TotalBookings'];
        const rows = timeseriesData.map((row) => [
          row.label,
          row.totalRevenue,
          row.totalBookings,
        ]);

        let csvContent =
          'data:text/csv;charset=utf-8,' +
          [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `hotel_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
    },
  })
);

// --- Custom Hooks for easier access ---
// FIX: Add 'shallow' to the selector to prevent infinite loops
// export const useReportState = () =>
//   useReportStore(
//     (state) => ({
//       timeseriesData: state.timeseriesData,
//       sourceData: state.sourceData,
//       period: state.period,
//       isLoading: state.isLoading,
//       error: state.error,
//     }),
//     shallow // ✅ No more type error
//   );

  export const useReportState = () => ({
  timeseriesData: useReportStore((s) => s.timeseriesData),
  sourceData: useReportStore((s) => s.sourceData),
  period: useReportStore((s) => s.period),
  isLoading: useReportStore((s) => s.isLoading),
  error: useReportStore((s) => s.error),
});


export const useReportActions = () => useReportStore((state) => state.actions);