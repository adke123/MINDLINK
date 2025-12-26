import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      profile: null,
      isAuthenticated: false,

      setAuth: (token, profile) => {
        set({ token, profile, isAuthenticated: true });
      },

      updateProfile: (updates) => {
        const currentProfile = get().profile;
        set({ profile: { ...currentProfile, ...updates } });
      },

      logout: () => {
        set({ token: null, profile: null, isAuthenticated: false });
        localStorage.removeItem('auth-storage');
      },

      getToken: () => get().token,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
