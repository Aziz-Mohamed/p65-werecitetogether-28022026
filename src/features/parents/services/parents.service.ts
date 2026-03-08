import { supabase } from '@/lib/supabase';
import type { ParentFilters } from '../types/parents.types';

class ParentsService {
  async getParents(filters?: ParentFilters) {
    let query = supabase
      .from('profiles')
      .select(
        'id, full_name, name_localized, username, avatar_url, phone, students!students_parent_id_fkey(id, profiles!students_id_fkey(full_name, name_localized), is_active)',
      )
      .eq('role', 'parent');

    if (filters?.searchQuery) {
      query = query.or(
        `full_name.ilike.%${filters.searchQuery}%,name_localized::text.ilike.%${filters.searchQuery}%`,
      );
    }

    return query.order('full_name');
  }

  async getParentById(id: string) {
    return supabase
      .from('profiles')
      .select(
        'id, full_name, name_localized, username, avatar_url, phone, created_at, students!students_parent_id_fkey(id, profiles!students_id_fkey(full_name, name_localized), is_active)',
      )
      .eq('id', id)
      .eq('role', 'parent')
      .single();
  }

  async updateParent(id: string, input: { fullName?: string; phone?: string; nameLocalized?: Record<string, string> }) {
    const updates: Record<string, unknown> = {};
    if (input.fullName !== undefined) updates.full_name = input.fullName;
    if (input.phone !== undefined) updates.phone = input.phone;
    if (input.nameLocalized !== undefined) updates.name_localized = input.nameLocalized;

    return supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  }
}

export const parentsService = new ParentsService();
