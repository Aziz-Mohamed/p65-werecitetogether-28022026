import { programsService } from './programs.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('programsService – waitlist', () => {
  describe('getCohortWaitlist', () => {
    it('queries program_waitlist table', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getCohortWaitlist('cohort-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('program_waitlist');
    });

    it('selects waitlist entries with profile join', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getCohortWaitlist('cohort-1');

      expect(builder.select).toHaveBeenCalledWith(
        expect.stringContaining('profiles!program_waitlist_student_id_fkey'),
      );
    });

    it('filters by cohort_id and active statuses', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getCohortWaitlist('cohort-1');

      expect(builder.eq).toHaveBeenCalledWith('cohort_id', 'cohort-1');
      expect(builder.in).toHaveBeenCalledWith('status', ['waiting', 'offered']);
    });

    it('orders by position ascending', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getCohortWaitlist('cohort-1');

      expect(builder.order).toHaveBeenCalledWith('position', { ascending: true });
    });
  });

  describe('getMyWaitlistEntry', () => {
    it('queries program_waitlist table', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getMyWaitlistEntry('cohort-1', 'user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('program_waitlist');
    });

    it('filters by cohort_id and student_id', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getMyWaitlistEntry('cohort-1', 'user-1');

      expect(builder.eq).toHaveBeenCalledWith('cohort_id', 'cohort-1');
      expect(builder.eq).toHaveBeenCalledWith('student_id', 'user-1');
    });

    it('filters by waiting and offered statuses', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getMyWaitlistEntry('cohort-1', 'user-1');

      expect(builder.in).toHaveBeenCalledWith('status', ['waiting', 'offered']);
    });

    it('returns maybeSingle result', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getMyWaitlistEntry('cohort-1', 'user-1');

      expect(builder.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('cancelWaitlistEntry', () => {
    it('targets program_waitlist table', async () => {
      const builder = createQueryMock({ data: { id: 'wl-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.cancelWaitlistEntry('wl-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('program_waitlist');
    });

    it('updates status to cancelled', async () => {
      const builder = createQueryMock({ data: { id: 'wl-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.cancelWaitlistEntry('wl-1');

      expect(builder.update).toHaveBeenCalledWith({ status: 'cancelled' });
    });

    it('filters by waitlist entry id', async () => {
      const builder = createQueryMock({ data: { id: 'wl-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.cancelWaitlistEntry('wl-1');

      expect(builder.eq).toHaveBeenCalledWith('id', 'wl-1');
    });

    it('returns single result after select', async () => {
      const builder = createQueryMock({ data: { id: 'wl-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.cancelWaitlistEntry('wl-1');

      expect(builder.select).toHaveBeenCalled();
      expect(builder.single).toHaveBeenCalled();
    });
  });

  describe('promoteFromWaitlist', () => {
    it('calls promote_from_waitlist RPC with cohort id', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await programsService.promoteFromWaitlist('cohort-1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('promote_from_waitlist', {
        p_cohort_id: 'cohort-1',
      });
    });
  });
});
