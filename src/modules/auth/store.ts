import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        if (typeof document !== 'undefined') {
          document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },
      logout: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
        }
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'insight-hub-auth',
      onRehydrateStorage: () => (state) => {
        if (typeof document !== 'undefined' && state?.token) {
          document.cookie = `auth_token=${encodeURIComponent(state.token)}; path=/; max-age=604800; SameSite=Lax`;
        }
      },
    }
  )
);
