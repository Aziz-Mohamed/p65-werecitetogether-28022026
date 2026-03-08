// ─── Enums & Literals ────────────────────────────────────────────────────────

export type ProgramCategory = 'free' | 'structured' | 'mixed';

export type TrackType = 'free' | 'structured';

export type EnrollmentStatus = 'pending' | 'active' | 'completed' | 'dropped' | 'waitlisted';

export type CohortStatus =
  | 'enrollment_open'
  | 'enrollment_closed'
  | 'in_progress'
  | 'completed'
  | 'archived';

export type ProgramRoleType = 'program_admin' | 'supervisor' | 'teacher';

// ─── JSONB Schemas ───────────────────────────────────────────────────────────

export interface ProgramSettings {
  max_students_per_teacher?: number;
  auto_approve?: boolean;
  session_duration_minutes?: number;
}

export interface TrackCurriculum {
  units?: Array<{
    name: string;
    name_ar: string;
    description?: string;
  }>;
  total_duration_weeks?: number;
  reference_text?: string;
  reference_text_ar?: string;
}

export interface CohortScheduleEntry {
  day: number;   // 0=Sunday … 6=Saturday
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
}

// ─── Domain Entities ─────────────────────────────────────────────────────────

export interface Program {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  category: ProgramCategory;
  is_active: boolean;
  settings: ProgramSettings;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramTrack {
  id: string;
  program_id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  track_type: TrackType | null;
  curriculum: TrackCurriculum | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cohort {
  id: string;
  program_id: string;
  track_id: string | null;
  name: string;
  status: CohortStatus;
  max_students: number;
  teacher_id: string;
  supervisor_id: string | null;
  meeting_link: string | null;
  schedule: CohortScheduleEntry[] | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  program_id: string;
  track_id: string | null;
  cohort_id: string | null;
  teacher_id: string | null;
  status: EnrollmentStatus;
  enrolled_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramRole {
  id: string;
  profile_id: string;
  program_id: string;
  role: ProgramRoleType;
  assigned_by: string | null;
  created_at: string;
}

// ─── Composite / Joined Types ────────────────────────────────────────────────

export interface ProgramWithTracks extends Program {
  program_tracks: ProgramTrack[];
}

export interface CohortWithTeacher extends Cohort {
  profiles: {
    id: string;
    full_name: string;
    meeting_link: string | null;
  } | null;
  enrollments: { count: number }[];
}

export interface EnrollmentWithDetails extends Enrollment {
  programs: Pick<Program, 'id' | 'name' | 'name_ar' | 'category'> | null;
  program_tracks: Pick<ProgramTrack, 'id' | 'name' | 'name_ar'> | null;
  cohorts: {
    id: string;
    name: string;
    status: CohortStatus;
    teacher_id: string;
    profiles: { full_name: string } | null;
  } | null;
}

export interface ProgramRoleWithProfile extends ProgramRole {
  profiles: {
    id: string;
    full_name: string;
    role: string;
  } | null;
}

// ─── Input / Filter Types ────────────────────────────────────────────────────

export interface CohortFilters {
  programId: string;
  trackId?: string;
}

export interface EnrollInput {
  programId: string;
  trackId?: string;
  cohortId?: string;
}

export interface CreateCohortInput {
  programId: string;
  trackId?: string;
  name: string;
  maxStudents: number;
  teacherId: string;
  supervisorId?: string;
  meetingLink?: string;
  schedule?: CohortScheduleEntry[];
  startDate?: string;
  endDate?: string;
}

export interface UpdateProgramInput {
  name?: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  category?: ProgramCategory;
  settings?: ProgramSettings;
  is_active?: boolean;
  sort_order?: number;
}

export interface CreateTrackInput {
  programId: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  trackType?: TrackType;
  sortOrder?: number;
}

export interface AssignRoleInput {
  profileId: string;
  programId: string;
  role: ProgramRoleType;
}

// ─── Waitlist Types ───────────────────────────────────────────────────────────

export type WaitlistStatus = 'waiting' | 'offered' | 'accepted' | 'expired' | 'cancelled';

export interface WaitlistEntry {
  id: string;
  student_id: string;
  program_id: string;
  cohort_id: string;
  track_id: string | null;
  position: number;
  status: WaitlistStatus;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaitlistEntryWithStudent extends WaitlistEntry {
  profiles: {
    id: string;
    full_name: string;
  } | null;
}
