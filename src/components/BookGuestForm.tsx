import { useState, useEffect, useRef } from "react"; // Added useEffect and useRef
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, CheckCircle, XCircle } from "lucide-react"; // Added Search icon
import { toast } from "sonner";
// Import the store actions needed
import { useCheckInStore } from "@/store/useCheckInStore";
import { useAuthStore } from "@/store/useAuthStore"; // Assuming useAuthStore handles user creation
import { Card } from "./ui/card";
// --- NEW HELPER FOR FETCHING USER (Add to useAuthStore or create a utility) ---
/* Assuming your useAuthStore has an action or you create a utility function
   that hits an endpoint like GET /api/users/find-by-email?email=...
   and returns the user object if found. */
   
const fetchUserByEmail = async (email: string) => {
    const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';
    try {
        const response = await fetch(`${VITE_API_URL}/api/users/find-by-email?email=${email}`, {
            method: 'GET',
            credentials: 'include',
        });
        if (response.status === 404) return null; // User not found
        if (!response.ok) throw new Error("Verification failed.");
        const data = await response.json();
        return data.data; // Return the user data
    } catch (error) {
        toast.error((error as Error).message || "Could not verify user.");
        return null;
    }
}
// --- END NEW HELPER ---
interface CheckInFormProps {
  guestName: string; // The guest name from the booking (might be simple)
  bookingId: string; // The database ID
  initialEmail?: string;
  initialPhone?: string;
  onConfirm: (formData: any) => Promise<void>;
  onCancel: () => void;
}
export default function BookGuestForm({ guestName, bookingId, initialEmail = "", initialPhone = "", onConfirm, onCancel }: CheckInFormProps) {
  const { createGuestAccountAndCheckIn, verifyConfirmationCode } = useCheckInStore(); // Assuming this is the new store action
  const [isLoading, setIsLoading] = useState(false);
  const [isUserFound, setIsUserFound] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'loading' | 'verified' | 'notfound'>('idle');
 
  const [formData, setFormData] = useState({
    // User Account Fields (Required for creation)
    firstName: "",
    lastName: "",
    email: initialEmail,
    phoneNumber: initialPhone,
    password: "", // Only required if new account
  
    // Detailed Registration Fields
    address: "",
    city: "",
    state: "",
    arrivingFrom: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    extraBedding: false,
    specialRequests: "",
    confirmationCode: "",
    // New field to link the existing user or the newly created one
    userId: "",
  });
  // Effect to separate first and last name from initial booking name
  useEffect(() => {
    const parts = guestName.split(" ");
    setFormData(prev => ({
        ...prev,
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
    }));
  }, [guestName]);

  // Auto-verify initial email on mount if provided
  useEffect(() => {
    if (initialEmail && initialEmail.trim()) {
      handleEmailVerification();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setFormData({ ...formData, [e.target.name]: newValue });
    // Reset email status if email changes
    if (e.target.name === 'email' && emailStatus !== 'idle') {
      setEmailStatus('idle');
      setIsUserFound(false);
      setFormData(prev => ({ ...prev, userId: "" }));
    }
  };
 
  const handleEmailVerification = async () => {
    if (!formData.email) return toast.error("Email is required for verification.");
    setIsVerifying(true);
    setEmailStatus('loading');
   
    const user = await fetchUserByEmail(formData.email);
    if (user) {
        // User found! Populate form with their existing data.
        setIsUserFound(true);
        setFormData(prev => ({
            ...prev,
            userId: user._id, // Set the ID for later use
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            // Clear password fields
            password: "",
        }));
        toast.success(`User ${user.firstName} found. Skipping account creation.`);
        setEmailStatus('verified');
    } else {
        // User not found. Enable new account creation.
        setIsUserFound(false);
        setFormData(prev => ({ ...prev, userId: "" }));
        toast.warning("New guest. Account creation required.");
        setEmailStatus('notfound');
    }
    setIsVerifying(false);
  };

  const handleVerifyCode = async () => {
    if (!formData.confirmationCode) return toast.error("Confirmation code is required.");
    if (!bookingId) return toast.error("No booking ID available for verification.");
    setIsVerifyingCode(true);
    const valid = await verifyConfirmationCode(bookingId, formData.confirmationCode);
    setIsVerifyingCode(false);
    if (valid) {
      setIsCodeVerified(true);
      toast.success("Confirmation code verified!");
    } else {
      setIsCodeVerified(false);
      toast.error("Invalid confirmation code.");
    }
  };

  const handleSubmit = async () => {
    const { confirmationCode, email, firstName, lastName, phoneNumber, password } = formData;
    if (bookingId && !isCodeVerified) return toast.error("Please verify the confirmation code.");
    if (!confirmationCode) return toast.error("Confirmation Code is required.");
   
    if (!isUserFound && (!email || !firstName || !lastName || !phoneNumber || !password)) {
        return toast.error("New account fields are mandatory.");
    }
    setIsLoading(true);
    try {
        let finalUserId = formData.userId;
        // If the user isn't found, create the account first
        if (!isUserFound) {
            // This needs to be a new action in your store: createAccountAndReturnId
            const newUserId = await createGuestAccountAndCheckIn({
                firstName,
                lastName,
                email,
                phoneNumber,
                password,
            });
            finalUserId = newUserId;
        }
        // 2. Now call the main check-in function with all registration details
        await onConfirm({
            ...formData,
            userId: finalUserId, // Pass the confirmed or new ID
        });
       
    } catch (error) {
        // Error handling done by store, but ensure loading state is reset
    } finally {
        setIsLoading(false);
    }
  };
  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div className="space-y-4">
        {/* 1. EMAIL VERIFICATION STEP */}
        <div className="space-y-1">
          <div className="flex gap-2">
              <Input
                  name="email"
                  placeholder="Guest Email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleEmailVerification} // Auto-verify on blur
                  disabled={isUserFound || isVerifying || isLoading}
              />
              <Button onClick={handleEmailVerification} disabled={isVerifying || isLoading || isUserFound}>
                  {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  {isVerifying ? "" : "Verify"}
              </Button>
          </div>
          {/* Email Verification Feedback */}
          {emailStatus !== 'idle' && (
            <div className="flex items-center gap-1 pl-1">
              {emailStatus === 'loading' ? (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              ) : emailStatus === 'verified' ? (
                <CheckCircle className="h-3 w-3 text-green-500" />
              ) : (
                <XCircle className="h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs ${
                emailStatus === 'verified' ? 'text-green-600' : 'text-red-600'
              }`}>
                {emailStatus === 'verified' 
                  ? 'Verified' 
                  : emailStatus === 'loading' 
                    ? 'Verifying...' 
                    : 'Email not found, create an account'
                }
              </p>
            </div>
          )}
        </div>
       
        {/* 2. ACCOUNT CREATION FIELDS (Conditional) */}
        {!isUserFound && (
            <Card className="p-3 bg-primary/5">
                <h4 className="font-semibold text-sm mb-2">Create Guest Account</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} />
                    <Input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} />
                    <Input name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} />
                    <Input name="password" type="password" placeholder="Password (e.g., last 4 digits of phone)" value={formData.password} onChange={handleChange} />
                </div>
            </Card>
        )}
        {/* 3. DETAILED REGISTRATION FIELDS (Always visible after verification) */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <h4 className="font-semibold text-sm col-span-2">Registration Details</h4>
         
            <div className="space-y-2 col-span-2">
                <Label>Residential Address</Label>
                <Input name="address" placeholder="123 Main St" onChange={handleChange} />
            </div>
            <Input name="city" placeholder="City" onChange={handleChange} />
            <Input name="state" placeholder="State / Province" onChange={handleChange} />
            <Input name="arrivingFrom" placeholder="Arriving From (e.g., Abuja Airport)" className="col-span-2" onChange={handleChange} />
         
            {/* Next of Kin */}
            <div className="col-span-2 border-t pt-2 mt-2">
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Next of Kin</h4>
            </div>
            <Input name="nextOfKinName" placeholder="NOK Name" onChange={handleChange} />
            <Input name="nextOfKinPhone" placeholder="NOK Phone Number" onChange={handleChange} />
        </div>
       
        {/* 4. PREFERENCES AND SECURITY */}
        <div className="col-span-2 border-t pt-2 mt-2">
            <h4 className="font-semibold text-sm text-muted-foreground mb-2">Preferences & Security</h4>
        </div>
        <div className="flex items-center justify-between col-span-2 border p-3 rounded-md">
            <Label>Extra Bedding Required?</Label>
            <Switch
                checked={formData.extraBedding}
                onCheckedChange={(checked) => setFormData(prev => ({...prev, extraBedding: checked}))}
            />
        </div>
        <div className="space-y-2 col-span-2">
            <Label>Other Requests</Label>
            <Textarea name="specialRequests" placeholder="Allergies, high floor, etc." onChange={handleChange} />
        </div>
        {/* Confirmation Code (Required Check) */}
        <div className="space-y-2 col-span-2 bg-muted/30 p-3 rounded-md">
            <Label className="text-primary">Booking Confirmation Code</Label>
            <div className="flex gap-2">
              <Input 
                name="confirmationCode" 
                placeholder="Enter code to verify" 
                value={formData.confirmationCode}
                onChange={handleChange}
                disabled={isCodeVerified}
                className={`border-primary/50 ${isCodeVerified ? 'border-green-500 bg-green-50' : ''}`} 
              />
              {bookingId && (
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={isVerifyingCode || isCodeVerified || !formData.confirmationCode}
                  variant={isCodeVerified ? 'outline' : 'default'}
                  size="sm"
                >
                  {isVerifyingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : isCodeVerified ? <CheckCircle className="h-4 w-4 text-green-500" /> : 'Verify'}
                </Button>
              )}
            </div>
            {isCodeVerified && <p className="text-xs text-green-600 mt-1">Code confirmed ✓</p>}
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="w-full" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button className="w-full" onClick={handleSubmit} disabled={isLoading || isVerifying || (!isUserFound && !formData.password)}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Complete Check-In
        </Button>
      </div>
    </div>
  );
}