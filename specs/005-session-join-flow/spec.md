# Feature Specification: Session Join Flow

**Feature Branch**: `005-session-join-flow`
**Created**: 2026-03-02
**Status**: Draft
**Input**: User description: "Add deep linking session join flow for students to open external meeting apps (Google Meet, Zoom, etc.) from the available-teachers list and from shared links"

## Clarifications

### Session 2026-03-02

- Q: How should the available-teachers list stay current as teachers go online/offline? → A: Realtime updates via Supabase Realtime — the list updates automatically as teachers toggle availability.
- Q: What happens to a draft session if the student never returns? → A: Draft sessions expire after 4 hours if neither party confirms the session, freeing the teacher's concurrent student slot.
- Q: Can a student be in the waiting queue for multiple free programs at the same time? → A: No — one queue at a time. Joining a new program's queue removes the student from the previous one.
- Q: What happens when a student has push notifications disabled and receives a queue offer? → A: Push + in-app banner — if the student opens the app during the 3-minute window, they see a banner with the offer.
- Q: Should the teacher's meeting link be visible before or after tapping "Join Session"? → A: Hidden until join — students see only the platform icon; the actual link is revealed only after the draft session is created, preventing link harvesting.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse & Join Available Teacher (Priority: P1)

A student enrolled in a free program (e.g., Alternating Recitation, Non-Arabic Speakers) opens the program and sees which teachers are currently available. They pick a teacher based on name, rating, and meeting platform, tap "Join Session," and the app opens the teacher's external meeting link (Google Meet, Zoom, etc.) in the appropriate app or browser.

**Why this priority**: This is the core value proposition of free programs — students must be able to discover available teachers and join sessions with a single tap. Without this, free programs have no functional student experience.

**Independent Test**: A student navigates to a free program, sees 2+ available teachers with ratings displayed, taps "Join Session" on one, and Google Meet (or Zoom) opens with the correct meeting link.

**Acceptance Scenarios**:

1. **Given** a student is on a free program's detail screen and 3 teachers are available, **When** the student views the available teachers list, **Then** each teacher card shows name, avatar, rating (stars + review count), meeting platform icon, and a "Join Session" button. The list is sorted by highest rating first, displayed as a vertical scrollable list.
2. **Given** a student taps "Join Session" on an available teacher, **When** the join flow completes, **Then** a draft session is created, the student is recorded as attending, and the external meeting app opens with the teacher's meeting link.
3. **Given** a student taps "Join Session," **When** the draft session is created, **Then** the teacher's concurrent student count is checked and the session is only created if the teacher hasn't reached their maximum.
4. **Given** a student has already had 2 sessions today in this program (daily limit), **When** they try to join and other students are in the queue, **Then** they see a message that they've reached their daily limit and should try again tomorrow or wait until the queue clears.

---

### User Story 2 - Join Queue When No Teachers Available (Priority: P2)

A student opens a free program but no teachers are currently available. Instead of an empty state, the student sees an estimated wait time and can tap "Notify Me" to join the queue. When a teacher becomes available, the first student in the queue receives a push notification with a 3-minute window to claim the slot.

**Why this priority**: Without queue management, students see "no teachers available" and leave frustrated. The queue transforms a dead-end into a promise of service.

**Independent Test**: A student joins the queue for a program with 0 available teachers, waits, then receives a notification when a teacher goes online. The student taps the notification and is taken directly to the join flow.

**Acceptance Scenarios**:

1. **Given** no teachers are available in a free program, **When** a student views the program, **Then** they see "All teachers are currently in sessions," an estimated wait time, their queue position displayed as "You are #N in line," and a "Notify Me" button. **Given** a student already has an active draft session, **Then** the "Notify Me" button is hidden.
2. **Given** a student is in the queue and a teacher becomes available, **When** the system processes the queue, **Then** the first student receives a push notification: "A teacher is now available! Tap to join." with a 3-minute claim window.
3. **Given** a student receives a queue notification, **When** they tap it within 3 minutes, **Then** the app opens to a queue-claim screen showing the available teacher's details and a countdown timer with a "Claim & Join" button. On claim, the student is taken to the JoinSessionFlow for that teacher. **If** they don't claim within 3 minutes, **Then** the offer passes to the next student in the queue.
4. **Given** a student is in the queue, **When** they tap "Leave Queue," **Then** they are removed and their position is freed for others.

---

### User Story 3 - Join Session via Shared Deep Link (Priority: P3)

A teacher or admin shares a direct link (e.g., `werecitetogether://session/join?teacher=abc&program=def`) via WhatsApp or SMS. When the student taps the link on their phone, the app opens and takes them directly to the join flow for that specific teacher and program.

**Why this priority**: Deep links enable teachers and admins to directly invite students to sessions without the student needing to navigate through the app. This is especially valuable for structured programs and for onboarding new students.

**Independent Test**: A student receives a deep link via WhatsApp, taps it, the app opens, and they see the join-session confirmation screen for the specified teacher.

**Acceptance Scenarios**:

1. **Given** the app is installed and the student taps a deep link `werecitetogether://session/join?teacher={id}&program={id}`, **When** the app opens, **Then** the student is shown the join-session flow for that teacher with their name, rating, and meeting platform.
2. **Given** the student taps a deep link but the teacher is no longer available, **When** the app opens, **Then** the student sees "This teacher is no longer available" with an option to browse other available teachers or join the queue.
3. **Given** the student taps a deep link but is not logged in, **When** the app opens, **Then** the student is sent to the login screen and after logging in is redirected to the join flow.
4. **Given** the app is NOT installed, **When** the student taps a deep link, **Then** they are taken to the app store listing.

---

### User Story 4 - Post-Session Return & Logging (Priority: P4)

After completing a session in the external meeting app, the student returns to WeReciteTogether. The app shows a post-session summary with an option to rate the teacher. The teacher logs the session outcome (scores, notes, optional voice memo) from their side.

**Why this priority**: Closing the loop after a session is important for data quality and teacher accountability, but the session itself (US1) must work first.

**Independent Test**: After a session, the student returns to the app and sees their session recorded with teacher name, duration, and a "Rate this session" prompt.

**Acceptance Scenarios**:

1. **Given** a student has an active draft session created more than 5 minutes ago and returns to the app (AppState becomes 'active'), **When** they open the app, **Then** they see a post-session card prompting them to confirm the session happened and optionally rate the teacher. The prompt can be dismissed but persists across app restarts until the session transitions from "draft" (completed, cancelled, or expired).
2. **Given** a teacher completes a session, **When** they log the outcome (scores, notes), **Then** the session status changes from "draft" to "completed" and the student receives a notification with the summary.

---

### Edge Cases

- What happens when a teacher goes offline while the student is in the join flow? The system should show "Teacher is no longer available" and suggest alternatives.
- What happens when the meeting link is missing or invalid? The system should show "Meeting link unavailable — please contact the teacher" and prevent the session from being created.
- What happens when two students try to join the same 1-on-1 teacher simultaneously? The system should use the concurrent student limit to block the second student and show "This teacher's session is full."
- What happens when a student's internet drops during the join flow? The draft session should not be created until the meeting link is successfully opened; partial state should be cleaned up.
- What happens when a deep link contains an invalid teacher or program ID? The app should show a generic "Link is no longer valid" error with a "Go to Programs" fallback.
- What happens when a student has push notifications disabled and receives a queue offer? The system should show an in-app banner with the offer if the student opens the app during the 3-minute claim window. If neither push nor in-app is seen, the offer expires and passes to the next student.
- What happens when `Linking.openURL()` fails (meeting app not installed or URL scheme unsupported)? The system should show "Unable to open meeting link — try opening it in your browser" with a copy-to-clipboard fallback, and the draft session should still be marked as created.
- What happens when the 3-minute queue claim window expires while the student is mid-claim (network delay)? The server should return an error and the student should see "This offer has expired" with an option to rejoin the queue.
- What happens when a deep link arrives while the student already has an active draft session? The system should show "You already have an active session" with options to view the current session or proceed to the new join flow (which will create a second session if daily limit allows).
- What happens when a non-student role user (teacher, admin) taps a session join deep link? They should be redirected to their role-appropriate home screen with a toast message "Session join is for students only."
- What happens when a teacher has started logging session outcomes but the draft session expires? Only sessions with status "draft" are eligible for auto-expiry. Sessions already transitioned to "in_progress" are NOT expired.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a vertical scrollable list of currently available teachers when a student views a free program, sorted by highest rating first. Each teacher card shows name, avatar, rating (stars + review count), meeting platform icon, and languages spoken (from the `profiles.languages` field). The list MUST update in realtime as teachers go online/offline — no manual refresh required. The available-teachers screen is only shown for programs with `category = 'free'`.
- **FR-002**: System MUST allow a student to tap "Join Session" on an available teacher, which creates a draft session record, records the student's attendance, and opens the teacher's external meeting link in the device's browser or native app. The meeting link MUST NOT be exposed to the student before the draft session is created — only the meeting platform icon is visible on the teacher card.
- **FR-003**: System MUST enforce the teacher's maximum concurrent student limit — if the teacher is at capacity, the "Join Session" button should be disabled with a "Session full" label.
- **FR-004**: System MUST enforce a configurable daily session limit per student per free program (default: 2 sessions/day, configured via `programs.settings` JSONB by program admins). The daily count is incremented when the draft session is created (before the meeting link opens). All session creations (draft, in_progress, completed) count against the daily limit — expired/cancelled sessions also count to prevent gaming. Students who have reached the limit while a queue exists should see a message and be unable to join.
- **FR-005**: System MUST show a queue interface when no teachers are available, displaying estimated wait time (calculated as: average session duration for the program divided by expected teacher availability), the student's queue position (displayed as "You are #N in line"), and a "Notify Me" button. A student may only be in one program's queue at a time — joining a new queue cancels any existing queue entry. Queue positions are calculated dynamically based on `joined_at` ordering of active entries, not stored ordinals.
- **FR-006**: System MUST process the queue when a teacher becomes available — sending a push notification to the first student in the queue with a 3-minute claim window before offering to the next. Additionally, the system MUST show an in-app banner with the offer if the student opens the app during the claim window, ensuring delivery even when push notifications are disabled.
- **FR-007**: System MUST support deep links in the format `werecitetogether://session/join?teacher={teacherId}&program={programId}` that open the app directly to the join-session flow.
- **FR-008**: System MUST handle deep links gracefully when the referenced teacher is unavailable, the IDs are invalid, or the student is not authenticated — showing appropriate fallback screens. Deep link screen states: loading spinner while fetching teacher data, "Teacher not available" with browse-alternatives option, "Link is no longer valid" for invalid IDs, and network error with retry button. Non-student roles tapping a session join deep link are redirected to their home screen with a toast message.
- **FR-009**: System MUST show a post-session prompt when a student returns to the app (AppState becomes 'active') and has a draft session created more than 5 minutes ago, allowing them to confirm the session occurred and optionally rate the teacher. The prompt can be dismissed but persists across app restarts until the session transitions from "draft" status (to completed, cancelled, or expired).
- **FR-010**: System MUST record `meeting_link_used` on the session record when a student joins, for audit and analytics purposes.
- **FR-011**: System MUST trigger a "Notify teachers" mechanism once when the queue first crosses a configurable threshold (default: 5 students) — offline teachers in that program receive a notification asking them to come online. The notification resets when the queue size drops below the threshold, allowing re-trigger if the queue grows again.
- **FR-012**: System MUST allow queue entries to expire after a configurable period (default: 2 hours) of inactivity.
- **FR-013**: System MUST auto-expire draft sessions after a configurable period (default: 4 hours) if neither student nor teacher confirms the session, freeing the teacher's concurrent student slot and updating the session status to "expired." Only sessions with status "draft" are eligible — sessions already transitioned to "in_progress" are not expired. The `current_session_count` on `teacher_availability` MUST be decremented on session complete, cancel, AND expire. The expiry process runs every 15 minutes; if it fails, stale drafts remain until the next successful run.

### Key Entities

- **Available Teacher**: A teacher who has toggled "available" for a specific program. Includes profile info, meeting link, meeting platform, rating stats, current student count, and max concurrent students.
- **Draft Session**: A session record created when a student initiates a join. Starts as "draft," transitions to "in_progress" when the teacher acknowledges, "completed" when the teacher logs the outcome, or "expired" if neither party confirms within 4 hours.
- **Queue Entry**: A student's position in the waiting queue for a free program. Has a status lifecycle: waiting → notified → claimed/expired/cancelled. A student may only have one active queue entry at a time — joining a new program's queue automatically cancels any existing entry.
- **Deep Link**: A URL scheme (`werecitetogether://`) that routes to specific in-app screens with parameters for teacher and program identification.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can go from opening a free program to being in an external meeting in under 15 seconds (3 taps: program → teacher → join).
- **SC-002**: 90% of students who tap "Join Session" successfully open the external meeting link on the first attempt.
- **SC-003**: Students in the queue receive availability notifications within 10 seconds of a teacher going online.
- **SC-004**: Deep links resolve to the correct join flow within 3 seconds of tapping, including app cold start.
- **SC-005**: No student may exceed the daily session limit (default: 2) while other students are waiting in the queue. The system enforces this by blocking join attempts when the limit is reached and a queue exists.
- **SC-006**: 80% of completed sessions have a teacher-logged outcome (scores/notes), indicating the post-session flow works reliably.

### Non-Functional Requirements

- **NFR-001**: All interactive elements (teacher cards, join buttons, queue actions, countdown timer) MUST meet minimum 44pt touch targets and include accessible labels for screen readers.
- **NFR-002**: All new screens MUST use logical CSS properties (marginStart/End, paddingStart/End, start/end) per Constitution Principle V to support RTL layout for Arabic.
- **NFR-003**: If the realtime subscription drops, the available-teachers list MUST fall back to its existing polling interval (30-second refetch). If a join request fails due to network error, the system shows "Connection error — please try again" with a retry button.
- **NFR-004**: All configurable parameters (daily limit, queue expiry, claim window, draft TTL, teacher notification threshold) use sensible defaults from `programs.settings` JSONB. If a key is missing from the JSONB, the code falls back to the hardcoded default values documented in the data model.

## Assumptions

- Teachers already have meeting links configured in their profiles (this is part of teacher onboarding, already implemented).
- The `teacher_availability`, `sessions`, `session_attendance`, `free_program_queue`, and `daily_session_count` tables already exist in the database schema.
- The `JoinSessionFlow` bottom sheet component and `useCreateDraftSession` hook already exist and handle the core draft-session creation and meeting link opening logic. These need enhancement to add daily limit checking and daily count increment — they do not currently enforce FR-004.
- The queue-processor edge function already handles queue advancement and notification sending.
- Push notification infrastructure is already in place (send-notification edge function).
- The `werecitetogether://` URL scheme is already configured in `app.json`.

## Scope Boundaries

**In scope**:
- Available-teachers browsing screen for free programs
- Join-session flow (tap → draft session → open meeting link)
- Queue UI when no teachers available
- Deep link handling in the app root layout
- Post-session return prompt
- Daily session limit enforcement

**Out of scope**:
- Structured program session scheduling (handled by the scheduling feature)
- Teacher-side session logging UI (already exists)
- Voice memo recording (already exists as a separate feature)
- Google Calendar API integration for auto-generated meeting links (PRD Phase 2)
- Web/browser deep link handling (mobile-only for now)
