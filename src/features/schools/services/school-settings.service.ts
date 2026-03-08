import { supabase } from '@/lib/supabase';
import type { SchoolSettings } from '../types/school-settings.types';

class SchoolSettingsService {
  /**
   * Get school settings JSONB.
   *
   * @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5.
   */
  async getSettings(schoolId: string) {
    return supabase
      .from('schools')
      .select('settings')
      .eq('id', schoolId)
      .single();
  }

  /**
   * Update school settings (merges into existing JSONB).
   *
   * @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5.
   */
  async updateSettings(schoolId: string, updates: Partial<SchoolSettings>) {
    const { data: current } = await this.getSettings(schoolId);
    const merged = { ...((current?.settings as Record<string, unknown>) ?? {}), ...updates };

    return supabase
      .from('schools')
      .update({ settings: merged })
      .eq('id', schoolId)
      .select('settings')
      .single();
  }
}

export const schoolSettingsService = new SchoolSettingsService();
