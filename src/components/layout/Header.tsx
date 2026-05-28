import { useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun, Menu, LogOut, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { getProfileRoute } from "@/components/utils/GetprofileRoute";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the type for a navigation item
type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

// Define prop types for the Header
interface HeaderProps {
  setIsSidebarOpen: (isOpen: boolean) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
  navigation: NavItem[];
}

export function Header({
  setIsSidebarOpen,
  isDark,
  setIsDark,
  navigation,
}: HeaderProps) {
  const location = useLocation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const getPageTitle = () => {
    return (
      navigation.find((item) => item.href === location.pathname)?.name ||
      "Dashboard"
    );
  };

  const userName = user ? `${user.firstName} ${user.lastName}` : "User";
  const userRole = user?.role ?? "";

  const handleLogout = async () => {
    await logout();
    toast.success("You have been logged out.");
  };

  const handleProfileNav = () => {
    navigate(getProfileRoute(userRole));
  };

  return (
    <header className="h-16 border-b border-border bg-card sticky top-0 z-30">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {getPageTitle()}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* <NotificationBell /> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <p className="font-medium truncate">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize truncate">{userRole}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleProfileNav}>
                <UserCircle className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
