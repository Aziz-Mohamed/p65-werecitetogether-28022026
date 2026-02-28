import type { Tables } from '@/types/database.types';

export type TeacherAvailability = Tables<'teacher_availability'>;

export interface AvailableTeacher {
  id: string;
  profile: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
    meeting_link: string | null;
    meeting_platform: string | null;
    languages: string[] | null;
  };
  availability: TeacherAvailability;
  ratingStats: {
    average_rating: number | null;
    total_reviews: number;
  } | null;
}

export interface ToggleAvailabilityInput {
  programId: string;
  isAvailable: boolean;
}
