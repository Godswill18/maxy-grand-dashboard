import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useBranchStore, Branch } from '../../store/useBranchStore'; // Changed path
import { toast } from 'sonner';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useStaffStore } from '../../store/useUserStore';

interface BranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch?: Branch | null; // Pass branch data for editing
}

type BranchFormData = Omit<Branch, '_id' | 'createdAt' | 'updatedAt'>;

export function BranchModal({ isOpen, onClose, branch }: BranchModalProps) {
  const { createBranch, updateBranch, isLoading } = useBranchStore();
  const [formData, setFormData] = useState<BranchFormData>({
    name: '',
    city: '',
    address: '',
    phoneNumber: '',
    manager: '',
    roomCount: 0,
    staffCount: 0,
    isActive: true,
  });

  const isEditMode = !!branch;

  useEffect(() => {
    // If in edit mode, populate the form with branch data
    if (isEditMode) {
      setFormData({
        name: branch.name,
        city: branch.city,
        address: branch.address,
        phoneNumber: branch.phoneNumber,
        manager: branch.manager || '',
        roomCount: branch.roomCount || 0,
        staffCount: branch.staffCount || 0,
        isActive: branch.isActive,
      });
    } else {
      // Reset for create mode
      setFormData({
        name: '',
        city: '',
        address: '',
        phoneNumber: '',
        manager: '',
        roomCount: 0,
        staffCount: 0,
        isActive: true,
      });
    }
  }, [branch, isEditMode, isOpen]);

  // Load admins (possible managers) for the Select
  const { admins, fetchAdmins, isLoading: adminsLoading } = useStaffStore();

  useEffect(() => {
    // fetch admins once when modal mounts
    fetchAdmins();
  }, [fetchAdmins]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    // For numeric fields stored as numbers in state, strip non-digits and store as number
    if (name === 'roomCount' || name === 'staffCount') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: digitsOnly === '' ? 0 : Number(digitsOnly) }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isActive: checked }));
  };

  const handleManagerChange = (value: string) => {
    setFormData((prev) => ({ ...prev, manager: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let success = false;
    if (isEditMode) {
      success = await updateBranch(branch._id, formData);
    } else {
      success = await createBranch(formData);
    }

    if (success) {
      toast.success(`Branch ${isEditMode ? 'updated' : 'created'} successfully!`);
      onClose();
    } else {
      toast.error('An error occurred. kindly check your inputs.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Branch' : 'Create New Branch'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="city" className="text-right">City</Label>
            <Input id="city" name="city" value={formData.city} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="address" className="text-right">Address</Label>
            <Input id="address" name="address" value={formData.address} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phoneNumber" className="text-right">Phone</Label>
            <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="manager" className="text-right">Manager</Label>
            <div className="col-span-3">
              <Select value={formData.manager} onValueChange={handleManagerChange}>
                <SelectTrigger>
                  <SelectValue placeholder={adminsLoading ? 'Loading managers...' : 'Select a manager'} />
                </SelectTrigger>
                <SelectContent>
                  {(admins || []).length === 0 ? (
                    <SelectItem value="null" disabled>{adminsLoading ? 'Loading...' : 'No admins found'}</SelectItem>
                  ) : (
                    (admins || []).map((admin) => (
                      <SelectItem key={admin._id} value={admin._id}>
                        {admin.firstName} {admin.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roomCount" className="text-right">Rooms</Label>
            <Input
              id="roomCount"
              name="roomCount"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={formData.roomCount === 0 ? '' : String(formData.roomCount)}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="staffCount" className="text-right">Staff</Label>
            <Input
              id="staffCount"
              name="staffCount"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={formData.staffCount === 0 ? '' : String(formData.staffCount)}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isActive" className="text-right">Active</Label>
            <Switch id="isActive" checked={formData.isActive} onCheckedChange={handleSwitchChange} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isLoading}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}