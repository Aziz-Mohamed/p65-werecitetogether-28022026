# Research: Ratings & Queue System

**Feature**: 006-ratings-queue
**Date**: 2026-03-06

## Decision 1: Rating Aggregate Materialization Strategy

**Decision**: Use a dedicated `teacher_rating_stats` table updated via PostgreSQL trigger on `teacher_ratings` INSERT/UPDATE/DELETE.

**Rationale**: SC-010 requires aggregate stats to update within 10 seconds. A trigger-based materialized table ensures stats are always current without polling. Supabase Realtime can publish changes to `teacher_rating_stats` so teacher cards update in near-real-time on the client.

**Alternatives considered**:
- PostgreSQL materialized view with `REFRESH MATERIALIZED VIEW CONCURRENTLY`: Adds latency (periodic refresh), doesn't meet 10s requirement without a cron job. More complex to subscribe to via Realtime.
- Application-level calculation on read: Would require aggregating all ratings per query. Slow for teachers with many reviews. Violates SC-003 (1 second load time for available-now list).
- Supabase Edge Function triggered by webhook: Adds external dependency and latency. Trigger is simpler and faster.

## Decision 2: Queue Cascade Mechanism

**Decision**: Use a Supabase Edge Function (`queue-processor`) triggered by a database trigger on `teacher_availability` when `is_available` changes to `true`. The Edge Function sends a push notification to the first `waiting` student and sets a 3-minute claim expiry. A `pg_cron` job runs every minute to cascade expired notifications to the next student.

**Rationale**: Event-driven architecture (spec assumption). The teacher going available is the trigger event. pg_cron handles the 3-minute cascade timeout reliably server-side without needing client-side timers. This is consistent with the existing `pg_cron` pattern used for stale availability expiry in 004-teacher-availability.

**Alternatives considered**:
- Client-side timer with Edge Function callback: Unreliable if student's app is closed. Server-side is authoritative.
- Supabase Realtime + client polling: Adds complexity to client. Server-side cascade is simpler and guarantees exactly-once notification.
- Single Edge Function with `setTimeout`: Deno Deploy doesn't support long-running functions. pg_cron is the correct pattern for periodic checks.

## Decision 3: Real-Time Queue Position Updates

**Decision**: Publish `program_queue_entries` to Supabase Realtime. Client subscribes with a filter on `program_id` and receives position updates on INSERT/UPDATE/DELETE events. Client recalculates position from query cache invalidation.

**Rationale**: SC-005 requires position updates within 3 seconds. Supabase Realtime delivers sub-second for table changes. The existing realtime infrastructure (subscription profiles, debounced invalidation) supports this pattern directly. Students already subscribe to `teacher_availability` for the available-now list.

**Alternatives considered**:
- Polling every 5 seconds: Too slow for SC-005, wastes bandwidth.
- WebSocket custom server: Over-engineered. Supabase Realtime is already available and paid for.

## Decision 4: Fair Usage Daily Count Storage

**Decision**: Use a `daily_session_counts` table with a composite unique index on `(student_id, program_id, session_date)`. Increment via a trigger on `sessions` INSERT WHERE `status = 'completed'` and `program_id` belongs to a free program. Reset is implicit — new day = new row (no need for a cron job to zero out).

**Rationale**: Simple, auditable, timezone-correct. The session_date is determined using the organization's timezone (from `schools.timezone`). No periodic cleanup needed — old rows can be purged monthly via a cron job if needed, but they're small.

**Alternatives considered**:
- Redis counter with TTL: Not available in Supabase stack. External dependency.
- Application-level COUNT query: Slow under load. Dedicated counter table is O(1) lookup.
- JSONB column on students table: Violates normalization. Hard to query for queue prioritization.

## Decision 5: Rating Trend Calculation

**Decision**: Store `last_30_days_avg` and `prior_30_days_avg` on `teacher_rating_stats`. Trend is computed as: improving if last > prior + 0.2, declining if last < prior - 0.2, stable otherwise. Recalculated by the stats trigger using the organization timezone for date boundaries.

**Rationale**: Per clarification, the trend uses calendar-based 30-day windows. Storing both averages avoids recalculating from raw ratings on every read. The 0.2 threshold prevents noise from causing false trend signals.

**Alternatives considered**:
- Linear regression slope: Over-engineered for MVP. Simple comparison is sufficient.
- Exponentially weighted moving average: Harder to explain to teachers. 30-day windows are intuitive.

## Decision 6: Notification Categories to Add

**Decision**: Extend `send-notification` Edge Function with 4 new categories:
1. `rating_prompt` — sent to student after session completion (48h window)
2. `low_rating_alert` — sent to program admins when teacher avg drops below 3.5
3. `flagged_review_alert` — sent to supervisors when a ≤2 star rating is submitted
4. `queue_available` — sent to queued student when teacher becomes available
5. `teacher_demand` — sent to offline teachers when queue threshold is reached

**Rationale**: Follows existing notification extension pattern (TABLE_TO_CATEGORY mapping, bilingual content, preference checking). Each category maps to a notification_preferences column for user opt-out.

**Alternatives considered**:
- Separate Edge Functions per notification type: Duplicates infrastructure. Single function with categories is the established pattern.

## Decision 7: Feature Module Split

**Decision**: Two separate feature modules: `src/features/ratings/` and `src/features/queue/`. Not combined into one.

**Rationale**: Per Constitution Principle IV (Feature Colocation), each feature keeps its hooks, services, types, and components colocated. Ratings and queue have different lifecycles (persistent vs. ephemeral), different data models, different real-time requirements, and different user roles. They share `program_id` scoping but that's a database-level concern, not an application-level coupling.

**Alternatives considered**:
- Single `src/features/ratings-queue/` module: Would grow too large (20+ components). Violates single-responsibility. Makes future extraction harder.
- Three modules (ratings + queue + fair-usage): Fair usage is tightly coupled to queue (same service, same UI context). Not worth separating.

## Decision 8: Queue Entry Auto-Claim on Notification Tap

**Decision**: Tapping the push notification deep-links to the session start flow and auto-claims the slot via an RPC call. No intermediate "Claim" button screen.

**Rationale**: Per clarification, claim = tap. This minimizes friction (one tap to secure slot). The deep link format is `werecitetogether://queue/claim/{entry_id}`. The app's linking config handles the route, calls `claim_queue_slot` RPC, and redirects to the teacher's meeting link if successful, or shows an expiry message if the 3-minute window has passed.

**Alternatives considered**:
- Two-step claim (notification → claim screen → confirm button): Adds friction. Students could lose slot while navigating.

## Dependency Map

| Dependency | Feature | Status | Required For |
|-----------|---------|--------|-------------|
| teacher_availability table | 004-teacher-availability | ✅ Implemented | Queue trigger (teacher goes available) |
| programs table + program_roles | 003-programs-enrollment | ✅ Implemented | Program scoping, teacher assignment |
| sessions table with program_id | 005-session-evolution | ✅ Implemented | Rating association, daily count tracking |
| push_tokens + notification_preferences | 004-push-notifications | ✅ Implemented | All push notifications |
| send-notification Edge Function | 004-push-notifications | ✅ Implemented | Notification delivery |
| schools.timezone | 004-teacher-availability | ✅ Implemented | Daily counter reset, trend windows |
| Supabase Realtime infrastructure | 003-realtime-updates | ✅ Implemented | Queue position updates |
