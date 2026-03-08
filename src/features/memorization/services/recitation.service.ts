import { supabase } from '@/lib/supabase';
import type { CreateRecitationInput, RecitationFilters } from '../types/memorization.types';

class RecitationService {
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async createRecitation(input: CreateRecitationInput) {
    return supabase
      .from('recitations')
      .insert({
        session_id: input.session_id,
        student_id: input.student_id,
        teacher_id: input.teacher_id,
        school_id: input.school_id,
        surah_number: input.surah_number,
        from_ayah: input.from_ayah,
        to_ayah: input.to_ayah,
        recitation_type: input.recitation_type,
        accuracy_score: input.accuracy_score ?? null,
        tajweed_score: input.tajweed_score ?? null,
        fluency_score: input.fluency_score ?? null,
        needs_repeat: input.needs_repeat ?? false,
        mistake_notes: input.mistake_notes ?? null,
        recitation_date: input.recitation_date ?? new Date().toISOString().split('T')[0],
      })
      .select()
      .single();
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async createRecitations(inputs: CreateRecitationInput[]) {
    if (inputs.length === 0) return { data: [], error: null };
    const rows = inputs.map((input) => ({
      session_id: input.session_id,
      student_id: input.student_id,
      teacher_id: input.teacher_id,
      school_id: input.school_id,
      surah_number: input.surah_number,
      from_ayah: input.from_ayah,
      to_ayah: input.to_ayah,
      recitation_type: input.recitation_type,
      accuracy_score: input.accuracy_score ?? null,
      tajweed_score: input.tajweed_score ?? null,
      fluency_score: input.fluency_score ?? null,
      needs_repeat: input.needs_repeat ?? false,
      mistake_notes: input.mistake_notes ?? null,
      recitation_date: input.recitation_date ?? new Date().toISOString().split('T')[0],
    }));
    return supabase.from('recitations').insert(rows).select();
  }

  async getRecitations(filters: RecitationFilters) {
    let query = supabase.from('recitations').select('*');

    if (filters.studentId) query = query.eq('student_id', filters.studentId);
    if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
    if (filters.sessionId) query = query.eq('session_id', filters.sessionId);
    if (filters.surahNumber) query = query.eq('surah_number', filters.surahNumber);
    if (filters.recitationType) query = query.eq('recitation_type', filters.recitationType);
    if (filters.dateFrom) query = query.gte('recitation_date', filters.dateFrom);
    if (filters.dateTo) query = query.lte('recitation_date', filters.dateTo);

    query = query.order('created_at', { ascending: false });

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    return query;
  }

  async getRecitationsBySession(sessionId: string) {
    return supabase
      .from('recitations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
  }
}

export const recitationService = new RecitationService();
