import type { Tables } from '@/types/database.types';

export type TeacherReview = Tables<'teacher_reviews'>;
export type TeacherRatingStats = Tables<'teacher_rating_stats'>;

export const POSITIVE_TAGS = [
  'Patient',
  'Clear explanation',
  'Encouraging',
  'Excellent tajweed',
  'Well-prepared',
] as const;

export const CONSTRUCTIVE_TAGS = [
  'Session felt rushed',
  'Hard to understand',
  'Frequently late',
  'Disorganized',
] as const;

export type PositiveTag = (typeof POSITIVE_TAGS)[number];
export type ConstructiveTag = (typeof CONSTRUCTIVE_TAGS)[number];

export interface SubmitReviewInput {
  sessionId: string;
  teacherId: string;
  studentId: string;
  programId: string;
  rating: number;
  tags?: string[];
  comment?: string;
}
