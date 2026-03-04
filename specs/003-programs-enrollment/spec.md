# Feature Specification: Programs & Enrollment

**Feature Branch**: `003-programs-enrollment`
**Created**: 2026-03-03
**Status**: Draft
**Input**: User description: "Programs & Enrollment — Add programs, tracks, cohorts, enrollments tables and UI. Seed 8 programs."
**PRD Reference**: Section 3 (Programs), Section 4.4 (Enrollment & Cohort Management), Section 5.3 (New Tables), Section 12 (Spec ID: 003-programs-enrollment)
**Depends On**: 002-auth-evolution (completed)
**Key Rule**: ADDITIVE — new tables only, no drops. Existing schema untouched.

---

## Clarifications

### Session 2026-03-04

- Q: Program 7 "sub-programs" (7A, 7B, 7C) — modeled as tracks or separate programs? → A: Modeled as **tracks within a single Program 7** (5 tracks total: Mateen 10 Juz', Mateen 15 Juz', Mateen 30 Juz', Thabbitha, Itqan). PRD seed data JSON already treats them as tracks. "Sub-programs" was informal prose grouping.
- Q: Who approves pending enrollments when auto_approve is off? → A: **Program admin** (or master admin) approves via cohort management screen. Teachers do not perform enrollment approval.
- Q: How do students access the Programs screen? → A: **Dedicated bottom tab** in the student tab bar (top-level navigation, not buried in dashboard).
- Q: Can students enroll in structured programs without an open cohort? → A: **No** — a cohort with status `enrollment_open` must exist. Otherwise "Enroll" is disabled with "No cohorts available — check back soon."
- Q: How should the programs list be sorted? → A: By **`sort_order` column ascending**, seeded in PRD order (Program 1→8). Admins can reorder later.

---

## Context

WeReciteTogether is an online Quranic learning platform that hosts **8 programs** across two categories:

- **Free programs (برامج حرة)**: Drop-in participation, no enrollment, no cohort system (Programs 1 Section 1, 3, 5 Section 1)
- **Structured programs (برامج مقيدة)**: Formal enrollment, cohort/batch system, progress tracking, certification (Programs 2, 4, 5 Section 2, 6, 7, 8)
- **Mixed programs**: Contain both free and structured sections (Programs 1, 5)

This spec establishes the foundational **programs**, **tracks**, **cohorts**, **enrollments**, and **program_roles** data layer and the student-facing UI for browsing programs and enrolling. It is the prerequisite for all subsequent feature specs (004–010).

---

## User Scenarios & Testing

### User Story 1 — Student Browses and Views Programs (Priority: P1)

A student opens the app and navigates to a Programs screen where they can see all 8 available programs. Each program shows its name (Arabic + English), category (free/structured/mixed), description, and number of active enrollees. The student taps a program to view its detail screen, which lists the program's tracks (if any), current cohorts (for structured programs), and an "Enroll" or "Join" call-to-action.

**Why this priority**: Without program browsing, no other enrollment or program feature can function. This is the entry point for the entire program system.

**Independent Test**: Launch app as a student → navigate to Programs tab → verify all 8 programs appear with correct names and categories → tap a program → verify detail screen loads with tracks and description.

**Acceptance Scenarios**:

1. **Given** a student is logged in, **When** they navigate to the Programs screen, **Then** they see all 8 active programs listed with Arabic name, English name, category badge (free/structured/mixed), and short description.
2. **Given** 8 seeded programs exist, **When** the student views the programs list, **Then** programs are displayed ordered by `sort_order` column ascending (seeded as Program 1→8 matching PRD order).
3. **Given** a student taps a program card, **When** the program detail screen loads, **Then** it shows the full description, list of tracks (if any), active cohort count (for structured), and enrollment status.
4. **Given** a program has no tracks (e.g., Program 3 — Non-Arabic Speakers), **When** the student views its detail, **Then** no tracks section appears and the enroll action is directly on the program.
5. **Given** the app locale is Arabic, **When** the student views programs, **Then** all program names and descriptions display in Arabic (`name_ar`, `description_ar`).

---

### User Story 2 — Student Enrolls in a Structured Program (Priority: P2)

A student views a structured program's detail screen, selects a track (if the program has multiple), and taps "Enroll." If a cohort with open enrollment exists and has capacity, the student is placed into it with status "pending" (awaiting approval) or "active" (if auto-approve is enabled). If no cohort is available or all are full, the student is placed on a waitlist. The student receives confirmation of their enrollment status.

**Why this priority**: Enrollment is the core transactional action of the program system. Without it, structured programs cannot function.

**Independent Test**: Sign in as student → browse to a structured program → select a track → tap "Enroll" → verify enrollment record is created → verify confirmation is shown. Repeat when cohort is full → verify waitlist placement.

**Acceptance Scenarios**:

1. **Given** a structured program with an open cohort (status `enrollment_open`, current students < `max_students`), **When** a student taps "Enroll" on that track, **Then** an enrollment record is created with status `pending` and the student sees a confirmation message.
2. **Given** a student is already enrolled in a program+track+cohort combination, **When** they try to enroll again, **Then** the system prevents duplicate enrollment and shows an appropriate message.
3. **Given** all cohorts for a track are full or have status `enrollment_closed`, **When** a student taps "Enroll," **Then** the enrollment is created with status `waitlisted` and the student sees their waitlist position and a message explaining the wait.
4. **Given** a student has a pending enrollment, **When** they view their Programs screen, **Then** the program shows as "Pending Approval" with a visual indicator.
5. **Given** a program has auto-approve enabled in its settings, **When** a student enrolls, **Then** the enrollment status is set directly to `active` (skipping `pending`).
6. **Given** a structured program/track with no cohorts (or no cohorts with status `enrollment_open`), **When** a student views the program detail, **Then** the "Enroll" button is disabled and a message reads "No cohorts available — check back soon."

---

### User Story 3 — Student Joins a Free Program (Priority: P3)

A student views a free program and taps "Join." Since free programs have no enrollment gate, the student is immediately enrolled with status `active`. This lightweight enrollment serves as a record of participation and enables the student to appear in program-scoped views.

**Why this priority**: Free programs are the lowest barrier to entry. While simpler than structured enrollment, they still need a participation record for the teacher availability system (spec 004) and session logging (spec 005).

**Independent Test**: Sign in as student → browse to a free program (e.g., Program 1 Section 1 or Program 3) → tap "Join" → verify enrollment created as `active` → verify program appears in student's "My Programs" list.

**Acceptance Scenarios**:

1. **Given** a free program, **When** a student taps "Join," **Then** an enrollment record is created with status `active`, no track or cohort assignment, and the student sees a success confirmation.
2. **Given** a student has already joined a free program, **When** they view the program, **Then** they see "Joined" status instead of the "Join" button.
3. **Given** a student leaves a free program, **When** they tap "Leave Program," **Then** the enrollment status changes to `dropped` and the program returns to the "Join" state.

---

### User Story 4 — Program Admin Manages Programs and Tracks (Priority: P4)

A program admin or master admin accesses a program management screen where they can view all programs, edit program details (name, description, settings), manage tracks (add, edit, reorder), and configure program settings (max students per teacher, auto-approve enrollment, session duration defaults). Master admins can create new programs and deactivate existing ones.

**Why this priority**: Admin management is needed for ongoing operations but can be deferred for initial launch since the 8 programs are seeded via migration.

**Independent Test**: Sign in as master_admin → navigate to Programs management → edit a program's description → verify change persists. Create a new track on a program → verify it appears. Deactivate a program → verify it no longer appears for students.

**Acceptance Scenarios**:

1. **Given** a master admin is logged in, **When** they navigate to program management, **Then** they see all programs with edit controls.
2. **Given** a program admin is logged in, **When** they navigate to program management, **Then** they see only the program(s) they are assigned to (via `program_roles` table).
3. **Given** an admin edits a program's name or description, **When** they save, **Then** the changes persist and are visible to students immediately.
4. **Given** a master admin creates a new track on a program, **When** they provide name (en + ar) and optional curriculum description, **Then** the track is created with the next sort_order value.
5. **Given** a master admin deactivates a program (`is_active = false`), **When** students browse programs, **Then** the deactivated program does not appear in the listing.

---

### User Story 5 — Program Admin Manages Cohorts (Priority: P5)

A program admin creates cohorts for structured programs, configures capacity and schedule, assigns a teacher and supervisor, and manages the cohort lifecycle (open enrollment → close enrollment → in progress → completed → archived).

**Why this priority**: Cohort management is essential for structured programs to operate but can launch after initial enrollment flow is working.

**Independent Test**: Sign in as program admin → create a cohort for a track → set max students and dates → assign teacher → open enrollment → verify students can enroll → close enrollment → mark in progress.

**Acceptance Scenarios**:

1. **Given** a program admin, **When** they create a cohort for a track, **Then** they must provide: name, max_students, teacher_id, and optionally start_date, end_date, supervisor_id, meeting_link, and schedule.
2. **Given** a cohort with status `enrollment_open`, **When** the admin changes it to `enrollment_closed`, **Then** new enrollments are no longer accepted for that cohort (waitlisted instead).
3. **Given** a cohort in `enrollment_open` status, **When** the enrollment count reaches `max_students`, **Then** subsequent enrollment attempts are automatically waitlisted.
4. **Given** a cohort has enrolled students, **When** an admin changes status to `in_progress`, **Then** all `pending` enrollments for that cohort are bulk-approved (set to `active`), waitlisted students remain `waitlisted` (manual promotion by admin), and the cohort start_date is recorded if not already set.
5. **Given** a completed cohort, **When** the admin archives it, **Then** it no longer appears in active listings but historical data is preserved.
6. **Given** a cohort with `pending` enrollments, **When** the program admin views the cohort detail, **Then** they see a list of pending students with approve/reject actions.
7. **Given** a program admin approves a pending enrollment, **When** they tap approve, **Then** the enrollment status changes to `active` and the student sees the update.

---

### User Story 6 — Program Admin Manages Program Roles (Priority: P6)

A program admin or master admin assigns teachers and supervisors to their program via the `program_roles` table. This determines which teachers appear in the program's teacher pool and which supervisors oversee those teachers.

**Why this priority**: Program role assignment enables proper scoping — teachers only see students in their assigned programs, supervisors only oversee their assigned teachers. Can be done after core enrollment works.

**Independent Test**: Sign in as program admin → navigate to Team management → assign a teacher to the program → verify teacher now appears in program context → assign a supervisor → verify supervisor sees the program's teachers.

**Acceptance Scenarios**:

1. **Given** a program admin, **When** they assign a teacher to their program, **Then** a `program_roles` record is created with role `teacher` and the teacher appears in program-scoped teacher lists.
2. **Given** a program admin, **When** they assign a supervisor, **Then** a `program_roles` record is created with role `supervisor`.
3. **Given** a master admin, **When** they assign a program admin to a program, **Then** a `program_roles` record is created with role `program_admin`.
4. **Given** a teacher assigned to two programs, **When** they view their dashboard, **Then** they see students and sessions from both assigned programs.
5. **Given** an admin removes a teacher from a program, **When** the `program_roles` record is deleted, **Then** the teacher no longer appears in that program's teacher pool (existing enrollments with that teacher are preserved but no new ones are created).

---

### Edge Cases

- **Concurrent enrollment**: Two students attempt to take the last cohort spot simultaneously — only one should succeed, the other should be waitlisted.
- **Program deactivation with active enrollments**: When a program is deactivated, existing active enrollments remain functional. Students can complete their current track but no new enrollments are accepted.
- **Track deletion with enrolled students**: Tracks with active enrollments cannot be deleted — they can only be deactivated (hidden from new enrollment).
- **Cohort teacher reassignment**: If a cohort's teacher is changed mid-progress, enrolled students are notified and their existing session history is preserved.
- **Student enrolled in many programs**: The system handles students enrolled in many programs gracefully (no hard limit, but UI handles long lists via scrolling).
- **Empty state — no programs**: If no programs are seeded or all are deactivated, the student sees an appropriate empty state message.
- **Locale fallback**: If a program only has Arabic name/description and the student's locale is English, the system falls back to the Arabic content rather than showing blank fields.
- **Profile role demotion**: If a user's top-level `profiles.role` changes (e.g., teacher demoted to student), their `program_roles` entries remain until explicitly removed by an admin. RLS policies check both `profiles.role` and `program_roles` — a demoted user loses route-group access but existing program role records are preserved for audit.
- **Program deactivation during enrollment**: If a program is deactivated (`is_active = false`) while `enroll_student()` is mid-transaction, the function's initial `WHERE is_active` check prevents the enrollment from completing. The student sees "Program not found" and can retry.
- **Deactivated track with existing enrollments**: If a track is deactivated (`is_active = false`), existing enrollments referencing that track remain valid and functional. The track simply stops appearing in the student browsing UI for new enrollments.

---

## Requirements

### Functional Requirements

#### Program Management

- **FR-001**: System MUST store programs with bilingual name and description (Arabic + English), category (`free`, `structured`, `mixed`), active status, configurable settings (JSONB), and sort order.
- **FR-002**: System MUST seed the 8 programs defined in the PRD (Programs 1-8) via a database migration, including their tracks and descriptions.
- **FR-003**: System MUST support program tracks — sub-divisions within a program. Each track has bilingual name/description, optional curriculum definition (JSONB — units, duration, reference text), sort order, active status, and optional `track_type` (`free` or `structured`) for mixed-category programs. Tracks in non-mixed programs inherit the parent program's category.
- **FR-004**: Master admins MUST be able to create, edit, and deactivate programs.
- **FR-005**: Program admins MUST be able to edit details and settings of programs they are assigned to (scoped by `program_roles`).
- **FR-006**: System MUST NOT allow deletion of programs or tracks that have active enrollments — only deactivation.

#### Enrollment

- **FR-007**: Students MUST be able to enroll in structured programs by selecting a program and optionally a track. The enrollment record captures: student, program, track (nullable), cohort (nullable), teacher (nullable), status, and timestamps.
- **FR-008**: Enrollment statuses MUST follow this lifecycle: `pending` → `active` → `completed` or `dropped`. Additionally, `waitlisted` is used when no capacity is available. There are exactly 5 statuses: `pending`, `active`, `completed`, `dropped`, `waitlisted`. Approval by a program admin transitions directly from `pending` to `active`.
- **FR-009**: System MUST enforce a unique constraint on (student, program, track, cohort) to prevent duplicate enrollments.
- **FR-010**: For free programs, enrollment MUST be immediate — status set to `active` with no approval step.
- **FR-011**: For structured programs, enrollment MAY require approval (configurable per program via `settings.auto_approve`). If auto-approve is off, enrollment starts as `pending`. Approval is performed by the **program admin** (or master admin) via the cohort management screen — teachers do not approve enrollments.
- **FR-011a**: Structured enrollment MUST require at least one cohort with status `enrollment_open` to exist. If no open cohort is available, the "Enroll" action is disabled and the student sees "No cohorts available — check back soon."
- **FR-012**: System MUST prevent enrollment in cohorts that are full (current active enrollments >= `max_students`) — new attempts are automatically waitlisted.
- **FR-013**: Students MUST be able to view their enrolled programs and enrollment status from their dashboard.
- **FR-014**: Students MUST be able to leave/drop from a program (status changes to `dropped`).

#### Cohorts

- **FR-015**: System MUST support cohorts for structured programs with: name, program and track reference, status lifecycle (`enrollment_open` → `enrollment_closed` → `in_progress` → `completed` → `archived`), max student capacity, assigned teacher, optional supervisor, optional meeting link override, optional schedule (JSONB), and date range.
- **FR-016**: Program admins MUST be able to create, edit, and manage cohort lifecycle transitions.
- **FR-017**: System MUST track current enrollment count per cohort and prevent exceeding `max_students`.

#### Program Roles

- **FR-018**: System MUST support assigning users to programs with specific roles (`program_admin`, `supervisor`, `teacher`) via a `program_roles` table.
- **FR-019**: Program admins MUST only see and manage data within their assigned programs.
- **FR-020**: Master admins MUST have unrestricted access across all programs.
- **FR-021**: Teachers assigned to multiple programs MUST see aggregated data from all their assigned programs.

#### Student-Facing UI

- **FR-022**: System MUST provide a Programs browsing screen as a **dedicated bottom tab** in the student tab bar, showing all active programs with bilingual names, category badge, and brief description.
- **FR-023**: System MUST provide a Program Detail screen showing: full description, tracks (if any), active cohorts with capacity info (for structured programs), and an enrollment/join action.
- **FR-024**: System MUST provide a "My Programs" view showing the student's enrollments with current status, grouped by active and completed.
- **FR-025**: All program-related UI MUST support both English and Arabic locales with proper RTL layout.

#### Admin-Facing UI

- **FR-026**: Master admins MUST have a program management screen to view, create, edit, and deactivate programs and tracks.
- **FR-027**: Program admins MUST have a cohort management screen to create cohorts, manage enrollment, assign teachers, and control cohort lifecycle.
- **FR-028**: Program admins MUST have a team management screen to assign/remove teachers and supervisors to their program.

#### Data Seeding

- **FR-029**: The migration MUST seed all 8 programs with their tracks as defined in PRD Section 3:
  - Program 1: تسميع بالتناوب (Alternating Recitation) — category: `mixed`, 3 tracks (all `track_type: free`)
  - Program 2: برنامج الأطفال (Children's Program) — category: `structured`, 3 tracks
  - Program 3: برنامج الأعاجم (Non-Arabic Speakers) — category: `free`
  - Program 4: برنامج القراءات (Qiraat) — category: `structured`
  - Program 5: برنامج المتون (Mutoon) — category: `mixed`, 4 tracks (1 `track_type: free` + 3 `track_type: structured`)
  - Program 6: برنامج اللغة العربية (Arabic Language) — category: `structured`, 2 tracks
  - Program 7: برنامج حفظ القرآن (Quran Memorization) — category: `structured`, 5 tracks (Mateen 10/15/30 Juz', Thabbitha, Itqan)
  - Program 8: برنامج همم القرآني (Himam Marathon) — category: `structured`, 5 tracks by volume

#### Security & Access Control

- **FR-030**: RLS policies MUST enforce that students can only read programs/tracks/cohorts and manage their own enrollments.
- **FR-030a**: RLS policies MUST allow teachers to read enrollments where they are the assigned teacher or belong to a cohort they teach.
- **FR-030b**: RLS policies MUST allow supervisors to read all enrollments within their assigned programs (via `program_roles`).
- **FR-031**: RLS policies MUST enforce that program admins can only modify data within their assigned programs. Program admins MUST NOT be able to self-assign to additional programs via `program_roles`.
- **FR-032**: RLS policies MUST enforce that master admins can access all program data.
- **FR-032a**: The legacy `admin` role has NO access to program data. Program features are accessed via `program_admin` or `master_admin` roles only.
- **FR-033**: A helper function `get_user_programs()` MUST be added to return the list of program IDs a user has access to, for use in RLS policies. Returns empty array for users with no program associations. Master admin access is granted via role check, not via this function.
- **FR-033a**: The `enroll_student()` RPC MUST validate that the caller is authenticated (`auth.uid() IS NOT NULL`) and has the `student` role before processing enrollment.

### Key Entities

- **Program**: A learning program offered on the platform. Has bilingual name/description, category (free/structured/mixed), active status, and configurable settings. The platform hosts 8 programs.
- **Track**: A sub-division within a program representing a specific pathway or curriculum (e.g., within Children's Program: التلقين, القاعدة النورانية, مسار الحفظ). Has bilingual name, optional curriculum definition, and sort order.
- **Cohort**: A batch/group of students within a structured program track. Has a teacher, optional supervisor, capacity limit, date range, and lifecycle status. Maps to the Arabic concept of "دفعة."
- **Enrollment**: A record linking a student to a program (and optionally a track, cohort, and teacher). Tracks enrollment lifecycle from pending through active to completed or dropped.
- **Program Role**: An assignment linking a user (teacher, supervisor, or program admin) to a specific program, determining their access scope.

---

## Assumptions

- The 8 programs are **pre-defined and seeded** via migration. Dynamic program creation by master admins is supported but not the primary workflow.
- **Auto-approve** defaults to `false` for structured programs (enrollment requires admin approval). The setting is configurable per program.
- **Waitlist ordering** uses insertion order (FIFO). The waitlist notification and claiming system is out of scope for this spec (covered in 006-ratings-queue).
- **Program settings** are stored as JSONB to allow flexible per-program configuration without schema changes. Initial settings: `max_students_per_teacher` (default: 10), `auto_approve` (default: false), `session_duration_minutes` (default: 30). All 8 seeded programs use these defaults except Program 3 (free, `auto_approve: true`).
- **Existing tables** (sessions, memorization_progress, etc.) are NOT modified in this spec. Adding `program_id` to existing tables is deferred to spec 005-session-evolution.
- **Teacher assignment to cohorts** references existing profiles — no changes to the profiles table are needed (meeting_link, bio, etc. were added in 002-auth-evolution).
- The **student navigation** adds a dedicated **Programs bottom tab** to the student tab bar, following existing patterns in `app/(student)/`.
- **Cohort schedules** are stored as JSONB array: `[{"day": 0, "start": "18:00", "end": "19:00"}]` where `day` is 0-6 (Sunday-Saturday) and times are 24h `"HH:mm"` format. The schedule is informational for this spec. The `session_schedules` table defined in the PRD is out of scope — it belongs in 005-session-evolution.
- **Waitlist position** is derived from `enrolled_at` timestamp (FIFO order), not stored as a separate column. Position = count of waitlisted enrollments with earlier `enrolled_at` + 1.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 8 programs and their tracks are visible to students within 2 seconds of navigating to the Programs tab (measured on warm app launch, WiFi connection, after initial TanStack Query cache miss).
- **SC-002**: A student can complete the enrollment flow (browse → select program → select track → enroll) in under 30 seconds (measured as wall-clock time from tab tap to confirmation screen).
- **SC-003**: 100% of enrollment attempts to full cohorts result in automatic waitlist placement (no silent failures). Verified by integration test with concurrent enrollment attempts.
- **SC-004**: Program admins can create a new cohort with all required fields in under 1 minute (measured from navigating to create form to submission confirmation).
- **SC-005**: Bilingual content (Arabic + English) displays correctly in both LTR and RTL layouts with no truncation or overlap (verified by visual review of all 8 programs in both locales).
- **SC-006**: RLS policies correctly restrict program admin access — a program admin assigned to Program 2 cannot read or modify Program 4's data (verified by Supabase SQL test with impersonated JWT).
- **SC-007**: The `get_user_programs()` helper function returns correct program IDs for all role types within 100ms (measured via `EXPLAIN ANALYZE` with 50 programs and 500 enrollments).
- **SC-008**: Duplicate enrollment attempts (same student + program + track + cohort) are rejected 100% of the time (verified by unique constraint test including concurrent race condition test with 2 parallel inserts).
- **SC-009**: Seed data migration produces exactly 8 programs and 25 tracks with correct `sort_order` values (1–8), correct category assignments, and correct `track_type` values for mixed programs.

---

## Cross-Spec Dependency Contracts

This spec is a prerequisite for specs 004–010. The following FK and query-path contracts MUST be preserved:

- **For 004-teacher-availability**: `programs.id` is the FK target for `teacher_availability.program_id`. `program_roles` (role = 'teacher') determines teacher-program associations.
- **For 005-session-evolution**: `programs.id` is the FK target for nullable `program_id` columns on `sessions`, `recitations`, `memorization_progress`, `memorization_assignments`. `cohorts.schedule` JSONB structure is defined in Assumptions above. `cohorts.meeting_link` is the fallback meeting link.
- **For 006-ratings-queue**: `enrollments` table provides student-teacher-program relationships for rating eligibility via `teacher_id` + `program_id` + `status = 'active'`. Waitlist promotion (waitlisted → active) is managed by spec 006.
- **For 007-admin-roles**: `program_roles` provides the supervisor → teacher → student query path for the supervisor panel.
- **For 008-certifications**: `programs.id` and `program_tracks.id` are FK targets for `certifications`. Enrollment status `completed` determines certification eligibility.
