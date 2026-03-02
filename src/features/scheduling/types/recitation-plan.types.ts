import type { Tables } from '@/types/database.types';

export type SessionRecitationPlan = Tables<'session_recitation_plans'>;

export type SelectionMode = 'ayah_range' | 'rub' | 'hizb' | 'juz' | 'surah';
export type RecitationPlanType = 'new_hifz' | 'recent_review' | 'old_review';
export type PlanSource = 'manual' | 'from_assignment' | 'student_suggestion';

/** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
export interface CreateRecitationPlanInput {
  school_id: string;
  scheduled_session_id: string;
  student_id?: string | null;
  set_by: string;
  selection_mode: SelectionMode;
  start_surah: number;
  start_ayah: number;
  end_surah: number;
  end_ayah: number;
  rub_number?: number | null;
  juz_number?: number | null;
  hizb_number?: number | null;
  recitation_type: RecitationPlanType;
  source?: PlanSource;
  assignment_id?: string | null;
  notes?: string | null;
}

export interface UpdateRecitationPlanInput {
  selection_mode?: SelectionMode;
  start_surah?: number;
  start_ayah?: number;
  end_surah?: number;
  end_ayah?: number;
  rub_number?: number | null;
  juz_number?: number | null;
  hizb_number?: number | null;
  recitation_type?: RecitationPlanType;
  notes?: string | null;
}

export interface RecitationPlanWithDetails extends SessionRecitationPlan {
  setter?: Pick<Tables<'profiles'>, 'full_name'> | null;
  student?: {
    profiles: Pick<Tables<'profiles'>, 'full_name'> | null;
  } | null;
}
