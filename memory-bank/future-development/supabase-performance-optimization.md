# Supabase Performance & Sustainability Plan for 60K+ Users

Last updated: 2026-03-08

## Context

The application currently has 42+ tables, ~120 RLS policies, 41 RPC functions, 11 Edge Functions, and 11 pg_cron jobs. With a target of 60,000+ users, several structural issues will degrade performance over time:

- RLS policies with N+1 subqueries evaluated per-row
- Missing indexes on foreign keys and common query paths
- Unbounded client-side data fetches
- Synchronous HTTP triggers on hot INSERT paths
- O(n^2) loops in Edge Functions
- Hardcoded project URLs in cron jobs
- ILIKE on JSONB cast bypasses GIN indexes

This plan addresses each systematically, ordered by impact-to-effort ratio.

> **Important:** Migration `00024_search_users_include_name_ar.sql` already exists. All new migrations must start at **00025**.

---

## Phase 1: Missing Indexes (High Impact, Zero Risk)

**New file:** `supabase/migrations/00025_performance_indexes.sql`

### Missing FK indexes

These foreign key columns have no index, causing sequential scans on JOINs:

```sql
-- enrollments FK indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_track_id ON enrollments(track_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_teacher_id ON enrollments(teacher_id);

-- program_waitlist FK indexes
CREATE INDEX IF NOT EXISTS idx_program_waitlist_program_id ON program_waitlist(program_id);
CREATE INDEX IF NOT EXISTS idx_program_waitlist_track_id ON program_waitlist(track_id);

-- teacher_ratings FK index
CREATE INDEX IF NOT EXISTS idx_teacher_ratings_student_id ON teacher_ratings(student_id);
```

### Missing composite indexes for hot queries

```sql
-- Teacher dashboard + reports (sessions by teacher, ordered by date)
CREATE INDEX IF NOT EXISTS idx_sessions_teacher_date
  ON sessions(teacher_id, session_date DESC);

-- Student session history
CREATE INDEX IF NOT EXISTS idx_sessions_student_date
  ON sessions(student_id, session_date DESC);

-- Program dashboard RPCs (get_program_admin_dashboard_stats, get_master_admin_programs_enriched)
CREATE INDEX IF NOT EXISTS idx_sessions_program_created
  ON sessions(program_id, created_at DESC) WHERE program_id IS NOT NULL;

-- Class attendance reports
CREATE INDEX IF NOT EXISTS idx_attendance_class_date
  ON attendance(class_id, date);

-- Every notification Edge Function queries active push tokens by user
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_active
  ON push_tokens(user_id) WHERE is_active = true;

-- session-reminders Edge Function
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_date_status
  ON scheduled_sessions(session_date, status);
```

**Verification:** `supabase db reset` locally, then `EXPLAIN ANALYZE` on key queries before/after.

---

## Phase 2: RLS Policy Optimization (Medium Impact, Medium Risk)

**New file:** `supabase/migrations/00026_performance_rls_helpers.sql`

### Problem

Parent-specific RLS policies were already **dropped** in migration `00021_remove_parent_role.sql`. The `admin` role was merged into `master_admin` in migration `00019_merge_admin_into_master_admin.sql`.

The remaining N+1 subquery patterns are on **2 tables** with teacher + master_admin access:

**Pattern A — Teacher class-student access (2 tables):**
```sql
student_id IN (SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid())
```
- `student_stickers`: 2 policies (read + award)
- `student_rub_certifications`: 4 policies (read/insert/update/delete)

**Pattern B — Master admin school-student access (2 tables):**
```sql
student_id IN (SELECT students.id FROM students WHERE students.school_id = get_user_school_id())
```
- `student_stickers`: 3 policies (read/award/delete)
- `student_rub_certifications`: 4 policies (read/insert/update/delete)

**Key file:** `supabase/migrations/00001_consolidated_schema.sql` lines 1320-1447

### Solution

Create `SECURITY DEFINER` + `STABLE` helper functions cached per transaction:

```sql
-- Returns student IDs in teacher's classes (cached per transaction)
CREATE OR REPLACE FUNCTION get_teacher_student_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(s.id), '{}')
  FROM students s
  JOIN classes c ON s.class_id = c.id
  WHERE c.teacher_id = auth.uid()
    AND s.is_active = true;
$$;

-- Returns student IDs in master admin's school (cached per transaction)
CREATE OR REPLACE FUNCTION get_school_student_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(id), '{}')
  FROM students
  WHERE school_id = get_user_school_id()
    AND is_active = true;
$$;
```

Then replace all `IN (SELECT ...)` with `= ANY(helper())`:

```sql
-- Before (nested JOIN re-executes per row):
student_id IN (SELECT s.id FROM students s JOIN classes c ON s.class_id = c.id WHERE c.teacher_id = auth.uid())

-- After (cached per transaction):
student_id = ANY(get_teacher_student_ids())
```

**Policies to replace:** ~13 across `student_stickers` and `student_rub_certifications`

**Verification:** Test teacher and master_admin roles for correct access on stickers/certifications. Compare `EXPLAIN ANALYZE` plans before/after.

---

## Phase 3: Async Notify Trigger (High Impact, Medium Risk)

**New file:** `supabase/migrations/00027_performance_async_notify.sql`

### Problem

`notify_on_insert()` (00001 lines 500-530) uses **synchronous** `extensions.http_post()` on every INSERT to `sessions` and `attendance`. This blocks the INSERT until the Edge Function responds or times out.

It also has a **hardcoded project URL**: `https://cwakivlyvnxdeqrkbzxc.supabase.co`

### Solution

Replace with **async** `net.http_post()` (pg_net extension, already used in migration 00016):

```sql
CREATE OR REPLACE FUNCTION notify_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  vault_url text;
  vault_key text;
  payload jsonb;
BEGIN
  SELECT decrypted_secret INTO vault_url
    FROM vault.decrypted_secrets WHERE name = 'supabase_url';
  SELECT decrypted_secret INTO vault_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'type', TG_OP,
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := vault_url || '/functions/v1/send-notification',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || vault_key
    )
  );

  RETURN NEW;
END;
$$;
```

**Reference pattern:** `supabase/migrations/00016_session_reminders_cron.sql`

**Verification:** Test INSERT latency on sessions/attendance. Verify notifications still arrive.

---

## Phase 4: Unbounded Query Fixes (Medium Impact, Low Risk)

### 4a. Move client-side aggregations to RPC functions

**New file:** `supabase/migrations/00028_performance_rpc_aggregations.sql`

| New RPC | Replaces | File |
|---------|----------|------|
| `get_student_attendance_rate(p_student_id uuid)` | Fetching ALL attendance + counting client-side | `src/features/attendance/services/attendance.service.ts` lines 52-71 |
| `get_class_analytics(p_class_id uuid, p_start date, p_end date)` | 4 parallel queries + client aggregation | `src/features/reports/services/teacher-reports.service.ts` lines 12-93 |

Example RPC for attendance rate:

```sql
CREATE OR REPLACE FUNCTION get_student_attendance_rate(p_student_id uuid)
RETURNS TABLE(total_sessions bigint, attended bigint, rate numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    count(*) AS total_sessions,
    count(*) FILTER (WHERE status = 'present') AS attended,
    CASE
      WHEN count(*) = 0 THEN 0
      ELSE round(count(*) FILTER (WHERE status = 'present')::numeric / count(*) * 100, 1)
    END AS rate
  FROM attendance
  WHERE student_id = p_student_id;
$$;
```

> **Note:** When implemented, use `as never` cast on RPC name and `as unknown as` on return type until `database.types.ts` is regenerated. This is the existing pattern in the codebase.

### 4b. Add limits to unbounded admin queries

**Modify:** `src/features/admin/services/admin.service.ts` (lines 231-250)
- `getCrossProgramEnrollmentTrend()` — add `.limit(5000)` + enforce max 90-day range
- `getCrossProgramSessionVolume()` — same treatment
- `getTeacherActivityHeatmap()` — same treatment

**Modify:** `src/features/reports/services/admin-reports.service.ts`
- Large aggregation queries should call RPCs instead of fetching raw data

---

## Phase 5: Edge Function Optimization (Medium Impact, Large Effort)

### 5a. teacher-daily-summary — Eliminate O(n^2) queries

**File:** `supabase/functions/teacher-daily-summary/index.ts` (lines 157-227)

**Current flow (O(schools * teachers * 3)):**
```
for each school:
  fetch all teachers in school
  for each teacher:
    fetch classes for teacher        ← query
    count students in classes        ← query
    check notification preferences   ← query
    fetch push tokens                ← query
```

**Optimized flow (O(schools * 3)):**
```sql
-- Single query per school replaces inner loop
SELECT
  p.id AS teacher_id,
  p.full_name,
  p.preferred_language,
  count(DISTINCT s.id) AS student_count
FROM profiles p
JOIN classes c ON c.teacher_id = p.id AND c.is_active = true
LEFT JOIN students s ON s.class_id = c.id AND s.is_active = true
WHERE p.school_id = $1 AND p.role = 'teacher'
GROUP BY p.id, p.full_name, p.preferred_language
HAVING count(DISTINCT s.id) > 0;
```

Then batch `push_tokens` and `notification_preferences` lookups with `.in('user_id', teacherIds)`.

### 5b. cleanup-drafts — Batch queries

**File:** `supabase/functions/cleanup-drafts/index.ts` (lines 66-123)

Replace per-teacher sequential queries (3 queries per teacher) with 3 batched `.in()` calls:

```typescript
const teacherIds = [...teacherDrafts.keys()];

// Batch all 3 queries
const [prefsResult, profilesResult, tokensResult] = await Promise.all([
  supabase.from('notification_preferences').select('user_id, draft_expired').in('user_id', teacherIds),
  supabase.from('profiles').select('id, preferred_language').in('id', teacherIds),
  supabase.from('push_tokens').select('user_id, token').in('user_id', teacherIds).eq('is_active', true),
]);
```

### 5c. send-notification — Fix unbounded dedup map

**File:** `supabase/functions/send-notification/index.ts` (line 39)

`recentSends = new Map()` grows without bound. Current cleanup triggers at size > 1000 but only cleans expired entries. Add hard cap:

```typescript
if (recentSends.size > 5000) {
  // Force full cleanup
  const now = Date.now();
  for (const [key, timestamp] of recentSends) {
    if (now - timestamp > DEDUP_WINDOW_MS) recentSends.delete(key);
  }
  // If still too large after cleanup, clear everything
  if (recentSends.size > 5000) recentSends.clear();
}
```

### 5d. verify-certificate — Fix unbounded rate-limit map

**File:** `supabase/functions/verify-certificate/index.ts` (lines 12-38, 92-93)

`rateLimitMap` cleanup is probabilistic (1% chance per request, line 93). Add max-size guard:

```typescript
// After the probabilistic cleanup check (line 93)
if (rateLimitMap.size > 10000) {
  cleanupRateLimitMap();
  if (rateLimitMap.size > 10000) rateLimitMap.clear();
}
```

---

## Phase 6: Cron Job Hardcoded URLs (Low Impact, Zero Risk)

**New file:** `supabase/migrations/00029_performance_cron_vault_urls.sql`

### Problem

Two cron jobs in `00001_consolidated_schema.sql` (lines 1509-1531) use hardcoded URL:
```
https://cwakivlyvnxdeqrkbzxc.supabase.co
```

### Solution

Unschedule and recreate using vault secrets, matching `00016_session_reminders_cron.sql` pattern:

```sql
-- Remove old cron jobs with hardcoded URLs
SELECT cron.unschedule('generate-sessions');
SELECT cron.unschedule('teacher-daily-summary');

-- Recreate with vault secrets
SELECT cron.schedule(
  'generate-sessions',
  '0 0 * * *',  -- midnight daily
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
           || '/functions/v1/generate-sessions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'teacher-daily-summary',
  '*/15 * * * *',  -- every 15 minutes
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url')
           || '/functions/v1/teacher-daily-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

---

## Phase 7: Text Search Optimization (Low Impact, Medium Effort)

**New file:** `supabase/migrations/00030_performance_text_search.sql`

### Problem

Multiple service files use `name_localized::text.ilike.%query%` which casts JSONB to text — GIN indexes can't help, causing full table scans:

- `src/features/admin/services/admin.service.ts`
- `src/features/students/services/students.service.ts`
- `src/features/students/services/teachers.service.ts`
- `src/features/admin/services/classes.service.ts`

### Solution

Add expression indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_profiles_name_ar
  ON profiles ((name_localized->>'ar'))
  WHERE name_localized IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_name_en
  ON profiles ((name_localized->>'en'))
  WHERE name_localized IS NOT NULL;
```

Modify client queries to search specific JSONB keys instead of casting:

```typescript
// Before:
.or(`full_name.ilike.%${q}%,name_localized::text.ilike.%${q}%`, { referencedTable: 'profiles' })

// After:
.or(`full_name.ilike.%${q}%,name_localized->>ar.ilike.%${q}%,name_localized->>en.ilike.%${q}%`, { referencedTable: 'profiles' })
```

---

## Phase 8: Future Improvements (Plan Only)

These are longer-term improvements that don't need immediate action:

- **Cursor-based pagination** — Replace `.range(offset, limit)` with keyset pagination for large result sets
- **Data archival** — Move sessions/attendance older than 12 months to archive tables
- **Table partitioning** — Partition sessions and attendance by date (requires Supabase Pro features)
- **Auth hardening** — Increase min password length from 6 to 8 (Supabase dashboard setting)
- **Connection pooling** — Enable pgBouncer transaction mode for production

---

## Implementation Order & Dependencies

```
Phase 1 (Indexes)         ← Deploy first, zero risk, immediate gains
Phase 2 (RLS Helpers)     ← Depends on Phase 1 indexes for helper function perf
Phase 3 (Async Notify)    ← Independent, can parallel with Phase 2
Phase 4 (Unbounded Fixes) ← RPCs needed before client changes
Phase 5 (Edge Functions)  ← Independent, can parallel with Phase 4
Phase 6 (Cron URLs)       ← Independent, can go with Phase 1
Phase 7 (Text Search)     ← Client + migration, can parallel with Phase 5-6
```

## Lessons Learned from Initial Implementation Attempt

1. **RPC return type mismatch:** `get_student_attendance_rate` RPC caused "Cannot coerce the result to a single JSON object" at runtime. When implementing, ensure RPCs that return TABLE types are called with `.select()` not `.single()` on the client side.
2. **Migration numbering:** `00024` was already taken by `00024_search_users_include_name_ar.sql` — always check existing migrations before numbering.
3. **TypeScript types:** New RPCs won't appear in `database.types.ts` until types are regenerated. Use `as never` cast on RPC name and `as unknown as` on return type as an interim pattern (existing codebase convention).

## Files to Create/Modify

| File | Action | Phase |
|------|--------|-------|
| `supabase/migrations/00025_performance_indexes.sql` | Create | 1 |
| `supabase/migrations/00026_performance_rls_helpers.sql` | Create | 2 |
| `supabase/migrations/00027_performance_async_notify.sql` | Create | 3 |
| `supabase/migrations/00028_performance_rpc_aggregations.sql` | Create | 4 |
| `src/features/admin/services/admin.service.ts` | Modify | 4, 7 |
| `src/features/attendance/services/attendance.service.ts` | Modify | 4 |
| `src/features/reports/services/admin-reports.service.ts` | Modify | 4 |
| `src/features/reports/services/teacher-reports.service.ts` | Modify | 4 |
| `supabase/functions/teacher-daily-summary/index.ts` | Modify | 5 |
| `supabase/functions/cleanup-drafts/index.ts` | Modify | 5 |
| `supabase/functions/send-notification/index.ts` | Modify | 5 |
| `supabase/functions/verify-certificate/index.ts` | Modify | 5 |
| `supabase/migrations/00029_performance_cron_vault_urls.sql` | Create | 6 |
| `supabase/migrations/00030_performance_text_search.sql` | Create | 7 |
| `src/features/students/services/students.service.ts` | Modify | 7 |

## Verification Checklist

1. **Local:** `supabase db reset` after each migration phase
2. **Query perf:** Run `EXPLAIN ANALYZE` on critical queries (teacher reading stickers/certifications, teacher dashboard, admin reports)
3. **RLS correctness:** Test each role sees only authorized data (teacher, student, master_admin, program_admin)
4. **Edge Functions:** Deploy to staging, check function logs for execution time
5. **Notifications:** Verify async trigger still delivers notifications end-to-end
