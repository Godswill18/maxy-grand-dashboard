import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Hotel, Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../store/useAuthStore"; // Import the store

export default function Signup() {
  const navigate = useNavigate();
  // Get state and actions from the store
  const { signup, isLoading, user } = useAuthStore();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!formData.role) {
      toast.error("Please select a role");
      return;
    }

    try {
      // Call the signup action from the store
      await signup({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phone, // Match backend key
        password: formData.password,
        role: formData.role, // Match backend enum (guessing)
      });

      toast.success("Account created successfully!");
      // Since signup now logs us in, App.tsx will handle the redirect.
      // We can manually navigate as a fallback.
      // const signedUpUser = useAuthStore.getState().user;
      // switch (signedUpUser?.role) {
      //   case 'waiter':
      //     navigate('/waiter');
      //     break;
      //     case 'cleaner':
      //     navigate('/cleaner');
      //     break;
      //     case 'receptionist':
      //     navigate('/receptionist');
      //     break;
      //     case 'superadmin':
      //     navigate('/');
      //     break;
      //     case 'admin':
      //     navigate('/');
      //     break;
      //   // ... add other role navigations
      //   default:
      //     navigate('/');
      // }

    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

          <CardDescription>Sign up</CardDescription>

        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* --- Full Name --- */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* --- Email --- */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* --- Phone --- */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* --- Role --- */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange("role", value)} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                  <SelectItem value="admin">Branch Manager</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* --- Password --- */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password (min. 4 chars)"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* --- Confirm Password --- */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
          {/* ... (Login link) ... */}
        </CardContent>
      </Card>
    </div>
  );
}