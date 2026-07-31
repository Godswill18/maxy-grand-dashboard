// src/lib/shellLoader.ts
// Dismisses the inline shell loader painted directly in index.html (see
// there for why it exists) once React has actually mounted and committed
// its first real content. Called once from App's top-level effect — never
// gated on a minimum display time, only on the real mount signal.
export function dismissShellLoader(): void {
  const el = document.getElementById("shell-loader");
  if (!el) return;
  el.classList.add("shell-loader-hidden");
  window.setTimeout(() => el.remove(), 320);
}
