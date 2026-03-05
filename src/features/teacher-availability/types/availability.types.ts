// ─── Enums & Literals ────────────────────────────────────────────────────────

export type MeetingPlatform = 'google_meet' | 'zoom' | 'jitsi' | 'other';

// ─── Domain Entities ─────────────────────────────────────────────────────────

export interface TeacherAvailability {
  id: string;
  teacher_id: string;
  program_id: string;
  is_available: boolean;
  available_since: string | null;
  max_students: number;
  active_student_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeacherProfileExtensions {
  meeting_link: string | null;
  meeting_platform: MeetingPlatform | null;
  languages: string[] | null;
}

// ─── Composite / Joined Types ────────────────────────────────────────────────

export interface AvailableTeacher extends TeacherAvailability {
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    meeting_link: string | null;
    meeting_platform: MeetingPlatform | null;
    languages: string[] | null;
  } | null;
}

export interface MyAvailability extends TeacherAvailability {
  programs: {
    name: string;
    name_ar: string;
  } | null;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface ToggleAvailabilityInput {
  programId: string;
  isAvailable: boolean;
  maxStudents?: number;
}

export interface UpdateTeacherProfileInput {
  meetingLink?: string;
  meetingPlatform?: MeetingPlatform;
  languages?: string[];
}
