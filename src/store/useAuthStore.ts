import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Define the shape of the User object based on your backend response
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'superadmin' | 'admin' | 'waiter' | 'cleaner' | 'receptionist'; // Use specific roles
  // Add any other user properties you need
}

// Define the shape of the store's state
interface AuthState {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: {email: string; password: string;}) => Promise<{ success: boolean; message: string }>;
  signup: (userData: any) => Promise<void>;
  getMe: () => Promise<User>;
  logout: () => Promise<void>;
}

// Define the API base URL (you can move this to a .env file)
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      token: null,
      isAuthenticated: false,
      error: null,

      // --- LOGIN ACTION ---
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${VITE_API_URL}/api/users/login-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: "include",
            body: JSON.stringify(credentials),
          });

         const data = await response.json();
          // console.log("Login response:", data); // Debug log
          if (response.ok) {
            set({
              user: data.data as User, // Correctly get user from data.data
              token: data.token,
              isAuthenticated: true,
            });
            if (data.token) {
              sessionStorage.setItem("token", data.token);
            }
            return { success: true, message: "Login successful" };
          }
          set({ error: data.message || data.error || "Login failed." });
          return { success: false, message: data.message || data.error || "Login failed." };
        } catch (error) {
          const message = error instanceof Error ? error.message : "A network or server error occurred.";
          set({ error: message });
          return { success: false, message };
        } finally {
          set({ isLoading: false });
        }
      },

      // --- SIGNUP ACTION ---
      signup: async (userData) => {
        set({ isLoading: true, error: null });
        
        // Split fullName into firstName and lastName for the backend
        const nameParts = userData.fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        try {
          const response = await fetch(`${VITE_API_URL}/api/users/create-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...userData,
              firstName,
              lastName,
            }),
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || 'Signup failed');
          }

          // NOTE: Your backend 'signUp' controller also logs the user in.
          // We set the user state here to reflect that.
          set({ isLoading: false });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
          // Re-throw the error so the component can catch it
          throw err;
        }
      },

      // --- GET ME ACTION ---
       getMe: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await fetch(`${VITE_API_URL}/api/user/get-user`, {
            method: 'GET',
            credentials: 'include',
          });

          if (res.status === 401) {
            set({ user: null, isAuthenticated: false });
            sessionStorage.removeItem('token');
            throw new Error('Unauthorized');
          }

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to fetch user');
          }

          set({ user: data, isAuthenticated: true });
          if (data.token) {
            sessionStorage.setItem('token', data.token);
          }
          return data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'A network or server error occurred.';
          set({ error: message });
          sessionStorage.removeItem('token');
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      // --- LOGOUT ACTION ---
      logout: async () => {
        set({ isLoading: true, error: null });
        try {
          // Call the backend to clear the cookie
          await fetch(`${VITE_API_URL}/api/users/logout-user`, {
            credentials: 'include',
            method: 'POST',
          });
          sessionStorage.removeItem('token');
        } catch (err: any) {
          console.error('Logout API call failed:', err.message);
          sessionStorage.removeItem('token');
        } finally {
          // Always clear the user from the store
          set({ user: null, isLoading: false, error: null });
        }
      },
    }),
    {
      name: 'auth-storage', // Name for the localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage
      partialize: (state) => ({ user: state.user }), // Only persist the 'user'
    }
  )
);