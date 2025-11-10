import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  Home, 
  ClipboardList, 
  UtensilsCrossed, 
  Pizza, 
  CalendarDays, 
  TrendingUp,
  Moon,
  Sun,
  LogOut
} from "lucide-react";
import { NavLink } from "./NavLink";
import { NotificationBell } from "@/components/NotificationBell";
import { useSimulatedNotifications } from "@/hooks/useSimulatedNotifications";

interface WaiterDashboardLayoutProps {
  children: ReactNode;
}

export function WaiterDashboardLayout({ children }: WaiterDashboardLayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    const isDark = saved === "true";
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
    return isDark;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  useSimulatedNotifications();

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  const navItems = [
    { path: "/waiter", icon: Home, label: "Dashboard" },
    { path: "/waiter/orders", icon: ClipboardList, label: "Orders" },
    { path: "/waiter/tables", icon: UtensilsCrossed, label: "Tables" },
    { path: "/waiter/menu", icon: Pizza, label: "Menu" },
    { path: "/waiter/reservations", icon: CalendarDays, label: "Reservations" },
    { path: "/waiter/performance", icon: TrendingUp, label: "Tips & Performance" },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold text-primary">Waiter Portal</h2>
        <p className="text-sm text-muted-foreground mt-1">Maxy Grand Hotel</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/waiter"}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-accent transition-colors"
            activeClassName="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Button variant="ghost" className="w-full justify-start gap-3" asChild>
          <Link to="/login">
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between p-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-semibold">Waiter Portal</h1>
          
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="sticky top-0 z-30 hidden lg:flex items-center justify-between p-6 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <h1 className="text-2xl font-bold">
            {navItems.find(item => item.path === location.pathname)?.label || "Dashboard"}
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
