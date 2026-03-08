import type { MeetingPlatform } from '../../teacher-availability/types/availability.types';

// ─── Enums & Literals ────────────────────────────────────────────────────────

export type AdminRole = 'supervisor' | 'program_admin' | 'master_admin';

// ─── RPC Return Types ───────────────────────────────────────────────────────

export interface SupervisorDashboardStats {
  teacher_count: number;
  student_count: number;
  sessions_this_week: number;
  inactive_teachers: string[];
}

export interface SupervisedTeacher {
  teacher_id: string;
  full_name: string;
  avatar_url: string | null;
  program_id: string;
  program_name: string;
  student_count: number;
  sessions_this_week: number;
  average_rating: number | null;
  is_active: boolean;
}

export interface ProgramAdminDashboardStats {
  total_enrolled: number;
  active_classes: number;
  total_teachers: number;
  sessions_this_week: number;
  pending_enrollments: number;
}

export interface MasterAdminDashboardStats {
  total_students: number;
  total_teachers: number;
  total_active_sessions: number;
  programs: MasterAdminProgramSummary[];
}

export interface MasterAdminProgramSummary {
  program_id: string;
  name: string;
  name_ar: string;
  enrolled_count: number;
  session_count: number;
}

export interface MasterAdminProgramEnriched {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  category: 'free' | 'structured' | 'mixed';
  is_active: boolean;
  settings: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
  enrolled_count: number;
  team_count: number;
  active_class_count: number;
  track_count: number;
  session_count_7d: number;
}

// ─── Team & User Types ──────────────────────────────────────────────────────

export interface ProgramTeamMember {
  id: string;
  profile_id: string;
  program_id: string;
  role: 'program_admin' | 'supervisor' | 'teacher';
  supervisor_id: string | null;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    role: string;
  } | null;
}

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  program_roles_data: AdminUserProgramRole[];
}

export interface AdminUserProgramRole {
  role_id: string;
  program_id: string;
  program_name: string;
  role: string;
}

// ─── Platform Config ────────────────────────────────────────────────────────

export interface PlatformNotificationDefaults {
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export interface PlatformConfigSettings {
  notification_defaults?: PlatformNotificationDefaults;
}

export interface PlatformConfig {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  logo_url: string | null;
  default_meeting_platform: MeetingPlatform | null;
  settings: PlatformConfigSettings;
  updated_at: string;
}

// ─── RPC Parameter Types ────────────────────────────────────────────────────

export interface ReassignStudentParams {
  p_enrollment_id: string;
  p_new_teacher_id: string;
  p_supervisor_id: string;
}

export interface SearchUsersParams {
  p_search_query: string;
  p_limit?: number;
}

export interface AssignMasterAdminParams {
  p_user_id: string;
  p_assigned_by: string;
}

export interface RevokeMasterAdminParams {
  p_user_id: string;
}

// ─── Report / Chart Types ───────────────────────────────────────────────────

export interface SessionTrendPoint {
  week: string;
  count: number;
}

export interface TeacherWorkloadEntry {
  teacher_id: string;
  full_name: string;
  session_count: number;
}

export interface EnrollmentStatusDistribution {
  status: string;
  count: number;
}

export interface ProgramEnrollmentTrend {
  week: string;
  program_id: string;
  program_name: string;
  count: number;
}

export interface ProgramSessionVolume {
  week: string;
  program_id: string;
  program_name: string;
  count: number;
}

export interface TeacherActivityEntry {
  teacher_id: string;
  full_name: string;
  day: string;
  session_count: number;
}

// ─── Input Types ────────────────────────────────────────────────────────────

export interface UpdatePlatformConfigInput {
  name?: string;
  name_ar?: string;
  description?: string | null;
  default_meeting_platform?: MeetingPlatform | null;
  settings?: PlatformConfigSettings;
}

export interface LinkSupervisorInput {
  programRoleId: string;
  supervisorId: string | null;
}

export interface ProgramSettingsInput {
  max_students_per_teacher?: number;
  daily_free_session_limit?: number;
  queue_notification_threshold?: number;
  rating_good_standing?: number;
  rating_warning?: number;
  rating_concern?: number;
}

// ─── Composite / Joined Types ───────────────────────────────────────────────

export interface TeacherStudentRow {
  id: string;
  student_id: string;
  program_id: string;
  status: string;
  enrolled_at: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

export interface SessionHistoryRow {
  id: string;
  teacher_id: string;
  student_id: string | null;
  program_id: string | null;
  created_at: string;
  duration_minutes: number | null;
  notes: string | null;
  profiles: {
    full_name: string;
  } | null;
}

export interface ProgramAdminProgram {
  program_id: string;
  role: string;
  programs: {
    id: string;
    name: string;
    name_ar: string;
    category: string;
    is_active: boolean;
  } | null;
}
