import { gamificationService } from './gamification.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('gamificationService', () => {
  describe('getStickers', () => {
    it('queries stickers table with is_active filter', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.getStickers();

      expect(mockSupabase.from).toHaveBeenCalledWith('stickers');
      expect(builder.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('uses OR filter when programIds provided', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.getStickers(['p1', 'p2']);

      expect(builder.or).toHaveBeenCalledWith(
        'program_id.is.null,program_id.in.(p1,p2)',
      );
      expect(builder.is).not.toHaveBeenCalled();
    });

    it('uses IS NULL filter when no programIds', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.getStickers();

      expect(builder.is).toHaveBeenCalledWith('program_id', null);
      expect(builder.or).not.toHaveBeenCalled();
    });

    it('uses IS NULL filter for empty programIds array', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.getStickers([]);

      expect(builder.is).toHaveBeenCalledWith('program_id', null);
    });
  });

  describe('awardSticker', () => {
    it('inserts with correct fields', async () => {
      const builder = createQueryMock({ data: { id: 'ss-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.awardSticker({
        studentId: 's1',
        stickerId: 'sticker-1',
        awardedBy: 't1',
        reason: 'Great work',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('student_stickers');
      expect(builder.insert).toHaveBeenCalledWith({
        student_id: 's1',
        sticker_id: 'sticker-1',
        awarded_by: 't1',
        reason: 'Great work',
      });
      expect(builder.single).toHaveBeenCalled();
    });

    it('defaults reason to null when not provided', async () => {
      const builder = createQueryMock({ data: { id: 'ss-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.awardSticker({
        studentId: 's1',
        stickerId: 'sticker-1',
        awardedBy: 't1',
      });

      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ reason: null }),
      );
    });
  });

  describe('recordGoodRevision', () => {
    it('uses direct update when resetReviewCount is true (30-90d dormancy)', async () => {
      const builder = createQueryMock({ data: { id: 'cert-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.recordGoodRevision('cert-1', true);

      expect(mockSupabase.from).toHaveBeenCalledWith('student_rub_certifications');
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dormant_since: null,
          review_count: 0,
        }),
      );
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('uses RPC for atomic increment when resetReviewCount is false', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await gamificationService.recordGoodRevision('cert-1', false);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_review_count', {
        cert_id: 'cert-1',
      });
      // Should not call from() for update
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });
  });

  describe('recordPoorRevision', () => {
    it('sets last_reviewed_at to half-interval in the past', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-01T12:00:00Z'));

      const builder = createQueryMock({ data: { id: 'cert-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.recordPoorRevision('cert-1', 10);

      // Half of 10 days = 5 days back from now
      const expected = new Date('2026-02-24T12:00:00.000Z').toISOString();
      expect(builder.update).toHaveBeenCalledWith({ last_reviewed_at: expected });

      jest.useRealTimers();
    });
  });

  describe('recertifyRub', () => {
    it('resets all certification fields', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-01T12:00:00Z'));

      const builder = createQueryMock({ data: { id: 'cert-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.recertifyRub('cert-1', 'teacher-1');

      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          certified_by: 'teacher-1',
          review_count: 0,
          dormant_since: null,
        }),
      );
      expect(builder.eq).toHaveBeenCalledWith('id', 'cert-1');

      jest.useRealTimers();
    });
  });

  describe('getStudentBadges', () => {
    it('queries with student_id', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.getStudentBadges('s1');

      expect(builder.eq).toHaveBeenCalledWith('student_id', 's1');
    });

    it('applies programId filter when provided', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.getStudentBadges('s1', 'program-1');

      expect(builder.eq).toHaveBeenCalledWith('student_id', 's1');
      expect(builder.eq).toHaveBeenCalledWith('program_id', 'program-1');
    });
  });

  describe('checkSessionMilestones', () => {
    it('calls RPC with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await gamificationService.checkSessionMilestones('s1', 'p1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'check_session_milestones',
        { p_student_id: 's1', p_program_id: 'p1' },
      );
    });
  });

  describe('markDormant', () => {
    it('updates dormant_since for given certification IDs', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-01T00:00:00Z'));

      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await gamificationService.markDormant(['cert-1', 'cert-2']);

      expect(mockSupabase.from).toHaveBeenCalledWith('student_rub_certifications');
      expect(builder.in).toHaveBeenCalledWith('id', ['cert-1', 'cert-2']);

      jest.useRealTimers();
    });
  });
});
