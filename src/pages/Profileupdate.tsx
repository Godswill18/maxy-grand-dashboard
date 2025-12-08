import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getProfileRoute, getProfileUpdateRoute, getSettingsRoute } from '@/components/utils/GetprofileRoute';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

interface FormData {
  accountNumber: string;
  bankName: string;
}

interface Toast {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const ProfileUpdate = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState<FormData>({
    accountNumber: '',
    bankName: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);

    // ✅ Get role-based routes
  const profileRoute = getProfileRoute(user?.role || '');
  const profileUpdateRoute = getProfileUpdateRoute(user?.role || '');
  const settingsRoute = getSettingsRoute(user?.role || '');

  // Fetch current profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/users/get-user`, {
          withCredentials: true,
        });
        setFormData({
          accountNumber: response.data.accountNumber || '',
          bankName: response.data.bankName || '',
        });
      } catch (err: any) {
        showToast('error', 'Failed to load profile data');
        console.error('Error fetching profile:', err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    if (!formData.accountNumber.trim() || !formData.bankName.trim()) {
      showToast('error', 'Please fill in all fields');
      return;
    }

    if (formData.accountNumber.trim().length < 8) {
      showToast('error', 'Account number must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/api/users/update-profile`,
        {
          accountNumber: formData.accountNumber.trim(),
          bankName: formData.bankName.trim(),
        },
        {
          withCredentials: true,
        }
      );

      showToast('success', 'Profile updated successfully!');
      setTimeout(() => {
        navigate(profileRoute);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update profile';
      showToast('error', errorMessage);
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold">Update Banking Information</h1>
          <p className=" mt-2">
            Update your bank account details for payroll and salary transfers
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

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Banking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Number */}
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-300 mb-2">
                  Account Number <span className="text-red-600">*</span>
                </label>
                <input
                  id="accountNumber"
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g., 1234567890"
                  disabled={loading}
                  className="w-full px-4 py-2 border text-gray-950 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100"
                  required
                />
                <p className="text-xs text-gray-300 mt-1">
                  Your bank account number (8+ characters)
                </p>
              </div>

              {/* Bank Name */}
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-300 mb-2">
                  Bank Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="bankName"
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="e.g., XYZ Bank"
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-950 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition disabled:bg-gray-100"
                  required
                />
                <p className="text-xs text-gray-300 mt-1">
                  The name of your bank
                </p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>🔒 Security Note:</strong> Your banking information is encrypted and stored securely. It will only be used for payroll processing.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Update Information
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Why do we need this information?</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✓ Direct salary transfers to your account</li>
            <li>✓ Faster and more secure payments</li>
            <li>✓ Automatic payroll processing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileUpdate;