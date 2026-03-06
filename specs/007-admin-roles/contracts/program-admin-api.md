# Program Admin API Contracts

## Program Selection

### getMyProgramAdminPrograms
- **Method**: `supabase.from('program_roles').select('*, programs(*)').eq('profile_id', userId).eq('role', 'program_admin')`
- **Auth**: program_admin in program_roles
- **Response**: Array of program_roles rows with nested program data
- **Cache**: query key `['my-admin-programs', userId]`

## Dashboard

### getProgramAdminDashboardStats
- **Method**: `supabase.rpc('get_program_admin_dashboard_stats', { p_program_id })`
- **Auth**: program_admin for this program
- **Response**: `{ total_enrolled, active_cohorts, total_teachers, sessions_this_week, pending_enrollments }`
- **Cache**: query key `['program-admin-dashboard', programId]`, staleTime 2min

## Team Management

### getProgramTeam
- **Method**: `supabase.from('program_roles').select('*, profiles(id, full_name, avatar_url, email, role)').eq('program_id', programId)`
- **Auth**: program_admin for this program
- **Response**: Array of program_roles with profile info
- **Cache**: query key `['program-team', programId]`

### assignTeamMember (existing)
- **Method**: `programsService.assignProgramRole({ profileId, programId, role, assignedBy })`
- **Mutation**: invalidates `['program-team', programId]`

### removeTeamMember (existing)
- **Method**: `programsService.removeProgramRole(roleId)`
- **Pre-check**: If member has active students, show warning
- **Mutation**: invalidates `['program-team', programId]`

### linkSupervisorToTeacher
- **Method**: `supabase.from('program_roles').update({ supervisor_id }).eq('id', teacherRoleId)`
- **Auth**: program_admin for this program
- **Mutation**: invalidates `['program-team', programId]`

### searchUsersForAssignment
- **Method**: `supabase.from('profiles').select('id, full_name, avatar_url, email, role').ilike('full_name', '%query%').in('role', ['teacher', 'supervisor']).limit(20)`
- **Auth**: program_admin
- **Response**: Array of profile rows

## Settings

### updateProgramSettings
- **Method**: `programsService.updateProgram(programId, { settings: { ...newSettings } })`
- **Auth**: program_admin for this program
- **Mutation**: invalidates `['program', programId]`, `['program-admin-dashboard', programId]`

## Reports

### getProgramSessionTrend
- **Method**: `supabase.from('sessions').select('created_at').eq('program_id', programId).gte('created_at', startDate)`
- **Auth**: program_admin scope
- **Response**: Raw session dates, client-side aggregation by week
- **Cache**: query key `['program-session-trend', programId, startDate]`, staleTime 5min

### getTeacherWorkload
- **Method**: `supabase.rpc('get_supervised_teachers', { p_supervisor_id })` — reuse with program_id filter, or direct query
- **Alternative**: Direct parallel queries for session counts per teacher
- **Cache**: query key `['teacher-workload', programId]`, staleTime 5min
