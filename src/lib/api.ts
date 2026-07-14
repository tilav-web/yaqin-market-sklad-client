import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_COOKIE = 'ym_access';
const REFRESH_COOKIE = 'ym_refresh';

// `secure` is gated on NODE_ENV (inlined at build time by Next.js) rather than
// hardcoded true: local dev serves the admin panel over plain http://localhost,
// and browsers silently refuse to store `secure` cookies on non-https origins —
// hardcoding it would break the documented local dev / OTP login flow. Prod is
// served over https, so this still gets the hardening where it matters.
const isProd = process.env.NODE_ENV === 'production';
const COOKIE_OPTS = { secure: isProd, sameSite: 'strict' as const };

export const tokenStore = {
  get access() {
    return Cookies.get(ACCESS_COOKIE);
  },
  get refresh() {
    return Cookies.get(REFRESH_COOKIE);
  },
  save(access: string, refresh: string) {
    Cookies.set(ACCESS_COOKIE, access, { ...COOKIE_OPTS, expires: 7 });
    Cookies.set(REFRESH_COOKIE, refresh, { ...COOKIE_OPTS, expires: 30 });
  },
  clear() {
    Cookies.remove(ACCESS_COOKIE);
    Cookies.remove(REFRESH_COOKIE);
  },
};

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const t = tokenStore.access;
  if (t) {
    config.headers.set('Authorization', `Bearer ${t}`);
  }
  return config;
});

// Single-flight refresh: on a 401 we try to mint a new token pair once, then
// replay the original request. Concurrent 401s share the same refresh promise.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const rt = tokenStore.refresh;
  if (!rt) throw new Error('No refresh token');
  const res = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_URL}/api/auth/refresh`,
    { refreshToken: rt },
    { timeout: 15000 },
  );
  tokenStore.save(res.data.accessToken, res.data.refreshToken);
  return res.data.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    // Don't try to refresh the refresh call itself, and only retry once.
    const isAuthCall = typeof original?.url === 'string' && original.url.includes('/auth/');
    if (status === 401 && original && !original._retry && !isAuthCall && tokenStore.refresh) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? runRefresh();
        const newAccess = await refreshPromise;
        refreshPromise = null;
        original.headers.set('Authorization', `Bearer ${newAccess}`);
        return api(original);
      } catch (e) {
        refreshPromise = null;
        // Only a genuine rejection from the server (refresh token invalid,
        // expired, or revoked) means the session is actually over. A network
        // error, timeout, or 5xx from a flaky connection must not wipe the
        // session and force a logout mid-action — the refresh token itself
        // may still be perfectly valid.
        const refreshStatus = axios.isAxiosError(e) ? e.response?.status : undefined;
        const sessionInvalid = refreshStatus === 401 || refreshStatus === 403;
        if (sessionInvalid) {
          tokenStore.clear();
          if (globalThis.window !== undefined) globalThis.window.location.href = '/login';
        }
        throw e;
      }
    }
    throw error;
  },
);

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as { message?: string | string[] } | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(', ') : body.message;
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Xatolik';
}

/** Fetch an authenticated binary endpoint (e.g. an .xlsx export) and trigger a browser download. */
export async function downloadFile(
  url: string,
  filename: string,
  params?: Record<string, unknown>,
): Promise<void> {
  const res = await api.get(url, { params, responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(blobUrl);
}
