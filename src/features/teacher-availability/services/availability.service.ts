import { supabase } from '@/lib/supabase';
import type { ToggleAvailabilityInput, UpdateTeacherProfileInput } from '../types/availability.types';

class AvailabilityService {
  // ─── Read Operations ──────────────────────────────────────────────────────

  /** AV-001: Get available teachers for a program (student view) */
  async getAvailableTeachers(programId: string) {
    return (supabase
      .from('teacher_availability' as any)
      .select(`
        *,
        profiles!teacher_availability_teacher_id_fkey (
          id, full_name, avatar_url, meeting_link, meeting_platform, languages
        )
      `)
      .eq('program_id', programId)
      .eq('is_available', true)
      .order('available_since', { ascending: true })) as any;
  }

  /** AV-002: Get teacher's own availability across all programs */
  async getMyAvailability() {
    return (supabase
      .from('teacher_availability' as any)
      .select(`
        *,
        programs ( name, name_ar )
      `)
      .eq('teacher_id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .order('created_at', { ascending: false })) as any;
  }

  /** AV-007: Get teacher profile extensions */
  async getTeacherProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    return (supabase
      .from('profiles')
      .select('meeting_link, meeting_platform, languages')
      .eq('id', user?.id ?? '')
      .single()) as any;
  }

  /** Get teacher's eligible (free/mixed) program assignments */
  async getEligiblePrograms() {
    const { data: { user } } = await supabase.auth.getUser();
    return (supabase
      .from('program_roles' as any)
      .select(`
        program_id,
        programs ( id, name, name_ar, category )
      `)
      .eq('profile_id', user?.id ?? '')
      .eq('role', 'teacher')) as any;
  }

  // ─── Write Operations ─────────────────────────────────────────────────────

  /** AV-003: Toggle availability via RPC */
  async toggleAvailability(input: ToggleAvailabilityInput) {
    return supabase.rpc('toggle_availability' as any, {
      p_program_id: input.programId,
      p_is_available: input.isAvailable,
      p_max_students: input.maxStudents ?? 1,
    });
  }

  /** AV-004: Join teacher session via RPC */
  async joinSession(availabilityId: string) {
    return supabase.rpc('join_teacher_session' as any, {
      p_availability_id: availabilityId,
    });
  }

  /** AV-006: Update teacher profile extensions */
  async updateTeacherProfile(input: UpdateTeacherProfileInput) {
    const { data: { user } } = await supabase.auth.getUser();
    return supabase
      .from('profiles')
      .update({
        meeting_link: input.meetingLink,
        meeting_platform: input.meetingPlatform,
        languages: input.languages,
      } as any)
      .eq('id', user?.id ?? '')
      .select('meeting_link, meeting_platform, languages')
      .single();
  }
}

export const availabilityService = new AvailabilityService();
