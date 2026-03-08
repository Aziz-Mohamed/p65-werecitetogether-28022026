/**
 * API Contract: Teacher Availability Service
 *
 * All methods return raw Supabase { data, error } responses.
 * Hooks wrap these and throw on error.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type MeetingPlatform = 'google_meet' | 'zoom' | 'jitsi' | 'other';

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

export interface ToggleAvailabilityInput {
  programId: string;
  isAvailable: boolean;
  maxStudents?: number; // default: 1, range: 1-10
}

export interface UpdateTeacherProfileInput {
  meetingLink?: string;
  meetingPlatform?: MeetingPlatform;
  languages?: string[];
}

// ─── Service Contract ────────────────────────────────────────────────────────

/**
 * AV-001: Get available teachers for a program (student view)
 * - Ordered by available_since ASC (longest-waiting first)
 * - Joins profiles for name, avatar, languages, meeting info
 * - RLS restricts to enrolled students only
 */
// getAvailableTeachers(programId: string): Promise<{ data, error }>

/**
 * AV-002: Get teacher's own availability across all programs
 * - Returns all teacher_availability rows for auth.uid()
 * - Joins programs for program name display
 */
// getMyAvailability(): Promise<{ data, error }>

/**
 * AV-003: Toggle availability via RPC
 * - Calls toggle_availability(p_program_id, p_is_available, p_max_students)
 * - Server validates meeting_link exists and program_role assignment
 */
// toggleAvailability(input: ToggleAvailabilityInput): Promise<{ data, error }>

/**
 * AV-004: Join teacher session via RPC
 * - Calls join_teacher_session(p_availability_id)
 * - Returns boolean (true = joined, false = full)
 * - Atomically increments active_student_count
 */
// joinSession(availabilityId: string): Promise<{ data, error }>

// AV-005: REMOVED — no leave_teacher_session RPC needed.
// Students deep-link to external meetings; counter resets on teacher offline/timeout.

/**
 * AV-006: Update teacher profile extensions
 * - Updates meeting_link, meeting_platform, languages on profiles table
 * - Scoped to auth.uid()
 */
// updateTeacherProfile(input: UpdateTeacherProfileInput): Promise<{ data, error }>

/**
 * AV-007: Get teacher profile extensions
 * - Reads meeting_link, meeting_platform, languages from own profile
 */
// getTeacherProfile(): Promise<{ data, error }>
