# Full Review Checklist: Teacher Availability (Green Dot System)

**Purpose**: Pre-implementation author self-review — validate requirement completeness, clarity, consistency, and coverage across all dimensions
**Created**: 2026-03-05
**Feature**: [spec.md](../spec.md)
**Status**: All 35 items resolved (2026-03-05)

## Requirement Completeness

- [x] CHK001 - Are requirements defined for what happens to `active_student_count` when a teacher goes offline while students are "in session"? [Gap, Spec §FR-002] — Resolved: FR-016 added. Counter resets to 0 on offline/timeout. No leave RPC.
- [x] CHK002 - Are requirements specified for how students discover the "Available Now" screen — via program detail, a tab, or both? [Gap, Spec §FR-004] — Resolved: FR-004a added. Available Now accessed from program detail for free/mixed programs.
- [x] CHK003 - Is the behavior specified for when a teacher changes `max_students` while already at capacity with active students? [Gap, Spec §FR-006] — Resolved: US1-6 added. No disruption; new joins blocked until count drops or teacher resets.
- [x] CHK004 - Are requirements defined for the teacher's view of their own availability state across multiple programs? [Completeness, Spec §US1-2a] — Resolved: US1-2a already covers program selector with per-program toggles.
- [x] CHK005 - Are requirements specified for what the teacher sees when students join/leave their session (active count feedback)? [Gap] — Resolved: FR-015 + US1-5 added. Teacher sees "X/Y students" on toggle.
- [x] CHK006 - Is the behavior defined for when a student's app is backgrounded/closed after tapping "Join Session" — does `active_student_count` ever decrement? [Gap, Spec §FR-013] — Resolved: FR-016 + edge case added. No decrement; counter resets on offline/timeout.
- [x] CHK007 - Are requirements defined for the green dot indicator sizing, color value, and placement relative to teacher name/avatar? [Gap, Spec §FR-003] — Resolved: FR-003 updated. 8dp circle, #22C55E, bottom-end of avatar.

## Requirement Clarity

- [x] CHK008 - Is "throughout the app" in FR-003 (green dot) quantified — which specific screens/components display the indicator? [Ambiguity, Spec §FR-003] — Resolved: FR-003 lists specific screens (Available Now, cohort cards, team lists, program detail).
- [x] CHK009 - Is "within 5 seconds" in FR-005 defined as client-perceived latency or server broadcast time? [Ambiguity, Spec §FR-005] — Resolved: FR-005 + SC-002 clarified as client-perceived latency.
- [x] CHK010 - Is "configurable timeout" in FR-011 clarified — configurable by whom (admin, teacher, system-wide constant)? [Ambiguity, Spec §FR-011] — Resolved: FR-011 updated. System-wide constant (4h), not per-program or per-teacher.
- [x] CHK011 - Is the "rating placeholder" on the availability card specified with concrete placeholder content (e.g., "No ratings yet", hidden, greyed stars)? [Ambiguity, Spec §Assumptions] — Resolved: Assumptions updated. "New" badge as placeholder.
- [x] CHK012 - Is "eligible programs" for the program selector defined — does it include only free, or also mixed-category programs? [Clarity, Spec §US1-2a] — Resolved: US1 says "free or mixed program"; FR-001 says "free/mixed programs". Both categories included.

## Requirement Consistency

- [x] CHK013 - Does US1-4 ("only 3 students can see the Join action") align with FR-013 which says "show Teacher Full indicator"? Are both hide-button and show-indicator behaviors intended? [Conflict, Spec §US1-4 vs §FR-013] — Resolved: US1-4 rewritten. "Join" button replaced with "Teacher Full" indicator; card stays visible.
- [x] CHK014 - Are the `meeting_link` requirements consistent — FR-009 stores it on the teacher's profile, but the data model also stores it on `cohorts`; is the availability feature's link always from `profiles`? [Consistency, Spec §FR-009 vs data-model] — Resolved: Assumptions clarified. Profile meeting_link for availability; cohort meeting_link for structured programs. Different use cases.
- [x] CHK015 - Does FR-008a (RLS enrollment-scoped) align with the student RLS policy condition which uses `get_user_programs()` (which includes program_roles, not just enrollments)? [Consistency, Spec §FR-008a vs data-model RLS] — Resolved: The student RLS policy combines `get_user_programs()` with a role check (`get_user_role() = 'student'`), so only students with enrollments see availability. Teachers with program_roles are filtered by their own role-specific policy.
- [x] CHK016 - Are "free/mixed programs" and "free/mixed-free programs" used consistently across all user stories? US2 says "mixed-free" while FR-001 says "free/mixed". [Consistency, Spec §US2 vs §FR-001] — Resolved: US2 normalized to "free or mixed".

## Acceptance Criteria Quality

- [x] CHK017 - Is SC-001 ("under 2 seconds") measurable from which event — tap to UI update, or tap to server confirmation? [Measurability, Spec §SC-001] — Resolved: SC-001 clarified as tap to optimistic UI update.
- [x] CHK018 - Is SC-003 ("95% of Join Session taps") measurable without analytics infrastructure — are analytics requirements in scope? [Measurability, Spec §SC-003] — Resolved: SC-003 clarified as manual QA testing; analytics out of scope.
- [x] CHK019 - Is SC-005 ("100+ concurrent available teachers") testable — are load testing requirements or approach defined? [Measurability, Spec §SC-005] — Resolved: SC-005 clarified as seeding 100+ rows and measuring render time.
- [x] CHK020 - Are acceptance criteria defined for the pg_cron expiry job — what observable outcome confirms it ran successfully? [Gap, Spec §SC-006] — Resolved: SC-006 clarified. Observable: teacher disappears from Available Now after 4+ hours.

## Scenario Coverage

- [x] CHK021 - Are requirements defined for the teacher toggling availability while on poor/offline network connectivity? [Coverage, Exception Flow] — Resolved: FR-018 added. Optimistic toggle, revert on failure, error toast.
- [x] CHK022 - Are requirements specified for supervisor or program_admin visibility into which teachers are currently available? [Coverage, Gap] — Resolved: FR-019 added + RLS policies for supervisor/program_admin in data-model.
- [x] CHK023 - Are requirements defined for the "Go Available" flow when the teacher's meeting link has been deleted/cleared after they were last online? [Coverage, Edge Case] — Resolved: Edge case added. toggle_availability validates on every call; if cleared, re-toggle fails with prompt.
- [x] CHK024 - Is the student's journey to "leave" a teacher session defined — or does the counter only decrement via `leave_teacher_session` RPC, and if so, what triggers it? [Coverage, Gap] — Resolved: Edge case + FR-016 added. No leave RPC; counter resets on offline/timeout.

## Edge Case & Data Integrity

- [x] CHK025 - Are requirements defined for preventing `active_student_count` from drifting (becoming permanently > 0 if students never call `leave_teacher_session`)? [Gap, Edge Case] — Resolved: FR-016 + edge case. Counter resets on offline/timeout. Teacher can toggle off/on to reset.
- [x] CHK026 - Is the behavior specified when a teacher is removed from a program via `program_roles` DELETE but the trigger fails or is delayed? [Edge Case, Spec §FR-014] — Accepted risk: database triggers are transactional — if the DELETE succeeds, the trigger runs in the same transaction. Trigger failure rolls back the DELETE.
- [x] CHK027 - Are requirements defined for the uniqueness constraint violation scenario — what happens if `toggle_availability` UPSERT races with itself from two devices? [Edge Case, data-model §RPC] — Resolved: UPSERT with `ON CONFLICT (teacher_id, program_id)` handles this natively — last write wins, no error.
- [x] CHK028 - Is the behavior defined for when `pg_cron` expires a teacher's availability while a student is mid-join (race between cron and `join_teacher_session`)? [Edge Case, data-model §Cron] — Resolved: Edge case added. `join_teacher_session` uses SELECT FOR UPDATE; it either completes first or sees `is_available = false`.

## Non-Functional Requirements

- [x] CHK029 - Are offline/degraded-network requirements defined for the teacher toggle and student list screens? [Gap, Non-Functional] — Resolved: FR-018 added (optimistic toggle + revert). Student list shows cached data + "Connection lost" banner.
- [x] CHK030 - Are loading state requirements specified for the Available Now list (skeleton, spinner, progressive)? [Gap, Non-Functional] — Resolved: FR-017 added. 3 skeleton placeholder cards.
- [x] CHK031 - Are accessibility requirements defined for the green dot indicator (color-blind alternatives, screen reader labels)? [Gap, Non-Functional] — Resolved: FR-003 updated. `accessibilityLabel="Available"` + "Available" text label for color-blind.
- [x] CHK032 - Are requirements specified for `languages` display format — full language names, native script, or ISO codes? [Clarity, Spec §FR-010] — Resolved: FR-010 updated. Full names in current locale; ISO codes for storage.

## Dependencies & Assumptions

- [x] CHK033 - Is the assumption that `pg_cron` is available on the Supabase plan validated — is the extension enabled in the current project? [Assumption, Spec §FR-011] — Resolved: Confirmed in `00001_consolidated_schema.sql:15`.
- [x] CHK034 - Is the dependency on the ratings system explicitly scoped out with a concrete placeholder strategy, or is it left ambiguous? [Assumption, Spec §Assumptions] — Resolved: Assumptions updated. "New" badge as concrete placeholder.
- [x] CHK035 - Is the assumption that `Linking.openURL` works reliably for all meeting platforms (Google Meet, Zoom, Jitsi) on both iOS and Android validated? [Assumption, Spec §FR-007] — Resolved: Assumptions updated. Fallback to copyable text on failure.

## Notes

- All 35 items resolved on 2026-03-05
- Key design change: removed `leave_teacher_session` RPC — counter resets on offline/timeout instead
- 7 new functional requirements added (FR-004a, FR-015 through FR-019)
- Spec, data-model, contracts, quickstart, research, and plan all updated for consistency
