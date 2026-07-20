import { useEffect } from 'react';
import { useNotificationSoundStore } from '@/store/useNotificationSoundStore';

type Priority = 'low' | 'medium' | 'high' | 'urgent';

// Short oscillator-based chime, synthesized client-side — no binary audio
// asset to source, host, or fail to load. Priority (not the ~20-value
// notification `type`) is the natural "how urgent should this feel" axis,
// which future-proofs per-category sounds without restructuring.
const TONE_PRESETS: Record<Priority, { frequencies: number[]; noteDuration: number }> = {
  low:    { frequencies: [523.25],                 noteDuration: 0.5 },  // C5, single soft note
  medium: { frequencies: [523.25, 659.25],         noteDuration: 0.45 }, // C5 -> E5
  high:   { frequencies: [523.25, 659.25, 783.99],  noteDuration: 0.4 }, // C5 -> E5 -> G5
  urgent: { frequencies: [659.25, 523.25, 659.25, 783.99], noteDuration: 0.35 }, // slightly longer, brighter
};

let audioContext: AudioContext | null = null;
let isPlaying = false;
const queue: Priority[] = [];

export const unlockAudio = () => {
  if (audioContext) {
    if (audioContext.state === 'suspended') audioContext.resume().catch(() => {});
    return;
  }
  try {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctor) audioContext = new Ctor();
  } catch {
    // Web Audio unavailable — sound will silently no-op elsewhere
  }
};

const playTone = (priority: Priority) =>
  new Promise<void>((resolve) => {
    if (!audioContext) {
      resolve();
      return;
    }
    const { frequencies, noteDuration } = TONE_PRESETS[priority];
    const ctx = audioContext;
    let t = ctx.currentTime;

    frequencies.forEach((freq) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, t);

      // Soft attack/decay envelope — avoids audible clicks at note boundaries.
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(t);
      oscillator.stop(t + noteDuration);

      t += noteDuration;
    });

    setTimeout(resolve, (t - ctx.currentTime) * 1000);
  });

const drainQueue = async () => {
  if (isPlaying) return;
  isPlaying = true;
  while (queue.length > 0) {
    const priority = queue.shift()!;
    await playTone(priority);
  }
  isPlaying = false;
};

/**
 * Plays a short (~1-3s, scaled by priority) synthesized chime. Never
 * overlaps — a notification arriving mid-play is queued and played next.
 * No-ops silently if audio hasn't been unlocked yet or is muted.
 */
export const playNotificationSound = (priority: Priority = 'medium') => {
  if (useNotificationSoundStore.getState().muted) return;
  if (!audioContext) return; // not unlocked yet — respects autoplay restrictions
  queue.push(priority);
  drainQueue();
};

/**
 * Call once at the app root. Arms the AudioContext on the first user gesture
 * anywhere in the app, since browsers block audio playback before that.
 */
export const useAudioUnlock = () => {
  useEffect(() => {
    const handler = () => {
      unlockAudio();
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };
  }, []);
};
