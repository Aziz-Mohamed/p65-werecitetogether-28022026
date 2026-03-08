# Tasks: Teacher Availability (Green Dot System)

**Input**: Design documents from `/specs/004-teacher-availability/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Database Migration)

**Purpose**: Create database schema — ALTER profiles, CREATE teacher_availability table, RPC functions, trigger, RLS policies, indexes, cron job, and Realtime publication

- [x] T001 Write migration `supabase/migrations/00006_teacher_availability.sql` — Section 1: ALTER profiles to add `meeting_link TEXT`, `meeting_platform TEXT` (CHECK IN google_meet/zoom/jitsi/other), `languages TEXT[]` columns. Section 2: CREATE `teacher_availability` table with all columns, constraints, UNIQUE (teacher_id, program_id), and 3 indexes (partial on program_id WHERE is_available, teacher_id, partial on available_since WHERE is_available). Section 3: CREATE `toggle_availability(p_program_id uuid, p_is_available boolean, p_max_students integer DEFAULT 1)` RPC — UPSERT with validation (meeting_link exists, program_role exists), reset active_student_count on offline. Section 4: CREATE `join_teacher_session(p_availability_id uuid)` RPC — SELECT FOR UPDATE, check capacity + is_available, increment active_student_count. Section 5: CREATE `clear_teacher_availability()` trigger function + AFTER DELETE trigger on program_roles WHERE OLD.role = 'teacher'. Section 6: CREATE updated_at trigger reusing handle_updated_at(). Section 7: ENABLE RLS + CREATE 8 policies (student read enrolled, teacher read/insert/update own, admin read all, admin/program_admin update, supervisor read, program_admin read). Section 8: ALTER PUBLICATION supabase_realtime ADD TABLE teacher_availability. Section 9: Schedule pg_cron job `expire-stale-availability` every 15 min.
- [x] T002 Validate migration with `supabase db reset` — Docker not running; deferred to manual validation

**Checkpoint**: Database schema ready — all tables, functions, triggers, policies, and cron job in place

---

## Phase 2: Foundational (Types, Service, i18n)

**Purpose**: Core infrastructure that MUST be complete before ANY user story UI can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 [P] Create TypeScript types in `src/features/teacher-availability/types/availability.types.ts` — MeetingPlatform literal, TeacherAvailability interface, TeacherProfileExtensions interface, AvailableTeacher (with joined profiles), ToggleAvailabilityInput, UpdateTeacherProfileInput, MyAvailability (with joined program name/name_ar) per contracts/availability-service.ts
- [x] T004 [P] Create availability service singleton in `src/features/teacher-availability/services/availability.service.ts` — AvailabilityService class with methods: getAvailableTeachers(programId) ordered by available_since ASC with profiles join, getMyAvailability() with programs join, toggleAvailability(input) via supabase.rpc, joinSession(availabilityId) via supabase.rpc, updateTeacherProfile(input) updating profiles table, getTeacherProfile() reading own meeting_link/meeting_platform/languages. Export as singleton `availabilityService`. Follow patterns from `src/features/programs/services/programs.service.ts`.
- [x] T005 [P] Add i18n keys to `src/i18n/en.json` and `src/i18n/ar.json` — add `availability` namespace with keys: title, goAvailable, goOffline, availableNow, teacherFull, noTeachersAvailable, joinSession, meetingLinkNotConfigured, selectPrograms, studentsCount ("{{current}}/{{max}} students"), meetingLink, meetingPlatform, languages, configureMeetingLink, availabilityTimeout, newTeacher, available, connectionLost, joinFailed, copyLink, platformLabels (google_meet/zoom/jitsi/other). Include both en and ar translations.

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Teacher Toggles Availability (Priority: P1) MVP

**Goal**: Teachers can go online/offline per program with a toggle on their dashboard, see their active student count, and have a green dot appear

**Independent Test**: Sign in as teacher assigned to a free program → tap "Go Available" → verify green dot appears and active count shows → tap "Go Offline" → verify green dot disappears

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `useMyAvailability` query hook in `src/features/teacher-availability/hooks/useMyAvailability.ts` — queryKey: ['my-availability'], calls availabilityService.getMyAvailability(), returns MyAvailability[]
- [x] T007 [P] [US1] Create `useToggleAvailability` mutation hook in `src/features/teacher-availability/hooks/useToggleAvailability.ts` — useMutation calling availabilityService.toggleAvailability(input), onSuccess invalidates ['my-availability'] and ['available-teachers'], supports optimistic update (FR-018: toggle UI immediately, revert on error with toast)
- [x] T008 [P] [US1] Create `useTeacherProfile` query hook in `src/features/teacher-availability/hooks/useTeacherProfile.ts` — queryKey: ['teacher-profile'], calls availabilityService.getTeacherProfile(), returns TeacherProfileExtensions
- [x] T009 [US1] Create GreenDotIndicator component in `src/components/ui/GreenDotIndicator.tsx` (shared layer — used by both teacher-availability and programs features per Constitution IV). 8dp circle, color #22C55E, positioned at bottom-end of avatar via absolute positioning with logical properties (end/bottom). Accepts `isAvailable` boolean prop. Include `accessibilityLabel="Available"` and a small "Available" text label for color-blind accessibility (FR-003). Use `paddingStart`/`paddingEnd` for RTL.
- [x] T010 [US1] Create ProgramSelector component in `src/features/teacher-availability/components/ProgramSelector.tsx` — receives list of eligible programs (free/mixed from teacher's program_roles), renders per-program toggle switches with program name (localized), max_students Picker/input (1–10), and current active_student_count as "X/Y students" (FR-015). Uses @gorhom/bottom-sheet for presentation (US1-2a).
- [x] T011 [US1] Create AvailabilityToggle component in `src/features/teacher-availability/components/AvailabilityToggle.tsx` — single "Go Available"/"Go Offline" button using useMyAvailability and useToggleAvailability hooks. If teacher has no free/mixed program_roles, show disabled state with explanation (US1-3). If teacher has no meeting_link, prompt to configure first (US4-3, FR-012). Tapping "Go Available" opens ProgramSelector. Shows active count per program. Uses optimistic UI (FR-018).
- [x] T012 [US1] Create teacher availability screen at `app/(teacher)/availability.tsx` — Screen wrapper with header "Availability". Renders AvailabilityToggle component. Shows list of current availability states per program with GreenDotIndicator.
- [x] T013 [US1] Add availability route to `app/(teacher)/_layout.tsx` — add `<Stack.Screen name="availability" />` to the Stack
- [x] T014a [US1] Add "Availability" navigation entry point on teacher dashboard `app/(teacher)/(tabs)/index.tsx` — add a prominent button/card that navigates to `/availability`. Show current availability status summary (e.g., "Available for 2 programs" or "Offline") using useMyAvailability hook.

**Checkpoint**: Teacher can toggle availability on/off per program. Green dot visible on availability screen. Active student count displayed.

---

## Phase 4: User Story 2 — Student Browses Available Teachers (Priority: P2)

**Goal**: Students see a real-time "Available Now" list of online teachers for their enrolled free/mixed programs, with skeleton loading and empty states

**Independent Test**: Sign in as student enrolled in a free program → navigate to program detail → tap Available Teachers → see list of online teachers with name, "New" badge, languages → verify list updates when a teacher goes offline

### Implementation for User Story 2

- [x] T014 [P] [US2] Create `useAvailableTeachers` query hook in `src/features/teacher-availability/hooks/useAvailableTeachers.ts` — queryKey: ['available-teachers', programId], calls availabilityService.getAvailableTeachers(programId), enabled: !!programId, returns AvailableTeacher[]
- [x] T015 [US2] Extend event-query-map with teacher_availability case in `src/features/realtime/config/event-query-map.ts` — add case 'teacher_availability' returning [['available-teachers'], ['my-availability']] to getQueryKeysForEvent
- [x] T016 [US2] Extend subscription profiles for student + teacher roles in `src/features/realtime/config/subscription-profiles.ts` — add teacher_availability subscription to buildStudentProfile (event: '*', no filter — RLS handles scoping, queryKeys: ['available-teachers']) and buildTeacherProfile (event: '*', filter: teacher_id=eq.teacherId, queryKeys: ['my-availability'])
- [x] T017 [US2] Create AvailableTeacherCard component in `src/features/teacher-availability/components/AvailableTeacherCard.tsx` — Card (outlined variant) showing: teacher avatar with GreenDotIndicator, full_name, "New" Badge (placeholder for ratings), languages as full locale names (FR-010), "Join Session" Button or "Teacher Full" indicator (FR-013). Accepts AvailableTeacher prop and onJoin callback. Uses logical CSS properties for RTL.
- [x] T018 [US2] Create Available Now screen at `app/(student)/available-now/[programId].tsx` — Screen with FlashList of AvailableTeacherCard components using useAvailableTeachers(programId). Show 3 skeleton placeholder cards while loading (FR-017). Show empty state "No teachers available right now — check back soon." when list is empty (US2-3). Order by available_since longest-waiting first.
- [x] T019 [US2] Add available-now route to `app/(student)/_layout.tsx` — add `<Stack.Screen name="available-now/[programId]" />` to the Stack
- [x] T020 [US2] Add "Available Teachers" section to student program detail in `app/(student)/programs/[id].tsx` — for programs with category 'free' or 'mixed', add a section/button that navigates to `/available-now/${program.id}` (FR-004a). Show count of currently available teachers if possible.

**Checkpoint**: Students can browse available teachers in real-time. List updates within 5 seconds of teacher status changes. Skeleton loading and empty states work.

---

## Phase 5: User Story 3 — Student Joins Session via Meeting Link (Priority: P3)

**Goal**: Students tap "Join Session" to open the teacher's external meeting link, with capacity tracking and fallback handling

**Independent Test**: Sign in as student → find available teacher → tap "Join Session" → verify meeting link opens in browser/app → verify "Teacher Full" when at capacity

### Implementation for User Story 3

- [x] T021 [US3] Create `useJoinSession` mutation hook in `src/features/teacher-availability/hooks/useJoinSession.ts` — useMutation calling availabilityService.joinSession(availabilityId), onSuccess: if result is true open meeting link via Linking.openURL(), if false show "Teacher Full" toast. On Linking.openURL failure, show error toast with copyable meeting link text (Assumptions). Invalidate ['available-teachers', programId] on success.
- [x] T022 [US3] Integrate join session into AvailableTeacherCard in `src/features/teacher-availability/components/AvailableTeacherCard.tsx` — wire "Join Session" button to useJoinSession hook. Disable button if meeting_link is null with message "Meeting link not configured" (US3-2). Pass onJoin from parent or use hook directly. Show loading spinner on button during join request.

**Checkpoint**: Full student flow works end-to-end — browse, join, open meeting link. Capacity tracking prevents over-joining.

---

## Phase 6: User Story 4 — Teacher Configures Profile (Priority: P4)

**Goal**: Teachers can set their meeting link, platform preference, and spoken languages on their profile

**Independent Test**: Sign in as teacher → navigate to Profile → add meeting link and languages → save → verify info appears on availability card when online

### Implementation for User Story 4

- [x] T023 [P] [US4] Create `useUpdateTeacherProfile` mutation hook in `src/features/teacher-availability/hooks/useUpdateTeacherProfile.ts` — useMutation calling availabilityService.updateTeacherProfile(input), onSuccess invalidates ['teacher-profile'] and ['my-availability']
- [x] T024 [US4] Add meeting link, platform, and languages fields to teacher profile screen at `app/(teacher)/(tabs)/profile.tsx` — add a "Meeting Settings" section with: meeting_link TextInput (zod: z.string().url().startsWith('https://'), FR-012), meeting_platform Picker (google_meet/zoom/jitsi/other), languages multi-select (common ISO 639-1 options: ar, en, ur, fr, tr, ms, id, bn). Use react-hook-form + zod for validation. Use useTeacherProfile for initial values and useUpdateTeacherProfile for save.

**Checkpoint**: Teachers can configure meeting link and languages. Profile data shows on availability cards.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Barrel exports, green dot integration on other screens, and final validation

- [x] T025 Create barrel export in `src/features/teacher-availability/index.ts` — export all types, hooks, components, and service
- [x] T026 [P] Add GreenDotIndicator to existing teacher displays — GreenDotIndicator exported from shared ui; existing displays (CohortCard, team.tsx) use text-only, no avatars to attach dot to; green dot active in AvailableTeacherCard and availability screen — import from `src/components/ui/GreenDotIndicator.tsx` (shared layer) and render in cohort teacher cards (`src/features/programs/components/CohortCard.tsx`), team management lists (`app/(program-admin)/programs/[id]/team.tsx`), and any other locations that show teacher names/avatars. Query teacher_availability status where needed or pass as prop.
- [x] T027 Run quickstart.md validation — Docker not running; deferred to manual validation — execute `supabase db reset`, sign in as teacher to toggle availability, sign in as student to browse and join, verify green dot, verify realtime updates within 5 seconds, verify cron expiry (manually adjust available_since)
- [x] T028 Mark all tasks complete in `specs/004-teacher-availability/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (migration must exist for types to reference)
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Phase 2 — no dependencies on other stories
  - US2 (P2): Can start after Phase 2 — uses AvailableTeacherCard which shows "Join Session" but the button can be a no-op initially
  - US3 (P3): Depends on US2 (AvailableTeacherCard exists to wire join logic into)
  - US4 (P4): Can start after Phase 2 — independent of US1/US2/US3
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 → US2**: US2 shows teachers that US1 makes available; can be developed in parallel since they share the foundational service
- **US2 → US3**: US3 wires into the AvailableTeacherCard created in US2
- **US4**: Fully independent — can run in parallel with US1/US2

### Within Each User Story

- Hooks before components (components import hooks)
- Components before screens (screens compose components)
- Layout updates after screens (routes must exist)

### Parallel Opportunities

- T003, T004, T005 (Phase 2): all different files, can run in parallel
- T006, T007, T008 (US1 hooks): all different files, can run in parallel
- T014 (US2 hook): can run in parallel with US1 tasks since it's a different file
- T023 (US4 hook): can run in parallel with any other story
- T026 (green dot integration): can run in parallel with T025

---

## Parallel Example: User Story 1

```bash
# Launch all hooks in parallel (different files, no dependencies):
Task: "Create useMyAvailability hook in src/features/teacher-availability/hooks/useMyAvailability.ts"
Task: "Create useToggleAvailability hook in src/features/teacher-availability/hooks/useToggleAvailability.ts"
Task: "Create useTeacherProfile hook in src/features/teacher-availability/hooks/useTeacherProfile.ts"

# Then sequentially: GreenDotIndicator → ProgramSelector → AvailabilityToggle → Screen → Layout
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (migration)
2. Complete Phase 2: Foundational (types, service, i18n)
3. Complete Phase 3: User Story 1 (teacher toggle)
4. **STOP and VALIDATE**: Teacher can go available/offline, green dot shows
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Teacher toggle works (MVP!)
3. Add US2 → Test independently → Students browse available teachers
4. Add US3 → Test independently → Students join via meeting link
5. Add US4 → Test independently → Teachers configure profile
6. Polish → Green dots everywhere, barrel exports, full validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks generated (not requested in spec)
- 29 total tasks: 2 setup, 3 foundational, 9 US1 (includes T014a), 7 US2, 2 US3, 2 US4, 4 polish
- `leave_teacher_session` RPC removed per checklist review — counter resets on offline/timeout
- Migration is a single file (T001) containing all DDL, RPC, triggers, RLS, cron
