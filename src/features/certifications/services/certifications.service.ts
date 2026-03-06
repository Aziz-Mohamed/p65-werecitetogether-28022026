import { supabase } from '@/lib/supabase';
import type {
  RecommendInput,
  ReviewInput,
  IssueInput,
  RevokeInput,
  ResubmitInput,
  CertificationFilters,
} from '../types/certifications.types';

class CertificationsService {
  // ─── RPC Operations ──────────────────────────────────────────────────────

  /** RPC-001: Teacher submits certification recommendation */
  async recommend(input: RecommendInput) {
    return supabase.rpc('recommend_certification', {
      p_student_id: input.studentId,
      p_program_id: input.programId,
      p_track_id: input.trackId ?? null,
      p_type: input.type,
      p_title: input.title,
      p_title_ar: input.titleAr ?? null,
      p_notes: input.notes ?? null,
      p_metadata: input.metadata ?? {},
    });
  }

  /** RPC-002: Supervisor approves or returns a recommendation */
  async review(input: ReviewInput) {
    return supabase.rpc('review_certification', {
      p_certification_id: input.certificationId,
      p_action: input.action,
      p_review_notes: input.reviewNotes ?? null,
    });
  }

  /** RPC-003: Teacher re-submits a returned certification */
  async resubmit(input: ResubmitInput) {
    return supabase.rpc('resubmit_certification', {
      p_certification_id: input.certificationId,
      p_notes: input.notes ?? null,
      p_title: input.title ?? null,
      p_title_ar: input.titleAr ?? null,
    });
  }

  /** RPC-004: Program admin issues or rejects a certification */
  async issue(input: IssueInput) {
    return supabase.rpc('issue_certification', {
      p_certification_id: input.certificationId,
      p_action: input.action,
      p_chain_of_narration: input.chainOfNarration ?? null,
      p_review_notes: input.reviewNotes ?? null,
    });
  }

  /** RPC-005: Revoke an issued certificate */
  async revoke(input: RevokeInput) {
    return supabase.rpc('revoke_certification', {
      p_certification_id: input.certificationId,
      p_revocation_reason: input.revocationReason,
    });
  }

  /** RPC-006: Get pipeline counts for a program */
  async getPipeline(programId: string) {
    return supabase.rpc('get_certification_pipeline', {
      p_program_id: programId,
    });
  }

  /** RPC-007: Get review queue for supervisor or program admin */
  async getQueue(programId: string, role: 'supervisor' | 'program_admin') {
    return supabase.rpc('get_certification_queue', {
      p_program_id: programId,
      p_role: role,
    });
  }

  // ─── Direct Queries ────────────────────────────────────────────────────

  /** Get student's issued certificates */
  async getStudentCertificates(studentId: string) {
    return supabase
      .from('certifications')
      .select(`
        *,
        profiles!certifications_teacher_id_fkey ( id, full_name ),
        programs!certifications_program_id_fkey ( id, name, name_ar, category ),
        program_tracks!certifications_track_id_fkey ( id, name, name_ar )
      `)
      .eq('student_id', studentId)
      .eq('status', 'issued')
      .order('issue_date', { ascending: false });
  }

  /** Get single certification with all joins */
  async getCertificationById(id: string) {
    return supabase
      .from('certifications')
      .select(`
        *,
        student:profiles!certifications_student_id_fkey ( id, full_name, avatar_url ),
        teacher:profiles!certifications_teacher_id_fkey ( id, full_name ),
        program:programs!certifications_program_id_fkey ( id, name, name_ar, category ),
        track:program_tracks!certifications_track_id_fkey ( id, name, name_ar ),
        issuer:profiles!certifications_issued_by_fkey ( id, full_name ),
        reviewer:profiles!certifications_reviewed_by_fkey ( id, full_name )
      `)
      .eq('id', id)
      .single();
  }

  /** Get all certifications with filters (master admin) */
  async getAllCertifications(filters: CertificationFilters) {
    let query = supabase
      .from('certifications')
      .select(`
        *,
        student:profiles!certifications_student_id_fkey ( id, full_name ),
        teacher:profiles!certifications_teacher_id_fkey ( id, full_name ),
        program:programs!certifications_program_id_fkey ( id, name, name_ar )
      `)
      .order('created_at', { ascending: false });

    if (filters.programId) {
      query = query.eq('program_id', filters.programId);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    return query;
  }

  /** Get teacher's own certifications */
  async getTeacherCertifications(teacherId: string) {
    return supabase
      .from('certifications')
      .select(`
        *,
        student:profiles!certifications_student_id_fkey ( id, full_name ),
        program:programs!certifications_program_id_fkey ( id, name, name_ar ),
        track:program_tracks!certifications_track_id_fkey ( id, name, name_ar )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });
  }
}

export const certificationsService = new CertificationsService();
