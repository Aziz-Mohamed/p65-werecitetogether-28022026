import type { Tables } from '@/types/database.types';

/** A single entry in the student leaderboard */
export interface LeaderboardEntry {
  rank: number;
  student: Tables<'students'>;
  profile: Tables<'profiles'>;
  currentLevel: number;
  currentStreak: number;
}

/** Sticker tier type matching the DB CHECK constraint */
export type StickerTier = 'bronze' | 'silver' | 'gold' | 'diamond' | 'seasonal';

/** A single award record shown in the detail view */
export interface AwardRecord {
  id: string;
  awardedAt: string;
  awardedBy: string | null;
  reason: string | null;
}

/** Aggregated sticker in a student's collection (grouped by sticker_id) */
export interface StickerCollectionItem {
  sticker: Tables<'stickers'>;
  count: number;
  firstAwardedAt: string;
  lastAwardedAt: string;
  lastAwardedBy: string | null;
  isNew: boolean;
  awards: AwardRecord[];
}

/** A single awarded sticker instance with joined details */
export interface AwardedSticker {
  id: string;
  sticker_id: string;
  awarded_at: string;
  awarded_by: string;
  reason: string | null;
  is_new: boolean;
  stickers: {
    id: string;
    name_ar: string;
    name_en: string;
    tier: string;
    image_path: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

/** Summary of a student's gamification progress */
export interface GamificationSummary {
  currentLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalStickers: number;
  activeCertifications: number;
}

/** Rubʿ certification row with teacher name join */
export type RubCertification = Tables<'student_rub_certifications'> & {
  profiles: { full_name: string } | null;
};

/** Rubʿ reference row (static 240-row table) */
export type RubReference = Tables<'quran_rub_reference'>;

/** Freshness state derived from client-side computation */
export type FreshnessState = 'fresh' | 'fading' | 'warning' | 'critical' | 'dormant' | 'uncertified';

/** Computed freshness info for a certification */
export interface FreshnessInfo {
  percentage: number;
  state: FreshnessState;
  daysUntilDormant: number;
  intervalDays: number;
}

/** Certification enriched with client-side computed freshness */
export interface EnrichedCertification extends RubCertification {
  freshness: FreshnessInfo;
}

/** A single rubʿ slot in the progress map (reference + optional certification) */
export interface RubProgressItem {
  reference: RubReference;
  certification: EnrichedCertification | null;
  state: FreshnessState;
}

/** Input for certifying a new rubʿ */
export interface CertificationInput {
  studentId: string;
  rubNumber: number;
  certifiedBy: string;
}

// ─── Gamification Extension Types ────────────────────────────────────────────

/** Badge category grouping */
export type BadgeCategory = 'enrollment' | 'sessions' | 'streak';

/** Milestone badge type definition (from milestone_badges table) */
export interface MilestoneBadge {
  id: string;
  category: BadgeCategory;
  threshold: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  sort_order: number;
}

/** A student's badge display item (badge + earned status) */
export interface StudentBadgeDisplay {
  badge_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  category: BadgeCategory;
  sort_order: number;
  earned: boolean;
  earned_at: string | null;
  program_id: string | null;
  program_name: string | null;
}

/** Program leaderboard entry from RPC */
export interface ProgramLeaderboardEntry {
  student_id: string;
  full_name: string;
  avatar_url: string | null;
  current_level: number;
  longest_streak: number;
  rank: number;
}

/** Rewards dashboard data from RPC */
export interface RewardsDashboard {
  stickers_this_week: number;
  stickers_this_month: number;
  top_teachers: Array<{
    teacher_id: string;
    full_name: string;
    award_count: number;
  }>;
  popular_stickers: Array<{
    sticker_id: string;
    name_en: string;
    name_ar: string;
    award_count: number;
  }>;
  badge_distribution: Array<{
    badge_id: string;
    name_en: string;
    name_ar: string;
    earned_count: number;
  }>;
}

/** Sticker with optional program info (extended) */
export interface StickerWithProgram {
  id: string;
  name_ar: string;
  name_en: string;
  tier: string;
  image_path: string;
  is_active: boolean;
  program_id: string | null;
  program_name?: string | null;
}
