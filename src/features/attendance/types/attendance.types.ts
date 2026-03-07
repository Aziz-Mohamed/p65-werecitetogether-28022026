import type { Tables } from '@/types/database.types';

/** Input for marking attendance for multiple students at once */
export interface BulkAttendanceInput {
  class_id: string;
  date: string;
  scheduled_session_id?: string;
  records: Array<{
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes?: string | null;
  }>;
}

/** A single attendance record with student profile details */
export interface AttendanceRecord extends Tables<'attendance'> {
  student: Tables<'profiles'>;
  markedBy: Tables<'profiles'> | null;
}

/** Represents a single day in an attendance calendar view */
export interface AttendanceCalendarDay {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'no_class';
  notes: string | null;
}

/** Filters for querying attendance records */
export interface AttendanceFilters {
  classId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}
