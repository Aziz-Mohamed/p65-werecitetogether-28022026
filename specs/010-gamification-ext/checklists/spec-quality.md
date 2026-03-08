# Specification Quality Checklist: Gamification Extension for Programs

**Purpose**: Validate completeness, clarity, consistency, and coverage of the gamification extension requirements before task generation
**Created**: 2026-03-06
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)

## Requirement Completeness

- [x] CHK001 - Are sticker creation permission rules specified for all roles (student, teacher, admin, program_admin, supervisor, master_admin)? [Completeness, Spec §FR-001] — Resolved: FR-001 now explicitly states students/teachers/supervisors cannot create stickers; admin/master_admin for global, program_admin for program-scoped.
- [x] CHK002 - Are requirements defined for how the sticker award picker groups stickers (global section vs program section header labels)? [Gap] — Resolved: FR-002 now specifies grouping with section headers ("Global" + one per program name), and multi-program teachers see all their programs.
- [x] CHK003 - Are loading/empty state requirements defined for the program leaderboard when a program has zero enrolled students? [Gap] — Resolved: FR-004 now specifies empty state message when zero enrolled students.
- [x] CHK004 - Are requirements specified for the badge notification content (title, body, deep-link target)? [Gap, Spec §FR-008] — Resolved: FR-008 now specifies `milestone_badge_earned` category, deep-link to `/(student)/profile/badges`, separate notification per badge.
- [x] CHK005 - Is the sticker management UI for creating/editing program-scoped stickers specified (admin and program_admin flows)? [Gap] — Resolved: FR-001 now references existing admin screens (master-admin for global, program-admin for program-scoped).
- [x] CHK006 - Are requirements defined for what happens when the daily pg_cron job awards multiple badges to the same student simultaneously? [Gap, Spec §FR-008] — Resolved: FR-008 now specifies each badge generates a separate notification.

## Requirement Clarity

- [x] CHK007 - Is "noticeable delay" in NFR-002 quantified with a specific latency threshold? [Ambiguity, Spec §NFR-002] — Resolved: NFR-002 now specifies "less than 200ms" added latency.
- [x] CHK008 - Is the leaderboard tie-breaking rule explicit and unambiguous (current_level DESC, then longest_streak DESC)? [Clarity, Spec §FR-004, US2-AS1] — Resolved: FR-004 now includes full sort order: current_level DESC, longest_streak DESC, full_name ASC as final tiebreaker.
- [x] CHK009 - Is it clear whether "session count milestones" count all sessions or only completed/scored sessions? [Ambiguity, Spec §FR-007] — Resolved: FR-007 now specifies "completed sessions (status = 'completed' or NULL for legacy)".
- [x] CHK010 - Is the term "grayed-out silhouettes" for locked badges defined with sufficient visual specificity for implementation? [Clarity, Spec §FR-011] — Resolved: FR-011 now specifies "reduced opacity, monochrome icon" instead of vague "grayed-out silhouettes".
- [x] CHK011 - Is the badge category grouping order (enrollment, sessions, streak) explicitly specified or left to implementation? [Clarity, Spec §FR-010] — Resolved: FR-010 now specifies fixed order: enrollment, sessions, streak.

## Requirement Consistency

- [x] CHK012 - Is the leaderboard ranking metric consistent between US2-AS1 ("rubʿ level descending, ties broken by longest streak") and FR-004 ("by rubʿ level, students.current_level")? [Consistency, Spec §FR-004 vs US2] — Resolved: FR-004 now includes full sort order matching US2-AS1 plus full_name tiebreaker.
- [x] CHK013 - Are the milestone badge threshold values consistent between FR-007 (30d/90d/1yr, 10/50/100, 7d/30d/100d) and the data model seed data (30/90/365, 10/50/100, 7/30/100)? [Consistency, Spec §FR-007 vs data-model.md] — Resolved: FR-007 now uses explicit numeric values (30, 90, 365 days) matching data model seed data.
- [x] CHK014 - Is the "program name" display requirement consistent across sticker collection (FR-003) and badge display (FR-010)? [Consistency] — Pass: Both FR-003 and FR-010 specify showing the program name. Sticker shows it as "subtle label", badge shows it alongside date earned.
- [x] CHK015 - Are permission rules for the rewards dashboard consistent between FR-012 ("supervisor and program admins") and FR-013 ("supervisor's assigned programs")? [Consistency, Spec §FR-012 vs FR-013] — Resolved: FR-012 now explicitly states "Both supervisors and program admins"; FR-013 now references "the viewer's assigned program(s)" covering both roles.

## Acceptance Criteria Quality

- [x] CHK016 - Can SC-001 ("within 3 taps") be objectively measured without specifying the starting screen? [Measurability, Spec §SC-001] — Resolved: SC-001 now specifies "from the student's profile screen (open award picker → select sticker → confirm)".
- [x] CHK017 - Can SC-003 ("100% of defined milestone types are automatically checked") be verified independently of timing (inline vs cron)? [Measurability, Spec §SC-003] — Pass: SC-003 is verifiable — run all 9 milestone conditions and confirm each awards a badge. Timing mechanism is an implementation detail.
- [x] CHK018 - Is SC-004 ("single unified collection screen") clear about whether badges and stickers appear on the same screen or in separate tabs? [Clarity, Spec §SC-004] — Resolved: SC-004 now specifies badges in a dedicated badges tab on profile, stickers in the existing collection screen.

## Scenario Coverage

- [x] CHK019 - Are requirements defined for a teacher who belongs to multiple programs simultaneously seeing stickers from all their programs? [Coverage, Spec §FR-002] — Resolved: FR-002 now explicitly states "Teachers assigned to multiple programs see stickers from all their programs."
- [x] CHK020 - Are requirements defined for the leaderboard when a student is enrolled in multiple programs and views each? [Coverage, Spec §US2-AS3] — Pass: US2-AS3 already covers this: "When they switch between program leaderboards, rankings update to reflect each program's enrolled students."
- [x] CHK021 - Are requirements defined for what the rewards dashboard shows when no stickers have been awarded yet (zero-data state)? [Gap] — Resolved: FR-012 now specifies "sections MUST show zero counts with an empty state message (not an error)."
- [x] CHK022 - Are requirements defined for badge awarding when the notification infrastructure is unavailable (push token missing or Edge Function down)? [Gap, Exception Flow] — Resolved: FR-008 now specifies "notification failure MUST NOT block badge insertion."
- [x] CHK023 - Are requirements defined for how the student's "own rank" row is visually distinguished from the top-20 list? [Gap, Spec §FR-005] — Resolved: FR-005 now specifies "highlighted background, 'You' label, separated by divider when outside top 20."

## Edge Case Coverage

- [x] CHK024 - Is the behavior specified when a sticker's program_id is changed from one program to another (not just global-to-program)? [Edge Case, Spec §Edge Cases] — Resolved: New edge case added specifying same behavior as global-to-program.
- [x] CHK025 - Are requirements defined for milestone badges when a student re-enrolls in a program they previously dropped? [Edge Case, Gap] — Resolved: New edge case added — previous badges remain, new enrollment duration starts fresh, uniqueness constraint prevents re-award.
- [x] CHK026 - Is the behavior specified for the leaderboard when two students have identical current_level AND longest_streak? [Edge Case, Spec §FR-004] — Resolved: FR-004 and new edge case specify full_name ascending as final deterministic tiebreaker.
- [x] CHK027 - Are requirements specified for what happens if the pg_cron job fails or runs late? [Edge Case, Gap] — Resolved: New edge case added — idempotent check, badges awarded on next successful run, no duplicates.

## Non-Functional Requirements

- [x] CHK028 - Are performance requirements specified for the rewards dashboard query (not just the leaderboard)? [Gap] — Resolved: NFR-004 added — "3 seconds for up to 500 enrolled students and 10,000 sticker awards."
- [x] CHK029 - Are accessibility requirements defined for the badge grid (locked vs earned states for screen readers)? [Gap] — Resolved: FR-011 now includes "Screen readers MUST announce locked/earned state." NFR-005 added for badge grid accessibility.
- [x] CHK030 - Is NFR-001 (2-second leaderboard) consistent with the plan's "500 enrolled students" scale target? [Consistency, Spec §NFR-001 vs plan.md] — Pass: NFR-001 explicitly states "within 2 seconds for programs with up to 500 enrolled students" — matches plan.
- [x] CHK031 - Are data retention requirements specified for student_badges when a program is deactivated? [Gap] — Resolved: New assumption added — "student_badges records are retained permanently, badges are never revoked, daily cron skips inactive programs."

## Dependencies & Assumptions

- [x] CHK032 - Is the assumption that `students.current_level` is program-independent validated against the actual schema? [Assumption, Spec §Assumptions] — Resolved: Assumption now explicitly notes "current_level is program-independent (global to the student)." Validated against schema in 00001_consolidated_schema.sql.
- [x] CHK033 - Is the dependency on the `sessions` table having a `program_id` column documented (needed for session count milestones)? [Dependency, Spec §Assumptions] — Resolved: Assumption now references "sessions.program_id (added in 005-session-evolution, migration 00007)."
- [x] CHK034 - Is the assumption that `enrollments.enrolled_at` is the correct field for duration milestones (vs created_at) validated? [Assumption] — Resolved: New assumption explicitly states "Enrollment duration milestones use enrollments.enrolled_at as the start date (not created_at)." Validated against 00005_programs_enrollment.sql which has `enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now()`.
- [x] CHK035 - Are the 003-programs-enrollment and 004-push-notifications specs listed as explicit prerequisites? [Dependency, Spec §Assumptions] — Resolved: New "Prerequisites" assumption added listing 003-programs-enrollment, 004-push-notifications, and 005-session-evolution with specific tables/columns each provides.

## Notes

- All 35 items resolved. Spec updated with clarifications for all gaps and ambiguities.
- 15 spec edits made to FR-001, FR-002, FR-004, FR-005, FR-007, FR-008, FR-010, FR-011, FR-012, FR-013, NFR-002, SC-001, SC-004, Edge Cases, and Assumptions.
- 2 new NFRs added (NFR-004 for dashboard performance, NFR-005 for badge accessibility).
- 5 new edge cases added (program-to-program re-scoping, re-enrollment, full tiebreaker, cron failure, identical rankings).
