import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export default function Settings() {
  const { user, token } = useAuthStore();
  const hotelId = user?.hotelId;

  const [holdDurationMinutes, setHoldDurationMinutes] = useState<number>(15);
  const [isSavingHold, setIsSavingHold] = useState(false);

  // Load current holdDurationMinutes from the hotel record
  useEffect(() => {
    if (!hotelId) return;
    fetch(`${VITE_API_URL}/api/hotels/${hotelId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        if (data?.data?.holdDurationMinutes) {
          setHoldDurationMinutes(data.data.holdDurationMinutes);
        }
      })
      .catch(() => {});
  }, [hotelId]);

  const saveHoldDuration = async () => {
    if (!hotelId) return;
    setIsSavingHold(true);
    try {
      const res = await fetch(`${VITE_API_URL}/api/hotels/${hotelId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ holdDurationMinutes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save');
      toast.success('Hold duration updated successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update hold duration.');
    } finally {
      setIsSavingHold(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your branch and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="john.doe@maxygrand.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" defaultValue="+1 234 567 8901" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Branch Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="branch">Branch Name</Label>
              <Input id="branch" defaultValue="Downtown Branch" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue="123 Main Street, City Center" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Room Capacity</Label>
              <Input id="capacity" type="number" defaultValue="50" disabled />
            </div>
            <p className="text-sm text-muted-foreground">
              Contact SuperAdmin to modify branch-level settings
            </p>
          </CardContent>
        </Card>

        {/* Booking Hold Duration — SuperAdmin configurable */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Settings</CardTitle>
            <CardDescription>
              Configure how long a guest's room reservation is held while they complete payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holdDuration">Temporary Hold Duration (minutes)</Label>
              <Input
                id="holdDuration"
                type="number"
                min={1}
                max={60}
                step={1}
                value={holdDurationMinutes}
                onChange={e => setHoldDurationMinutes(Number(e.target.value))}
              />
              <p className="text-sm text-muted-foreground">
                When a guest proceeds to checkout, their selected room is reserved for this many
                minutes. If payment is not completed within this window, the room is automatically
                released back to inventory. Range: 1–60 minutes.
              </p>
            </div>
            <Button onClick={saveHoldDuration} disabled={isSavingHold}>
              {isSavingHold ? 'Saving…' : 'Save Hold Duration'}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Request Updates</p>
                <p className="text-sm text-muted-foreground">Notify when requests are approved</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Staff Alerts</p>
                <p className="text-sm text-muted-foreground">Get alerts for staff issues</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Reports</p>
                <p className="text-sm text-muted-foreground">Receive daily performance summary</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button>Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
