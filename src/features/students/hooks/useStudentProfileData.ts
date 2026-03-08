import { useQuery } from '@tanstack/react-query';

import { useStudentById } from './useStudents';
import { useSessions } from '@/features/sessions/hooks/useSessions';
import { useStudentStickers } from '@/features/gamification/hooks/useStickers';
import { useRubCertifications } from '@/features/gamification/hooks/useRubCertifications';
import { useAttendanceRate } from '@/features/attendance/hooks/useAttendance';
import { useMemorizationStats } from '@/features/memorization/hooks/useMemorizationStats';
import { useStudentGuardians } from '@/features/profile/hooks/useGuardians';
import { programsService } from '@/features/programs/services/programs.service';
import type { EnrollmentWithDetails } from '@/features/programs/types/programs.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StudentProfileData {
  full_name: string;
  name_localized: Record<string, string> | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface StudentProfileClass {
  id: string;
  name: string;
  name_localized: Record<string, string> | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Composing hook that aggregates all read-only data needed
 * for a comprehensive student profile display.
 *
 * Unlike useTeacherStudentDetail, this hook:
 * - Does NOT filter sessions by teacher
 * - Does NOT include mutations (certify, undo, revision)
 * - Includes guardians and enrollment history
 */
export function useStudentProfileData(studentId: string | undefined) {
  // ── Queries ─────────────────────────────────────────────────────────
  const { data: student, isLoading: studentLoading, error, refetch } = useStudentById(studentId);
  const { data: sessions = [] } = useSessions({ studentId, pageSize: 10 });
  const { data: stickers = [] } = useStudentStickers(studentId);
  const { data: attendanceData } = useAttendanceRate(studentId);
  const { data: memStats } = useMemorizationStats(studentId);
  const { activeCount } = useRubCertifications(studentId);
  const { data: guardians = [] } = useStudentGuardians(studentId);

  // Enrollment history — uses a proper queryKey (unlike useEnrollments which is hardcoded to 'mine')
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments', 'student', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      const { data, error } = await programsService.getMyEnrollments(studentId);
      if (error) throw error;
      return (data ?? []) as EnrollmentWithDetails[];
    },
    enabled: !!studentId,
  });

  // ── Derived ─────────────────────────────────────────────────────────
  const studentProfile = (student as unknown as { profiles: StudentProfileData } | undefined)?.profiles ?? null;
  const studentClass = (student as unknown as { classes: StudentProfileClass | null } | undefined)?.classes ?? null;
  const attendanceRate = attendanceData?.rate ?? 0;

  return {
    student,
    studentProfile,
    studentClass,
    sessions,
    stickers,
    memStats,
    activeCount,
    attendanceRate,
    guardians,
    enrollments,
    isLoading: studentLoading,
    error,
    refetch,
  };
}
