import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  currentUserId: string | null;
  currentUserName: string | null;
  token: string | null;
  setAuth: (userId: string, userName: string, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUserId: null,
      currentUserName: null,
      token: null,
      setAuth: (currentUserId, currentUserName, token) => 
        set({ currentUserId, currentUserName, token }),
      logout: () => set({ currentUserId: null, currentUserName: null, token: null }),
    }),
    {
      name: 'gym-auth-storage', // klucz w localStorage
    }
  )
);