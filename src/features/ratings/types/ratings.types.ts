// ─── Enums & Literals ────────────────────────────────────────────────────────

export type TrendDirection = 'improving' | 'declining' | 'stable';

export type ExclusionAction = 'excluded' | 'restored';

// ─── Domain Entities ─────────────────────────────────────────────────────────

export interface Rating {
  id: string;
  session_id: string | null;
  student_id: string;
  teacher_id: string;
  program_id: string;
  star_rating: number;
  tags: string[];
  comment: string | null;
  is_flagged: boolean;
  is_excluded: boolean;
  created_at: string;
}

export interface RatingStats {
  teacher_id: string;
  program_id: string;
  average_rating: number;
  total_reviews: number;
  star_distribution: Record<string, number>;
  common_positive_tags: string[];
  common_constructive_tags: string[];
  trend_direction: TrendDirection;
  last_30_days_avg: number;
  prior_30_days_avg: number;
  updated_at: string;
}

export interface ExclusionLogEntry {
  id: string;
  rating_id: string;
  action: ExclusionAction;
  performed_by: string;
  performer_name?: string;
  reason: string;
  created_at: string;
}

// ─── Composite / Joined Types ────────────────────────────────────────────────

export interface ReviewWithDetails extends Rating {
  student_name: string;
  exclusion_log: ExclusionLogEntry[];
}

export interface TeacherReviewsResponse {
  reviews: ReviewWithDetails[];
  total_count: number;
  page: number;
  page_size: number;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface SubmitRatingInput {
  sessionId: string;
  starRating: number;
  tags: string[];
  comment: string | null;
}

export interface ExcludeRatingInput {
  ratingId: string;
  reason: string;
}

export interface RestoreRatingInput {
  ratingId: string;
  reason: string;
}

// ─── Feedback Tags ───────────────────────────────────────────────────────────

export interface FeedbackTag {
  key: string;
  i18nKey: string;
  category: 'positive' | 'constructive';
}
