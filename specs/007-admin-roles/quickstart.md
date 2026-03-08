# Quickstart: 007-admin-roles

## Prerequisites

1. Database has migrations through 00008 (ratings-queue) applied
2. `program_roles` table exists with data (from 003-programs-enrollment)
3. At least one program exists with enrolled students and assigned teachers
4. At least one user has `profiles.role = 'supervisor'`
5. At least one user has `profiles.role = 'master_admin'`
6. A user has `program_roles` entry with `role = 'program_admin'` for a program

## Integration Scenarios

### QS-1: Supervisor Views Dashboard

**Setup**: Supervisor user (profiles.role='supervisor') with program_roles entries linking teachers.

1. Log in as supervisor → routed to `app/(supervisor)/`
2. See 4-tab navigation: Home, Teachers, Reports, Profile
3. Home tab shows: teacher count, student count, sessions this week
4. Per-teacher cards show: name, student count, sessions this week, rating
5. Teachers with 0 sessions in 7 days show "Inactive" flag

**Validates**: FR-001, FR-004, FR-007, US1

### QS-2: Supervisor Drills Into Teacher

1. From Home or Teachers tab, tap a teacher card
2. See teacher detail: students list, session history, rating stats
3. Tap "Students" to see full student list with last session date
4. Rating stats shown regardless of 5-review minimum

**Validates**: FR-005, US1

### QS-3: Supervisor Reassigns Student

1. In teacher detail → Students list
2. Tap "Reassign" on a student
3. See picker with other teachers under this supervisor
4. Select new teacher → enrollment teacher_id updated
5. Both teacher lists update

**Validates**: FR-006, US1

### QS-4: Program Admin Selects Program

**Setup**: User with program_roles entries for 2 programs as program_admin.

1. Log in as program_admin → routed to `app/(program-admin)/`
2. See program selector with 2 programs listed
3. Tap a program → enter 5-tab view scoped to that program

**Single program variant**: If only 1 program assigned, skip selector → go directly to tabs.

**Validates**: FR-002, US2 scenario 6

### QS-5: Program Admin Manages Team

1. Open Team tab
2. See list of assigned teachers and supervisors with role badges
3. Tap "Add Teacher" → search users → select → assign
4. New teacher appears in list
5. Tap a supervisor → link them to specific teachers
6. Remove a team member → warning if active students exist

**Validates**: FR-008, FR-009, US2

### QS-6: Program Admin Configures Settings

1. Open Settings tab
2. See form with: max students/teacher, daily session limit, queue threshold, rating thresholds
3. Update values → save → program settings JSONB updated
4. Values reflect immediately in queue and rating behavior

**Validates**: FR-010, US2

### QS-7: Program Admin Views Dashboard

1. Open Home tab
2. See metrics: enrolled students, active cohorts, teachers, sessions this week, pending enrollments
3. All numbers match actual program data
4. Empty program shows zero values, not errors

**Validates**: FR-011, US3

### QS-8: Program Admin Views Reports

1. Open Reports tab
2. See: teacher workload chart, student progress distribution, session trend
3. All data scoped to selected program only

**Validates**: FR-012, US3

### QS-9: Master Admin Views Dashboard

1. Log in as master_admin → routed to `app/(master-admin)/`
2. Dashboard shows: total students, total teachers, active sessions, program-by-program table
3. All numbers aggregate across all programs

**Validates**: FR-013, US4

### QS-10: Master Admin Manages Users

1. Navigate to Users screen
2. Search for a user by name
3. See their current roles (profiles.role + program_roles)
4. Assign them as program_admin for a program → program_roles entry created
5. Promote them to master_admin → profiles.role changes
6. Try to demote the last master_admin → blocked with error

**Validates**: FR-014, FR-019, US4

### QS-11: Master Admin Views Reports

1. Navigate to Reports
2. See: enrollment trends per program, session volumes, teacher activity heatmap
3. Data covers all programs

**Validates**: FR-016, US4

### QS-12: Master Admin Configures Platform

1. Navigate to Settings
2. See: platform name, default meeting platform, notification defaults
3. Update and save → platform_config table updated

**Validates**: FR-017, US4

### QS-13: Program-Scoped Access Enforcement

1. As program_admin for Program A, navigate to any screen
2. All data is scoped to Program A only
3. No data from Program B visible
4. As supervisor, only teachers assigned to them via supervisor_id are visible

**Validates**: FR-018, SC-006

### QS-14: Bilingual Admin Screens

1. Switch language to Arabic
2. All admin screens render RTL correctly
3. All labels, metrics, and navigation items are translated
4. Switch back to English → LTR renders correctly

**Validates**: FR-020, SC-008
