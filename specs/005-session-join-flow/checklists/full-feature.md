# Full Feature Requirements Quality Checklist: Session Join Flow

**Purpose**: Validate completeness, clarity, consistency, and measurability of all requirements across UX flows, data model, security, realtime, deep linking, queue, and notifications.
**Created**: 2026-03-02
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)
**Reviewed**: 2026-03-02 — all gaps resolved in spec.md

## Requirement Completeness

- [x] CHK001 - Are requirements defined for the available-teachers screen layout (list vs grid, sort order, empty state)? [Gap] → Resolved: FR-001 now specifies vertical scrollable list, sorted by highest rating first. US1-AS1 includes sort order.
- [x] CHK002 - Are requirements specified for what happens when a student taps "Join Session" but `Linking.openURL()` fails (meeting app not installed, invalid URL scheme)? [Gap, Edge Case] → Resolved: New edge case added — copy-to-clipboard fallback, draft session still created.
- [x] CHK003 - Is the daily session count increment timing specified — before or after the meeting link opens successfully? [Completeness, Spec §FR-004] → Resolved: FR-004 now specifies "incremented when the draft session is created (before the meeting link opens)."
- [x] CHK004 - Are requirements documented for how `current_session_count` on teacher_availability is decremented (on session complete, cancel, AND expire)? [Completeness, Spec §FR-013] → Resolved: FR-013 now explicitly states "decremented on session complete, cancel, AND expire."
- [x] CHK005 - Are requirements specified for the queue "estimated wait time" calculation method? [Gap, Spec §FR-005] → Resolved: FR-005 now specifies "average session duration for the program divided by expected teacher availability."
- [x] CHK006 - Are requirements defined for what the student sees after claiming a queue slot — direct meeting link open or intermediate confirmation screen? [Gap, Spec §US2 AS3] → Resolved: US2-AS3 now specifies queue-claim screen with countdown + "Claim & Join" button → JoinSessionFlow.
- [x] CHK007 - Are requirements specified for the post-session prompt dismissal behavior (can it be dismissed, does it persist across app restarts, does it expire)? [Gap, Spec §FR-009] → Resolved: FR-009 now specifies dismissible, persists across restarts, disappears when session transitions from draft.
- [x] CHK008 - Are loading and error states defined for the deep link session-join screen (fetching teacher data, teacher not found, network error)? [Gap, Spec §FR-008] → Resolved: FR-008 now lists all screen states: loading spinner, teacher not available, invalid link, network error with retry.
- [x] CHK009 - Are requirements defined for how the "Notify teachers" mechanism (FR-011) is triggered — on each queue join, only when threshold is first crossed, or periodically? [Completeness, Spec §FR-011] → Resolved: FR-011 now specifies "triggered once when threshold is first crossed, resets when queue drops below."

## Requirement Clarity

- [x] CHK010 - Is "configurable daily session limit" clarified — who configures it, where (program settings JSONB), and what the UI for configuration looks like? [Clarity, Spec §FR-004] → Resolved: FR-004 now specifies "configured via programs.settings JSONB by program admins." No new config UI in this feature — uses existing settings.
- [x] CHK011 - Is "the student's queue position" display format specified — ordinal number, "X people ahead of you", progress bar? [Clarity, Spec §FR-005] → Resolved: FR-005 now specifies "You are #N in line" format. US2-AS1 updated to match.
- [x] CHK012 - Is "post-session prompt" trigger condition precisely defined — any AppState 'active' event with a draft session, or only after a minimum elapsed time? [Clarity, Spec §FR-009] → Resolved: FR-009 and US4-AS1 now specify "AppState becomes 'active' and draft session created more than 5 minutes ago."
- [x] CHK013 - Is "languages spoken" on the teacher card (FR-001) source specified — where does this data come from on the profiles table? [Clarity, Spec §FR-001] → Resolved: FR-001 now specifies "from the profiles.languages field."
- [x] CHK014 - Is the deep link format `werecitetogether://session/join` mapped to a specific Expo Router file path, and is the routing behavior for non-student roles defined? [Clarity, Spec §FR-007] → Resolved: FR-008 now specifies non-student roles redirected to home with toast. Route mapping documented in contracts.

## Requirement Consistency

- [x] CHK015 - Are the session status values consistent between the spec (draft → in_progress → completed → expired) and the data model migration CHECK constraint? [Consistency, Spec §Key Entities vs data-model.md] → Already consistent: both include draft, in_progress, completed, cancelled, expired.
- [x] CHK016 - Does the "daily limit" definition in FR-004 ("2 sessions/day") count only completed sessions, or also draft/in_progress/expired? [Consistency, Spec §FR-004 vs §FR-013] → Resolved: FR-004 now specifies "all session creations (draft, in_progress, completed) count — expired/cancelled also count to prevent gaming."
- [x] CHK017 - Is the queue claim flow consistent between US2-AS3 (app opens directly to join flow) and the queue-processor edge function (routes to `/(student)/queue-claim`)? [Consistency, Spec §US2 vs contracts] → Resolved: US2-AS3 now specifies the queue-claim screen as an intermediate step before JoinSessionFlow, consistent with the edge function routing.
- [x] CHK018 - Are the queue notification strings consistent between the spec ("A teacher is now available! Tap to join.") and the existing queue-processor edge function ("A teacher is available!")? [Consistency, Spec §US2 vs edge function] → Accepted: minor string difference is an implementation detail. Edge function strings can be updated during implementation.

## Acceptance Criteria Quality

- [x] CHK019 - Is SC-005 ("no single student monopolizes teacher time") measurable as written, or does it need a quantified threshold? [Measurability, Spec §SC-005] → Resolved: SC-005 rewritten to "No student may exceed the daily session limit (default: 2) while other students are waiting in the queue."
- [x] CHK020 - Can SC-002 ("90% success rate on first attempt") be measured without analytics instrumentation — are analytics requirements documented? [Measurability, Spec §SC-002] → Accepted: SC-002 is a target metric. FR-010 (meeting_link_used recording) provides the data foundation. Analytics dashboard is out of scope for this feature.
- [x] CHK021 - Is SC-006 ("80% of completed sessions have teacher-logged outcome") achievable given that post-session logging is out of scope (teacher-side UI already exists)? [Measurability, Spec §SC-006 vs Scope] → Accepted: teacher logging UI already exists (out-of-scope section). SC-006 measures combined system effectiveness, not just this feature.

## Scenario Coverage

- [x] CHK022 - Are requirements defined for what a student sees if they are enrolled in a "structured" or "mixed" program (not "free") — is the available-teachers screen restricted to free programs only? [Coverage, Spec §US1] → Resolved: FR-001 now specifies "only shown for programs with category = 'free'."
- [x] CHK023 - Are requirements specified for the teacher-side experience when a student joins (does the teacher see a notification, updated student count, or nothing)? [Coverage, Gap] → Accepted: teacher sees their current_session_count update in realtime (existing realtime subscription on teacher_availability). No additional teacher notification for individual student joins — teacher-side UI already exists and is out of scope.
- [x] CHK024 - Are requirements defined for the scenario where a student has a draft session AND is in the queue simultaneously? [Coverage, Gap] → Resolved: US2-AS1 now specifies "Notify Me" button is hidden if the student has an active draft session.
- [x] CHK025 - Are requirements specified for app behavior when a deep link arrives while the student is already in an active session? [Coverage, Spec §FR-007] → Resolved: New edge case added — "You already have an active session" with options to view current or proceed.

## Edge Case Coverage

- [x] CHK026 - Are requirements defined for the race condition where teacher toggles offline between the student viewing the list and tapping "Join Session" (beyond the generic edge case)? [Edge Case, Spec §Edge Cases] → Already covered: existing edge case handles this. Server-side availability check during session creation prevents stale joins.
- [x] CHK027 - Is behavior defined for when the 3-minute queue claim window expires while the student is mid-claim (network delay)? [Edge Case, Spec §US2 AS3] → Resolved: New edge case added — server returns error, student sees "This offer has expired" with rejoin option.
- [x] CHK028 - Are requirements specified for queue position recalculation when a student ahead leaves or their entry expires? [Edge Case, Spec §FR-012] → Resolved: FR-005 now specifies "positions are calculated dynamically based on joined_at ordering, not stored ordinals."
- [x] CHK029 - Is behavior defined for draft session expiry when the teacher has already started logging the session outcome? [Edge Case, Spec §FR-013] → Resolved: FR-013 now specifies "Only sessions with status 'draft' are eligible — sessions in 'in_progress' are not expired." New edge case also added.

## Non-Functional Requirements

- [x] CHK030 - Are accessibility requirements specified for the available-teachers list, queue status, and countdown timer (screen reader labels, contrast, touch targets)? [Accessibility, Gap] → Resolved: NFR-001 added — 44pt touch targets, accessible labels for screen readers.
- [x] CHK031 - Are RTL layout requirements explicitly called out for new screens (available-teachers browser, queue-claim, session-join), given the app supports Arabic? [Accessibility, Gap] → Resolved: NFR-002 added — logical CSS properties per Constitution Principle V.
- [x] CHK032 - Are offline/poor-connectivity requirements defined for the join flow (what happens if realtime subscription drops)? [Reliability, Gap] → Resolved: NFR-003 added — falls back to 30s polling, network error with retry button.
- [x] CHK033 - Are requirements specified for the expire-draft-sessions scheduled function's execution frequency and failure handling? [Reliability, data-model.md] → Resolved: FR-013 now specifies "runs every 15 minutes; if it fails, stale drafts remain until next successful run."

## Dependencies & Assumptions

- [x] CHK034 - Is the assumption "JoinSessionFlow bottom sheet already exists" validated against current codebase — does it support all the behaviors FR-002 requires (daily limit check, meeting link protection)? [Assumption, Spec §Assumptions] → Resolved: Assumptions section now clarifies "needs enhancement to add daily limit checking and daily count increment — they do not currently enforce FR-004."
- [x] CHK035 - Is the assumption that `programs.settings` JSONB already contains the configurable keys (`max_daily_free_sessions`, `queue_expiry_minutes`, etc.) validated? [Assumption, data-model.md] → Resolved: NFR-004 added — code falls back to hardcoded defaults if JSONB keys are missing.

## Notes

- All 35/35 items resolved
- 6 new edge cases added to spec
- 4 new non-functional requirements added (NFR-001 through NFR-004)
- FR-001, FR-004, FR-005, FR-008, FR-009, FR-011, FR-013 updated with gap resolutions
- SC-005 rewritten for measurability
- Spec is ready for `/speckit.tasks`
