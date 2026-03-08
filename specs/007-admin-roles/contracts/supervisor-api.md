# Supervisor API Contracts

All endpoints use Supabase RPC or direct table queries via the JS SDK. No custom REST endpoints.

## Supervisor Dashboard

### getSupervisorDashboardStats
- **Method**: `supabase.rpc('get_supervisor_dashboard_stats', { p_supervisor_id })`
- **Auth**: supervisor role required
- **Response**: `{ teacher_count, student_count, sessions_this_week, inactive_teachers[] }`
- **Cache**: query key `['supervisor-dashboard', supervisorId]`, staleTime 2min

### getSupervisedTeachers
- **Method**: `supabase.rpc('get_supervised_teachers', { p_supervisor_id })`
- **Auth**: supervisor role required
- **Response**: Array of `{ teacher_id, full_name, avatar_url, program_id, program_name, student_count, sessions_this_week, average_rating, is_active }`
- **Cache**: query key `['supervised-teachers', supervisorId]`, staleTime 2min

## Teacher Detail (Supervisor View)

### getTeacherStudents
- **Method**: `supabase.from('enrollments').select('*, profiles!...').eq('teacher_id', teacherId).eq('program_id', programId)`
- **Auth**: supervisor must supervise this teacher (program_roles check)
- **Response**: Array of enrollment rows with student profile info
- **Cache**: query key `['teacher-students', teacherId, programId]`

### getTeacherSessionHistory
- **Method**: `supabase.from('sessions').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }).limit(50)`
- **Auth**: supervisor scope
- **Response**: Array of session rows
- **Cache**: query key `['teacher-sessions', teacherId]`

## Student Reassignment

### reassignStudent
- **Method**: `supabase.rpc('reassign_student', { p_enrollment_id, p_new_teacher_id, p_supervisor_id })`
- **Auth**: supervisor role, must supervise both teachers
- **Mutation**: invalidates `['teacher-students']`, `['supervised-teachers']`

## Supervisor Flags

### flagTeacherIssue
- **Method**: `supabase.functions.invoke('send-notification', { body: { type: 'supervisor_flag', teacher_id, program_id, note, supervisor_id } })`
- **Auth**: supervisor role
- **Input**: `{ teacher_id, program_id, note, supervisor_id }`
- **Recipients**: ALL users with `program_roles.role = 'program_admin'` for the teacher's program
- **No persistence** — notification only
- **Requires**: `supervisor_flag` category added to send-notification edge function (T052)
