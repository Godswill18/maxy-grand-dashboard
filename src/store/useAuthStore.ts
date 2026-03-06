import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'superadmin' | 'admin' | 'waiter' | 'headWaiter' | 'cleaner' | 'receptionist' | 'guest';
  hotelId?: string;
  token?: string;
  isActive?: boolean;
  isShiftTime?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: {email: string; password: string;}) => Promise<{ success: boolean; message: string; code?: string; retryAfter?: number }>;
  signup: (userData: any) => Promise<void>;
  getMe: () => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      token: null,
      isAuthenticated: false,
      error: null,

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

          // Handle lockout (failed-attempt guard) or general rate limit
          if (response.status === 429) {
            const msg = data.message || 'Too many attempts. Please try again later.';
            set({ error: msg, user: null, isAuthenticated: false, token: null });
            return {
              success:    false,
              message:    msg,
              code:       data.error,        // 'LOGIN_LOCKED' or 'RATE_LIMIT_EXCEEDED'
              retryAfter: data.retryAfter,   // seconds — drives countdown timer
            };
          }

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

          if (response.status === 403 && data.code === 'ACCOUNT_DEACTIVATED') {
            set({ 
              error: data.message,
              user: null,
              isAuthenticated: false,
              token: null 
            });
            return { 
              success: false, 
              message: data.message,
              code: 'ACCOUNT_DEACTIVATED'
            };
          }

          if (response.status === 403 && data.code === 'NOT_SHIFT_TIME') {
            set({ 
              error: data.message,
              user: null,
              isAuthenticated: false,
              token: null 
            });
            return { 
              success: false, 
              message: data.message,
              code: 'NOT_SHIFT_TIME'
            };
          }

          if (response.status === 403 && data.code === 'NO_ACTIVE_SHIFT') {
            set({ 
              error: data.message,
              user: null,
              isAuthenticated: false,
              token: null 
            });
            return { 
              success: false, 
              message: data.message,
              code: 'NO_ACTIVE_SHIFT'
            };
          }

          const errorMessage = data.message || data.error || "Login failed";
          set({ 
            error: errorMessage,
            user: null,
            isAuthenticated: false,
            token: null 
          });
          
          return { 
            success: false, 
            message: errorMessage,
            code: data.code
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

      signup: async (userData) => {
        set({ isLoading: true, error: null });
        
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

      // ✅ FIXED: getMe with explicit admin skip
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
            // SHIFT_ENDED: backend confirmed staff is outside their shift — always enforce logout
            if (res.status === 403 && data.code === 'SHIFT_ENDED') {
              console.log('❌ Shift ended — session terminated by server');
              set({ user: null, isAuthenticated: false, token: null, error: data.message });
              sessionStorage.removeItem('token');
              throw new Error(data.message);
            }

            // ✅ IMPORTANT: Don't logout admin/superadmin on other 403s
            if (res.status === 403) {
              const currentUser = get().user;
              if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') {
                console.log('⚠️ 403 error for admin/superadmin - ignoring');
                return currentUser;
              }
            }

            set({
              user: null,
              isAuthenticated: false,
              token: null,
              error: data.message
            });
            sessionStorage.removeItem('token');
            throw new Error(data.message || data.error || 'Failed to fetch user');
          }

          // ✅ SKIP ALL CHECKS for superadmin/admin/guest
          if (data.role === 'superadmin' || data.role === 'admin' || data.role === 'guest') {
            console.log(`✅ ${data.role} access - skip all checks`);
            set({ 
              user: data, 
              isAuthenticated: true 
            });
            
            if (data.token) {
              sessionStorage.setItem('token', data.token);
              set({ token: data.token });
            }
            
            return data;
          }

          // ✅ Check both isActive and isShiftTime (for staff only)
          if (data.isActive === false) {
            console.log('❌ Staff account deactivated');
            set({ 
              user: null, 
              isAuthenticated: false, 
              token: null, 
              error: 'Account deactivated' 
            });
            sessionStorage.removeItem('token');
            throw new Error('Your account has been deactivated');
          }

          if (data.isShiftTime === false) {
            console.log('❌ Staff shift time ended');
            set({ 
              user: null, 
              isAuthenticated: false, 
              token: null, 
              error: 'Shift time ended' 
            });
            sessionStorage.removeItem('token');
            throw new Error('Your shift time has ended');
          }

          console.log('✅ Staff access allowed');
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
          
          // ✅ Don't clear state for admin/superadmin
          const currentUser = get().user;
          if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') {
            console.log('⚠️ Error for admin/superadmin - preserving state');
            set({ isLoading: false });
            return currentUser;
          }
          
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

      // ✅ FIXED: checkAuth with admin skip
      checkAuth: async () => {
        try {
          const token = sessionStorage.getItem('token');
          
          if (!token) {
            // ✅ Check if current user is admin before logging out
            const currentUser = get().user;
            if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') {
              console.log('⚠️ No token but admin/superadmin - keeping logged in');
              return true;
            }
            
            set({ 
              user: null, 
              isAuthenticated: false, 
              token: null 
            });
            return false;
          }

          const user = await get().getMe();
          return !!user;
        } catch (error) {
          // ✅ Don't logout admin/superadmin on error
          const currentUser = get().user;
          if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') {
            console.log('⚠️ Auth check error for admin/superadmin - keeping logged in');
            return true;
          }
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            token: null 
          });
          sessionStorage.removeItem('token');
          return false;
        }
      },

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