/**
 * @file getNotificationRoute.ts
 * @description Maps a notification's (role, relatedEntityType, relatedEntityId)
 * to a concrete in-app route, for click-to-navigate on both the toast and the
 * notification bell/center. Sibling to GetprofileRoute.ts, same convention.
 *
 * Built directly from App.tsx's actual mounted routes — returns null (never a
 * guessed/dead route) whenever nothing sensible exists for a given pair.
 */

type RouteBuilder = (id?: string) => string;

// role -> relatedEntityType -> route (or a builder when the id matters)
const routeTable: Record<string, Record<string, string | RouteBuilder>> = {
  superadmin: {
    booking: (id) => (id ? `/bookings?bookingId=${id}` : '/bookings'),
    room: (id) => (id ? `/rooms/${id}` : '/rooms'),
    order: '/restaurant-orders',
    request: '/requests',
    payment: '/transactions',
    shift: '/shifts',
    hotel: (id) => (id ? `/branches/${id}` : '/branches'),
    user: '/staffs',
    maintenance: (id) => (id ? `/maintenance?requestId=${id}` : '/maintenance'),
  },
  admin: {
    booking: (id) => (id ? `/manager/bookings?bookingId=${id}` : '/manager/bookings'),
    room: (id) => (id ? `/manager/rooms-type/${id}` : '/manager/rooms-type'),
    cleaning: '/manager/house-keeping',
    order: '/manager/orders',
    request: '/manager/requests',
    shift: '/manager/shifts',
    user: '/manager/staff',
    maintenance: (id) => (id ? `/manager/maintenance?requestId=${id}` : '/manager/maintenance'),
  },
  receptionist: {
    booking: (id) => (id ? `/receptionist/bookings?bookingId=${id}` : '/receptionist/bookings'),
    room: '/receptionist/rooms',
    payment: '/receptionist/payments',
    shift: '/receptionist/my-shift',
    maintenance: (id) => (id ? `/receptionist/maintenance?requestId=${id}` : '/receptionist/maintenance'),
  },
  cleaner: {
    cleaning: '/cleaner/tasks',
    room: '/cleaner/rooms',
    shift: '/cleaner/my-shift',
  },
  waiter: {
    order: (id) => (id ? `/waiter/orders/${id}` : '/waiter/orders'),
    shift: '/waiter/my-shift',
  },
  headWaiter: {
    order: (id) => (id ? `/waiter/orders/${id}` : '/waiter/orders'),
    shift: '/waiter/my-shift',
  },
};

export const getNotificationRoute = (
  role: string,
  relatedEntityType?: string,
  relatedEntityId?: string
): string | null => {
  if (!relatedEntityType) return null;
  const entry = routeTable[role]?.[relatedEntityType];
  if (!entry) return null;
  return typeof entry === 'function' ? entry(relatedEntityId) : entry;
};
