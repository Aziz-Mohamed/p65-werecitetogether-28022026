import type { Tables } from '@/types/database.types';

export type Session = Tables<'sessions'>;
export type SessionAttendance = Tables<'session_attendance'>;

export interface SessionWithDetails extends Session {
  teacher_profile?: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
    meeting_link: string | null;
    meeting_platform: string | null;
  };
  attendance?: SessionAttendance[];
}

export interface CreateDraftSessionInput {
  teacherId: string;
  programId: string;
  cohortId?: string;
  meetingLinkUsed?: string;
}

export interface AddAttendanceInput {
  sessionId: string;
  studentId: string;
  score?: number;
  notes?: string;
}

export interface CompleteSessionInput {
  sessionId: string;
  notes?: string;
  durationMinutes?: number;
}
