import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, XCircle, Mail, Key } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";

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
  const [email, setEmail] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);

  // Determine if confirmation code is required
  const requiresConfirmationCode = bookingType === 'online';

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailVerified(false);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmationCode(e.target.value);
    setCodeVerified(false);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Validate email
    if (!email || !validateEmail(email)) {
      return toast.error("Please enter a valid email address");
    }

    // Validate confirmation code for online bookings
    if (requiresConfirmationCode && !confirmationCode) {
      return toast.error("Confirmation code is required for online bookings");
    }

    setIsLoading(true);
    try {
      await onConfirm(email, confirmationCode);
      toast.success("Guest checked in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Check-in failed. Please verify your details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Check-in Guest</h3>
          <Badge variant={bookingType === 'online' ? 'default' : 'secondary'}>
            {bookingType === 'online' ? 'Online Booking' : 'Walk-in'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Verify guest identity to complete check-in
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
              onChange={handleEmailChange}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className={emailVerified ? 'border-green-500' : ''}
            />
            <p className="text-xs text-muted-foreground">
              Enter the email address associated with this booking
            </p>
          </div>

          {/* Confirmation Code Field (Only for Online Bookings) */}
          {requiresConfirmationCode && (
            <div className="space-y-2">
              <Label htmlFor="confirmationCode" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Confirmation Code *
              </Label>
              <Input
                id="confirmationCode"
                type="text"
                placeholder="Enter confirmation code"
                value={confirmationCode}
                onChange={handleCodeChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className={codeVerified ? 'border-green-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                The confirmation code was sent to the guest's email when booking
              </p>
            </div>
          )}

          {/* Walk-in Info Alert */}
          {!requiresConfirmationCode && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-sm text-amber-800">
                <strong>Walk-in Booking:</strong> No confirmation code required. 
                Just verify the guest's email address to proceed.
              </AlertDescription>
            </Alert>
          )}

          {/* Online Booking Info Alert */}
          {requiresConfirmationCode && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-800">
                <strong>Online Booking:</strong> Please request the confirmation code 
                from the guest. It was sent to their email during booking.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">Security Notice</p>
              <p className="text-xs text-gray-600">
                Guest identity verification is required for all check-ins. 
                {requiresConfirmationCode 
                  ? " Both email and confirmation code must match our records."
                  : " The email address must match our booking records."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
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
          onClick={handleSubmit} 
          disabled={
            isLoading || 
            !email || 
            !validateEmail(email) ||
            (requiresConfirmationCode && !confirmationCode)
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

      {/* Help Text */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          Having trouble? Contact support or verify booking details with the guest.
        </p>
      </div>
    </div>
  );
}