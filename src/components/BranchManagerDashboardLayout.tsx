import { useState } from "react";
import { NavLink } from "./NavLink";
import { LayoutDashboard, Users, TrendingUp, FileText, Settings, Moon, Sun, Menu, X, ClipboardList } from "lucide-react";
import { Button } from "./ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useSimulatedNotifications } from "@/hooks/useSimulatedNotifications";

interface BranchManagerDashboardLayoutProps {
  children: React.ReactNode;
}

export function BranchManagerDashboardLayout({ children }: BranchManagerDashboardLayoutProps) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    const isDark = saved === "true";
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
    return isDark;
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useSimulatedNotifications();

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/manager" },
    { icon: Users, label: "Staff Management", path: "/manager/staff" },
    { icon: TrendingUp, label: "Branch Analytics", path: "/manager/analytics" },
    { icon: FileText, label: "Requests", path: "/manager/requests" },
    { icon: ClipboardList, label: "Operations", path: "/manager/operations" },
    { icon: Settings, label: "Settings", path: "/manager/settings" },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h1 className="text-2xl font-bold text-primary">Maxy Grand</h1>
                <p className="text-xs text-muted-foreground">Branch Manager</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  end
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User Info */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold">JD</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">John Doe</p>
                  <p className="text-xs text-muted-foreground">Downtown Branch</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className="rounded-full"
                >
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
