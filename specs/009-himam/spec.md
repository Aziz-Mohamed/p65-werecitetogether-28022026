# Feature Specification: Himam Quranic Marathon Events

**Feature Branch**: `009-himam`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "009-himam"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Event Discovery & Registration (Priority: P1)

A student enrolled in the Himam program browses upcoming weekly marathon events and registers for one by selecting a track (3, 5, 10, 15, or 30 juz). The student sees event details including the 24-hour window (Saturday Fajr to Sunday Fajr), selects their preferred time slots from prayer-time blocks, and confirms registration.

**Why this priority**: Without registration, no other Himam functionality can occur. This is the entry point for all participants.

**Independent Test**: Can be fully tested by a student viewing the upcoming event list, selecting a track, choosing time slots, and confirming registration. Delivers immediate value: students know they are signed up and can plan their Saturday.

**Acceptance Scenarios**:

1. **Given** a student enrolled in the Himam program and an upcoming Saturday event exists, **When** the student opens the Himam screen, **Then** they see the next event date, registration status, and a "Register" button.
2. **Given** the student taps "Register", **When** they select a track (e.g., 5 juz), choose which specific juz to recite (validated: count must match track, range 1-30, no duplicates), and choose time slots from prayer-time blocks, **Then** the registration is saved with status "registered" and the student sees a confirmation. For the 30_juz track, all 30 juz are auto-selected and the juz picker is skipped.
3. **Given** the student is already registered for an event, **When** they open the Himam screen, **Then** they see their registration details (track, time slots) instead of the registration form.
4. **Given** the registration deadline has passed for an event, **When** a student tries to register, **Then** they see a message that registration is closed.
5. **Given** no upcoming event exists (e.g., all events completed or cancelled), **When** the student opens the Himam screen, **Then** they see a message that the next event will be auto-generated and the expected date (next Saturday).

---

### User Story 2 - Partner Matching & Notification (Priority: P1)

After registration closes, the system (or a supervisor) pairs registered students within the same track. Both partners receive a notification with their partner's name and agreed time slots. Partners can view each other's profile and meeting link.

**Why this priority**: The partner pairing is the core mechanic of Himam — recitation is done in pairs. Without pairing, the marathon cannot function.

**Independent Test**: Can be tested by registering two students in the same track, triggering the pairing process, and verifying both see their partner's info and receive notifications. Depends on US1 (registration) being complete.

**Acceptance Scenarios**:

1. **Given** two or more students registered for the same track in an upcoming event, **When** the pairing process runs (automatic or supervisor-triggered), **Then** students are paired and both registrations update to status "paired" with each other's ID.
2. **Given** a student has been paired, **When** they open the Himam event screen, **Then** they see their partner's name, selected time slots, and both partners' meeting links (student can choose either link to join).
3. **Given** an odd number of registrations in a track, **When** pairing runs, **Then** one student remains unpaired and a supervisor is notified to manually resolve by reassigning the student to a different track or manually pairing them. Trios are not supported.
4. **Given** a pairing is completed, **When** both partners are notified, **Then** each receives a push notification titled "New Himam Partner!" / "شريك همم جديد!" with body "You've been paired with {name} for Himam Marathon" / "تم إقرانك مع {name} في مسابقة همم", deep-linking to the event progress screen.
5. **Given** a student is paired but the event has not yet started (before Saturday Fajr), **When** they view the Himam screen, **Then** they see their partner info, juz list (read-only, not markable), and a countdown to event start.

---

### User Story 3 - Marathon Day Progress Tracking (Priority: P1)

On the day of the marathon (Saturday), paired partners recite together during their chosen time slots using an external meeting link. After each block, they log completion of that juz portion in the app. The app shows real-time progress toward completing their track goal.

**Why this priority**: Progress tracking is the core value proposition during the event — it motivates participants and provides accountability.

**Independent Test**: Can be tested by a paired student opening the progress screen on event day, marking individual juz portions as completed, and seeing the progress bar update toward their track goal.

**Acceptance Scenarios**:

1. **Given** a paired student on event day (Saturday), **When** they open the Himam event screen, **Then** they see a list of juz portions for their track with completion status (pending/completed) and a progress indicator.
2. **Given** a student finishes reciting a juz with their partner, **When** they tap "Mark Complete" on that juz, **Then** the progress record updates to "completed" with a timestamp for both partners' registrations.
3. **Given** a student has completed all juz in their track before the 24-hour window ends, **When** they view their progress, **Then** they see a brief success animation (progress bar fills to 100% with a checkmark) and a "Completed" status badge. Their registration status updates to "completed".
4. **Given** the 24-hour window ends and a student has not completed all portions, **When** the event closes, **Then** their registration status updates to "incomplete" with a record of what was completed.
5. **Given** both partners attempt to mark the same juz as completed simultaneously, **When** both requests arrive, **Then** the operation is idempotent — the first write succeeds, the second is a no-op returning the already-completed state.

---

### User Story 4 - Supervisor Event Management (Priority: P2)

A supervisor manages weekly Himam events, reviews registrations, triggers or adjusts partner pairings, and monitors participant progress during the marathon. After the event, the supervisor can view completion statistics.

**Why this priority**: Supervisors need management tools, but an MVP can start with system-generated events and automatic pairing. Manual oversight adds quality control.

**Independent Test**: Can be tested by a supervisor viewing an auto-generated event, reviewing registrations, manually adjusting a pairing, and viewing a post-event completion summary.

**Acceptance Scenarios**:

1. **Given** a supervisor for the Himam program, **When** they open the Himam management screen, **Then** they see a list of upcoming and past events with registration counts and status.
2. **Given** a supervisor views an upcoming event, **When** they tap "View Registrations", **Then** they see all registered students grouped by track with pairing status.
3. **Given** registrations are open for an event, **When** the supervisor taps "Run Pairing", **Then** the system pairs students by track and the supervisor sees the results with an option to adjust.
4. **Given** a supervisor wants to adjust a pairing before the event starts, **When** they swap or reassign a student, **Then** both affected students' pairing info updates and they receive a notification. Pairing adjustments are NOT allowed after the event becomes active.
5. **Given** an event has completed, **When** the supervisor views the event summary, **Then** they see completion rates per track (e.g., "Track 5 juz: 12/15 completed").
6. **Given** a supervisor wants to cancel an upcoming event, **When** they tap "Cancel Event", **Then** the event status transitions to "cancelled" and all associated registrations are set to "cancelled". Students receive a notification that the event was cancelled.

---

### User Story 5 - Event History & Statistics (Priority: P3)

Students can view their Himam participation history across past events — showing which events they participated in, which track, whether they completed, and their partner for each event. The student dashboard shows upcoming event info via a Himam card widget.

**Why this priority**: Historical tracking adds long-term engagement value but is not required for the core weekly event flow.

**Independent Test**: Can be tested by viewing a student's profile after participating in multiple events, confirming the history list shows accurate records.

**Acceptance Scenarios**:

1. **Given** a student who has participated in past Himam events, **When** they view the Himam history screen, **Then** they see a chronological list of events with track, partner name, and completion status.
2. **Given** a student on their dashboard, **When** the next Himam event is upcoming, **Then** a Himam card widget shows the next event date, their registration status, and partner info (if paired). The card is added to the student dashboard alongside existing widgets.
3. **Given** a supervisor views the Himam program stats, **When** they filter by date range, **Then** they see aggregate participation and completion rates.

---

### Edge Cases

- What happens when a student registers but then wants to cancel before pairing? They can withdraw their registration before the registration deadline (Saturday 00:00:00 Makkah time). A student who cancels MAY re-register for the same event if still before the deadline.
- What happens when a paired partner does not show up? The remaining partner can mark individual juz as completed solo (the completion still applies to both registrations). There is no separate "partner absent" status — the absent partner simply has fewer self-initiated completions in the record.
- What happens when the event date falls on a non-Saturday due to timezone differences? The event uses Makkah time (Arabia Standard Time, UTC+3), which does not observe daylight saving time. All event times are fixed and unambiguous.
- What happens if no students register for a particular track? That track has no pairings; no error is raised.
- What happens if a student tries to register for multiple tracks in the same event? The system enforces one registration per student per event (database UNIQUE constraint).
- How is the meeting link determined for a pair? Both partners' meeting links (from their profiles) are displayed. Either partner can choose which link to use for the recitation session.
- What happens if a student has no meeting_link on their profile? The registration form prompts them to add a meeting link before completing registration. Registration is not blocked, but a warning is shown.
- What happens if a student is registered but unpaired when the event activates? Their registration remains in "registered" status and they cannot track progress. The supervisor is notified of unpaired students at event activation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow students enrolled in the Himam program to view upcoming weekly marathon events. When no upcoming event exists, the system MUST display a message indicating the next auto-generated event date.
- **FR-002**: System MUST allow students to register for an event by selecting a track (3, 5, 10, 15, or 30 juz), choosing which specific juz they will recite (validated: count must match track requirement, all values 1-30, no duplicates; for 30_juz track all juz are auto-selected), and selecting preferred prayer-time blocks.
- **FR-003**: System MUST enforce one registration per student per event.
- **FR-004**: System MUST support automatic partner pairing within the same track, prioritizing students who share at least one overlapping prayer-time block. Within compatible candidates, pairing is randomized.
- **FR-005**: System MUST allow supervisors to trigger, review, and manually adjust partner pairings. Pairing adjustments are only allowed while the event status is "upcoming" (before activation).
- **FR-006**: System MUST notify both partners when they are paired via push notification: title "New Himam Partner!" / "شريك همم جديد!", body includes partner name, deep-links to event progress screen.
- **FR-007**: System MUST allow either partner to mark a juz portion as completed, automatically applying the completion to both partners' registrations. Concurrent marking of the same juz MUST be idempotent.
- **FR-008**: System MUST track progress per registration showing completed vs. pending portions.
- **FR-009**: System MUST automatically transition paired registrations to "in_progress" when the event window opens (Saturday Fajr), to "completed" when all portions are done, and to "incomplete" when the event window closes with unfinished portions. Unpaired registrations remain in "registered" status at activation.
- **FR-010**: System MUST auto-generate weekly Saturday events via a scheduled job. Supervisors can cancel upcoming events (which cascades all registrations to "cancelled" status) or create additional events.
- **FR-011**: System MUST show post-event completion statistics per track to supervisors.
- **FR-012**: System MUST display event history and participation records to students.
- **FR-013**: System MUST send a reminder notification to all registered participants approximately 12 hours before each Saturday event: title "Himam Tomorrow!" / "همم غدا!", body includes event date and track info, deep-links to Himam screen.
- **FR-014**: System MUST allow students to cancel their registration before the registration deadline (Saturday 00:00:00 Makkah time, UTC+3, i.e., end of Friday). Re-registration for the same event is allowed if still before the deadline.
- **FR-015**: System MUST handle odd registration counts by flagging unpaired students for supervisor resolution. Trios are not supported; the supervisor must reassign the odd student to another track or manually pair them.
- **FR-016**: System MUST display both partners' meeting links so students can choose which external session to join.
- **FR-017**: System MUST use Makkah time (Arabia Standard Time, UTC+3, no DST) for all event windows, deadlines, and scheduled transitions.
- **FR-018**: System MUST display loading indicators while fetching event, registration, and progress data. Empty states MUST show contextual messages (no events, no history, no registrations).
- **FR-019**: When a supervisor cancels an upcoming event, the system MUST set all associated registrations to "cancelled" and notify affected students.

### Key Entities

- **Himam Event**: A weekly marathon event occurring every Saturday with a 24-hour window. Attributes: event date, start/end times, registration deadline (Saturday 00:00:00 Makkah time), status (upcoming/active/completed/cancelled), program reference, creator (NULL if auto-generated).
- **Himam Registration**: A student's signup for a specific event and track. Attributes: student, event, track, selected juz (integer array), partner assignment, selected time slots (JSONB array of prayer-time labels), registration status (registered/paired/in_progress/completed/incomplete/cancelled).
- **Himam Progress**: Per-juz completion tracking within a registration. Attributes: registration, juz number (student-selected during registration), completion status (pending/completed), completion timestamp, who completed it, optional notes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can discover and register for an upcoming Himam event in under 2 minutes.
- **SC-002**: Partner pairing completes for all eligible registrations within 30 seconds, measured from trigger (supervisor button press or cron invocation) to all pairs updated in the database.
- **SC-003**: Students can mark a juz as completed in under 10 seconds (single tap + confirmation).
- **SC-004**: 90% of paired participants log at least one juz completion during their first event, measured by querying `himam_progress` records with status = 'completed' per event.
- **SC-005**: Supervisors can view event completion statistics within 3 taps from the management screen.
- **SC-006**: Event reminder notifications reach all registered participants at least 12 hours before the event.
- **SC-007**: Students can view their full participation history across all past events.

## Clarifications

### Session 2026-03-06

- Q: Should one or both partners confirm each juz completion? → A: Either partner can mark a juz complete, and it applies to both registrations automatically.
- Q: Which specific juz does a student recite for their track? → A: Student selects which specific juz they will recite during registration.
- Q: When does registration close relative to the Saturday event? → A: Friday midnight (Makkah time, UTC+3), giving ~5 hours buffer before Fajr Saturday for pairing.
- Q: Are events auto-generated or supervisor-created? → A: Auto-generated weekly by a scheduled job. Supervisors can cancel, skip, or create additional events.
- Q: When does registration status transition to "in_progress"? → A: Automatically when the event window opens (Saturday Fajr, Makkah time).

## Non-Functional Requirements

- **NFR-001**: The system MUST support up to 500 concurrent participants during a single marathon event day.
- **NFR-002**: Event data (events, registrations, progress) MUST be retained indefinitely to support historical reporting. No automatic purging.
- **NFR-003**: All user-facing strings MUST be available in both English and Arabic, including track names ("3 Juz" / "3 أجزاء"), prayer-time labels ("Fajr" / "الفجر"), and status badges ("Paired" / "تم الإقران").
- **NFR-004**: Juz completion marking MUST use optimistic updates — the UI reflects the change immediately while the server request is in-flight. If the request fails, the UI reverts and shows an error.
- **NFR-005**: All interactive components (juz picker, time slot selector, progress tracker) MUST follow standard React Native accessibility practices (accessible labels, touch targets ≥ 44pt).

## Assumptions

- The Himam program already exists in the `programs` table (seeded by 003-programs-enrollment with name "Himam Quranic Marathon" / "برنامج همم القرآني", category "structured", 5 tracks).
- Students must be enrolled in the Himam program before they can register for events.
- The `profiles` table has a `meeting_link` column available to all users (added by 004-teacher-availability migration on the `profiles` table, not restricted to teachers).
- Push notification infrastructure exists (from 004-push-notifications) with `send-notification` Edge Function supporting `DIRECT_CATEGORIES`.
- Prayer-time blocks are predefined labels: Fajr (الفجر), Dhuhr (الظهر), Asr (العصر), Maghrib (المغرب), Isha (العشاء), Night (الليل — the period after Isha until Fajr).
- The pairing algorithm prioritizes matching students with overlapping time slot selections within the same track.
- Events are auto-generated weekly (every Saturday) by a scheduled job. Supervisors can cancel or create additional events.
- The pg_cron and pg_net PostgreSQL extensions are available in the Supabase instance (already used by 006-teacher-availability and 008-ratings-queue features).
