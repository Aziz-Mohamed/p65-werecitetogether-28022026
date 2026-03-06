# Data Model: Ratings & Queue System

**Feature**: 006-ratings-queue
**Migration**: `00008_ratings_queue.sql`
**Date**: 2026-03-06

## Entity Relationship Overview

```
profiles (student) ──┬── teacher_ratings ──┬── profiles (teacher)
                     │                     │
                     │                     ├── sessions
                     │                     │
                     │                     └── programs
                     │
                     ├── rating_exclusion_log
                     │
                     ├── program_queue_entries ── programs
                     │
                     └── daily_session_counts ── programs

teacher_rating_stats ── profiles (teacher) + programs
```

## Tables

### 1. teacher_ratings

Core rating table. One rating per session per student.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| session_id | UUID | FK → sessions(id) ON DELETE SET NULL | Orphan-safe per edge case |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Rating author |
| teacher_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Rated teacher |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | Program context |
| star_rating | INTEGER | NOT NULL, CHECK (1-5) | 1-5 star rating |
| tags | TEXT[] | DEFAULT '{}' | Selected feedback tag keys |
| comment | TEXT | CHECK (char_length <= 500) | Optional free-text comment |
| is_flagged | BOOLEAN | NOT NULL, DEFAULT false | Auto-set if star_rating <= 2 |
| is_excluded | BOOLEAN | NOT NULL, DEFAULT false | Supervisor exclusion state |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique constraint**: `UNIQUE(session_id, student_id)` — enforces one rating per session per student (FR-004)

**Indexes**:
- `idx_teacher_ratings_teacher_program` ON (teacher_id, program_id) — for aggregate queries
- `idx_teacher_ratings_flagged` ON (program_id) WHERE is_flagged = true AND is_excluded = false — for supervisor flagged review list
- `idx_teacher_ratings_session` ON (session_id) — for checking if session is already rated

**RLS Policies**:
- Students: INSERT own ratings (student_id = auth.uid()), SELECT own ratings
- Teachers: SELECT ratings WHERE teacher_id = auth.uid() (aggregate only — individual student_id hidden via view or RPC)
- Supervisors: SELECT all ratings in their programs, UPDATE is_excluded
- Program Admins: SELECT all ratings in their programs
- Master Admins: SELECT all

**Realtime**: Published to supabase_realtime (triggers stats recalculation alerts)

### 2. teacher_rating_stats

Materialized aggregate statistics per teacher per program. Updated by trigger on teacher_ratings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| teacher_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| average_rating | NUMERIC(3,2) | NOT NULL, DEFAULT 0 | Average of non-excluded ratings |
| total_reviews | INTEGER | NOT NULL, DEFAULT 0 | Count of non-excluded ratings |
| star_distribution | JSONB | NOT NULL, DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}' | Count per star level |
| common_positive_tags | TEXT[] | DEFAULT '{}' | Top 3 most frequent positive tags |
| common_constructive_tags | TEXT[] | DEFAULT '{}' | Top 3 most frequent constructive tags |
| trend_direction | TEXT | CHECK (trend_direction IN ('improving','declining','stable')) | Based on 30-day windows |
| last_30_days_avg | NUMERIC(3,2) | DEFAULT 0 | Average for last 30 days |
| prior_30_days_avg | NUMERIC(3,2) | DEFAULT 0 | Average for 30-60 days ago |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Primary Key**: `(teacher_id, program_id)` — composite

**Indexes**:
- `idx_rating_stats_program` ON (program_id) WHERE total_reviews >= 5 — for available-now list (FR-005)

**RLS Policies**:
- Students: SELECT WHERE total_reviews >= 5 (FR-005 enforced at RLS level)
- Teachers: SELECT own stats (teacher_id = auth.uid())
- Supervisors/Program Admins/Master Admins: SELECT all in their programs

**Realtime**: Published to supabase_realtime (teacher cards update on stat changes)

### 3. rating_exclusion_log

Audit trail for supervisor exclusion/restoration actions on ratings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| rating_id | UUID | NOT NULL, FK → teacher_ratings(id) ON DELETE CASCADE | |
| action | TEXT | NOT NULL, CHECK (action IN ('excluded','restored')) | |
| performed_by | UUID | NOT NULL, FK → profiles(id) ON DELETE SET NULL | Supervisor who acted |
| reason | TEXT | NOT NULL | Documented reason |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Indexes**:
- `idx_exclusion_log_rating` ON (rating_id) — for viewing audit trail per rating

**RLS Policies**:
- Supervisors: INSERT (own actions), SELECT in their programs
- Program Admins/Master Admins: SELECT in their programs
- All others: no access

### 4. program_queue_entries

Ephemeral queue entries for students waiting in free programs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| position | INTEGER | NOT NULL | Queue position (1-based) |
| status | TEXT | NOT NULL, DEFAULT 'waiting', CHECK (status IN ('waiting','notified','claimed','expired','left')) | |
| notified_at | TIMESTAMPTZ | | When push notification was sent |
| claim_expires_at | TIMESTAMPTZ | | notified_at + 3 minutes |
| expires_at | TIMESTAMPTZ | NOT NULL | created_at + 2 hours (auto-expiry) |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique constraint**: `UNIQUE(program_id, student_id) WHERE status IN ('waiting','notified')` — one active entry per student per program (FR-026)

**Indexes**:
- `idx_queue_entries_program_waiting` ON (program_id, position) WHERE status = 'waiting' — for queue processing order
- `idx_queue_entries_student` ON (student_id) WHERE status IN ('waiting','notified') — for student's active queues
- `idx_queue_entries_expiry` ON (claim_expires_at) WHERE status = 'notified' — for cascade processing
- `idx_queue_entries_auto_expiry` ON (expires_at) WHERE status IN ('waiting','notified') — for 2-hour auto-expiry

**RLS Policies**:
- Students: INSERT own entries, SELECT own entries, UPDATE own entries (leave queue), DELETE own entries
- Teachers: SELECT queue count per program (aggregate only, for demand indicator)
- Supervisors/Program Admins/Master Admins: SELECT all in their programs

**Realtime**: Published to supabase_realtime (queue position updates for students)

### 5. daily_session_counts

Per-student per-program daily usage tracking for fair usage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | |
| session_date | DATE | NOT NULL | Date in organization timezone |
| session_count | INTEGER | NOT NULL, DEFAULT 0 | Completed sessions today |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Unique constraint**: `UNIQUE(student_id, program_id, session_date)` — one row per student per program per day

**Indexes**:
- `idx_daily_counts_lookup` ON (student_id, program_id, session_date) — primary lookup

**RLS Policies**:
- Students: SELECT own counts
- Teachers/Supervisors/Admins: SELECT for students in their programs

### 6. programs table (ALTER — existing table)

Add configurable limits for fair usage and queue notification threshold.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| daily_session_limit | INTEGER | DEFAULT 2, CHECK (daily_session_limit >= 1) | Max sessions/day for fair usage (FR-028) |
| queue_notification_threshold | INTEGER | DEFAULT 5, CHECK (queue_notification_threshold >= 1) | Students in queue before teacher demand notification (FR-033) |

### 7. notification_preferences table (ALTER — existing table)

Add preference columns for new notification categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| rating_prompt | BOOLEAN | NOT NULL, DEFAULT true | Student: prompt to rate session |
| low_rating_alert | BOOLEAN | NOT NULL, DEFAULT true | Admin: teacher below 3.5 |
| flagged_review_alert | BOOLEAN | NOT NULL, DEFAULT true | Supervisor: ≤2 star rating |
| queue_available | BOOLEAN | NOT NULL, DEFAULT true | Student: teacher now available |
| teacher_demand | BOOLEAN | NOT NULL, DEFAULT true | Teacher: students waiting |
| recovered_alert | BOOLEAN | NOT NULL, DEFAULT true | Admin: teacher recovered above 3.5 |

## State Transitions

### Queue Entry Status

```
[created] → waiting → notified → claimed (terminal - success)
                  ↓         ↓
                 left    expired → (cascade to next student)
                  ↑
              (2h timeout → expired)
```

- `waiting`: Student joined queue, awaiting teacher
- `notified`: Push notification sent, 3-min claim window active
- `claimed`: Student tapped notification, slot secured (auto-claim)
- `expired`: Claim window elapsed (3 min) or auto-expiry (2 hours)
- `left`: Student voluntarily left queue

### Rating Exclusion State

```
[created] → is_excluded: false (active)
                ↓ (supervisor excludes)
            is_excluded: true (excluded)
                ↓ (supervisor restores)
            is_excluded: false (active)
```

Each state change logged in `rating_exclusion_log`.

## Database Functions (RPC)

### Rating Functions

1. **submit_rating(p_session_id, p_star_rating, p_tags, p_comment)**
   - Validates: session exists, status = completed, created_at within 48h, caller is the student, no existing rating
   - Auto-sets is_flagged if star_rating <= 2
   - Returns the created rating row

2. **get_teacher_rating_stats(p_teacher_id, p_program_id)**
   - Returns stats from teacher_rating_stats
   - Role-filtered: students only see stats if total_reviews >= 5

3. **exclude_rating(p_rating_id, p_reason)**
   - Validates: caller is supervisor for the rating's program
   - Sets is_excluded = true, logs to rating_exclusion_log
   - Triggers stats recalculation

4. **restore_rating(p_rating_id, p_reason)**
   - Validates: caller is supervisor for the rating's program
   - Sets is_excluded = false, logs to rating_exclusion_log
   - Triggers stats recalculation

5. **recalculate_teacher_stats(p_teacher_id, p_program_id)**
   - Recalculates all fields in teacher_rating_stats from teacher_ratings WHERE is_excluded = false
   - Computes trend from 30-day windows using organization timezone (improving if last_30 > prior_30 + 0.2, declining if last_30 < prior_30 − 0.2, stable otherwise)
   - Checks for threshold breach: if new average < 3.5 and previous average >= 3.5, triggers low_rating_alert notification to program admins (FR-014) via pg_net HTTP POST to send-notification Edge Function
   - Checks for recovery: if new average >= 3.5 and previous average < 3.5, triggers recovered_alert notification to program admins (FR-036) via pg_net HTTP POST to send-notification Edge Function
   - Notification mechanism: uses `net.http_post()` to invoke `{SUPABASE_URL}/functions/v1/send-notification` with `{type: 'low_rating_alert'|'recovered_alert', teacher_id, program_id, average_rating}` payload and service_role key in Authorization header
   - Called by trigger, not directly by client

### Queue Functions

6. **join_queue(p_program_id)**
   - Validates: caller is student, program exists, program is free, no active entry for this student+program
   - Calculates position (MAX position in waiting + 1)
   - Sets expires_at = now() + interval '2 hours'
   - Returns queue entry with position and estimated wait

7. **leave_queue(p_program_id)**
   - Sets status = 'left' for caller's active entry
   - Reorders positions for remaining entries

8. **claim_queue_slot(p_entry_id)**
   - Validates: entry belongs to caller, status = 'notified', claim_expires_at > now()
   - Sets status = 'claimed'
   - Returns teacher info for session start

9. **get_queue_status(p_program_id)**
   - Returns: student's position, total in queue, estimated wait time
   - Wait time = position × avg_session_duration for that program

10. **get_program_demand(p_program_id)**
    - Returns count of waiting + notified entries
    - For teacher dashboard demand indicator

11. **get_daily_session_count(p_program_id)**
    - Returns session_count for caller + program + today (in org timezone)
    - Returns 0 if no row exists

## Triggers

1. **after_rating_insert_or_update**: On teacher_ratings INSERT/UPDATE/DELETE
   - Calls `recalculate_teacher_stats(teacher_id, program_id)`

2. **after_session_completed**: On sessions UPDATE WHERE new.status = 'completed'
   - Increments daily_session_counts for student + program + today
   - Only for free programs (checks programs.category)

3. **on_teacher_available**: On teacher_availability UPDATE WHERE new.is_available = true
   - Calls queue-processor Edge Function via pg_net (or Supabase webhook)
   - Processes first waiting student in the teacher's program queue

## pg_cron Jobs

1. **queue_cascade_processor** (runs every 1 minute):
   - Finds entries WHERE status = 'notified' AND claim_expires_at <= now()
   - Sets them to 'expired'
   - Notifies next 'waiting' entry (sets to 'notified', sends push)

2. **queue_auto_expiry** (runs every 5 minutes):
   - Finds entries WHERE status IN ('waiting','notified') AND expires_at <= now()
   - Sets them to 'expired'

3. **teacher_demand_check** (runs every 5 minutes):
   - For each program where queue count >= queue_notification_threshold
   - Checks last demand notification timestamp (debounce 60 min per FR-034)
   - Sends teacher demand notifications if debounce window elapsed

4. **queue_entry_cleanup** (runs daily at 03:00 UTC):
   - Deletes program_queue_entries WHERE status IN ('claimed','expired','left') AND created_at < now() - interval '7 days'
   - Prevents table bloat from accumulated terminal-state entries
