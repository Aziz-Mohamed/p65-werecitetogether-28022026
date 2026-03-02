import { supabase } from '@/lib/supabase';
import type { ServiceResult } from '@/types/common.types';
import type { Tables } from '@/types/database.types';

export type ProgramRole = Tables<'program_roles'>;

export interface ProgramRoleWithProfile extends ProgramRole {
  profile?: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

class ProgramRolesService {
  async assignRole(data: {
    profileId: string;
    programId: string;
    role: string;
  }): Promise<ServiceResult<ProgramRole>> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: result, error } = await supabase
      .from('program_roles')
      .insert({
        profile_id: data.profileId,
        program_id: data.programId,
        role: data.role,
        assigned_by: user?.id ?? null,
      })
      .select()
      .single();

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: result };
  }

  async removeRole(id: string): Promise<ServiceResult<void>> {
    const { error } = await supabase
      .from('program_roles')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: undefined };
  }

  async getRolesForProgram(
    programId: string,
  ): Promise<ServiceResult<ProgramRoleWithProfile[]>> {
    const { data, error } = await supabase
      .from('program_roles')
      .select(
        `
        *,
        profile:profiles!program_roles_profile_id_fkey (
          id, full_name, display_name, avatar_url
        )
      `,
      )
      .eq('program_id', programId)
      .order('role');

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: (data ?? []) as unknown as ProgramRoleWithProfile[] };
  }

  async getUserPrograms(
    profileId: string,
  ): Promise<ServiceResult<ProgramRole[]>> {
    const { data, error } = await supabase
      .from('program_roles')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: { message: error.message, code: error.code } };
    }

    return { data: data ?? [] };
  }
}

export const programRolesService = new ProgramRolesService();
