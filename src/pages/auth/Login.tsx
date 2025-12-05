import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Hotel, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/useAuthStore";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get state and actions from the store
  const { login, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Check if user was force logged out
  const forceLogoutMessage = location.state?.message;
  const forceLogoutReason = location.state?.reason;

  // ✅ Show force logout message on component mount
  useEffect(() => {
    if (forceLogoutMessage) {
      toast.error(forceLogoutMessage, {
        duration: 5000,
        important: true,
      });
    }
  }, [forceLogoutMessage]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Call the login action from the store
      const result = await login({ email, password });
      const loggedInUser = useAuthStore.getState().user;

      if (result.success) {
        // Login successful
        toast.success("Login successful!");

        // The store's state will update, and the App.tsx router will handle the redirect.
        switch (loggedInUser?.role) {
          case 'superadmin':
            navigate('/');
            break;
          case 'waiter':
            navigate('/waiter');
            break;
          case 'headWaiter':
            navigate('/waiter');
            break;
          case 'admin':
            navigate('/manager');
            break;
          case 'cleaner':
            navigate('/cleaner');
            break;
          case 'receptionist':
            navigate('/receptionist');
            break;
          default:
            navigate('/'); // Default dashboard
        }
      } else {
        // Login failed
        toast.error(result.message || "Login failed", { duration: 5000 });
      }
    } catch (err: any) {
      // ✅ Handle specific error codes from backend
      if (err.code === 'NO_ACTIVE_SHIFT' || err.message?.includes('active shift')) {
        toast.error(
          'You do not have an active shift at this time. Please contact your manager for emergency access.',
          { duration: 6000 }
        );
      } else if (err.code === 'ACCOUNT_INACTIVE' || err.message?.includes('inactive')) {
        toast.error(
          'Your account has been deactivated. Please contact the administrator.',
          { duration: 6000 }
        );
      } else {
        toast.error(err.message || "Invalid credentials. Please try again.", { duration: 5000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Get readable reason message for force logout
  const getReasonMessage = (reason: string) => {
    switch (reason) {
      case 'shift_ended':
        return 'Your shift time has ended.';
      case 'no_active_shift':
        return 'You do not have an active shift at this time.';
      case 'admin_action':
        return 'Your shift was deactivated by an administrator.';
      default:
        return 'Session expired.';
    }
  };

  const getReasonExplanation = (reason: string) => {
    switch (reason) {
      case 'shift_ended':
        return 'Your shift has ended for today. You can log in again when your next shift starts.';
      case 'no_active_shift':
        return 'Please contact your manager if you need emergency access.';
      case 'admin_action':
        return 'Please contact your manager for more information.';
      default:
        return 'Please log in again to continue.';
    }
  };

  // If user is already logged in, redirect them
  if (user) {
    return <Navigate to="/" replace />; 
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Hotel className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Maxy Grand Hotel</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>

        <CardContent>
          {/* ✅ Show force logout alert if user was logged out */}
          {forceLogoutMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold">You have been logged out</p>
                {forceLogoutReason && (
                  <>
                    <p className="text-sm mt-1">{getReasonMessage(forceLogoutReason)}</p>
                    <p className="text-sm mt-2">{getReasonExplanation(forceLogoutReason)}</p>
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Having trouble logging in?{' '}
              <a href="#" className="text-primary hover:underline">
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}