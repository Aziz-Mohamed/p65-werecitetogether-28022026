import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

import type { Tables } from '@/types/database.types';

// ─── Profile Type ───────────────────────────────────────────────────────────

export type Profile = Tables<'profiles'>;

// ─── Store Shape ────────────────────────────────────────────────────────────

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearAuth: () => void;
  initialize: () => void;
}

type AuthStore = AuthState & AuthActions;

// ─── Initial State ──────────────────────────────────────────────────────────

const initialState: AuthState = {
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSession: (session) =>
        set({
          session,
          isAuthenticated: session !== null,
          isLoading: false,
        }),

      setProfile: (profile) =>
        set({ profile }),

      clearAuth: () =>
        set({
          session: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      initialize: () =>
        set({ isLoading: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Persist profile for session restoration.
        // Session is managed by Supabase's own SecureStore adapter.
        profile: state.profile,
      }),
    },
  ),
);
