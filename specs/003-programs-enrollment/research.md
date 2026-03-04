# Research: Programs & Enrollment

**Feature**: 003-programs-enrollment
**Date**: 2026-03-04

---

## R-001: Student Tab Bar Integration

**Decision**: Add "Programs" as a 6th tab in the student bottom tab bar.

**Rationale**: The existing student tab bar has 5 tabs (Dashboard, Memorization, Revision, Journey, Profile) using a custom `CustomTabBar` component with Ionicons. Programs is a top-level navigation concern (clarification Q3). Adding it as a tab between Dashboard and Memorization maintains logical flow — students land on Dashboard then browse programs.

**Alternatives considered**:
- Dashboard card → rejected (less discoverable for primary platform concept)
- Replace Journey tab → rejected (Journey tracks existing memorization progress, still needed)

**Implementation**: Add `<Tabs.Screen name="programs" />` in `app/(student)/(tabs)/_layout.tsx` with `library-outline`/`library` Ionicons. Create `app/(student)/(tabs)/programs.tsx` screen file. Add `student.tabs.programs` i18n key.

---

## R-002: Supabase Service Pattern

**Decision**: Follow existing service class pattern — singleton class with methods returning Supabase query objects or `{ data, error }` tuples.

**Rationale**: Project uses two service patterns: (1) raw Supabase query returns (students.service.ts, sessions.service.ts) for simple queries, (2) `{ data, error }` wrapping for complex operations (auth.service.ts). Programs service will use pattern (1) for reads and pattern (2) for mutations.

**Alternatives considered**:
- AuthResult<T> pattern for everything → rejected (overkill for simple CRUD reads)
- Direct Supabase calls in hooks → rejected (violates constitution IV, service layer required)

**Implementation**: Create `src/features/programs/services/programs.service.ts` with `ProgramsService` class. Methods: `getPrograms()`, `getProgram(id)`, `getTracks(programId)`, `getCohorts(filters)`, `getEnrollments(studentId)`, `enroll(input)`, `leaveProgram(enrollmentId)`, admin CRUD methods.

---

## R-003: RLS Strategy for Program Scoping

**Decision**: Create `get_user_programs()` SQL function returning `uuid[]` of program IDs the authenticated user has access to. Use this in RLS policies for all 5 new tables.

**Rationale**: Constitution I requires program-scoping via `get_user_programs()`. The function checks: (1) `program_roles` table for teachers/supervisors/program_admins, (2) `enrollments` table for students. Master admins bypass via `get_user_role() = 'master_admin'`.

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION get_user_programs()
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT program_id),
    '{}'::uuid[]
  )
  FROM (
    SELECT program_id FROM program_roles WHERE profile_id = auth.uid()
    UNION
    SELECT program_id FROM enrollments WHERE student_id = auth.uid()
  ) sub
$$;
```

RLS pattern for reads: `USING (program_id = ANY(get_user_programs()) OR get_user_role() = 'master_admin')`

---

## R-004: Concurrent Enrollment Safety

**Decision**: Use database-level UNIQUE constraint + transaction isolation for concurrent enrollment safety.

**Rationale**: Spec edge case requires that when two students compete for the last cohort spot, only one succeeds. The UNIQUE constraint on `(student_id, program_id, track_id, cohort_id)` prevents duplicates. For capacity enforcement, an enrollment function will check `count(*) < max_students` within a single transaction, using `FOR UPDATE` on the cohort row to serialize concurrent attempts.

**Alternatives considered**:
- Application-level locking → rejected (race conditions across multiple app instances)
- Optimistic locking with version column → rejected (overengineered for expected scale)

**Implementation**: Create an `enroll_student()` RPC function that atomically checks capacity and inserts enrollment within a transaction.

---

## R-005: Program Settings JSONB Schema

**Decision**: Store program settings as JSONB with defined defaults. TypeScript interface mirrors the JSON structure.

**Rationale**: Spec assumes JSONB for flexible per-program config. Initial keys: `max_students_per_teacher` (number), `auto_approve` (boolean), `session_duration_minutes` (number). PRD also defines capacity and ratings settings but those belong to specs 004/006.

**Implementation**:
```typescript
interface ProgramSettings {
  max_students_per_teacher?: number;  // default 10
  auto_approve?: boolean;             // default false
  session_duration_minutes?: number;  // default 30
}
```

Access via `(program.settings as ProgramSettings)?.auto_approve ?? false`.

---

## R-006: Seed Data Strategy

**Decision**: Seed 8 programs + ~25 tracks in migration `00005_programs_enrollment.sql` using INSERT with deterministic UUIDs generated via `gen_random_uuid()`.

**Rationale**: FR-029 requires migration-based seeding. Using `ON CONFLICT DO NOTHING` for idempotency (matches existing pattern from stickers seed in 00001).

**Alternatives considered**:
- Edge function seed → rejected (migration is more reliable, runs once)
- App-level seed on first launch → rejected (race conditions, not testable)

**Implementation**: Assign sort_order 1-8 matching PRD program numbering. Track sort_order within each program starts at 1. Include bilingual names and descriptions from PRD Section 3.

---

## R-007: Enrollment RPC vs Direct Insert

**Decision**: Use a Supabase RPC function `enroll_student()` for structured enrollment. Use direct INSERT for free program joins.

**Rationale**: Structured enrollment requires atomically: (1) check cohort status is `enrollment_open`, (2) check capacity, (3) check auto_approve setting, (4) insert enrollment with correct status. This is too complex for client-side logic with RLS — a SECURITY DEFINER function ensures atomicity and bypasses RLS for the capacity check.

Free program joins are simple direct inserts (always `active`, no cohort/capacity logic).

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION enroll_student(
  p_program_id uuid,
  p_track_id uuid DEFAULT NULL,
  p_cohort_id uuid DEFAULT NULL
) RETURNS enrollments ...
```

Returns the created enrollment row. Raises exception on: duplicate, full cohort, no open cohort.

---

## R-008: Admin Route Group Strategy

**Decision**: Program admin screens go in `app/(program-admin)/programs/`. Master admin screens go in `app/(master-admin)/programs/`. Both extend existing minimal layouts.

**Rationale**: Constitution II and development workflow specify role-based route groups. Both `(program-admin)` and `(master-admin)` layouts already exist (minimal, with just index screen). We add program management routes under each.

Program admins see only their assigned programs (filtered by `program_roles`). Master admins see all programs. Shared components live in `src/features/programs/components/`.

---

## R-009: Locale Fallback for Bilingual Content

**Decision**: Use a `useLocalizedField()` hook that returns `name` or `name_ar` based on locale, falling back to the other language if the preferred one is empty.

**Rationale**: Edge case requires Arabic fallback when English is missing. The project already has `useLocalizedName()` in the codebase for similar patterns.

**Implementation**:
```typescript
function useLocalizedField(en: string | null, ar: string | null): string {
  const { i18n } = useTranslation();
  const preferred = i18n.language === 'ar' ? ar : en;
  const fallback = i18n.language === 'ar' ? en : ar;
  return preferred || fallback || '';
}
```
