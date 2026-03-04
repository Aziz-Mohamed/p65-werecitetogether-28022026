# Tasks: Programs & Enrollment

**Input**: Design documents from `/specs/003-programs-enrollment/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks grouped by user story (US1–US6) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US6) from spec.md

---

## Phase 1: Setup

**Purpose**: Create feature directory structure and foundational type definitions

- [x] T001 Create feature directory structure: `src/features/programs/` with subdirectories `components/`, `hooks/`, `services/`, `types/`, `utils/`
- [x] T002 Create feature types in `src/features/programs/types/programs.types.ts` — define `Program`, `ProgramTrack`, `Cohort`, `Enrollment`, `ProgramRole`, `ProgramSettings`, `CohortScheduleEntry`, `TrackCurriculum`, `CohortStatus`, `EnrollmentStatus`, plus input/filter types for service methods. Use Supabase generated types as base where possible.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, service layer, and i18n that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create migration `supabase/migrations/00005_programs_enrollment.sql` — 5 tables (`programs`, `program_tracks`, `cohorts`, `enrollments`, `program_roles`) with all columns, constraints, CHECK constraints, and explicit ON DELETE behaviors per data-model.md. Include `track_type` column on `program_tracks`. Include `handle_updated_at` triggers for tables with `updated_at`.
- [x] T004 Add helper functions to migration — `get_user_programs()` (STABLE SECURITY DEFINER, returns uuid[]) and `enroll_student(p_program_id, p_track_id, p_cohort_id)` (SECURITY DEFINER, handles free/mixed/structured enrollment with auth validation, role check, capacity check, and FOR UPDATE locking) per data-model.md.
- [x] T005 Add indexes to migration — all indexes defined in data-model.md including the functional unique index on enrollments using COALESCE for nullable columns.
- [x] T006 Add RLS policies to migration — enable RLS on all 5 tables, create policies for all roles (student, teacher, supervisor, program_admin, master_admin) per data-model.md. Use DO $$ blocks for idempotency. Include enrollments INSERT policy for free-program direct inserts and program_roles self-assignment prevention.
- [x] T007 Add seed data to migration — INSERT all 8 programs with bilingual names, descriptions, categories, settings (defaults: `max_students_per_teacher: 10, auto_approve: false, session_duration_minutes: 30`; Program 3 override: `auto_approve: true`), and sort_order 1–8. INSERT all 25 tracks with correct program_id references, bilingual names, sort_order, and `track_type` for mixed programs (Programs 1 and 5). Use ON CONFLICT DO NOTHING for idempotency.
- [x] T008 Create service layer in `src/features/programs/services/programs.service.ts` — `ProgramsService` class with all read methods (getPrograms, getProgram, getTracks, getCohorts, getMyEnrollments, getProgramRoles) and write methods (enrollStructured via RPC, joinFreeProgram via direct insert, leaveProgram, createCohort, updateCohortStatus, updateEnrollmentStatus, updateProgram, createTrack, assignProgramRole, removeProgramRole) per contracts/programs-api.md. Export singleton `programsService`.
- [x] T009 Create enrollment helpers in `src/features/programs/utils/enrollment-helpers.ts` — `useLocalizedField(en, ar)` hook for bilingual content with fallback, `getEnrollmentStatusColor(status)`, `getCohortStatusLabel(status)`, `getCategoryLabel(category)`, `getWaitlistPosition(enrolledAt, allWaitlisted)` utility functions.
- [x] T010 [P] Add programs i18n keys to `src/i18n/en.json` — add `programs.*` namespace with keys for: tab label, screen titles, category labels (free/structured/mixed), enrollment statuses (pending/active/completed/dropped/waitlisted), action buttons (enroll/join/leave/approve/reject), empty states, error messages (mapped from ENROLL_* error codes), cohort statuses, admin labels, form fields, confirmation dialogs.
- [x] T011 [P] Add programs i18n keys to `src/i18n/ar.json` — Arabic translations matching all keys added in T010. Include Arabic program/track names for UI chrome (category badges, status labels, etc.).

**Checkpoint**: Migration applied (`supabase db reset`), 8 programs + 25 tracks visible in DB, RLS working, service methods callable, i18n keys loaded.

---

## Phase 3: User Story 1 — Student Browses and Views Programs (Priority: P1) MVP

**Goal**: Students see all 8 programs in a dedicated tab, tap to view detail with tracks

**Independent Test**: Launch app as student → navigate to Programs tab → see all 8 programs → tap one → see detail with tracks and description

### Implementation for User Story 1

- [x] T012 [P] [US1] Create `CategoryBadge` component in `src/features/programs/components/CategoryBadge.tsx` — displays free/structured/mixed badge with color coding (green/blue/purple). Uses i18n for labels. Accepts `category` prop.
- [x] T013 [P] [US1] Create `ProgramCard` component in `src/features/programs/components/ProgramCard.tsx` — card with program name (localized via `useLocalizedField`), CategoryBadge, short description, active enrollee count. Uses `Card` (outlined variant) from `@/components/ui`. Pressable with `onPress` prop. Follows existing card pattern from `app/(admin)/students/index.tsx`.
- [x] T014 [P] [US1] Create `EmptyProgramState` component in `src/features/programs/components/EmptyProgramState.tsx` — empty state message when no active programs exist. Uses existing `EmptyState` pattern if available, or creates a simple centered text view.
- [x] T015 [US1] Create `usePrograms` hook in `src/features/programs/hooks/usePrograms.ts` — TanStack Query hook wrapping `programsService.getPrograms()`. Query key: `['programs']`. Returns `{ data: Program[], isLoading, error }`. Throws on Supabase error per existing hook pattern.
- [x] T016 [US1] Create `useProgram` hook in `src/features/programs/hooks/useProgram.ts` — TanStack Query hook wrapping `programsService.getProgram(id)`. Query key: `['programs', id]`. Enabled only when `id` is truthy. Returns program with nested tracks.
- [x] T017 [P] [US1] Create `ProgramDetailHeader` component in `src/features/programs/components/ProgramDetailHeader.tsx` — hero section showing localized program name (heading), CategoryBadge, localized full description. RTL-safe layout.
- [x] T018 [P] [US1] Create `TrackList` component in `src/features/programs/components/TrackList.tsx` — FlashList of tracks within a program. Each track row shows localized name, description preview, and `track_type` indicator for mixed programs. No interaction in US1 — tapping is added in US2.
- [x] T019 [US1] Create Programs tab screen in `app/(student)/(tabs)/programs.tsx` — uses `usePrograms` hook, renders `FlashList` of `ProgramCard` items ordered by `sort_order`. Shows `EmptyProgramState` when empty. Navigates to `/(student)/programs/[id]` on card press. Uses `Screen` component with `scroll={false}`.
- [x] T020 [US1] Add Programs tab to student tab bar in `app/(student)/(tabs)/_layout.tsx` — add `<Tabs.Screen name="programs" />` with `library-outline`/`library` Ionicons. Position after Dashboard tab. Add `student.tabs.programs` i18n key usage.
- [x] T021 [US1] Create Program detail screen in `app/(student)/programs/[id].tsx` — uses `useProgram(id)` hook. Renders `ProgramDetailHeader` + `TrackList`. Shows loading/error states. Back button to programs list. Enrollment action placeholder (completed in US2/US3).

**Checkpoint**: Student can browse all 8 programs in dedicated tab, tap to see detail with tracks. Bilingual content displays correctly in both locales.

---

## Phase 4: User Story 2 — Student Enrolls in a Structured Program (Priority: P2)

**Goal**: Students can enroll in structured programs via cohort selection, with capacity checking and waitlisting

**Independent Test**: Sign in as student → browse structured program → select track → see open cohorts → tap Enroll → see pending/active/waitlisted status → view My Programs

### Implementation for User Story 2

- [x] T022 [P] [US2] Create `EnrollmentStatusBadge` component in `src/features/programs/components/EnrollmentStatusBadge.tsx` — colored badge displaying enrollment status (pending=yellow, active=green, completed=blue, dropped=gray, waitlisted=orange). Uses i18n for status labels.
- [x] T023 [P] [US2] Create `CohortCard` component in `src/features/programs/components/CohortCard.tsx` — card showing cohort name, teacher name, capacity (X/Y students), status badge, schedule summary. Pressable for enrollment action. Shows "Full" indicator when at capacity.
- [x] T024 [US2] Create `useCohorts` hook in `src/features/programs/hooks/useCohorts.ts` — TanStack Query hook wrapping `programsService.getCohorts(filters)`. Query key: `['programs', programId, 'cohorts']`. Filters by program_id and optional track_id.
- [x] T025 [US2] Create `useEnroll` hook in `src/features/programs/hooks/useEnroll.ts` — TanStack mutation hook calling `programsService.enrollStructured()` (RPC). On success: invalidate `['enrollments']` and `['programs', programId, 'cohorts']`. Maps ENROLL_* error codes to i18n messages via `enrollment-helpers.ts`.
- [x] T026 [US2] Create `useEnrollments` hook in `src/features/programs/hooks/useEnrollments.ts` — TanStack Query hook wrapping `programsService.getMyEnrollments()`. Query key: `['enrollments', 'mine']`. Returns enrollments with program/track/cohort details.
- [x] T027 [US2] Update Program detail screen `app/(student)/programs/[id].tsx` — add cohort listing for structured programs using `useCohorts`. Show `CohortCard` list under each track. Add "Enroll" button per cohort (disabled when no `enrollment_open` cohorts — shows "No cohorts available — check back soon"). Show `EnrollmentStatusBadge` for already-enrolled tracks. Handle enrollment confirmation dialog with `Alert.alert`.
- [x] T028 [US2] Create My Programs screen in `app/(student)/programs/my-programs.tsx` — uses `useEnrollments` hook. Groups enrollments by status (active first, then pending/waitlisted, then completed). Each item shows program name, track, cohort, status badge, teacher name. Accessible from Programs tab (e.g., header button or section).

**Checkpoint**: Student can enroll in structured programs, see pending/active/waitlisted status, and view all enrollments in My Programs.

---

## Phase 5: User Story 3 — Student Joins a Free Program (Priority: P3)

**Goal**: Students can instantly join free programs (status = active) and leave them

**Independent Test**: Sign in as student → browse free program → tap Join → see "Joined" status → tap Leave → see "Join" again

### Implementation for User Story 3

- [x] T029 [US3] Create `useLeaveProgram` hook in `src/features/programs/hooks/useLeaveProgram.ts` — TanStack mutation hook calling `programsService.leaveProgram(enrollmentId)`. On success: invalidate `['enrollments']` and `['programs']`.
- [x] T030 [US3] Update `useEnroll` hook to support free-program path — add `joinFree(programId, trackId?)` method calling `programsService.joinFreeProgram()`. Reuse same invalidation pattern.
- [x] T031 [US3] Update Program detail screen `app/(student)/programs/[id].tsx` — for free/mixed-free programs: show "Join" button (not "Enroll"). On tap: call `joinFree` mutation → show success. For already-joined: show "Joined" badge + "Leave Program" button with confirmation dialog. For mixed programs: show correct action per track type (Join for free tracks, Enroll for structured tracks).

**Checkpoint**: Student can join free programs instantly, see Joined status, and leave programs. Mixed programs show correct actions per track type.

---

## Phase 6: User Story 4 — Program Admin Manages Programs and Tracks (Priority: P4)

**Goal**: Program admins edit their assigned programs; master admins create/edit/deactivate all programs and tracks

**Independent Test**: Sign in as master_admin → Programs management → edit description → save → verify change. Create track → verify it appears. Deactivate program → verify hidden from students.

### Implementation for User Story 4

- [x] T032 [US4] Create `useAdminPrograms` hook in `src/features/programs/hooks/useAdminPrograms.ts` — TanStack Query hook for admin program list + mutation hooks for updateProgram, createProgram (master_admin only), createTrack, updateTrack. Invalidates `['programs']` on success.
- [x] T033 [US4] Create program-admin programs list in `app/(program-admin)/programs/index.tsx` — list of programs the admin is assigned to (filtered by `program_roles`). Each card shows name, category, active status, track count. Tap navigates to edit. Follows admin list pattern from `app/(admin)/students/index.tsx`.
- [x] T034 [US4] Create program edit screen in `app/(program-admin)/programs/[id]/index.tsx` — form with fields: name (en), name_ar, description (en), description_ar, settings (max_students_per_teacher, auto_approve toggle, session_duration_minutes). Uses `react-hook-form` + `zod` validation. Save calls updateProgram mutation.
- [x] T035 [US4] Create track management screen in `app/(program-admin)/programs/[id]/tracks.tsx` — list of tracks for the program with add/edit/deactivate controls. Add track form: name (en+ar), description, sort_order. Edit inline or modal. Master_admin only for create.
- [x] T036 [US4] Create master-admin programs list in `app/(master-admin)/programs/index.tsx` — all programs (not filtered). Includes "Create Program" button. Each card has edit + deactivate actions.
- [x] T037 [US4] Create master-admin program create screen in `app/(master-admin)/programs/create.tsx` — form for creating new program: name (en+ar), description (en+ar), category (picker: free/structured/mixed), settings. Uses `react-hook-form` + `zod`.
- [x] T037a [US4] Create master-admin program edit screen in `app/(master-admin)/programs/[id]/index.tsx` — edit form with full access: name (en+ar), description (en+ar), category, settings, is_active toggle (deactivate/reactivate). Reuses same form pattern as T037. Loads program via `useProgram(id)` hook.
- [x] T038 [US4] Update `app/(program-admin)/_layout.tsx` — add Stack.Screen entries for programs routes (`programs/index`, `programs/[id]/index`, `programs/[id]/tracks`).
- [x] T039 [US4] Update `app/(master-admin)/_layout.tsx` — add Stack.Screen entries for programs routes (`programs/index`, `programs/create`, `programs/[id]/index`).

**Checkpoint**: Program admins can edit assigned programs and tracks. Master admins can create/deactivate programs and manage all tracks.

---

## Phase 7: User Story 5 — Program Admin Manages Cohorts (Priority: P5)

**Goal**: Program admins create cohorts, manage lifecycle, and approve/reject enrollments

**Independent Test**: Sign in as program admin → create cohort → set capacity/teacher → open enrollment → approve pending students → close enrollment → mark in progress

### Implementation for User Story 5

- [x] T040 [US5] Create `useAdminCohorts` hook in `src/features/programs/hooks/useAdminCohorts.ts` — TanStack mutation hooks for createCohort, updateCohortStatus. Query hook for cohort list filtered by program. Invalidates `['programs', programId, 'cohorts']`.
- [x] T041 [US5] Create `useAdminEnrollments` hook in `src/features/programs/hooks/useAdminEnrollments.ts` — TanStack Query hook for enrollments per cohort. Mutation hook for updateEnrollmentStatus (approve → active, reject → dropped). Invalidates `['enrollments']`.
- [x] T042 [US5] Create cohort list screen in `app/(program-admin)/programs/[id]/cohorts/index.tsx` — list of cohorts for a program. Shows name, status badge, capacity (X/Y), teacher name. Filter by status. "Create Cohort" button.
- [x] T043 [US5] Create cohort create form in `app/(program-admin)/programs/[id]/cohorts/create.tsx` — form with fields: name, track_id (picker from program tracks), max_students, teacher_id (picker from program's teachers via program_roles), supervisor_id (optional), meeting_link, schedule (JSONB builder — day/time pairs), start_date, end_date. Uses `react-hook-form` + `zod`.
- [x] T044 [US5] Create cohort detail screen in `app/(program-admin)/programs/[id]/cohorts/[cohortId].tsx` — shows cohort info, lifecycle status controls (enrollment_open → enrollment_closed → in_progress → completed → archived as sequential buttons), enrolled students list with status. Pending students have approve/reject buttons. Bulk approve on `in_progress` transition.
- [x] T045 [US5] Update `app/(program-admin)/_layout.tsx` — add Stack.Screen entries for cohort routes (`programs/[id]/cohorts/index`, `programs/[id]/cohorts/create`, `programs/[id]/cohorts/[cohortId]`).

**Checkpoint**: Program admins can create cohorts, manage full lifecycle, approve/reject pending enrollments, and see enrollment counts.

---

## Phase 8: User Story 6 — Program Admin Manages Program Roles (Priority: P6)

**Goal**: Admins assign/remove teachers and supervisors to programs via program_roles

**Independent Test**: Sign in as program admin → Team management → assign teacher → verify teacher appears → assign supervisor → remove teacher → verify removal

### Implementation for User Story 6

- [x] T046 [US6] Create `useProgramRoles` hook in `src/features/programs/hooks/useProgramRoles.ts` — TanStack Query hook for program roles list. Mutation hooks for assignProgramRole, removeProgramRole. Query key: `['program-roles', programId]`.
- [x] T047 [US6] Create team management screen in `app/(program-admin)/programs/[id]/team.tsx` — list of assigned team members grouped by role (teachers, supervisors). Each entry shows name, role badge, assigned_by. "Add Member" flow: search/select profile → pick role (teacher or supervisor) → assign. Remove button with confirmation. Master_admin can also assign program_admin role.
- [x] T048 [US6] Update `app/(program-admin)/_layout.tsx` — add Stack.Screen entry for team route (`programs/[id]/team`).

**Checkpoint**: Program admins can assign/remove teachers and supervisors. Master admins can assign program admins. Self-assignment is prevented.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integration, navigation, and validation across all stories

- [x] T049 Add navigation links between screens — Programs tab header button to My Programs, program-admin dashboard card linking to program management, master-admin dashboard card linking to program management. Ensure all back buttons work correctly.
- [x] T050 Add Realtime subscription consideration — add programs and enrollments tables to Supabase Realtime publication in migration (if not already). Ensure TanStack Query cache invalidation aligns with realtime events pattern from existing `src/features/realtime/`.
- [ ] T051 Run quickstart.md validation — execute all verification checklist items: `supabase db reset` succeeds, 8 programs visible, 25 tracks correct, RLS blocks unauthorized access, `get_user_programs()` returns correct IDs, `enroll_student()` handles capacity, Programs tab renders, bilingual content works, RTL layout correct.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **User Stories (Phase 3–8)**: All depend on Phase 2 completion
  - US1 (P1): No story dependencies — start first
  - US2 (P2): Depends on US1 components (ProgramCard, detail screen)
  - US3 (P3): Depends on US2 (useEnroll hook, detail screen updates)
  - US4 (P4): Independent of US1–US3 (different route groups)
  - US5 (P5): Depends on US4 (program-admin layout routes)
  - US6 (P6): Depends on US4 (program-admin layout routes)
- **Polish (Phase 9)**: Depends on all stories being complete

### Within Each User Story

- Components marked [P] can run in parallel
- Hooks before screens (screens depend on hooks)
- Service methods exist from Phase 2 — hooks just wrap them

### Parallel Opportunities

**Phase 2**: T003–T007 (migration) are sequential. T008–T009 depend on migration. T010+T011 (i18n) are parallel with everything.

**Phase 3 (US1)**: T012+T013+T014 (components) in parallel → T015+T016 (hooks) → T017+T018 (more components) in parallel → T019 (tab screen) → T020 (layout) → T021 (detail screen).

**Phase 4+5 vs Phase 6+7+8**: Admin stories (US4–US6) are independent of student stories (US2–US3). If two developers are available:
- Developer A: US1 → US2 → US3 (student flow)
- Developer B: US4 → US5 → US6 (admin flow, can start after Phase 2)

---

## Parallel Example: User Story 1

```
# Launch components in parallel:
T012: CategoryBadge in src/features/programs/components/CategoryBadge.tsx
T013: ProgramCard in src/features/programs/components/ProgramCard.tsx
T014: EmptyProgramState in src/features/programs/components/EmptyProgramState.tsx

# Then hooks (after components):
T015: usePrograms in src/features/programs/hooks/usePrograms.ts
T016: useProgram in src/features/programs/hooks/useProgram.ts

# Then more components in parallel:
T017: ProgramDetailHeader in src/features/programs/components/ProgramDetailHeader.tsx
T018: TrackList in src/features/programs/components/TrackList.tsx

# Then screens (sequential, each builds on previous):
T019: Programs tab screen
T020: Tab bar layout update
T021: Program detail screen
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T011) — migration, service, i18n
3. Complete Phase 3: US1 (T012–T021) — browse & view programs
4. **STOP and VALIDATE**: 8 programs visible, detail screens work, bilingual OK
5. This alone delivers visible value — students can discover all programs

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Test → **MVP: Students can browse programs**
3. US2 → Test → Students can enroll in structured programs
4. US3 → Test → Students can join free programs
5. US4 → Test → Admins can manage programs and tracks
6. US5 → Test → Admins can manage cohorts and enrollment approval
7. US6 → Test → Admins can manage team assignments
8. Polish → Final validation

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks in same phase
- [Story] label maps task to spec.md user story for traceability
- Migration (T003–T007) is split into logical subtasks but lives in ONE file: `00005_programs_enrollment.sql`
- Service (T008) is a single file covering all operations — hooks are thin wrappers
- No test tasks generated (not explicitly requested in spec)
- Commit after each completed phase or logical group of tasks
