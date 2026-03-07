import type { RoleSubscriptionProfile, SubscriptionConfig } from '../types/realtime.types';

/**
 * Builds subscription profile for a student user.
 * Subscribes to: student_stickers, attendance, sessions, students,
 *   student_trophies, student_achievements
 * If classId is null (unassigned), class-scoped subscriptions are omitted.
 * Debounce: 300ms (real-time-sensitive)
 */
export function buildStudentProfile(
  studentId: string,
  classId: string | null,
): RoleSubscriptionProfile {
  const subscriptions: SubscriptionConfig[] = [
    {
      table: 'student_stickers',
      event: 'INSERT',
      filter: `student_id=eq.${studentId}`,
      queryKeys: [
        ['student-stickers', studentId],
        ['student-dashboard', studentId],
        ['leaderboard'],
      ],
    },
    {
      table: 'attendance',
      event: '*',
      filter: `student_id=eq.${studentId}`,
      queryKeys: [
        ['attendance'],
        ['attendance-calendar', studentId],
        ['attendance-rate', studentId],
        ['student-dashboard', studentId],
      ],
    },
    {
      table: 'sessions',
      event: 'INSERT',
      filter: `student_id=eq.${studentId}`,
      queryKeys: [
        ['sessions'],
        ['student-dashboard', studentId],
      ],
    },
    {
      table: 'students',
      event: 'UPDATE',
      filter: `id=eq.${studentId}`,
      queryKeys: [
        ['students'],
        ['student-dashboard', studentId],
        ['leaderboard'],
      ],
    },
    {
      table: 'student_trophies',
      event: 'INSERT',
      filter: `student_id=eq.${studentId}`,
      queryKeys: [
        ['student-trophies', studentId],
        ['student-dashboard', studentId],
      ],
    },
    {
      table: 'student_achievements',
      event: 'INSERT',
      filter: `student_id=eq.${studentId}`,
      queryKeys: [
        ['student-achievements', studentId],
        ['student-dashboard', studentId],
      ],
    },
  ];

  // Teacher availability — students see available teachers for enrolled programs
  subscriptions.push({
    table: 'teacher_availability',
    event: '*',
    queryKeys: [
      ['available-teachers'],
    ],
  });

  // Queue entries — live position updates for student's queued programs
  subscriptions.push({
    table: 'program_queue_entries',
    event: '*',
    filter: `student_id=eq.${studentId}`,
    queryKeys: [
      ['queue-status'],
    ],
  });

  // Teacher rating stats — badge updates on available-now list
  subscriptions.push({
    table: 'teacher_rating_stats',
    event: '*',
    queryKeys: [
      ['teacher-rating-stats'],
      ['available-teachers'],
    ],
  });

  // Scheduled sessions for the student's classes
  if (classId) {
    subscriptions.push({
      table: 'scheduled_sessions',
      event: '*',
      filter: `class_id=eq.${classId}`,
      queryKeys: [
        ['student-upcoming-sessions'],
        ['scheduled-sessions'],
      ],
    });
  }

  return {
    channelName: `student-${studentId}`,
    subscriptions,
    debounceMs: 300,
  };
}

/**
 * Builds subscription profile for a teacher user.
 * If classIds is empty, returns empty subscriptions (no channel created).
 * Debounce: 500ms (dashboard views)
 */
export function buildTeacherProfile(
  teacherId: string,
  schoolId: string,
  classIds: string[],
): RoleSubscriptionProfile {
  if (classIds.length === 0) {
    return { channelName: `teacher-${teacherId}`, subscriptions: [], debounceMs: 500 };
  }

  // Supabase in-filter supports max 100 values
  const safeClassIds = classIds.slice(0, 100);
  const classFilter = `class_id=in.(${safeClassIds.join(',')})`;

  const subscriptions: SubscriptionConfig[] = [
    {
      table: 'students',
      event: 'UPDATE',
      filter: classFilter,
      queryKeys: [
        ['students'],
        ['leaderboard'],
        ['top-performers'],
        ['needs-support'],
        ['teacher-dashboard'],
      ],
    },
    {
      table: 'sessions',
      event: 'INSERT',
      filter: `school_id=eq.${schoolId}`,
      queryKeys: [
        ['sessions'],
        ['teacher-dashboard'],
      ],
    },
    {
      // student_stickers has no school_id — RLS enforces school scope
      table: 'student_stickers',
      event: 'INSERT',
      queryKeys: [
        ['student-stickers'],
        ['teacher-dashboard'],
      ],
    },
    {
      table: 'attendance',
      event: '*',
      filter: `school_id=eq.${schoolId}`,
      queryKeys: [
        ['attendance'],
        ['class-attendance'],
        ['teacher-dashboard'],
      ],
    },
    {
      table: 'classes',
      event: 'UPDATE',
      filter: `teacher_id=eq.${teacherId}`,
      queryKeys: [
        ['classes'],
        ['teacher-dashboard'],
      ],
    },
  ];

  // Teacher availability — own status changes
  subscriptions.push({
    table: 'teacher_availability',
    event: '*',
    filter: `teacher_id=eq.${teacherId}`,
    queryKeys: [
      ['my-availability'],
    ],
  });

  // Teacher check-ins (own)
  subscriptions.push({
    table: 'teacher_checkins',
    event: '*',
    filter: `teacher_id=eq.${teacherId}`,
    queryKeys: [
      ['teacher-checkin'],
      ['teacher-dashboard'],
    ],
  });

  // Scheduled sessions for the teacher
  subscriptions.push({
    table: 'scheduled_sessions',
    event: '*',
    filter: `teacher_id=eq.${teacherId}`,
    queryKeys: [
      ['teacher-upcoming-sessions'],
      ['scheduled-sessions'],
    ],
  });

  return {
    channelName: `teacher-${teacherId}`,
    subscriptions,
    debounceMs: 500,
  };
}

/**
 * Builds subscription profile for an admin user.
 * Debounce: 500ms (dashboard views)
 */
export function buildAdminProfile(schoolId: string): RoleSubscriptionProfile {
  const schoolFilter = `school_id=eq.${schoolId}`;

  const subscriptions: SubscriptionConfig[] = [
    {
      table: 'students',
      event: '*',
      filter: schoolFilter,
      queryKeys: [
        ['students'],
        ['admin-dashboard'],
      ],
    },
    {
      table: 'sessions',
      event: 'INSERT',
      filter: schoolFilter,
      queryKeys: [
        ['sessions'],
        ['admin-dashboard'],
      ],
    },
    {
      table: 'attendance',
      event: '*',
      filter: schoolFilter,
      queryKeys: [
        ['attendance'],
        ['class-attendance'],
        ['admin-dashboard'],
      ],
    },
    {
      // student_stickers has no school_id — RLS enforces school scope
      table: 'student_stickers',
      event: 'INSERT',
      queryKeys: [
        ['student-stickers'],
        ['admin-dashboard'],
      ],
    },
    {
      table: 'classes',
      event: '*',
      filter: schoolFilter,
      queryKeys: [
        ['classes'],
        ['admin-dashboard'],
        ['teacher-dashboard'],
      ],
    },
    {
      table: 'teacher_checkins',
      event: '*',
      filter: schoolFilter,
      queryKeys: [
        ['teacher-checkins'],
        ['school-attendance-today'],
        ['pending-overrides'],
        ['admin-dashboard'],
      ],
    },
    {
      table: 'scheduled_sessions',
      event: '*',
      filter: schoolFilter,
      queryKeys: [
        ['scheduled-sessions'],
        ['admin-dashboard'],
      ],
    },
  ];

  // Teacher ratings — supervisor review updates
  subscriptions.push({
    table: 'teacher_ratings',
    event: '*',
    queryKeys: [
      ['teacher-reviews'],
      ['teacher-rating-stats'],
    ],
  });

  return {
    channelName: `admin-${schoolId}`,
    subscriptions,
    debounceMs: 500,
  };
}
