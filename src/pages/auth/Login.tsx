import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hotel, Mail, Lock, Loader2, ShieldAlert, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/useAuthStore"; // Import the store

export default function Login() {
  const navigate = useNavigate();
  // Get state and actions from the store
  const { login, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Lockout countdown ───────────────────────────────────────────────────────
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const isLocked = lockoutSeconds > 0;

  // Tick down one second at a time using a chained setTimeout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setTimeout(() => setLockoutSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [lockoutSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block submission while locked out
    if (isLocked) return;

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
      } else if (result.retryAfter && result.retryAfter > 0) {
        // ── Lockout — start countdown, show banner instead of toast ────────────
        setLockoutSeconds(result.retryAfter);
      } else {
        // Standard failed login
        toast.error(result.message);
      }
      setIsLoading(false);

    } catch (err: any) {
      toast.error(err.message || "Invalid credentials", { duration: 5000 });
      setIsLoading(false);
    }
  };

  // If user is already logged in, redirect them
  if (user) {
    // This logic is better handled in App.tsx, but this is a safeguard
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

          {/* ── Lockout banner ────────────────────────────────────────────────── */}
          {isLocked && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="font-semibold">Too many failed login attempts.</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-red-700">
                  <Clock className="h-4 w-4" />
                  Try again in{" "}
                  <span className="tabular-nums font-bold">{lockoutSeconds}s</span>
                </p>
              </div>
            </div>
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
                  disabled={isLoading || isLocked}
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
                  disabled={isLoading || isLocked}
                />
              </div>
            </div>
            {/* ... (Forgot password link) ... */}
            <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isLocked ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Try again in {lockoutSeconds}s
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          {/* ... (Signup link and demo credentials) ... */}
        </CardContent>
      </Card>
    </div>
  );
}
