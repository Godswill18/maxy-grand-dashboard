import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, UserCircle, X } from "lucide-react";
// import { getProfileRoute } from "@/components/utils/getProfileRoute";
import { getProfileRoute } from "../utils/GetprofileRoute";

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  handleLogout: () => void;
  navigation: NavItem[];
  userName: string;
  userRole: string;
  userRoleKey: string; // The actual role key from auth store (e.g., 'waiter', 'admin')
}

export function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
  navigation,
  userName,
  userRole,
  userRoleKey,
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ NEW: Handle profile navigation based on user role
  const handleProfileNav = () => {
    const profileRoute = getProfileRoute(userRoleKey);
    navigate(profileRoute);
    setIsSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-sidebar border-r border-sidebar-border 
          flex flex-col z-50 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} 
          lg:translate-x-0
        `}
      >
        {/* Header / Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
          <h1 className="text-lg font-bold text-sidebar-foreground">
            Maxy Grand Hotel
          </h1>
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-sidebar-foreground"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                  onClick={() => setIsSidebarOpen(false)} // close menu on mobile
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-sidebar-border">
          {/* ✅ UPDATED: Profile button with role-based navigation */}
          <Button
            onClick={handleProfileNav}
            className="flex items-center gap-3 mb-3 w-full justify-start hover:bg-sidebar-accent/10"
          >
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center flex-shrink-0">
              <UserCircle className="h-6 w-6 text-sidebar-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {userRole}
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}