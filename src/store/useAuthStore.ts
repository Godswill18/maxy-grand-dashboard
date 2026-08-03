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
  refreshToken: string | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: {email: string; password: string;}) => Promise<{ success: boolean; message: string; code?: string; retryAfter?: number }>;
  signup: (userData: any) => Promise<void>;
  getMe: (silent?: boolean) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  refreshAccessToken: () => Promise<boolean>;
}

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Module-scoped (not store state) so every caller — including the global
// fetch patch in lib/authFetchPatch.ts — shares the SAME in-flight refresh
// call instead of each independently rotating the refresh token. Refresh
// tokens are single-use; two concurrent rotations of the same token would
// make the second one look like a stolen/replayed token and revoke the
// whole session family (see services/tokenService.js's reuse detection).
let refreshInFlight: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      // Initialise synchronously from localStorage so stores that call
      // useAuthStore.getState().token on first render never get null after a reload.
      token: localStorage.getItem('token'),
      refreshToken: localStorage.getItem('refreshToken'),
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
              refreshToken: data.refreshToken ?? null,
              isAuthenticated: true,
              error: null,
            });

            if (data.token) {
              localStorage.setItem("token", data.token);
            }
            if (data.refreshToken) {
              localStorage.setItem("refreshToken", data.refreshToken);
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
      getMe: async (silent = false) => {
        if (!silent) set({ isLoading: true, error: null });
        try {
          const currentToken = get().token || localStorage.getItem('token');
          const res = await fetch(`${VITE_API_URL}/api/users/get-user`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
            },
          });

          if (res.status === 401) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              token: null, 
              error: 'Unauthorized' 
            });
            localStorage.removeItem('token');
            throw new Error('Unauthorized');
          }

          const data = await res.json();

          // Backend populates hotelId as { _id, name, city... } — normalize to string
          if (data?.hotelId && typeof data.hotelId === 'object' && '_id' in data.hotelId) {
            data.hotelId = (data.hotelId as any)._id;
          }

          if (!res.ok) {
            // SHIFT_ENDED: backend confirmed staff is outside their shift — always enforce logout
            if (res.status === 403 && data.code === 'SHIFT_ENDED') {
              console.log('❌ Shift ended — session terminated by server');
              set({ user: null, isAuthenticated: false, token: null, error: data.message });
              localStorage.removeItem('token');
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
            localStorage.removeItem('token');
            throw new Error(data.message || data.error || 'Failed to fetch user');
          }

          // Helper: only update user ref when something meaningful changed
          const userChanged = (cur: any, next: any) =>
            !cur
            || cur._id         !== next._id
            || cur.role        !== next.role
            || cur.isActive    !== next.isActive
            || cur.isShiftTime !== next.isShiftTime
            || cur.firstName   !== next.firstName
            || cur.lastName    !== next.lastName
            || cur.email       !== next.email;

          // ✅ SKIP ALL CHECKS for superadmin/admin/guest
          if (data.role === 'superadmin' || data.role === 'admin' || data.role === 'guest') {
            console.log(`✅ ${data.role} access - skip all checks`);
            if (userChanged(get().user, data)) {
              set({ user: data, isAuthenticated: true });
            } else if (!get().isAuthenticated) {
              set({ isAuthenticated: true });
            }

            if (data.token) {
              localStorage.setItem('token', data.token);
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
            localStorage.removeItem('token');
            throw new Error('Your account has been deactivated');
          }

          console.log('✅ Staff access allowed');
          if (userChanged(get().user, data)) {
            set({ user: data, isAuthenticated: true });
          } else if (!get().isAuthenticated) {
            set({ isAuthenticated: true });
          }

          if (data.token) {
            localStorage.setItem('token', data.token);
            set({ token: data.token });
          }

          return data;
        } catch (error: any) {
          const message = error instanceof Error ? error.message : 'A network or server error occurred.';
          const isNetworkError = error instanceof TypeError;

          // Don't clear state for admin/superadmin
          const currentUser = get().user;
          if (currentUser?.role === 'superadmin' || currentUser?.role === 'admin') {
            set({ isLoading: false });
            return currentUser;
          }

          // Network errors (offline, DNS fail, timeout) preserve the session — a blip
          // should not log staff out. Auth failures (401/403) already cleared state
          // before reaching here.
          if (isNetworkError) {
            set({ isLoading: false });
            throw error;
          }

          set({
            error: message,
            user: null,
            isAuthenticated: false,
            token: null
          });
          localStorage.removeItem('token');
          throw error;
        } finally {
          if (!silent) set({ isLoading: false });
        }
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('token');

          if (!token) {
            set({ user: null, isAuthenticated: false, token: null });
            return false;
          }

          const user = await get().getMe();
          return !!user;
        } catch {
          set({ user: null, isAuthenticated: false, token: null });
          localStorage.removeItem('token');
          return false;
        }
      },

      logout: async () => {
        set({ isLoading: true, error: null });
        const currentRefreshToken = get().refreshToken || localStorage.getItem('refreshToken');
        try {
          await fetch(`${VITE_API_URL}/api/users/logout-user`, {
            credentials: 'include',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: currentRefreshToken }),
          });
        } catch (err: any) {
          console.error('Logout API call failed:', err.message);
        } finally {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          set({
            user: null,
            isLoading: false,
            error: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false
          });
        }
      },

      // Rotates the stored refresh token for a fresh access+refresh pair.
      // Shares one in-flight call across every caller (see refreshInFlight
      // above) so concurrent 401s never double-rotate the same token.
      // Returns false — never throws — on any failure, since callers treat
      // "couldn't refresh" as "fall back to today's behavior" (hard logout).
      refreshAccessToken: async () => {
        if (refreshInFlight) return refreshInFlight;

        refreshInFlight = (async () => {
          try {
            const currentRefreshToken = get().refreshToken || localStorage.getItem('refreshToken');
            if (!currentRefreshToken) return false;

            const response = await fetch(`${VITE_API_URL}/api/users/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ refreshToken: currentRefreshToken }),
            });

            if (!response.ok) return false;
            const data = await response.json();
            if (!data.success || !data.token) return false;

            localStorage.setItem('token', data.token);
            if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
            set({
              token: data.token,
              refreshToken: data.refreshToken ?? get().refreshToken,
            });
            return true;
          } catch {
            return false;
          } finally {
            refreshInFlight = null;
          }
        })();

        return refreshInFlight;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
    }
  )
);