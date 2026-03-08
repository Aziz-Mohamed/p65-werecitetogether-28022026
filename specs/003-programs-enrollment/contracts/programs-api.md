# API Contracts: Programs & Enrollment

**Feature**: 003-programs-enrollment
**Date**: 2026-03-04
**Pattern**: Supabase JS SDK queries (no REST/GraphQL layer)

---

## Conventions

All queries use the Supabase JS SDK via `programs.service.ts`. No custom API endpoints — all data access is through Supabase client with RLS enforcement.

Return types: Raw Supabase query results `{ data, error }` for reads. RPC calls for mutations that require atomicity.

---

## Read Operations

### PR-001: List Active Programs

```typescript
// Service method
async getPrograms(): Promise<PostgrestResponse<Program[]>>

// Supabase query
supabase
  .from('programs')
  .select('*')
  .eq('is_active', true)
  .order('sort_order', { ascending: true })
```

**Returns**: All active programs ordered by `sort_order`
**RLS**: Authenticated users can read all active programs

---

### PR-002: Get Program Detail with Tracks

```typescript
// Service method
async getProgram(id: string): Promise<PostgrestResponse<ProgramWithTracks>>

// Supabase query
supabase
  .from('programs')
  .select(`
    *,
    program_tracks (
      id, name, name_ar, description, description_ar,
      curriculum, sort_order, is_active
    )
  `)
  .eq('id', id)
  .eq('program_tracks.is_active', true)
  .order('sort_order', { referencedTable: 'program_tracks', ascending: true })
  .single()
```

**Returns**: Single program with its active tracks
**RLS**: Authenticated users can read

---

### PR-003: List Cohorts for Track/Program

```typescript
// Service method
async getCohorts(filters: CohortFilters): Promise<PostgrestResponse<CohortWithCount[]>>

// Supabase query
supabase
  .from('cohorts')
  .select(`
    *,
    profiles!cohorts_teacher_id_fkey ( id, full_name, meeting_link ),
    enrollments ( count )
  `)
  .eq('program_id', filters.programId)
  .eq('track_id', filters.trackId)  // optional
  .in('status', ['enrollment_open', 'enrollment_closed', 'in_progress'])
  .order('created_at', { ascending: false })
```

**Returns**: Cohorts with teacher info and enrollment count
**RLS**: Authenticated users can read

---

### PR-004: Get Student Enrollments

```typescript
// Service method
async getMyEnrollments(): Promise<PostgrestResponse<EnrollmentWithProgram[]>>

// Supabase query
supabase
  .from('enrollments')
  .select(`
    *,
    programs ( id, name, name_ar, category ),
    program_tracks ( id, name, name_ar ),
    cohorts ( id, name, status, teacher_id,
      profiles!cohorts_teacher_id_fkey ( full_name )
    )
  `)
  .eq('student_id', userId)
  .order('enrolled_at', { ascending: false })
```

**Returns**: Student's enrollments with program/track/cohort details
**RLS**: Students read only their own enrollments

---

### PR-005: Get Program Roles

```typescript
// Service method
async getProgramRoles(programId: string): Promise<PostgrestResponse<ProgramRoleWithProfile[]>>

// Supabase query
supabase
  .from('program_roles')
  .select(`
    *,
    profiles!program_roles_profile_id_fkey ( id, full_name, role )
  `)
  .eq('program_id', programId)
  .order('role')
```

**Returns**: All role assignments for a program with profile info
**RLS**: Program admins read within their programs, master admin reads all

---

## Write Operations (RPC)

### PR-006: Enroll in Structured Program

```typescript
// Service method
async enrollStructured(input: EnrollInput): Promise<{ data: string | null; error: Error | null }>

// Supabase RPC
supabase.rpc('enroll_student', {
  p_program_id: input.programId,
  p_track_id: input.trackId,
  p_cohort_id: input.cohortId,
})
```

**Input**: `{ programId: string, trackId?: string, cohortId?: string }`
**Returns**: Created enrollment ID
**Errors**: `ENROLL_PROGRAM_NOT_FOUND`, `ENROLL_TRACK_NOT_FOUND`, `ENROLL_COHORT_REQUIRED`, `ENROLL_COHORT_NOT_FOUND`, `ENROLL_COHORT_CLOSED`, `Authentication required`, `Only students can enroll`, duplicate key violation (23505). Error codes are mapped to i18n strings at the service layer.
**RLS**: SECURITY DEFINER function — bypasses RLS, validates `auth.uid()` and student role internally

---

### PR-007: Join Free Program

```typescript
// Service method
async joinFreeProgram(programId: string, trackId?: string): Promise<PostgrestResponse<Enrollment>>

// Supabase query
supabase
  .from('enrollments')
  .insert({
    student_id: userId,
    program_id: programId,
    track_id: trackId ?? null,
    status: 'active',
  })
  .select()
  .single()
```

**Returns**: Created enrollment
**RLS**: Requires explicit INSERT policy on `enrollments` allowing `student_id = auth.uid()` AND `get_user_role() = 'student'`. This is a direct Supabase insert (NOT via `enroll_student()` RPC), so RLS is enforced. The RPC path is used only for structured enrollment where atomicity is needed.

---

### PR-008: Leave/Drop Program

```typescript
// Service method
async leaveProgram(enrollmentId: string): Promise<PostgrestResponse<Enrollment>>

// Supabase query
supabase
  .from('enrollments')
  .update({ status: 'dropped' })
  .eq('id', enrollmentId)
  .eq('student_id', userId)
  .select()
  .single()
```

**Returns**: Updated enrollment
**RLS**: Students can update own enrollments to `dropped`

---

## Admin Write Operations

### PR-009: Approve/Reject Enrollment

```typescript
// Service method
async updateEnrollmentStatus(
  enrollmentId: string,
  status: 'active' | 'dropped'
): Promise<PostgrestResponse<Enrollment>>

// Supabase query
supabase
  .from('enrollments')
  .update({ status })
  .eq('id', enrollmentId)
  .select()
  .single()
```

**RLS**: Program admins can update within their programs, master admin all

---

### PR-010: Create Cohort

```typescript
// Service method
async createCohort(input: CreateCohortInput): Promise<PostgrestResponse<Cohort>>

// Supabase query
supabase
  .from('cohorts')
  .insert({
    program_id: input.programId,
    track_id: input.trackId,
    name: input.name,
    max_students: input.maxStudents,
    teacher_id: input.teacherId,
    supervisor_id: input.supervisorId,
    meeting_link: input.meetingLink,
    schedule: input.schedule,
    start_date: input.startDate,
    end_date: input.endDate,
    status: 'enrollment_open',
  })
  .select()
  .single()
```

**RLS**: Program admins within their programs, master admin all

---

### PR-011: Update Cohort Status

```typescript
// Service method
async updateCohortStatus(
  cohortId: string,
  status: CohortStatus
): Promise<PostgrestResponse<Cohort>>

// Supabase query
supabase
  .from('cohorts')
  .update({ status })
  .eq('id', cohortId)
  .select()
  .single()
```

**RLS**: Program admins within their programs, master admin all

---

### PR-012: Assign Program Role

```typescript
// Service method
async assignProgramRole(input: AssignRoleInput): Promise<PostgrestResponse<ProgramRole>>

// Supabase query
supabase
  .from('program_roles')
  .insert({
    profile_id: input.profileId,
    program_id: input.programId,
    role: input.role,
    assigned_by: currentUserId,
  })
  .select()
  .single()
```

**RLS**: Program admins assign teacher/supervisor. Master admin assigns all roles.

---

### PR-013: Remove Program Role

```typescript
// Service method
async removeProgramRole(roleId: string): Promise<PostgrestResponse<null>>

// Supabase query
supabase
  .from('program_roles')
  .delete()
  .eq('id', roleId)
```

**RLS**: Same as assignment

---

## Query Keys

```typescript
// Programs feature query keys
const programKeys = {
  all: ['programs'] as const,
  detail: (id: string) => ['programs', id] as const,
  tracks: (programId: string) => ['programs', programId, 'tracks'] as const,
  cohorts: (programId: string) => ['programs', programId, 'cohorts'] as const,
  enrollments: ['enrollments'] as const,
  myEnrollments: ['enrollments', 'mine'] as const,
  programRoles: (programId: string) => ['program-roles', programId] as const,
};
```
