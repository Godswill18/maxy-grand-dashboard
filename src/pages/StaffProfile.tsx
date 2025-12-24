import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Edit,
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import axios from 'axios';
import { getChangePasswordRoute, getProfileUpdateRoute, getSettingsRoute } from '@/components/utils/GetprofileRoute';

interface UserProfile {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: string;
  accountNumber?: string;
  bankName?: string;
  isActive: boolean;
}

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export const StaffProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

   // ✅ Get role-based routes using the utility function
  const profileUpdateRoute = getProfileUpdateRoute(user?.role || '');
  const changePasswordRoute = getChangePasswordRoute(user?.role || '');
  const settingsRoute = getSettingsRoute(user?.role || '');

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/users/get-user`, {
          withCredentials: true,
        });
        setUser(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-red-800 font-medium">Error Loading Profile</p>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No user data available</p>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    superadmin: 'bg-purple-100 text-purple-800',
    admin: 'bg-blue-100 text-blue-800',
    receptionist: 'bg-green-100 text-green-800',
    cleaner: 'bg-yellow-100 text-yellow-800',
    waiter: 'bg-orange-100 text-orange-800',
    headWaiter: 'bg-red-100 text-red-800',
    guest: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold ">My Profile</h1>
          <p className=" mt-2">Manage your account information and security settings</p>
        </div>

        {/* Status Banner */}
        {user.isActive ? (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-green-800 font-medium">Account Active</p>
              <p className="text-green-700 text-sm">Your account is active and ready to use</p>
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-medium">Account Inactive</p>
              <p className="text-red-700 text-sm">Please contact an administrator</p>
            </div>
          </div>
        )}

        {/* Main Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User size={24} className="text-primary" />
                Personal Information
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(profileUpdateRoute)}
              >
                <Edit size={16} className="mr-2" />
                Edit Profile
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ✅ UPDATED: Split first name and last name */}
              <div>
                <label className="text-sm font-medium">First Name</label>
                <p className="text-lg font-semibold text-gray-400 mt-1">
                  {user.firstName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Last Name</label>
                <p className="text-lg font-semibold text-gray-400 mt-1">
                  {user.lastName}
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <p className="text-lg text-gray-400 font-semibold mt-1">{user.email}</p>
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone size={16} />
                  Phone Number
                </label>
                <p className="text-lg text-gray-400 font-semibold mt-1">
                  {user.phoneNumber || 'Not provided'}
                </p>
              </div>

              {/* Role */}
              <div>
                <label className="text-sm font-medium  flex items-center gap-2">
                  <Briefcase size={16} />
                  Position
                </label>
                <div className="mt-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                      roleColors[user.role] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.role.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banking Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign size={24} className="text-green-600" />
                Banking Information
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(profileUpdateRoute)}
              >
                <Edit size={16} className="mr-2" />
                Update
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Number */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">Account Number</label>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {user.accountNumber ? (
                    <span className="font-mono tracking-wider">
                      {user.accountNumber.slice(-4).padStart(user.accountNumber.length, '*')}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Not set</span>
                  )}
                </p>
              </div>

              {/* Bank Name */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-600">Bank Name</label>
                <p className="text-lg font-semibold text-gray-900 mt-2">
                  {user.bankName || <span className="text-gray-400 italic">Not set</span>}
                </p>
              </div>
            </div>
            {(!user.accountNumber || !user.bankName) && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  ⚠️ Please complete your banking information for payroll processing
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock size={24} className="text-orange-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Keep your account secure by regularly updating your password
            </p>
            <Button
              onClick={() => navigate(changePasswordRoute)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Lock size={16} className="mr-2" />
              Change Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffProfile;