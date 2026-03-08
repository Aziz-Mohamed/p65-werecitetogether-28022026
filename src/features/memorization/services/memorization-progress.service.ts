import { supabase } from '@/lib/supabase';
import type { ProgressFilters } from '../types/memorization.types';
import type { TablesInsert, TablesUpdate } from '@/types/database.types';

class MemorizationProgressService {
  async getProgress(filters: ProgressFilters) {
    let query = supabase
      .from('memorization_progress')
      .select('*')
      .eq('student_id', filters.studentId);

    if (filters.surahNumber) query = query.eq('surah_number', filters.surahNumber);
    if (filters.status) query = query.eq('status', filters.status);

    return query.order('surah_number').order('from_ayah');
  }

  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async upsertProgress(
    studentId: string,
    surahNumber: number,
    fromAyah: number,
    toAyah: number,
    schoolId: string,
    updates: Partial<TablesUpdate<'memorization_progress'>>,
  ) {
    // Try to find existing
    const { data: existing } = await supabase
      .from('memorization_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('surah_number', surahNumber)
      .eq('from_ayah', fromAyah)
      .eq('to_ayah', toAyah)
      .single();

    if (existing) {
      return supabase
        .from('memorization_progress')
        .update(updates)
        .eq('id', existing.id)
        .select()
        .single();
    }

    // Insert new
    return supabase
      .from('memorization_progress')
      .insert({
        student_id: studentId,
        surah_number: surahNumber,
        from_ayah: fromAyah,
        to_ayah: toAyah,
        school_id: schoolId,
        ...updates,
      } as TablesInsert<'memorization_progress'>)
      .select()
      .single();
  }

  async getStats(studentId: string) {
    return supabase.rpc('get_student_memorization_stats', {
      p_student_id: studentId,
    });
  }
}

export const memorizationProgressService = new MemorizationProgressService();
