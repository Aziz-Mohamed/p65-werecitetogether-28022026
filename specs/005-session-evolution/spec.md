# Feature Specification: Session Logging Evolution

**Feature Branch**: `005-session-evolution`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "005-session-evolution"
**Depends On**: 003-programs-enrollment
**Key Rule**: EXTEND existing sessions with nullable columns. Keep all current session features working.

---

## Clarifications

### Session 2026-03-06

- Q: How should draft sessions handle the student_id requirement? → A: Require student_id for drafts (partial = incomplete scores/notes only). A draft is a session with a known student but incomplete scoring data, not a placeholder without a student.
- Q: What should the session show after a voice memo expires? → A: Expired placeholder — session shows "Voice memo expired" with original recording date and duration metadata preserved. Audio file is deleted but the memo record remains.
- Q: Should the draft cleanup notification be per-draft or batched? → A: Batched — single notification with count of deleted drafts (e.g., "3 drafts removed"). Avoids notification spam when multiple drafts expire simultaneously.

---

## Context

WeReciteTogether's existing session logging system (from Quran School) supports teacher-student recitation sessions with scores (memorization, tajweed, recitation quality) and text notes. Sessions are tied to a school and optionally a class.

With the transition to a multi-program platform, sessions need to be contextualized by program, support a draft-then-submit workflow (so teachers can partially log during a session and finalize later), and include post-session voice memos — short teacher-recorded audio summaries of student corrections that extend the session's learning value beyond its live duration.

All changes are additive. Existing session features (create, view, list, filter, score) continue to work unchanged.

---

## User Scenarios & Testing

### User Story 1 — Teacher Logs Session with Program Context (Priority: P1)

A teacher finishes a session with a student and logs the outcome. The session is now linked to a specific program, giving administrators and supervisors visibility into which program the session belongs to. The teacher selects the program during session creation, and the session appears under that program's analytics.

**Why this priority**: Program-scoped sessions are the foundation for all downstream features (reports, ratings, certifications). Without program context, sessions cannot be attributed to specific programs.

**Independent Test**: Sign in as a teacher assigned to a program. Create a new session, select a program and student, enter scores and notes, submit. Verify the session is saved with the program reference. View the session detail and confirm program name is displayed.

**Acceptance Scenarios**:

1. **Given** a teacher assigned to one or more programs, **When** they create a new session, **Then** they see a program selector showing only their assigned programs and can select one. If the teacher is assigned to exactly one program, it is auto-selected (no extra tap required).
2. **Given** a teacher creating a session, **When** no program is selected, **Then** the session is still created successfully (program_id is optional for backward compatibility with school-only sessions).
3. **Given** a completed session with a program_id, **When** a student or supervisor views the session detail, **Then** the program name is displayed alongside existing session info.
4. **Given** a session list view, **When** sessions are displayed, **Then** each session shows its associated program name (if any) alongside existing metadata.

---

### User Story 2 — Teacher Uses Draft Workflow (Priority: P2)

During or immediately after a live session, a teacher starts logging scores but isn't ready to finalize. They save the session as a draft, return later (within the same day or next day), and complete it. Draft sessions are only visible to the teacher who created them and are clearly marked as incomplete.

**Why this priority**: Teachers often need to log sessions in two steps — quick entry during class, then detailed scoring later. Without drafts, teachers either delay logging entirely (leading to forgotten sessions) or rush through inaccurate scores.

**Independent Test**: Sign in as a teacher. Start creating a session, fill in the student and one score, save as draft. Navigate away. Return to the sessions list, find the draft (visually distinct), tap it, add remaining scores and notes, submit as final. Verify draft disappears from draft state and appears as a completed session.

**Acceptance Scenarios**:

1. **Given** a teacher creating a session, **When** they tap "Save Draft", **Then** the session is saved with status "draft" and appears in their session list with a draft indicator.
2. **Given** a teacher with draft sessions, **When** they open their session list, **Then** drafts appear in a dedicated "Drafts" section at the top with a "Draft" badge on each card and a muted card background, visually separate from completed sessions.
3. **Given** a draft session, **When** the teacher opens it, **Then** all previously entered data is pre-filled and they can edit any field.
4. **Given** a draft session, **When** the teacher taps "Submit", **Then** the session status changes to "completed" and it becomes visible to students, parents, and supervisors.
5. **Given** a draft session, **When** a student or parent views their session list, **Then** draft sessions are NOT visible — only completed sessions appear.
6. **Given** one or more draft sessions older than 7 days, **When** the system runs its cleanup, **Then** the drafts are auto-deleted and the teacher receives a single batched push notification with the count of deleted drafts (e.g., "3 draft sessions were removed"), if they have push notifications enabled.

---

### User Story 3 — Teacher Records Post-Session Voice Memo (Priority: P3)

After submitting a session, the teacher records a short voice memo (up to 2 minutes) summarizing the student's key mistakes and corrections. The student can replay this voice memo anytime from the session detail screen, reinforcing what they learned.

**Why this priority**: Voice memos significantly extend session value beyond live duration. Competitor apps (Moddakir, Quran Mobasher) offer session recordings; since sessions happen on external platforms, a focused teacher voice memo provides equivalent or greater value with minimal storage cost.

**Independent Test**: Sign in as a teacher. Submit a session. See the "Record voice memo" prompt. Tap and hold to record (up to 2 minutes). Preview the recording, confirm. Sign in as the student from that session. Open the session detail. See and play back the voice memo with play/pause and seek controls.

**Acceptance Scenarios**:

1. **Given** a teacher who just submitted a session, **When** the submission completes, **Then** the app offers "Record a voice memo for [student name]?" with a record button and a "Skip" dismiss option. If the teacher taps "Skip", the prompt closes and is not shown again for that session.
2. **Given** a teacher recording a voice memo, **When** they press and hold the record button, **Then** a waveform visualization (animated bars driven by real-time audio metering) shows recording activity alongside a countdown timer counting down from 2:00.
3. **Given** a completed recording, **When** the teacher releases the button, **Then** they can preview the playback, then choose "Send" or "Re-record".
4. **Given** a teacher taps "Send", **When** the upload begins, **Then** the teacher is returned to the session detail screen (not blocked), an inline progress bar shows upload status, and a toast notification confirms success when the upload completes.
5. **Given** a student whose session has a voice memo, **When** they open the session detail, **Then** they see an audio player with play/pause, seek bar, and playback speed options (1x, 1.25x, 1.5x).
6. **Given** a session card in a list, **When** the session has an attached voice memo, **Then** a microphone icon indicator is visible on the card.
7. **Given** a voice memo is uploaded, **When** 30 days have passed since creation, **Then** the recording file is automatically deleted from storage, the memo metadata (recording date, duration) is preserved, and the student sees "Voice memo expired" with the original recording date and duration in the session detail.
8. **Given** a student plays a voice memo, **When** the audio loads, **Then** it is cached locally for offline playback (cache auto-clears after 7 days).

---

### User Story 4 — Teacher Attaches Voice Memo to Existing Session (Priority: P4)

A teacher who forgot to record a voice memo immediately after a session can return to any of their recent sessions (within 24 hours) and attach a voice memo retroactively.

**Why this priority**: Not all teachers will record immediately. Allowing retroactive attachment within a reasonable window ensures adoption isn't blocked by workflow timing.

**Independent Test**: Sign in as a teacher. View a completed session from earlier today that has no voice memo. Tap "Add voice memo". Record, preview, send. Verify the memo appears on the session detail for both teacher and student.

**Acceptance Scenarios**:

1. **Given** a teacher viewing a completed session less than 24 hours old with no voice memo, **When** they open the session detail, **Then** they see an "Add voice memo" button.
2. **Given** a teacher viewing a completed session more than 24 hours old, **When** they open the session detail, **Then** the "Add voice memo" option is not available.
3. **Given** a session that already has a voice memo, **When** the teacher views the session detail, **Then** they can play the existing memo but cannot replace it (one memo per session).

---

### Edge Cases

- **Network loss during voice memo upload**: Upload retries automatically when connection resumes. If the app is killed during upload, the recording is preserved locally and the teacher can retry from the session detail.
- **Teacher records beyond 2-minute limit**: Recording auto-stops at exactly 2 minutes with a warning at 1:45.
- **Draft with incomplete scores**: A draft requires a student_id (the teacher must select the student upfront). "Partial" means incomplete scores or notes, not a missing student. This simplifies the data model and prevents orphan drafts.
- **Multiple drafts for same student**: Allowed — teacher may have separate draft sessions for different programs or dates.
- **Voice memo storage quota**: Typical memo size is ~120KB (AAC, speech content). Worst-case for a full 2-minute recording at higher bitrate is ~250KB. With 30-day auto-deletion, storage remains bounded. Even 10,000 sessions/month uses only ~1.2–2.5GB rolling.
- **Offline session creation**: Sessions can be created offline with scores/notes. Voice memo recording requires connectivity for upload but the recording itself can happen offline and queue for upload.
- **Program deleted or deactivated after session created**: Session retains its program_id. If the program is deactivated (is_active = false) or deleted, the session displays "Program unavailable" in place of the program name. The session itself remains fully functional.
- **Backward compatibility**: Sessions created without a program_id (pre-evolution sessions) continue to display and function exactly as before. The program_id column is nullable.
- **Microphone permission denied**: If the user denies microphone access, the voice memo recording UI is hidden. An explanation message and a "Open Settings" button are shown in its place. No recording-related features are offered until permission is granted.
- **Audio playback interruption**: If an incoming call, notification, or app backgrounding interrupts voice memo playback, the player pauses at the current position. When the user returns, playback can be resumed from where it stopped.
- **Session deletion cascades to voice memo**: If a completed session is deleted (by admin or teacher), the associated voice memo record and storage file are automatically deleted (cascade). No orphaned files remain.
- **Corrupted or invalid audio file**: If the uploaded file fails MIME type validation or is zero-length, the upload is rejected with an error message prompting the teacher to re-record. The session remains without a voice memo.
- **Device storage full during recording**: If the device runs out of storage during recording, the recording stops with an error message. Any partial recording is discarded. The teacher is advised to free space and try again.
- **Upload succeeds but metadata insert fails**: If the storage upload completes but the database insert for voice memo metadata fails, the orphaned storage file is cleaned up automatically (client-side delete on failure). The teacher sees an error and can retry.
- **Draft deleted during active editing**: If the 7-day cleanup runs while a teacher has a draft open for editing, the teacher sees an error on next save attempt ("Draft no longer exists"). The teacher can re-save as a new draft or submit as completed. The cleanup job does not lock or defer — last-write-wins semantics.
- **Concurrent draft editing (multi-device)**: If a teacher edits the same draft on two devices, last-write-wins. No conflict resolution UI. The most recent save overwrites the previous one.
- **Cached voice memo vs. expired memo**: If a student has a voice memo cached locally (7-day cache) but the server memo has expired (30 days), the cached version remains playable until the local cache clears. The UI shows "Voice memo expired" from the server but allows cached playback if available.
- **Voice memo prompt skip/dismiss**: If the teacher dismisses the post-session voice memo prompt ("Skip"), it closes and is not shown again for that session. The teacher can still add a memo retroactively within 24 hours via the session detail screen.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow teachers to optionally associate a session with a program when creating or editing a session.
- **FR-002**: System MUST display the associated program name on session detail and list views when a program_id is present.
- **FR-003**: The program selector during session creation MUST show only programs the teacher is assigned to (via program_roles).
- **FR-004**: System MUST support a "draft" session status alongside the existing completed state.
- **FR-005**: Draft sessions MUST be visible only to the teacher who created them.
- **FR-006**: Draft sessions MUST appear in a dedicated "Drafts" section at the top of the teacher's session list, with a "Draft" badge and muted card background to distinguish them from completed sessions.
- **FR-007**: Teachers MUST be able to resume editing and submit a draft session at any time.
- **FR-008**: System MUST auto-delete draft sessions older than 7 days.
- **FR-009**: System MUST allow teachers to record audio voice memos of up to 2 minutes per session.
- **FR-010**: Voice memo recording MUST show animated bars driven by real-time audio metering (dBFS levels) and a countdown timer from 2:00. A warning MUST appear at 0:15 remaining.
- **FR-011**: Teachers MUST be able to preview a recording before sending, and choose to re-record.
- **FR-012**: After tapping "Send", the teacher MUST be returned to the session detail screen immediately. Upload proceeds in the background with an inline progress indicator. A toast notification confirms completion or reports failure with a retry option.
- **FR-013**: Students MUST be able to play back voice memos from the session detail screen with play/pause, seek, and playback speed controls (1x, 1.25x, 1.5x).
- **FR-014**: Session cards in list views MUST show a microphone indicator when a voice memo is attached.
- **FR-015**: Voice memo files MUST be automatically deleted from storage after 30 days.
- **FR-016**: Students MUST see a notice that voice memos are available for 30 days.
- **FR-017**: Played voice memos MUST be cached locally for offline playback (cache auto-clears after 7 days).
- **FR-018**: Teachers MUST be able to attach a voice memo to a completed session within 24 hours of the session's `created_at` timestamp (i.e., when the session was first saved, whether as draft or completed).
- **FR-019**: Each session MUST have at most one voice memo (one-to-one relationship).
- **FR-020**: Supervisors and program admins MUST be able to listen to voice memos within their assigned programs (quality oversight). RLS policies enforce this access. UI for supervisor/program_admin session detail screens depends on spec 007-admin-roles; until those route groups exist, this requirement is satisfied at the data access layer only.
- **FR-021**: The system MUST send a push notification to the student when a voice memo is attached to their session.
- **FR-022**: All existing session creation, viewing, filtering, and scoring features MUST continue to work unchanged.
- **FR-023**: Sessions created before this feature (without program_id or status) MUST display and function as they always have.
- **FR-024**: The app MUST request microphone permission before the first recording attempt. If denied, the app MUST show an explanation and a button to open device settings. The voice memo feature MUST degrade gracefully (recording UI hidden) when permission is denied.
- **FR-025**: Teachers MUST be able to view and play their own voice memos on the session detail screen, with the same player controls as students.
- **FR-026**: Voice memo playback MUST handle audio interruptions (incoming call, app backgrounding) by pausing playback and resuming from the same position when the user returns.
- **FR-027**: The voice memo recorder and player MUST provide accessibility labels for all controls (record, stop, play, pause, seek, speed) compatible with VoiceOver (iOS) and TalkBack (Android). Recording state changes MUST be announced to screen readers.
- **FR-028**: If a teacher has exactly one assigned program, it MUST be auto-selected in the program picker (no extra tap required). The teacher MAY deselect it to create a program-less session.
- **FR-029**: Draft sessions MUST NOT be accessible via deep links or direct URL navigation by users other than the teacher who created them. Unauthorized access attempts MUST return a "not found" response.

### Key Entities

- **Session (extended)**: Existing session entity extended with optional program reference and status (draft/completed). All new fields are nullable for backward compatibility.
- **Session Voice Memo**: A recording attached to a session. Contains a reference to the audio file in storage, the duration, file size, creation timestamp, and expiration date (30 days). One-to-one relationship with session. After expiration, the audio file is deleted but the memo record (date, duration) is preserved indefinitely as a historical marker.
- **Voice Memo Storage**: Audio files stored in a dedicated storage bucket. Files follow a path convention based on session identity. Auto-purged after expiration.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Teachers can create a session with program context in under 30 seconds (no more than one additional tap vs. current flow).
- **SC-002**: Draft sessions can be saved in under 2 seconds and resumed within 1 tap from the sessions list.
- **SC-003**: Voice memo recording and upload completes within 5 seconds after the teacher taps "Send" (for a 2-minute recording on a 3G or faster mobile connection).
- **SC-004**: Students can begin voice memo playback within 2 seconds of tapping play.
- **SC-005**: 100% backward compatibility — all existing sessions display and function identically to pre-evolution behavior.
- **SC-006**: Voice memo storage remains bounded below 2GB rolling at up to 10,000 sessions per month due to 30-day auto-deletion.
- **SC-007**: Push notification for voice memo reaches the student within 30 seconds of upload completion.
- **SC-008**: Draft cleanup runs automatically and removes 100% of drafts older than 7 days within one cleanup cycle.

---

## Assumptions

- Teachers have a stable enough mobile connection (3G or faster) to upload ~120–250KB voice memos. Retry logic handles intermittent connectivity.
- Audio recording and playback via `expo-av` is compatible with Expo ~54 managed workflow for AAC/M4A format on both iOS and Android.
- A private storage bucket for voice memos can be provisioned with signed URL access controls. Signed URLs from Supabase Storage are playable in React Native audio players without additional transcoding.
- Push notification infrastructure (from spec 004-push-notifications) is available for voice memo and draft cleanup notifications. If push infrastructure is not yet deployed, voice memo and draft features still work — only the push notification is skipped gracefully.
- The existing session creation UI can be extended with a program picker and draft/submit toggle without a full redesign.
- Recording format targets AAC-LC (M4A container), mono, 64kbps — speech-optimized compression at ~60KB per minute typical, ~125KB per minute worst case.
- The 30-day voice memo retention and 7-day draft cleanup periods are acceptable to users (no user-configurable retention needed).
- Voice memo audio content (teacher's voice) is treated as user-generated content subject to the platform's data retention policy. Teachers implicitly consent to storage by recording. No additional GDPR-specific consent flow is required beyond the existing platform terms, as memos are automatically deleted after 30 days.

---

## Out of Scope

- Full session recording (video/audio of the entire session) — sessions happen on external platforms.
- Automatic transcription of voice memos.
- Voice memo editing or trimming after recording.
- Multi-voice-memo per session (only one allowed).
- Voice memo for scheduled sessions that haven't been completed yet.
- Student-to-student session logging (only teacher-to-student).
- Offline voice memo recording with fully deferred upload (upload queues if offline, but recording requires device audio capability).
