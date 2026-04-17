import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/auth.service';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => 
        set({ 
          user, 
          accessToken, 
          refreshToken, 
          isAuthenticated: true 
        }),

      logout: async () => {
        const { refreshToken } = get();

        if (refreshToken) {
          try {
            await authService.logout(refreshToken);
          } catch {
          }
        }

        set({ 
          user: null, 
          accessToken: null, 
          refreshToken: null, 
          isAuthenticated: false 
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-storage');
          document.cookie = 'access_token=; path=/; max-age=0';
        }
      },

      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
