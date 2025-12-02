import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";

// Import the ONE layout
import { DashboardLayout } from "./components/DashboardLayout";
// Import the auth store
import { useAuthStore } from "./store/useAuthStore";

// Import the navigation arrays
import {
  superAdminNav,
  waiterNav,
  managerNav,
  cleanerNav,
  receptionistNav,
} from "./config/navigation";

// --- Import ALL your pages ---
import Dashboard from "./pages/Dashboard";
import Staffs from "./pages/Staffs";
import Users from "./pages/Users";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import WaiterDashboard from "./pages/waiter/WaiterDashboard";
import Orders from "./pages/waiter/Orders";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import CleanerDashboard from "./pages/cleaner/CleanerDashboard";
import ReceptionistDashboard from "./pages/receptionist/ReceptionistDashboard";
import Reviews from "./pages/Reviews";
import TipsPerformance from "./pages/waiter/TipsPerformance";
import ManagerSettings from "./pages/manager/ManagerSettings";
import CleanerPerformance from "./pages/cleaner/CleanerPerformance";
import PaymentProcessing from "./pages/receptionist/PaymentProcessing";
import Rooms from "./pages/Rooms";
import Bookings from "./pages/Bookings";
import Cleaners from "./pages/Cleaners";
import Transactions from "./pages/Transactions";
import Requests from "./pages/Requests";
import Reports from "./pages/Reports";
import Branches from "./pages/Branches";
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
import BranchDetails from "./pages/BranchDetails";
import Settings from "./pages/Settings";
import RoomDetailPage from "./pages/RoomDetails";
import Housekeeping from "./pages/manager/HouseKeeping";
import Restaurant from "./pages/manager/Restaurant";
import BookingCalendar from "./pages/receptionist/Bookingcalendar";
import OrderDetail from "./pages/waiter/Orderdetail";

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
 * A component to protect routes. It checks if a user is logged in.
 * If yes, it renders the child routes (Outlet).
 * If no, it redirects to the /login page.
 */
const ProtectedRoutes = () => {
  const { user } = useAuthStore();
  
  return user ? <RoleBasedLayout /> : <Navigate to="/login" replace />;
};

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

// --- NEW COMPONENT ---
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

// --- NEW COMPONENT FOR ROLE-BASED ROUTE PROTECTION ---
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
          <Route element={<ProtectedRoutes />}>

            {/* The root path for all logged-in users. */}
            {/* RoleBasedRoot handles redirecting to the correct dashboard. */}
            <Route path="/" element={<RoleBasedRoot />} />

            {/* --- SuperAdmin Routes --- */}
            {/* These routes are *only* accessible to 'superadmin' */}
            {/* Note: The '/' route (Dashboard) is handled by RoleBasedRoot */}
            <Route element={<RoleProtectedRoute allowedRoles={['superadmin']} />}>
              <Route path="/staffs" element={<Staffs />} />
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
              <Route path="/settings" element={<Settings />} />
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
              <Route path="/waiter/settings" element={<Settings />} />
            </Route>

            {/* --- Branch Manager Routes --- */}
            {/* These routes are *only* accessible to 'admin' (manager) */}
            <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/manager" element={<ManagerDashboard />} />
              <Route path="/manager/staff" element={<StaffManagement />} />
              <Route path="/manager/analytics" element={<BranchAnalytics />} />
              <Route path="/manager/requests" element={<ManagerRequests />} />
              <Route path="/manager/rooms-type" element={<Rooms />} />
              <Route path="/manager/rooms-type/:id" element={<RoomDetailPage />} />
              <Route path="/manager/operations" element={<Operations />} />
              <Route path="/manager/house-keeping" element={<Housekeeping />} />
              <Route path="/manager/bookings" element={<Bookings />} />
              <Route path="/manager/orders" element={<Restaurant />} />
              <Route path="/manager/reviews" element={<Reviews />} />
              <Route path="/manager/transactions" element={<Transactions />} />
              <Route path="/manager/rooms" element={<RoomReceptionist />} />
              {/* <Route path="/manager/settings" element={<ManagerSettings />} /> */}
              <Route path="/manager/settings" element={<Settings />} />
            </Route>

            {/* --- Cleaner Routes --- */}
            {/* These routes are *only* accessible to 'cleaner' */}
            <Route element={<RoleProtectedRoute allowedRoles={['cleaner']} />}>
              <Route path="/cleaner" element={<CleanerDashboard />} />
              <Route path="/cleaner/tasks" element={<CleaningTasks />} />
              <Route path="/cleaner/rooms" element={<RoomStatus />} />
              <Route path="/cleaner/history" element={<TaskHistory />} />
              <Route path="/cleaner/performance" element={<CleanerPerformance />} />
              <Route path="/cleaner/settings" element={<Settings />} />
            </Route>

            {/* --- Receptionist Routes --- */}
            {/* These routes are *only* accessible to 'receptionist' */}
            <Route element={<RoleProtectedRoute allowedRoles={['receptionist']} />}>
              <Route path="/receptionist" element={<ReceptionistDashboard />} />
              <Route path="/receptionist/checkin" element={<CheckInOut />} />
              <Route path="/receptionist/rooms" element={<RoomReceptionist />} />
              <Route path="/receptionist/bookings" element={<BookingManagement />} />
              <Route path="/receptionist/calendar" element={<BookingCalendar />} />
              <Route path="/receptionist/payments" element={<PaymentProcessing />} />
              <Route path="/receptionist/settings" element={<Settings />} />
            </Route>

          </Route>

          {/* Catch-all 404 Route */}
          {/* This should be outside the protected routes to work correctly */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;