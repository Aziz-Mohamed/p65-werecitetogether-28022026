import { supabase } from '@/lib/supabase';
import type { CreateAssignmentInput, AssignmentFilters } from '../types/memorization.types';

class AssignmentService {
  /** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
  async createAssignment(input: CreateAssignmentInput) {
    return supabase
      .from('memorization_assignments')
      .insert({
        student_id: input.student_id,
        assigned_by: input.assigned_by,
        school_id: input.school_id,
        surah_number: input.surah_number,
        from_ayah: input.from_ayah,
        to_ayah: input.to_ayah,
        assignment_type: input.assignment_type,
        due_date: input.due_date,
        notes: input.notes ?? null,
      })
      .select()
      .single();
  }

  async getAssignments(filters: AssignmentFilters) {
    let query = supabase.from('memorization_assignments').select('*');

    if (filters.studentId) query = query.eq('student_id', filters.studentId);
    if (filters.assignedBy) query = query.eq('assigned_by', filters.assignedBy);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assignmentType) query = query.eq('assignment_type', filters.assignmentType);
    if (filters.dueDateFrom) query = query.gte('due_date', filters.dueDateFrom);
    if (filters.dueDateTo) query = query.lte('due_date', filters.dueDateTo);

    query = query.order('due_date', { ascending: true });

    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    query = query.range(offset, offset + pageSize - 1);

    return query;
  }

  async completeAssignment(assignmentId: string, recitationId: string) {
    return supabase
      .from('memorization_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        recitation_id: recitationId,
      })
      .eq('id', assignmentId)
      .select()
      .single();
  }

  async completeRevisionHomework(assignmentId: string) {
    return supabase
      .from('memorization_assignments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();
  }

  async cancelAssignment(assignmentId: string) {
    return supabase
      .from('memorization_assignments')
      .update({ status: 'cancelled' })
      .eq('id', assignmentId)
      .select()
      .single();
  }
}

export const assignmentService = new AssignmentService();
