# Data Model: Programs & Enrollment

**Feature**: 003-programs-enrollment
**Date**: 2026-03-04
**Revised**: 2026-03-04 (post-checklist resolution)

---

## Entity Relationship Diagram (Text)

```
programs 1──* program_tracks
programs 1──* cohorts
programs 1──* enrollments
programs 1──* program_roles

program_tracks 1──* cohorts
program_tracks 1──* enrollments

cohorts 1──* enrollments
cohorts *──1 profiles (teacher)
cohorts *──1 profiles (supervisor)

enrollments *──1 profiles (student)
enrollments *──1 profiles (teacher)

program_roles *──1 profiles (profile_id)
program_roles *──1 profiles (assigned_by)
```

---

## Table: `programs`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| name | text | NO | — | — |
| name_ar | text | NO | — | — |
| description | text | YES | NULL | — |
| description_ar | text | YES | NULL | — |
| category | text | NO | — | CHECK (`free`, `structured`, `mixed`) |
| is_active | boolean | NO | `true` | — |
| settings | jsonb | NO | `'{}'` | — |
| sort_order | integer | NO | `0` | — |
| created_at | timestamptz | NO | `now()` | — |
| updated_at | timestamptz | NO | `now()` | — |

**Foreign Keys**: None (root table).

**Indexes**: `idx_programs_is_active` on `(is_active)`, `idx_programs_sort_order` on `(sort_order)`

**Triggers**: Reuses existing `handle_updated_at()` function from migration 00001 — `CREATE TRIGGER ... BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();`

**RLS Policies**:
- SELECT: All authenticated users can read all programs (app layer filters by `is_active` per constitution — RLS does NOT filter by `is_active`)
- INSERT: `get_user_role() = 'master_admin'`
- UPDATE: `get_user_role() = 'master_admin'` OR (`get_user_role() = 'program_admin'` AND `id = ANY(get_user_programs())`)
- DELETE: None (deactivate only via `is_active`; FR-006 enforced at application layer)

> **CHK017 fix**: UPDATE policy uses `id = ANY(get_user_programs())` (not `program_id` — `programs` table has no `program_id` column; it IS the program).

---

## Table: `program_tracks`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| program_id | uuid | NO | — | FK → `programs(id)` **ON DELETE RESTRICT** |
| name | text | NO | — | — |
| name_ar | text | NO | — | — |
| description | text | YES | NULL | — |
| description_ar | text | YES | NULL | — |
| track_type | text | YES | NULL | CHECK (`free`, `structured`). NULL inherits program category. |
| curriculum | jsonb | YES | NULL | See JSONB Schemas section below |
| sort_order | integer | NO | `0` | — |
| is_active | boolean | NO | `true` | — |
| created_at | timestamptz | NO | `now()` | — |
| updated_at | timestamptz | NO | `now()` | — |

**Foreign Keys**:
| FK | Target | ON DELETE | Rationale |
|----|--------|-----------|-----------|
| `program_id` | `programs(id)` | **RESTRICT** | Prevents deleting programs that have tracks (FR-006). Deactivate instead. |

> **CHK013/CHK014 fix**: Added `track_type` column. For mixed programs (Programs 1 and 5), tracks are individually typed as `free` or `structured`. The `enroll_student()` function uses this to determine enrollment path. NULL means the track inherits the parent program's category.

> **CHK020 fix**: Changed ON DELETE from CASCADE to RESTRICT. CASCADE would silently delete tracks when a program is removed, violating FR-006 (no deletion with active enrollments). RESTRICT forces explicit deactivation workflow.

**Indexes**: `idx_program_tracks_program_id` on `(program_id)`, `idx_program_tracks_sort_order` on `(program_id, sort_order)`

**Triggers**: Reuses existing `handle_updated_at()`.

**RLS Policies**:
- SELECT: All authenticated users can read tracks (join through programs for active filter at app layer)
- INSERT/UPDATE: `get_user_role() = 'master_admin'` OR (`get_user_role() = 'program_admin'` AND `program_id = ANY(get_user_programs())`)
- DELETE: None (deactivate via `is_active`)

---

## Table: `cohorts`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| program_id | uuid | NO | — | FK → `programs(id)` **ON DELETE RESTRICT** |
| track_id | uuid | YES | NULL | FK → `program_tracks(id)` **ON DELETE SET NULL** |
| name | text | NO | — | — |
| status | text | NO | `'enrollment_open'` | CHECK (`enrollment_open`, `enrollment_closed`, `in_progress`, `completed`, `archived`) |
| max_students | integer | NO | `30` | CHECK (`max_students > 0`) |
| teacher_id | uuid | NO | — | FK → `profiles(id)` **ON DELETE RESTRICT** |
| supervisor_id | uuid | YES | NULL | FK → `profiles(id)` **ON DELETE SET NULL** |
| meeting_link | text | YES | NULL | — |
| schedule | jsonb | YES | NULL | See JSONB Schemas section below |
| start_date | date | YES | NULL | — |
| end_date | date | YES | NULL | — |
| created_at | timestamptz | NO | `now()` | — |
| updated_at | timestamptz | NO | `now()` | — |

**Foreign Keys**:
| FK | Target | ON DELETE | Rationale |
|----|--------|-----------|-----------|
| `program_id` | `programs(id)` | **RESTRICT** | Cannot delete program with existing cohorts |
| `track_id` | `program_tracks(id)` | **SET NULL** | Track deactivation doesn't destroy cohorts |
| `teacher_id` | `profiles(id)` | **RESTRICT** | Cannot delete teacher profile while assigned to active cohort. Reassign first. |
| `supervisor_id` | `profiles(id)` | **SET NULL** | Supervisor removal is non-destructive |

> **CHK015 fix**: `teacher_id` uses ON DELETE RESTRICT (not SET NULL). Since `teacher_id` is NOT NULL, SET NULL would cause a constraint violation. RESTRICT prevents deleting a teacher profile while they're assigned to a cohort — admin must reassign the cohort teacher first.

**Indexes**: `idx_cohorts_program_id` on `(program_id)`, `idx_cohorts_track_id` on `(track_id)`, `idx_cohorts_status` on `(status)`, `idx_cohorts_teacher_id` on `(teacher_id)`

**Triggers**: Reuses existing `handle_updated_at()`.

**Enrollment count strategy (CHK008)**: Enrollment count per cohort is derived via query (`SELECT count(*) FROM enrollments WHERE cohort_id = ? AND status IN ('pending', 'active')`), not materialized. At expected scale (tens of cohorts, hundreds of enrollments), a count query with the `idx_enrollments_cohort_id` index is sufficient. If scale increases, a materialized view or trigger-maintained counter can be added later.

**RLS Policies**:
- SELECT: All authenticated users can read cohorts
- INSERT/UPDATE: `get_user_role() IN ('program_admin', 'master_admin')` AND (`program_id = ANY(get_user_programs())` OR `get_user_role() = 'master_admin'`)
- DELETE: None (archive via status)

---

## Table: `enrollments`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| student_id | uuid | NO | — | FK → `profiles(id)` **ON DELETE CASCADE** |
| program_id | uuid | NO | — | FK → `programs(id)` **ON DELETE RESTRICT** |
| track_id | uuid | YES | NULL | FK → `program_tracks(id)` **ON DELETE SET NULL** |
| cohort_id | uuid | YES | NULL | FK → `cohorts(id)` **ON DELETE SET NULL** |
| teacher_id | uuid | YES | NULL | FK → `profiles(id)` **ON DELETE SET NULL** |
| status | text | NO | `'pending'` | CHECK (`pending`, `active`, `completed`, `dropped`, `waitlisted`) |
| enrolled_at | timestamptz | NO | `now()` | — |
| completed_at | timestamptz | YES | NULL | — |
| created_at | timestamptz | NO | `now()` | — |
| updated_at | timestamptz | NO | `now()` | — |

> **CHK009 fix**: Removed `approved` status. It was redundant with `active`. When a program admin approves a pending enrollment, status transitions directly from `pending` → `active`. The lifecycle is now: `pending`, `active`, `completed`, `dropped`, `waitlisted` (5 statuses, not 6).

**Foreign Keys**:
| FK | Target | ON DELETE | Rationale |
|----|--------|-----------|-----------|
| `student_id` | `profiles(id)` | **CASCADE** | Student deletion removes their enrollments |
| `program_id` | `programs(id)` | **RESTRICT** | Cannot delete program with enrollments (FR-006) |
| `track_id` | `program_tracks(id)` | **SET NULL** | Track deactivation preserves enrollment history |
| `cohort_id` | `cohorts(id)` | **SET NULL** | Cohort archival preserves enrollment history |
| `teacher_id` | `profiles(id)` | **SET NULL** | Teacher removal preserves enrollment history |

> **CHK030 fix**: `program_id` uses RESTRICT (not CASCADE). Combined with programs table having no DELETE policy, this means programs can never be deleted if they have any enrollments — enforcing FR-006 at the database level.

**Unique constraint (CHK011, CHK018)**:

Uses a functional unique index with COALESCE to handle nullable columns:
```sql
CREATE UNIQUE INDEX idx_enrollments_unique_student_program
  ON enrollments (
    student_id,
    program_id,
    COALESCE(track_id, '00000000-0000-0000-0000-000000000000'),
    COALESCE(cohort_id, '00000000-0000-0000-0000-000000000000')
  );
```

This approach was chosen over a partial index because:
- PostgreSQL treats `(A, NULL) != (A, NULL)` in regular UNIQUE constraints, allowing unlimited duplicate NULLs
- COALESCE maps all NULLs to a sentinel UUID, making them comparable
- For free programs (track_id=NULL, cohort_id=NULL): allows exactly ONE enrollment per student per program
- For structured programs: allows one enrollment per student per program+track+cohort combination
- Alternative (partial index) would require multiple indexes for different NULL combinations

**Waitlist ordering (CHK029)**: Waitlist position is derived from `enrolled_at` timestamp using insertion order (FIFO): `SELECT count(*) + 1 FROM enrollments WHERE cohort_id = ? AND status = 'waitlisted' AND enrolled_at < target_enrolled_at`. No separate position column needed.

**Indexes**: `idx_enrollments_student_id` on `(student_id)`, `idx_enrollments_program_id` on `(program_id)`, `idx_enrollments_cohort_id` on `(cohort_id)`, `idx_enrollments_status` on `(status)`, plus the unique index above.

**Triggers**: Reuses existing `handle_updated_at()`.

**RLS Policies**:
- SELECT:
  - Students: `student_id = auth.uid()` (own enrollments only)
  - Teachers: `teacher_id = auth.uid()` OR `cohort_id IN (SELECT id FROM cohorts WHERE teacher_id = auth.uid())` (enrollments they teach)
  - Supervisors: `program_id = ANY(get_user_programs())` AND `get_user_role() = 'supervisor'`
  - Program admins: `program_id = ANY(get_user_programs())` AND `get_user_role() = 'program_admin'`
  - Master admin: `get_user_role() = 'master_admin'` (all enrollments)
  - Legacy admin: No access to enrollments (legacy admin role manages school-level data via `app/(admin)/`, not program data)
- INSERT: `student_id = auth.uid()` AND `get_user_role() = 'student'` (students insert own enrollments for free programs; structured enrollment uses `enroll_student()` RPC which bypasses RLS)
- UPDATE:
  - Students: `student_id = auth.uid()` with CHECK `(status = 'dropped')` (can only drop, not promote)
  - Program admins: `program_id = ANY(get_user_programs())` (approve/reject/complete)
  - Master admin: all
- DELETE: None (use `dropped` status)

> **CHK016 fix**: Free-program direct INSERT requires an explicit INSERT policy on enrollments allowing students to insert rows where `student_id = auth.uid()`. The `enroll_student()` RPC (SECURITY DEFINER) bypasses RLS for structured enrollment. Both paths are now documented.

> **CHK031/CHK032 fix**: Added explicit SELECT policies for supervisors and teachers. Teachers see enrollments they teach; supervisors see all enrollments within their assigned programs.

> **CHK036 fix**: Legacy `admin` role has no access to program enrollment data. The admin role continues to manage school-level data via `app/(admin)/` routes.

---

## Table: `program_roles`

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | `gen_random_uuid()` | PRIMARY KEY |
| profile_id | uuid | NO | — | FK → `profiles(id)` **ON DELETE CASCADE** |
| program_id | uuid | NO | — | FK → `programs(id)` **ON DELETE CASCADE** |
| role | text | NO | — | CHECK (`program_admin`, `supervisor`, `teacher`) |
| assigned_by | uuid | YES | NULL | FK → `profiles(id)` **ON DELETE SET NULL** |
| created_at | timestamptz | NO | `now()` | — |

**Foreign Keys**:
| FK | Target | ON DELETE | Rationale |
|----|--------|-----------|-----------|
| `profile_id` | `profiles(id)` | **CASCADE** | User deletion removes their program roles |
| `program_id` | `programs(id)` | **CASCADE** | Program deletion removes role assignments (but programs are protected by RESTRICT from enrollments/cohorts, so this CASCADE can only fire on truly empty programs) |
| `assigned_by` | `profiles(id)` | **SET NULL** | Preserves role assignment if assigner leaves |

**Unique constraint**: `(profile_id, program_id, role)`

**Indexes**: `idx_program_roles_profile_id` on `(profile_id)`, `idx_program_roles_program_id` on `(program_id)`

**RLS Policies**:
- SELECT:
  - Users can read their own roles: `profile_id = auth.uid()`
  - Program admins read roles within their programs: `program_id = ANY(get_user_programs())` AND `get_user_role() = 'program_admin'`
  - Master admin reads all: `get_user_role() = 'master_admin'`
- INSERT:
  - Program admins can assign `teacher` and `supervisor` roles within their programs: `get_user_role() = 'program_admin'` AND `program_id = ANY(get_user_programs())` AND `role IN ('teacher', 'supervisor')` AND `profile_id != auth.uid()` (cannot self-assign)
  - Master admin can assign all roles: `get_user_role() = 'master_admin'`
- DELETE:
  - Same as INSERT (program admins manage teacher/supervisor, master admin manages all)
- UPDATE: None (delete and recreate)

> **CHK035 fix**: INSERT policy includes `profile_id != auth.uid()` to prevent program admins from self-assigning to additional programs. Only master_admin can assign program_admin roles.

---

## Helper Functions

### `get_user_programs()`

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

> **CHK012 fix**: For users with NO program associations (new users, or master_admin relying on role-based bypass), `get_user_programs()` returns an empty array `'{}'::uuid[]` via COALESCE. This is intentional — master_admin access is granted via `get_user_role() = 'master_admin'` checks in RLS policies, NOT via `get_user_programs()`. New students with no enrollments correctly see no program-scoped data until they enroll.

> **CHK033 security note**: `SECURITY DEFINER` runs as the function owner (postgres), bypassing RLS on the `program_roles` and `enrollments` tables to read program associations. This is safe because: (1) the function only returns program_id values, not row data; (2) it filters strictly by `auth.uid()`, so a user can only see their own associations; (3) the function is STABLE (read-only). A malicious user cannot exploit it to read other users' data or escalate access.

### `enroll_student()`

```sql
CREATE OR REPLACE FUNCTION enroll_student(
  p_program_id uuid,
  p_track_id uuid DEFAULT NULL,
  p_cohort_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_enrollment_id uuid;
  v_program programs;
  v_cohort cohorts;
  v_track program_tracks;
  v_current_count integer;
  v_status text;
  v_effective_type text;
BEGIN
  -- CHK025: Validate caller is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- CHK034: Validate caller has student role
  IF (SELECT role FROM profiles WHERE id = auth.uid()) != 'student' THEN
    RAISE EXCEPTION 'Only students can enroll';
  END IF;

  -- Get program
  SELECT * INTO v_program FROM programs WHERE id = p_program_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ENROLL_PROGRAM_NOT_FOUND';
  END IF;

  -- CHK013/CHK014: Determine effective enrollment type
  -- For mixed programs, check track_type; for pure free/structured, use program category
  IF v_program.category = 'mixed' AND p_track_id IS NOT NULL THEN
    SELECT * INTO v_track FROM program_tracks WHERE id = p_track_id AND is_active;
    IF NOT FOUND THEN RAISE EXCEPTION 'ENROLL_TRACK_NOT_FOUND'; END IF;
    v_effective_type := COALESCE(v_track.track_type, 'free');
  ELSIF v_program.category = 'mixed' AND p_track_id IS NULL THEN
    v_effective_type := 'free';  -- No track in mixed program defaults to free
  ELSE
    v_effective_type := v_program.category;  -- 'free' or 'structured'
  END IF;

  -- Free enrollment path: direct active enrollment
  IF v_effective_type = 'free' THEN
    INSERT INTO enrollments (student_id, program_id, track_id, status)
    VALUES (auth.uid(), p_program_id, p_track_id, 'active')
    RETURNING id INTO v_enrollment_id;
    RETURN v_enrollment_id;
  END IF;

  -- Structured enrollment path: require cohort
  IF p_cohort_id IS NULL THEN
    RAISE EXCEPTION 'ENROLL_COHORT_REQUIRED';
  END IF;

  -- Lock and check cohort
  SELECT * INTO v_cohort FROM cohorts WHERE id = p_cohort_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ENROLL_COHORT_NOT_FOUND'; END IF;
  IF v_cohort.status != 'enrollment_open' THEN
    RAISE EXCEPTION 'ENROLL_COHORT_CLOSED';
  END IF;

  -- Check capacity (CHK019: count pending + active as capacity-consuming)
  SELECT count(*) INTO v_current_count
  FROM enrollments
  WHERE cohort_id = p_cohort_id AND status IN ('pending', 'active');

  IF v_current_count >= v_cohort.max_students THEN
    v_status := 'waitlisted';
  ELSIF (v_program.settings->>'auto_approve')::boolean IS TRUE THEN
    v_status := 'active';
  ELSE
    v_status := 'pending';
  END IF;

  INSERT INTO enrollments (student_id, program_id, track_id, cohort_id, teacher_id, status)
  VALUES (auth.uid(), p_program_id, p_track_id, p_cohort_id, v_cohort.teacher_id, v_status)
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$$;
```

> **CHK028 fix**: Error messages use structured error codes (`ENROLL_PROGRAM_NOT_FOUND`, `ENROLL_COHORT_REQUIRED`, etc.) rather than user-facing strings. The application layer maps these codes to localized i18n messages. PostgreSQL duplicate-key violations (23505) are caught at the service layer and mapped to a user-friendly "already enrolled" message.

---

## State Transitions

### Enrollment Status Lifecycle

> **CHK009 fix**: Removed `approved` status. Approval transitions directly to `active`.

```
[new enrollment]
    │
    ├── free / mixed-free track ──→ active ──→ dropped
    │                                 │
    │                                 └──→ completed
    │
    └── structured / mixed-structured track
          │
          ├── (has capacity + auto_approve) ──→ active ──→ completed
          │                                       │
          │                                       └──→ dropped
          │
          ├── (has capacity + manual) ──→ pending ──→ active ──→ completed
          │                                  │          │
          │                                  │          └──→ dropped
          │                                  └──→ dropped (rejected by admin)
          │
          └── (no capacity) ──→ waitlisted ──→ pending ──→ active
                                    │
                                    └──→ dropped (student withdraws)
```

### Cohort Status Lifecycle

```
enrollment_open ──→ enrollment_closed ──→ in_progress ──→ completed ──→ archived
```

No backward transitions. When status changes to `in_progress`:
- All `pending` enrollments are bulk-updated to `active` (auto-approved for cohort start)
- Waitlisted students remain `waitlisted` (they are NOT auto-promoted — promotion is manual per admin decision or handled by spec 006-ratings-queue)

---

## JSONB Schemas

### `programs.settings`

```typescript
interface ProgramSettings {
  max_students_per_teacher?: number;  // default: 10
  auto_approve?: boolean;             // default: false
  session_duration_minutes?: number;  // default: 30
}
```

**Seeded defaults** for all 8 programs:
```json
{
  "max_students_per_teacher": 10,
  "auto_approve": false,
  "session_duration_minutes": 30
}
```

Access pattern: `(program.settings->>'auto_approve')::boolean`. Missing keys default to `false`/`NULL` — application code uses `?? defaultValue` pattern.

### `program_tracks.curriculum`

```typescript
interface TrackCurriculum {
  units?: Array<{
    name: string;
    name_ar: string;
    description?: string;
  }>;
  total_duration_weeks?: number;
  reference_text?: string;       // e.g., "متن تحفة الأطفال"
  reference_text_ar?: string;
}
```

Curriculum is optional and informational — used for display on track detail screens. Not enforced at the database level. Seeded programs will have `curriculum: null` initially; admins can populate later.

### `cohorts.schedule`

```typescript
interface CohortScheduleEntry {
  day: number;      // 0=Sunday, 1=Monday, ..., 6=Saturday
  start: string;    // "HH:mm" format (24h), e.g., "18:00"
  end: string;      // "HH:mm" format (24h), e.g., "19:00"
}
// Full schedule: CohortScheduleEntry[]
```

Example: `[{"day": 0, "start": "18:00", "end": "19:00"}, {"day": 3, "start": "18:00", "end": "19:00"}]` = Sunday and Wednesday 6-7 PM.

Schedule is informational for this spec — actual session scheduling logic is deferred to spec 005-session-evolution.

---

## Seed Data Summary

8 programs, 25 tracks total:

| # | Program | Category | Tracks | Default Settings |
|---|---------|----------|--------|-----------------|
| 1 | تسميع بالتناوب | mixed | 3 (حلقات مع معلمين مجازين [free], تسميع قرآن [free], تسميع متون [free]) | `auto_approve: false` |
| 2 | برنامج الأطفال | structured | 3 (التلقين, القاعدة النورانية, مسار الحفظ) | `auto_approve: false` |
| 3 | برنامج الأعاجم | free | 0 | `auto_approve: true` (free, no approval needed) |
| 4 | برنامج القراءات | structured | 3 (حفص عن عاصم, ورش عن نافع, قالون عن نافع) | `auto_approve: false` |
| 5 | برنامج المتون | mixed | 4 (قسم حر [free], تحفة الأطفال [structured], الجزرية [structured], الشاطبية [structured]) | `auto_approve: false` |
| 6 | برنامج اللغة العربية | structured | 2 (الآجرومية, قطر الندى) | `auto_approve: false` |
| 7 | برنامج حفظ القرآن الكريم | structured | 5 (متين 10, متين 15, متين 30, ثبتها, الإتقان) | `auto_approve: false` |
| 8 | برنامج همم القرآني | structured | 5 (3 أجزاء, 5 أجزاء, 10 أجزاء, 15 جزء, 30 جزء) | `auto_approve: false` |

> Tracks for mixed programs (1 and 5) include explicit `track_type` values (`free` or `structured`). All other programs' tracks inherit from their parent program category (track_type = NULL).

---

## Cross-Spec Dependency Contracts

### For spec 004-teacher-availability
- `programs.id` is the FK target for `teacher_availability.program_id`
- `program_roles` (role = 'teacher') determines which teachers can set availability per program

### For spec 005-session-evolution
- `programs.id` is the FK target for nullable `program_id` columns on `sessions`, `recitations`, `memorization_progress`, `memorization_assignments`
- `cohorts.schedule` JSONB structure is defined above — session scheduling will read this but manage its own `session_schedules` table
- `cohorts.meeting_link` is the fallback meeting link when the teacher's profile `meeting_link` is not set

### For spec 006-ratings-queue
- `enrollments` table determines student-teacher program relationships for rating eligibility: `enrollments.teacher_id` + `enrollments.program_id` + `enrollments.status = 'active'`
- Waitlist promotion (waitlisted → pending/active) is managed by spec 006, not this spec

### For spec 007-admin-roles
- `program_roles` is the primary source for supervisor → teacher → student query paths
- Query path: `program_roles(role='supervisor') → program_roles(role='teacher', same program_id) → enrollments(teacher_id) → student profiles`

### For spec 008-certifications
- `programs.id` and `program_tracks.id` are FK targets for `certifications.program_id` and `certifications.track_id`
- Certification eligibility is determined by enrollment status = `completed`
