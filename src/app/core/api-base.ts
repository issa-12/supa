// Routes the app's relative `/api/*` fetch calls to the right backend per host.
//
// - Local dev: `proxy.conf.json` proxies `/api` → localhost:3000 (same-origin).
// - Docker:    nginx proxies `/api` → the backend container (same-origin).
// - Vercel:    the SPA is static with no backend on its origin. Vercel's
//              rewrites to an EXTERNAL backend strip the `Authorization` header,
//              so every authenticated call would 401. Instead we call the Render
//              backend directly (cross-origin) — which needs CORS on the backend
//              (set FRONTEND_URL to the Vercel origin on Render).
//
// To avoid editing ~two dozen `fetch('/api/...')` call sites, we install a tiny
// fetch shim ONCE that rewrites only relative `/api/` string URLs to the
// absolute backend. Supabase SDK calls use absolute https URLs (not `/api/`),
// so they're untouched.

const RENDER_API = 'https://supa-2l60.onrender.com';

export function resolveApiBase(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host.endsWith('.vercel.app')) return RENDER_API;
  // localhost (dev) and Docker/nginx serve /api on the same origin → relative.
  return '';
}

interface ApiBaseWindow extends Window {
  __apiBaseInstalled?: boolean;
}

export function installApiBase(): void {
  if (typeof window === 'undefined') return;
  const w = window as ApiBaseWindow;
  const base = resolveApiBase();
  if (!base || w.__apiBaseInstalled) return;
  w.__apiBaseInstalled = true;

  const original = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return original(base + input, init);
    }
    return original(input as RequestInfo | URL, init);
  }) as typeof window.fetch;
}
