import { create } from 'zustand';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export type ReportPeriod = 'day' | 'week' | 'month' | 'year';

export interface TimeSeriesData {
  label: string;
  totalRevenue: number;
  totalBookings: number;
}

export interface SourceData {
  name: string;
  value: number;
}

export interface BranchTimeSeries {
  branchId: string;
  branchName: string;
  timeseries: TimeSeriesData[];
}

interface ReportState {
  timeseriesData:   TimeSeriesData[];
  sourceData:       SourceData[];
  period:           ReportPeriod;
  isLoading:        boolean;
  error:            string | null;
  socket:           Socket | null;
  selectedHotelId:  string | null;
  branchComparison: BranchTimeSeries[];
  isBranchLoading:  boolean;
}

interface ReportActions {
  setPeriod:             (period: ReportPeriod) => void;
  fetchReportData:       () => Promise<void>;
  initSocket:            (backendUrl: string) => void;
  disconnectSocket:      () => void;
  exportToExcel:         () => void;
  setSelectedHotel:      (id: string | null) => void;
  fetchBranchComparison: (weeks?: number) => Promise<void>;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useReportStore = create<ReportState & { actions: ReportActions }>(
  (set, get) => ({
    timeseriesData:   [],
    sourceData:       [],
    period:           'month',
    isLoading:        false,
    error:            null,
    socket:           null,
    selectedHotelId:  null,
    branchComparison: [],
    isBranchLoading:  false,

    actions: {
      setPeriod: (period) => {
        set({ period, isLoading: true });
        get().actions.fetchReportData();
      },

      fetchReportData: async () => {
        set({ isLoading: true, error: null });
        const { period, selectedHotelId } = get();
        const hotelParam = selectedHotelId ? `&hotelId=${selectedHotelId}` : '';
        try {
          const response = await axios.get(
            `${VITE_API_URL}/api/reports/analytics?period=${period}${hotelParam}`,
            { withCredentials: true }
          );
          set({
            timeseriesData: response.data.timeseries || [],
            sourceData:     response.data.sources    || [],
            isLoading:      false,
          });
        } catch (err: any) {
          set({ isLoading: false, error: err.response?.data?.message || err.message });
        }
      },

      setSelectedHotel: (id) => {
        set({ selectedHotelId: id });
        get().actions.fetchReportData();
      },

      fetchBranchComparison: async (weeks = 8) => {
        set({ isBranchLoading: true });
        try {
          const response = await axios.get(
            `${VITE_API_URL}/api/reports/analytics/branches?weeks=${weeks}`,
            { withCredentials: true }
          );
          set({ branchComparison: response.data.branches || [], isBranchLoading: false });
        } catch (err: any) {
          set({ isBranchLoading: false });
        }
      },

      initSocket: (backendUrl) => {
        if (get().socket) return;
        const newSocket = io(backendUrl);
        newSocket.on('report:update', () => get().actions.fetchReportData());
        set({ socket: newSocket });
      },

      disconnectSocket: () => {
        get().socket?.disconnect();
        set({ socket: null });
      },

      exportToExcel: () => {
        const { timeseriesData, period } = get();
        if (timeseriesData.length === 0) return;
        const headers = ['Period', 'TotalRevenue', 'TotalBookings'];
        const rows = timeseriesData.map((r) => [r.label, r.totalRevenue, r.totalBookings]);
        const csv =
          'data:text/csv;charset=utf-8,' +
          [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csv));
        link.setAttribute('download', `hotel_report_${period}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
    },
  })
);

export const useReportState = () => ({
  timeseriesData:   useReportStore((s) => s.timeseriesData),
  sourceData:       useReportStore((s) => s.sourceData),
  period:           useReportStore((s) => s.period),
  isLoading:        useReportStore((s) => s.isLoading),
  error:            useReportStore((s) => s.error),
  selectedHotelId:  useReportStore((s) => s.selectedHotelId),
  branchComparison: useReportStore((s) => s.branchComparison),
  isBranchLoading:  useReportStore((s) => s.isBranchLoading),
});

export const useReportActions = () => useReportStore((state) => state.actions);
