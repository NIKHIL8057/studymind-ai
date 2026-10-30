import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // auth lives in an HTTP-only cookie; no token is ever stored in JS
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  timeout: 90_000,
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    const url = e.config?.url || '';
    if (e.response?.status === 401 && !url.startsWith('/auth/')) window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(e);
  }
);

export const errMsg = (e) =>
  e.response?.data?.message || (e.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : e.message === 'Network Error' ? 'Cannot reach the server. Check your connection.' : 'Something went wrong.');

/** GET helper: { data, meta, loading, error, reload(silent?) } */
export function useApi(url, params) {
  const [s, setS] = useState({ data: null, meta: null, loading: true, error: null });
  const key = JSON.stringify(params || {});
  const load = useCallback(
    async (silent) => {
      if (silent !== true) setS((p) => ({ ...p, loading: true, error: null }));
      try {
        const r = await api.get(url, { params: JSON.parse(key) });
        setS({ data: r.data.data, meta: r.data.meta || null, loading: false, error: null });
      } catch (e) {
        setS((p) => ({ ...p, loading: false, error: errMsg(e) }));
      }
    },
    [url, key]
  );
  useEffect(() => {
    load();
  }, [load]);
  return { ...s, reload: load };
}
