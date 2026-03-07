export type MutoonStatus = 'in_progress' | 'completed' | 'certified';

export interface MutoonProgress {
  id: string;
  student_id: string;
  program_id: string;
  track_id: string;
  current_line: number;
  total_lines: number;
  last_reviewed_at: string | null;
  review_count: number;
  status: MutoonStatus;
  notes: string | null;
  certified_at: string | null;
  certified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MutoonProgressWithTrack extends MutoonProgress {
  program_tracks: {
    id: string;
    name: string;
    name_ar: string;
  } | null;
}

export interface MutoonProgressWithStudent extends MutoonProgress {
  profiles: {
    id: string;
    full_name: string;
  } | null;
}

export interface UpdateMutoonProgressInput {
  currentLine: number;
  totalLines?: number;
  notes?: string;
}

export interface CertifyMutoonInput {
  progressId: string;
}
