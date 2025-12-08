import { useState, useEffect } from "react";
// We don't need useToast here for logout anymore, but maybe for other things
// import { useToast } from "@/hooks/use-toast"; 
import { useSimulatedNotifications } from "@/hooks/useSimulatedNotifications";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { NavItem } from "@/config/navigation";
import { useAuthStore } from "../store/useAuthStore"; // Import the store
import { toast } from "sonner"; // Use sonner for logout toast

// Define the props
interface DashboardLayoutProps {
  children: React.ReactNode;
  navigation: NavItem[];
  userName: string;
  userRole: string;
}

export function DashboardLayout({
  children,
  navigation,
  userName,
  userRole,
}: DashboardLayoutProps) {
  
  
  // Get the logout action from the store
  const { user, logout } = useAuthStore();

  // State for dark mode
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });

  // State for mobile sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] =useState(false);

  // Hook for notifications (used by Header's NotificationBell)
  useSimulatedNotifications();

  // Logout handler (passed to Sidebar)
  const handleLogout = async () => {
    await logout(); // Call the store's logout action
    toast.success("You have been logged out.");
    // No navigation needed, App.tsx will handle the redirect
  };

  // Effect for toggling dark mode class
  useEffect(() => {
    localStorage.setItem("darkMode", String(isDark));
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

   // ✅ NEW: Get the actual role key from the auth store
  // This is used by Sidebar to determine which profile route to navigate to
  const userRoleKey = user?.role || "guest";

  return (
    <div className="min-h-screen bg-background flex w-full">
      
      <div className="min-h-screen bg-background flex w-full">
        {/* Sidebar (fixed) */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          handleLogout={handleLogout}
          navigation={navigation}
          userName={userName}
          userRole={userRole}
          userRoleKey={userRoleKey}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <Header
            setIsSidebarOpen={setIsSidebarOpen}
            isDark={isDark}
            setIsDark={setIsDark}
            navigation={navigation}
          />
          <main className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}