# Data Model & Schema Checklist: WeReciteTogether Core Platform

**Purpose**: Validate completeness, clarity, and consistency of data model requirements before implementation — author self-review
**Created**: 2026-02-28
**Feature**: [spec.md](../spec.md) | [data-model.md](../data-model.md)

## Requirement Completeness

- [x] CHK001 Are all 15 key entities from the spec represented as tables in the data model? [Completeness, Spec §Key Entities]
- [x] CHK002 Is the `session_schedules` table referenced in the data model but absent from the spec's Key Entities list — is it intentionally undocumented or a gap? [Completeness, Gap]
- [x] CHK003 Are index requirements defined for high-frequency query columns (e.g., `program_id` FKs, `status` filters, `teacher_id` lookups)? [Completeness, Gap]
- [x] CHK004 Is the `programs.settings` JSONB schema documented with all keys, types, and default values? [Completeness, Spec §FR-008]
- [x] CHK005 Are all notification categories referenced in FR-055 enumerated in the `notification_preferences.category` column documentation? [Completeness, Spec §FR-055]
- [x] CHK006 Are seed data requirements for the 8 programs and tracks explicitly defined with enough detail to populate all required columns? [Completeness, Spec §FR-010]
- [x] CHK007 Is the `cohorts.schedule` JSONB schema documented with structure, keys, and example values? [Completeness, Gap]
- [x] CHK008 Is the `program_tracks.curriculum` JSONB column documented with expected structure? [Completeness, Gap]

## Requirement Clarity

- [x] CHK009 Is the distinction between `profiles.role` (global role) and `program_roles.role` (program-scoped role) explicitly defined — what takes precedence when they conflict? [Clarity, Spec §FR-011 vs §FR-012]
- [x] CHK010 Are the `teacher_reviews.tags` values enumerated — do the tag options in the spec (US6 acceptance scenario 1) match a defined set in the data model? [Clarity, Spec §US6]
- [x] CHK011 Is "score" in `session_attendance` defined the same way as "score" in the spec (0-5)? The data model says `CHECK (BETWEEN 0 AND 5)` but the spec says "per-student score (0-5)" — is 0 a valid pedagogical score or does it mean "not scored"? [Clarity, Spec §FR-029]
- [x] CHK012 Is the `free_program_queue.position` column's ordering rule defined — is it strictly FIFO by `joined_at`, or does daily session count affect ordering? [Clarity, Spec §FR-049]
- [x] CHK013 Is the `platform_config.settings` JSONB schema documented with expected keys and defaults? [Clarity, Gap]
- [x] CHK014 Are the `profiles.age_range` CHECK constraint values an exact match with the spec's onboarding options ("under 13, 13-17, 18-25, 26-35, 36-50, 50+")? The data model uses `under_13/13_17/18_25/26_35/36_50/50_plus` — is the mapping documented? [Clarity, Spec §FR-005]

## Requirement Consistency

- [x] CHK015 Does the `sessions` table lack a direct `student_id` FK while `session_attendance` handles the student link — is this consistent with FR-028's requirement that a draft session "links the student, teacher, and program"? [Consistency, Spec §FR-028]
- [x] CHK016 Is "one voice memo per session" (FR-036) consistent with the `session_voice_memos` UNIQUE constraint `(session_id, student_id)` — which implies one per student per session, not one per session? [Consistency, Spec §FR-036]
- [x] CHK017 Are the `enrollments` UNIQUE constraint columns `(student_id, program_id, track_id, cohort_id)` consistent with the edge case requiring no duplicate active enrollments — does the constraint account for status (e.g., can a dropped student re-enroll)? [Consistency, Spec §Edge Cases]
- [x] CHK018 Is the `teacher_availability.current_session_count` increment/decrement mechanism consistent with the draft session lifecycle — are both creation and cancellation/completion of drafts accounted for? [Consistency, Spec §FR-032]
- [x] CHK019 Does the `daily_session_count` table increment on draft creation or session completion — and is this consistent with FR-048's "daily session limit" semantics? [Consistency, Spec §FR-048]
- [x] CHK020 Is the `cohorts.teacher_id` (single teacher) consistent with US4 which implies one teacher per cohort, while a cohort could have multiple sessions with different teachers? [Consistency, Spec §US4]

## State Machine Coverage

- [x] CHK021 Are all valid state transitions for enrollment status documented — specifically, is `approved → active` a separate transition or is `approved` synonymous with `active`? [Coverage, Spec §FR-024]
- [x] CHK022 Are reverse/error transitions defined — can a `completed` session be reopened? Can an `archived` cohort be restored? [Coverage, Gap]
- [x] CHK023 Is the waitlist entry lifecycle's `offered → accepted` transition mapped to the enrollment lifecycle's `waitlisted → active` — are both tables updated atomically? [Coverage, Spec §FR-052]
- [x] CHK024 Is the queue entry's `notified → expired` cascade behavior specified — does it trigger an immediate notification to the next entry, or is there a delay? [Coverage, Spec §FR-047]

## Constraint & Validation Coverage

- [x] CHK025 Are `ON DELETE` behaviors specified for all foreign keys, and are they consistent with business rules (e.g., deleting a program cascades to enrollments, but should it)? [Coverage, Gap]
- [x] CHK026 Is the `session_voice_memos.expires_at` default value (30 days from creation) enforced at the database level or only application level? [Clarity, Spec §FR-034]
- [x] CHK027 Is the `free_program_queue.expires_at` (2-hour expiry) enforced by a database trigger, cron job, or application check — and is this mechanism documented? [Clarity, Spec §FR-046]
- [x] CHK028 Is the 3-minute claim window for queue notifications enforced at the database level or application level — and is the enforcement mechanism specified? [Clarity, Spec §FR-047]
- [x] CHK029 Is the 48-hour rating window (FR-038) enforced via a database constraint or application logic — and is the mechanism documented? [Clarity, Spec §FR-038]

## RLS & Access Control

- [x] CHK030 Are RLS policies defined for all 19 tables, and if any are exempt, is the rationale documented? [Completeness, Gap]
- [x] CHK031 Does `get_user_role()` return the global `profiles.role` or the program-scoped `program_roles.role` — and is this distinction clear for RLS policies that need program-level scoping? [Clarity, Gap]
- [x] CHK032 Is `get_user_programs()` returning NULL for master admins documented as a pattern that all RLS policies must handle (i.e., NULL = bypass)? [Clarity, Gap]
- [x] CHK033 Are RLS requirements specified for the `teacher_reviews` table to enforce that teachers cannot see `student_id` on their own reviews (FR-041 anonymity)? [Coverage, Spec §FR-041]
- [x] CHK034 Are RLS requirements defined for supervisor access boundaries — can a supervisor only see teachers within their assigned group, not all teachers in the program? [Coverage, Spec §US8]

## Realtime & Triggers

- [x] CHK035 Are trigger requirements specified for the `teacher_rating_stats` materialized aggregate — what events on `teacher_reviews` cause recalculation, and does excluding a review trigger an update? [Completeness, Gap]
- [x] CHK036 Is the `updated_at` auto-update trigger documented for all tables that have an `updated_at` column? [Completeness, Gap]
- [x] CHK037 Are the 4 Realtime subscription filters (`teacher_availability`, `sessions`, `free_program_queue`, `enrollments`) sufficient — is `teacher_reviews` missing for supervisor flagged-review alerts? [Coverage, Spec §FR-043]
- [x] CHK038 Is the trigger that creates a profile row on `auth.users` INSERT documented with the exact columns it populates (role, onboarding_completed, etc.)? [Completeness, Gap]

## Edge Cases & Missing Definitions

- [x] CHK039 Is the `profiles.languages` TEXT array's value format defined — are these ISO language codes, free-text, or from a fixed list? [Clarity, Gap]
- [x] CHK040 Is the `profiles.meeting_platform` CHECK constraint exhaustive — what happens if a teacher uses a platform not in the list (google_meet/zoom/jitsi/other)? [Edge Case, Gap]
- [x] CHK041 Are soft-delete vs. hard-delete semantics defined — tables use `is_active` flags on some entities but CASCADE deletes on others? [Consistency, Gap]
- [x] CHK042 Is the `teacher_rating_stats.common_positive_tags` and `common_constructive_tags` computation rule defined — "Top 3" by what metric (frequency, recency)? [Clarity, Gap]

## Notes

- All 42 items resolved on 2026-02-28
- Items marked [Gap] were resolved by adding documentation to data-model.md
- Items marked [Consistency] were verified and documented with rationale
- Focus: Data Model & Schema | Depth: Standard | Audience: Author (self-review)
