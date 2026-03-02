# Data Model: WeReciteTogether Core Platform

**Date**: 2026-02-28
**Feature**: 001-platform-core

## Entity Relationship Overview

```text
platform_config (single row)

profiles (1) ──── (*) program_roles (junction)
    │                      │
    │                      └──── (*) programs (1)
    │                                   │
    │                                   ├──── (*) program_tracks
    │                                   │          │
    │                                   │          └──── (*) cohorts
    │                                   │                    │
    │                                   │                    └──── (*) enrollments
    │                                   │                    └──── (*) session_schedules
    │                                   │
    │                                   ├──── (*) teacher_availability
    │                                   ├──── (*) free_program_queue
    │                                   ├──── (*) program_waitlist
    │                                   └──── (*) daily_session_count
    │
    ├──── (*) sessions (teacher)
    │          ├──── (*) session_attendance (student)
    │          ├──── (*) session_voice_memos
    │          └──── (*) teacher_reviews
    │
    └──── (*) teacher_rating_stats (per teacher per program)
```

## Tables

### profiles

Extends `auth.users`. Single entity for all roles.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, FK → auth.users(id) ON DELETE CASCADE | |
| role | TEXT | NOT NULL, CHECK (IN student/teacher/supervisor/program_admin/master_admin) | Global role |
| full_name | TEXT | NOT NULL | Collected at onboarding |
| display_name | TEXT | | Optional public name |
| username | TEXT | UNIQUE | |
| avatar_url | TEXT | | From OAuth provider or uploaded |
| email | TEXT | | From OAuth provider |
| phone | TEXT | | Optional |
| gender | TEXT | CHECK (IN male/female) | Collected at onboarding |
| age_range | TEXT | CHECK (IN under_13/13_17/18_25/26_35/36_50/50_plus) | Collected at onboarding |
| country | TEXT | NOT NULL | ISO 3166-1 alpha-2 code |
| region | TEXT | | Province/state, optional |
| meeting_link | TEXT | | Teacher's default meeting URL |
| meeting_platform | TEXT | CHECK (IN google_meet/zoom/jitsi/other) | |
| bio | TEXT | | Teacher bio shown to students |
| languages | TEXT[] | | Languages spoken |
| onboarding_completed | BOOLEAN | NOT NULL DEFAULT false | |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

**Age range mapping** (CHK014): Values map to spec onboarding options: `under_13` → "Under 13", `13_17` → "13-17", `18_25` → "18-25", `26_35` → "26-35", `36_50` → "36-50", `50_plus` → "50+". Underscores replace hyphens for valid CHECK constraint identifiers.

**Languages format** (CHK039): ISO 639-1 two-letter codes (e.g., `'ar'`, `'en'`, `'fr'`, `'ur'`, `'ms'`). App layer presents human-readable names. Array may contain 1-5 values.

**Meeting platform** (CHK040): The `'other'` option is the catch-all for platforms not explicitly listed. If a new platform becomes popular, it can be added to the CHECK constraint via migration. The `meeting_link` field accepts any valid URL regardless of platform selection.

### programs

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| name | TEXT | NOT NULL | English name |
| name_ar | TEXT | NOT NULL | Arabic name |
| description | TEXT | | |
| description_ar | TEXT | | |
| category | TEXT | NOT NULL, CHECK (IN free/structured/mixed) | |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| settings | JSONB | NOT NULL DEFAULT '{}' | Capacity, rating thresholds, session limits |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

**Settings JSONB schema** (CHK004):
```json
{
  "max_students_per_teacher": 10,
  "max_daily_free_sessions": 2,
  "queue_expiry_minutes": 120,
  "waitlist_offer_hours": 24,
  "notify_teachers_queue_threshold": 5,
  "enrollment_auto_approve": false,
  "min_reviews_for_display": 5,
  "good_standing_threshold": 4.0,
  "warning_threshold": 3.5,
  "concern_threshold": 3.0,
  "review_window_hours": 48
}
```

### program_tracks

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| name | TEXT | NOT NULL | |
| name_ar | TEXT | NOT NULL | |
| description | TEXT | | |
| description_ar | TEXT | | |
| track_type | TEXT | CHECK (IN free/structured) | For mixed programs |
| curriculum | JSONB | | Structured curriculum definition |
| sort_order | INT | NOT NULL DEFAULT 0 | |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Curriculum JSONB schema** (CHK008):
```json
{
  "levels": [
    {
      "name": "المستوى الأول",
      "name_en": "Level 1",
      "description": "Juz 30 memorization",
      "sort_order": 1,
      "modules": [
        {
          "name": "سورة الناس - سورة الضحى",
          "surah_range": [114, 93],
          "estimated_weeks": 12
        }
      ]
    }
  ]
}
```

`curriculum` is NULL for free tracks (no structured progression). For structured tracks, it defines the ordered levels and modules that students work through.

### program_roles

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| role | TEXT | NOT NULL, CHECK (IN program_admin/supervisor/teacher) | |
| assigned_by | UUID | FK → profiles(id) ON DELETE SET NULL | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(profile_id, program_id, role) | |

### cohorts

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| track_id | UUID | FK → program_tracks(id) ON DELETE SET NULL | |
| name | TEXT | NOT NULL | e.g., "الدفعة الأولى" |
| status | TEXT | NOT NULL, CHECK (IN enrollment_open/enrollment_closed/in_progress/completed/archived) | |
| max_students | INT | NOT NULL DEFAULT 30, CHECK (> 0) | |
| teacher_id | UUID | FK → profiles(id) ON DELETE SET NULL | Primary/assigned teacher |
| supervisor_id | UUID | FK → profiles(id) ON DELETE SET NULL | |
| meeting_link | TEXT | | Override teacher default |
| schedule | JSONB | | Recurring session times |
| start_date | DATE | | |
| end_date | DATE | | Nullable for ongoing |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

**Teacher assignment** (CHK020): `teacher_id` represents the **primary/assigned teacher** for administrative purposes (scheduling, roster, supervisor assignment). Individual sessions within a cohort may be conducted by a substitute teacher — `sessions.teacher_id` records the actual session teacher. The cohort-level `teacher_id` is for planning and accountability, not a constraint on who can teach sessions.

**Schedule JSONB schema** (CHK007):
```json
{
  "slots": [
    {
      "day_of_week": 0,
      "start_time": "09:00",
      "end_time": "10:00",
      "timezone": "Asia/Riyadh"
    }
  ]
}
```

`day_of_week`: 0 = Sunday, 6 = Saturday. Times in 24-hour format. `timezone` is IANA timezone identifier. Multiple slots allow multi-day-per-week cohort schedules. This JSONB supplements the `session_schedules` table — `schedule` provides a quick-read summary while `session_schedules` rows are the authoritative source for session generation.

### enrollments

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| track_id | UUID | FK → program_tracks(id) ON DELETE SET NULL | |
| cohort_id | UUID | FK → cohorts(id) ON DELETE SET NULL | Nullable for non-cohort |
| teacher_id | UUID | FK → profiles(id) ON DELETE SET NULL | Nullable for free |
| status | TEXT | NOT NULL, CHECK (IN pending/approved/active/completed/dropped/waitlisted) | |
| enrolled_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| completed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

**Uniqueness constraint** (CHK017): Uses a **partial unique index** instead of a full UNIQUE constraint, to allow dropped students to re-enroll:

```sql
CREATE UNIQUE INDEX idx_enrollments_active_unique
  ON enrollments (student_id, program_id, track_id, cohort_id)
  WHERE status NOT IN ('dropped', 'completed');
```

This prevents duplicate active enrollments while allowing a student who dropped or completed to create a new enrollment row.

### teacher_availability

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| teacher_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| is_available | BOOLEAN | NOT NULL DEFAULT false | |
| available_since | TIMESTAMPTZ | | Set when toggled on |
| max_concurrent_students | INT | NOT NULL DEFAULT 1, CHECK (> 0) | |
| current_session_count | INT | NOT NULL DEFAULT 0, CHECK (>= 0) | Active draft sessions |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(teacher_id, program_id) | |

**Session count mechanism** (CHK018): `current_session_count` is incremented when a draft session is created linking this teacher, and decremented when a session transitions from `draft → completed` or `draft → cancelled`. Enforced via application-layer service (not DB trigger) to maintain transactional consistency with session creation/update. Teacher appears as "available" when `is_available = true AND current_session_count < max_concurrent_students`.

### sessions

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| teacher_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| cohort_id | UUID | FK → cohorts(id) ON DELETE SET NULL | For structured sessions |
| status | TEXT | NOT NULL DEFAULT 'draft', CHECK (IN draft/completed/cancelled) | |
| meeting_link_used | TEXT | | The link that was opened |
| started_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | When student joined |
| completed_at | TIMESTAMPTZ | | When teacher logged outcome |
| duration_minutes | INT | CHECK (> 0) | |
| notes | TEXT | | Teacher notes |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

**No direct student FK** (CHK015): The `sessions` table intentionally lacks a `student_id` column. A session is a **teacher-led event** that can have one or more student attendees via `session_attendance`. For 1:1 free-program sessions, there is exactly one `session_attendance` row. For group cohort sessions, there are multiple. This satisfies FR-028 ("links the student, teacher, and program") — the student link is `sessions → session_attendance → profiles`.

### session_attendance

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| session_id | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| score | INT | CHECK (BETWEEN 0 AND 5) | Nullable |
| notes | TEXT | | Per-student notes |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(session_id, student_id) | |

**Score semantics** (CHK011): `NULL` = not yet scored. `0` = attended but not evaluated (e.g., discussion session, not a recitation). `1-5` = pedagogical recitation quality score. App layer treats `NULL` and `0` differently in aggregation: `NULL` is excluded from averages, `0` counts as an attended session without a score.

### session_voice_memos

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| session_id | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | |
| teacher_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| storage_path | TEXT | NOT NULL | Path in Supabase Storage |
| duration_seconds | INT | NOT NULL, CHECK (BETWEEN 1 AND 120) | |
| file_size_bytes | INT | NOT NULL | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| expires_at | TIMESTAMPTZ | NOT NULL | 30 days from creation |
| | | UNIQUE(session_id, student_id) | One memo per student per session |

**Expiry enforcement** (CHK026): `expires_at` is set to `now() + interval '30 days'` at INSERT time by the application layer. Cleanup is performed by the `cleanup-voice-memos` Edge Function running as a daily cron — queries `expires_at < now()`, deletes files from Supabase Storage bucket, then deletes the DB rows.

### teacher_reviews

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| teacher_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| session_id | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| rating | INT | NOT NULL, CHECK (BETWEEN 1 AND 5) | |
| tags | TEXT[] | | Selected feedback tags |
| comment | TEXT | | Max 500 chars (app-enforced) |
| is_flagged | BOOLEAN | NOT NULL DEFAULT false | Auto-flag if rating <= 2 |
| is_excluded | BOOLEAN | NOT NULL DEFAULT false | Supervisor excluded |
| excluded_by | UUID | FK → profiles(id) ON DELETE SET NULL | |
| exclusion_reason | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(student_id, session_id) | One review per session |

**Predefined tag options** (CHK010):
- **Positive**: `patient`, `clear_explanation`, `encouraging`, `well_prepared`, `good_tajweed`, `good_pace`
- **Constructive**: `too_fast`, `too_slow`, `unclear_explanation`, `not_patient`, `unprepared`, `poor_audio`

Tags are stored as a TEXT array. The app layer presents the predefined options; custom tags are not supported. The predefined set can be extended via app update (no migration needed since tags are free-text in the array).

**48-hour rating window** (CHK029): Application-layer enforcement. The service validates `session.completed_at + interval '48 hours' > now()` before accepting a review submission. The rating UI is hidden client-side after 48 hours. No DB constraint — allows admin override if needed.

### teacher_rating_stats

Materialized aggregate — updated via trigger on teacher_reviews.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| teacher_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| total_reviews | INT | NOT NULL DEFAULT 0 | |
| average_rating | NUMERIC(3,2) | NOT NULL DEFAULT 0.00 | |
| rating_1_count | INT | NOT NULL DEFAULT 0 | |
| rating_2_count | INT | NOT NULL DEFAULT 0 | |
| rating_3_count | INT | NOT NULL DEFAULT 0 | |
| rating_4_count | INT | NOT NULL DEFAULT 0 | |
| rating_5_count | INT | NOT NULL DEFAULT 0 | |
| common_positive_tags | TEXT[] | | Top 3 by frequency |
| common_constructive_tags | TEXT[] | | Top 3 by frequency |
| last_updated | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | PK(teacher_id, program_id) | Composite PK |

**Tag computation rule** (CHK042): "Top 3" is determined by frequency count across all non-excluded reviews for the `(teacher_id, program_id)` pair. Ties are broken by most recent occurrence (`MAX(created_at)` for reviews containing the tag). Computed by the application layer (Edge Function or service call) after the trigger recalculates numeric stats — the trigger itself does not populate tag arrays due to the complexity of array unnesting and ranking in PL/pgSQL.

### free_program_queue

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| position | INT | NOT NULL | |
| joined_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| notified_at | TIMESTAMPTZ | | When notification sent |
| status | TEXT | NOT NULL, CHECK (IN waiting/notified/claimed/expired/cancelled) | |
| expires_at | TIMESTAMPTZ | NOT NULL | 2 hours from join |
| | | UNIQUE(student_id, program_id) WHERE status IN ('waiting', 'notified') | One active entry per student/program |

**Position ordering** (CHK012): Position is strictly FIFO by `joined_at`. The daily session count does NOT affect queue ordering — it only gates entry into the queue (students who have reached their daily limit cannot join). Position is assigned as `MAX(position) + 1` for the program at insert time.

**2-hour expiry enforcement** (CHK027): Enforced by the `queue-processor` Edge Function running as a cron every 5 minutes. It queries `status = 'waiting' AND expires_at < now()` and sets status to `'expired'`. The application layer also checks `expires_at` at read time for immediate UX feedback.

**3-minute claim window** (CHK028): Application-layer enforcement. When a student receives a queue notification, the service validates `notified_at + interval '3 minutes' > now()` on claim attempt. The `queue-processor` cron also sweeps expired notifications (`status = 'notified' AND notified_at + interval '3 minutes' < now()`) every 5 minutes, cascading to the next entry.

### daily_session_count

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| date | DATE | NOT NULL DEFAULT CURRENT_DATE | |
| session_count | INT | NOT NULL DEFAULT 0 | |
| | | UNIQUE(student_id, program_id, date) | |

**Increment semantics** (CHK019): Incremented on session **completion** (`draft → completed`), not on draft creation. This ensures abandoned or cancelled drafts do not consume the daily limit. The count is checked at queue join time and session start time against `programs.settings.max_daily_free_sessions`.

### program_waitlist

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| track_id | UUID | FK → program_tracks(id) ON DELETE SET NULL | |
| cohort_id | UUID | FK → cohorts(id) ON DELETE SET NULL | Nullable |
| teacher_id | UUID | FK → profiles(id) ON DELETE SET NULL | Nullable |
| position | INT | NOT NULL | |
| joined_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| notified_at | TIMESTAMPTZ | | |
| status | TEXT | NOT NULL, CHECK (IN waiting/offered/accepted/expired/cancelled) | |
| offer_expires_at | TIMESTAMPTZ | | 24-hour window |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

### session_schedules

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| cohort_id | UUID | NOT NULL, FK → cohorts(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| day_of_week | INT | NOT NULL, CHECK (BETWEEN 0 AND 6) | 0 = Sunday |
| start_time | TIME | NOT NULL | |
| end_time | TIME | NOT NULL | |
| meeting_link | TEXT | | Override cohort/teacher default |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Note** (CHK002): This table is not listed in the spec's 15 Key Entities but is intentionally included as a supporting table for structured cohort scheduling. It normalizes the recurring schedule data that `cohorts.schedule` JSONB summarizes.

### notification_preferences

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| category | TEXT | NOT NULL | Notification category identifier |
| enabled | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(profile_id, category) | |

**Notification categories** (CHK005): The following categories align with FR-055 notification events:

| Category | Description | Default Roles |
|----------|-------------|---------------|
| `enrollment_status` | Enrollment approved, waitlisted, dropped | Student |
| `session_reminder` | Upcoming scheduled session | Student, Teacher |
| `session_completed` | Session outcome logged | Student |
| `queue_turn` | Queue position reached, teacher available | Student |
| `waitlist_offer` | Spot opened, enrollment offered | Student |
| `rating_received` | New review submitted (no student identity) | Teacher |
| `flagged_review` | Review auto-flagged (rating ≤ 2) | Supervisor |
| `cohort_update` | Cohort status change, schedule update | Student, Teacher |
| `teacher_assignment` | Assigned to program, cohort, or supervisor group | Teacher, Supervisor |
| `system_announcement` | Platform-wide announcements | All |

### push_tokens

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| token | TEXT | NOT NULL | Expo push token |
| platform | TEXT | NOT NULL, CHECK (IN ios/android) | |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(profile_id, token) | |

### platform_config

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | Single row |
| name | TEXT | NOT NULL DEFAULT 'WeReciteTogether' | |
| name_ar | TEXT | NOT NULL DEFAULT 'نتلو معاً' | |
| description | TEXT | | |
| logo_url | TEXT | | |
| settings | JSONB | NOT NULL DEFAULT '{}' | Global defaults |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

**Settings JSONB schema** (CHK013):
```json
{
  "maintenance_mode": false,
  "default_language": "ar",
  "support_email": "support@werecitetogether.com",
  "terms_url": "https://werecitetogether.com/terms",
  "privacy_url": "https://werecitetogether.com/privacy",
  "min_app_version": "1.0.0",
  "max_voice_memo_seconds": 120,
  "default_queue_expiry_minutes": 120,
  "default_waitlist_offer_hours": 24
}
```

## Key RLS Helper Functions

```sql
-- Returns the global role from profiles.role for the current authenticated user
get_user_role() RETURNS TEXT

-- Returns array of program_ids the user has access to
-- For teachers/supervisors/program_admins: from program_roles table
-- For students: from enrollments where status IN ('active', 'approved', 'pending')
-- Master admin returns NULL (bypass — check separately)
get_user_programs() RETURNS UUID[]

-- Check if user is master admin (bypasses program scoping)
is_master_admin() RETURNS BOOLEAN
```

**Role function behavior** (CHK031): `get_user_role()` returns `profiles.role` — the **global** role, NOT the program-scoped `program_roles.role`. This is used for broad role-gating (e.g., only teachers can create sessions). Program-level access is controlled by `get_user_programs()` which checks the `program_roles` table for staff and `enrollments` for students.

**NULL bypass pattern** (CHK032): When `get_user_programs()` returns NULL, it means the user is a master admin. All RLS policies MUST handle this: `get_user_programs() IS NULL OR program_id = ANY(get_user_programs())`. This is a documented convention — NULL is never a valid return for non-master-admin roles.

## RLS Policy Summary

RLS is enabled on **all 19 tables**. Policies use `get_user_role()`, `get_user_programs()`, and `is_master_admin()`.

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own row OR master admin | Via auth trigger only | Own row OR master admin | Master admin only |
| programs | All authenticated users | Master admin | Master admin, program_admin (own programs) | Master admin |
| program_tracks | All authenticated (active programs) | Master admin, program_admin | Master admin, program_admin | Master admin |
| program_roles | Own roles OR master admin OR program_admin (own programs) | Master admin, program_admin | Master admin, program_admin | Master admin, program_admin |
| cohorts | Users in program | Program_admin, master admin | Program_admin, master admin | Master admin |
| enrollments | Own enrollments OR staff in program | Service role (via app) | Status changes by role | Master admin |
| teacher_availability | All authenticated (for available list) | Own record | Own record | Own record |
| sessions | Participants (teacher + students via attendance) | Teacher | Teacher (own sessions) | Master admin only |
| session_attendance | Session participants | Teacher (session owner) | Teacher (session owner) | Master admin only |
| session_voice_memos | Participants + supervisor | Teacher (session owner) | None (immutable) | Service role (cleanup) |
| teacher_reviews | See anonymity note below | Student (post-session) | Supervisor (`is_excluded` flag) | Master admin only |
| teacher_rating_stats | All authenticated | Trigger only (service role) | Trigger only (service role) | Trigger only (service role) |
| free_program_queue | Own entries + program staff | Student (self) | Service role | Service role |
| daily_session_count | Own entries | Service role | Service role | Service role |
| program_waitlist | Own entries + program admins | Student (self) | Service role | Service role |
| session_schedules | Users in program | Program_admin | Program_admin | Program_admin |
| notification_preferences | Own preferences | Own preferences | Own preferences | Own preferences |
| push_tokens | Own tokens | Own tokens | Own tokens | Own tokens |
| platform_config | All authenticated | Master admin | Master admin | None |

### Teacher Review Anonymity (CHK033)

Teachers can see reviews about themselves but MUST NOT see `student_id` (FR-041). Implementation: RLS SELECT policy for `teacher_reviews` when `auth.uid() = teacher_id` returns `student_id` as NULL via column masking:

```sql
-- Teacher sees own reviews but student_id is masked
CREATE POLICY teacher_reviews_teacher_select ON teacher_reviews
  FOR SELECT TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (true);
-- Application layer: query via a view or function that returns NULL for student_id when caller is the teacher
```

Students, supervisors, and admins see `student_id` normally (each at their appropriate access scope).

### Supervisor Access Boundaries (CHK034)

Supervisors access only teachers/sessions/reviews within cohorts where `cohorts.supervisor_id = auth.uid()`. This is NOT blanket program-level access. RLS policies for supervisor SELECT on `sessions`, `session_attendance`, and `teacher_reviews` filter via:

```sql
EXISTS (
  SELECT 1 FROM cohorts
  WHERE cohorts.id = sessions.cohort_id
  AND cohorts.supervisor_id = auth.uid()
)
```

## State Transitions

### Session Lifecycle
```
draft → completed (teacher logs outcome)
draft → cancelled (teacher or student cancels)
```
**Terminal states**: `completed` and `cancelled` are immutable — a completed session cannot be reopened. If corrections are needed, create a new session (CHK022).

### Enrollment Lifecycle (CHK021)
```
pending → approved (admin approves for structured programs)
pending → active (auto-approve if program settings.enrollment_auto_approve = true)
pending → waitlisted (cohort full, student moved to program_waitlist)
pending → dropped (student or admin cancels before approval)
approved → active (student confirms or term starts)
approved → dropped (student or admin cancels after approval)
active → completed (program/cohort completed)
active → dropped (student withdraws or admin removes)
waitlisted → active (spot opens and student confirms via waitlist flow)
waitlisted → dropped (student cancels while on waitlist)
```
**Terminal states**: `completed` and `dropped` are immutable. A dropped student re-enrolls by creating a new `enrollments` row (partial unique index allows this).

### Cohort Lifecycle
```
enrollment_open → enrollment_closed → in_progress → completed → archived
```
**Terminal states**: `completed` and `archived` are immutable. An archived cohort cannot be restored — create a new cohort instead (CHK022).

### Queue Entry Lifecycle
```
waiting → notified (teacher available, notification sent)
notified → claimed (student responds within 3 min)
notified → expired (3 min window passed, cascades to next)
waiting → expired (2 hour auto-expiry)
waiting → cancelled (student leaves queue)
```

**Cascade behavior** (CHK024): When a queue entry transitions `notified → expired`, the `queue-processor` Edge Function **immediately** (no delay) notifies the next entry:
1. Sets expired entry status to `'expired'`
2. Finds next entry by lowest `position` with `status = 'waiting'`
3. Sets that entry's status to `'notified'`, sets `notified_at = now()`
4. Sends push notification to the student
5. Sequential cascade — only one student is notified at a time

### Waitlist Entry Lifecycle
```
waiting → offered (spot opened, notification sent)
offered → accepted (student confirms within 24 hours)
offered → expired (24 hour window passed, cascades to next)
waiting → cancelled (student leaves waitlist)
```

**Waitlist-Enrollment Atomicity** (CHK023): When a waitlist entry transitions `offered → accepted`, both tables are updated atomically within a single database transaction:
1. Update `program_waitlist` row: `status = 'accepted'`
2. Update `enrollments` row: `status = 'active'` (from `'waitlisted'`)
3. If more spots are available, offer to next waitlist entry

If either update fails, the entire transaction rolls back. Implemented as a service-layer transaction using Supabase's RPC or Edge Function.

## Realtime Subscriptions

| Table | Events | Filtered By | Consumer |
|-------|--------|-------------|----------|
| teacher_availability | UPDATE | program_id | Student "Available Now" list |
| sessions | INSERT, UPDATE | teacher_id or student_id | "In Session" status, session history |
| free_program_queue | INSERT, UPDATE, DELETE | program_id | Queue position display |
| enrollments | UPDATE | student_id | Enrollment status changes |
| teacher_reviews | INSERT (where is_flagged = true) | program_id | Supervisor flagged-review alerts (CHK037) |

## Triggers

### updated_at Auto-Update (CHK036)

Applied to all tables with an `updated_at` column: `profiles`, `programs`, `cohorts`, `enrollments`, `teacher_availability`, `sessions`, `program_waitlist`, `platform_config`, `push_tokens`.

Each uses a shared `update_updated_at()` function:
```sql
CREATE FUNCTION update_updated_at()
  RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Profile Creation on Auth Signup (CHK038)

Trigger on `auth.users` AFTER INSERT creates a `profiles` row with:
- `id` → from `auth.users.id`
- `role` → `'student'` (default; admin-created users get role updated via separate service call)
- `full_name` → from OAuth metadata (`raw_user_meta_data->>'full_name'`) or empty string
- `email` → from `auth.users.email`
- `onboarding_completed` → `false`
- `is_active` → `true`
- All other columns → NULL/default (populated during onboarding flow)

Function is `SECURITY DEFINER` with `SET search_path = public` per Constitution VII.

### Rating Stats Recalculation (CHK035)

Trigger on `teacher_reviews` AFTER INSERT, UPDATE, or DELETE. For the affected `(teacher_id, program_id)` pair:
- Recalculates `total_reviews`, `average_rating`, `rating_N_count` from non-excluded reviews (`is_excluded = false`)
- Uses UPSERT (`INSERT ... ON CONFLICT DO UPDATE`) on `teacher_rating_stats`
- Toggling `is_excluded` fires an UPDATE event, which recalculates stats excluding that review
- `common_positive_tags` and `common_constructive_tags` are computed asynchronously by the application layer (top 3 by frequency, ties broken by recency) — the trigger sets these to NULL; a follow-up service call populates them

## Indexes

All foreign key columns receive implicit btree indexes from their FK constraints. Additional performance indexes:

| Table | Column(s) | Type | Rationale |
|-------|-----------|------|-----------|
| profiles | (role) | btree | Role-based user filtering |
| profiles | (is_active) WHERE is_active = true | btree partial | Active user queries |
| program_roles | (profile_id, program_id) | btree composite | `get_user_programs()` lookups |
| enrollments | (student_id, status) | btree composite | Student enrollment queries |
| enrollments | (program_id, status) | btree composite | Program enrollment counts |
| enrollments | See CHK017 above | partial unique | Active enrollment uniqueness |
| teacher_availability | (program_id, is_available) WHERE is_available = true | btree partial | Available teacher list |
| sessions | (teacher_id, status) | btree composite | Teacher session history |
| sessions | (program_id, created_at) | btree composite | Program session timeline |
| free_program_queue | (program_id, status) | btree composite | Active queue queries |
| daily_session_count | (student_id, program_id, date) | btree composite (via UNIQUE) | Daily limit checks |
| teacher_reviews | (teacher_id, program_id, is_excluded) | btree composite | Rating aggregation queries |
| session_voice_memos | (expires_at) | btree | Cleanup cron queries |

## Delete Semantics (CHK025, CHK041)

### ON DELETE Behaviors

All foreign keys have explicit `ON DELETE` behavior:

| FK Relationship | ON DELETE | Rationale |
|-----------------|-----------|-----------|
| profiles.id → auth.users.id | CASCADE | Profile is owned by auth user |
| program_tracks.program_id → programs.id | CASCADE | Tracks belong to program |
| program_roles.profile_id → profiles.id | CASCADE | Role assignment owned by user |
| program_roles.program_id → programs.id | CASCADE | Role scoped to program |
| program_roles.assigned_by → profiles.id | SET NULL | Preserve assignment history |
| cohorts.program_id → programs.id | CASCADE | Cohorts belong to program |
| cohorts.track_id → program_tracks.id | SET NULL | Cohort survives track removal |
| cohorts.teacher_id → profiles.id | SET NULL | Cohort survives teacher removal |
| cohorts.supervisor_id → profiles.id | SET NULL | Cohort survives supervisor removal |
| enrollments.student_id → profiles.id | CASCADE | Enrollment owned by student |
| enrollments.program_id → programs.id | CASCADE | Enrollment scoped to program |
| enrollments.track_id → program_tracks.id | SET NULL | Enrollment survives track removal |
| enrollments.cohort_id → cohorts.id | SET NULL | Enrollment survives cohort removal |
| enrollments.teacher_id → profiles.id | SET NULL | Enrollment survives teacher removal |
| teacher_availability.teacher_id → profiles.id | CASCADE | Availability owned by teacher |
| teacher_availability.program_id → programs.id | CASCADE | Availability scoped to program |
| sessions.teacher_id → profiles.id | CASCADE | Session owned by teacher |
| sessions.program_id → programs.id | CASCADE | Session scoped to program |
| sessions.cohort_id → cohorts.id | SET NULL | Session survives cohort removal |
| session_attendance.session_id → sessions.id | CASCADE | Attendance owned by session |
| session_attendance.student_id → profiles.id | CASCADE | Attendance owned by student |
| session_voice_memos.session_id → sessions.id | CASCADE | Memo owned by session |
| session_voice_memos.teacher_id → profiles.id | CASCADE | Memo owned by teacher |
| session_voice_memos.student_id → profiles.id | CASCADE | Memo owned by student |
| session_voice_memos.program_id → programs.id | CASCADE | Memo scoped to program |
| teacher_reviews.teacher_id → profiles.id | CASCADE | Review owned by teacher |
| teacher_reviews.student_id → profiles.id | CASCADE | Review owned by student |
| teacher_reviews.session_id → sessions.id | CASCADE | Review owned by session |
| teacher_reviews.program_id → programs.id | CASCADE | Review scoped to program |
| teacher_reviews.excluded_by → profiles.id | SET NULL | Preserve exclusion record |
| teacher_rating_stats.teacher_id → profiles.id | CASCADE | Stats owned by teacher |
| teacher_rating_stats.program_id → programs.id | CASCADE | Stats scoped to program |
| free_program_queue.student_id → profiles.id | CASCADE | Queue entry owned by student |
| free_program_queue.program_id → programs.id | CASCADE | Queue scoped to program |
| daily_session_count.student_id → profiles.id | CASCADE | Count owned by student |
| daily_session_count.program_id → programs.id | CASCADE | Count scoped to program |
| program_waitlist.student_id → profiles.id | CASCADE | Waitlist entry owned by student |
| program_waitlist.program_id → programs.id | CASCADE | Waitlist scoped to program |
| program_waitlist.track_id → program_tracks.id | SET NULL | Waitlist survives track removal |
| program_waitlist.cohort_id → cohorts.id | SET NULL | Waitlist survives cohort removal |
| program_waitlist.teacher_id → profiles.id | SET NULL | Waitlist survives teacher removal |
| session_schedules.cohort_id → cohorts.id | CASCADE | Schedule owned by cohort |
| session_schedules.program_id → programs.id | CASCADE | Schedule scoped to program |
| notification_preferences.profile_id → profiles.id | CASCADE | Preferences owned by user |
| push_tokens.profile_id → profiles.id | CASCADE | Tokens owned by user |

### Soft-Delete vs. Hard-Delete Patterns

| Pattern | Tables | Behavior |
|---------|--------|----------|
| **`is_active` flag** | `profiles`, `programs`, `program_tracks`, `session_schedules`, `push_tokens` | Logical deactivation. Row persists. App layer filters `is_active = true` for display. RLS does NOT filter by `is_active`. Reactivation is possible. |
| **CASCADE delete** | All child tables via FK constraints | Physical deletion when parent is removed. Used for ownership chains. |
| **Status lifecycle** | `enrollments`, `cohorts`, `sessions`, `free_program_queue`, `program_waitlist` | Terminal states (`completed`, `archived`, `expired`, `cancelled`, `dropped`) are immutable. New entries created instead of reactivation. |

## Design Decisions

### Role Precedence (CHK009)

`profiles.role` is the **global default role** — it determines the initial route group and is the primary identity. `program_roles` provides **supplementary program-scoped roles** within specific programs.

- **Students**: `profiles.role = 'student'`, no `program_roles` entries. Scoped via `enrollments`.
- **Teachers/Supervisors/Program Admins**: `profiles.role` matches primary role AND `program_roles` entries scope them to specific programs.
- **Master Admins**: `profiles.role = 'master_admin'`, no `program_roles` entries (bypass program scoping entirely).
- **No conflict possible**: `profiles.role` determines the UI shell; `program_roles` determines data access within programs. They serve different purposes.

### Session-Attendance Pattern (CHK015)

Sessions intentionally lack a direct `student_id` FK. A session is a teacher-led event with one or more attendees via `session_attendance`. For 1:1 sessions (free programs), exactly one attendance row. For group sessions (cohorts), multiple rows. This satisfies FR-028's "links the student, teacher, and program" via `sessions → session_attendance → profiles`.

### Cohort Teacher Assignment (CHK020)

`cohorts.teacher_id` is the primary/assigned teacher for administrative purposes. Individual sessions may be conducted by a substitute — `sessions.teacher_id` records the actual teacher. The cohort-level assignment is for planning and accountability.

## Seed Data

### Programs (8 required per FR-010)

| # | name | name_ar | category |
|---|------|---------|----------|
| 1 | Open Recitation | التلاوة المفتوحة | free |
| 2 | Quran Memorization | حفظ القرآن الكريم | structured |
| 3 | Tajweed Fundamentals | أساسيات التجويد | structured |
| 4 | Quran Review | مراجعة القرآن | free |
| 5 | Children's Program | برنامج الأطفال | structured |
| 6 | Weekend Intensive | المكثف الأسبوعي | mixed |
| 7 | New Muslim Program | برنامج المسلمين الجدد | structured |
| 8 | Ijazah Preparation | إعداد الإجازة | structured |

Each program is seeded with:
- `is_active = true`
- Default `settings` JSONB (per programs table documentation above)
- `description` / `description_ar`: Brief 1-2 sentence overview of the program's purpose
- At least one `program_track` per program (e.g., "Default Track" for free programs, curriculum-based tracks for structured)
- No initial cohorts or enrollments — created operationally by program admins
