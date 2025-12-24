import { useLocation } from "react-router-dom";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { useEffect } from "react";

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

   useEffect(() => {
      window.scrollTo(0, 0);
      
    }, [ pathname]);

  const getPageTitle = () => {
    return (
      navigation.find((item) => item.href === location.pathname)?.name ||
      "Dashboard"
    );
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
        </div>
      </div>
    </header>
  );
}