# Student Test Script

> **Role:** Student
> **Route group:** `/(student)/`
> **Theme color:** Indigo
> **Last updated:** 2026-03-07

---

## Prerequisites

- [ ] Test account with role `student` (credentials documented separately)
- [ ] Enrolled in at least 1 program/class
- [ ] At least 1 completed session exists for the student
- [ ] At least 1 sticker has been awarded to the student
- [ ] At least 1 badge has been earned (or is close to threshold)
- [ ] At least 1 certificate has been issued
- [ ] A Himam event exists (active or upcoming)
- [ ] At least 1 teacher is currently marked as available
- [ ] Push notifications are supported on the test device
- [ ] Network connectivity is stable (for initial pass; disable later for edge-case tests)

---

## Quick Smoke Test

> Run these first. If any fail, stop and investigate before continuing with the full script.

- [ ] **QS-01** Login → student dashboard with 6 tabs: Dashboard, Programs, Memorization, Revision, Journey, Profile
- [ ] **QS-02** Dashboard loads with level and points displayed
- [ ] **QS-03** Programs tab loads with available programs
- [ ] **QS-04** Memorization tab shows progress data
- [ ] **QS-05** Revision tab loads with revision schedule
- [ ] **QS-06** Journey tab shows gamification overview (stickers, badges, level)
- [ ] **QS-07** Profile tab loads with name, email, and role
- [ ] **QS-08** Can view a session detail (read-only)
- [ ] **QS-09** Cannot access `/(teacher)/` or `/(master-admin)/` routes

---

## A. Dashboard Verification

### A1. Tab Bar

1. Log in as a student.
2. Observe the bottom tab bar.

- [ ] Exactly 6 tabs are visible: **Dashboard, Programs, Memorization, Revision, Journey, Profile**
- [ ] Tab bar uses Indigo theme color for the active tab indicator/icon
- [ ] No teacher-only or admin-only tabs are visible (no "Manage", "Admin", "Classes", etc.)

### A2. Dashboard Home (`(tabs)/index.tsx`)

1. Land on the Dashboard tab (should be default).
2. Observe the content.

- [ ] Dashboard loads without errors
- [ ] Student level is displayed
- [ ] Points / XP total is displayed
- [ ] Recent activity section is visible (e.g., last session, last sticker)
- [ ] No admin or teacher action buttons are present (no "Log Session", "Award Sticker", etc.)

---

## B. Programs & Enrollment

### B1. Browse Programs

1. Tap the **Programs** tab (`(tabs)/programs.tsx`).
2. Observe the programs list.

- [ ] Programs list loads successfully
- [ ] Each program card shows name, description, and type
- [ ] Programs the student is already enrolled in are visually distinguished (e.g., "Enrolled" badge)
- [ ] Pull-to-refresh works

### B2. View Program Details

1. Tap on any program from the list.
2. Navigate to program detail screen (`programs/[id].tsx`).

- [ ] Program detail screen loads with full description
- [ ] Enrollment status is shown (enrolled / not enrolled / waitlisted)
- [ ] Program schedule or session info is visible if enrolled

### B3. Enroll in a Program

1. Find a program the student is NOT enrolled in.
2. Tap the enroll / join button.

- [ ] Enroll action succeeds with confirmation feedback
- [ ] Program now appears in "My Programs" list
- [ ] If the program is full, student is placed on a waitlist with a visible status indicator

### B4. My Programs

1. Navigate to **My Programs** (`programs/my-programs.tsx`).

- [ ] Only programs the student is currently enrolled in are listed
- [ ] Each entry shows program name, current status, and progress summary
- [ ] Tapping a program navigates to its detail screen

### B5. Drop a Program

1. From My Programs or a program detail screen, find the option to drop/leave a program.
2. Tap drop.

- [ ] Confirmation dialog appears before dropping
- [ ] After confirming, the program is removed from My Programs
- [ ] The student can re-enroll if the program still has capacity

### B6. Waitlist Status

1. Enroll in a program that is at capacity (if available).

- [ ] Student sees a "Waitlisted" status instead of "Enrolled"
- [ ] Waitlist position is displayed (e.g., "Position 3 of 5")
- [ ] Student can cancel their waitlist entry

---

## C. Sessions

### C1. Session List

1. Navigate to sessions (`sessions/index.tsx`) from the dashboard or a relevant link.

- [ ] List of the student's sessions loads
- [ ] Each session shows date, teacher name, and status (completed, upcoming, etc.)
- [ ] Sessions are ordered chronologically (most recent first or upcoming first)
- [ ] Only the student's own sessions are shown (no other students' sessions)

### C2. Session Details

1. Tap on a specific session (`sessions/[id].tsx`).

- [ ] Session detail screen loads
- [ ] Shows: date/time, teacher, surah/ayah range, performance notes (if any)
- [ ] Attendance status is visible
- [ ] Stickers awarded during this session are shown (if any)
- [ ] Student cannot edit session details (read-only)

### C3. Session Schedule

1. Navigate to schedule (`schedule/index.tsx`).

- [ ] Schedule view loads (calendar or list format)
- [ ] Upcoming sessions are highlighted
- [ ] Past sessions are distinguishable from future ones

2. Tap on a specific scheduled session (`schedule/[id].tsx`).

- [ ] Schedule detail loads with date, time, location/link, and teacher info
- [ ] Student cannot modify the schedule (read-only)

---

## D. Memorization & Revision

### D1. Memorization Progress

1. Tap the **Memorization** tab (`(tabs)/memorization.tsx`).

- [ ] Memorization progress screen loads
- [ ] Overall progress is displayed (e.g., percentage, juz count, surah count)
- [ ] Breakdown by surah or juz is visible
- [ ] Progress data matches what the teacher has logged

### D2. Rub (Quarter) Progress

1. Navigate to **Rub Progress** (`rub-progress.tsx`).

- [ ] Rub coverage grid or list loads
- [ ] Completed rubs are visually marked
- [ ] Remaining rubs are clearly identified
- [ ] Overall coverage percentage is displayed

### D3. Revision Schedule

1. Tap the **Revision** tab (`(tabs)/revision.tsx`).

- [ ] Revision schedule loads with upcoming revision items
- [ ] Each item shows the surah/ayah range and suggested revision date
- [ ] Overdue revisions are visually highlighted

### D4. Record a Revision

1. From the Revision tab, find a revision item.
2. Mark it as completed / record the revision.

- [ ] Student can mark a revision as done
- [ ] Completion is saved and reflected in the UI
- [ ] The next revision date is updated accordingly
- [ ] Cannot record a revision for content not yet memorized

---

## E. Mutoon Progress

### E1. View Mutoon Progress

1. Navigate to **Mutoon Progress** (`mutoon/[programId].tsx`) from a program detail or relevant link.

- [ ] Mutoon text and progress loads for the selected program
- [ ] Current memorization position is indicated
- [ ] Progress percentage or fraction is shown

### E2. Update Mutoon Progress

1. Interact with the mutoon progress screen to update progress (mark sections as memorized).

- [ ] Student can update their own mutoon progress
- [ ] Changes are saved and reflected immediately
- [ ] Progress bar or indicator updates accordingly

---

## F. Gamification

### F1. Stickers & Badges (Journey Tab)

1. Tap the **Journey** tab (`(tabs)/journey.tsx`).

- [ ] Journey screen loads showing the student's gamification overview
- [ ] Sticker count or collection summary is visible
- [ ] Badge summary is visible
- [ ] Level and points are displayed

### F2. Badge Collection

1. Navigate to **Badges** (`profile/badges.tsx`).

- [ ] Badge collection screen loads
- [ ] Earned badges are displayed with name, icon, and date earned
- [ ] Locked/unearned badges are shown as greyed out or with progress toward them
- [ ] Tapping a badge shows details or earning criteria

### F3. Program Leaderboard

1. From the dashboard, tap "View Leaderboard" (navigates to `program/[programId]/leaderboard.tsx` using the student's first enrolled program).

- [ ] Program-specific leaderboard loads
- [ ] Only students enrolled in the same program are shown
- [ ] Current student's rank within the program is highlighted
- [ ] Leaderboard shows rank, name, and level
- [ ] Student cannot see other students' private data (only public leaderboard info)
- [ ] If the student has no enrollments, the leaderboard button is hidden on the dashboard

---

## G. Ratings & Queue

### G1. Rate a Session

1. Complete a session (or use a recently completed session within the last 48 hours).
2. Find the option to rate the session.

- [ ] Rating option is available for sessions completed within the last 48 hours
- [ ] Student can submit a rating (e.g., 1-5 stars or similar scale)
- [ ] Rating is saved with confirmation feedback
- [ ] Cannot rate a session older than 48 hours
- [ ] Cannot rate the same session twice

### G2. Join a Queue

1. Find a free program with a queue system.
2. Join the queue (`queue/claim/[entryId].tsx`).

- [ ] Student can join a free program queue
- [ ] Queue position or status is displayed after joining
- [ ] Student receives feedback when it is their turn (if applicable)

### G3. View Queue Status

1. After joining a queue, check the queue entry.

- [ ] Current queue status is visible (waiting, claimed, expired, etc.)
- [ ] Student can cancel their queue entry if still waiting
- [ ] Cannot modify another student's queue entry

---

## H. Certificates

### H1. View Certificates List

1. Navigate to **Certificates** (`certificates/index.tsx`).

- [ ] Certificates list loads
- [ ] Each certificate shows title, program name, and issue date
- [ ] If no certificates exist, an appropriate empty state is shown

### H2. View Certificate Details

1. Tap on a specific certificate (`certificates/[id].tsx`).

- [ ] Certificate detail screen loads
- [ ] Full certificate is displayed (QR code, student name, program, date, etc.)
- [ ] Sharing or download option is available (if implemented)
- [ ] Certificate data is read-only (student cannot edit)

---

## I. Himam Events

### I1. View Himam Events

1. Navigate to **Himam** (`himam/index.tsx`).

- [ ] Himam events list loads
- [ ] Each event shows name, date range, and status (upcoming, active, completed)
- [ ] Events the student is registered for are visually marked

### I2. Register for a Himam Event

1. Find an upcoming or active Himam event the student is not registered for.
2. Tap register.

- [ ] Registration succeeds with confirmation feedback
- [ ] Event now shows "Registered" status
- [ ] Student can only register once per event

### I3. Record Himam Progress

1. Navigate to a registered Himam event's progress screen (`himam/[eventId]/progress.tsx`).

- [ ] Progress recording screen loads
- [ ] Student can log daily or periodic progress
- [ ] Progress is saved and reflected in the UI
- [ ] Cannot record progress for an event the student is not registered for

### I4. Himam History

1. Navigate to **Himam History** (`himam/history.tsx`).

- [ ] Past Himam events and participation history loads
- [ ] Completed events show final progress/results
- [ ] Student can review but not modify past entries

---

## J. Teacher Availability

### J1. View Available Teachers

1. Navigate to **Available Now** (`available-now/[programId].tsx`) from a program context.

- [ ] List of currently available teachers loads
- [ ] Available teachers show a green dot indicator
- [ ] Teacher name and relevant info (subject, program) is displayed
- [ ] Student cannot modify teacher availability (read-only)
- [ ] Unavailable teachers are either hidden or shown without the green dot

---

## K. Profile & Settings

### K1. View Profile

1. Tap the **Profile** tab (`(tabs)/profile.tsx`).

- [ ] Profile screen loads with student's name, email, and avatar
- [ ] Level, points, and enrollment summary are visible
- [ ] Role is displayed as "Student" (or equivalent)

### K2. Edit Profile

1. Tap the edit option on the profile screen.

- [ ] Student can edit allowed fields (name, avatar, etc.)
- [ ] Changes are saved with confirmation feedback
- [ ] Student cannot change their own role or permissions
- [ ] Email change follows proper verification flow (if allowed)

### K3. Notification Preferences

1. Navigate to **Notification Preferences** (`notification-preferences.tsx`).

- [ ] Notification preferences screen loads
- [ ] Toggles for different notification types are visible (e.g., session reminders, sticker awards, Himam updates)
- [ ] Student can enable/disable specific notification categories
- [ ] Changes are saved and persisted across app restarts
- [ ] Push token registration works on the test device

---

## L. Negative Tests / Permission Boundaries

### L1. Cannot Access Teacher Routes

1. Manually attempt to navigate to a teacher route (e.g., `/(teacher)/` or session logging screen) via deep link or URL manipulation.

- [ ] Student is redirected away or shown an "Unauthorized" / "Not Found" screen
- [ ] No teacher-specific actions are available anywhere in the student UI

### L2. Cannot Access Admin Routes

1. Manually attempt to navigate to an admin route (e.g., `/(admin)/` or program management screen).

- [ ] Student is redirected away or shown an "Unauthorized" / "Not Found" screen
- [ ] No admin-specific actions are available

### L3. Cannot View Other Students' Data

1. Attempt to access another student's profile, sessions, or progress (via URL manipulation with a different student ID).

- [ ] Request is denied or returns empty/unauthorized
- [ ] No private data from other students is leaked

### L4. Cannot Log Sessions

1. Verify there is no "Log Session" or "Create Session" button anywhere in the student UI.

- [ ] No session creation UI is present
- [ ] API calls to create sessions (if attempted) are rejected

### L5. Cannot Award Stickers

1. Verify there is no sticker-awarding UI anywhere in the student flow.

- [ ] No "Award Sticker" option exists
- [ ] API calls to award stickers (if attempted) are rejected

### L6. Cannot Manage Programs

1. Verify the student cannot create, edit, or delete programs.

- [ ] No program management UI is present (only browse and enroll)
- [ ] API calls to create/edit/delete programs (if attempted) are rejected

### L7. Cannot Rate Expired Sessions

1. Find a session older than 48 hours.
2. Attempt to rate it.

- [ ] Rating option is disabled or hidden for sessions older than 48 hours
- [ ] API rejects rating attempts for expired sessions

---

## M. Edge Cases

### M1. Empty States

1. Use a fresh student account with no data (no sessions, no enrollments, no stickers).

- [ ] Dashboard shows an appropriate empty state (welcome message, getting started guide)
- [ ] Programs tab shows "No enrollments" with a prompt to browse programs
- [ ] Memorization tab shows "No progress yet"
- [ ] Revision tab shows "No revisions scheduled"
- [ ] Journey tab shows starting level with zero progress
- [ ] Certificates list shows "No certificates yet"
- [ ] Himam shows available events or "No events" message
- [ ] Leaderboard still loads (student may be at the bottom or unranked)

### M2. Loading States

1. On a slower connection (or throttled), observe each screen during data fetch.

- [ ] All screens show a loading indicator (spinner, skeleton, or shimmer) while fetching
- [ ] No screen flashes an error before data arrives
- [ ] Loading states are visually consistent across screens

### M3. Network Error Handling

1. Disable network connectivity.
2. Attempt to load each major screen.

- [ ] Each screen shows an appropriate error message (e.g., "No internet connection")
- [ ] A retry button is available where applicable
- [ ] App does not crash on network failure
- [ ] Cached data (if any) is displayed with a staleness indicator

3. Re-enable network connectivity and tap retry.

- [ ] Data loads successfully after reconnection
- [ ] UI returns to normal state

### M4. Pull-to-Refresh

1. On screens that support pull-to-refresh, pull down.

- [ ] Refresh animation plays
- [ ] Data is reloaded from the server
- [ ] UI updates if data has changed

### M5. Deep Link / Cold Start

1. Kill the app completely.
2. Open a deep link to a student screen (e.g., a specific session detail).

- [ ] App opens and navigates to the correct screen after authentication
- [ ] If not authenticated, the login screen appears first, then redirects after login

### M6. Rapid Navigation

1. Quickly tap between all 6 tabs in succession.

- [ ] No crashes or visual glitches
- [ ] Each tab loads or shows cached content appropriately
- [ ] No duplicate network requests pile up

---

## Sign-Off

| Section | Tester | Date | Pass/Fail | Notes |
|---------|--------|------|-----------|-------|
| A. Dashboard | | | | |
| B. Programs | | | | |
| C. Sessions | | | | |
| D. Memorization & Revision | | | | |
| E. Mutoon Progress | | | | |
| F. Gamification | | | | |
| G. Ratings & Queue | | | | |
| H. Certificates | | | | |
| I. Himam | | | | |
| J. Teacher Availability | | | | |
| K. Profile & Settings | | | | |
| L. Permission Boundaries | | | | |
| M. Edge Cases | | | | |
