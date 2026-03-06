import { certificationsService } from './certifications.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('certificationsService', () => {
  describe('recommend', () => {
    it('calls RPC with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await certificationsService.recommend({
        studentId: 's1',
        programId: 'p1',
        type: 'ijazah',
        title: 'Quran Memorization',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('recommend_certification', {
        p_student_id: 's1',
        p_program_id: 'p1',
        p_track_id: null,
        p_type: 'ijazah',
        p_title: 'Quran Memorization',
        p_title_ar: null,
        p_notes: null,
        p_metadata: {},
      });
    });
  });

  describe('review', () => {
    it('calls RPC with action and optional notes', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await certificationsService.review({
        certificationId: 'cert-1',
        action: 'approve',
        reviewNotes: 'Excellent student',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('review_certification', {
        p_certification_id: 'cert-1',
        p_action: 'approve',
        p_review_notes: 'Excellent student',
      });
    });
  });

  describe('revoke', () => {
    it('calls RPC with revocation reason', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await certificationsService.revoke({
        certificationId: 'cert-1',
        revocationReason: 'Issued in error',
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('revoke_certification', {
        p_certification_id: 'cert-1',
        p_revocation_reason: 'Issued in error',
      });
    });
  });

  describe('getStudentCertificates', () => {
    it('queries issued certificates for student', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await certificationsService.getStudentCertificates('s1');

      expect(mockSupabase.from).toHaveBeenCalledWith('certifications');
      expect(builder.eq).toHaveBeenCalledWith('student_id', 's1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'issued');
    });
  });

  describe('getAllCertifications', () => {
    it('applies all filters when provided', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await certificationsService.getAllCertifications({
        programId: 'p1',
        type: 'ijazah',
        status: 'issued',
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      });

      expect(builder.eq).toHaveBeenCalledWith('program_id', 'p1');
      expect(builder.eq).toHaveBeenCalledWith('type', 'ijazah');
      expect(builder.eq).toHaveBeenCalledWith('status', 'issued');
      expect(builder.gte).toHaveBeenCalledWith('created_at', '2026-01-01');
      expect(builder.lte).toHaveBeenCalledWith('created_at', '2026-12-31');
    });

    it('does not apply undefined filters', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await certificationsService.getAllCertifications({});

      expect(builder.eq).not.toHaveBeenCalled();
      expect(builder.gte).not.toHaveBeenCalled();
    });
  });
});
