import { programsService } from './programs.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('programsService', () => {
  describe('getPrograms', () => {
    it('queries active programs ordered by sort_order', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getPrograms();

      expect(mockSupabase.from).toHaveBeenCalledWith('programs');
      expect(builder.eq).toHaveBeenCalledWith('is_active', true);
      expect(builder.order).toHaveBeenCalledWith('sort_order', { ascending: true });
    });
  });

  describe('enrollStructured', () => {
    it('calls RPC with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await programsService.enrollStructured({
        programId: 'p1',
        trackId: 't1',
        cohortId: 'c1',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('enroll_student', {
        p_program_id: 'p1',
        p_track_id: 't1',
        p_cohort_id: 'c1',
      });
    });

    it('passes null for optional trackId/cohortId', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await programsService.enrollStructured({ programId: 'p1' });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('enroll_student', {
        p_program_id: 'p1',
        p_track_id: null,
        p_cohort_id: null,
      });
    });
  });

  describe('joinFreeProgram', () => {
    it('inserts enrollment with active status', async () => {
      const builder = createQueryMock({ data: { id: 'e1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.joinFreeProgram('user-1', 'prog-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('enrollments');
      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: 'user-1',
          program_id: 'prog-1',
          status: 'active',
          track_id: null,
        }),
      );
    });
  });

  describe('leaveProgram', () => {
    it('updates enrollment status to dropped with user guard', async () => {
      const builder = createQueryMock({ data: { id: 'e1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.leaveProgram('e1', 'user-1');

      expect(builder.update).toHaveBeenCalledWith({ status: 'dropped' });
      expect(builder.eq).toHaveBeenCalledWith('id', 'e1');
      expect(builder.eq).toHaveBeenCalledWith('student_id', 'user-1');
    });
  });

  describe('getCohorts', () => {
    it('filters by programId and active statuses', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getCohorts({ programId: 'p1' });

      expect(mockSupabase.from).toHaveBeenCalledWith('cohorts');
      expect(builder.eq).toHaveBeenCalledWith('program_id', 'p1');
      expect(builder.in).toHaveBeenCalledWith('status', [
        'enrollment_open', 'enrollment_closed', 'in_progress',
      ]);
    });

    it('applies optional trackId filter', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.getCohorts({ programId: 'p1', trackId: 't1' });

      expect(builder.eq).toHaveBeenCalledWith('track_id', 't1');
    });
  });

  describe('removeProgramRole', () => {
    it('deletes by role id', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await programsService.removeProgramRole('role-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('program_roles');
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'role-1');
    });
  });
});
