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

**Settings JSONB schema**:
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
| teacher_id | UUID | FK → profiles(id) ON DELETE SET NULL | |
| supervisor_id | UUID | FK → profiles(id) ON DELETE SET NULL | |
| meeting_link | TEXT | | Override teacher default |
| schedule | JSONB | | Recurring session times |
| start_date | DATE | | |
| end_date | DATE | | Nullable for ongoing |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | Trigger |

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
| | | UNIQUE(student_id, program_id, track_id, cohort_id) | Prevent duplicates |

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

### session_attendance

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| session_id | UUID | NOT NULL, FK → sessions(id) ON DELETE CASCADE | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| score | INT | CHECK (BETWEEN 0 AND 5) | |
| notes | TEXT | | Per-student notes |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(session_id, student_id) | |

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
| common_positive_tags | TEXT[] | | Top 3 |
| common_constructive_tags | TEXT[] | | Top 3 |
| last_updated | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | PK(teacher_id, program_id) | Composite PK |

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

### daily_session_count

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| date | DATE | NOT NULL DEFAULT CURRENT_DATE | |
| session_count | INT | NOT NULL DEFAULT 0 | |
| | | UNIQUE(student_id, program_id, date) | |

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

### notification_preferences

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| profile_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| category | TEXT | NOT NULL | e.g., enrollment, session_reminder, queue, rating, etc. |
| enabled | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| | | UNIQUE(profile_id, category) | |

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

## Key RLS Helper Functions

```sql
-- Returns the role of the current authenticated user
get_user_role() RETURNS TEXT

-- Returns array of program_ids the user has access to
-- Master admin returns NULL (bypass — check separately)
get_user_programs() RETURNS UUID[]

-- Check if user is master admin (bypasses program scoping)
is_master_admin() RETURNS BOOLEAN
```

## State Transitions

### Session Lifecycle
```
draft → completed (teacher logs outcome)
draft → cancelled (teacher or student cancels)
```

### Enrollment Lifecycle
```
pending → approved → active → completed
pending → dropped
active → dropped
waitlisted → active (when spot opens and confirmed)
```

### Cohort Lifecycle
```
enrollment_open → enrollment_closed → in_progress → completed → archived
```

### Queue Entry Lifecycle
```
waiting → notified (teacher available, notification sent)
notified → claimed (student responds within 3 min)
notified → expired (3 min window passed, cascades to next)
waiting → expired (2 hour auto-expiry)
waiting → cancelled (student leaves queue)
```

### Waitlist Entry Lifecycle
```
waiting → offered (spot opened, notification sent)
offered → accepted (student confirms within 24 hours)
offered → expired (24 hour window passed, cascades to next)
waiting → cancelled (student leaves waitlist)
```

## Realtime Subscriptions

| Table | Events | Filtered By | Consumer |
|-------|--------|-------------|----------|
| teacher_availability | UPDATE | program_id | Student "Available Now" list |
| sessions | INSERT, UPDATE | teacher_id or student_id | "In Session" status, session history |
| free_program_queue | INSERT, UPDATE, DELETE | program_id | Queue position display |
| enrollments | UPDATE | student_id | Enrollment status changes |
