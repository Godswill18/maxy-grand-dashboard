import {
  // General
  LayoutDashboard,
  Users,
  UserCircle,
  Building2,
  Bed,
  Calendar,
  Sparkles,
  CreditCard,
  FileText,
  BarChart3,
  Star,
  // Waiter
  Home,
  ClipboardList,
  UtensilsCrossed,
  Pizza,
  CalendarDays,
  TrendingUp,
  // Manager
  Settings,
  // Cleaner
  History,
  // Receptionist
  UserCheck,
  DoorOpen,
  BedDouble,
  Space,
  Calendar1Icon,
  ImagesIcon,
} from "lucide-react";

// Define a reusable NavItem type
export type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

// 1. SuperAdmin Navigation
export const superAdminNav: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Staffs", href: "/staffs", icon: Users },
  { name: "Shift Scheduler", href: "/shifts", icon: CalendarDays },
  { name: "Users", href: "/users", icon: UserCircle },
  { name: "Branches", href: "/branches", icon: Building2 },
  // { name: "Branch Details", href: "/branches/:id", icon: Building2 },
  { name: "Rooms", href: "/rooms", icon: Bed },
  { name: "Bookings", href: "/bookings", icon: Calendar },
  { name: "Cleaners", href: "/cleaners", icon: Sparkles },
  { name: "Transactions", href: "/transactions", icon: CreditCard },
  { name: "Requests", href: "/requests", icon: FileText },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Gallery Management", href: "/gallery-management", icon: ImagesIcon},
  { name: "Settings", href: "/settings", icon: Settings },
];

// 2. Waiter Navigation
export const waiterNav: NavItem[] = [
  { name: "Dashboard", href: "/waiter", icon: Home },
  { name: "Orders", href: "/waiter/orders", icon: ClipboardList },
  // { name: "Tables", href: "/waiter/tables", icon: UtensilsCrossed },
  { name: "Menu", href: "/waiter/menu", icon: Pizza },
  // { name: "Reservations", href: "/waiter/reservations", icon: CalendarDays },
  { name: "My Shift", href: "/waiter/my-shift", icon: CalendarDays },
  { name: "Tips & Performance", href: "/waiter/performance", icon: TrendingUp },
  { name: "Settings", href: "/waiter/settings", icon: Settings },
];

// 3. Branch Manager Navigation
export const managerNav: NavItem[] = [
  { name: "Dashboard", href: "/manager", icon: LayoutDashboard },
  { name: "Staff Management", href: "/manager/staff", icon: Users },
  { name: "Shift Scheduler", href: "/manager/shifts", icon: CalendarDays },
  // { name: "User Management", href: "/manager/users", icon: UserCircle },
  { name: "Branch Analytics", href: "/manager/analytics", icon: TrendingUp },
  { name: "Requests", href: "/manager/requests", icon: FileText },
  { name: "Room Type", href: "/manager/rooms-type", icon: Bed },
  { name: "Rooms", href: "/manager/rooms", icon: BedDouble },
  { name: "Bookings", href: "/manager/bookings", icon: Calendar },
  { name: "Transactions", href: "/manager/transactions", icon: CreditCard },
  { name: "Housekeeping", href: "/manager/house-keeping", icon: Sparkles },
  { name: "Orders", href: "/manager/orders", icon: UtensilsCrossed },
  { name: "Operations", href: "/manager/operations", icon: ClipboardList },
  { name: "Reviews", href: "/manager/reviews", icon: Star },
  { name: "Settings", href: "/manager/settings", icon: Settings },
];

// 4. Cleaner Navigation
export const cleanerNav: NavItem[] = [
  { name: "Dashboard", href: "/cleaner", icon: LayoutDashboard },
  { name: "My Shift", href: "/cleaner/my-shift", icon: CalendarDays },
  { name: "Cleaning Tasks", href: "/cleaner/tasks", icon: ClipboardList },
  { name: "Room Status", href: "/cleaner/rooms", icon: Sparkles },
  { name: "Task History", href: "/cleaner/history", icon: History },
  { name: "Performance", href: "/cleaner/performance", icon: TrendingUp },
  { name: "Settings", href: "/cleaner/settings", icon: Settings },
];

// 5. Receptionist Navigation
export const receptionistNav: NavItem[] = [
  { name: "Dashboard", href: "/receptionist", icon: LayoutDashboard },
  { name: "Check-In/Out", href: "/receptionist/checkin", icon: UserCheck },
  { name: "Rooms", href: "/receptionist/rooms", icon: BedDouble },
  { name: "Bookings", href: "/receptionist/bookings", icon: Calendar },
  { name: "Booking Calendar", href: "/receptionist/calendar", icon: Calendar1Icon },
  { name: "My Shift", href: "/receptionist/my-shift", icon: CalendarDays },
  { name: "Settings", href: "/receptionist/settings", icon: Settings },
  // { name: "Payments", href: "/receptionist/payments", icon: CreditCard },
];