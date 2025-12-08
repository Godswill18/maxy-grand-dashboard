import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Clock } from 'lucide-react';
import axios from 'axios';
import { getProfileRoute, getProfileUpdateRoute, getSettingsRoute } from '@/components/utils/GetprofileRoute';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

type Step = 'email-verification' | 'otp-verification' | 'password-reset' | 'success';

export const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>('email-verification');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(false);

    // ✅ Get role-based routes
  const profileRoute = getProfileRoute(user?.role || '');
  const profileUpdateRoute = getProfileUpdateRoute(user?.role || '');
  const settingsRoute = getSettingsRoute(user?.role || '');

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Step 1: Request OTP
  const handleRequestOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      showToast('error', 'Please enter your email');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/users/request-password-reset`,
        { email },
        { withCredentials: true }
      );

      showToast('success', 'OTP sent to your email!');
      setStep('otp-verification');
      setOtpTimer(600); // 10 minutes
      setCanResendOtp(false);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // OTP Timer
  React.useEffect(() => {
    if (otpTimer <= 0) {
      setCanResendOtp(true);
      return;
    }
    const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpTimer]);

  // Resend OTP
  const handleResendOTP = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/users/request-password-reset`,
        { email },
        { withCredentials: true }
      );
      showToast('success', 'New OTP sent!');
      setOtpTimer(600);
      setCanResendOtp(false);
    } catch (err: any) {
      showToast('error', 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      showToast('error', 'Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/users/verify-reset-otp`,
        { otp },
        { withCredentials: true }
      );

      showToast('success', 'OTP verified! Now set your new password.');
      setStep('password-reset');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Invalid OTP';
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      showToast('error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 4) {
      showToast('error', 'Password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/users/reset-password`,
        { newPassword, confirmPassword },
        { withCredentials: true }
      );

      showToast('success', 'Password reset successfully!');
      setStep('success');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password';
      showToast('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header with Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(profileRoute)}
            className="mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Profile
          </Button>
          <h1 className="text-3xl font-bold ">Change Password</h1>
          <p className=" mt-2">
            Secure your account with a new password
          </p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : toast.type === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle
                className="text-green-600 flex-shrink-0 mt-0.5"
                size={20}
              />
            ) : (
              <AlertCircle
                className={`flex-shrink-0 mt-0.5 ${
                  toast.type === 'error'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}
                size={20}
              />
            )}
            <p
              className={
                toast.type === 'success'
                  ? 'text-green-800'
                  : toast.type === 'error'
                    ? 'text-red-800'
                    : 'text-blue-800'
              }
            >
              {toast.message}
            </p>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex-1 h-1 rounded ${step === 'email-verification' || step === 'otp-verification' || step === 'password-reset' || step === 'success' ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`w-2 h-2 mx-2 rounded-full ${step === 'otp-verification' || step === 'password-reset' || step === 'success' ? 'bg-primary' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-1 rounded ${step === 'password-reset' || step === 'success' ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`w-2 h-2 mx-2 rounded-full ${step === 'success' ? 'bg-primary' : 'bg-gray-300'}`} />
            <div className={`flex-1 h-1 rounded ${step === 'success' ? 'bg-primary' : 'bg-gray-200'}`} />
          </div>
          <div className="flex justify-between text-xs">
            <span>Email</span>
            <span>Verify OTP</span>
            <span>New Password</span>
          </div>
        </div>

        {/* Step 1: Email Verification */}
        {step === 'email-verification' && (
          <Card>
            <CardHeader>
              <CardTitle>Verify Your Email</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <p className="text-sm">
                  We'll send you a one-time password (OTP) to verify your identity
                </p>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={loading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100"
                    required
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    Enter the email address associated with your account
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(profileRoute)}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send OTP'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp-verification' && (
          <Card>
            <CardHeader>
              <CardTitle>Enter OTP</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-blue-800">
                    Check your email ({email}) for a 6-digit OTP
                  </p>
                </div>

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    One-Time Password <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    disabled={loading}
                    className="w-full px-4 py-3 border text-gray-900 border-gray-300 rounded-lg text-center text-xl font-semibold tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100"
                    required
                  />
                </div>

                {/* Timer */}
                {otpTimer > 0 && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Clock size={16} />
                    OTP expires in {formatTime(otpTimer)}
                  </div>
                )}

                {/* Resend OTP */}
                {canResendOtp && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResendOTP}
                    disabled={loading || otpTimer > 0}
                    className="w-full text-primary hover:bg-primary/10"
                  >
                    Resend OTP
                  </Button>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('email-verification')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify OTP'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Password Reset */}
        {step === 'password-reset' && (
          <Card>
            <CardHeader>
              <CardTitle>Set New Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <p className="text-gray-300 text-sm">
                  Create a strong password that you'll remember
                </p>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    New Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">
                    At least 4 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password <span className="text-red-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      className="w-full px-4 py-2 border text-gray-900 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Password Match Indicator */}
                {newPassword && confirmPassword && (
                  <div className={`text-sm ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('otp-verification')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || newPassword !== confirmPassword || !newPassword}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-300 mb-2">Password Updated Successfully!</h2>
              <p className="text-gray-300 mb-6">
                Your password has been changed successfully. You'll use your new password on your next login.
              </p>
              <Button
                onClick={() => navigate(profileRoute)}
                className="bg-primary hover:bg-primary/90"
              >
                Back to Profile
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;