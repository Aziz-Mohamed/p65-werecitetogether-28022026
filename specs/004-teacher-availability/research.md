# Research: Teacher Availability (Green Dot System)

**Feature**: 004-teacher-availability
**Date**: 2026-03-05

## R-001: Profile Extensions (meeting_link, meeting_platform, languages)

**Decision**: Add 3 nullable columns to the existing `profiles` table via ALTER TABLE.

**Rationale**: The `profiles` table (defined in `00001_consolidated_schema.sql:50`) already has `bio` added by `00004_auth_evolution.sql:20`. Following the same pattern, we add `meeting_link TEXT`, `meeting_platform TEXT`, and `languages TEXT[]` as nullable columns. Constitution Principle I mandates "New columns on existing tables MUST be NULLABLE."

**Alternatives considered**:
- Separate `teacher_profiles` table: Rejected — adds unnecessary join for a handful of columns; the profiles table is the canonical single-row-per-user table.
- JSONB column for extensions: Rejected — loses type safety and makes RLS/CHECK constraints harder.

## R-002: teacher_availability Table Design

**Decision**: New `teacher_availability` table with composite unique on `(teacher_id, program_id)`.

**Rationale**: Each teacher can be available for multiple programs simultaneously (clarification session answer). A single row per teacher-program pair tracks availability state. The `active_student_count` counter column is updated atomically via RPC (clarification session answer). Using UPSERT on toggle avoids needing to check existence.

**Schema**:
- `id UUID PK`
- `teacher_id UUID FK profiles(id) ON DELETE CASCADE`
- `program_id UUID FK programs(id) ON DELETE CASCADE`
- `is_available BOOLEAN NOT NULL DEFAULT false`
- `available_since TIMESTAMPTZ` (set when going available, null when offline)
- `max_students INTEGER NOT NULL DEFAULT 1 CHECK (1..10)`
- `active_student_count INTEGER NOT NULL DEFAULT 0 CHECK (>= 0)`
- `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
- UNIQUE `(teacher_id, program_id)`

**Alternatives considered**:
- Separate `active_sessions` join table instead of counter: Rejected (clarification session) — counter is simpler for this use case where we don't need to track individual student sessions.
- Single row per teacher (JSONB array of programs): Rejected — makes RLS program-scoping impossible.

## R-003: Stale Availability Timeout via pg_cron

**Decision**: `pg_cron` scheduled job running every 15 minutes.

**Rationale**: The codebase already uses `pg_cron` (extension created in `00001_consolidated_schema.sql:15`, jobs defined in archived `00006_notification_cron_jobs.sql`). A SQL-only cron job is simpler than an Edge Function for a straightforward UPDATE query. No client cooperation needed.

**Implementation**:
```sql
SELECT cron.schedule(
  'expire-stale-availability',
  '*/15 * * * *',
  $$UPDATE teacher_availability
    SET is_available = false, available_since = NULL, active_student_count = 0
    WHERE is_available = true
      AND available_since < now() - interval '4 hours'$$
);
```

**Alternatives considered**:
- Client-side check on query: Rejected — unreliable, requires all clients to filter.
- Edge Function cron: Rejected — adds unnecessary network hop and deploy complexity for a simple SQL UPDATE.

## R-004: RLS Policy Design

**Decision**: Program-enrollment-scoped read access for students, role-based write access for teachers.

**Rationale**: Clarification session confirmed only enrolled students should see available teachers for their program. The existing `get_user_programs()` function (00005:124-139) returns program IDs from both `program_roles` and `enrollments`, making it suitable for both teacher and student access checks.

**Policies**:
1. **SELECT (students)**: `is_available = true AND program_id = ANY(get_user_programs())`
2. **SELECT (teachers)**: `teacher_id = auth.uid()` (own rows only)
3. **INSERT/UPDATE (teachers)**: `teacher_id = auth.uid()` (own rows only, role check)
4. **SELECT/ALL (master_admin)**: Full access

## R-005: Realtime Subscription Pattern

**Decision**: Publish `teacher_availability` to `supabase_realtime` and extend the existing realtime subscription system.

**Rationale**: The codebase has a mature realtime system (`src/features/realtime/`) with `useRealtimeSubscription` hook, debounced invalidation, and an event-query-map. We extend `event-query-map.ts` with a `teacher_availability` case that invalidates `['available-teachers']` query keys.

**Pattern**: `ALTER PUBLICATION supabase_realtime ADD TABLE teacher_availability;` (same as 00001 and 00005 patterns).

## R-006: Atomic Student Count RPC

**Decision**: One Supabase RPC function: `join_teacher_session` (increment only). No `leave_teacher_session` — counter resets on offline/timeout.

**Rationale**: Since students deep-link to external meeting platforms (Google Meet, Zoom, etc.), there is no reliable in-app "leave" event. The counter represents "join slots used since going available." It resets to 0 when the teacher goes offline or when the 4-hour timeout fires. The teacher can also reset by toggling off and back on. This avoids counter drift from unreliable decrement calls.

**Implementation sketch**:
```sql
CREATE FUNCTION join_teacher_session(p_availability_id uuid)
RETURNS boolean
-- SELECT FOR UPDATE on the row, check active_student_count < max_students
-- AND is_available = true, increment if ok, return true; else return false.
```

## R-007: Meeting Link Validation

**Decision**: Basic `https://` prefix validation only — no platform-specific URL patterns.

**Rationale**: Clarification session confirmed. Validated client-side via zod schema (`z.string().url().startsWith('https://')`) and server-side via CHECK constraint or RLS.

## R-008: Auto-Remove Availability on Team Removal

**Decision**: Database trigger on `program_roles` DELETE that sets `is_available = false` for the removed teacher.

**Rationale**: FR-014 requires automatic removal. A trigger is the most reliable approach — it fires regardless of which client removes the role. The trigger fires AFTER DELETE on `program_roles` and updates the matching `teacher_availability` row.
