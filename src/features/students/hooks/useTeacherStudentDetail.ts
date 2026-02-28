import { useMemo } from 'react';

import { useStudentById } from './useStudents';
import { useSessionsByStudent } from '@/features/sessions/hooks/useSessions';
import { useAttendanceRate } from '@/features/attendance/hooks/useAttendance';
import { useMemorizationStats } from '@/features/memorization/hooks/useMemorizationStats';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the joined Supabase select from studentsService.getStudentById() */
export interface StudentDetailProfile {
  full_name: string;
  name_localized: Record<string, string> | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface StudentDetailClass {
  id: string;
  name: string;
  name_localized: Record<string, string> | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Teacher student detail hook — provides core student data.
 *
 * Gamification features (rub certifications, revisions, stickers) were removed.
 * This hook now provides student profile, sessions, attendance, and memorization stats.
 */
export function useTeacherStudentDetail(studentId: string | undefined, teacherId: string | undefined) {
  // ── Queries ─────────────────────────────────────────────────────────
  const { data: student, isLoading, error, refetch } = useStudentById(studentId);
  const { data: sessions = [] } = useSessionsByStudent(studentId);
  const { data: attendanceData } = useAttendanceRate(studentId);
  const { data: memStats } = useMemorizationStats(studentId);

  // ── Derived profile/class (properly typed) ──────────────────────────
  const studentProfile = useMemo(
    () => (student as unknown as { profiles: StudentDetailProfile } | undefined)?.profiles ?? null,
    [student],
  );
  const studentClass = useMemo(
    () => (student as unknown as { classes: StudentDetailClass | null } | undefined)?.classes ?? null,
    [student],
  );
  const attendanceRate = attendanceData?.rate ?? 0;

  return {
    // Query state
    student,
    isLoading,
    error,
    refetch,

    // Data
    sessions,
    memStats,
    attendanceRate,
    studentProfile,
    studentClass,
  };
}
