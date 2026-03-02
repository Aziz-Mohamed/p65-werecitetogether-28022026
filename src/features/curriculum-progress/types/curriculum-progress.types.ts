import type { Tables } from '@/types/database.types';

// ─── Progress Type Discriminator ────────────────────────────────────────────

export type ProgressType = 'mutoon' | 'qiraat' | 'arabic';

// ─── Status Enums (per progress type) ───────────────────────────────────────

export type MutoonStatus = 'not_started' | 'in_progress' | 'memorized' | 'certified';
export type QiraatStatus = 'not_started' | 'passed' | 'failed';
export type ArabicStatus = 'not_started' | 'in_progress' | 'passed' | 'failed';

// ─── Database Row Alias ─────────────────────────────────────────────────────

export type CurriculumProgress = Tables<'curriculum_progress'>;

// ─── Curriculum Section (from program_tracks.curriculum JSONB) ──────────────

export interface CurriculumSection {
  section_number: number;
  title: string;
  title_ar: string;
}

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface UpdateSectionInput {
  status: string;
  score?: number;
  teacher_notes?: string;
}

export interface BatchUpdateItem {
  progressId: string;
  status: string;
  score?: number;
}

// ─── Summary / Eligibility ──────────────────────────────────────────────────

export interface ProgressSummary {
  total_sections: number;
  completed_sections: number;
  percentage: number;
}

export interface CertificationEligibility {
  eligible: boolean;
  total_sections: number;
  completed_sections: number;
  progress_type: string;
}
