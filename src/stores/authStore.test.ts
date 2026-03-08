jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { useAuthStore } from './authStore';
import type { Session } from '@supabase/supabase-js';

const initialState = useAuthStore.getState();

beforeEach(() => {
  useAuthStore.setState(initialState);
});

const mockSession = {
  access_token: 'test-token',
  refresh_token: 'test-refresh',
  user: { id: 'user-1', email: 'test@example.com' },
} as unknown as Session;

const mockProfile = {
  id: 'user-1',
  full_name: 'Test User',
  role: 'teacher',
  school_id: 'school-1',
} as ReturnType<typeof useAuthStore.getState>['profile'];

describe('authStore', () => {
  describe('initial state', () => {
    it('starts unauthenticated and loading', () => {
      const state = useAuthStore.getState();
      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(true);
    });
  });

  describe('setSession', () => {
    it('sets session and marks as authenticated', () => {
      useAuthStore.getState().setSession(mockSession);
      const state = useAuthStore.getState();

      expect(state.session).toBe(mockSession);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('sets isAuthenticated to false when session is null', () => {
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setSession(null);
      const state = useAuthStore.getState();

      expect(state.session).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setProfile', () => {
    it('sets the profile', () => {
      useAuthStore.getState().setProfile(mockProfile);
      expect(useAuthStore.getState().profile).toBe(mockProfile);
    });
  });

  describe('clearAuth', () => {
    it('resets session, profile, and isAuthenticated', () => {
      useAuthStore.getState().setSession(mockSession);
      useAuthStore.getState().setProfile(mockProfile);

      useAuthStore.getState().clearAuth();
      const state = useAuthStore.getState();

      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('initialize', () => {
    it('sets isLoading to false', () => {
      expect(useAuthStore.getState().isLoading).toBe(true);
      useAuthStore.getState().initialize();
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });
});
