import { create } from 'zustand';
import api from '@/lib/api';

interface Admin { id: string; email: string; name: string; }
interface AuthState {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  token: null,
  login: async (email, password) => {
    const res = await api.post('/auth/login', {
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
    const { access_token, admin } = res.data;
    localStorage.setItem('tst_admin_token', access_token);
    set({ token: access_token, admin });
  },
  logout: () => {
    localStorage.removeItem('tst_admin_token');
    set({ admin: null, token: null });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('tst_admin_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      set({ token, admin: res.data });
    } catch {
      localStorage.removeItem('tst_admin_token');
    }
  },
}));
