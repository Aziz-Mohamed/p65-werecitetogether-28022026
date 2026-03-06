# Tasks: Supervisor & Admin Panels

**Input**: Design documents from `/specs/007-admin-roles/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Manual QA via quickstart scenarios (QS-1 through QS-14). No automated tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database migration, type definitions, i18n keys, feature module scaffold

- [x] T001 Create database migration with: ALTER program_roles ADD supervisor_id (UUID FK to profiles ON DELETE SET NULL), CREATE platform_config table, RLS policies (all authenticated SELECT, master_admin UPDATE on platform_config), 8 RPC functions — each MUST include SET search_path = public per constitution VII — (get_supervisor_dashboard_stats, get_supervised_teachers, get_program_admin_dashboard_stats, get_master_admin_dashboard_stats, reassign_student, search_users_for_role_assignment, assign_master_admin_role, revoke_master_admin_role), platform_config seed row, and updated_at trigger in supabase/migrations/00009_admin_roles.sql
- [ ] T001a Apply migration locally via supabase db reset, then regenerate TypeScript types via generate_typescript_types MCP tool to update supabase/types/database.types.ts — MUST complete before T005 to avoid any `as any` casts per constitution III
- [x] T002 [P] Create admin TypeScript types: SupervisorDashboardStats, SupervisedTeacher, ProgramAdminDashboardStats, MasterAdminDashboardStats, ProgramTeamMember, PlatformConfig, AdminUser, and RPC parameter/return types in src/features/admin/types/admin.types.ts
- [x] T003 [P] Add i18n keys for supervisor (dashboard labels, teacher card, inactive flag, reassign), programAdmin (selector, dashboard, team, cohorts, settings, reports), and masterAdmin (dashboard, users, reports, settings) namespaces in both src/i18n/en.json and src/i18n/ar.json
- [x] T004 [P] Create scaffold feature module barrel export (types and service initially; hooks and components added as each phase completes) in src/features/admin/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared service layer and reusable components used by multiple user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Create admin service with all Supabase SDK calls: getSupervisorDashboardStats (RPC), getSupervisedTeachers (RPC), getTeacherStudents (enrollments query with profile join), getTeacherSessionHistory (sessions query), reassignStudent (RPC), getMyProgramAdminPrograms (program_roles query with program join), getProgramAdminDashboardStats (RPC), getProgramTeam (program_roles query with profile join), linkSupervisorToTeacher (program_roles update), searchUsersForAssignment (profiles ilike query), getProgramSessionTrend (sessions query), getTeacherWorkload (sessions count per teacher), getMasterAdminDashboardStats (RPC), searchUsersForRoleAssignment (RPC), assignMasterAdminRole (RPC), revokeMasterAdminRole (RPC), getPlatformConfig (platform_config select), updatePlatformConfig (platform_config update), getCrossProgramEnrollmentTrend (enrollments query), getCrossProgramSessionVolume (sessions query), getTeacherActivityHeatmap (sessions query) in src/features/admin/services/admin.service.ts
- [x] T006 [P] Create StatCard component displaying a metric label, value, and optional icon/trend indicator with loading skeleton state, following existing dashboard card patterns in src/features/admin/components/StatCard.tsx
- [x] T007 [P] Create TeacherCard component displaying teacher name, avatar, program name, student count, sessions this week, average rating, and "Inactive" badge when is_active=false, with onPress navigation in src/features/admin/components/TeacherCard.tsx
- [x] T008 [P] Create ProgramSelector component displaying a list of programs with name (bilingual), enrollment count, and onSelect callback; shows empty state when 0 programs; auto-selects when exactly 1 program in src/features/admin/components/ProgramSelector.tsx
- [x] T009 [P] Create UserSearchSheet bottom sheet component with search input, debounced search calling searchUsersForAssignment, FlashList of matching users with name/email/role, and onSelect callback in src/features/admin/components/UserSearchSheet.tsx

**Checkpoint**: Foundation ready — service layer, types, migration, i18n, and shared components all in place. User story implementation can now begin.

---

## Phase 3: User Story 1 — Supervisor Dashboard & Teacher Oversight (Priority: P1)

**Goal**: Supervisor logs in, sees dashboard with teacher cards, drills into teacher detail, and can reassign students between teachers.

**Independent Test**: Log in as supervisor → see dashboard with teacher count/student count/sessions → tap teacher card → see students → tap Reassign → move student to another teacher. (QS-1, QS-2, QS-3)

### Implementation for User Story 1

- [x] T010 [P] [US1] Create useSupervisorDashboard hook wrapping adminService.getSupervisorDashboardStats with TanStack Query, query key ['supervisor-dashboard', supervisorId], staleTime 2min in src/features/admin/hooks/useSupervisorDashboard.ts
- [x] T011 [P] [US1] Create useSupervisedTeachers hook wrapping adminService.getSupervisedTeachers with TanStack Query, query key ['supervised-teachers', supervisorId], staleTime 2min in src/features/admin/hooks/useSupervisedTeachers.ts
- [x] T012 [P] [US1] Create useTeacherStudents hook wrapping adminService.getTeacherStudents with TanStack Query, query key ['teacher-students', teacherId, programId] in src/features/admin/hooks/useTeacherStudents.ts
- [x] T013 [P] [US1] Create useReassignStudent hook wrapping adminService.reassignStudent with useMutation, invalidating ['teacher-students'] and ['supervised-teachers'] on success in src/features/admin/hooks/useReassignStudent.ts
- [x] T014 [P] [US1] Create ReassignSheet bottom sheet component showing a picker of other teachers under the same supervisor (filtered from supervised teachers), with teacher name/student count/capacity warning, and confirm button that calls useReassignStudent in src/features/admin/components/ReassignSheet.tsx
- [x] T015 [US1] Modify supervisor root layout to use Stack with (tabs) group and teachers/[id] stack screens, replacing the current single-screen placeholder in app/(supervisor)/_layout.tsx
- [x] T016 [US1] Create supervisor 4-tab layout using CustomTabBar with Home (home-outline), Teachers (people-outline), Reports (bar-chart-outline), Profile (person-outline) tabs; include placeholder screens for teachers.tsx, reports.tsx, profile.tsx that show "Coming Soon" text in app/(supervisor)/(tabs)/_layout.tsx and app/(supervisor)/(tabs)/teachers.tsx and app/(supervisor)/(tabs)/reports.tsx and app/(supervisor)/(tabs)/profile.tsx
- [x] T017 [US1] Create supervisor home dashboard showing StatCards (teacher count, student count, sessions this week) at top and a FlashList of TeacherCards below, using useSupervisorDashboard and useSupervisedTeachers hooks, with pull-to-refresh and loading skeleton in app/(supervisor)/(tabs)/index.tsx
- [x] T018 [US1] Create teacher detail screen showing teacher name/avatar header, StatCards (student count, sessions this week, average rating), session history list (last 50 sessions), and navigation to students screen; uses direct Supabase queries for session history in app/(supervisor)/teachers/[id]/index.tsx
- [x] T019 [US1] Create teacher students screen showing FlashList of enrolled students (name, last session date, enrollment status) with "Reassign" button per student that opens ReassignSheet; uses useTeacherStudents hook in app/(supervisor)/teachers/[id]/students.tsx

**Checkpoint**: Supervisor can log in, see dashboard, drill into teacher, and reassign students. Validates QS-1, QS-2, QS-3.

---

## Phase 4: User Story 2 — Program Admin: Team & Cohort Management (Priority: P2)

**Goal**: Program admin selects a program, manages team (add/remove teachers and supervisors, link supervisors to teachers), views cohorts, and configures program settings.

**Independent Test**: Log in as PA → select program → Team tab → add teacher → link supervisor → Cohorts tab → see cohorts → Settings tab → update settings. (QS-4, QS-5, QS-6)

### Implementation for User Story 2

- [x] T020 [P] [US2] Create useProgramAdminPrograms hook wrapping adminService.getMyProgramAdminPrograms with TanStack Query, query key ['my-admin-programs', userId] in src/features/admin/hooks/useProgramAdminPrograms.ts
- [x] T021 [P] [US2] Create useProgramTeam hook wrapping adminService.getProgramTeam with TanStack Query, query key ['program-team', programId], plus assign/remove mutations using existing programsService.assignProgramRole and removeProgramRole in src/features/admin/hooks/useProgramTeam.ts
- [x] T022 [P] [US2] Create useLinkSupervisor hook wrapping adminService.linkSupervisorToTeacher with useMutation, invalidating ['program-team', programId] on success in src/features/admin/hooks/useLinkSupervisor.ts
- [x] T023 [P] [US2] Create useProgramSettings hook wrapping programsService.updateProgram for settings JSONB updates with useMutation, invalidating ['program', programId] and ['program-admin-dashboard', programId] in src/features/admin/hooks/useProgramSettings.ts
- [x] T024 [P] [US2] Create TeamMemberRow component displaying member name, avatar, role badge (teacher/supervisor/program_admin), supervisor link indicator, student count, and remove button with active-students warning confirmation in src/features/admin/components/TeamMemberRow.tsx
- [x] T025 [US2] Modify program admin root layout to support program context: initial route to select.tsx, then (tabs) group after program selection, plus stack screens for cohorts/[cohortId], cohorts/create, team/add; store selected programId in route params or Zustand in app/(program-admin)/_layout.tsx
- [x] T026 [US2] Create program selector screen using ProgramSelector component with useProgramAdminPrograms hook; auto-navigates to tabs if single program; shows empty state ("Not assigned to any programs") if 0 programs in app/(program-admin)/select.tsx
- [x] T027 [US2] Create program admin 5-tab layout using CustomTabBar with Home (home-outline), Cohorts (school-outline), Team (people-outline), Reports (bar-chart-outline), Settings (settings-outline) tabs; include placeholder screens for index.tsx and reports.tsx that show "Coming Soon" in app/(program-admin)/(tabs)/_layout.tsx and app/(program-admin)/(tabs)/index.tsx and app/(program-admin)/(tabs)/reports.tsx
- [x] T028 [US2] Create program admin Team tab showing FlashList of TeamMemberRows with role-based sections (supervisors, teachers), "Add" FAB opening team/add screen, supervisor-teacher linking via bottom sheet, and remove with active-students warning; uses useProgramTeam and useLinkSupervisor hooks in app/(program-admin)/(tabs)/team.tsx
- [x] T029 [US2] Create add team member screen with UserSearchSheet for searching users, role picker (teacher/supervisor), and confirm button that calls useProgramTeam.assign mutation; navigates back on success in app/(program-admin)/team/add.tsx
- [x] T030 [US2] Create program admin Cohorts tab showing FlashList of cohorts with status badge, enrolled/max students, teacher name, start date; "Create Cohort" FAB navigating to existing cohorts/create screen; uses existing cohorts query scoped to selected programId in app/(program-admin)/(tabs)/cohorts.tsx
- [x] T031 [US2] Create program admin Settings tab with react-hook-form + zod form for: max_students_per_teacher (number), daily_free_session_limit (number), queue_notification_threshold (number), rating thresholds (good_standing 4.0, warning 3.5, concern 3.0 — numbers); save button calls useProgramSettings; loads current values from program.settings JSONB in app/(program-admin)/(tabs)/settings.tsx

**Checkpoint**: Program admin can select program, manage team, view cohorts, configure settings. Validates QS-4, QS-5, QS-6.

---

## Phase 5: User Story 3 — Program Admin Dashboard & Reporting (Priority: P3)

**Goal**: Program admin sees dashboard metrics and views program-specific reports with charts.

**Independent Test**: Log in as PA → select program → Home tab shows enrollment/cohort/teacher/session/pending counts → Reports tab shows workload chart, progress distribution, session trend. (QS-7, QS-8)

### Implementation for User Story 3

- [x] T032 [P] [US3] Create useProgramAdminDashboard hook wrapping adminService.getProgramAdminDashboardStats with TanStack Query, query key ['program-admin-dashboard', programId], staleTime 2min in src/features/admin/hooks/useProgramAdminDashboard.ts
- [x] T033 [P] [US3] Create useProgramReports hook with multiple queries: getProgramSessionTrend (sessions per week line data), getTeacherWorkload (sessions per teacher bar data), enrollment status distribution (count by status); query keys ['program-session-trend', programId], ['teacher-workload', programId], staleTime 5min in src/features/admin/hooks/useProgramReports.ts
- [x] T034 [US3] Replace program admin Home tab placeholder with dashboard showing StatCards (total enrolled, active cohorts, total teachers, sessions this week, pending enrollments) using useProgramAdminDashboard hook, with pull-to-refresh, loading skeleton, empty-state zero values, and waitlist prompt when pending > threshold in app/(program-admin)/(tabs)/index.tsx
- [x] T035 [US3] Replace program admin Reports tab placeholder with 3 chart sections: teacher workload bar chart (victory-native CartesianChart + Bar), student progress distribution (enrollment status breakdown list or pie), session frequency line chart (CartesianChart + Line, sessions per week over last 12 weeks); certification pipeline deferred to 008-certifications; uses useProgramReports hook in app/(program-admin)/(tabs)/reports.tsx

**Checkpoint**: Program admin dashboard and reports fully functional. Validates QS-7, QS-8.

---

## Phase 6: User Story 4 — Master Admin: Platform-Wide Management (Priority: P4)

**Goal**: Master admin sees cross-program dashboard, manages users and roles, views cross-program reports, and configures platform settings.

**Independent Test**: Log in as MA → dashboard shows cross-program stats → Users screen → search → assign PA role → promote to master_admin → block last MA removal → Reports → see enrollment/session charts → Settings → update platform name. (QS-9, QS-10, QS-11, QS-12)

### Implementation for User Story 4

- [x] T036 [P] [US4] Create useMasterAdminDashboard hook wrapping adminService.getMasterAdminDashboardStats with TanStack Query, query key ['master-admin-dashboard'], staleTime 2min in src/features/admin/hooks/useMasterAdminDashboard.ts
- [x] T037 [P] [US4] Create useAdminUsers hook wrapping adminService.searchUsersForRoleAssignment with TanStack Query, query key ['admin-users', searchQuery], no staleTime (fresh on each search) in src/features/admin/hooks/useAdminUsers.ts
- [x] T038 [P] [US4] Create useManageRoles hook with mutations: assignProgramRole (existing service), removeProgramRole (existing service), assignMasterAdminRole (RPC), revokeMasterAdminRole (RPC with last-admin error handling); invalidates ['admin-users'] and ['program-team'] in src/features/admin/hooks/useManageRoles.ts
- [x] T039 [P] [US4] Create usePlatformConfig hook wrapping adminService.getPlatformConfig (query) and updatePlatformConfig (mutation), query key ['platform-config'], staleTime 10min in src/features/admin/hooks/usePlatformConfig.ts
- [x] T040 [P] [US4] Create useMasterAdminReports hook with queries: getCrossProgramEnrollmentTrend (enrollments per week per program), getCrossProgramSessionVolume (sessions per week per program), getTeacherActivityHeatmap (sessions per teacher per day, last 4 weeks); query keys with startDate param, staleTime 5min in src/features/admin/hooks/useMasterAdminReports.ts
- [x] T041 [P] [US4] Create ProgramSummaryRow component displaying program name (bilingual), enrolled student count, session count this week, and status indicator in src/features/admin/components/ProgramSummaryRow.tsx
- [x] T042 [P] [US4] Create RoleAssignmentSheet bottom sheet showing user's current roles (profiles.role + program_roles list), options to assign/remove program roles (program picker + role picker), promote/demote master_admin button with last-admin guard, and "already master_admin" info message; uses useManageRoles hook in src/features/admin/components/RoleAssignmentSheet.tsx
- [x] T043 [US4] Modify master admin layout to add stack screens for users/index, users/[id], reports, and settings alongside existing programs screens in app/(master-admin)/_layout.tsx
- [x] T044 [US4] Replace master admin dashboard placeholder with real dashboard showing StatCards (total students, total teachers, total active sessions) at top and FlashList of ProgramSummaryRows below, with navigation links to Users/Programs/Reports/Settings; uses useMasterAdminDashboard hook, pull-to-refresh, loading skeleton in app/(master-admin)/index.tsx
- [x] T045 [US4] Create user list/search screen with search input, debounced search, FlashList of user results showing name/email/role/avatar with onPress navigating to user detail; uses useAdminUsers hook in app/(master-admin)/users/index.tsx
- [x] T046 [US4] Create user detail + role management screen showing user info header, current profiles.role, list of program_roles with program name and role, "Manage Roles" button opening RoleAssignmentSheet; handles promote/demote master_admin with confirmation dialog and last-admin error display in app/(master-admin)/users/[id].tsx
- [x] T047 [US4] Create cross-program reports screen with 3 chart sections: enrollment trend per program (CartesianChart + Line, multi-series by program), session volume per program (stacked bar chart), teacher activity heatmap (days x teachers grid using custom View-based colored cells, not a chart library); certification counts deferred to 008-certifications; uses useMasterAdminReports hook in app/(master-admin)/reports.tsx
- [x] T048 [US4] Create platform settings screen with react-hook-form + zod form for: platform name, platform name (Arabic), default meeting platform (picker: google_meet/zoom/jitsi/other), notification defaults (quiet hours toggle, start/end time); save button calls usePlatformConfig.update; loads current values from platform_config in app/(master-admin)/settings.tsx

**Checkpoint**: Master admin dashboard, user management, reports, and platform settings fully functional. Validates QS-9, QS-10, QS-11, QS-12.

---

## Phase 7: User Story 5 — Supervisor: Tab Navigation & Reports (Priority: P5)

**Goal**: Complete the supervisor 4-tab experience by replacing placeholder tabs with real Teachers list, Reports charts, Profile screen, and flag teacher issue feature.

**Independent Test**: Log in as supervisor → navigate all 4 tabs → Teachers tab shows full list → Reports tab shows charts → Profile tab shows info and supervised programs → flag a teacher issue from detail screen. (QS-1, QS-13, QS-14)

### Implementation for User Story 5

- [x] T049 [US5] Replace supervisor Teachers tab placeholder with full teacher list using FlashList of TeacherCards from useSupervisedTeachers hook, with search filter by name, "Inactive" badge filtering, and onPress navigating to teachers/[id] detail in app/(supervisor)/(tabs)/teachers.tsx
- [x] T050 [US5] Replace supervisor Reports tab placeholder with 3 chart sections: sessions per teacher (CartesianChart + Bar), student progress distribution (enrollment status breakdown per teacher), and average rating per teacher (bar chart with color thresholds); data from useSupervisedTeachers and additional queries in app/(supervisor)/(tabs)/reports.tsx
- [x] T051 [US5] Replace supervisor Profile tab placeholder with profile screen showing supervisor name, email, avatar, and a list of supervised programs with program name and teacher count per program; follows existing teacher/student profile pattern in app/(supervisor)/(tabs)/profile.tsx
- [x] T052 [US5] Extend send-notification edge function: add 'supervisor_flag' to NotificationCategory union type, add to DIRECT_CATEGORIES set, add recipient lookup that queries all program_admins for the teacher's program via program_roles, and add message builder for supervisor flag notes in supabase/functions/send-notification/index.ts
- [x] T053 [US5] Add "Flag Issue" button to teacher detail screen that opens a bottom sheet with note text input (max 500 chars, sanitized), confirmation step, and sends push notification to all program admins via supabase.functions.invoke('send-notification', { body: { type: 'supervisor_flag', teacher_id, program_id, note, supervisor_id } }) in app/(supervisor)/teachers/[id]/index.tsx

**Checkpoint**: All 4 supervisor tabs fully functional with reports and flag feature. Validates QS-1 (full), QS-13, QS-14.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: UX improvements and verification across all user stories

- [x] T054 Verify and add pull-to-refresh (onRefresh with refetch) to all dashboard and list screens: supervisor home, supervisor teachers, supervisor reports, PA dashboard, PA cohorts, PA team, PA reports, MA dashboard, MA users, MA reports per FR-023
- [x] T055 Verify and add loading skeletons (shimmer placeholders matching StatCard/list layout) and retry-able error states (error message + retry button) to all screens; handle partial failures (one of several parallel queries fails) by showing available data with inline error indicator per FR-022
- [x] T056 Verify program-scoped access enforcement: test all 9 screens listed in SC-006 (supervisor dashboard, teacher list, teacher detail, supervisor reports, PA dashboard, PA cohorts, PA team, PA reports, PA settings) return only data for assigned programs; verify MA screens show all data
- [x] T057 Verify bilingual RTL/LTR rendering: switch language to Arabic, confirm all admin screens render RTL correctly with logical CSS properties (paddingInline, marginBlock, start/end), all labels translated, switch back to English and confirm LTR per SC-008
- [x] T058 Run full quickstart.md validation: execute QS-1 through QS-14 scenarios end-to-end, document any failures, and fix issues found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–7)**: All depend on Foundational phase completion
  - US1 (Phase 3) → can start immediately after Phase 2
  - US2 (Phase 4) → can start after Phase 2, independent of US1
  - US3 (Phase 5) → depends on US2 (needs PA tab layout and program selector)
  - US4 (Phase 6) → can start after Phase 2, independent of US1/US2/US3
  - US5 (Phase 7) → depends on US1 (needs supervisor tab layout and home dashboard)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Phase 2 only — no story dependencies
- **US2 (P2)**: Phase 2 only — no story dependencies
- **US3 (P3)**: **Depends on US2** — needs PA _layout.tsx, tab layout, and program selector to be in place
- **US4 (P4)**: Phase 2 only — no story dependencies (MA layout already exists)
- **US5 (P5)**: **Depends on US1** — needs supervisor _layout.tsx, tab layout, and home dashboard to be in place

### Within Each User Story

- Hooks (marked [P]) can run in parallel — different files, no dependencies
- Components (marked [P]) can run in parallel — different files
- Layout files must come before screen files (screens depend on layout routing)
- Screen files depend on their hooks being complete

### Parallel Opportunities

- **Phase 1**: T002, T003, T004 can all run in parallel (after T001 migration)
- **Phase 2**: T006, T007, T008, T009 can all run in parallel (after T005 service)
- **Phase 3 (US1)**: T010, T011, T012, T013, T014 can all run in parallel
- **Phase 4 (US2)**: T020, T021, T022, T023, T024 can all run in parallel
- **Phase 5 (US3)**: T032, T033 can run in parallel
- **Phase 6 (US4)**: T036, T037, T038, T039, T040, T041, T042 can all run in parallel
- **After Phase 2**: US1, US2, and US4 can proceed in parallel (different route groups, different files)

---

## Parallel Example: After Foundational Complete

```text
# These three story phases can run in parallel (different route groups):
Stream A (US1): T010-T019 → Supervisor dashboard & teacher oversight
Stream B (US2): T020-T031 → Program admin team & cohort management
Stream C (US4): T036-T048 → Master admin platform management

# Then sequentially:
Stream B → US3 (T032-T035, depends on US2 PA layout)
Stream A → US5 (T049-T053, depends on US1 supervisor layout)

# Finally:
All stories → Phase 8 Polish (T054-T058)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration, types, i18n)
2. Complete Phase 2: Foundational (service, shared components)
3. Complete Phase 3: US1 — Supervisor Dashboard & Teacher Oversight
4. **STOP and VALIDATE**: Test QS-1, QS-2, QS-3 independently
5. Supervisor operational oversight is live

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Supervisor dashboard live (MVP)
3. US2 → Program admin team management live
4. US3 → Program admin dashboard & reports live
5. US4 → Master admin platform management live
6. US5 → Supervisor tabs & reports complete
7. Polish → All screens verified for access, i18n, loading states

### Sequential Priority Order

With a single developer (recommended):
1. Phase 1 → Phase 2 → Phase 3 (US1) → Phase 7 (US5) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 8

Note: US5 follows US1 since both are supervisor screens. Then PA screens (US2+US3) together, then MA (US4), then polish.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable (except US3→US2, US5→US1)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- The migration (T001) is the largest single task — it contains all schema, RPC, and RLS changes
- Existing screens (cohort CRUD, program CRUD, teacher reviews) are preserved — new screens extend, not replace
- All new code uses TypeScript strict mode, logical CSS properties, and i18n strings
