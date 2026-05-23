import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CheckCircle, Eye, EyeOff, Clock, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import axios from 'axios';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

type Step = 'enter-email' | 'enter-otp' | 'new-password' | 'success';

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]                         = useState<Step>('enter-email');
  const [email, setEmail]                       = useState('');
  const [otp, setOtp]                           = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState('');
  const [otpTimer, setOtpTimer]                 = useState(0);
  const [canResend, setCanResend]               = useState(false);

  // OTP countdown
  React.useEffect(() => {
    if (otpTimer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Step 1 — request OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address'); return; }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/users/forgot-password-otp`, { email: email.trim() });
      setStep('enter-otp');
      setOtpTimer(600);
      setCanResend(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError('');
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/users/forgot-password-otp`, { email: email.trim() });
      setOtpTimer(600);
      setCanResend(false);
      setOtp('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otp.trim()) { setError('Please enter the OTP'); return; }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/users/verify-forgot-otp`, { email: email.trim(), otp: otp.trim() });
      setStep('new-password');
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/users/reset-forgot-password`, {
        email: email.trim(),
        newPassword,
        confirmPassword,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 pb-4">
          {step !== 'success' && (
            <Link to="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit mb-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Link>
          )}
          <CardTitle className="text-2xl font-bold">
            {step === 'enter-email'  && 'Forgot Password'}
            {step === 'enter-otp'   && 'Enter OTP'}
            {step === 'new-password' && 'Set New Password'}
            {step === 'success'     && 'Password Reset'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {step === 'enter-email'  && 'Enter your registered email to receive a one-time password.'}
            {step === 'enter-otp'   && `A 6-digit OTP was sent to ${email}. It expires in 10 minutes.`}
            {step === 'new-password' && 'Create a new password for your account.'}
            {step === 'success'     && 'Your password has been reset successfully.'}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 'enter-email' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="yourname@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Send OTP
              </Button>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 'enter-otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="otp">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  required
                  disabled={loading}
                />
              </div>

              {/* Timer / resend */}
              <div className="flex items-center justify-between text-sm">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Resend in {fmtTime(otpTimer)}
                  </span>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
                Verify OTP
              </Button>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 'new-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    className="pl-10 pr-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Reset Password
              </Button>
            </form>
          )}

          {/* ── Step 4: Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <Button className="w-full" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
