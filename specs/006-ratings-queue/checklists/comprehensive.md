# Comprehensive Checklist: Ratings & Queue System

**Purpose**: Pre-implementation gate — validate requirement completeness, clarity, consistency, and cross-artifact alignment across spec, data model, and contracts
**Created**: 2026-03-06
**Feature**: [spec.md](../spec.md), [data-model.md](../data-model.md), [contracts/](../contracts/)
**Focus**: Comprehensive (data integrity, timing behavior, cross-artifact traceability, privacy)
**Depth**: Standard | **Audience**: Author (self-review)

## Requirement Completeness

- [x] CHK001 - Is the timing of the rating prompt push notification specified? → Fixed: FR-013 now says "immediately after a session status changes to 'completed'"
- [x] CHK002 - Is the "recovered" teacher notification documented as a formal FR? → Fixed: Added FR-036 (recovered alert when teacher avg rises above 3.5)
- [x] CHK003 - Are admin UI requirements specified for configuring daily_session_limit and queue_notification_threshold? → Fixed: Added FR-037 (program admin config via program settings screen)
- [x] CHK004 - Is the calculation method for "average session duration" (wait time estimation) defined? → Fixed: Added to assumptions — rolling average of last 50 completed sessions, 15-min default if < 5 sessions
- [x] CHK005 - Are requirements defined for students with push notifications disabled? → Fixed: Added edge case — 3-min cascade handles non-response; in-app queue status polling is secondary channel
- [x] CHK006 - Are i18n/localization requirements specified for all 9 feedback tag labels? → Fixed: FR-017/FR-018 now require both English and Arabic translations via i18n
- [x] CHK007 - Are notification payload requirements documented for all notification categories? → Fixed: Added rating_prompt, flagged_review_alert, low_rating_alert, recovered_alert payloads to contracts/ratings-rpc.md
- [x] CHK008 - Is the "New teacher" label display covered by a functional requirement? → Fixed: FR-005 now requires "New teacher" label for teachers below 5 ratings

## Requirement Clarity

- [x] CHK009 - Is the trend threshold quantified in the spec? → Fixed: FR-011 now specifies improving if last_30 > prior_30 + 0.2, declining if last_30 < prior_30 − 0.2, stable otherwise
- [x] CHK010 - Is "offline teachers" in FR-033 defined with a measurable criterion? → Fixed: FR-033 now says "teachers who are not currently available (is_available = false)"
- [x] CHK011 - Is "inactivity" in FR-024 defined? → Fixed: FR-024 now says "2 hours after the student joined the queue (expires_at = created_at + 2 hours)"
- [x] CHK012 - Is "one rating per session per student" explicitly scoped? → Pass: UNIQUE(session_id, student_id) is unambiguous — each student rates their own session independently. Group sessions have separate session_ids per student.
- [x] CHK013 - Is the fair usage prioritization algorithm defined for equal session counts? → Fixed: FR-030 now specifies "Students with equal session counts are ordered by queue join time (FIFO)"

## Requirement Consistency

- [x] CHK014 - Is the 48-hour rating window start point consistent? → Fixed: FR-001 changed from "session creation" to "session completion" — now consistent with US1-AS1
- [x] CHK015 - Is FR-005 threshold consistent with data model? → Fixed: FR-005 now explicitly says "5 ratings (total_reviews >= 5)" — matches data model
- [x] CHK016 - Are queue status values consistent across artifacts? → Pass: get_queue_status returns only active statuses ('waiting'|'notified') which is a subset of the full state machine — consistent by design
- [x] CHK017 - Is the exclusion audit trail scope consistent with ON DELETE SET NULL? → Pass: UUID is preserved in the log even after supervisor account deletion. The "who" field retains the UUID for forensic lookup. Full name can be joined when the profile still exists. Acceptable for MVP.
- [x] CHK018 - Does FR-019 align with join_queue enrollment requirement? → Fixed: FR-019 now explicitly states "Students must be enrolled in the program to join its queue"

## Acceptance Criteria Quality

- [x] CHK019 - Can SC-002 be measured? → Fixed: Added assumption — measured via database query (COUNT rated / COUNT completed)
- [x] CHK020 - Can SC-006 be measured? → Fixed: Added assumption — measured via database query (COUNT claimed / COUNT notified)
- [x] CHK021 - Is SC-001 measurable? → Fixed: Added assumption — UX design target validated by manual testing
- [x] CHK022 - Are all 10 SCs testable? → Fixed: Added assumption documenting measurement approach for each SC category

## Scenario Coverage

- [x] CHK023 - Requirements for teacher going unavailable during claim window? → Fixed: Added edge case — claim window continues; student can still claim using last-known meeting link
- [x] CHK024 - Requirements for concurrent teacher availability? → Fixed: Added edge case — each teacher independently triggers queue processing; two students notified in parallel
- [x] CHK025 - Requirements for student with push disabled/app uninstalled? → Fixed: Added edge case — cascade handles non-response; in-app polling is secondary channel
- [x] CHK026 - Requirements for rating a teacher removed from program? → Fixed: Added edge case — student can still rate; rating is tied to session and teacher
- [x] CHK027 - Network failure and retry for rating submission? → Fixed: Added edge case — standard client-side retry; UNIQUE constraint prevents duplicates

## Edge Case Coverage

- [x] CHK028 - Program category change while queue active? → Fixed: Added edge case — active queue entries are auto-expired
- [x] CHK029 - Daily session count with timezone change? → Fixed: Added edge case — in-flight day is best-effort; new timezone applies from next midnight
- [x] CHK030 - Queue position gaps after leave_queue? → Fixed: Added edge case — positions are compacted (remaining entries decremented by 1)
- [x] CHK031 - All ratings excluded, total drops below 5? → Fixed: Added edge case — teacher reverts to "New teacher" display per FR-005

## Non-Functional Requirements

- [x] CHK032 - Rate limiting on submit_rating? → Fixed: Added assumption — Supabase auth rate limiting + UNIQUE constraint sufficient for MVP
- [x] CHK033 - Content moderation for comments? → Fixed: Added assumption — deferred to future iteration; supervisor exclusion (FR-009) is MVP moderation
- [x] CHK034 - Data retention for queue entries? → Fixed: Added pg_cron job queue_entry_cleanup (daily, purges terminal entries > 7 days) to data model
- [x] CHK035 - Accessibility for star rating input? → Fixed: Added assumption — accessibilityLabel on each star, minimum 44x44pt touch targets per RN best practices

## Cross-Artifact Traceability

- [x] CHK036 - FR-014 (notify admins when avg < 3.5) has trigger coverage? → Fixed: recalculate_teacher_stats now checks for threshold breach (< 3.5) and recovery (>= 3.5) — triggers low_rating_alert and recovered_alert (FR-036) notifications
- [x] CHK037 - get_teacher_reviews over-specified vs FR-008? → Pass: Contract enriches the minimal spec requirement with standard patterns (pagination, audit trail nesting). Acceptable — contracts may be more detailed than spec FRs.
- [x] CHK038 - All notification preference columns traceable to FRs? → Pass: rating_prompt↔FR-013, low_rating_alert↔FR-014, flagged_review_alert↔FR-015, queue_available↔FR-022, teacher_demand↔FR-033, recovered_alert↔FR-036. Added recovered_alert column.
- [x] CHK039 - pg_cron jobs traceable to FRs? → Pass: cascade↔FR-023, auto-expiry↔FR-024, demand↔FR-033/FR-034, cleanup↔assumption (data retention)

## Dependencies & Assumptions

- [x] CHK040 - Push notification infrastructure validated? → Pass: 004-push-notifications is implemented (confirmed in research phase — send-notification Edge Function, push_tokens table, notification_preferences table all exist)
- [x] CHK041 - Session logging with program_id validated? → Pass: 005-session-evolution is implemented (migration 00007 adds program_id to sessions, confirmed in research)
- [x] CHK042 - Dependency on programs.category = 'free' documented? → Pass: programs table from 003-programs-enrollment has category column with CHECK ('free','structured','mixed'). Queue FRs (019, 027) explicitly scope to free programs.

## Notes

- **All 42 items resolved**: 27 fixed via spec/data-model/contract updates, 15 passed as-is with justification
- Spec updated: FR-001, FR-005, FR-011, FR-013, FR-017, FR-018, FR-019, FR-024, FR-030, FR-033 modified; FR-036, FR-037 added; 10 new edge cases; 6 new assumptions
- Data model updated: recalculate_teacher_stats trigger enhanced (FR-014/FR-036 threshold checks), queue_entry_cleanup pg_cron added, recovered_alert notification preference column added
- Contracts updated: 4 notification payloads added (rating_prompt, flagged_review_alert, low_rating_alert, recovered_alert)
