import type { Tables } from '@/types/database.types';
import type { ProgramCategory, TrackType } from '@/types/common.types';

// ─── Base Types (derived from database.types.ts) ────────────────────────────

export type Program = Tables<'programs'>;

export type ProgramTrack = Tables<'program_tracks'>;

export interface ProgramWithTracks extends Program {
  program_tracks: ProgramTrack[];
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export interface ProgramDisplayInfo {
  name: string;
  description: string | null;
  category: ProgramCategory;
}

export interface TrackDisplayInfo {
  name: string;
  description: string | null;
  trackType: TrackType;
}
