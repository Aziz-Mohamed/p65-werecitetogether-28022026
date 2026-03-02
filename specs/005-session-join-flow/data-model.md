# Data Model: Session Join Flow

**Feature**: 005-session-join-flow
**Date**: 2026-03-02

## Overview

All core tables already exist. This feature requires **1 migration** to update the `sessions.status` CHECK constraint and add a draft-session expiry function. No new tables are needed.

## Existing Entities (No Changes)

### teacher_availability
Program-scoped teacher online status with concurrent student tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| teacher_id | UUID | FK → profiles, NOT NULL | |
| program_id | UUID | FK → programs, NOT NULL | |
| is_available | BOOLEAN | DEFAULT false | Toggle by teacher |
| available_since | TIMESTAMPTZ | nullable | Set when toggling on |
| max_concurrent_students | INT | DEFAULT 1, CHECK > 0 | Configurable per teacher |
| current_session_count | INT | DEFAULT 0, CHECK >= 0 | Incremented on join, decremented on complete/expire |
| updated_at | TIMESTAMPTZ | | |

**Unique**: (teacher_id, program_id)
**Index**: idx_teacher_availability_available WHERE is_available = true
**Realtime**: Yes
**RLS**: SELECT all authenticated; INSERT/UPDATE/DELETE teacher only

### sessions
Session records with lifecycle tracking.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| teacher_id | UUID | FK → profiles, NOT NULL | |
| program_id | UUID | FK → programs, NOT NULL | |
| cohort_id | UUID | FK → cohorts, nullable | For structured programs |
| status | TEXT | DEFAULT 'draft' | **CHANGE: add 'expired', 'in_progress'** |
| meeting_link_used | TEXT | nullable | Recorded on join (FR-010) |
| started_at | TIMESTAMPTZ | DEFAULT now() | |
| completed_at | TIMESTAMPTZ | nullable | Set on completion |
| duration_minutes | INT | nullable, CHECK > 0 | |
| notes | TEXT | nullable | Teacher notes |
| created_at | TIMESTAMPTZ | DEFAULT now() | Used for expiry calculation |
| updated_at | TIMESTAMPTZ | DEFAULT now() | |

**Indexes**: (teacher_id, status), (program_id, created_at)
**Realtime**: Yes
**RLS**: SELECT multi-role; INSERT teachers/master_admin; UPDATE teacher owner/master_admin

### session_attendance
Student attendance records per session.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| session_id | UUID | FK → sessions, NOT NULL | |
| student_id | UUID | FK → profiles, NOT NULL | |
| score | INT | nullable, CHECK 0-5 | Teacher-assigned |
| notes | TEXT | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique**: (session_id, student_id)

### free_program_queue
Student waiting queue for free programs.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| student_id | UUID | FK → profiles, NOT NULL | |
| program_id | UUID | FK → programs, NOT NULL | |
| position | INT | NOT NULL | |
| joined_at | TIMESTAMPTZ | DEFAULT now() | |
| notified_at | TIMESTAMPTZ | nullable | Set by queue-processor |
| status | TEXT | DEFAULT 'waiting' | waiting/notified/claimed/expired/cancelled |
| expires_at | TIMESTAMPTZ | DEFAULT now() + 2 hours | Queue entry expiry |

**Unique**: (student_id, program_id) WHERE status IN ('waiting', 'notified')
**Index**: (program_id, status)
**Realtime**: Yes

### daily_session_count
Per-student daily session tracking for limit enforcement.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| student_id | UUID | FK → profiles, NOT NULL | |
| program_id | UUID | FK → programs, NOT NULL | |
| date | DATE | DEFAULT CURRENT_DATE | |
| session_count | INT | DEFAULT 0 | |

**Unique**: (student_id, program_id, date)

### teacher_reviews
Student ratings of teachers post-session.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| teacher_id | UUID | FK → profiles, NOT NULL | |
| student_id | UUID | FK → profiles, NOT NULL | |
| session_id | UUID | FK → sessions, NOT NULL | |
| program_id | UUID | FK → programs, NOT NULL | |
| rating | INT | NOT NULL, CHECK 1-5 | |
| tags | TEXT[] | nullable | Positive/constructive tags |
| comment | TEXT | nullable | |
| created_at | TIMESTAMPTZ | DEFAULT now() | |

**Unique**: (student_id, session_id)

### teacher_rating_stats
Materialized aggregate of teacher reviews (auto-updated by trigger).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| teacher_id | UUID | FK → profiles, NOT NULL | |
| program_id | UUID | FK → programs, NOT NULL | |
| total_reviews | INT | DEFAULT 0 | |
| average_rating | NUMERIC(3,2) | DEFAULT 0.00 | |
| rating_1_count through rating_5_count | INT | DEFAULT 0 | Distribution |
| common_positive_tags | TEXT[] | nullable | |
| common_constructive_tags | TEXT[] | nullable | |
| last_updated | TIMESTAMPTZ | DEFAULT now() | |

**PK**: (teacher_id, program_id)

## Schema Changes Required

### Migration: update_session_status_and_add_expiry

```sql
-- 1. Update sessions status CHECK to include 'expired' and 'in_progress'
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE sessions ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled', 'expired'));

-- 2. Function to expire stale draft sessions
CREATE OR REPLACE FUNCTION expire_draft_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_session RECORD;
BEGIN
  -- Find and expire drafts older than program's configured TTL (default 4 hours)
  FOR expired_session IN
    SELECT s.id, s.teacher_id, s.program_id
    FROM sessions s
    JOIN programs p ON p.id = s.program_id
    WHERE s.status = 'draft'
      AND s.created_at < now() - make_interval(
        hours := COALESCE((p.settings->>'draft_session_ttl_hours')::int, 4)
      )
  LOOP
    -- Expire the session
    UPDATE sessions SET status = 'expired', updated_at = now()
    WHERE id = expired_session.id;

    -- Decrement teacher's current session count
    UPDATE teacher_availability
    SET current_session_count = GREATEST(0, current_session_count - 1),
        updated_at = now()
    WHERE teacher_id = expired_session.teacher_id
      AND program_id = expired_session.program_id;
  END LOOP;
END;
$$;
```

## State Transitions

### Session Lifecycle
```
draft → in_progress    (teacher acknowledges)
draft → expired        (4-hour TTL, no confirmation)
draft → cancelled      (student or teacher cancels)
in_progress → completed (teacher logs outcome)
in_progress → cancelled (either party cancels)
```

### Queue Entry Lifecycle
```
waiting → notified     (teacher available, queue-processor fires)
waiting → cancelled    (student leaves queue or joins different program queue)
waiting → expired      (2-hour inactivity expiry)
notified → claimed     (student taps claim within 3 minutes)
notified → expired     (3-minute claim window expires)
```

## Configurable Parameters (via programs.settings JSONB)

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| max_daily_free_sessions | INT | 2 | Daily session limit per student |
| max_students_per_teacher | INT | 1 | Concurrent student limit |
| queue_expiry_minutes | INT | 120 | Queue entry TTL |
| queue_claim_window_minutes | INT | 3 | Claim window after notification |
| draft_session_ttl_hours | INT | 4 | Draft session auto-expiry TTL |
| queue_notify_teachers_threshold | INT | 5 | Queue size to notify offline teachers |
