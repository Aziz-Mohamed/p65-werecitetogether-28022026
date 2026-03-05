# Data Model: Teacher Availability (Green Dot System)

**Feature**: 004-teacher-availability
**Date**: 2026-03-05

## Entity Relationship

```
profiles (existing)
  |── 1:N ──> teacher_availability (NEW)
  |              └── N:1 ──> programs (existing)
  |
  └── ALTER: +meeting_link, +meeting_platform, +languages
```

## Modified Entity: profiles

**Action**: ALTER TABLE — add 3 nullable columns (Constitution: new columns MUST be nullable)

| Column | Type | Nullable | Default | Constraint | Notes |
|--------|------|----------|---------|------------|-------|
| meeting_link | TEXT | YES | NULL | — | Teacher's external meeting URL |
| meeting_platform | TEXT | YES | NULL | CHECK IN ('google_meet', 'zoom', 'jitsi', 'other') | Platform preference |
| languages | TEXT[] | YES | NULL | — | ISO 639-1 codes (e.g., {"ar","en","ur"}) |

## New Entity: teacher_availability

**Purpose**: Tracks a teacher's real-time online/offline status per program.

| Column | Type | Nullable | Default | Constraint | Notes |
|--------|------|----------|---------|------------|-------|
| id | UUID | NO | gen_random_uuid() | PK | |
| teacher_id | UUID | NO | — | FK profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NO | — | FK programs(id) ON DELETE CASCADE | |
| is_available | BOOLEAN | NO | false | — | Current availability state |
| available_since | TIMESTAMPTZ | YES | NULL | — | Set when going available, NULL when offline |
| max_students | INTEGER | NO | 1 | CHECK (1..10) | Max concurrent students |
| active_student_count | INTEGER | NO | 0 | CHECK (>= 0) | Atomically updated via RPC |
| created_at | TIMESTAMPTZ | NO | now() | — | |
| updated_at | TIMESTAMPTZ | NO | now() | — | |

**Unique constraint**: `(teacher_id, program_id)` — one row per teacher-program pair.

**Indexes**:
- `idx_teacher_availability_available`: `(program_id) WHERE is_available = true` — partial index for fast Available Now queries.
- `idx_teacher_availability_teacher`: `(teacher_id)` — for teacher's own availability lookups.
- `idx_teacher_availability_stale`: `(available_since) WHERE is_available = true` — for pg_cron expiry job.

## State Transitions

```
teacher_availability.is_available:

  false ──[Go Available]──> true
    - Sets available_since = now()
    - Requires meeting_link configured on profile
    - Requires teacher assigned to program via program_roles

  true ──[Go Offline]──> false
    - Sets available_since = NULL
    - Resets active_student_count = 0

  true ──[Timeout (4h)]──> false
    - pg_cron sets is_available = false
    - Clears available_since, resets active_student_count

  true ──[Removed from team]──> false
    - Trigger on program_roles DELETE
    - Same cleanup as Go Offline
```

## RPC Functions

### toggle_availability(p_program_id uuid, p_is_available boolean, p_max_students integer DEFAULT 1)

- UPSERT into `teacher_availability` for `(auth.uid(), p_program_id)`
- If going available: validates teacher has `meeting_link` on profile, validates teacher has role in program via `program_roles`
- If going offline: sets `is_available = false`, clears `available_since`, resets `active_student_count`
- Returns the updated row

### join_teacher_session(p_availability_id uuid)

- SELECT FOR UPDATE on the `teacher_availability` row
- Check `active_student_count < max_students` AND `is_available = true`
- If ok: increment `active_student_count`, return `true`
- If full or offline: return `false`
- Caller: student (validated via RLS — must be enrolled in same program)

*No `leave_teacher_session` RPC* — since students deep-link to external meeting platforms, there is no reliable in-app leave event. The `active_student_count` resets to 0 when the teacher goes offline or availability times out. The teacher can also reset by toggling off and back on.

## Triggers

### on_program_role_delete → clear_teacher_availability()

- AFTER DELETE on `program_roles`
- WHERE `OLD.role = 'teacher'`
- Updates `teacher_availability` SET `is_available = false, available_since = NULL, active_student_count = 0`
  WHERE `teacher_id = OLD.profile_id AND program_id = OLD.program_id`

### set_updated_at on teacher_availability

- BEFORE UPDATE — reuses existing `handle_updated_at()` function

## Cron Job

### expire-stale-availability

- Schedule: `*/15 * * * *` (every 15 minutes)
- Action: `UPDATE teacher_availability SET is_available = false, available_since = NULL, active_student_count = 0 WHERE is_available = true AND available_since < now() - interval '4 hours'`

## RLS Policies

| Policy | Role | Operation | Condition |
|--------|------|-----------|-----------|
| teacher_availability: student read enrolled | student | SELECT | `is_available = true AND program_id = ANY(get_user_programs())` |
| teacher_availability: teacher read own | teacher | SELECT | `teacher_id = auth.uid()` |
| teacher_availability: teacher insert own | teacher | INSERT | `teacher_id = auth.uid()` |
| teacher_availability: teacher update own | teacher | UPDATE | `teacher_id = auth.uid()` |
| teacher_availability: admin read all | master_admin | SELECT | `true` |
| teacher_availability: admin update all | master_admin, program_admin | UPDATE | program_admin scoped to `program_id = ANY(get_user_programs())` |
| teacher_availability: supervisor read assigned | supervisor | SELECT | `program_id = ANY(get_user_programs())` |
| teacher_availability: program_admin read assigned | program_admin | SELECT | `program_id = ANY(get_user_programs())` |

## Realtime

- `ALTER PUBLICATION supabase_realtime ADD TABLE teacher_availability;`
- Event-query-map extension: `teacher_availability` → invalidates `['available-teachers', programId]`
