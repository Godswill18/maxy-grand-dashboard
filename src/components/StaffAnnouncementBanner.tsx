import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

interface StaffAnnouncement {
  _id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  ctaButtonText: string | null;
  ctaButtonUrl: string | null;
}

export function StaffAnnouncementBanner() {
  const { token, isAuthenticated } = useAuthStore();
  const [announcement, setAnnouncement] = useState<StaffAnnouncement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const fetchStaffAnnouncement = async () => {
      try {
        const res = await fetch(`${VITE_API_URL}/api/announcements/staff`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.data) return;

        const ann = data.data as StaffAnnouncement;
        const seenKey = `staff_announcement_seen_${ann._id}`;
        if (sessionStorage.getItem(seenKey)) return;

        setAnnouncement(ann);
        setOpen(true);
      } catch {
        // Non-critical — silently ignore
      }
    };

    fetchStaffAnnouncement();
  }, [isAuthenticated, token]);

  const handleClose = () => {
    if (announcement) {
      sessionStorage.setItem(`staff_announcement_seen_${announcement._id}`, '1');
    }
    setOpen(false);
  };

  if (!announcement) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
        </DialogHeader>

        {announcement.imageUrl && (
          <img
            src={`${VITE_API_URL}/${announcement.imageUrl}`}
            alt={announcement.title}
            className="w-full rounded-md object-cover max-h-52"
          />
        )}

        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {announcement.content}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          {announcement.ctaButtonText && announcement.ctaButtonUrl && (
            <Button
              asChild
              onClick={handleClose}
            >
              <a href={announcement.ctaButtonUrl} target="_blank" rel="noopener noreferrer">
                {announcement.ctaButtonText}
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Dismiss
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
