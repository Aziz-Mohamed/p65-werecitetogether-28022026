jest.mock('@/i18n/config', () => ({
  t: (key: string) => key,
  __esModule: true,
  default: { t: (key: string) => key },
}));

import { authService } from './auth.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks, mockAuth } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('authService', () => {
  describe('logout', () => {
    it('returns empty result on success', async () => {
      mockAuth().signOut.mockResolvedValue({ error: null });

      const result = await authService.logout();
      expect(result.error).toBeUndefined();
      expect(mockAuth().signOut).toHaveBeenCalled();
    });

    it('returns error when signOut fails', async () => {
      mockAuth().signOut.mockResolvedValue({
        error: { message: 'Sign out failed', code: 'SIGN_OUT_ERROR' },
      });

      const result = await authService.logout();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Sign out failed');
    });

    it('catches unexpected errors', async () => {
      mockAuth().signOut.mockRejectedValue(new Error('Network error'));

      const result = await authService.logout();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Network error');
    });
  });

  describe('getProfile', () => {
    it('returns profile on success', async () => {
      const profile = { id: 'user-1', full_name: 'Test User', role: 'teacher' };
      const builder = createQueryMock({ data: profile, error: null });
      mockSupabase.from.mockReturnValue(builder);

      const result = await authService.getProfile('user-1');

      expect(result.data).toEqual(profile);
      expect(result.error).toBeUndefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(builder.eq).toHaveBeenCalledWith('id', 'user-1');
    });

    it('returns error when query fails', async () => {
      const builder = createQueryMock({
        data: null,
        error: { message: 'not found', code: 'PGRST116' },
      });
      mockSupabase.from.mockReturnValue(builder);

      const result = await authService.getProfile('user-1');

      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('not found');
    });

    it('returns "Profile not found" when data is null', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      const result = await authService.getProfile('user-1');

      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('Profile not found');
    });
  });

  describe('getSession', () => {
    it('returns session on success', async () => {
      const session = { access_token: 'tok', user: { id: 'u1' } };
      mockAuth().getSession.mockResolvedValue({
        data: { session },
        error: null,
      });

      const result = await authService.getSession();
      expect(result.data).toEqual(session);
    });

    it('returns error when no active session', async () => {
      mockAuth().getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await authService.getSession();
      expect(result.error).toBeDefined();
      expect(result.error!.message).toBe('No active session');
    });

    it('returns error on auth failure', async () => {
      mockAuth().getSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Auth error', code: 'AUTH_FAIL' },
      });

      const result = await authService.getSession();
      expect(result.error!.message).toBe('Auth error');
    });
  });

  describe('onAuthStateChange', () => {
    it('subscribes and returns unsubscribe handle', () => {
      const unsubscribe = jest.fn();
      mockAuth().onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } },
      });

      const callback = jest.fn();
      const subscription = authService.onAuthStateChange(callback);

      expect(mockAuth().onAuthStateChange).toHaveBeenCalled();
      expect(subscription.unsubscribe).toBe(unsubscribe);
    });
  });
});
