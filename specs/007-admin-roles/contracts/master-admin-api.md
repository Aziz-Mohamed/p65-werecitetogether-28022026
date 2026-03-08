# Master Admin API Contracts

## Dashboard

### getMasterAdminDashboardStats
- **Method**: `supabase.rpc('get_master_admin_dashboard_stats')`
- **Auth**: master_admin role (profiles.role)
- **Response**: `{ total_students, total_teachers, total_active_sessions, programs: [{ program_id, name, name_ar, enrolled_count, session_count }] }`
- **Cache**: query key `['master-admin-dashboard']`, staleTime 2min

## Programs Management (extends existing)

### getAllPrograms (existing)
- **Method**: `programsService.getAllPrograms()`
- **Already implemented** in programs service

### createProgram (existing)
- **Method**: `programsService.createProgram(input)`
- **Already implemented**

### updateProgram (existing)
- **Method**: `programsService.updateProgram(programId, input)`
- **Already implemented**

## User Management

### searchUsers
- **Method**: `supabase.rpc('search_users_for_role_assignment', { p_search_query, p_limit })`
- **Auth**: master_admin
- **Response**: Array of `{ id, full_name, email, role, avatar_url, created_at, program_roles: [{ program_id, program_name, role }] }`
- **Cache**: query key `['admin-users', searchQuery]`, no staleTime (fresh on each search)

### assignProgramRole (existing)
- **Method**: `programsService.assignProgramRole({ profileId, programId, role, assignedBy })`
- **Mutation**: invalidates `['admin-users']`, `['program-team']`

### removeProgramRole (existing)
- **Method**: `programsService.removeProgramRole(roleId)`
- **Mutation**: invalidates `['admin-users']`, `['program-team']`

### promoteMasterAdmin
- **Method**: `supabase.rpc('assign_master_admin_role', { p_user_id, p_assigned_by })`
- **Auth**: master_admin
- **Mutation**: invalidates `['admin-users']`

### revokeMasterAdmin
- **Method**: `supabase.rpc('revoke_master_admin_role', { p_user_id })`
- **Auth**: master_admin, not last master_admin check
- **Error**: Returns error if this is the last master_admin
- **Mutation**: invalidates `['admin-users']`

## Platform Settings

### getPlatformConfig
- **Method**: `supabase.from('platform_config').select('*').single()`
- **Auth**: master_admin for write, all authenticated for read
- **Cache**: query key `['platform-config']`, staleTime 10min

### updatePlatformConfig
- **Method**: `supabase.from('platform_config').update({ ...fields }).eq('id', configId)`
- **Auth**: master_admin
- **Mutation**: invalidates `['platform-config']`

## Reports

### getCrossProgramEnrollmentTrend
- **Method**: `supabase.from('enrollments').select('program_id, enrolled_at').gte('enrolled_at', startDate)`
- **Auth**: master_admin
- **Response**: Raw rows, client-side aggregation
- **Cache**: query key `['enrollment-trend', startDate]`, staleTime 5min

### getCrossProgramSessionVolume
- **Method**: `supabase.from('sessions').select('program_id, created_at').gte('created_at', startDate)`
- **Auth**: master_admin
- **Cache**: query key `['session-volume', startDate]`, staleTime 5min

### getTeacherActivityHeatmap
- **Method**: `supabase.from('sessions').select('teacher_id, created_at').gte('created_at', startDate)`
- **Auth**: master_admin
- **Cache**: query key `['teacher-heatmap', startDate]`, staleTime 5min
