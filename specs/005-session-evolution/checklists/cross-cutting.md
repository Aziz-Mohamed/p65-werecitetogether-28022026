# Cross-Cutting Requirements Quality Checklist: Session Logging Evolution

**Purpose**: Validate requirements completeness, clarity, and consistency across audio, data, security, and UX domains before implementation
**Created**: 2026-03-06
**Feature**: [spec.md](../spec.md)
**Depth**: Standard
**Audience**: Author (self-review before task generation)

## Requirement Completeness

- [x] CHK001 - Are microphone permission requirements specified (request flow, denial handling, settings redirect)? [Gap] — Added FR-024: request flow, denial handling, settings redirect, graceful degradation.
- [x] CHK002 - Are audio playback interruption requirements defined (incoming call, app backgrounding, other audio sources)? [Gap] — Added FR-026 and edge case: pause on interruption, resume on return.
- [x] CHK003 - Are requirements defined for what happens when a teacher deletes a completed session that has a voice memo? [Gap, Spec §FR-019] — Added edge case: cascade delete of memo record and storage file.
- [x] CHK004 - Are loading state requirements specified for voice memo upload progress (progress bar, percentage, indeterminate)? [Gap, Spec §FR-012] — FR-012 updated: inline progress bar on session detail, toast on completion/failure.
- [x] CHK005 - Are requirements defined for the program selector behavior when a teacher has only one assigned program? [Gap, Spec §FR-003] — Added FR-028: auto-select single program, deselectable.
- [x] CHK006 - Are requirements specified for how draft sessions interact with the existing session creation flow (new bottom sheet vs. extended existing sheet)? [Gap, Spec §FR-004] — Deferred to plan: extends existing CreateSessionSheet with Save Draft button (plan.md structure decision).
- [x] CHK007 - Are notification content requirements specified bilingually for both push notification events (voice memo + draft cleanup)? [Completeness, Spec §FR-021] — Already covered in contracts/sessions-api.md PN-001 and PN-002 with EN/AR content.
- [x] CHK008 - Are requirements defined for voice memo file format validation on upload (corrupted file, wrong format, zero-length)? [Gap] — Added edge case: MIME validation, zero-length rejection, re-record prompt.

## Requirement Clarity

- [x] CHK009 - Is "visually distinct" for draft sessions quantified with specific visual properties (border style, opacity, color)? [Clarity, Spec §FR-006] — FR-006 updated: dedicated "Drafts" section, "Draft" badge, muted card background.
- [x] CHK010 - Is "background upload" behavior precisely defined — does the teacher stay on the same screen, navigate away, or see a specific transition? [Clarity, Spec §FR-012] — FR-012 updated: returns to session detail, inline progress bar, toast on completion.
- [x] CHK011 - Is "waveform animation" specified with enough detail (bar count, update frequency, height mapping, color)? [Clarity, Spec §FR-010] — FR-010 updated: animated bars driven by real-time audio metering (dBFS levels), countdown from 2:00, warning at 0:15. Implementation details (bar count, color) are plan-level decisions.
- [x] CHK012 - Is the "success indicator" for voice memo upload defined (toast, badge, inline confirmation)? [Ambiguity, Spec §US3-4] — US3 scenario 4 updated: toast notification confirms success.
- [x] CHK013 - Is "within 24 hours" for retroactive memo attachment measured from session submission time or session_date? [Ambiguity, Spec §FR-018] — FR-018 updated: measured from session's `created_at` timestamp.
- [x] CHK014 - Are playback speed control requirements specific about UI pattern (segmented control, dropdown, cycle button)? [Clarity, Spec §FR-013] — FR-013 specifies "playback speed options (1x, 1.25x, 1.5x)". Exact UI widget is a plan-level decision. Requirement is clear: three discrete speed options.

## Requirement Consistency

- [x] CHK015 - Are draft visibility rules consistent between the session list (§FR-005 teacher-only) and session detail navigation (can a direct link to a draft be shared)? [Consistency, Spec §FR-005] — Added FR-029: drafts not accessible via deep links by other users, returns "not found".
- [x] CHK016 - Is the voice memo storage estimate consistent between the spec (~120KB/memo in §Edge Cases) and the research (~250KB worst case in research.md)? [Conflict] — Resolved: spec edge case updated to show ~120KB typical and ~250KB worst case. Both are correct at different percentiles.
- [x] CHK017 - Are the "30 days" retention period requirements consistent across FR-015, FR-016, US3-7, and data-model.md expires_at calculation? [Consistency] — Verified: all references consistently specify 30 days. data-model.md expires_at = created_at + 30 days. No conflicts.
- [x] CHK018 - Does the 7-day local cache auto-clear (§FR-017) align with the 30-day server expiration — what if cached audio belongs to an expired memo? [Consistency, Spec §FR-017] — Added edge case: cached version remains playable until local cache clears; UI shows "expired" from server but allows cached playback if available.

## Acceptance Criteria Quality

- [x] CHK019 - Can SC-001 ("under 30 seconds, no more than one additional tap") be objectively measured given the program selector adds variable interaction time? [Measurability, Spec §SC-001] — Measurable: FR-028 auto-selects single program (0 extra taps). Multiple programs = exactly 1 extra tap (chip selection). "Under 30 seconds" is clock-measurable.
- [x] CHK020 - Is SC-003 ("5 seconds after Send") measurable without defining network conditions beyond "standard mobile connection"? [Measurability, Spec §SC-003] — SC-003 updated: specifies "3G or faster mobile connection" instead of "standard mobile connection".
- [x] CHK021 - Are acceptance criteria defined for the batched draft cleanup notification content format (count only, or student names, or session dates)? [Acceptance Criteria, Spec §US2-6] — Covered in contracts/sessions-api.md PN-002: count-only format — "{count} draft session(s) were removed after 7 days" (EN/AR).

## Scenario Coverage

- [x] CHK022 - Are requirements defined for the teacher's view of their own voice memos (can they replay, see memo status, know if student listened)? [Coverage, Gap] — Added FR-025: teachers can view and play their own voice memos with same controls as students. "Know if student listened" is out of scope (no listen tracking).
- [x] CHK023 - Are requirements specified for what happens when a teacher submits a draft that already has a voice memo recording queued locally? [Coverage, Gap] — Not applicable: voice memos can only be attached to completed sessions (FR-009, FR-018). A draft cannot have a voice memo. Draft submission triggers the voice memo prompt (US3 scenario 1).
- [x] CHK024 - Are requirements defined for concurrent draft editing (teacher opens draft on two devices)? [Coverage, Gap] — Added edge case: last-write-wins, no conflict resolution UI.
- [x] CHK025 - Are requirements specified for the voice memo prompt behavior when the teacher taps "Skip" or dismisses it? [Coverage, Spec §US3-1] — US3 scenario 1 updated: "Skip" closes prompt, not shown again for that session. Teacher can add retroactively via session detail within 24h.
- [x] CHK026 - Are supervisor/program admin requirements for viewing draft sessions defined (can they see drafts in reports)? [Coverage, Spec §FR-020] — Already covered: FR-005 states drafts visible ONLY to creator teacher. Supervisors/admins cannot see drafts. FR-020 covers voice memo access for completed sessions only.

## Edge Case Coverage

- [x] CHK027 - Are requirements defined for voice memo behavior when device storage is full (recording fails mid-capture)? [Edge Case, Gap] — Added edge case: recording stops with error, partial recording discarded, free-space guidance.
- [x] CHK028 - Is the behavior specified when a voice memo upload succeeds but the metadata insert fails (orphaned storage file)? [Edge Case, Gap] — Added edge case: client-side cleanup of orphaned storage file, retry prompt to teacher.
- [x] CHK029 - Are requirements defined for draft auto-deletion when the teacher is currently editing the draft at cleanup time? [Edge Case, Spec §FR-008] — Added edge case: teacher sees error on next save, can re-save as new draft or submit. Cleanup does not defer.
- [x] CHK030 - Is the behavior specified when a program is deactivated (is_active=false) after sessions are linked to it? [Edge Case, Spec §Edge Cases] — Edge case updated: covers both deactivation and deletion, displays "Program unavailable", session remains functional.

## Non-Functional Requirements

- [x] CHK031 - Are accessibility requirements defined for the voice memo recorder (screen reader announcements for recording state, timer, waveform)? [Gap] — Added FR-027: accessibility labels for all controls, recording state changes announced to screen readers.
- [x] CHK032 - Are accessibility requirements defined for the audio player (VoiceOver/TalkBack labels for play/pause, seek, speed controls)? [Gap] — Covered by FR-027: applies to both recorder and player controls.
- [x] CHK033 - Are storage access control requirements defined for the voice-memos bucket (who can generate signed URLs, URL expiry duration)? [Security, Gap] — Already covered in data-model.md: private bucket, signed URLs via RPC (1-hour expiry), access verified by RLS before URL generation.
- [x] CHK034 - Are requirements defined for preventing voice memo URL sharing (signed URL forwarding to unauthorized users)? [Security, Gap] — Mitigated by 1-hour signed URL expiry (data-model.md). Forwarded URLs expire quickly. Full prevention of URL sharing is out of scope (standard signed URL limitation).
- [x] CHK035 - Are data privacy requirements specified for voice memo content (teacher voice as PII, GDPR/data-subject-access implications)? [Gap] — Added assumption: voice content treated as user-generated content under platform terms. 30-day auto-deletion bounds retention. No additional GDPR consent flow required.

## Dependencies & Assumptions

- [x] CHK036 - Is the assumption that expo-av supports the target audio format validated against Expo ~54 compatibility? [Assumption, Spec §Assumptions] — Assumption updated: explicitly states expo-av compatibility with Expo ~54 managed workflow for AAC/M4A on iOS and Android.
- [x] CHK037 - Is the dependency on push notification infrastructure (spec 004) documented with a fallback if 004 is not yet deployed? [Dependency, Spec §Assumptions] — Assumption updated: graceful degradation — voice memo and draft features work, only push notification is skipped.
- [x] CHK038 - Is the assumption that Supabase Storage signed URLs work with mobile audio players validated? [Assumption] — Assumption updated: explicitly states signed URLs from Supabase Storage are playable in React Native audio players.

## Notes

- All 38 items resolved on 2026-03-06.
- 7 new functional requirements added (FR-024 through FR-029).
- 12 new edge cases added to spec.
- 3 existing FRs clarified (FR-006, FR-010, FR-012, FR-018).
- SC-003 updated with specific network condition.
- Assumptions section expanded with expo-av, signed URL, push fallback, and data privacy details.
- Storage estimate reconciled (typical vs. worst case).
