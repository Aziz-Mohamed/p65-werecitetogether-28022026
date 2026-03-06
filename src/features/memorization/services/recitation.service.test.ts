import { recitationService } from './recitation.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('recitationService', () => {
  describe('createRecitation', () => {
    it('inserts into recitations table', async () => {
      const builder = createQueryMock({ data: { id: 'r1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await recitationService.createRecitation({
        session_id: 'ses-1',
        student_id: 's1',
        teacher_id: 't1',
        school_id: 'sch-1',
        surah_number: 1,
        from_ayah: 1,
        to_ayah: 7,
        recitation_type: 'new_memorization',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('recitations');
      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'ses-1',
          student_id: 's1',
          surah_number: 1,
          needs_repeat: false,
        }),
      );
    });

    it('defaults optional fields to null/false', async () => {
      const builder = createQueryMock({ data: { id: 'r1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await recitationService.createRecitation({
        session_id: 'ses-1',
        student_id: 's1',
        teacher_id: 't1',
        school_id: 'sch-1',
        surah_number: 1,
        from_ayah: 1,
        to_ayah: 7,
        recitation_type: 'new_memorization',
      });

      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          accuracy_score: null,
          tajweed_score: null,
          fluency_score: null,
          needs_repeat: false,
          mistake_notes: null,
        }),
      );
    });
  });

  describe('createRecitations', () => {
    it('returns early for empty input', async () => {
      const result = await recitationService.createRecitations([]);
      expect(result).toEqual({ data: [], error: null });
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('batch inserts multiple recitations', async () => {
      const builder = createQueryMock({ data: [{ id: 'r1' }, { id: 'r2' }], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await recitationService.createRecitations([
        { session_id: 's', student_id: 's1', teacher_id: 't1', school_id: 'sch', surah_number: 1, from_ayah: 1, to_ayah: 7, recitation_type: 'new_memorization' },
        { session_id: 's', student_id: 's1', teacher_id: 't1', school_id: 'sch', surah_number: 2, from_ayah: 1, to_ayah: 10, recitation_type: 'revision' },
      ]);

      expect(builder.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ surah_number: 1 }),
          expect.objectContaining({ surah_number: 2 }),
        ]),
      );
    });
  });

  describe('getRecitations', () => {
    it('applies all provided filters', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await recitationService.getRecitations({
        studentId: 's1',
        teacherId: 't1',
        sessionId: 'ses-1',
        surahNumber: 2,
        recitationType: 'revision',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(builder.eq).toHaveBeenCalledWith('student_id', 's1');
      expect(builder.eq).toHaveBeenCalledWith('teacher_id', 't1');
      expect(builder.eq).toHaveBeenCalledWith('session_id', 'ses-1');
      expect(builder.eq).toHaveBeenCalledWith('surah_number', 2);
      expect(builder.eq).toHaveBeenCalledWith('recitation_type', 'revision');
      expect(builder.gte).toHaveBeenCalledWith('recitation_date', '2026-01-01');
      expect(builder.lte).toHaveBeenCalledWith('recitation_date', '2026-01-31');
    });

    it('paginates correctly', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await recitationService.getRecitations({ page: 2, pageSize: 15 });

      expect(builder.range).toHaveBeenCalledWith(15, 29);
    });
  });

  describe('getRecitationsBySession', () => {
    it('queries by session_id ordered ascending', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await recitationService.getRecitationsBySession('ses-1');

      expect(builder.eq).toHaveBeenCalledWith('session_id', 'ses-1');
      expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
  });
});
