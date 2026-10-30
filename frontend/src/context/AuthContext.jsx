import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then((r) => setUser(r.data.data)).catch(() => {}).finally(() => setLoading(false));
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, []);

  const value = {
    user, loading, setUser,
    login: async (body) => setUser((await api.post('/auth/login', body)).data.data),
    signup: async (body) => setUser((await api.post('/auth/signup', body)).data.data),
    logout: async () => { await api.post('/auth/logout').catch(() => {}); setUser(null); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
