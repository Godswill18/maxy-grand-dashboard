import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from "react-router-dom";

// Import the ONE layout
import { DashboardLayout } from "./components/DashboardLayout";
// Import the auth store
import { useAuthStore } from "./store/useAuthStore";
// ✅ Import force logout hook
import { useForceLogout } from "./store/useForceLogout";
// ✅ Import NotificationProvider
import { NotificationProvider } from "./contexts/NotificationContext";

// Import the navigation arrays
import {
  superAdminNav,
  waiterNav,
  managerNav,
  cleanerNav,
  receptionistNav,
} from "./config/navigation";

// --- Import ALL your pages ---
import Dashboard from "./pages/superAdmin/Dashboard";
import Staffs from "./pages/superAdmin/Staffs";
import Users from "./pages/superAdmin/Users";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import Orders from "./pages/waiter/Orders";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import CleanerDashboard from "./pages/cleaner/CleanerDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import Reviews from "./pages/superAdmin/Reviews";
import TipsPerformance from "./pages/waiter/TipsPerformance";
import ManagerSettings from "./pages/manager/ManagerSettings";
import CleanerPerformance from "./pages/cleaner/CleanerPerformance";
import PaymentProcessing from "./pages/receptionist/PaymentProcessing";
import Rooms from "./pages/superAdmin/Rooms";
import Bookings from "./pages/superAdmin/Bookings";
import Cleaners from "./pages/superAdmin/Cleaners";
import Transactions from "./pages/superAdmin/Transactions";
import Requests from "./pages/superAdmin/Requests";
import Reports from "./pages/superAdmin/Reports";
import Branches from "./pages/superAdmin/Branches";
import Tables from "./pages/waiter/Tables";
import Menu from "./pages/waiter/Menu";
import Reservations from "./pages/waiter/Reservations";
import StaffManagement from "./pages/manager/StaffManagement";
import BranchAnalytics from "./pages/manager/BranchAnalytics";
import ManagerRequests from "./pages/manager/ManagerRequests";
import Operations from "./pages/manager/Operations";
import CleaningTasks from "./pages/cleaner/CleaningTasks";
import RoomStatus from "./pages/cleaner/RoomStatus";
import TaskHistory from "./pages/cleaner/TaskHistory";
import CheckInOut from "./pages/receptionist/CheckInOut";
import RoomReceptionist from "./pages/receptionist/RoomReceptionist";
import BookingManagement from "./pages/receptionist/BookingManagement";
import BranchDetails from "./pages/superAdmin/BranchDetails";
import Settings from "./pages/superAdmin/Settings";
import RoomDetailPage from "./pages/superAdmin/RoomDetails";
import Housekeeping from "./pages/manager/HouseKeeping";
import Restaurant from "./pages/manager/Restaurant";
import BookingCalendar from "./pages/receptionist/Bookingcalendar";
import OrderDetail from "./pages/waiter/Orderdetail";
import ShiftScheduler from "./pages/superAdmin/ShiftScheduler";
import MySchedule from "./pages/Myschedule";
import GalleryManagement from "./pages/superAdmin/GalleryManagement";
import BlogManagement from "./pages/superAdmin/Blogmanagement";
import CategoryManagement from "./pages/superAdmin/CategoryManagement";
import StaffProfile from "./pages/StaffProfile";
import ProfileUpdate from "./pages/Profileupdate";
import ChangePassword from "./pages/Changepassword";
import Announcements from "./pages/superAdmin/Announcements";
import ManagerAnnouncements from "./pages/manager/Announcements";

const queryClient = new QueryClient();

/**
 * A layout component that selects the correct navigation and user info
 * based on the role of the currently logged-in user.
 */
const RoleBasedLayout = () => {
  const { user } = useAuthStore();

  // This should not happen if routes are protected, but as a safeguard
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  let nav: any[], userName: string, userRole: string;

  switch (user.role as string) {
    case 'superadmin':
      nav = superAdminNav;
      userName = `${user.firstName} ${user.lastName}`;
      userRole = 'Super Admin';
      break;
    case 'waiter':
      nav = waiterNav;
      userName = `${user.firstName} ${user.lastName}`;
      userRole = 'Waiter';
      break;
    case 'headWaiter':
      nav = waiterNav;
      userName = `${user.firstName} ${user.lastName}`;
      userRole = 'Head Waiter';
      break;
    case 'admin':
      nav = managerNav;
      userName = `${user.firstName} ${user.lastName}`;
      userRole = 'Branch Manager';
      break;
    case 'cleaner':
      nav = cleanerNav;
      userName = `${user.firstName} ${user.lastName}`;
      userRole = 'Housekeeping';
      break;
    case 'receptionist':
      nav = receptionistNav;
      userName = `${user.firstName} ${user.lastName}`;
      userRole = 'Front Desk';
      break;
    default:
      // Fallback for unknown roles
      nav = [];
      userName = 'Unknown User';
      userRole = 'Unknown Role';
  }

  return (
    <DashboardLayout navigation={nav} userName={userName} userRole={userRole}>
      <Outlet />
    </DashboardLayout>
  );
};

/**
 * ✅ CRITICAL: Main layout component that wraps authenticated routes
 * This component listens for force logout events from the backend
 * When a staff member's shift ends, they will be automatically logged out
 */
const STAFF_ROLES = ['receptionist', 'cleaner', 'waiter', 'headWaiter'];

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  // ✅ Primary: Socket listener — reacts instantly when cron/admin emits force:logout
  useForceLogout();

  const { user, getMe } = useAuthStore();
  const navigate = useNavigate();

  // ✅ Fallback: Poll getMe() every 5 minutes for staff only.
  // Catches sessions that survived a missed socket event (brief offline, reconnect, etc.)
  // getMe() already clears auth state if isActive===false or isShiftTime===false,
  // so throwing here means we just need to redirect.
  useEffect(() => {
    if (!user || !STAFF_ROLES.includes(user.role)) return;

    const interval = setInterval(async () => {
      try {
        await getMe();
      } catch {
        navigate('/login', { replace: true });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user?.role]);

  return <>{children}</>;
}

/**
 * A component to protect routes. It checks if a user is logged in.
 * If yes, it wraps the layout with AuthenticatedLayout (force logout listener)
 * If no, it redirects to the /login page.
 */
function ProtectedRoutes() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Wrap with AuthenticatedLayout to enable force logout
  return (
    <AuthenticatedLayout>
      <RoleBasedLayout />
    </AuthenticatedLayout>
  );
}

/**
 * A component to handle routes that should only be accessible
 * when the user is LOGGED OUT (like Login and Signup).
 */
const PublicRoutes = () => {
  const { user } = useAuthStore();
  // If the user is logged in, redirect them to the root.
  // The new <RoleBasedRoot> component at "/" will handle the rest.
  return !user ? <Outlet /> : <Navigate to="/" replace />;
};

/**
 * This component is rendered at the root path ("/") for logged-in users.
 * It checks the user's role and renders the correct dashboard or
 * redirects them to their specific dashboard.
 */
const RoleBasedRoot = () => {
  const { user } = useAuthStore();

  if (!user) {
    // This should never happen inside ProtectedRoutes, but as a safeguard
    return <Navigate to="/login" replace />;
  }

  switch (user.role as string) {
    case 'superadmin':
      return <Dashboard />; // The superadmin's home IS the Dashboard
    case 'waiter':
      return <Navigate to="/waiter" replace />;
    case 'headWaiter':
      return <Navigate to="/waiter" replace />;
    case 'admin': // Branch Manager
      return <Navigate to="/manager" replace />;
    case 'cleaner':
      return <Navigate to="/cleaner" replace />;
    case 'receptionist':
      return <Navigate to="/receptionist" replace />;
    default:
      // Fallback for unknown roles
      return <NotFound />;
  }
};

/**
 * This component checks if the logged-in user's role is included
 * in the `allowedRoles` prop.
 *
 * If the role is allowed, it renders the nested routes (`<Outlet />`).
 * If not, it redirects the user to the root path (`/`),
 * which will then be handled by `RoleBasedRoot` to send them
 * to their correct dashboard.
 */
const RoleProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user } = useAuthStore();

  // We can safely assume `user` exists because this component
  // is designed to be nested within `ProtectedRoutes`.
  // If the user's role is in the list, allow access.
  if (user && allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  // If role is not allowed, redirect to root.
  // `RoleBasedRoot` will then send them to their *own* dashboard.
  return <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* ✅ Wrap with NotificationProvider */}
      {/* <NotificationProvider> */}
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            {/* Public-only routes (Login, Signup) */}
            <Route element={<PublicRoutes />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Protected routes (all dashboards) */}
            {/* This parent route provides the main layout (`RoleBasedLayout`) */}
            {/* ✅ ProtectedRoutes now wraps everything with AuthenticatedLayout */}
            <Route element={<ProtectedRoutes />}>
              {/* The root path for all logged-in users. */}
              {/* RoleBasedRoot handles redirecting to the correct dashboard. */}
              <Route path="/" element={<RoleBasedRoot />} />

              {/* --- SuperAdmin Routes --- */}
              {/* These routes are *only* accessible to 'superadmin' */}
              <Route element={<RoleProtectedRoute allowedRoles={['superadmin']} />}>
                <Route path="/staffs" element={<Staffs />} />
                <Route path="/shifts" element={<ShiftScheduler />} />
                <Route path="/users" element={<Users />} />
                <Route path="/branches" element={<Branches />} />
                <Route path="/branches/:id" element={<BranchDetails />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/rooms/:id" element={<RoomDetailPage />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/cleaners" element={<Cleaners />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/reviews" element={<Reviews />} />
                <Route path="/blog-management" element={<BlogManagement />} />
                <Route path="/gallery-management" element={<GalleryManagement />} />
                <Route path="/room-categories" element={<CategoryManagement />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/profile" element={<StaffProfile/>}/>
                <Route path="/profile/update" element={<ProfileUpdate/>}/>
                <Route path="/profile/change-password" element={<ChangePassword/>}/>
                {/* <Route path="/settings" element={<Settings />} /> */}
              </Route>

              {/* --- Waiter Routes --- */}
              {/* These routes are *only* accessible to 'waiter' */}
              <Route element={<RoleProtectedRoute allowedRoles={['waiter','headWaiter']} />}>
                <Route path="/waiter" element={<WaiterDashboard />} />
                <Route path="/waiter/orders" element={<Orders />} />
                <Route path="/waiter/orders/:orderId" element={<OrderDetail />} />
                <Route path="/waiter/tables" element={<Tables />} />
                <Route path="/waiter/menu" element={<Menu />} />
                <Route path="/waiter/reservations" element={<Reservations />} />
                <Route path="/waiter/performance" element={<TipsPerformance />} />
                <Route path="/waiter/my-shift" element={<MySchedule />} />
                <Route path="/waiter/profile" element={<StaffProfile/>}/>
                <Route path="/waiter/profile/update" element={<ProfileUpdate/>}/>
                <Route path="/waiter/profile/change-password" element={<ChangePassword/>}/>
                {/* <Route path="/waiter/settings" element={<Settings />} /> */}
              </Route>

              {/* --- Branch Manager Routes --- */}
              {/* These routes are *only* accessible to 'admin' (manager) */}
              <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/manager" element={<ManagerDashboard />} />
                <Route path="/manager/staff" element={<StaffManagement />} />
                <Route path="/manager/shifts" element={<ShiftScheduler />} />
                <Route path="/manager/analytics" element={<BranchAnalytics />} />
                <Route path="/manager/requests" element={<ManagerRequests />} />
                <Route path="/manager/rooms-type" element={<Rooms />} />
                <Route path="/manager/rooms-type/:id" element={<RoomDetailPage />} />
                <Route path="/manager/operations" element={<Operations />} />
                <Route path="/manager/house-keeping" element={<Housekeeping />} />
                <Route path="/manager/bookings" element={<BookingManagement />} />
                <Route path="/manager/booking-calendar" element={<Bookings />} />
                <Route path="/manager/orders" element={<Restaurant />} />
                <Route path="/manager/reviews" element={<Reviews />} />
                <Route path="/manager/announcements" element={<ManagerAnnouncements />} />
                {/* <Route path="/manager/transactions" element={<Transactions />} /> */}
                <Route path="/manager/rooms" element={<RoomReceptionist />} />
                <Route path="/manager/profile" element={<StaffProfile/>}/>
                <Route path="/manager/profile/update" element={<ProfileUpdate/>}/>
                <Route path="/manager/profile/change-password" element={<ChangePassword/>}/>
                {/* <Route path="/manager/settings" element={<Settings />} /> */}
              </Route>

              {/* --- Cleaner Routes --- */}
              {/* These routes are *only* accessible to 'cleaner' */}
              <Route element={<RoleProtectedRoute allowedRoles={['cleaner']} />}>
                <Route path="/cleaner" element={<CleanerDashboard />} />
                <Route path="/cleaner/tasks" element={<CleaningTasks />} />
                <Route path="/cleaner/rooms" element={<RoomStatus />} />
                <Route path="/cleaner/history" element={<TaskHistory />} />
                <Route path="/cleaner/performance" element={<CleanerPerformance />} />
                <Route path="/cleaner/my-shift" element={<MySchedule />} />
                <Route path="/cleaner/profile" element={<StaffProfile/>}/>
                <Route path="/cleaner/profile/update" element={<ProfileUpdate/>}/>
                <Route path="/cleaner/profile/change-password" element={<ChangePassword/>}/>
                {/* <Route path="/cleaner/settings" element={<Settings />} /> */}
              </Route>

              {/* --- Receptionist Routes --- */}
              {/* These routes are *only* accessible to 'receptionist' */}
              <Route element={<RoleProtectedRoute allowedRoles={['receptionist']} />}>
                <Route path="/receptionist" element={<ReceptionistDashboard />} />
                <Route path="/receptionist/checkin" element={<CheckInOut />} />
                <Route path="/receptionist/rooms" element={<RoomReceptionist />} />
                <Route path="/receptionist/bookings" element={<BookingManagement />} />
                <Route path="/receptionist/calendar" element={<BookingCalendar />} />
                <Route path="/receptionist/my-shift" element={<MySchedule />} />
                <Route path="/receptionist/payments" element={<PaymentProcessing />} />
                <Route path="/receptionist/profile" element={<StaffProfile/>}/>
                <Route path="/receptionist/profile/update" element={<ProfileUpdate/>}/>
                <Route path="/receptionist/profile/change-password" element={<ChangePassword/>}/>
                {/* <Route path="/receptionist/settings" element={<Settings />} /> */}
              </Route>
            </Route>

            {/* Catch-all 404 Route */}
            {/* This should be outside the protected routes to work correctly */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      {/* </NotificationProvider> */}
      {/* ✅ End NotificationProvider */}
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;