import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentService } from '@/features/memorization/services/assignment.service';
import { getSurah } from '@/lib/quran-metadata';
import type { RubReference } from '../types/gamification.types';

interface RequestRevisionInput {
  studentId: string;
  schoolId: string;
  reference: RubReference;
}

/**
 * Mutation hook for students to add a rubʿ to their revision plan.
 * Creates a memorization_assignment with type 'old_review' due tomorrow.
 *
 * For cross-surah rubʿ, creates assignment for the first surah segment only.
 */
export const useRequestRevision = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['request-revision'],
    mutationFn: async (input: RequestRevisionInput) => {
      const { reference, studentId, schoolId } = input;

      // For cross-surah rubʿ, use first surah's segment only
      const surahNumber = reference.start_surah;
      const fromAyah = reference.start_ayah;
      const toAyah =
        reference.start_surah === reference.end_surah
          ? reference.end_ayah
          : getSurah(reference.start_surah)?.ayahCount ?? reference.start_ayah;

      // Due tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      const result = await assignmentService.createAssignment({
        student_id: studentId,
        assigned_by: studentId, // self-assigned
        school_id: schoolId,
        surah_number: surahNumber,
        from_ayah: fromAyah,
        to_ayah: toAyah,
        assignment_type: 'old_review',
        due_date: dueDate,
      });

      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['revision-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard', variables.studentId] });
    },
  });
};
