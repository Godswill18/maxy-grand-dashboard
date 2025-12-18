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

// ✅ COMPLETE INTERFACE - All fields needed
export interface CheckInFormData {
  // Step 1: Verification
  confirmationCode: string;
  email: string;
  
  // Step 2: Registration
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  arrivingFrom?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  specialRequests?: string;
  extraBedding?: boolean;
  password?: string;
  userId?: string;
}

interface CheckInFormProps {
  bookingId: string;
  guestName: string;
  bookingType: 'online' | 'walk-in';
  onConfirm: (formData: CheckInFormData) => Promise<void>;
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
  
  // ✅ SINGLE FORM STATE - All data in one place
  const [formData, setFormData] = useState<CheckInFormData>({
    confirmationCode: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    city: '',
    state: '',
    arrivingFrom: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    specialRequests: '',
    extraBedding: false,
    password: '',
    userId: '',
  });

  const [verificationError, setVerificationError] = useState('');

  const requiresConfirmationCode = bookingType === 'online';

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    return phone.length >= 10;
  };

  // ✅ STEP 1: Verify confirmation code (ONLINE ONLY)
  const handleVerification = async () => {
    if (!formData.email || !validateEmail(formData.email)) {
      setVerificationError('Please enter a valid email address');
      return;
    }

    if (requiresConfirmationCode && !formData.confirmationCode) {
      setVerificationError('Confirmation code is required');
      return;
    }

    setIsLoading(true);
    setVerificationError('');
    try {
      console.log('📤 Verifying confirmation code...', { 
        email: formData.email, 
        confirmationCode: formData.confirmationCode 
      });
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/bookings/verify-code/${bookingId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ confirmationCode: formData.confirmationCode }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Invalid confirmation code');
      }

      console.log('✅ Verification successful!');
      toast.success('Verification successful! Please complete guest details.');
      
      // ✅ Pre-fill registration form
      const nameParts = guestName.split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts.length >= 2 ? nameParts[0] : guestName,
        lastName: nameParts.length >= 2 ? nameParts.slice(1).join(' ') : "",
        // ✅ IMPORTANT: Keep email and confirmationCode
        email: formData.email,
        confirmationCode: formData.confirmationCode,
      }));
      
      setStep('register');
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      setVerificationError(error.message || "Verification failed");
      toast.error(error.message || "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ STEP 2: Complete registration (BOTH ONLINE & WALK-IN)
  const handleRegistration = async () => {
    // ✅ VALIDATE ALL REQUIRED FIELDS
    if (!formData.firstName?.trim()) {
      return toast.error("First name is required");
    }
    if (!formData.lastName?.trim()) {
      return toast.error("Last name is required");
    }
    if (!formData.email || !validateEmail(formData.email)) {
      return toast.error("Please enter a valid email address");
    }
    if (!formData.phoneNumber || !validatePhone(formData.phoneNumber)) {
      return toast.error("Please enter a valid phone number (at least 10 digits)");
    }
    if (!formData.address?.trim()) {
      return toast.error("Street address is required");
    }
    if (!formData.city?.trim()) {
      return toast.error("City is required");
    }
    if (!formData.state?.trim()) {
      return toast.error("State is required");
    }

    // ✅ For online bookings, confirmation code must be present
    if (bookingType === 'online' && !formData.confirmationCode) {
      return toast.error("Confirmation code is missing. Please verify again.");
    }

    setIsLoading(true);
    try {
      console.log('📋 SUBMITTING COMPLETE FORM DATA:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        hasConfirmationCode: !!formData.confirmationCode,
        hasAddress: !!formData.address,
      });

      // ✅ Call onConfirm with COMPLETE form data
      await onConfirm(formData);

      // Success is handled by parent component
    } catch (error: any) {
      console.error('❌ Check-in error:', error);
      // Don't set isLoading here - let parent handle it
      throw error;
    }
  };

  const handleInputChange = (field: keyof CheckInFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ====== RENDER STEP 1: VERIFICATION (ONLINE ONLY) ======
  if (step === 'verify' && requiresConfirmationCode) {
    return (
      <div className="space-y-6 p-1 max-h-[80vh] overflow-y-auto px-2 md:px-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Verify Booking</h3>
            <Badge variant="default">Online Booking - Step 1 of 2</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Verify guest identity using confirmation code
          </p>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Verification Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Guest Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="guest@example.com"
                value={formData.email}
                onChange={(e) => {
                  handleInputChange('email', e.target.value);
                  setVerificationError('');
                }}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmationCode" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Confirmation Code *
              </Label>
              <Input
                id="confirmationCode"
                type="text"
                placeholder="Enter code"
                value={formData.confirmationCode}
                onChange={(e) => {
                  handleInputChange('confirmationCode', e.target.value.toUpperCase());
                  setVerificationError('');
                }}
                disabled={isLoading}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                The confirmation code was sent to the guest's email when booking
              </p>
            </div>

            {verificationError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-sm text-red-800">
                  ❌ {verificationError}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-800">
                Please request the confirmation code from the guest. 
                After verification, you'll complete their registration details.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

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
              !formData.email || 
              !validateEmail(formData.email) ||
              !formData.confirmationCode
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

  // ====== RENDER STEP 2: REGISTRATION (BOTH ONLINE & WALK-IN) ======
  return (
    <div className="space-y-6 p-1 max-h-[80vh] overflow-y-auto px-2 md:px-4">
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
                disabled={true}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                disabled={true}
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
            {/* {console.log(formData)} */}
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
              value={formData.arrivingFrom || ''}
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
              value={formData.nextOfKinName || ''}
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
              value={formData.nextOfKinPhone || ''}
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
              checked={formData.extraBedding || false}
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
              value={formData.specialRequests || ''}
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
            !formData.firstName?.trim() || 
            !formData.lastName?.trim() || 
            !formData.email || 
            !validateEmail(formData.email) ||
            !formData.phoneNumber ||
            !formData.address?.trim() ||
            !formData.city?.trim() ||
            !formData.state?.trim()
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