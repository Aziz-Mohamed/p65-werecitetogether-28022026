import { supabase } from '@/lib/supabase';
import type { StudentFilters, UpdateStudentInput } from '../types/students.types';

class StudentsService {
  /**
   * SM-001: Get a paginated, filtered list of students.
   * Joins profile data, class, and level information.
   * Uses !inner join on profiles so the search filter on full_name works.
   *
   * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
   */
  async getStudents(filters?: StudentFilters) {
    let query = supabase
      .from('students')
      .select(
        '*, profiles!students_id_fkey!inner(full_name, name_localized, username, avatar_url), classes(name, name_localized)',
      );

    if (filters?.classId) {
      query = query.eq('class_id', filters.classId);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters?.levelNumber !== undefined) {
      query = query.eq('current_level', filters.levelNumber);
    }
    if (filters?.searchQuery) {
      query = query.or(
        `full_name.ilike.%${filters.searchQuery}%,name_localized::text.ilike.%${filters.searchQuery}%`,
        { referencedTable: 'profiles' },
      );
    }

    query = query.order('full_name', { referencedTable: 'profiles', ascending: true });

    if (filters?.pageSize) {
      const page = filters.page ?? 1;
      const offset = (page - 1) * filters.pageSize;
      query = query.range(offset, offset + filters.pageSize - 1);
    }

    return query;
  }

  /**
   * SM-002: Get a single student by ID with full details.
   * Includes profile, class, level, and guardian information.
   */
  async getStudentById(id: string) {
    return supabase
      .from('students')
      .select(
        '*, profiles!students_id_fkey!inner(full_name, name_localized, username, avatar_url, phone, created_at), classes(name, name_localized, id)',
      )
      .eq('id', id)
      .single();
  }

  /**
   * SM-003: Update an existing student record.
   * Maps camelCase input fields to snake_case database columns.
   * Only includes fields that are explicitly provided (not undefined).
   *
   * @deprecated class_id is deprecated. New features MUST use cohort_id instead. See PRD Section 0.5.
   */
  async updateStudent(id: string, input: UpdateStudentInput) {
    const updates: Record<string, unknown> = {};

    if (input.classId !== undefined) updates.class_id = input.classId;
    if (input.isActive !== undefined) updates.is_active = input.isActive;
    if (input.dateOfBirth !== undefined) updates.date_of_birth = input.dateOfBirth;

    return supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  }
}

export const studentsService = new StudentsService();
