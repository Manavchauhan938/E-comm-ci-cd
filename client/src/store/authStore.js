import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setSession: (user, accessToken) => set({ user, accessToken }),
      logoutLocal: () => set({ user: null, accessToken: null }),
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.data.user, accessToken: data.data.accessToken });
        return data.data.user;
      },
      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        set({ user: data.data.user, accessToken: data.data.accessToken });
        return data.data.user;
      },
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } finally {
          set({ user: null, accessToken: null });
        }
      },
      fetchMe: async () => {
        const { data } = await api.get('/auth/me');
        set({ user: data.data });
        return data.data;
      },
    }),
    {
      name: 'ecomm-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
    }
  )
);
