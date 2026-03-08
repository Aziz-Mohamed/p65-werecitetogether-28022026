# Feature Specification: Ratings & Queue System

**Feature Branch**: `006-ratings-queue`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "006-ratings-queue"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Post-Session Teacher Rating (Priority: P1)

After a session is completed and logged by a teacher, the student receives a prompt to rate the session. The student taps a star rating (1-5), optionally selects quick feedback tags, and optionally writes a short comment. The entire rating experience takes under 10 seconds for star + tags. Ratings are anonymous to teachers but attributed in supervisor views for accountability.

**Why this priority**: Ratings are the primary quality signal for a volunteer-based platform. Without ratings, there is no way to differentiate teacher quality, incentivize improvement, or identify problems. This is the foundational data layer that all other features (queue prioritization, supervisor dashboards, teacher profiles) depend on.

**Independent Test**: Sign in as student. Open a completed session from the last 48 hours. Tap the "Rate this session" prompt. Select 4 stars. Tap "Patient" and "Clear explanation" tags. Submit. Verify the rating is saved. Sign in as teacher — verify aggregate stats updated but individual reviewer names are hidden.

**Acceptance Scenarios**:

1. **Given** a student has a completed session within the last 48 hours that they haven't rated, **When** they open the session detail or receive a push notification, **Then** a rating prompt is shown with star selection, tags, and optional comment
2. **Given** the student selects a star rating, **When** they tap submit, **Then** the rating is saved and the prompt does not appear again for that session
3. **Given** a student tries to rate a session older than 48 hours, **When** the rating window has expired, **Then** no rating prompt is shown and they cannot submit a rating
4. **Given** a teacher has fewer than 5 rated sessions, **When** a student views the teacher's profile card, **Then** the average rating is NOT displayed (only "New teacher" label)
5. **Given** a rating of 2 or below is submitted, **When** the rating is saved, **Then** the system automatically flags it for supervisor review

---

### User Story 2 - Teacher Rating Stats & Profile Display (Priority: P2)

Teachers see their own aggregate rating statistics: average rating, total review count, trend direction (improving/declining), and most common feedback tags. Students see a teacher's average rating and review count on the available-now teacher cards and profile views. Supervisors and program admins see full breakdowns including individual reviews with student names.

**Why this priority**: Rating data must be surfaced to be useful. Teacher self-improvement requires seeing their own stats. Student trust requires seeing teacher quality before choosing a teacher in the available-now list.

**Independent Test**: Sign in as teacher with 10+ rated sessions. Open profile/stats screen. Verify average rating, total count, common tags, and trend are shown. Sign in as student. Browse available-now list. Verify each teacher card shows stars + review count (only for teachers with 5+ sessions).

**Acceptance Scenarios**:

1. **Given** a teacher has 5 or more rated sessions, **When** a student views the available-now teacher list, **Then** the teacher card displays average rating (e.g., "4.7") and review count (e.g., "(43 reviews)")
2. **Given** a teacher views their own stats, **When** they open the rating stats screen, **Then** they see average rating, total reviews, star distribution, most common positive and constructive tags, and whether their trend is improving or declining
3. **Given** a supervisor views a teacher's rating details, **When** they drill into a specific teacher, **Then** they see individual reviews WITH student names, flagged reviews highlighted, and per-period trend charts
4. **Given** a teacher has a rating below 3.5 average, **When** the system detects this threshold breach, **Then** the program admin is notified automatically

---

### User Story 3 - Free Program Queue (Priority: P3)

When a student opens a free program and no teachers are currently available, the student sees an estimated wait time and a "Notify me" button. Tapping "Notify me" adds them to a program-specific queue. When a teacher becomes available, the first student in queue receives a push notification with a 3-minute claim window. If unclaimed, the notification cascades to the next student.

**Why this priority**: The queue solves the core supply/demand mismatch problem identified in competitor analysis. Without it, students open the app, see no teachers, and leave frustrated. The queue converts that abandoned visit into a recoverable engagement.

**Independent Test**: Sign in as student in a free program. Verify no teachers are available. Tap "Notify me". Verify queue position shown. Sign in as teacher and go available. Verify the first queued student receives a notification. Student taps notification — verify deep link to teacher's session.

**Acceptance Scenarios**:

1. **Given** a student opens a free program with no available teachers, **When** they view the program screen, **Then** they see "All teachers are busy", an estimated wait time, their queue position, and a "Notify me" button
2. **Given** a student is in the queue, **When** a teacher becomes available, **Then** the first student in queue receives a push notification: "A teacher is now available! Tap to join."
3. **Given** a student receives a queue notification, **When** they do not tap within 3 minutes, **Then** the notification cascades to the next student in queue and the original student's entry is marked expired
4. **Given** a student is in the queue, **When** they tap "Leave queue" or 2 hours elapse, **Then** they are removed from the queue
5. **Given** a student is #3 in queue, **When** they view the queue status, **Then** they see their position ("You are #3 in line") and the estimated wait time updates in near-real-time

---

### User Story 4 - Fair Usage Daily Session Tracking (Priority: P4)

To prevent any single student from monopolizing teacher time in free programs, the system tracks daily session counts per student per program. After reaching the configurable daily limit (default: 2 sessions), the student can still join if no queue exists, but queued students who haven't had a session that day get priority.

**Why this priority**: Fair usage is a soft safeguard that becomes critical at scale. Without it, power users can crowd out newcomers. It builds on the queue (US3) by adding prioritization logic.

**Independent Test**: Sign in as student. Complete 2 sessions in a free program in one day. Attempt to join a third session when a queue exists. Verify the student is deprioritized (placed behind students with 0 sessions today). Verify message: "You've had 2 sessions today. Others are waiting."

**Acceptance Scenarios**:

1. **Given** a student has completed 2 sessions today in a free program, **When** they view the program with available teachers and no queue, **Then** they can still join normally
2. **Given** a student has completed 2 sessions today, **When** they try to join while other students are queued with fewer sessions today, **Then** the student with fewer sessions gets priority in the queue
3. **Given** a student has reached the daily limit, **When** they view the program, **Then** they see "You've had 2 sessions today. You can still join if no one is waiting."
4. **Given** the daily limit resets, **When** a new calendar day begins (based on organization timezone), **Then** all students' daily counters reset to 0

---

### User Story 5 - Supply-Side Teacher Notifications (Priority: P5)

When the queue for a program reaches a configurable threshold (default: 5 students), teachers who are offline receive a push notification: "Students are waiting in [program name]. Can you come online?" Teachers also see a "Current demand" indicator on their dashboard.

**Why this priority**: This completes the supply/demand feedback loop. Without it, the queue can grow indefinitely with no mechanism to increase supply.

**Independent Test**: Add 5 students to a free program queue. Verify offline teachers in that program receive a notification. Sign in as teacher. Verify dashboard shows "5 students waiting" demand indicator.

**Acceptance Scenarios**:

1. **Given** 5 or more students are queued for a program, **When** the threshold is reached, **Then** all offline teachers assigned to that program receive a push notification
2. **Given** a teacher views their dashboard, **When** students are waiting in their program, **Then** a demand indicator shows the number of waiting students
3. **Given** a teacher-demand notification was sent, **When** fewer than 60 minutes have passed, **Then** no duplicate demand notification is sent for the same program (debounce)

---

### Edge Cases

- What happens when a student rates a session and then the session is deleted? Rating remains associated with the teacher (orphan-safe).
- What happens when a teacher goes offline while students are in the queue? Queue persists; when another teacher in the same program goes available, the queue processes normally.
- What happens when a student is in multiple program queues simultaneously? Allowed. Each queue is program-specific and independent.
- What happens when the last queued student's notification expires and no one claims? Teacher remains marked available for direct joins (no one is waiting anymore).
- What happens when a student joins a queue from a push notification while the app is closed? Deep link opens the app to the queue claim screen with teacher info.
- What happens when the daily session count is at the limit and the student is the only one available? They can still join (soft limit, not hard block).
- What happens when a teacher with a rating below 3.5 improves back above? The warning state clears automatically; program admin receives a "recovered" notification.
- What happens if a supervisor excludes a review? The excluded review is removed from the teacher's aggregate calculation and marked with reason.
- What happens when a teacher becomes unavailable again while a student is in 'notified' status? The claim window continues regardless — the student can still claim using the teacher's last-known meeting link. If the teacher is truly offline, the session may not proceed, but the queue slot is consumed.
- What happens when two teachers in the same program become available simultaneously? Each teacher independently triggers queue processing — two students are notified in parallel, one per teacher.
- What happens when a student receives a queue notification but has push disabled or the app uninstalled? The 3-minute cascade handles non-response; the notification expires and cascades to the next student. In-app queue status polling provides a secondary awareness channel for students with the app open.
- What happens when a student tries to rate a session but the teacher has been removed from the program? The student can still rate — the rating is tied to the session and teacher, not the current teacher-program assignment.
- What happens if the student's network fails during rating submission? Standard client-side retry; the UNIQUE(session_id, student_id) constraint prevents duplicates on retry.
- What happens when a program's category changes from 'free' to 'structured' while students are in the queue? All active queue entries for that program are auto-expired.
- What happens when the organization's timezone changes? Daily session counts for the in-flight day are best-effort; the new timezone applies from the next midnight reset.
- What happens when all ratings for a teacher are excluded by a supervisor? If total_reviews drops below 5, the teacher reverts to "New teacher" display per FR-005.
- What happens when a student leaves the queue and there are position gaps? Positions are compacted — all remaining entries behind the departed student are decremented by 1.

## Requirements *(mandatory)*

### Functional Requirements

#### Ratings

- **FR-001**: System MUST allow students to submit a rating (1-5 stars) for any completed session within 48 hours of session completion (status changed to 'completed')
- **FR-002**: System MUST support optional quick feedback tags (pre-defined positive and constructive tags) alongside the star rating
- **FR-003**: System MUST support an optional free-text comment (max 500 characters) with the rating
- **FR-004**: System MUST enforce one rating per session per student (no duplicate ratings)
- **FR-005**: System MUST NOT display a teacher's aggregate rating to students until the teacher has at least 5 ratings (total_reviews >= 5). Teachers below this threshold MUST display a "New teacher" label instead
- **FR-006**: System MUST auto-flag ratings of 2 stars or below for supervisor review
- **FR-007**: System MUST keep ratings anonymous to teachers (teachers see aggregate stats only, never individual student names)
- **FR-008**: System MUST allow supervisors and program admins to see individual reviews with student names for accountability
- **FR-009**: System MUST allow supervisors to exclude abusive/retaliatory reviews from aggregate calculation with a documented reason. Exclusions are reversible — supervisors can restore excluded reviews with a reason. Full audit trail (who, when, action, reason) is maintained
- **FR-010**: System MUST display teacher aggregate rating (average stars + review count) on available-now teacher cards for teachers with 5+ reviews
- **FR-011**: System MUST calculate and display rating trend direction (improving/declining/stable) for teachers on their own stats view, comparing the last 30 days' average to the prior 30 days' average (calendar-based, using organization timezone). Thresholds: improving if last_30 > prior_30 + 0.2, declining if last_30 < prior_30 − 0.2, stable otherwise
- **FR-012**: System MUST track and display the most common positive and constructive feedback tags per teacher
- **FR-013**: System MUST send a push notification to the student prompting them to rate immediately after a session status changes to 'completed'
- **FR-014**: System MUST notify program admins when a teacher's average rating drops below 3.5
- **FR-015**: System MUST notify supervisors when a rating of 2 or below is submitted (auto-flagged review alert)
- **FR-016**: System MUST recalculate teacher aggregate stats when a review is excluded by a supervisor
- **FR-017**: Pre-defined positive feedback tags MUST include: "Patient", "Clear explanation", "Encouraging", "Excellent tajweed", "Well-prepared". All tags MUST have both English and Arabic translations via i18n
- **FR-018**: Pre-defined constructive feedback tags MUST include: "Session felt rushed", "Hard to understand", "Frequently late", "Disorganized". All tags MUST have both English and Arabic translations via i18n

#### Queue

- **FR-019**: System MUST allow enrolled students to join a program-specific queue when no teachers are available in a free program. Students must be enrolled in the program to join its queue
- **FR-020**: System MUST display estimated wait time based on average session duration for that program
- **FR-021**: System MUST display the student's current queue position in near-real-time
- **FR-022**: System MUST send a push notification to the first student in queue when a teacher becomes available, with a 3-minute claim window. Tapping the notification auto-claims the slot and deep-links to the session start flow
- **FR-023**: System MUST cascade the notification to the next student if the first student does not claim within 3 minutes
- **FR-024**: System MUST auto-expire queue entries 2 hours after the student joined the queue (expires_at = created_at + 2 hours)
- **FR-025**: System MUST allow students to leave the queue voluntarily at any time
- **FR-026**: System MUST ensure only one active queue entry per student per program

#### Fair Usage

- **FR-027**: System MUST track daily session count per student per program (free programs only)
- **FR-028**: System MUST enforce a configurable daily session limit (default: 2 sessions/day per free program)
- **FR-029**: After reaching the daily limit, the student MAY still join if no queue exists (soft limit)
- **FR-030**: When a queue exists, students with fewer sessions today MUST be prioritized over students who have reached the daily limit. Students with equal session counts are ordered by queue join time (FIFO)
- **FR-031**: Daily session counters MUST reset at midnight in the organization's timezone
- **FR-032**: The daily limit and queue threshold MUST be configurable per program by program admins

#### Supply-Side

- **FR-033**: System MUST notify teachers who are not currently available (is_available = false) when the queue for their program reaches the configurable threshold (default: 5 students)
- **FR-034**: System MUST debounce teacher-demand notifications to no more than once per 60 minutes per program
- **FR-035**: System MUST display current student demand (waiting count) on the teacher dashboard for their assigned programs
- **FR-036**: System MUST notify program admins when a teacher's average rating recovers above 3.5 after previously being below (automatic "recovered" alert)
- **FR-037**: Program admins MUST be able to configure daily_session_limit and queue_notification_threshold per program via the program settings screen

### Key Entities

- **Teacher Rating**: A student's feedback on a specific session — includes star rating (1-5), optional tags, optional comment, auto-flag status, and exclusion status (reversible, with audit trail: who excluded/restored, when, reason). One rating per session per student. Associated with student, teacher, session, and program.
- **Teacher Rating Stats**: Aggregated per-teacher per-program statistics — average rating, total reviews, star distribution (count per star level), most common positive/constructive tags, last updated timestamp. Recalculated on new ratings or exclusions.
- **Free Program Queue Entry**: An ephemeral record of a student waiting for a teacher in a specific free program — includes queue position, join time, notification timestamp, claim status, and auto-expiry time. One active entry per student per program.
- **Daily Session Count**: Per-student per-program daily usage tracker — count of sessions completed today, date, resets at midnight in organization timezone. Used for fair usage prioritization, not hard blocking.
- **Feedback Tags**: Pre-defined set of positive and constructive tags available during rating. Tags are system-defined (not user-created).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Students can complete a session rating (star + tags) in under 10 seconds
- **SC-002**: 70% or more of completed sessions receive a student rating within 48 hours
- **SC-003**: Teachers with 5+ rated sessions display their aggregate rating to students within 1 second of loading the available-now list
- **SC-004**: When a teacher becomes available and a queue exists, the first queued student receives a notification within 5 seconds
- **SC-005**: Queue position updates are visible to the student within 3 seconds of a position change
- **SC-006**: 80% of queued students who receive a "teacher available" notification claim the slot within the 3-minute window
- **SC-007**: Supervisor flagged-review alerts arrive within 30 seconds of the low-rating submission
- **SC-008**: Fair usage messaging is displayed to 100% of students who reach the daily session limit
- **SC-009**: Teacher demand notifications reach offline teachers within 30 seconds of the queue threshold being crossed
- **SC-010**: Rating aggregate stats (average, count, tags) update within 10 seconds of a new rating submission

## Clarifications

### Session 2026-03-06

- Q: What time window defines the rating trend direction (improving/declining/stable) for teachers? → A: Last 30 days average vs. prior 30 days average (calendar-based windows, aligned with org timezone).
- Q: What constitutes "claiming" a queue slot when notified? → A: Tapping the notification counts as the claim (auto-claim on open). Deep link opens directly to the session start flow with no additional confirmation step.
- Q: Can supervisor review exclusions be reversed? → A: Yes, exclusions are reversible. Supervisors can restore excluded reviews with a documented reason. Full audit trail is kept (who excluded/restored, when, reason).

## Assumptions

- The teacher availability (green dot) system from spec 004-teacher-availability is already implemented and available as a dependency
- Programs have been seeded and teachers have been assigned to programs via the 003-programs-enrollment feature
- Session logging with program_id is available from 005-session-evolution
- Push notification infrastructure (push tokens, Expo Push API, notification preferences) is already operational from 004-push-notifications
- The platform timezone is configured at the organization level (used for daily counter reset)
- Pre-defined feedback tags are hardcoded in the app (not dynamically managed by admins in MVP)
- Outlier dampening (flagging anomalous ratings for teachers with 50+ reviews) is deferred to a future iteration — MVP uses simple average with supervisor exclusion
- Queue processing runs as an event-driven flow (teacher becomes available triggers queue notification), not as a periodic polling job
- The "estimated wait time" calculation uses a simple rolling average of session durations for that program, computed from the last 50 completed sessions' duration (session end − session start). If fewer than 5 sessions exist, a default of 15 minutes is used
- Rate limiting on rating submission is handled by Supabase's built-in auth rate limiting plus the UNIQUE(session_id, student_id) constraint. No additional application-level rate limiting is needed for MVP
- Content moderation for free-text comments is deferred to a future iteration. Supervisor exclusion (FR-009) serves as the MVP moderation mechanism for abusive content
- Expired/claimed/left queue entries are purged by a pg_cron job after 7 days to prevent table bloat
- Star rating input accessibility (screen reader labels, minimum touch targets) follows React Native accessibility best practices (accessibilityLabel on each star, minimum 44x44pt touch targets)
- Success criteria SC-002 and SC-006 are measured via database queries (e.g., COUNT of rated sessions / total completed sessions). SC-001 is a UX design target validated by manual testing. SC-004, SC-005, SC-007, SC-009 are validated by integration test timing assertions
