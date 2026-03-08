import { supabase } from '@/lib/supabase';
import type {
  UpdatePlatformConfigInput,
  SearchUsersParams,
  AssignMasterAdminParams,
  RevokeMasterAdminParams,
  ReassignStudentParams,
} from '../types/admin.types';

class AdminService {
  // ─── Supervisor ────────────────────────────────────────────────────────────

  async getSupervisorDashboardStats(supervisorId: string) {
    return supabase.rpc('get_supervisor_dashboard_stats', {
      p_supervisor_id: supervisorId,
    });
  }

  async getSupervisedTeachers(supervisorId: string) {
    return supabase.rpc('get_supervised_teachers', {
      p_supervisor_id: supervisorId,
    });
  }

  async getTeacherStudents(teacherId: string, programId: string) {
    return supabase
      .from('enrollments')
      .select(`
        id, student_id, program_id, status, enrolled_at,
        profiles:student_id ( id, full_name, avatar_url )
      `)
      .eq('teacher_id', teacherId)
      .eq('program_id', programId)
      .in('status', ['active', 'approved', 'pending'])
      .order('enrolled_at', { ascending: false });
  }

  async getTeacherSessionHistory(teacherId: string, limit = 50) {
    return supabase
      .from('sessions')
      .select(`
        id, teacher_id, student_id, program_id, created_at,
        duration_minutes, notes,
        profiles:student_id ( full_name )
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  async reassignStudent(params: ReassignStudentParams) {
    return supabase.rpc('reassign_student', params);
  }

  // ─── Program Admin ─────────────────────────────────────────────────────────

  async getMyProgramAdminPrograms(userId: string) {
    return supabase
      .from('program_roles')
      .select(`
        program_id, role,
        programs ( id, name, name_ar, category, is_active )
      `)
      .eq('profile_id', userId)
      .eq('role', 'program_admin');
  }

  async getMasterAdminProgramsEnriched() {
    return supabase.rpc('get_master_admin_programs_enriched');
  }

  async getProgramAdminDashboardStats(programId: string) {
    return supabase.rpc('get_program_admin_dashboard_stats', {
      p_program_id: programId,
    });
  }

  async getProgramTeam(programId: string) {
    return supabase
      .from('program_roles')
      .select(`
        id, profile_id, program_id, role, supervisor_id, created_at,
        profiles:profile_id ( id, full_name, avatar_url, role )
      `)
      .eq('program_id', programId)
      .order('role');
  }

  async linkSupervisorToTeacher(teacherRoleId: string, supervisorId: string | null) {
    return supabase
      .from('program_roles')
      .update({ supervisor_id: supervisorId })
      .eq('id', teacherRoleId)
      .select()
      .single();
  }

  async searchUsersForAssignment(query: string, limit = 20) {
    return supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role')
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(limit);
  }

  async getProgramSessionTrend(programId: string, startDate: string) {
    return supabase
      .from('sessions')
      .select('created_at')
      .eq('program_id', programId)
      .gte('created_at', startDate);
  }

  async getTeacherWorkload(programId: string) {
    return supabase
      .from('program_roles')
      .select(`
        profile_id,
        profiles:profile_id ( full_name )
      `)
      .eq('program_id', programId)
      .eq('role', 'teacher');
  }

  async getTeacherSessionCounts(teacherIds: string[], startDate: string) {
    return supabase
      .from('sessions')
      .select('teacher_id')
      .in('teacher_id', teacherIds)
      .gte('created_at', startDate);
  }

  // ─── Role-Specific Lists ──────────────────────────────────────────────────

  async getSupervisors(filters?: { searchQuery?: string }) {
    let query = supabase
      .from('profiles')
      .select('id, full_name, name_localized, username, avatar_url')
      .eq('role', 'supervisor');

    if (filters?.searchQuery) {
      query = query.or(
        `full_name.ilike.%${filters.searchQuery}%,name_localized::text.ilike.%${filters.searchQuery}%`,
      );
    }

    return query.order('full_name');
  }

  async getProgramAdmins(filters?: { searchQuery?: string }) {
    let query = supabase
      .from('profiles')
      .select('id, full_name, name_localized, username, avatar_url')
      .eq('role', 'program_admin');

    if (filters?.searchQuery) {
      query = query.or(
        `full_name.ilike.%${filters.searchQuery}%,name_localized::text.ilike.%${filters.searchQuery}%`,
      );
    }

    return query.order('full_name');
  }

  async getUserDetail(id: string) {
    return supabase
      .from('profiles')
      .select('id, full_name, name_localized, username, avatar_url, phone, role, created_at')
      .eq('id', id)
      .single();
  }

  async getUserProgramRoles(userId: string) {
    return supabase
      .from('program_roles')
      .select('id, program_id, role, programs!inner(name)')
      .eq('profile_id', userId);
  }

  // ─── Master Admin ──────────────────────────────────────────────────────────

  async getMasterAdminDashboardStats() {
    return supabase.rpc('get_master_admin_dashboard_stats');
  }

  async searchUsersForRoleAssignment(params: SearchUsersParams) {
    return supabase.rpc('search_users_for_role_assignment', {
      p_search_query: params.p_search_query,
      p_limit: params.p_limit ?? 20,
    });
  }

  async assignMasterAdminRole(params: AssignMasterAdminParams) {
    return supabase.rpc('assign_master_admin_role', params);
  }

  async revokeMasterAdminRole(params: RevokeMasterAdminParams) {
    return supabase.rpc('revoke_master_admin_role', params);
  }

  async changeUserRole(userId: string, newRole: string) {
    return supabase.rpc('change_user_role', {
      p_user_id: userId,
      p_new_role: newRole,
    } as any);
  }

  async getPlatformConfig() {
    return supabase
      .from('platform_config')
      .select('*')
      .single();
  }

  async updatePlatformConfig(configId: string, input: UpdatePlatformConfigInput) {
    return supabase
      .from('platform_config')
      .update(input)
      .eq('id', configId)
      .select()
      .single();
  }

  // ─── Cross-Program Reports (Master Admin) ─────────────────────────────────

  async getCrossProgramEnrollmentTrend(startDate: string) {
    return supabase
      .from('enrollments')
      .select('program_id, enrolled_at')
      .gte('enrolled_at', startDate);
  }

  async getCrossProgramSessionVolume(startDate: string) {
    return supabase
      .from('sessions')
      .select('program_id, created_at')
      .gte('created_at', startDate);
  }

  async getTeacherActivityHeatmap(startDate: string) {
    return supabase
      .from('sessions')
      .select('teacher_id, created_at')
      .gte('created_at', startDate);
  }
}

export const adminService = new AdminService();
