import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ArrowRight, Key, User, Mail, Phone, MapPin, Users } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";

interface CheckInFormProps {
  bookingId: string;
  guestName: string;
  bookingType: 'online' | 'walk-in';
  onConfirm: (email: string, confirmationCode: string) => Promise<void>;
  onCancel: () => void;
}

export default function CheckInForm({ 
  bookingId, 
  guestName, 
  bookingType,
  onConfirm, 
  onCancel 
}: CheckInFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'verify' | 'register'>(bookingType === 'online' ? 'verify' : 'register');
  
  // Step 1: Verification fields
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  
  // Step 2: Registration fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    state: "",
    arrivingFrom: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    extraBedding: false,
    specialRequests: "",
  });

  const requiresConfirmationCode = bookingType === 'online';

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    return phone.length >= 10;
  };

  // Handle Step 1: Verify confirmation code
  const handleVerification = async () => {
    if (!email || !validateEmail(email)) {
      return toast.error("Please enter a valid email address");
    }

    if (requiresConfirmationCode && !confirmationCode) {
      return toast.error("Confirmation code is required");
    }

    setIsLoading(true);
    try {
      // Verify the confirmation code via API
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/verify-code/${bookingId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ confirmationCode }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Invalid confirmation code');
      }

      // Code verified, move to registration step
      toast.success("Verification successful! Please complete guest details.");
      
      // Pre-fill email in registration form
      setFormData(prev => ({ ...prev, email }));
      
      // Split guest name if available
      const nameParts = guestName.split(' ');
      if (nameParts.length >= 2) {
        setFormData(prev => ({
          ...prev,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ')
        }));
      } else {
        setFormData(prev => ({ ...prev, firstName: guestName }));
      }
      
      setStep('register');
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Complete registration
  const handleRegistration = async () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      return toast.error("First name and last name are required");
    }
    if (!formData.email || !validateEmail(formData.email)) {
      return toast.error("Please enter a valid email address");
    }
    if (!formData.phoneNumber || !validatePhone(formData.phoneNumber)) {
      return toast.error("Please enter a valid phone number (at least 10 digits)");
    }
    if (!formData.address || !formData.city || !formData.state) {
      return toast.error("Address, city, and state are required");
    }

    setIsLoading(true);
    try {
      // Call the full check-in with registration
      await onConfirm(formData.email, confirmationCode);
      toast.success("Guest checked in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Check-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Render Step 1: Verification (for online bookings)
  if (step === 'verify' && requiresConfirmationCode) {
    return (
      // Added max-h-[80vh] and overflow-y-auto for scrolling
      <div className="space-y-6 p-1 max-h-[80vh] overflow-y-auto px-2 md:px-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Verify Booking</h3>
            <Badge variant="default">Online Booking</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Step 1 of 2: Verify guest identity
          </p>
        </div>

        {/* Guest Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Guest Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Guest Name:</span>
              <span className="font-medium">{guestName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Booking ID:</span>
              <span className="font-mono text-sm">{bookingId}</span>
            </div>
          </CardContent>
        </Card>

        {/* Verification Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Guest Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="guest@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Confirmation Code Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmationCode" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Confirmation Code *
              </Label>
              <Input
                id="confirmationCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground">
                The confirmation code was sent to the guest's email when booking
              </p>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-800">
                Please request the confirmation code from the guest. 
                After verification, you'll complete their registration details.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 pb-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={onCancel} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleVerification} 
            disabled={
              isLoading || 
              !email || 
              !validateEmail(email) ||
              !confirmationCode
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify & Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Render Step 2: Registration Form (for both online and walk-in)
  return (
    // Added max-h-[80vh] and overflow-y-auto for scrolling on this step too
    <div className="space-y-6 p-1 max-h-[80vh] overflow-y-auto px-2 md:px-4">
      {/* Header */}
      <div className="space-y-2 sticky top-0 bg-background z-10 pb-4 pt-2 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Complete Registration</h3>
          <Badge variant={bookingType === 'online' ? 'default' : 'secondary'}>
            {bookingType === 'online' ? 'Step 2 of 2' : 'Walk-in'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {bookingType === 'online' 
            ? "Verification successful! Now complete guest details."
            : "Fill in guest details to complete check-in"
          }
        </p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                disabled={isLoading}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={isLoading}
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading || bookingType === 'online'}
              placeholder="john.doe@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number *</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              disabled={isLoading}
              placeholder="+234 xxx xxx xxxx"
            />
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Street Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={isLoading}
              placeholder="123 Main Street"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                disabled={isLoading}
                placeholder="Lagos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                disabled={isLoading}
                placeholder="Lagos"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="arrivingFrom">Arriving From (Optional)</Label>
            <Input
              id="arrivingFrom"
              value={formData.arrivingFrom}
              onChange={(e) => handleInputChange('arrivingFrom', e.target.value)}
              disabled={isLoading}
              placeholder="City or Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Emergency Contact (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nextOfKinName">Next of Kin Name</Label>
            <Input
              id="nextOfKinName"
              value={formData.nextOfKinName}
              onChange={(e) => handleInputChange('nextOfKinName', e.target.value)}
              disabled={isLoading}
              placeholder="Emergency contact name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextOfKinPhone">Next of Kin Phone</Label>
            <Input
              id="nextOfKinPhone"
              type="tel"
              value={formData.nextOfKinPhone}
              onChange={(e) => handleInputChange('nextOfKinPhone', e.target.value)}
              disabled={isLoading}
              placeholder="+234 xxx xxx xxxx"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Room Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extraBedding"
              checked={formData.extraBedding}
              onCheckedChange={(checked) => handleInputChange('extraBedding', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="extraBedding" className="cursor-pointer">
              Request Extra Bedding
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              disabled={isLoading}
              placeholder="Any special requirements or requests..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 pb-2 border-t sticky bottom-0 bg-background z-10">
        <Button 
          variant="outline" 
          className="flex-1" 
          onClick={onCancel} 
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleRegistration} 
          disabled={
            isLoading || 
            !formData.firstName || 
            !formData.lastName || 
            !formData.email || 
            !validateEmail(formData.email) ||
            !formData.phoneNumber ||
            !formData.address ||
            !formData.city ||
            !formData.state
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking In...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Check-In
            </>
          )}
        </Button>
      </div>
    </div>
  );
}