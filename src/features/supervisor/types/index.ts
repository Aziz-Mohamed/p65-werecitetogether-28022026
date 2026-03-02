import type { Tables } from '@/types/database.types';

export interface TeacherSummary {
  id: string;
  full_name: string;
  display_name: string | null;
  avatar_url: string | null;
  session_count_week: number;
  session_count_month: number;
  active_students: number;
  average_rating: number | null;
  total_reviews: number;
  has_flagged_reviews: boolean;
}

export interface TeacherDetail extends TeacherSummary {
  recent_sessions: Tables<'sessions'>[];
  enrollments: Array<{
    student_id: string;
    student_name: string;
    status: string;
    enrolled_at: string;
  }>;
}

export interface FlaggedReview {
  id: string;
  teacher_id: string;
  teacher_name: string;
  student_id: string;
  student_name: string;
  rating: number;
  tags: string[] | null;
  comment: string | null;
  created_at: string;
  is_excluded: boolean;
}
