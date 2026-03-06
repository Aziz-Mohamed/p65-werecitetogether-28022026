# Feature Specification: Supervisor & Admin Panels

**Feature Branch**: `007-admin-roles`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "007-admin-roles — Supervisor & Admin Panels: add supervisor, program-admin, and master-admin route groups with dashboards, team management, and program-scoped admin capabilities"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Supervisor Dashboard & Teacher Oversight (Priority: P1)

A supervisor logs in and sees a dashboard summarizing the health of their assigned program segment: their teachers' activity, session counts, student progress, and flagged issues. They can drill into any teacher to see detailed session logs, student lists, and rating breakdowns. They can reassign students between their teachers.

**Why this priority**: Supervisors are the operational backbone — they ensure teachers are active, students are progressing, and quality stays high. Without this, the organization has no middle-management visibility.

**Independent Test**: Can be fully tested by logging in as a supervisor, viewing the dashboard with real data, drilling into a teacher, and reassigning a student — delivering operational oversight value.

**Acceptance Scenarios**:

1. **Given** a supervisor with 5 assigned teachers, **When** they open the supervisor home tab, **Then** they see an overview card per teacher showing: name, active student count, sessions this week, and average rating.
2. **Given** a supervisor viewing their dashboard, **When** one teacher has zero sessions in the past 7 days, **Then** that teacher's card is visually flagged as "Inactive".
3. **Given** a supervisor viewing a teacher detail screen, **When** they tap "Students", **Then** they see all students assigned to that teacher with last session date and progress summary.
4. **Given** a supervisor viewing a teacher's student list, **When** they tap "Reassign" on a student, **Then** they can select another teacher (from their supervised group) and the student is moved.
5. **Given** a supervisor, **When** they view the Teachers tab, **Then** they see only teachers within programs they supervise (program-scoped data).

---

### User Story 2 - Program Admin: Team & Cohort Management (Priority: P2)

A program admin manages the people and structure of their program. They can assign teachers and supervisors to their program, manage cohort enrollment and lifecycle, and configure program-specific settings (session limits, rating thresholds, max students per teacher).

**Why this priority**: Program admins need to manage their program's team and structure before the program can operate. This is the foundation for all structured program operations.

**Independent Test**: Can be tested by logging in as a program admin, assigning a teacher to the program, creating a cohort, and configuring program settings.

**Acceptance Scenarios**:

1. **Given** a program admin viewing their Team tab, **When** they tap "Add Teacher", **Then** they can search existing users with the teacher role and assign them to the program via the `program_roles` table.
2. **Given** a program admin, **When** they assign a supervisor, **Then** that supervisor appears in the team list and can be linked to specific teachers.
3. **Given** a program admin viewing Cohorts tab, **When** they create a new cohort, **Then** they set name, track, teacher, max students, schedule, and start date.
4. **Given** a program admin, **When** they open the Settings tab, **Then** they can configure: max students per teacher, daily free session limit, queue notification threshold, and rating thresholds.
5. **Given** a program admin, **When** they try to view another program's data, **Then** access is denied — they only see their assigned program(s).
6. **Given** a program admin assigned to multiple programs, **When** they log in, **Then** they see a program selector screen listing their assigned programs. After selecting one, they enter the 5-tab view scoped to that program. If only one program is assigned, the selector is skipped and they go directly to the tabs.

---

### User Story 3 - Program Admin Dashboard & Reporting (Priority: P3)

A program admin sees a dashboard with key metrics for their program: total enrolled students, active cohorts, teacher workload, certification pipeline, and waitlist sizes. They can generate and view program-specific reports.

**Why this priority**: Dashboards enable data-driven decisions about when to open new cohorts, recruit teachers, or intervene with struggling students — but the team and structure (US2) must exist first.

**Independent Test**: Can be tested by logging in as a program admin with an active program containing students, cohorts, and sessions, and verifying that all dashboard metrics display correctly.

**Acceptance Scenarios**:

1. **Given** a program admin, **When** they open the Home tab, **Then** they see: total enrolled students, active cohort count, total teachers, sessions this week, and pending enrollment requests count.
2. **Given** a program admin with cohorts, **When** they view the Cohorts tab, **Then** each cohort shows: status, enrolled/max students, teacher name, and start date.
3. **Given** a program with a waitlist, **When** the program admin views the dashboard, **Then** they see waitlist size and a prompt if it exceeds a threshold (e.g., "15+ students waiting — consider opening a new cohort").
4. **Given** a program admin, **When** they open the Reports tab, **Then** they can view: teacher workload distribution, student progress distribution, and session frequency trends.

---

### User Story 4 - Master Admin: Platform-Wide Management (Priority: P4)

A master admin has full visibility and control across all programs. They can create and manage programs, assign program admins, view cross-program analytics, and configure platform-wide settings. The master admin can also manage all user roles.

**Why this priority**: The master admin is the platform owner. While programs can operate with program admins (US2/US3), cross-program oversight and user management at the platform level is needed for organizational governance.

**Independent Test**: Can be tested by logging in as a master admin, creating a program, assigning a program admin, viewing cross-program stats, and managing platform settings.

**Acceptance Scenarios**:

1. **Given** a master admin, **When** they open the dashboard, **Then** they see: total students across all programs, total teachers, total active sessions, and a program-by-program summary table.
2. **Given** a master admin, **When** they navigate to Programs, **Then** they see all programs with enrollment counts and can create, edit, or deactivate any program.
3. **Given** a master admin, **When** they navigate to Users, **Then** they can search users, view their roles, and promote/demote users (e.g., assign someone as program_admin or supervisor).
4. **Given** a master admin, **When** they navigate to Reports, **Then** they see cross-program analytics: enrollment trends, session volumes per program, and teacher activity heatmap.
5. **Given** a master admin, **When** they view platform settings, **Then** they can configure: platform name, default meeting platform, notification defaults, and global policies.

---

### User Story 5 - Supervisor: Tab Navigation & Reports (Priority: P5)

A supervisor has a proper 4-tab navigation (Home, Teachers, Reports, Profile) replacing the current placeholder screen. The Reports tab shows program-level analytics scoped to their supervised teachers and students.

**Why this priority**: Completes the supervisor experience with proper navigation structure and basic reporting — builds on the dashboard (US1) with dedicated tabs.

**Independent Test**: Can be tested by logging in as a supervisor, navigating between all 4 tabs, and viewing reports scoped to their teachers.

**Acceptance Scenarios**:

1. **Given** a supervisor, **When** they log in, **Then** they see a bottom tab bar with 4 tabs: Home, Teachers, Reports, Profile.
2. **Given** a supervisor on the Teachers tab, **When** they tap a teacher, **Then** they navigate to a teacher detail screen showing: assigned students, session history, rating stats, and a reassign option.
3. **Given** a supervisor on the Reports tab, **When** they view reports, **Then** they see: sessions per teacher (bar chart), student progress distribution, inactive teacher alerts, and average rating per teacher.
4. **Given** a supervisor, **When** they view the Profile tab, **Then** they see their personal info and the program(s) they supervise.

---

### Edge Cases

- What happens when a program admin tries to assign a user who is already assigned to another program in the same role? The system allows it — teachers and supervisors can belong to multiple programs.
- What happens when a supervisor has no teachers assigned? The dashboard shows an empty state with a message: "No teachers assigned yet. Contact your program admin."
- What happens when a master admin demotes themselves? The system prevents removing the last master admin — at least one must always exist.
- What happens when a program admin removes a teacher who has active students? The system warns and requires reassigning or unassigning all students first.
- What happens when a supervisor views ratings for a teacher with fewer than 5 reviews? Ratings are shown to supervisors regardless of the 5-review minimum (that threshold only applies to student-facing display).
- What happens when session data or enrollment data is empty for a new program? All dashboard cards show zero values with appropriate empty states, not errors.
- What happens when a program admin has 0 programs assigned? The program selector shows an empty state: "You are not assigned to any programs. Contact a master admin." No tabs are shown.
- What happens when a supervisor supervises teachers across multiple programs? The supervisor dashboard shows a unified view of ALL their supervised teachers across all programs. Each teacher card indicates which program the teacher belongs to.
- What happens when a master admin assigns a program_admin role to someone whose profiles.role is 'teacher'? Their profiles.role stays 'teacher' (they keep the teacher dashboard). The program_admin role is stored in program_roles only and gives them data access to that program. To get the program admin dashboard, a master admin must change their profiles.role to 'program_admin'.
- What happens when a program admin switches programs via the selector? All tab state (scroll position, form inputs) is reset. The dashboard reloads with the newly selected program's data.
- What happens when two program admins edit the same program settings simultaneously? Last-write-wins — no optimistic locking. This is acceptable for the current scale (small volunteer organization).
- What happens when a supervisor tries to reassign a student to a teacher who is at max student capacity? The system shows a warning with the teacher's current/max student count but allows the reassignment — capacity is a soft limit for supervisors.
- What happens when a supervisor's only assigned program is deactivated? The supervisor dashboard shows an empty state: "Your program has been deactivated. Contact a master admin."
- What happens when a program admin is removed from a program while viewing that program's tabs? On the next data refresh (pull-to-refresh or background refetch), the app shows an access denied message and navigates back to the program selector.
- What happens when a master admin tries to change their own profiles.role away from master_admin? The same "last master admin" check applies — if they are the only master_admin, the system blocks the change. If other master_admins exist, the change is allowed.
- What happens when a master admin promotes a user who is already a master_admin? The system shows an informational message: "This user is already a master admin." No duplicate action taken.
- What happens when a program admin tries to escalate their own role to master_admin? Program admins cannot access the Users management screen (FR-014 is master_admin only). The program_roles table only allows 'program_admin', 'supervisor', 'teacher' roles — not 'master_admin'. Self-escalation is structurally impossible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a 4-tab bottom navigation for supervisors: Home, Teachers, Reports, Profile.
- **FR-002**: System MUST provide a 5-tab bottom navigation for program admins: Home, Cohorts, Team, Reports, Settings. The tabs are scoped to a single program. If the program admin manages multiple programs, a program selector screen is shown first (auto-selects if only one program is assigned).
- **FR-003**: System MUST provide stack-based navigation for master admins: Dashboard, Programs, Users, Reports, Settings.
- **FR-004**: Supervisor home dashboard MUST display: teacher count, total students under supervision, sessions in the last 7 rolling days, and per-teacher summary cards. "Sessions this week" throughout this spec means the last 7 calendar days from today, not the current calendar week.
- **FR-005**: Supervisor MUST be able to view any teacher's student list, session history, and rating stats.
- **FR-006**: Supervisor MUST be able to reassign a student from one of their teachers to another of their teachers.
- **FR-007**: Supervisor teacher list MUST visually flag teachers with zero sessions in the past 7 days as "Inactive".
- **FR-008**: Program admin Team tab MUST allow adding existing users (with teacher or supervisor role) to the program via `program_roles`.
- **FR-009**: Program admin MUST be able to remove a team member from their program, with a warning if the member has active students. "Active students" means students with enrollment status IN ('active', 'approved') under that teacher in the program.
- **FR-010**: Program admin Settings tab MUST allow configuring: max students per teacher, daily free session limit, queue notification threshold, and rating thresholds. Rating thresholds are the same values defined in the 006-ratings-queue spec (good_standing: 4.0, warning: 3.5, concern: 3.0) and are stored in the program's settings JSONB under the `ratings` key.
- **FR-011**: Program admin dashboard MUST display: total enrolled students, active cohorts, total teachers, sessions this week, and pending enrollment requests.
- **FR-012**: Program admin Reports tab MUST display: teacher workload distribution (sessions per teacher bar chart), student progress distribution (enrollment status breakdown), and session frequency trends (sessions per week line chart). Certification pipeline chart is deferred to 008-certifications (no curriculum completion tracking exists yet).
- **FR-013**: Master admin dashboard MUST display: cross-program summary with per-program enrollment and session counts.
- **FR-014**: Master admin Users screen MUST allow searching users, viewing their roles, and assigning/revoking roles. Program-scoped roles (program_admin, supervisor, teacher) are managed via the `program_roles` table without changing `profiles.role`. Only `master_admin` assignment changes `profiles.role` since it is a platform-wide role requiring its own routing.
- **FR-015**: Master admin MUST be able to create, edit, and deactivate programs (extends existing programs CRUD).
- **FR-016**: Master admin Reports MUST display: cross-program enrollment trends (enrollments per week per program, line chart), session volumes per program (sessions per week per program, stacked bar chart), and teacher activity heatmap (days x teachers grid showing session counts over the last 4 weeks). Certification counts chart is deferred to 008-certifications (certifications table does not exist yet).
- **FR-017**: Master admin platform Settings MUST allow configuring: platform name, default meeting platform, and notification defaults.
- **FR-018**: All admin screens MUST enforce program-scoped data access — a program admin or supervisor only sees data for their assigned programs.
- **FR-019**: System MUST prevent removing the last master admin from the platform.
- **FR-020**: All dashboards and lists MUST support bilingual display (Arabic + English) using existing i18n infrastructure.
- **FR-021**: Supervisor MUST be able to flag issues to the program admin (simple text-based flag with optional note). The flag is sent as a push notification to ALL users with `program_roles.role = 'program_admin'` for the teacher's program — no persistence. Input: teacher selection (from supervised teachers), note text (max 500 characters, sanitized to prevent injection), confirmation before sending. Delivery extends the existing `send-notification` edge function with a new `supervisor_flag` direct category.
- **FR-022**: All dashboard and list screens MUST show a loading skeleton while data is being fetched and a retry-able error state if any query fails. Partial data failures (e.g., one of several parallel queries fails) MUST show available data with an inline error indicator for the failed section.
- **FR-023**: All dashboard and list screens MUST support pull-to-refresh to reload data, following the existing pattern used in other role dashboards.
- **FR-024**: Supervisor profile tab MUST show the supervisor's personal info (name, email, avatar) and a list of programs they supervise with the program name and their teacher count in each program. This follows the same profile screen pattern used by teacher and student roles.
- **FR-025**: Master admin MUST be able to manage program teams (add/remove teachers, supervisors, program admins) via the Users detail screen or by navigating to a program's team. Master admin has full team management capabilities across all programs — they are not restricted by program_roles scoping.
- **FR-026**: All RPC functions MUST validate the caller's role before executing. Supervisor RPCs require `profiles.role = 'supervisor'`. Program admin RPCs require the caller to have a `program_roles` entry with `role = 'program_admin'` for the target program. Master admin RPCs require `profiles.role = 'master_admin'`. The `reassign_student` RPC MUST additionally validate that both the source and target teachers are supervised by the calling supervisor in the same program.
- **FR-027**: The `platform_config` table MUST have RLS: all authenticated users can SELECT (read platform info for display). Only users with `profiles.role = 'master_admin'` can UPDATE. INSERT is restricted to initial seed only.

### Key Entities

- **Program Role**: Associates a user with a program in a specific capacity (program_admin, supervisor, teacher). A user can hold roles in multiple programs. Stored in the existing `program_roles` table.
- **Supervisor Assignment**: Links a supervisor to specific teachers within a program. Tracked via a `supervisor_id` column on the `program_roles` table — each teacher's program_roles entry references the supervisor responsible for them in that program. This supports per-program supervisor assignments (a teacher can have different supervisors in different programs).
- **Dashboard Metrics**: Aggregated statistics computed from existing data (sessions, enrollments, attendance, ratings). Not persisted — queried on demand with appropriate caching.
- **Platform Config**: Global settings for the platform (name, defaults). Stored in the existing `platform_config` table.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Supervisors can view their full teacher roster and drill into any teacher's details within 3 taps from login. Tap path: login → Home tab (auto) → Teachers tab (tap 1) → teacher card (tap 2). Teacher detail is 2 taps from the default landing.
- **SC-002**: Program admins can add a new teacher to their program in under 30 seconds. Flow: Team tab → "Add" button → type name in search → tap user → confirm role → done (5 taps + typing).
- **SC-003**: Program admins can create a new cohort with all required fields in under 2 minutes.
- **SC-004**: Master admins can view cross-program summary stats on a single dashboard screen without scrolling horizontally.
- **SC-005**: All admin dashboards load their initial data within 2 seconds on a standard 4G mobile connection (warm cache — subsequent loads after first). Cold start (first load after login) may take up to 3 seconds. Measured from tab becoming visible to all stat cards showing data.
- **SC-006**: 100% of admin screens enforce program-scoped access — no data leaks across program boundaries. Screens requiring verification: supervisor dashboard, supervisor teacher list, supervisor teacher detail, supervisor reports, program admin dashboard, program admin cohorts, program admin team, program admin reports, program admin settings. Master admin screens are exempt (they see all data by design).
- **SC-007**: At least one master admin always exists — the system blocks removal of the last one.
- **SC-008**: All admin screens render correctly in both Arabic (RTL) and English (LTR) layouts.

## Assumptions

- The `program_roles` table already exists (created in 003-programs-enrollment) and is used to scope admin/supervisor access.
- The `platform_config` table already exists (from the schema design) or will be created as part of this spec.
- Existing program CRUD screens in `app/(master-admin)/programs/` are preserved and extended, not rebuilt.
- Existing cohort/team screens in `app/(program-admin)/programs/` are preserved and extended. The team.tsx screen's "add role" form and FlashList are reused; the screen is wrapped in the new tab navigation. The cohort screens (index, create, [cohortId]) are exposed via the Cohorts tab.
- The supervisor reviews screen `app/(supervisor)/teachers/[id]/reviews.tsx` (from 006-ratings-queue) is preserved.
- Dashboard metrics are computed from existing tables (sessions, enrollments, program_roles, teacher_ratings, teacher_rating_stats) — no new aggregate tables are needed.
- The existing `app/(admin)/` route group remains untouched — this spec adds capabilities to the three new route groups only.
- Teacher-to-supervisor assignment uses a `supervisor_id` column on the `program_roles` table (nullable FK to profiles). Each teacher's program_roles row can reference the supervisor for that program. The `supervisor_id` column on `profiles` (from a prior migration) is deprecated for this purpose — it cannot represent per-program supervisor assignments.
- Audit trail for role assignments: the existing `program_roles.assigned_by` and `program_roles.created_at` columns provide basic audit data (who assigned, when). No additional audit log table is needed for this spec — the existing columns are sufficient for the current organizational scale. A full audit trail system can be added in a future spec if needed.
- Tab badges (e.g., pending enrollment count on Cohorts tab) are out of scope for this spec. Tabs use static icons without dynamic badge counts. Badge indicators can be added as a polish enhancement later.

## Dependencies

- **003-programs-enrollment**: Programs, tracks, cohorts, enrollments tables and CRUD screens.
- **004-teacher-availability**: Teacher availability system (supervisor sees teacher online status).
- **006-ratings-queue**: Teacher ratings, rating stats, supervisor review screen, queue system.
- **Existing (admin) route group**: Preserved alongside new admin panels — no conflicts.

## Out of Scope

- Certification issuance workflow (covered by a future 008-certifications spec).
- Waitlist management for structured programs (partially covered by queue spec, full waitlist is future work).
- Voice memo management from admin perspective.
- Modifying the existing `app/(admin)/` route group — it stays as-is.
- Student-facing changes — this spec only affects supervisor, program-admin, and master-admin screens.
- Automatic push notification delivery for admin events (e.g., "new enrollment request") — no automatic/system-triggered admin notification types added. The only notification added is the user-initiated supervisor flag (FR-021), which extends the existing `send-notification` edge function with a `supervisor_flag` direct category.

## Clarifications

### Session 2026-03-06

- Q: How should supervisor-to-teacher relationships be tracked? → A: Add `supervisor_id` column to `program_roles` table (per-program supervisor link). This supports teachers having different supervisors in different programs.
- Q: Should the program admin experience start with a program selector, or go directly to tabs? → A: Program selector first, then 5 tabs scoped to that program. Auto-selects if only one program assigned.
- Q: How does role assignment interact with the profiles.role column? → A: Use `program_roles` for program-scoped roles (supervisor, program_admin, teacher) — profiles.role stays unchanged. Only `master_admin` changes profiles.role since it's a platform-wide routing role.
