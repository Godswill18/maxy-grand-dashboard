/**
 * @file getProfileRoute.ts
 * @description Utility function to get role-based routes for all profile-related pages
 * Handles: profile, update, change-password, settings, etc.
 */

/**
 * Role-based route mapping for all user pages
 * Supports multiple route types per role
 */
export const roleRoutes: Record<string, Record<string, string>> = {
  superadmin: {
    dashboard: '/',
    profile: '/profile',
    profileUpdate: '/profile/update',
    changePassword: '/profile/change-password',
    settings: '/settings',
  },
  waiter: {
    dashboard: '/waiter',
    profile: '/waiter/profile',
    profileUpdate: '/waiter/profile/update',
    changePassword: '/waiter/profile/change-password',
    settings: '/waiter/settings',
  },
  headWaiter: {
    dashboard: '/waiter',
    profile: '/waiter/profile',
    profileUpdate: '/waiter/profile/update',
    changePassword: '/waiter/profile/change-password',
    settings: '/waiter/settings',
  },
  admin: {
    dashboard: '/manager',
    profile: '/manager/profile',
    profileUpdate: '/manager/profile/update',
    changePassword: '/manager/profile/change-password',
    settings: '/manager/settings',
  },
  cleaner: {
    dashboard: '/cleaner',
    profile: '/cleaner/profile',
    profileUpdate: '/cleaner/profile/update',
    changePassword: '/cleaner/profile/change-password',
    settings: '/cleaner/settings',
  },
  receptionist: {
    dashboard: '/receptionist',
    profile: '/receptionist/profile',
    profileUpdate: '/receptionist/profile/update',
    changePassword: '/receptionist/profile/change-password',
    settings: '/receptionist/settings',
  },
};

/**
 * Get a specific route for a user's role
 * @param role - The user's role
 * @param routeType - The type of route needed
 * @returns The full route path
 */
export const getRoleRoute = (
  role: string,
  routeType:
    | 'dashboard'
    | 'profile'
    | 'profileUpdate'
    | 'changePassword'
    | 'settings' = 'profile'
): string => {
  const routes = roleRoutes[role];
  if (!routes) {
    return '/'; // Fallback to root
  }
  return routes[routeType] || '/';
};

/**
 * Get profile page route (shorthand)
 * @param role - The user's role
 * @returns Profile page route
 */
export const getProfileRoute = (role: string): string => {
  return getRoleRoute(role, 'profile');
};

/**
 * Get profile update page route
 * @param role - The user's role
 * @returns Profile update page route
 */
export const getProfileUpdateRoute = (role: string): string => {
  return getRoleRoute(role, 'profileUpdate');
};

/**
 * Get change password page route
 * @param role - The user's role
 * @returns Change password page route
 */
export const getChangePasswordRoute = (role: string): string => {
  return getRoleRoute(role, 'changePassword');
};

/**
 * Get settings page route
 * @param role - The user's role
 * @returns Settings page route
 */
export const getSettingsRoute = (role: string): string => {
  return getRoleRoute(role, 'settings');
};

/**
 * Get dashboard route for a role
 * @param role - The user's role
 * @returns Dashboard route
 */
export const getDashboardRoute = (role: string): string => {
  return getRoleRoute(role, 'dashboard');
};