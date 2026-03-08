type Payload = Record<string, unknown>;

/**
 * Returns query keys to invalidate for a given table + event payload.
 * When payload is empty ({}) due to RLS, returns broad keys without specific IDs.
 */
export function getQueryKeysForEvent(
  table: string,
  _eventType: string,
  payload: Payload,
): readonly (readonly string[])[] {
  const newRecord = (payload.new ?? {}) as Record<string, unknown>;
  const studentId = (newRecord.student_id ?? newRecord.id) as string | undefined;

  switch (table) {
    case 'student_stickers':
      return studentId
        ? [
            ['student-stickers', studentId],
            ['student-dashboard', studentId],
            ['leaderboard'],
            ['parent-dashboard'],
            ['child-detail', studentId],
          ]
        : [
            ['student-stickers'],
            ['student-dashboard'],
            ['leaderboard'],
            ['parent-dashboard'],
            ['child-detail'],
          ];

    case 'attendance':
      return studentId
        ? [
            ['attendance'],
            ['class-attendance'],
            ['attendance-calendar', studentId],
            ['attendance-rate', studentId],
            ['admin-dashboard'],
            ['parent-dashboard'],
            ['student-dashboard', studentId],
          ]
        : [
            ['attendance'],
            ['class-attendance'],
            ['attendance-calendar'],
            ['attendance-rate'],
            ['admin-dashboard'],
            ['parent-dashboard'],
            ['student-dashboard'],
          ];

    case 'sessions': {
      const sid = (newRecord.student_id) as string | undefined;
      return sid
        ? [
            ['sessions'],
            ['student-dashboard', sid],
            ['teacher-dashboard'],
            ['parent-dashboard'],
            ['child-detail', sid],
          ]
        : [
            ['sessions'],
            ['student-dashboard'],
            ['teacher-dashboard'],
            ['parent-dashboard'],
            ['child-detail'],
          ];
    }

    case 'students': {
      const id = newRecord.id as string | undefined;
      return id
        ? [
            ['students'],
            ['student-dashboard', id],
            ['leaderboard'],
            ['children'],
            ['child-detail', id],
            ['top-performers'],
            ['needs-support'],
          ]
        : [
            ['students'],
            ['student-dashboard'],
            ['leaderboard'],
            ['children'],
            ['child-detail'],
            ['top-performers'],
            ['needs-support'],
          ];
    }

    case 'student_trophies':
      return studentId
        ? [
            ['student-trophies', studentId],
            ['student-dashboard', studentId],
          ]
        : [['student-trophies'], ['student-dashboard']];

    case 'student_achievements':
      return studentId
        ? [
            ['student-achievements', studentId],
            ['student-dashboard', studentId],
          ]
        : [['student-achievements'], ['student-dashboard']];

    case 'classes':
      return [['classes'], ['admin-dashboard'], ['teacher-dashboard']];

    case 'teacher_availability':
      return [['available-teachers'], ['my-availability']];

    case 'program_queue_entries': {
      const programId = newRecord.program_id as string | undefined;
      return programId
        ? [['queue-status', programId], ['program-demand', programId]]
        : [['queue-status'], ['program-demand']];
    }

    case 'teacher_ratings': {
      const tId = newRecord.teacher_id as string | undefined;
      return tId
        ? [['teacher-reviews', tId], ['teacher-rating-stats', tId]]
        : [['teacher-reviews'], ['teacher-rating-stats']];
    }

    case 'teacher_rating_stats': {
      const statsTeacherId = newRecord.teacher_id as string | undefined;
      return statsTeacherId
        ? [['teacher-rating-stats', statsTeacherId], ['available-teachers']]
        : [['teacher-rating-stats'], ['available-teachers']];
    }

    default:
      return [];
  }
}
