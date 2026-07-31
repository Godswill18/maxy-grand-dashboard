// src/lib/theme.ts
// Single source of truth for the dashboard's light/dark toggle. Previously
// duplicated across 5 separate dashboard layout components, each applying
// the `dark` class independently inside its own post-mount useEffect — a
// source of both a one-frame light->dark flash (the class was only ever
// applied after first paint) and drift between the copies. initTheme()
// must run synchronously before React renders (see main.tsx) so the class
// is already correct at first paint; setDarkMode()/isDarkMode() back the
// existing toggle UI in each layout.
const STORAGE_KEY = "darkMode";

export function isDarkMode(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function setDarkMode(isDark: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(isDark));
  document.documentElement.classList.toggle("dark", isDark);
}

export function initTheme(): void {
  document.documentElement.classList.toggle("dark", isDarkMode());
}
