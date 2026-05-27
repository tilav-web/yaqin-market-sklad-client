import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_COOKIE = 'ym_access';
const REFRESH_COOKIE = 'ym_refresh';

export const tokenStore = {
  get access() {
    return Cookies.get(ACCESS_COOKIE);
  },
  get refresh() {
    return Cookies.get(REFRESH_COOKIE);
  },
  save(access: string, refresh: string) {
    Cookies.set(ACCESS_COOKIE, access, { expires: 7 });
    Cookies.set(REFRESH_COOKIE, refresh, { expires: 30 });
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
