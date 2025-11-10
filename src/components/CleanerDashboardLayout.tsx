import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Moon, Sun, Menu, Sparkles, ClipboardList, History, TrendingUp, LayoutDashboard } from "lucide-react";
import { NavLink } from "./NavLink";
import { NotificationBell } from "@/components/NotificationBell";
import { useSimulatedNotifications } from "@/hooks/useSimulatedNotifications";

const navigation = [
  { name: "Dashboard", href: "/cleaner", icon: LayoutDashboard },
  { name: "Cleaning Tasks", href: "/cleaner/tasks", icon: ClipboardList },
  { name: "Room Status", href: "/cleaner/rooms", icon: Sparkles },
  { name: "Task History", href: "/cleaner/history", icon: History },
  { name: "Performance", href: "/cleaner/performance", icon: TrendingUp },
];

export function CleanerDashboardLayout({ children }: { children: React.ReactNode }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    const isDark = saved === "true";
    if (isDark) {
      document.documentElement.classList.add("dark");
    }
    return isDark;
  });
  const location = useLocation();
  
  useSimulatedNotifications();

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r border-border bg-card">
          <div className="flex items-center justify-between h-16 px-6 border-b border-border">
            <Link to="/cleaner" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Cleaner Portal</span>
            </Link>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent"
                  activeClassName="bg-primary/10 text-primary font-medium"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </ScrollArea>
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 justify-between">
              <span className="text-sm text-muted-foreground">Dark Mode</span>
              <div className="flex items-center gap-1">
                <NotificationBell />
                <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                  {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden flex items-center justify-between h-16 px-4 border-b border-border bg-card">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex items-center h-16 px-6 border-b border-border">
                  <Link to="/cleaner" className="flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">Cleaner</span>
                  </Link>
                </div>
                <ScrollArea className="flex-1 px-3 py-4">
                  <nav className="space-y-1">
                    {navigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className="flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent"
                        activeClassName="bg-primary/10 text-primary font-medium"
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </NavLink>
                    ))}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Link to="/cleaner" className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Cleaner Portal</span>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
