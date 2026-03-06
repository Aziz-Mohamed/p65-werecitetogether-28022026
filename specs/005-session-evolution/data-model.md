# Data Model: Session Logging Evolution

**Feature Branch**: `005-session-evolution`
**Date**: 2026-03-06

---

## Entity Relationship Overview

```
programs (existing)
    ↑
    | FK (nullable)
sessions (EXTENDED)
    |
    | 1:1
session_voice_memos (NEW)
    |
    | file reference
voice-memos storage bucket (NEW)
```

---

## Modified Entity: sessions

**Action**: ALTER TABLE — add 2 nullable columns. No existing columns modified or removed.

| Column | Type | Nullable | Default | Constraint | Notes |
|--------|------|----------|---------|------------|-------|
| `program_id` | UUID | YES | NULL | FK → programs(id) ON DELETE SET NULL | Optional program context |
| `status` | TEXT | YES | NULL | CHECK (status IN ('draft', 'completed')) | NULL = 'completed' for backward compat |

**Indexes**:
- `idx_sessions_program_id` ON sessions(program_id) WHERE program_id IS NOT NULL
- `idx_sessions_status` ON sessions(status) WHERE status = 'draft'

**RLS Policy Additions**:
- Draft sessions: teacher can SELECT/UPDATE/DELETE own drafts
- Draft sessions: students/parents/supervisors CANNOT see drafts (WHERE status IS DISTINCT FROM 'draft' OR teacher_id = auth.uid())
- Program-scoped read: supervisors/program_admins can read sessions WHERE program_id = ANY(get_user_programs())

**Backward Compatibility**:
- All existing RLS policies remain untouched
- Existing sessions have program_id = NULL and status = NULL (both treated as legacy/completed)
- Existing queries return same results (new columns are nullable, not in existing SELECT *)

---

## New Entity: session_voice_memos

| Column | Type | Nullable | Default | Constraint | Notes |
|--------|------|----------|---------|------------|-------|
| `id` | UUID | NO | gen_random_uuid() | PRIMARY KEY | |
| `session_id` | UUID | NO | — | UNIQUE, FK → sessions(id) ON DELETE CASCADE | 1:1 relationship |
| `teacher_id` | UUID | NO | — | FK → profiles(id) ON DELETE CASCADE | Who recorded it |
| `storage_path` | TEXT | NO | — | — | Path in voice-memos bucket |
| `duration_seconds` | INTEGER | NO | — | CHECK (duration_seconds > 0 AND duration_seconds <= 120) | Max 2 minutes |
| `file_size_bytes` | INTEGER | NO | — | CHECK (file_size_bytes > 0) | For storage tracking |
| `is_expired` | BOOLEAN | NO | false | — | Set true when file deleted after 30 days |
| `expires_at` | TIMESTAMPTZ | NO | — | — | created_at + 30 days |
| `created_at` | TIMESTAMPTZ | NO | now() | — | Recording timestamp |

**Indexes**:
- `idx_session_voice_memos_session_id` ON session_voice_memos(session_id) — unique already covers this
- `idx_session_voice_memos_expires_at` ON session_voice_memos(expires_at) WHERE is_expired = false — for cleanup job
- `idx_session_voice_memos_teacher_id` ON session_voice_memos(teacher_id)

**RLS Policies**:
- Teacher SELECT: own memos (teacher_id = auth.uid())
- Teacher INSERT: own memos for own sessions (session must belong to teacher, created within 24h)
- Student SELECT: memos for own sessions (session.student_id = auth.uid(), session.status != 'draft')
- Parent SELECT: memos for children's sessions (via students.parent_id)
- Supervisor SELECT: memos in assigned programs (session.program_id = ANY(get_user_programs()))
- Program Admin SELECT: memos in assigned programs
- Master Admin SELECT: all memos

**Trigger**: ON INSERT → call send-notification Edge Function for `voice_memo_attached` event

---

## New Storage: voice-memos bucket

| Property | Value |
|----------|-------|
| Bucket name | `voice-memos` |
| Public | false (private) |
| File size limit | 512000 (500KB) |
| Allowed MIME types | `['audio/mp4', 'audio/m4a', 'audio/aac', 'audio/mpeg']` |

**Path convention**: `{session_id}.m4a`

**Storage Policies**:
- Teacher INSERT: authenticated, path matches a session they own
- Authenticated SELECT: via signed URLs only (RLS on session_voice_memos controls access)
- Teacher DELETE: own memos only
- Service role DELETE: for cleanup job

**Signed URL generation**: RPC function `get_voice_memo_url(p_session_id UUID)` returns a 1-hour signed URL after verifying the caller has access to the session.

---

## Modified Entity: notification_preferences

**Action**: ALTER TABLE — add 2 nullable columns.

| Column | Type | Nullable | Default | Constraint | Notes |
|--------|------|----------|---------|------------|-------|
| `voice_memo_received` | BOOLEAN | YES | true | — | Opt-out for voice memo notifications |
| `draft_expired` | BOOLEAN | YES | true | — | Opt-out for draft cleanup notifications |

---

## State Transitions

### Session Status

```
                  ┌──────────┐
   Create draft   │          │
   ───────────>   │  draft   │ ──── auto-delete (7 days) ──→ DELETED
                  │          │
                  └────┬─────┘
                       │
                Submit  │
                       ▼
                  ┌──────────┐
   Create session │          │
   ───────────>   │completed │ (or NULL — legacy)
                  │          │
                  └──────────┘
```

### Voice Memo Lifecycle

```
   Record locally
       │
       ▼
   Upload to storage ──── fail ──→ Queue for retry (AsyncStorage)
       │                              │
       │ success                      │ retry on foreground
       ▼                              ▼
   Create session_voice_memos row ◄───┘
       │
       │ INSERT trigger → push notification to student
       │
       ▼
   Active (is_expired = false)
       │
       │ 30 days elapsed
       ▼
   Expired (is_expired = true, storage file deleted)
   └── UI shows "Voice memo expired" with date + duration
```

---

## pg_cron Jobs

### Job: cleanup-expired-voice-memos

**Schedule**: Daily at 3:00 AM UTC
**Action**: HTTP POST to Edge Function `cleanup-voice-memos`
**Logic**:
1. Query `session_voice_memos WHERE expires_at <= now() AND is_expired = false`
2. For each: delete file from storage bucket
3. Update `is_expired = true`
4. Log count of cleaned memos

### Job: cleanup-draft-sessions

**Schedule**: Daily at 3:30 AM UTC
**Action**: HTTP POST to Edge Function `cleanup-drafts`
**Logic**:
1. Query `sessions WHERE status = 'draft' AND created_at < now() - interval '7 days'` grouped by teacher_id
2. Delete the draft sessions
3. For each teacher: send batched push notification with count
