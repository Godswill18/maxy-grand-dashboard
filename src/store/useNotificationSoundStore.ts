import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface NotificationSoundState {
  muted: boolean;
  toggleMuted: () => void;
}

// Kept separate from useNotificationStore, which stays unpersisted (server is
// the source of truth for notifications themselves) — this mirrors how
// useAuthStore isolates its own persisted slice.
export const useNotificationSoundStore = create<NotificationSoundState>()(
  persist(
    (set, get) => ({
      muted: false,
      toggleMuted: () => set({ muted: !get().muted }),
    }),
    {
      name: 'notification-sound-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
