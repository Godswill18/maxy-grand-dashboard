// src/components/GlobalLoader.tsx
// Full-screen branded loading overlay for true app-initialization moments
// only (auth check on first load/refresh/session restoration) — page-level
// data fetches use the existing skeleton components instead (see
// src/components/skeleton/*), never this. Matches the shell loader's dark
// background and logo-on-card treatment (index.html) so the handoff from
// the pre-mount shell loader is seamless, with no white/color gap between
// them. Fades via opacity only (GPU-friendly); the progress bar's slide
// respects prefers-reduced-motion (see .global-loader-bar-fill in index.css).
import { cn } from "@/lib/utils";

interface GlobalLoaderProps {
  // True while the real content underneath is already mounted and
  // interactive, and this overlay is just fading away on top of it — never
  // gates or delays that content, purely decorative during the transition.
  fadingOut?: boolean;
}

export function GlobalLoader({ fadingOut = false }: GlobalLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!fadingOut}
      aria-label="Loading Maxy Grand Hotel dashboard"
      className={cn(
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[#101418]",
        "transition-opacity duration-300 ease-out",
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in"
      )}
    >
      <div className="rounded-2xl bg-white px-7 py-5 shadow-2xl shadow-black/40">
        <img src="/mxlogo-black.png" alt="Maxy Grand Hotel" className="h-16 w-auto sm:h-20" />
      </div>
      <div className="h-[3px] w-40 overflow-hidden rounded-full bg-white/10">
        <div className="global-loader-bar-fill h-full w-2/5 rounded-full bg-[#2f927d]" />
      </div>
      <span className="sr-only">Loading, please wait…</span>
    </div>
  );
}
