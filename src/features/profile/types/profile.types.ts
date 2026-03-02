import type { Tables } from '@/types/database.types';
import type { Gender, AgeRange, UserRole } from '@/types/common.types';

export type Profile = Tables<'profiles'>;

export interface UpdateProfileInput {
  full_name?: string;
  display_name?: string | null;
  gender?: Gender;
  age_range?: AgeRange;
  country?: string;
  region?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  meeting_link?: string | null;
  meeting_platform?: string | null;
  languages?: string[] | null;
}
