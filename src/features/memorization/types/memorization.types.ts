import type { Tables } from '@/types/database.types';
import type { RecitationType, MemorizationStatus, AssignmentStatus } from '@/types/common.types';

// Base row types from database
type Recitation = Tables<'recitations'>;
type MemorizationProgress = Tables<'memorization_progress'>;
type MemorizationAssignment = Tables<'memorization_assignments'>;

/** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
export interface CreateRecitationInput {
  session_id: string;
  student_id: string;
  teacher_id: string;
  school_id: string;
  surah_number: number;
  from_ayah: number;
  to_ayah: number;
  recitation_type: RecitationType;
  accuracy_score?: number | null;
  tajweed_score?: number | null;
  fluency_score?: number | null;
  needs_repeat?: boolean;
  mistake_notes?: string | null;
  recitation_date?: string;
}

/** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */
export interface CreateAssignmentInput {
  student_id: string;
  assigned_by: string;
  school_id: string;
  surah_number: number;
  from_ayah: number;
  to_ayah: number;
  assignment_type: RecitationType;
  due_date: string;
  notes?: string | null;
}

// Filters for querying recitations
export interface RecitationFilters {
  studentId?: string;
  teacherId?: string;
  sessionId?: string;
  surahNumber?: number;
  recitationType?: RecitationType;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// Filters for querying assignments
export interface AssignmentFilters {
  studentId?: string;
  assignedBy?: string;
  status?: AssignmentStatus;
  assignmentType?: RecitationType;
  dueDateFrom?: string;
  dueDateTo?: string;
  page?: number;
  pageSize?: number;
}

// Filters for memorization progress
export interface ProgressFilters {
  studentId: string;
  surahNumber?: number;
  status?: MemorizationStatus;
}

// Revision schedule item (from RPC)
export interface RevisionScheduleItem {
  progress_id: string | null;
  surah_number: number;
  from_ayah: number;
  to_ayah: number;
  status: string;
  review_type: RecitationType;
  next_review_date: string | null;
  last_reviewed_at: string | null;
  review_count: number;
  ease_factor: number;
  avg_accuracy: number | null;
  avg_tajweed: number | null;
  avg_fluency: number | null;
  first_memorized_at: string | null;
}

// Memorization stats (from RPC)
export interface MemorizationStats {
  total_ayahs_memorized: number;
  total_ayahs_in_progress: number;
  surahs_started: number;
  surahs_completed: number;
  quran_percentage: number;
  items_needing_review: number;
  total_recitations: number;
  avg_overall_accuracy: number | null;
}

// Re-export for convenience
export type { Recitation, MemorizationProgress, MemorizationAssignment };
