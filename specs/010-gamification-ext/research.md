# Research: Gamification Extension for Programs

## Decision 1: Sticker Table Extension Strategy

**Decision**: Add a NULLABLE `program_id` column to the existing `stickers` table via ALTER TABLE.

**Rationale**: The stickers table uses TEXT primary keys and has 38 seed rows. Adding a nullable FK is the least invasive change — NULL means "global" (visible to all), a value means "program-scoped." This preserves all existing stickers as global without any data migration.

**Alternatives considered**:
- Separate `program_stickers` table: Rejected — would require duplicating the catalog query logic and managing two sticker sources in the award picker.
- JSONB array of program_ids: Rejected — complicates RLS and indexing. A sticker belongs to at most one program (or is global).

## Decision 2: Milestone Badge Storage

**Decision**: Two new tables — `milestone_badges` (type definitions) and `student_badges` (awards). Seeded with 9 badge type rows.

**Rationale**: Badges are fundamentally different from stickers:
- Stickers: teacher-awarded, collectible (can earn multiple), have tiers and images
- Badges: system-awarded, one-time per program, have type/threshold metadata

A separate table avoids polluting the sticker system and makes badge checks simple: `SELECT FROM student_badges WHERE student_id = X AND badge_type = Y AND program_id = Z`.

**Alternatives considered**:
- Reuse stickers table with a `is_badge` flag: Rejected — different lifecycle (auto vs manual award), different uniqueness constraints, different display UI.
- Single `achievements` table: Rejected — over-abstraction for 9 badge types.

## Decision 3: Leaderboard Query Strategy

**Decision**: New RPC function `get_program_leaderboard(p_program_id, p_limit, p_student_id)` that joins `enrollments` with `students` and `profiles`.

**Rationale**: The existing `getLeaderboard(classId)` in the gamification service queries by `class_id`. The program leaderboard needs to query by enrollment. An RPC function keeps the complex query server-side and returns ranked results with the current student's position injected.

**Query approach**:
```sql
WITH ranked AS (
  SELECT s.id, p.full_name, s.current_level, s.longest_streak,
         ROW_NUMBER() OVER (ORDER BY s.current_level DESC, s.longest_streak DESC) AS rank
  FROM enrollments e
  JOIN students s ON s.id = e.student_id
  JOIN profiles p ON p.id = s.id
  WHERE e.program_id = p_program_id AND e.status = 'active'
)
SELECT * FROM ranked WHERE rank <= p_limit
UNION ALL
SELECT * FROM ranked WHERE id = p_student_id AND rank > p_limit
ORDER BY rank;
```

**Alternatives considered**:
- Client-side sorting: Rejected — doesn't scale to 500 students.
- Materialized view: Rejected — over-engineering for 500-student scale; RPC with index is sufficient.

## Decision 4: Milestone Badge Triggering

**Decision**: Hybrid approach per clarification:
- **Inline triggers** (via Postgres trigger functions): Session count milestones fire after INSERT on `sessions`; streak milestones fire after UPDATE on `students.current_streak`.
- **pg_cron job** (daily at 04:00 UTC): Enrollment duration milestones check `enrollments.enrolled_at` against current date.

**Rationale**: Session/streak milestones have a clear triggering event (session save, streak update) making inline checks natural and providing immediate feedback. Duration milestones have no triggering event — the 30th day just passes — so a daily cron is the simplest approach.

**Alternatives considered**:
- All inline (check on next session): Rejected — student might not have a session on their 30-day anniversary, causing delayed badge.
- All cron: Rejected — session/streak badges would be delayed up to 24h, losing the "instant reward" feel.
- Edge Function webhook: Rejected — unnecessary complexity; a simple SQL cron job suffices.

## Decision 5: Rewards Dashboard Data Strategy

**Decision**: Single RPC function `get_rewards_dashboard(p_program_id)` returning a composite JSON object with all dashboard data in one call.

**Rationale**: The dashboard needs 4 data points (sticker counts, top teachers, popular stickers, badge distribution). Making 4 separate queries would be wasteful. A single RPC aggregates everything server-side and returns:
```json
{
  "stickers_this_week": 42,
  "stickers_this_month": 156,
  "top_teachers": [...],
  "popular_stickers": [...],
  "badge_distribution": [...]
}
```

**Alternatives considered**:
- Separate RPC per section: Rejected — 4 round trips vs 1.
- Client-side aggregation: Rejected — would require fetching all student_stickers rows for the program.

## Decision 6: Notification for Badge Awards

**Decision**: Extend the existing `send-notification` Edge Function with a new `milestone_badge_earned` category.

**Rationale**: The notification Edge Function already handles category-based notifications with `getRecipients()` and `buildNotificationContent()` dispatch. Adding one more category follows the established pattern (as done for himam notifications in spec 009).

**Alternatives considered**:
- Separate Edge Function: Rejected — violates the existing single-function pattern.
- In-app only (no push): Rejected — spec FR-008 requires notification, and badges are exciting enough to warrant a push.

## Decision 7: Sticker Award Picker Program Filtering

**Decision**: Modify the existing `getStickers()` service method to accept an optional `programIds` parameter. When provided, filter to `program_id IS NULL OR program_id IN (programIds)`. Group results by program in the UI.

**Rationale**: The award picker already calls `getStickers()`. Adding program filtering at the service level means the hook and UI only need minor changes — add a "grouped by program" section header.

**Alternatives considered**:
- Separate `getProgramStickers()` method: Rejected — would split the catalog into two calls.
- RLS-only filtering: Rejected — RLS handles row access but the UI still needs grouping logic.
