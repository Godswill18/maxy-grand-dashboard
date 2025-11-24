// src/store/useStaffStore.ts
import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from './useAuthStore'; 

// Define the shape of staff data based on the backend response
type StaffRole = 'receptionist' | 'cleaner' | 'waiter' | 'admin' | 'guest' | 'superadmin'; 

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: StaffRole;
  isActive?: boolean;
  hotelId?: string;
  createdAt: string;
  password?: string; // Included for staff creation
}

// Define the state and actions for the store
interface StaffState {
  staff: Staff[];
  isLoading: boolean;
  error: string | null;
  fetchStaff: () => Promise<void>;
  fetchStaffByLoggedInUserHotel: () => Promise<void>; 
  updateStaffStatus: (staffId: string, isActive: boolean) => Promise<void>;
  updateStaffRole: (staffId: string, newRole: StaffRole) => Promise<void>;
  // Re-added the createStaff function for completeness, assuming you need it later
  createStaff: (staffData: Partial<Staff>) => Promise<Staff | undefined>;
}

// Helper to get auth token
const getToken = () => useAuthStore.getState().token; 
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useStaffStore = create<StaffState>((set, get) => ({
  staff: [],
  isLoading: false,
  error: null,

  /**
   * @desc Fetches all staff members (all roles except guest/superadmin)
   */
  fetchStaff: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const response = await axios.get(`${VITE_API_URL}/api/users/get-all-staff`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      set({ staff: response.data.data, isLoading: false });
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
      toast.error('Failed to fetch all staff');
    }
  },

  /**
   * @desc Fetches all staff members for the logged-in user's hotel.
   * NOTE: This action replaces the old 'fetchStaffInHotel(hotelId: string)'.
   */
  fetchStaffByLoggedInUserHotel: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const userHotelId = useAuthStore.getState().user?.hotelId;

      if (!userHotelId) {
        toast.warning('Logged-in user has no hotel association.');
        set({ isLoading: false });
        return;
      }

      // We assume a new backend route that doesn't require a URL param, 
      // or we can reuse the old route if your backend is configured to ignore the param 
      // when it's available in req.user. The safest approach is a new, dedicated route.
      // Assuming a new dedicated route: /api/users/get-staff-by-my-hotel
      const response = await axios.get(`${VITE_API_URL}/api/users/get-hotel-staffs`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      set({ staff: response.data.data, isLoading: false });
    } catch (err) {
      const error = err as AxiosError;
      set({ error: error.message, isLoading: false });
      toast.error('Failed to fetch staff for your hotel');
    }
  },
  
  // The rest of the functions (updateStaffStatus, updateStaffRole, createStaff) remain the same or are based on the previous corrected version.

  /**
   * @desc Updates the isActive status of a staff member
   */
  updateStaffStatus: async (staffId: string, isActive: boolean) => {
    try {
      const token = getToken();
      const response = await axios.put(`${VITE_API_URL}/api/users/update-staff-status/${staffId}`, { isActive }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      set((state) => ({
        staff: state.staff.map((s) => s._id === staffId ? { ...s, isActive: response.data.data.isActive } : s),
      }));
      
      toast.success(`Staff status updated to ${isActive ? 'Active' : 'Inactive'}`);
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.message;
      toast.error(`Failed to update staff status: ${errorMessage}`);
    }
  },

  /**
   * @desc Updates the role of a staff member
   */
  updateStaffRole: async (staffId: string, newRole: StaffRole) => {
    try {
      const token = getToken();
      const response = await axios.put(`${VITE_API_URL}/api/users/update-staff-role/${staffId}`, { newRole }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      set((state) => ({
        staff: state.staff.map((s) => s._id === staffId ? { ...s, role: response.data.data.role } : s),
      }));
      
      toast.success(`Staff role updated to ${newRole}`);
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage = error.message;
      toast.error(`Failed to update staff role: ${errorMessage}`);
    }
  },

  /**
   * @desc Creates a new staff user account using the existing 'signUp' backend route.
   */
  createStaff: async (staffData: Partial<Staff>) => {
    set({ isLoading: true, error: null });
    try {
      const token = getToken();
      const { user } = useAuthStore.getState();
      
      if (!staffData.password) {
        toast.error('Password is required for staff creation.');
        set({ isLoading: false });
        return;
      }

      const response = await axios.post(`${VITE_API_URL}/api/users/create-user`, {
        ...staffData,
        role: staffData.role || 'receptionist', 
        hotelId: staffData.hotelId || user?.hotelId,
      }, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });
      
      const newStaff = response.data.data;
      
      set((state) => ({
        staff: [newStaff, ...state.staff],
      }));

      toast.success('Staff created successfully');
      return newStaff;
    } catch (err) {
      const error = err as AxiosError;
      const errorMessage =  error.message;
      toast.error(`Failed to create staff: ${errorMessage}`);
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  
    return undefined;
  },
}));