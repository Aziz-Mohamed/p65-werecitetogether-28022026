import { supabase } from '@/lib/supabase';
import type { TeacherFilters } from '../types/teachers.types';

class TeachersService {
  /**
   * Get a filtered list of teachers.
   * Queries profiles where role='teacher' and joins their classes.
   */
  async getTeachers(filters?: TeacherFilters) {
    let query = supabase
      .from('profiles')
      .select('id, full_name, name_localized, username, avatar_url, classes(id, name, name_localized)')
      .eq('role', 'teacher');

    if (filters?.searchQuery) {
      query = query.or(
        `full_name.ilike.%${filters.searchQuery}%,name_localized::text.ilike.%${filters.searchQuery}%`,
      );
    }

    return query.order('full_name');
  }

  /**
   * Get a single teacher by profile ID.
   * Includes classes and nested student counts.
   */
  async getTeacherById(id: string) {
    return supabase
      .from('profiles')
      .select('id, full_name, name_localized, username, avatar_url, phone, created_at, classes(id, name, name_localized, students(id))')
      .eq('id', id)
      .eq('role', 'teacher')
      .single();
  }

  /**
   * Update a teacher's profile.
   * Maps camelCase input to snake_case columns.
   */
  async updateTeacher(id: string, input: { fullName?: string; phone?: string; nameLocalized?: Record<string, string> }) {
    const updates: Record<string, unknown> = {};
    if (input.fullName !== undefined) updates.full_name = input.fullName;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.nameLocalized !== undefined) updates.name_localized = input.nameLocalized;

    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  }
}

export const teachersService = new TeachersService();
