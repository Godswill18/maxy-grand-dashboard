import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAnnouncementStore, Announcement } from '@/store/useAnnouncementStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useBranchStore } from '@/store/useBranchStore';

interface Props {
  open: boolean;
  onClose: () => void;
  announcement?: Announcement | null;
}

export function AnnouncementModal({ open, onClose, announcement }: Props) {
  const isEdit = !!announcement;
  const { createAnnouncement, updateAnnouncement, isLoading } = useAnnouncementStore();
  const { user } = useAuthStore();
  const { branches, fetchBranches } = useBranchStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'active' | 'draft'>('draft');
  const [targetAudience, setTargetAudience] = useState<'guest' | 'staff' | 'both'>('guest');
  const [hotelId, setHotelId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [ctaButtonText, setCtaButtonText] = useState('');
  const [ctaButtonUrl, setCtaButtonUrl] = useState('');
  const [priority, setPriority] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const isSuperAdmin = user?.role === 'superadmin';

  useEffect(() => {
    if (isSuperAdmin && open) fetchBranches();
  }, [open, isSuperAdmin]);

  useEffect(() => {
    if (open && announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setStatus(announcement.status);
      setTargetAudience(announcement.targetAudience);
      const hId = announcement.hotelId
        ? typeof announcement.hotelId === 'object'
          ? announcement.hotelId._id
          : announcement.hotelId
        : '';
      setHotelId(hId);
      setStartDate(announcement.startDate ? announcement.startDate.slice(0, 10) : '');
      setEndDate(announcement.endDate ? announcement.endDate.slice(0, 10) : '');
      setCtaButtonText(announcement.ctaButtonText || '');
      setCtaButtonUrl(announcement.ctaButtonUrl || '');
      setPriority(String(announcement.priority ?? 0));
    } else if (open && !announcement) {
      setTitle('');
      setContent('');
      setStatus('draft');
      setTargetAudience('guest');
      setHotelId('');
      setStartDate('');
      setEndDate('');
      setCtaButtonText('');
      setCtaButtonUrl('');
      setPriority('0');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [open, announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    if (ctaButtonUrl && !ctaButtonUrl.startsWith('https://')) {
      toast.error('CTA URL must start with https://');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('content', content.trim());
    formData.append('status', status);
    formData.append('targetAudience', targetAudience);
    formData.append('priority', priority);
    if (isSuperAdmin && hotelId) formData.append('hotelId', hotelId);
    if (startDate) formData.append('startDate', startDate);
    if (endDate) formData.append('endDate', endDate);
    if (ctaButtonText.trim()) formData.append('ctaButtonText', ctaButtonText.trim());
    if (ctaButtonUrl.trim()) formData.append('ctaButtonUrl', ctaButtonUrl.trim());
    if (imageFile) formData.append('image', imageFile);

    let success: boolean;
    if (isEdit && announcement) {
      success = await updateAnnouncement(announcement._id, formData);
    } else {
      success = await createAnnouncement(formData);
    }

    if (success) {
      toast.success(isEdit ? 'Announcement updated' : 'Announcement created');
      onClose();
    } else {
      toast.error(isEdit ? 'Failed to update announcement' : 'Failed to create announcement');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="ann-title">Title *</Label>
            <Input
              id="ann-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              required
            />
          </div>

          {/* Content */}
          <div className="space-y-1">
            <Label htmlFor="ann-content">Content *</Label>
            <Textarea
              id="ann-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the announcement or promotion..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Target Audience */}
            <div className="space-y-1">
              <Label>Target Audience</Label>
              <Select value={targetAudience} onValueChange={(v: any) => setTargetAudience(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest">Guests</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Branch selector — superadmin only */}
          {isSuperAdmin && (
            <div className="space-y-1">
              <Label>Branch (leave blank for global)</Label>
              <Select value={hotelId || 'all'} onValueChange={(v) => setHotelId(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All branches (global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All branches (global)</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b._id} value={b._id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="space-y-1">
              <Label htmlFor="ann-start">Start Date</Label>
              <Input
                id="ann-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <Label htmlFor="ann-end">End Date</Label>
              <Input
                id="ann-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* CTA Button Text */}
            <div className="space-y-1">
              <Label htmlFor="ann-cta-text">CTA Button Text (optional)</Label>
              <Input
                id="ann-cta-text"
                value={ctaButtonText}
                onChange={(e) => setCtaButtonText(e.target.value)}
                placeholder="e.g. Book Now"
              />
            </div>

            {/* CTA Button URL */}
            <div className="space-y-1">
              <Label htmlFor="ann-cta-url">CTA Button URL (optional)</Label>
              <Input
                id="ann-cta-url"
                value={ctaButtonUrl}
                onChange={(e) => setCtaButtonUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <Label htmlFor="ann-priority">Priority (higher = shown first)</Label>
            <Input
              id="ann-priority"
              type="number"
              min="0"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>

          {/* Image */}
          <div className="space-y-1">
            <Label htmlFor="ann-image">
              Banner Image {isEdit ? '(leave empty to keep current)' : '(optional)'}
            </Label>
            <Input
              id="ann-image"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
