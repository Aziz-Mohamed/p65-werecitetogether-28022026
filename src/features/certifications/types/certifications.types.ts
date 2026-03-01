import type { Tables } from '@/types/database.types';

// ─── Status & Type Enums ────────────────────────────────────────────────────

export type CertificationStatus =
  | 'recommended'
  | 'supervisor_approved'
  | 'issued'
  | 'rejected'
  | 'revoked';

export type CertificationType = 'ijazah' | 'completion' | 'attendance';

// ─── Database Row Aliases ───────────────────────────────────────────────────

export type Certification = Tables<'certifications'>;

// ─── Joined Types ───────────────────────────────────────────────────────────

export interface CertificationWithRelations extends Certification {
  program: Pick<Tables<'programs'>, 'name' | 'name_ar'>;
  track: Pick<Tables<'program_tracks'>, 'name' | 'name_ar'> | null;
  teacher: Pick<Tables<'profiles'>, 'full_name' | 'display_name'>;
}

export interface CertificationRequest extends Certification {
  student: Pick<Tables<'profiles'>, 'full_name' | 'display_name' | 'avatar_url'>;
  teacher: Pick<Tables<'profiles'>, 'full_name'>;
}

export interface CertificationDetail extends Certification {
  program: Pick<Tables<'programs'>, 'name' | 'name_ar'>;
  track: Pick<Tables<'program_tracks'>, 'name' | 'name_ar'> | null;
  teacher: Pick<Tables<'profiles'>, 'full_name' | 'display_name'>;
  issuer: Pick<Tables<'profiles'>, 'full_name' | 'display_name'> | null;
}

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface RecommendInput {
  student_id: string;
  program_id: string;
  track_id: string | null;
  enrollment_id: string;
  type: CertificationType;
  title: string;
  title_ar: string;
  teacher_id: string;
}

export interface ReviewAction {
  action: 'approve' | 'reject';
  note?: string;
}

// ─── Eligibility Check ─────────────────────────────────────────────────────

export interface CertificationEligibility {
  eligible: boolean;
  total_sections: number;
  completed_sections: number;
  progress_type: string;
}
