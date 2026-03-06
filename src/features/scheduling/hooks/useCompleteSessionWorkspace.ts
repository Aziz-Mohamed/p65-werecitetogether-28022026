import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateSessionWorkspaceQueries } from './invalidateSessionWorkspaceQueries';
import { attendanceService } from '@/features/attendance/services/attendance.service';
import { sessionsService } from '@/features/sessions/services/sessions.service';
import { recitationService } from '@/features/memorization/services/recitation.service';
import { memorizationProgressService } from '@/features/memorization/services/memorization-progress.service';
import { assignmentService } from '@/features/memorization/services/assignment.service';
import { calculateSM2, calculateQualityGrade } from '@/features/memorization/utils/spaced-repetition';
import { scheduledSessionService } from '../services/scheduled-session.service';
import type { BulkAttendanceInput } from '@/features/attendance/types/attendance.types';
import type { RecitationFormData } from '@/features/memorization/components/RecitationForm';
import type { EvalData } from '@/stores/workspaceDraftStore';

interface CompleteSessionInput {
  scheduledSessionId: string;
  classId: string;
  teacherId: string;
  sessionDate: string;
  attendance: BulkAttendanceInput | null;
  evaluations: Record<string, EvalData>;
  recitations: Record<string, RecitationFormData[]>;
  schoolId: string;
}

/**
 * Composite mutation that orchestrates completing a scheduled session:
 * 1. Marks bulk attendance (with scheduled_session_id)
 * 2. Creates evaluation sessions for students with scores
 * 3. Creates recitations linked to sessions + updates memorization progress
 * 4. Links the first evaluation to the scheduled session
 * 5. Updates scheduled session status to 'completed'
 */
export function useCompleteSessionWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompleteSessionInput) => {
      // 1. Mark attendance (class sessions only — attendance table requires class_id)
      if (input.attendance) {
        const { error: attendanceError } = await attendanceService.markBulkAttendance(
          input.attendance,
          input.schoolId,
          input.teacherId,
        );
        if (attendanceError) throw attendanceError;
      }

      // 2. Create evaluation sessions for students who have scores or recitations
      let firstEvalId: string | null = null;
      const sessionIdMap: Record<string, string> = {}; // studentId → sessionId

      for (const [studentId, evalData] of Object.entries(input.evaluations)) {
        const hasScores =
          evalData.memorization_score != null ||
          evalData.tajweed_score != null ||
          evalData.recitation_quality != null;
        const hasContent = hasScores || evalData.notes.trim().length > 0;
        const hasRecitations = (input.recitations[studentId] ?? []).length > 0;

        if (!hasContent && !hasRecitations) continue;

        const { data: session, error: sessionError } = await sessionsService.createSession({
          student_id: studentId,
          teacher_id: input.teacherId,
          class_id: input.classId || null,
          session_date: input.sessionDate,
          memorization_score: evalData.memorization_score,
          tajweed_score: evalData.tajweed_score,
          recitation_quality: evalData.recitation_quality,
          notes: evalData.notes.trim() || null,
          scheduled_session_id: input.scheduledSessionId,
        });

        if (sessionError) throw sessionError;

        if (session?.id) {
          sessionIdMap[studentId] = session.id;
          if (!firstEvalId) firstEvalId = session.id;
        }
      }

      // 3. Create recitations and update memorization progress
      for (const [studentId, recitationForms] of Object.entries(input.recitations)) {
        const sessionId = sessionIdMap[studentId];
        if (!sessionId || recitationForms.length === 0) continue;

        const recitationInputs = recitationForms.map((r) => ({
          session_id: sessionId,
          student_id: studentId,
          teacher_id: input.teacherId,
          school_id: input.schoolId,
          surah_number: r.surah_number,
          from_ayah: r.from_ayah,
          to_ayah: r.to_ayah,
          recitation_type: r.recitation_type,
          accuracy_score: r.accuracy_score,
          tajweed_score: r.tajweed_score,
          fluency_score: r.fluency_score,
          needs_repeat: r.needs_repeat,
          mistake_notes: r.mistake_notes || null,
          recitation_date: input.sessionDate,
        }));

        const { data: createdRecitations, error: recitationError } = await recitationService.createRecitations(recitationInputs);
        if (recitationError) throw recitationError;

        // Auto-complete linked assignments
        if (createdRecitations) {
          for (let i = 0; i < recitationForms.length; i++) {
            const form = recitationForms[i];
            const created = createdRecitations[i];
            if (form.assignment_id && created?.id) {
              await assignmentService.completeAssignment(form.assignment_id, created.id);
            }
          }
        }

        // Update memorization progress for each recitation
        for (const r of recitationForms) {
          const sm2Result = calculateSM2({
            accuracy_score: r.accuracy_score,
            tajweed_score: r.tajweed_score,
            fluency_score: r.fluency_score,
            current_ease_factor: 2.5,
            current_interval: 0,
            review_count: 0,
          });

          await memorizationProgressService.upsertProgress(
            studentId,
            r.surah_number,
            r.from_ayah,
            r.to_ayah,
            input.schoolId,
            {
              status: r.needs_repeat ? 'needs_review' : sm2Result.status,
              last_reviewed_at: new Date().toISOString(),
              next_review_date: sm2Result.next_review_date,
              ease_factor: sm2Result.ease_factor,
              interval_days: sm2Result.interval_days,
              first_memorized_at: r.recitation_type === 'new_hifz' ? new Date().toISOString() : undefined,
            },
          );
        }
      }

      // 4. Link first evaluation to the scheduled session (if any)
      if (firstEvalId) {
        const { error: linkError } = await scheduledSessionService.linkEvaluation(
          input.scheduledSessionId,
          firstEvalId,
        );
        if (linkError) throw linkError;
      }

      // 5. Update status to completed
      const { error: statusError } = await scheduledSessionService.updateStatus(
        input.scheduledSessionId,
        'completed',
      );
      if (statusError) throw statusError;
    },
    onSuccess: () => {
      invalidateSessionWorkspaceQueries(queryClient);
    },
  });
}
