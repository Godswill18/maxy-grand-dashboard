import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";

// Import the ONE layout
import { DashboardLayout } from "@/components/DashboardLayout";
// Import the auth store
import { useAuthStore } from "@/store/useAuthStore";

// Import the navigation arrays
import {
  superAdminNav,
  waiterNav,
  managerNav,
  cleanerNav,
  receptionistNav,
} from "@/config/navigation";

// --- Import ALL your pages ---
import Dashboard from "@/pages/Dashboard";
import Staffs from "@/pages/Staffs";
import Users from "@/pages/Users";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import WaiterDashboard from "@/pages/waiter/WaiterDashboard";
import Orders from "@/pages/waiter/Orders";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import CleanerDashboard from "@/pages/cleaner/CleanerDashboard";
import ReceptionistDashboard from "@/pages/receptionist/ReceptionistDashboard";
import Reviews from "@/pages/Reviews";
import TipsPerformance from "@/pages/waiter/TipsPerformance";
import ManagerSettings from "@/pages/manager/ManagerSettings";
import CleanerPerformance from "@/pages/cleaner/CleanerPerformance";
import PaymentProcessing from "@/pages/receptionist/PaymentProcessing";
import Rooms from "@/pages/Rooms";
import Bookings from "@/pages/Bookings";
import Cleaners from "@/pages/Cleaners";
import Transactions from "@/pages/Transactions";
import Requests from "@/pages/Requests";
import Reports from "@/pages/Reports";
import Branches from "@/pages/Branches";
import Tables from "@/pages/waiter/Tables";
import Menu from "@/pages/waiter/Menu";
import Reservations from "@/pages/waiter/Reservations";
import StaffManagement from "@/pages/manager/StaffManagement";
import BranchAnalytics from "@/pages/manager/BranchAnalytics";
import ManagerRequests from "@/pages/manager/ManagerRequests";
import Operations from "@/pages/manager/Operations";
import CleaningTasks from "@/pages/cleaner/CleaningTasks";
import RoomStatus from "@/pages/cleaner/RoomStatus";
import TaskHistory from "@/pages/cleaner/TaskHistory";
import CheckInOut from "@/pages/receptionist/CheckInOut";
import RoomAssignment from "@/pages/receptionist/RoomAssignment";
import BookingManagement from "@/pages/receptionist/BookingManagement";
import BranchDetails from "@/pages/BranchDetails";
import Settings from "./pages/Settings";
import RoomDetailPage from "./pages/RoomDetails";

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

  switch (user.role) {
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
  // We need to know the *intended* role to redirect,
  // but for a simple redirect, we can pick a default.
  // A better check would be in the RoleBasedLayout
  return !user ? <Outlet /> : <Navigate to="/" replace />;
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
          <Route element={<ProtectedRoutes />}>
            {/* SuperAdmin Routes */}
            <Route path="/" element={<Dashboard />} />
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

            {/* Waiter Routes */}
            <Route path="/waiter" element={<WaiterDashboard />} />
            <Route path="/waiter/orders" element={<Orders />} />
            <Route path="/waiter/tables" element={<Tables />} />
            <Route path="/waiter/menu" element={<Menu />} />
            <Route path="/waiter/reservations" element={<Reservations />} />
            <Route path="/waiter/performance" element={<TipsPerformance />} />

            {/* Branch Manager Routes */}
            <Route path="/manager" element={<ManagerDashboard />} />
            <Route path="/manager/staff" element={<StaffManagement />} />
            <Route path="/manager/analytics" element={<BranchAnalytics />} />
            <Route path="/manager/requests" element={<ManagerRequests />} />
            <Route path="/manager/operations" element={<Operations />} />
            <Route path="/manager/settings" element={<ManagerSettings />} />

            {/* Cleaner Routes */}
            <Route path="/cleaner" element={<CleanerDashboard />} />
            <Route path="/cleaner/tasks" element={<CleaningTasks />} />
            <Route path="/cleaner/rooms" element={<RoomStatus />} />
            <Route path="/cleaner/history" element={<TaskHistory />} />
            <Route path="/cleaner/performance" element={<CleanerPerformance />} />

            {/* Receptionist Routes */}
            <Route path="/receptionist" element={<ReceptionistDashboard />} />
            <Route path="/receptionist/checkin" element={<CheckInOut />} />
            <Route path="/receptionist/rooms" element={<RoomAssignment />} />
            <Route path="/receptionist/bookings" element={<BookingManagement />} />
            <Route path="/receptionist/payments" element={<PaymentProcessing />} />
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;