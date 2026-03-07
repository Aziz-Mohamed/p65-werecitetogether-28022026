import type {
  AttendanceStatus,
  RecitationType,
  UserRole,
} from '@/types/common.types';

// ─── App ────────────────────────────────────────────────────────────────────

export const APP_NAME = 'WeReciteTogether';

export const MAX_STUDENTS_PER_CLASS = 20;

// ─── Role & Status Enumerations ─────────────────────────────────────────────

export const ROLES: readonly UserRole[] = [
  'student',
  'teacher',
  'parent',
  'supervisor',
  'program_admin',
  'master_admin',
] as const;

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = [
  'present',
  'absent',
  'late',
  'excused',
] as const;

// ─── Recitation Types ────────────────────────────────────────────────────────

export const RECITATION_TYPES: readonly RecitationType[] = [
  'new_hifz',
  'recent_review',
  'old_review',
] as const;

// ─── Scoring ────────────────────────────────────────────────────────────────

export const SCORE_RANGE = {
  min: 1,
  max: 5,
} as const;

// ─── Points System ──────────────────────────────────────────────────────────

export const POINTS = {
  session_completed: 10,
  good_score_bonus: 5,
  streak_bonus: 3,
  perfect_weekly_attendance: 20,
  sticker_default: 10,
} as const;

// ─── Level Progression (matches DB seed data) ───────────────────────────────

export interface LevelDefinition {
  readonly level: number;
  readonly points: number;
  readonly title: string;
}

export const LEVELS: readonly LevelDefinition[] = [
  { level: 1, points: 0, title: 'Beginner' },
  { level: 2, points: 50, title: 'Seeker' },
  { level: 3, points: 150, title: 'Reciter' },
  { level: 4, points: 300, title: 'Memorizer' },
  { level: 5, points: 500, title: 'Scholar' },
  { level: 6, points: 800, title: 'Hafiz Star' },
  { level: 7, points: 1200, title: 'Master' },
  { level: 8, points: 1800, title: 'Champion' },
  { level: 9, points: 2500, title: 'Legend' },
  { level: 10, points: 3500, title: 'Quran Guardian' },
] as const;
