import type { Tables } from '@/types/database.types';
import type { Json } from '@/types/database.types';

/** Base class row from the database */
type Class = Tables<'classes'>;

/** Class record with teacher profile attached */
export interface ClassWithTeacher extends Class {
  teacher: Tables<'profiles'> | null;
  studentCount?: number;
}

/** Filters for querying classes */
export interface ClassFilters {
  teacherId?: string;
  isActive?: boolean;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
}

/** Input for creating a new class */
export interface CreateClassInput {
  name: string;
  name_localized?: Record<string, string>;
  description?: string | null;
  teacher_id?: string | null;
  max_students?: number;
  schedule?: Json | null;
  is_active?: boolean;
}
