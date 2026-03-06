# Specification Quality Checklist: Himam Quranic Marathon Events

**Purpose**: Validate requirements completeness, clarity, and consistency across spec, data model, and API contracts before implementation
**Created**: 2026-03-06
**Feature**: [spec.md](../spec.md), [data-model.md](../data-model.md), [contracts/himam-api.md](../contracts/himam-api.md)

## Requirement Completeness

- [x] CHK001 - Are requirements defined for what students see when no upcoming event exists (zero-state)? [Gap] — Added US1 scenario 5 + FR-001 zero-state message
- [x] CHK002 - Are requirements specified for the supervisor's ability to cancel an event after registrations exist? [Gap, Spec §FR-010] — Added FR-019 + US4 scenario 6 + cancel_himam_event RPC
- [x] CHK003 - Is the behavior documented for what happens to paired registrations when a supervisor cancels an active event? [Gap, Spec §Edge Cases] — Added cancellation cascade in data-model.md + FR-019: only upcoming events can be cancelled
- [x] CHK004 - Are requirements defined for the "partner absent" scenario mentioned in edge cases, including how solo progress is tracked? [Completeness, Spec §Edge Cases] — Clarified: partner can mark juz solo, completion applies to both registrations. No separate "absent" status.
- [x] CHK005 - Are loading/empty state requirements specified for all Himam screens (event list, progress, history)? [Gap] — Added FR-018 for loading indicators and contextual empty state messages
- [x] CHK006 - Are requirements documented for how the student dashboard Himam card integrates with the existing dashboard? [Gap, Spec §US5] — Clarified US5 scenario 2: "Himam card widget added alongside existing widgets"
- [x] CHK007 - Is the notification content (title, body, deep-link target) specified for both `himam_event_reminder` and `himam_partner_assigned` categories? [Completeness, Spec §FR-006, §FR-013] — Added exact title/body/deep-link in FR-006 and FR-013

## Requirement Clarity

- [x] CHK008 - Is "compatible time slot preferences" in FR-004 quantified with a specific matching threshold (e.g., minimum 1 overlapping slot, majority overlap)? [Ambiguity, Spec §FR-004] — Clarified FR-004: "at least one overlapping prayer-time block"
- [x] CHK009 - Is the exact registration deadline time unambiguous — does "Friday midnight Makkah time" mean Friday 23:59:59 or Saturday 00:00:00? [Clarity, Spec §FR-014] — Clarified to "Saturday 00:00:00 Makkah time (end of Friday)" throughout spec, data model, and contracts
- [x] CHK010 - Is the prayer-time block "Night" clearly defined with a time range or position relative to Isha? [Clarity, Spec §Assumptions] — Added to Assumptions: "Night (الليل — the period after Isha until Fajr)" + prayer-time table in data-model.md
- [x] CHK011 - Are the specific juz validation rules (count matches track, range 1-30, no duplicates) documented in the spec's functional requirements or only in the contracts? [Clarity, Spec §FR-002] — Added validation rules to FR-002 and US1 scenario 2
- [x] CHK012 - Is the "completion celebration" in US3 acceptance scenario 3 defined with specific UX requirements? [Ambiguity, Spec §US3] — Defined as "brief success animation (progress bar fills to 100% with a checkmark) and a 'Completed' status badge"

## Requirement Consistency

- [x] CHK013 - Are the registration status values consistent between spec (§Key Entities), data model, and API contracts? [Consistency] — Verified: all three use {registered, paired, in_progress, completed, incomplete, cancelled}
- [x] CHK014 - Is the event status lifecycle consistent between spec (§FR-009), data model (state machine), and research (§R5)? [Consistency] — Verified: all use {upcoming, active, completed, cancelled} with same transitions
- [x] CHK015 - Does the data model's `cancelled` event status align with spec edge cases and FR-010's "cancel, skip, or create" language? [Consistency, Spec §FR-010] — Yes, FR-010 + FR-019 + data model Event Cancellation Cascade section all align
- [x] CHK016 - Is the "either partner marks completion" rule consistently reflected in spec (§FR-007), data model (RLS policies), and contracts (mark_juz_complete)? [Consistency] — Verified: FR-007 states it, RLS allows partner update, RPC handles cross-registration update
- [x] CHK017 - Are the prayer-time block labels consistent between spec assumptions, data model, and contracts (same set: fajr, dhuhr, asr, maghrib, isha, night)? [Consistency] — Verified: all use same 6 labels. Data model now has bilingual table.

## Acceptance Criteria Quality

- [x] CHK018 - Can SC-002 ("pairing completes within 30 seconds") be objectively measured given the pairing may be triggered by pg_cron or supervisor action? [Measurability, Spec §SC-002] — Clarified: "measured from trigger (supervisor button press or cron invocation) to all pairs updated in the database"
- [x] CHK019 - Can SC-004 ("90% of paired participants log at least one juz completion") be tracked without analytics infrastructure requirements being specified? [Measurability, Spec §SC-004] — Clarified: "measured by querying himam_progress records with status = 'completed' per event"
- [x] CHK020 - Are acceptance scenarios for US2 (pairing) testable independently given pairing depends on registration (US1) completing first? [Acceptance Criteria, Spec §US2] — Added to US2 Independent Test: "Depends on US1 (registration) being complete"

## Scenario Coverage

- [x] CHK021 - Are requirements defined for what happens when a student is registered but unpaired when the event activates (Saturday Fajr)? [Coverage, Gap] — Added to Edge Cases + FR-009: "Unpaired registrations remain in 'registered' status at activation"
- [x] CHK022 - Are requirements specified for re-registration — can a student register again after cancelling within the same event? [Coverage, Spec §FR-014] — Added to FR-014 and Edge Cases: "Re-registration for the same event is allowed if still before the deadline"
- [x] CHK023 - Are requirements defined for concurrent juz marking — what if both partners mark the same juz simultaneously? [Coverage, Gap] — Added US3 scenario 5 + FR-007: "idempotent — first write succeeds, second is a no-op" + Concurrency section in data-model.md
- [x] CHK024 - Are alternate flow requirements specified for the supervisor adjusting pairings after the event has already started? [Coverage, Spec §US4] — Added US4 scenario 4: "Pairing adjustments are NOT allowed after the event becomes active" + FR-005
- [x] CHK025 - Are requirements documented for what the student sees on the progress screen if the event is not yet active (paired but before Saturday Fajr)? [Coverage, Gap] — Added US2 scenario 5: "partner info, juz list (read-only, not markable), and a countdown to event start"

## Edge Case Coverage

- [x] CHK026 - Is the "trio" resolution for odd registrations (mentioned in US2 scenario 3) defined with specific requirements for how a three-person group tracks progress? [Edge Case, Spec §US2] — Clarified: "Trios are not supported; the supervisor must reassign the odd student to another track or manually pair them" in US2 + FR-015
- [x] CHK027 - Are requirements specified for the 30_juz track where selected_juz must be all 30 — is the juz picker simplified or skipped? [Edge Case, Spec §FR-002] — Added to US1 scenario 2 + FR-002: "For the 30_juz track, all 30 juz are auto-selected and the juz picker is skipped"
- [x] CHK028 - Is the behavior defined when both partners have meeting links — which one is shown, and can they change it? [Edge Case, Spec §Edge Cases] — Updated Edge Cases + FR-016: "Both partners' meeting links are displayed. Either partner can choose which link to use"
- [x] CHK029 - Are requirements defined for what happens when a student is enrolled in Himam but has no meeting_link on their profile? [Edge Case, Gap] — Added to Edge Cases: "Registration form prompts to add link, not blocked but warning shown"
- [x] CHK030 - Is the behavior specified for events that span a daylight saving time change in the Makkah timezone (noting Arabia Standard Time does not observe DST)? [Edge Case, Spec §FR-017] — Clarified in Edge Cases + FR-017: "Arabia Standard Time, UTC+3, no DST"

## Non-Functional Requirements

- [x] CHK031 - Are scalability requirements specified for the expected number of concurrent participants during a marathon event day? [Gap] — Added NFR-001: "up to 500 concurrent participants during a single marathon event day"
- [x] CHK032 - Are data retention requirements defined for past event data (how long are completed events and progress records kept)? [Gap] — Added NFR-002: "retained indefinitely to support historical reporting"
- [x] CHK033 - Are accessibility requirements documented for the juz picker, time slot selector, and progress tracker components? [Gap] — Added NFR-005: "standard React Native accessibility practices (accessible labels, touch targets >= 44pt)"
- [x] CHK034 - Are bilingual (AR/EN) requirements specified for track names, prayer-time labels, and status badges beyond the general i18n assumption? [Completeness, Spec §Assumptions] — Added NFR-003 with specific examples: track names, prayer-time labels, status badges
- [x] CHK035 - Are offline/poor-connectivity requirements defined for marking juz completion during the marathon? [Gap] — Added NFR-004: "optimistic updates — UI reflects change immediately, reverts on failure"

## Dependencies & Assumptions

- [x] CHK036 - Is the assumption that `profiles.meeting_link` exists validated against the actual 004-teacher-availability migration scope (was it added to all profiles or only teachers)? [Assumption] — Validated: migration 00006 adds `meeting_link` to `profiles` table (all users, not restricted to teachers). Updated Assumptions to clarify.
- [x] CHK037 - Is the dependency on the Himam program existing in the `programs` table validated with specific seed data expectations (program name, category, tracks)? [Assumption] — Updated Assumptions with specific seed data: name "Himam Quranic Marathon" / "برنامج همم القرآني", category "structured", 5 tracks
- [x] CHK038 - Is the dependency on push notification infrastructure documented with specific category registration requirements? [Dependency] — Updated Assumptions to reference `send-notification` Edge Function and `DIRECT_CATEGORIES` pattern
- [x] CHK039 - Are the pg_cron and pg_net extension availability assumptions documented as infrastructure prerequisites? [Assumption] — Added to Assumptions: "pg_cron and pg_net PostgreSQL extensions are available (already used by 006-teacher-availability and 008-ratings-queue)"

## Notes

- All 39 items resolved via spec, data model, and contract updates
- Key additions: FR-018 (loading/empty states), FR-019 (event cancellation cascade), NFR-001 through NFR-005, cancel_himam_event RPC
- No outstanding items remain
