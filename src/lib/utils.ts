import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves a stored image path/URL to something an <img> tag can load.
 * - Absolute MinIO/CDN URLs (new uploads) are returned as-is.
 * - Legacy relative disk paths (old uploads, e.g. "uploads/Images/roomGallery/x.jpg")
 *   are prefixed with the backend's static-file base URL, matching current behavior.
 * - Falsy/empty input returns the provided fallback (or "" if none given).
 */
export function resolveImageUrl(imagePath?: string | null, fallback = ""): string {
  if (!imagePath) return fallback;
  if (imagePath.startsWith("http")) return imagePath;
  const base = (import.meta as any).env?.VITE_BACKEND_IMAGE_URL || "http://localhost:5000";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  return `${normalizedBase}${normalizedPath}`;
}
