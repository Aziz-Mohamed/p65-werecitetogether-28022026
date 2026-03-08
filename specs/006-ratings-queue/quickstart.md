# Quickstart: Ratings & Queue System

**Feature**: 006-ratings-queue
**Date**: 2026-03-06

Integration test scenarios validating each user story works end-to-end.

## Prerequisites

- Migration `00008_ratings_queue.sql` applied
- Programs seeded with at least 1 free program
- Teacher assigned to the free program via `program_roles`
- Student enrolled in the free program via `enrollments`
- At least 1 completed session with `program_id` set (from 005-session-evolution)
- Push notification infrastructure operational (tokens registered)

## Scenario 1: Post-Session Rating (US1)

**Goal**: Student rates a completed session, aggregate stats update, flagging works.

```text
SETUP:
  - Student S1 has a completed session (< 48h old) with Teacher T1 in Program P1
  - T1 has no prior ratings

STEPS:
  1. S1 calls submit_rating(session_id, star_rating=4, tags=['patient','clear_explanation'], comment=null)
  2. Verify: rating row created with is_flagged=false
  3. Verify: teacher_rating_stats updated (avg=4.0, total=1)
  4. S1 attempts submit_rating(same session_id, ...) again
  5. Verify: error "Already rated" (duplicate prevention)

FLAGGING TEST:
  6. Create another completed session between S1 and T1
  7. S1 calls submit_rating(session2_id, star_rating=2, tags=['session_felt_rushed'], comment='Late start')
  8. Verify: rating row created with is_flagged=true
  9. Verify: flagged_review_alert notification sent to supervisor

WINDOW TEST:
  10. Create a session with created_at > 48h ago
  11. S1 attempts submit_rating(old_session_id, ...)
  12. Verify: error "Rating window expired"
```

## Scenario 2: Rating Stats & Display (US2)

**Goal**: Stats surface correctly per role, 5-review minimum enforced.

```text
SETUP:
  - Teacher T1 has 4 ratings in Program P1 (avg 4.25)
  - Student S2 browses available-now list

STEPS:
  1. S2 calls get_teacher_rating_stats(T1, P1)
  2. Verify: returns null (< 5 reviews, FR-005)
  3. Submit 1 more rating for T1 (now has 5)
  4. S2 calls get_teacher_rating_stats(T1, P1)
  5. Verify: returns { average_rating: ~4.2, total_reviews: 5, ... }

TREND TEST:
  6. T1 views own stats
  7. Verify: trend_direction shown (may be 'stable' initially)
  8. Submit 5 more ratings in last 30 days with avg 4.8
  9. Verify: trend_direction = 'improving'

SUPERVISOR TEST:
  10. Supervisor calls get_teacher_reviews(T1, P1)
  11. Verify: individual reviews shown WITH student names
  12. Verify: flagged reviews highlighted
```

## Scenario 3: Supervisor Exclusion & Restore (FR-009)

**Goal**: Exclusion removes from aggregate, restore adds back, audit trail maintained.

```text
SETUP:
  - T1 has 5 ratings: [5, 5, 5, 5, 1] → avg 4.2
  - The rating with star_rating=1 is flagged

STEPS:
  1. Supervisor calls exclude_rating(rating_id_of_1star, reason='Retaliatory review')
  2. Verify: rating.is_excluded = true
  3. Verify: teacher_rating_stats recalculated → avg 5.0, total 4
  4. Verify: rating_exclusion_log has entry (action='excluded')

RESTORE TEST:
  5. Supervisor calls restore_rating(same rating_id, reason='Re-evaluated, valid feedback')
  6. Verify: rating.is_excluded = false
  7. Verify: teacher_rating_stats recalculated → avg 4.2, total 5
  8. Verify: rating_exclusion_log has 2 entries (excluded + restored)
```

## Scenario 4: Free Program Queue (US3)

**Goal**: Student joins queue, teacher availability triggers notification, claim works.

```text
SETUP:
  - Free Program P1, Teacher T1 is offline (is_available = false)
  - Student S1 enrolled in P1

STEPS:
  1. S1 calls join_queue(P1)
  2. Verify: entry created with position=1, status='waiting'
  3. S1 calls get_queue_status(P1)
  4. Verify: { in_queue: true, position: 1, estimated_wait_minutes: N }

  5. Student S2 calls join_queue(P1)
  6. Verify: entry created with position=2
  7. S2 calls get_queue_status(P1)
  8. Verify: position=2

TEACHER AVAILABLE:
  9. T1 sets is_available = true (via teacher_availability)
  10. Verify: S1's entry status changes to 'notified'
  11. Verify: S1 receives push notification with entry_id in deep link
  12. Verify: S2's position remains 2 (not yet notified)

CLAIM:
  13. S1 calls claim_queue_slot(entry_id)
  14. Verify: entry status = 'claimed'
  15. Verify: returns T1's meeting_link and meeting_platform

CASCADE (S1 doesn't claim):
  16. Reset: S1's entry back to 'notified', wait 3 minutes
  17. pg_cron runs queue_cascade_processor
  18. Verify: S1's entry status = 'expired'
  19. Verify: S2's entry status = 'notified' (cascaded)
  20. Verify: S2 receives push notification
```

## Scenario 5: Queue Lifecycle (Leave & Auto-Expiry)

```text
LEAVE QUEUE:
  1. S1 joins queue at position 1, S2 at position 2
  2. S1 calls leave_queue(P1)
  3. Verify: S1's entry status = 'left'
  4. Verify: S2's position recalculated to 1

AUTO-EXPIRY:
  5. S3 joins queue (entry created with expires_at = now + 2h)
  6. Wait 2 hours (or set expires_at manually for test)
  7. pg_cron runs queue_auto_expiry
  8. Verify: S3's entry status = 'expired'

DUPLICATE PREVENTION:
  9. S1 calls join_queue(P1) while already having active entry
  10. Verify: error "Already in queue"
```

## Scenario 6: Fair Usage (US4)

**Goal**: Daily session limit tracking and queue prioritization.

```text
SETUP:
  - Free Program P1, daily_session_limit = 2
  - Student S1 has completed 2 sessions today in P1
  - Student S2 has completed 0 sessions today in P1

STEPS:
  1. S1 calls get_daily_session_count(P1)
  2. Verify: { session_count: 2, daily_limit: 2, has_reached_limit: true }

  3. S2 calls get_daily_session_count(P1)
  4. Verify: { session_count: 0, daily_limit: 2, has_reached_limit: false }

PRIORITIZATION (when both in queue):
  5. S1 joins queue → position 1
  6. S2 joins queue → position 2
  7. Queue system should prioritize S2 over S1 (S2 has fewer sessions today)
  8. When teacher becomes available, S2 gets notified first

NO-QUEUE SOFT LIMIT:
  9. No queue exists, teacher T1 is available
  10. S1 (at limit) can still join session normally (FR-029)
  11. Verify: fair usage message shown but not blocked
```

## Scenario 7: Supply-Side Teacher Demand (US5)

**Goal**: Offline teachers get notified when queue grows, demand indicator works.

```text
SETUP:
  - Free Program P1, queue_notification_threshold = 5
  - Teachers T1, T2 assigned to P1, both offline
  - 4 students in queue

STEPS:
  1. Student S5 joins queue (now 5 in queue = threshold)
  2. pg_cron runs teacher_demand_check
  3. Verify: T1 and T2 receive teacher_demand push notification
  4. Verify: notification body includes "5 students are waiting in [P1]"

DEBOUNCE:
  5. Student S6 joins queue (now 6)
  6. pg_cron runs again (< 60 min since last notification)
  7. Verify: NO duplicate notification sent (FR-034)
  8. Wait 60 minutes (or simulate)
  9. pg_cron runs again
  10. Verify: New notification sent (debounce window elapsed)

DEMAND INDICATOR:
  11. T1 calls get_program_demand(P1)
  12. Verify: { waiting_count: 6, program_name: 'P1 name' }
```

## Scenario 8: Low Rating Admin Alert (FR-014)

```text
SETUP:
  - Teacher T1 has 5 ratings in P1 with avg 3.6

STEPS:
  1. Student submits rating with star_rating=1 for T1
  2. Verify: new avg drops below 3.5
  3. Verify: program admin receives low_rating_alert notification

RECOVERY:
  4. Submit 3 more ratings with star_rating=5
  5. Verify: avg climbs above 3.5
  6. Verify: program admin receives "recovered" notification (edge case)
```

## Validation Checklist

- [ ] Rating submission within 48h window works
- [ ] Rating submission after 48h is rejected
- [ ] Duplicate rating prevention works
- [ ] Auto-flagging for star_rating <= 2 works
- [ ] 5-review minimum for public display enforced
- [ ] Teacher sees own aggregate stats but not student names
- [ ] Supervisor sees individual reviews with student names
- [ ] Exclusion removes rating from aggregate calculation
- [ ] Restoration adds rating back to aggregate
- [ ] Audit trail logs all exclusion/restoration actions
- [ ] Trend direction calculates correctly (30-day windows)
- [ ] Queue join returns correct position
- [ ] Queue position updates via Realtime
- [ ] Teacher availability triggers queue notification
- [ ] 3-minute claim window enforced
- [ ] Cascade to next student works on expiry
- [ ] Auto-expiry after 2 hours works
- [ ] Leave queue works and reorders positions
- [ ] Daily session count increments on completion
- [ ] Fair usage prioritization works in queue
- [ ] Soft limit allows joining when no queue
- [ ] Teacher demand notification at threshold
- [ ] Demand notification debounced (60 min)
- [ ] Demand indicator shows correct count
- [ ] All notifications bilingual (EN/AR)
- [ ] All i18n strings have both en/ar translations
