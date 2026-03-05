# Feature Specification: Teacher Availability (Green Dot System)

**Feature Branch**: `004-teacher-availability`
**Created**: 2026-03-04
**Status**: Draft
**Input**: User description: "004-teacher-availability"

## User Scenarios & Testing

### User Story 1 - Teacher Toggles Availability (Priority: P1)

A teacher assigned to a free or mixed program can go "online" to signal they are available for drop-in recitation sessions. They toggle a prominent switch on their teacher dashboard. While online, a green dot (8dp circle, #22C55E, bottom-end of avatar) appears next to their name on the Available Now list, cohort teacher cards, team management lists, and program detail teacher sections. The teacher also sees their current active student count (e.g., "2/3 students"). When finished, they tap "Go Offline" and are removed from the available list.

**Why this priority**: This is the core mechanic — without the toggle, no teacher can signal availability, and the entire feature is non-functional.

**Independent Test**: Sign in as a teacher assigned to a free program → tap "Go Available" → verify green dot appears → tap "Go Offline" → verify green dot disappears.

**Acceptance Scenarios**:

1. **Given** a teacher is assigned to a free program via `program_roles`, **When** they tap "Go Available" and select the program, **Then** a `teacher_availability` record is created with `is_available = true` and a timestamp.
2. **Given** a teacher is currently available, **When** they tap "Go Offline", **Then** `is_available` is set to `false`, `active_student_count` resets to 0, and they are removed from all available-teacher lists.
2a. **Given** a teacher is assigned to multiple free/mixed programs, **When** they tap "Go Available", **Then** a program selector opens showing eligible programs with per-program toggles, allowing simultaneous availability for multiple programs.
3. **Given** a teacher is not assigned to any free/mixed program, **When** they view the availability toggle, **Then** the toggle is disabled with a message explaining they must be assigned to a free program first.
4. **Given** a teacher is available with max concurrent students set to 3, **When** 3 students have joined, **Then** the "Join Session" button is replaced with a "Teacher Full" indicator on the teacher's card; the card remains visible.
5. **Given** a teacher is available, **When** they view their availability toggle, **Then** they see their current active student count displayed as "X/Y students" (e.g., "2/3 students").
6. **Given** a teacher reduces max_students below the current active_student_count, **When** saving the change, **Then** no existing sessions are disrupted — new joins are blocked until the count drops below the new max or the teacher toggles offline to reset.

---

### User Story 2 - Student Browses Available Teachers (Priority: P2)

A student enrolled in a free or mixed program opens the "Available Now" list to see all teachers currently online for that program. The student accesses Available Now from the program detail screen (for free/mixed programs, an "Available Teachers" section appears). Each teacher card shows the teacher's name, a "New" badge (placeholder until ratings spec), spoken languages displayed as full names in the current locale (e.g., "Arabic, English, Urdu"), and a "Join Session" button. The list updates in real time as teachers come online or go offline. While loading, 3 skeleton placeholder cards are shown.

**Why this priority**: This is the primary student-facing value — connecting students with available teachers is the purpose of the green dot system.

**Independent Test**: Sign in as a student enrolled in a free program → navigate to Available Now → see list of online teachers → verify cards show name, "New" badge, languages → verify list updates when a teacher goes offline.

**Acceptance Scenarios**:

1. **Given** a student is enrolled in a free program, **When** they navigate to the Available Now screen for that program, **Then** they see all teachers currently available for that program ordered by `available_since` (longest-waiting first).
2. **Given** a teacher goes offline, **When** the student is viewing the Available Now list, **Then** the teacher's card disappears from the list within 5 seconds of client-perceived latency (via real-time subscription).
3. **Given** no teachers are currently available, **When** the student opens Available Now, **Then** they see an empty state with a message "No teachers available right now — check back soon."
4. **Given** a teacher has reached max concurrent students, **When** a student views that teacher's card, **Then** the "Join" button is replaced with a "Teacher Full" indicator.

---

### User Story 3 - Student Joins a Teacher's Session via Meeting Link (Priority: P3)

When a student taps "Join Session" on an available teacher's card, the app deep-links to the teacher's external meeting platform (Google Meet, Zoom, Jitsi, or other). The meeting link is stored on the teacher's profile and displayed only when the teacher is available.

**Why this priority**: Connecting the student to the actual session is the final step of the flow but depends on US1 and US2 being complete.

**Independent Test**: Sign in as student → find available teacher → tap "Join Session" → verify the app opens the meeting link in the device browser or app → verify the teacher's meeting link is not exposed when they are offline.

**Acceptance Scenarios**:

1. **Given** a student taps "Join Session" on an available teacher's card, **When** the teacher has a meeting link configured, **Then** the app opens the link via the device's default handler (browser or meeting app).
2. **Given** a teacher has no meeting link configured, **When** a student views the teacher's available card, **Then** the "Join Session" button is disabled with a message "Meeting link not configured."
3. **Given** a teacher is offline, **When** a student attempts to access the teacher's meeting link via direct URL, **Then** the link is not exposed (availability check prevents access).

---

### User Story 4 - Teacher Configures Profile for Availability (Priority: P4)

A teacher can configure their profile with a meeting link, meeting platform preference, and spoken languages. This information is displayed on their availability card and used when students join sessions.

**Why this priority**: Profile configuration is a prerequisite for meaningful availability cards but can use sensible defaults initially.

**Independent Test**: Sign in as teacher → navigate to Profile → add meeting link and languages → save → verify info appears on availability card when online.

**Acceptance Scenarios**:

1. **Given** a teacher navigates to their profile settings, **When** they enter a meeting link and select a platform, **Then** the meeting link and platform are saved to their profile.
2. **Given** a teacher adds spoken languages (e.g., Arabic, English, Urdu), **When** they are available, **Then** their availability card displays the languages.
3. **Given** a teacher has not configured a meeting link, **When** they attempt to go available, **Then** they are prompted to add a meeting link first before going online.

---

### Edge Cases

- What happens when a teacher's app crashes while they are available? Availability persists until explicitly toggled off or a system-wide timeout (4 hours) expires via pg_cron.
- What happens when a teacher is assigned to multiple free programs? They can be available for multiple programs simultaneously; each program has its own availability toggle.
- What happens when a program admin removes a teacher from a program while the teacher is available? The teacher's availability for that program is automatically set to `false` via a database trigger on `program_roles` DELETE.
- What happens when a student is viewing the available list and their enrollment is revoked? The Available Now screen checks enrollment status; revoked students see an error and are redirected.
- What happens when multiple students tap "Join" on the same teacher at the exact same time? The concurrent student count is checked atomically (SELECT FOR UPDATE); if at capacity, excess students see "Teacher Full" without race conditions.
- What happens to `active_student_count` when students leave for external meetings? Since students deep-link to external meeting platforms, there is no reliable in-app "leave" event. The counter only increments on "Join Session" taps and resets to 0 when the teacher goes offline or availability times out. The counter represents "join slots used since going available" — the teacher can reset capacity by toggling off and back on. No `leave_teacher_session` RPC is needed.
- What happens when the teacher toggles availability on poor network? The toggle optimistically updates the UI. If the server call fails, the toggle reverts to its previous state and an error toast is shown.
- What happens when a teacher's meeting link is deleted after they are already online? The `toggle_availability` RPC validates meeting_link on every "Go Available" call. If already available when the link is removed, they remain available until they go offline; re-toggling would fail with a prompt to reconfigure.
- What happens when pg_cron expires availability while a student is mid-join? The `join_teacher_session` RPC uses SELECT FOR UPDATE locking, so it either completes before the cron update or sees `is_available = false` and returns failure.

## Requirements

### Functional Requirements

- **FR-001**: System MUST allow teachers assigned to free/mixed programs to toggle their availability on/off per program.
- **FR-002**: System MUST track availability status, timestamp, max concurrent students, and associated program for each available teacher.
- **FR-003**: System MUST display a green dot indicator (8dp circle, #22C55E, bottom-end of avatar) next to available teachers on: the Available Now list, cohort teacher cards, team management lists, and program detail teacher sections. The indicator MUST have `accessibilityLabel="Available"` for screen readers and include an "Available" text label alongside the dot for color-blind accessibility.
- **FR-004**: System MUST show students an "Available Now" list of online teachers for their enrolled free/mixed programs, ordered by longest-waiting first.
- **FR-004a**: System MUST provide access to the Available Now screen from the program detail screen for free/mixed programs (an "Available Teachers" section/button).
- **FR-005**: System MUST update the Available Now list in real time when teachers come online or go offline (within 5 seconds of client-perceived latency — from toggle on device A to list update on device B).
- **FR-006**: System MUST allow teachers to set a maximum concurrent student count (default: 1, range: 1–10).
- **FR-007**: System MUST deep-link to the teacher's meeting link when a student taps "Join Session".
- **FR-008**: System MUST prevent students from seeing or accessing meeting links for offline teachers.
- **FR-008a**: System MUST restrict the Available Now list so that only students enrolled in a given program can see available teachers for that program (enforced via RLS).
- **FR-009**: System MUST allow teachers to configure a meeting link and platform preference on their profile.
- **FR-010**: System MUST allow teachers to add spoken languages to their profile. Languages are stored as ISO 639-1 codes but displayed as full names in the current app locale (e.g., "Arabic, English, Urdu" or "العربية، الإنجليزية، الأردية").
- **FR-011**: System MUST automatically expire availability after a system-wide timeout of 4 hours if not explicitly toggled off, enforced via a `pg_cron` scheduled job running every 15 minutes server-side. The timeout is not configurable per-program or per-teacher in this release.
- **FR-012**: System MUST enforce that only teachers with a configured meeting link can go available. Meeting links MUST pass basic URL validation (`https://` required); no platform-specific pattern matching.
- **FR-013**: System MUST replace the "Join Session" button with a "Teacher Full" indicator when a teacher has reached their max concurrent student limit. The teacher's card remains visible in the list.
- **FR-014**: System MUST automatically remove a teacher's availability when they are removed from a program's team.
- **FR-015**: System MUST show the teacher their current active student count as "X/Y students" on the availability toggle.
- **FR-016**: System MUST reset `active_student_count` to 0 when a teacher goes offline or when availability times out. Since students deep-link to external meetings, there is no in-app "leave" event; the counter represents join slots used since going available.
- **FR-017**: System MUST show 3 skeleton placeholder cards while the Available Now list is loading.
- **FR-018**: System MUST optimistically update the availability toggle UI on tap. If the server call fails, the toggle MUST revert to its previous state and show an error toast.
- **FR-019**: Supervisors and program_admins MUST be able to see available teachers for their assigned programs. In this release, access is data-level only (RLS policies grant SELECT); dedicated supervisor/program_admin UI screens are deferred to a future spec.

### Key Entities

- **Teacher Availability**: Represents a teacher's current online/offline status for a specific program. Tracks availability state, the program it applies to, when they went available, max concurrent students, and an `active_student_count` counter column updated atomically via an RPC function (increment on join, reset to 0 on offline/timeout). No decrement RPC — students leave to external meetings with no reliable return signal.
- **Teacher Profile Extensions**: Additional fields on the teacher's profile — meeting link (URL), meeting platform (Google Meet/Zoom/Jitsi/Other), and spoken languages (list of language codes).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Teachers can toggle availability in under 2 seconds (measured from tap to optimistic UI state update; server confirmation in background).
- **SC-002**: Available Now list reflects teacher status changes within 5 seconds of client-perceived latency (from toggle on device A to list update on device B).
- **SC-003**: 95% of "Join Session" taps successfully open the teacher's meeting link on the first attempt (measured via manual QA testing during acceptance; analytics infrastructure out of scope).
- **SC-004**: Students never see meeting links for teachers who are currently offline.
- **SC-005**: The system handles 100+ concurrent available teachers without visible degradation in list loading (validated by seeding 100+ availability rows and measuring list render time).
- **SC-006**: Stale availability records (beyond 4-hour timeout) are automatically cleaned up without manual intervention. Observable outcome: teacher disappears from Available Now lists after 4+ hours of inactivity.

## Assumptions

- Teachers use external meeting platforms (Google Meet, Zoom, Jitsi, etc.) — the app does not provide built-in video calling.
- The programs and enrollments system from spec 003 is complete and available (programs table, program_roles table, enrollments table).
- Teacher ratings are not part of this spec — the availability card will show a "New" badge as placeholder instead of rating stars until a future ratings spec is implemented.
- The timeout for stale availability (4 hours) is a system-wide constant; admins do not need to configure this per-program or per-teacher in the initial release.
- Language codes follow ISO 639-1 for storage (e.g., "ar", "en", "ur", "fr"); display uses full language names localized to the current app locale.
- `pg_cron` extension is confirmed available (`CREATE EXTENSION IF NOT EXISTS "pg_cron"` in migration 00001).
- `Linking.openURL()` is the standard React Native API for opening external URLs and works reliably on both iOS and Android for `https://` links. If deep-link fails, the app shows an error toast with the meeting link as copyable text.
- The `meeting_link` on the `profiles` table (teacher's personal link) is separate from the `meeting_link` on the `cohorts` table (used for structured programs). The availability feature exclusively uses the profile-level meeting link.

## Dependencies

- **003-programs-enrollment**: Programs table, program_roles table (teacher assignments), and enrollments table (student enrollment verification) must exist.
- **002-auth-evolution**: Profiles table with extended roles (teacher, supervisor, etc.) must exist.

## Clarifications

### Session 2026-03-05

- Q: How is the "current active session count" tracked against max_students? → A: Counter column (`active_student_count`) on `teacher_availability`, updated atomically via RPC (increment on join, reset to 0 on offline/timeout).
- Q: How should the 4-hour stale availability timeout be enforced? → A: `pg_cron` scheduled job running every 15 minutes server-side.
- Q: Who can see the Available Now list — any user or only enrolled students? → A: Only students enrolled in the same program can see available teachers for that program (RLS-enforced).
- Q: How do teachers with multiple programs manage availability? → A: Single "Go Available" button opens a program selector with per-program toggles, allowing simultaneous multi-program availability.
- Q: Should the meeting link be validated? → A: Basic URL validation only (`https://` required); no platform-specific pattern matching.

### Checklist Review 2026-03-05

Resolved 35 items from `checklists/full-review.md`:
- Counter model simplified: no `leave_teacher_session` RPC — counter increments on join, resets on offline/timeout (CHK001/006/024/025)
- Navigation: Available Now accessed from program detail for free/mixed programs (CHK002)
- Max students change: no disruption to existing sessions (CHK003)
- Teacher sees active count as "X/Y students" (CHK005)
- Green dot: 8dp, #22C55E, bottom-end of avatar, specific screen list (CHK007/008)
- 5 seconds = client-perceived latency (CHK009)
- Timeout: system-wide constant, not per-program (CHK010)
- Rating placeholder: "New" badge (CHK011/034)
- "mixed-free" normalized to "free or mixed" (CHK016)
- US1-4 vs FR-013: "Join" button replaced with "Teacher Full", card stays visible (CHK013)
- Meeting link source: profiles (availability) vs cohorts (structured) — different use cases (CHK014)
- RLS: student policy uses get_user_programs() with role check (CHK015)
- SC-001: tap to optimistic UI update (CHK017)
- SC-003: manual QA, analytics out of scope (CHK018)
- SC-005: validated by seeding 100+ rows (CHK019)
- Cron observable: teacher disappears from Available Now after 4h (CHK020)
- Offline: optimistic toggle, revert on failure, error toast (CHK021/029)
- Supervisor/program_admin visibility added as FR-019 (CHK022)
- Loading: 3 skeleton cards (CHK030)
- Accessibility: accessibilityLabel, "Available" text label for color-blind (CHK031)
- Languages: full names in current locale, ISO codes for storage (CHK032)
- pg_cron confirmed in migration 00001 (CHK033)
- Linking.openURL: fallback to copyable text on failure (CHK035)
