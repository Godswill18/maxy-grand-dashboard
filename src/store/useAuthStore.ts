import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Define the shape of the User object based on your backend response
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'superadmin' | 'admin' | 'waiter' | 'headWaiter' | 'cleaner' | 'receptionist' | 'guest';
  hotelId?: string;
  token?: string;
  isActive?: boolean; // Add isActive field
}

// Define the shape of the store's state
interface AuthState {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: {email: string; password: string;}) => Promise<{ success: boolean; message: string; code?: string }>;
  signup: (userData: any) => Promise<void>;
  getMe: () => Promise<User>;
  logout: () => Promise<void>;
}

// Define the API base URL
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      token: null,
      isAuthenticated: false,
      error: null,

      // --- LOGIN ACTION (UPDATED) ---
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
          
          // ✅ Handle successful login
          if (response.ok && data.success) {
            set({
              user: data.data as User,
              token: data.token,
              isAuthenticated: true,
              error: null,
            });

            if (data.token) {
              sessionStorage.setItem("token", data.token);
            }
            
            return { 
              success: true, 
              message: data.message || "Login successful" 
            };
          }

          // ❌ Handle inactive account (403 status)
          if (response.status === 403 && data.code === 'ACCOUNT_INACTIVE') {
            set({ 
              error: data.message,
              user: null,
              isAuthenticated: false,
              token: null 
            });
            return { 
              success: false, 
              message: data.message,
              code: 'ACCOUNT_INACTIVE'
            };
          }

          // ❌ Handle other errors
          const errorMessage = data.message || data.error || "Login failed";
          set({ 
            error: errorMessage,
            user: null,
            isAuthenticated: false,
            token: null 
          });
          
          return { 
            success: false, 
            message: errorMessage 
          };

        } catch (error) {
          const message = error instanceof Error ? error.message : "A network or server error occurred.";
          set({ 
            error: message,
            user: null,
            isAuthenticated: false,
            token: null 
          });
          return { 
            success: false, 
            message 
          };
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

          set({ isLoading: false });
        } catch (err: any) {
          set({ isLoading: false, error: err.message });
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
            set({ 
              user: null, 
              isAuthenticated: false, 
              token: null, 
              error: 'Unauthorized' 
            });
            sessionStorage.removeItem('token');
            throw new Error('Unauthorized');
          }

          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || 'Failed to fetch user');
          }

          // Check if user is active
          if (data.isActive === false) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              token: null, 
              error: 'Account is inactive' 
            });
            sessionStorage.removeItem('token');
            throw new Error('Account has been deactivated');
          }

          set({ 
            user: data, 
            isAuthenticated: true 
          });
          
          if (data.token) {
            sessionStorage.setItem('token', data.token);
            set({ token: data.token });
          }
          
          return data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'A network or server error occurred.';
          set({ 
            error: message, 
            user: null, 
            isAuthenticated: false, 
            token: null 
          });
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
          await fetch(`${VITE_API_URL}/api/users/logout-user`, {
            credentials: 'include',
            method: 'POST',
          });
          sessionStorage.removeItem('token');
        } catch (err: any) {
          console.error('Logout API call failed:', err.message);
          sessionStorage.removeItem('token');
        } finally {
          sessionStorage.removeItem('token');
          set({ 
            user: null, 
            isLoading: false, 
            error: null, 
            token: null, 
            isAuthenticated: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);