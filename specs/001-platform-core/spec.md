# Feature Specification: WeReciteTogether Core Platform

**Feature Branch**: `001-platform-core`
**Created**: 2026-02-28
**Status**: Draft
**Input**: PRD at `memory-bank/PRD_WeReciteTogether.md` — core platform MVP covering self-registration, program browsing, 5-role permission system, teacher availability (green dot), external meeting link integration, enrollment, cohort management, session logging, teacher ratings, queue/waitlist, and program-scoped admin panels.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Student Registration & Program Discovery (Priority: P1)

A new user downloads the app and signs in using their Google or Apple account. On first sign-in, they complete a brief onboarding step: display name, gender, age range, country, and optionally region/province. After onboarding, they land on a home screen showing available programs. They can browse all 8 programs, read descriptions, view tracks within each program, and understand whether a program is free (drop-in) or structured (enrollment required). For free programs, they can immediately see available teachers. For structured programs, they see enrollment options and cohort availability.

**Why this priority**: Without registration and program discovery, no other user journey is possible. This is the entry point for every student.

**Independent Test**: A new user can sign in via Google or Apple, browse all programs, read program/track details, and distinguish free from structured programs — delivering discovery value with zero dependency on other stories.

**Acceptance Scenarios**:

1. **Given** the app is installed, **When** a user taps "Sign in with Google" or "Sign in with Apple" and completes the OAuth flow, **Then** an account is created (or existing account is matched) and the user is assigned the `student` role by default.
2. **Given** a first-time user has completed OAuth sign-in, **When** they have no profile data yet, **Then** they are presented with a one-time onboarding form: display name (required), gender (male/female, required), age range (required), country (required), and region/province (optional). After completing onboarding, they are taken to the home screen.
3. **Given** a logged-in student, **When** they navigate to the Programs tab, **Then** they see all active programs with name (Arabic + English), category label (free/structured/mixed), and a brief description.
4. **Given** the Programs list, **When** a student taps a program, **Then** they see the program detail screen showing: full description, available tracks (if any), whether enrollment is required, and a call-to-action (either "Browse Available Teachers" for free programs or "Enroll" for structured programs).
5. **Given** a student viewing a mixed program (e.g., Alternating Recitation), **When** they view the tracks, **Then** free tracks show "Join anytime" and structured tracks show "Enrollment required."

---

### User Story 2 — Teacher Availability & Drop-In Session (Priority: P2)

A teacher assigned to a free program opens the app and toggles their status to "Available." Their profile card immediately appears in the "Available Now" list for students in that program. A student browsing available teachers sees the teacher's name, rating (if 5+ reviews exist), languages spoken, and meeting platform. The student taps "Join Session," the app reveals the teacher's external meeting link and opens it via deep link (Google Meet, Zoom, etc.). After the session concludes externally, the teacher returns to the app and logs the session outcome.

**Why this priority**: This is the core value loop of the platform for free programs — connecting students with available teachers for live Quran recitation. Without this, the platform has no utility for the largest user segment.

**Independent Test**: With a seeded teacher and student account, the teacher can go available, the student can see them in the list, tap to join, and be redirected to the external meeting link.

**Acceptance Scenarios**:

1. **Given** a teacher assigned to a free program, **When** they tap the "Go Available" toggle, **Then** their profile card appears in the "Available Now" list for that program with a green indicator, and `available_since` is recorded.
2. **Given** a student viewing the "Available Now" list, **When** teachers are available, **Then** each teacher card shows: name, average rating (stars + review count, only if 5+ rated sessions), program(s) they teach, languages spoken, meeting platform icon, and max concurrent students.
3. **Given** a student viewing a teacher card, **When** they tap "Join Session," **Then** a draft session record is created (linking the student, teacher, and program), the app displays the teacher's meeting link, and offers to open it in the external app (Google Meet, Zoom, etc.).
4. **Given** a teacher has set max concurrent students to 1 and a draft session already exists, **When** another student views that teacher, **Then** the teacher card shows "In Session" and the join button is disabled.
5. **Given** an available teacher, **When** they tap "Go Offline," **Then** they are removed from the "Available Now" list immediately.

---

### User Story 3 — Program Administration & Role Management (Priority: P3)

A Master Admin accesses the admin dashboard and creates programs, defines tracks within them, and configures program settings (max students per teacher, session duration, etc.). They assign a user as Program Admin for a specific program. The Program Admin can then assign teachers and supervisors within their program. Teachers can be assigned to multiple programs. Supervisors manage a group of teachers within a program.

**Why this priority**: The administrative backbone must exist for programs, roles, and teacher assignments to function. All other stories depend on programs existing and roles being assigned.

**Independent Test**: A Master Admin can create a program, define tracks, assign a Program Admin, and the Program Admin can assign teachers — all verifiable through the admin interface without requiring student-facing flows.

**Acceptance Scenarios**:

1. **Given** a Master Admin is logged in, **When** they navigate to Programs Management, **Then** they can create a new program with: name (Arabic + English), description, category (free/structured/mixed), and settings.
2. **Given** a program exists, **When** the Master Admin adds tracks, **Then** each track has: name (Arabic + English), description, curriculum definition, and sort order.
3. **Given** a program exists, **When** the Master Admin assigns a user as Program Admin, **Then** that user's role for that program is recorded, and they can only access data within that program.
4. **Given** a Program Admin is logged in, **When** they navigate to their program's Team section, **Then** they can assign existing users as teachers or supervisors within their program.
5. **Given** a teacher is assigned to Program A, **When** a different Program Admin assigns them to Program B, **Then** the teacher belongs to both programs and appears in both program contexts.
6. **Given** a Program Admin, **When** they attempt to view or modify another program's data, **Then** access is denied.

---

### User Story 4 — Structured Program Enrollment & Cohort Management (Priority: P4)

A Program Admin creates a cohort within a structured program track (e.g., "Batch 1 — Tuhfat al-Atfal"). They set the cohort's max students, assign a teacher, define a schedule, and open enrollment. A student browsing the program sees the cohort, its capacity status, and taps "Enroll." The enrollment either auto-approves or goes to pending (based on program settings). Once approved, the student appears in the cohort roster. If the cohort is full, the student can join a waitlist.

**Why this priority**: Structured programs are the core offering for serious students (memorization, Qiraat, Mutoon). Without enrollment and cohort management, these programs cannot operate.

**Independent Test**: A Program Admin can create a cohort, open enrollment, and a student can enroll — verified by the student appearing in the cohort roster and seeing their enrollment status.

**Acceptance Scenarios**:

1. **Given** a Program Admin for a structured program, **When** they create a cohort, **Then** they specify: name, track, max students, assigned teacher, supervisor, schedule (recurring days/times), meeting link, start date, and optional end date.
2. **Given** a cohort with status "enrollment_open," **When** a student taps "Enroll," **Then** their enrollment is created with status `pending` (if approval required) or `active` (if auto-approve is on).
3. **Given** a pending enrollment, **When** the Program Admin approves it, **Then** the student's status changes to `active` and they receive a confirmation notification.
4. **Given** a cohort at max capacity (e.g., 25/25), **When** a student tries to enroll, **Then** they see the capacity indicator and are offered a "Join Waitlist" option instead.
5. **Given** a student on the waitlist, **When** a spot opens (another student drops), **Then** the first waitlisted student receives a notification with a 24-hour window to confirm enrollment.
6. **Given** a cohort, **When** the Program Admin changes its status through the lifecycle (enrollment_open → enrollment_closed → in_progress → completed → archived), **Then** enrollment behavior updates accordingly.

---

### User Story 5 — Session Logging & Post-Session Workflow (Priority: P5)

After a live session concludes (whether free drop-in or structured), the teacher returns to the app to log the session outcome. They record: which students attended, scores/grades for each student, text notes with corrections, and optionally record a voice memo summarizing key feedback. The student later views their session history, sees the teacher's notes, scores, and can play back the voice memo if one was recorded. For structured programs, the session is linked to the student's progress tracking.

**Why this priority**: Session logging is what transforms the platform from a simple "find a teacher" directory into a learning management system. Progress tracking, accountability, and teacher quality measurement all depend on session data.

**Independent Test**: A teacher can log a session with scores and notes, and the student can view that session in their history with all recorded details.

**Acceptance Scenarios**:

1. **Given** a teacher has just finished a session, **When** they open the session logging screen, **Then** they can record: attending students, per-student score (0-5), text notes, and session duration.
2. **Given** a completed session log, **When** the teacher is prompted "Record a voice memo?", **Then** they can hold to record (max 2 minutes), preview playback, and send or re-record.
3. **Given** a logged session with a voice memo, **When** the student opens that session in their history, **Then** they see: date, teacher name, score, text notes, and an audio player for the voice memo with play/pause, seek bar, and playback speed options (1x, 1.25x, 1.5x).
4. **Given** a voice memo was uploaded, **Then** the student receives a push notification: "Your teacher left you a voice memo from today's session."
5. **Given** a voice memo is 30+ days old, **Then** it is automatically deleted from storage and the student sees "Voice memo expired" in the session detail.
6. **Given** a session in a structured program, **When** the teacher logs scores, **Then** the student's progress within their enrollment is updated accordingly.

---

### User Story 6 — Teacher Rating & Quality Feedback (Priority: P6)

After a session is logged by the teacher, the student receives a push notification prompting a quick rating. They tap to rate: 1-5 stars (mandatory), optional quick-select tags (e.g., "Patient," "Clear explanation," "Session felt rushed"), and an optional written comment (max 500 characters). The rating is anonymous to the teacher. The teacher sees their aggregate stats (average rating, trend, common tags) but not individual reviewer names. Supervisors see individual reviews with student names for quality oversight. A teacher's public rating only becomes visible after 5 rated sessions.

**Why this priority**: In a volunteer organization, ratings are the primary quality signal. They enable students to choose teachers based on quality and give supervisors data for quality management.

**Independent Test**: A student can rate a session, the teacher sees updated aggregate stats (without the student's identity), and the rating appears on the teacher's public card once the 5-review threshold is met.

**Acceptance Scenarios**:

1. **Given** a session was logged, **When** the student opens the rating prompt (within 48 hours), **Then** they see: 1-5 star selector, optional tag chips (positive: "Patient," "Clear explanation," "Encouraging," "Excellent tajweed," "Well-prepared"; constructive: "Session felt rushed," "Hard to understand," "Frequently late," "Disorganized"), and an optional comment field.
2. **Given** a student submits a rating, **Then** only one rating per session is allowed, and the 48-hour window closes for that session.
3. **Given** a teacher with fewer than 5 rated sessions, **When** a student views their profile card, **Then** no rating is displayed (shows "New Teacher" or similar).
4. **Given** a teacher with 5+ rated sessions, **When** a student views their profile card, **Then** the average rating (e.g., "4.7 ★ (43 reviews)") is displayed.
5. **Given** a teacher viewing their own dashboard, **Then** they see: average rating, rating trend (improving/declining), most common positive tags, most common constructive tags — but no individual student names.
6. **Given** a rating of 2 stars or below, **Then** the review is auto-flagged for supervisor attention.
7. **Given** a supervisor viewing a teacher's reviews, **Then** they see individual reviews with student names, can flag abusive reviews, and can exclude reviews from the aggregate calculation with a documented reason.

---

### User Story 7 — Free Program Queue & Fair Usage (Priority: P7)

A student opens a free program but no teachers are currently available. Instead of an empty list, they see a message with the estimated wait time and their queue position, and can tap "Notify Me" to join the queue. When a teacher becomes available, the first student in the queue receives a push notification with a 3-minute claim window. If unclaimed, the notification cascades to the next student. A daily session limit (default: 2 per program) ensures fair usage — students who haven't had a session that day get queue priority over those who have reached the limit.

**Why this priority**: Without queue management, students see an empty teacher list and leave. This converts frustrated exits into engaged waiting and ensures fair distribution of limited volunteer teacher time.

**Independent Test**: A student can join a queue when no teachers are available, receive a notification when a teacher comes online, and the daily session limit is enforced.

**Acceptance Scenarios**:

1. **Given** no teachers are available in a free program, **When** a student views the program, **Then** they see: "All teachers are currently in sessions," estimated wait time, and a "Notify Me" button.
2. **Given** a student taps "Notify Me," **Then** they are added to the program-specific queue and shown their position (e.g., "You are #3 in line").
3. **Given** a student is #1 in the queue, **When** a teacher becomes available, **Then** the student receives a push notification: "A teacher is now available! Tap to join." with a 3-minute claim window.
4. **Given** the 3-minute window expires without action, **Then** the notification goes to the next student in the queue.
5. **Given** a student has reached their daily session limit (default 2), **When** there is a queue, **Then** students who haven't had a session that day get priority.
6. **Given** a student has reached the daily limit but no queue exists, **Then** they can still join an available teacher normally.
7. **Given** a queue has 5+ students, **Then** offline teachers in that program receive a notification: "Students are waiting — can you come online?"
8. **Given** a queue entry, **When** 2 hours pass without the student being served, **Then** the queue entry expires automatically.

---

### User Story 8 — Supervisor Oversight (Priority: P8)

A Supervisor assigned to a group of teachers within a program can view their teachers' activity: session counts, recent session logs, and student progress. They see flagged reviews (ratings of 2 stars or below) and rating trends. They can reassign students between their teachers. They report issues to the Program Admin. The Supervisor cannot see data outside their assigned program or teacher group.

**Why this priority**: Supervisors are the quality management layer between teachers and Program Admins. They ensure teacher accountability and student care within volunteer operations.

**Independent Test**: A supervisor can view their assigned teachers' session activity, see flagged low reviews, and reassign a student from one teacher to another.

**Acceptance Scenarios**:

1. **Given** a Supervisor is logged in, **When** they view their dashboard, **Then** they see a list of their assigned teachers with: session counts (this week/month), active student counts, and average rating.
2. **Given** a Supervisor viewing a teacher's detail, **Then** they see: recent session logs, per-student progress, individual reviews with student names, and flagged reviews.
3. **Given** a Supervisor, **When** they reassign a student from Teacher A to Teacher B (both within their group), **Then** the enrollment is updated and both teachers are notified.
4. **Given** a Supervisor, **When** they attempt to access a teacher outside their assigned group, **Then** access is denied.
5. **Given** a teacher's average rating drops below the warning threshold (default 3.5), **Then** the Supervisor receives an alert.

---

### Edge Cases

- What happens when a student tries to enroll in a program they are already enrolled in? System MUST prevent duplicate active enrollments for the same program/track/cohort combination.
- What happens when a teacher goes offline while a student is viewing their card? The teacher card MUST be removed from the "Available Now" list in real-time via the realtime subscription.
- What happens when two students tap "Join" on the same 1-on-1 teacher simultaneously? The first to connect is served; the second sees an updated "In Session" status.
- What happens when a Program Admin is removed from their role? All their program-scoped access is revoked immediately; in-progress cohorts continue under existing teacher assignments.
- What happens when a student's queue notification claim window overlaps with another student's claim? Queue entries are processed sequentially by position — only one student is notified at a time.
- What happens when a teacher is assigned to a program that is later deactivated? The teacher's availability toggle for that program is disabled; their assignments to active programs are unaffected.
- What happens when a voice memo upload fails due to network issues? The recording is saved locally and retried when connectivity returns. The session log is saved independently of the voice memo upload.

## Requirements *(mandatory)*

### Functional Requirements

**Authentication & Registration**

- **FR-001**: System MUST support sign-in exclusively via OAuth providers: Google Sign-In and Apple Sign-In. No email/password or phone/SMS authentication.
- **FR-002**: System MUST assign the `student` role to all new users by default upon first sign-in.
- **FR-003**: Teachers, supervisors, and admins MUST only be promoted by higher-level admins (not self-registration).
- **FR-004**: Apple Sign-In MUST be offered whenever Google Sign-In is offered (App Store requirement).
- **FR-005**: On first sign-in, the system MUST present a one-time onboarding form collecting: display name (required), gender (male/female, required), age range (required, options: under 13, 13-17, 18-25, 26-35, 36-50, 50+), country (required), and region/province (optional).
- **FR-006**: Users MUST be able to update their profile data (display name, gender, age range, country, region) from profile settings at any time.

**Programs & Tracks**

- **FR-007**: System MUST support 3 program categories: `free`, `structured`, and `mixed`.
- **FR-008**: Each program MUST have a name in both Arabic and English, a description, a category, and configurable settings.
- **FR-009**: Programs MUST support sub-divisions called "tracks" with independent names, descriptions, and curriculum definitions.
- **FR-010**: System MUST seed all 8 programs and their tracks from the PRD at initial deployment (per Appendix A of the PRD).

**Role & Permission System**

- **FR-011**: System MUST enforce exactly 5 roles: `student`, `teacher`, `supervisor`, `program_admin`, `master_admin`.
- **FR-012**: Program Admins, Supervisors, and Teachers MUST be scoped to specific programs via a role-assignment record.
- **FR-013**: Program Admins MUST only access data within their assigned program(s).
- **FR-014**: Master Admins MUST have unrestricted access to all programs and data.
- **FR-015**: A teacher MUST be assignable to multiple programs simultaneously.

**Teacher Availability (Free Programs)**

- **FR-016**: Teachers in free programs MUST have an availability toggle (online/offline).
- **FR-017**: Available teachers MUST appear in a real-time "Available Now" list scoped by program.
- **FR-018**: Each teacher MUST have a configurable maximum concurrent student count (default: 1).
- **FR-019**: Teacher availability status changes MUST propagate to all connected clients in real-time.

**External Meeting Links**

- **FR-020**: Each teacher MUST store a persistent meeting link in their profile (any valid URL: Google Meet, Zoom, Jitsi, etc.).
- **FR-021**: When a student joins a teacher's session, the system MUST reveal the meeting link and offer to open it via deep link.
- **FR-022**: The system MUST NOT host, proxy, or stream any audio or video content.

**Enrollment & Cohorts**

- **FR-023**: Students MUST be able to enroll in structured programs.
- **FR-024**: Enrollments MUST support statuses: `pending`, `approved`, `active`, `completed`, `dropped`, `waitlisted`.
- **FR-025**: Cohorts MUST have a lifecycle: `enrollment_open` → `enrollment_closed` → `in_progress` → `completed` → `archived`.
- **FR-026**: Each cohort MUST track: max students, assigned teacher, assigned supervisor, schedule, meeting link, and date range.
- **FR-027**: Program Admin MUST be able to configure whether enrollment requires approval or auto-approves.

**Session Logging**

- **FR-028**: When a student taps "Join Session" on an available teacher, the system MUST create a draft session record linking the student, teacher, and program.
- **FR-029**: Teachers MUST be able to complete draft sessions by logging outcomes: attending students, per-student score (0-5), text notes.
- **FR-030**: Sessions MUST be associated with a program.
- **FR-031**: Students MUST be able to view their session history with all logged details.
- **FR-032**: The "In Session" status for a teacher MUST be derived from the existence of active draft sessions (not solely from the availability toggle).

**Voice Memos**

- **FR-033**: Teachers MUST be able to record a post-session voice memo (max 2 minutes) for each student.
- **FR-034**: Voice memos MUST auto-delete after 30 days.
- **FR-035**: Students MUST be able to play voice memos with speed controls (1x, 1.25x, 1.5x).
- **FR-036**: One voice memo is allowed per student per session. In a multi-student session, the teacher records a separate memo for each attending student.

**Teacher Ratings**

- **FR-037**: Students MUST be able to rate teachers 1-5 stars after each session.
- **FR-038**: Rating prompt MUST expire 48 hours after the session.
- **FR-039**: Only one rating per student per session is allowed.
- **FR-040**: Teacher's public rating MUST only be displayed after 5 rated sessions.
- **FR-041**: Ratings MUST be anonymous to the teacher (no student names visible to the teacher).
- **FR-042**: Supervisors MUST see individual reviews with student names for oversight purposes.
- **FR-043**: Ratings of 2 stars or below MUST be auto-flagged for supervisor review.
- **FR-044**: Supervisors MUST be able to exclude abusive reviews from the aggregate with a documented reason.

**Queue & Fair Usage (Free Programs)**

- **FR-045**: When no teachers are available, students MUST be able to join a program-specific queue.
- **FR-046**: Queue entries MUST expire after 2 hours of inactivity.
- **FR-047**: When a teacher becomes available, the first queued student MUST receive a notification with a 3-minute claim window.
- **FR-048**: A configurable daily session limit per student per free program MUST be enforced (default: 2).
- **FR-049**: Students below the daily limit MUST have queue priority over those who have reached it.
- **FR-050**: When queue size exceeds a threshold (default: 5), offline teachers in that program MUST be notified.

**Waitlist (Structured Programs)**

- **FR-051**: When a cohort or teacher is at capacity, students MUST be able to join a waitlist.
- **FR-052**: When a spot opens, the first waitlisted student MUST be notified with a 24-hour confirmation window.
- **FR-053**: If confirmation expires, the offer MUST cascade to the next waitlisted student.
- **FR-054**: Program Admins MUST see waitlist sizes per cohort/track to inform capacity decisions.

**Notifications**

- **FR-055**: System MUST send push notifications for: enrollment approval, session reminders, teacher availability (queue), voice memo received, rating prompt, waitlist offers, and quality alerts.
- **FR-056**: Students MUST be able to configure notification preferences per category.

**Supervisor Functions**

- **FR-057**: Supervisors MUST see activity summaries for their assigned teachers.
- **FR-058**: Supervisors MUST be able to reassign students between teachers within their group.
- **FR-059**: Supervisors MUST receive alerts when a teacher's rating drops below the configurable warning threshold (default: 3.5).

**Offline Capability**

- **FR-060**: Previously loaded screens (programs, session history, progress, profile) MUST be viewable from cache when the device is offline.
- **FR-061**: All write operations (join session, enroll, rate, log session, toggle availability) MUST require connectivity and display a clear offline indicator when unavailable.
- **FR-062**: When connectivity is restored, cached data MUST refresh automatically.

### Key Entities

- **Profile**: A platform user with a global role, display name, gender, age range, country, region/province (optional), optional meeting link, languages spoken, and bio. Teachers and students share the same entity differentiated by role. Demographic fields (gender, age range, country, region) are collected at onboarding for future analytics.
- **Program**: A learning program with a name (bilingual), category (free/structured/mixed), active status, and configurable settings (capacity limits, session rules, rating thresholds).
- **Program Track**: A sub-division within a program representing a specific curriculum path (e.g., "Tuhfat al-Atfal" track within the Mutoon program).
- **Program Role**: A junction linking a user to a specific program with a role (program_admin, supervisor, or teacher), enabling multi-program assignments.
- **Cohort**: A group of students in a structured program track with an assigned teacher, supervisor, schedule, capacity, and lifecycle status.
- **Enrollment**: A student's participation in a program/track/cohort, tracking status from pending through completion or withdrawal.
- **Teacher Availability**: A teacher's real-time online/offline status for a specific free program, including max concurrent student capacity.
- **Session**: A recorded learning interaction between a teacher and student(s), linked to a program. Created as a draft when a student joins (free programs) and completed by the teacher with scores, notes, and duration after the external meeting ends. Draft sessions drive the "In Session" status and daily session counting.
- **Voice Memo**: An audio recording attached to a session, with an expiration date (30 days), stored externally with a reference path.
- **Teacher Review**: A student's anonymous rating (1-5 stars), optional tags, and optional comment for a specific session, with auto-flagging and exclusion capabilities.
- **Teacher Rating Stats**: Aggregated per-teacher-per-program statistics: average rating, distribution counts, and most common feedback tags.
- **Free Program Queue**: An ephemeral, ordered queue for students waiting for available teachers in a free program, with expiration and claim-window mechanics.
- **Program Waitlist**: A persistent, ordered waitlist for students waiting for a spot in a full cohort or teacher assignment, with notification and confirmation mechanics.
- **Daily Session Count**: A per-student, per-program, per-day counter for enforcing fair usage limits in free programs.
- **Platform Config**: A single-row configuration table for the organization's global settings, branding, and defaults.

## Clarifications

### Session 2026-02-28

- Q: When a student taps "Join Session" in a free program, is a session record created? → A: Yes — a draft/in-progress session record is created when the student joins; the teacher completes it with scores/notes after the external meeting ends. This draft drives "In Session" status and daily session counting.
- Q: Does the MVP include offline data access? → A: Yes — read-only offline. Previously loaded screens (programs, session history, progress) are viewable from cache when offline. All write operations (join session, enroll, rate, log session) require connectivity.
- Q: What authentication method should the platform use? → A: OAuth only — no email/password, no phone/SMS. Google and Apple sign-in (both free and reliable). No credentials stored or managed by the platform.
- Q: What user profile data should be collected at onboarding for future analytics? → A: Post-sign-in onboarding step (~30 sec): display name (required), gender (male/female), age range (e.g., under 13, 13-17, 18-25, 26-35, 36-50, 50+), country (required), region/province (optional). All stored on profile for reporting.

## Assumptions

- All 8 programs from PRD Appendix A are seeded at initial deployment. Program-specific features (Himam partner matching, Mutoon line-by-line progress, Qiraat Ijazah chain of narration, certificate PDF generation) are out of scope for this MVP and will be addressed in subsequent feature branches.
- The Children's Program guardian management (storing parent/guardian info on student profiles) is out of scope for this MVP.
- The student-to-student peer matching feature (Program 1, Section 2) is out of scope for this MVP.
- Voice memo recording uses the device's built-in microphone and stores audio in a compressed speech-optimized format. Max file size per memo is approximately 120KB.
- Meeting links accept any valid URL. No platform standardization is enforced — teachers choose their preferred tool.
- Free program access is instant upon registration. Structured program enrollment may require admin approval (configurable per program).
- The Supervisor role is included in the permission system and has a basic dashboard for teacher oversight. Advanced supervisor analytics are deferred.
- Notification delivery relies on the existing push notification infrastructure (Expo Push API + Edge Functions).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete registration and reach the program listing screen in under 60 seconds.
- **SC-002**: A teacher toggling "Available" is visible to students in the "Available Now" list within 2 seconds.
- **SC-003**: A student can discover a program, view its details, and initiate enrollment or join an available teacher in under 3 taps from the home screen.
- **SC-004**: The platform supports 1,000+ concurrent students and 100+ simultaneously available teachers without degradation.
- **SC-005**: A teacher can log a complete session outcome (attendance, scores, notes) in under 90 seconds.
- **SC-006**: 80% of students who receive a rating prompt complete the rating (star selection) within the 48-hour window.
- **SC-007**: When no teachers are available, 90% of students who join the queue are served within the estimated wait time displayed.
- **SC-008**: Waitlisted students are notified within 5 minutes of a spot opening.
- **SC-009**: Program Admins can create a cohort, assign a teacher, and open enrollment in under 2 minutes.
- **SC-010**: Data access is fully scoped — no user can access data outside their role and program boundaries under any circumstance.
