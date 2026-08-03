import { useAuthStore } from "../store/useAuthStore";

const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Endpoints that must never trigger a silent-refresh retry — refreshing
// against these would either recurse (the refresh endpoint itself) or makes
// no sense (the caller isn't authenticated yet / is ending the session).
const EXCLUDED_PATHS = [
  '/api/users/login-user',
  '/api/users/login-guest',
  '/api/users/create-user',
  '/api/users/refresh-token',
  '/api/users/logout-user',
];

let patched = false;

/**
 * Makes an expiring access token invisible to the rest of the app: any 401
 * from our own API silently attempts one refresh-token rotation and retries
 * the original request once before giving up. Installed once, globally, so
 * none of the many existing fetch() call sites scattered across the store
 * files need to change — this codebase has no shared axios instance/request
 * layer to hang a conventional interceptor off of, so patching the one
 * global fetch is the equivalent for plain fetch() call sites.
 */
export const installAuthFetchPatch = () => {
  if (patched) return;
  patched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // Only string/URL call sites are eligible for retry — this codebase
    // never calls fetch(new Request(...)), so anything else just passes
    // through untouched rather than risk mishandling a one-shot body stream.
    if (typeof input !== 'string' && !(input instanceof URL)) {
      return originalFetch(input, init);
    }

    const url = input.toString();
    const isOurApi = url.startsWith(VITE_API_URL);
    const isExcluded = EXCLUDED_PATHS.some((path) => url.includes(path));

    const response = await originalFetch(input, init);

    if (!isOurApi || isExcluded || response.status !== 401) {
      return response;
    }

    // Dedup'd against every other concurrent 401 via refreshInFlight inside
    // the store — refresh tokens are single-use, so two callers rotating
    // the same one "at once" would look like theft and kill the session.
    const refreshed = await useAuthStore.getState().refreshAccessToken();
    if (!refreshed) {
      // Couldn't refresh (no refresh token, it's dead, or Redis/network
      // issue) — fall back to today's behavior: let the caller see the 401
      // and handle it however it already does.
      return response;
    }

    const newToken = localStorage.getItem('token');
    const headers = new Headers(init?.headers);
    if (headers.has('Authorization') && newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
    }

    return originalFetch(input, { ...init, headers });
  };
};
