import { supabase } from '@/lib/supabase';
import type { AddGuardianInput, UpdateGuardianInput } from '../types/guardians.types';

class GuardiansService {
  /**
   * Get all guardians for a student, primary first.
   */
  async getGuardians(studentId: string) {
    return supabase
      .from('student_guardians')
      .select('*')
      .eq('student_id', studentId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
  }

  /**
   * Get notification preferences for a specific guardian.
   */
  async getGuardianNotificationPreferences(guardianId: string) {
    return supabase
      .from('guardian_notification_preferences')
      .select('*')
      .eq('guardian_id', guardianId);
  }

  /**
   * Add a new guardian to a student profile.
   */
  async addGuardian(input: AddGuardianInput) {
    return supabase
      .from('student_guardians')
      .insert(input)
      .select()
      .single();
  }

  /**
   * Update an existing guardian record.
   */
  async updateGuardian(guardianId: string, input: UpdateGuardianInput) {
    return supabase
      .from('student_guardians')
      .update(input)
      .eq('id', guardianId)
      .select()
      .single();
  }

  /**
   * Remove a guardian. Caller should check it's not the last guardian for children's programs.
   */
  async removeGuardian(guardianId: string) {
    return supabase
      .from('student_guardians')
      .delete()
      .eq('id', guardianId);
  }

  /**
   * Upsert a guardian notification preference for a specific category.
   */
  async updateGuardianNotificationPreference(
    guardianId: string,
    category: string,
    enabled: boolean,
  ) {
    return supabase
      .from('guardian_notification_preferences')
      .upsert(
        { guardian_id: guardianId, category, enabled },
        { onConflict: 'guardian_id,category' },
      )
      .select()
      .single();
  }
}

export const guardiansService = new GuardiansService();
