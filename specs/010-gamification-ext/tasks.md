# Tasks: Gamification Extension for Programs

**Input**: Design documents from `/specs/010-gamification-ext/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Migration, types, and i18n keys shared by all user stories

- [x] T001 Write migration file with ALTER TABLE stickers (add program_id), CREATE TABLE milestone_badges with 9 seed rows, CREATE TABLE student_badges with UNIQUE constraint, RLS policies for all tables, indexes, and all 5 RPC functions (get_program_leaderboard, get_rewards_dashboard, check_session_milestones, check_streak_milestones, check_enrollment_duration_milestones), streak trigger, and pg_cron job in supabase/migrations/00011_gamification_ext.sql
- [x] T002 Extend gamification types: add MilestoneBadge, StudentBadgeDisplay, LeaderboardEntry, RewardsDashboard, BadgeCategory interfaces and update Sticker type with optional program_id, program_name fields in src/features/gamification/types/gamification.types.ts
- [x] T003 [P] Add bilingual i18n keys for gamification extension (badge names, badge descriptions, leaderboard labels, rewards dashboard labels, empty states, section headers) in src/i18n/locales/en.json and src/i18n/locales/ar.json

**Checkpoint**: Schema deployed, types available, i18n keys ready. All user stories can begin.

---

## Phase 2: User Story 1 — Program-Scoped Sticker Catalog (Priority: P1)

**Goal**: Stickers can be associated with programs; teachers see program-filtered stickers in the award picker; students see program labels in their collection.

**Independent Test**: Admin creates a sticker assigned to "Himam" program. Teacher in that program sees it; teacher in another program does not. Student sees program name on awarded sticker.

### Implementation

- [x] T004 [US1] Update getStickers() in gamification.service.ts to accept optional programIds param, filter by program_id IS NULL OR program_id IN (programIds), and return program_name via join in src/features/gamification/services/gamification.service.ts
- [x] T005 [US1] Update useStickers hook to pass the teacher's program IDs from program_roles query into getStickers(), group results by program_id for section rendering in src/features/gamification/hooks/useStickers.ts
- [x] T006 [US1] Update StickerGrid component to render section headers ("Global" and program names) when stickers have mixed program_id values in src/features/gamification/components/StickerGrid.tsx
- [x] T007 [US1] Update StickerDetailSheet component to display program name label when sticker has a program association in src/features/gamification/components/StickerDetailSheet.tsx
- [x] T008 [US1] Update existing gamification barrel export if new types were added in src/features/gamification/index.ts

**Checkpoint**: Program-scoped sticker visibility works. Existing sticker flows unchanged. SC-001 and SC-006 verifiable.

---

## Phase 3: User Story 2 — Program Leaderboard (Priority: P1)

**Goal**: Students see a program-scoped leaderboard ranked by rubʿ level. Existing class leaderboard preserved.

**Independent Test**: Two students in the same program see each other ranked. Student outside program does not appear. Class leaderboard unchanged.

### Implementation

- [x] T009 [US2] Create useProgramLeaderboard hook calling supabase.rpc('get_program_leaderboard') with TanStack Query, queryKey ['gamification', 'leaderboard', programId] in src/features/gamification/hooks/useProgramLeaderboard.ts
- [x] T010 [US2] Create ProgramLeaderboard component with FlashList rendering LeaderboardEntry rows, current student highlighted with "You" label, divider when own rank > top 20, empty state message in src/features/gamification/components/ProgramLeaderboard.tsx
- [x] T011 [US2] Create program leaderboard screen that reads programId from route params, renders ProgramLeaderboard with loading/error states in app/(student)/program/[programId]/leaderboard.tsx
- [x] T012 [US2] Add Stack.Screen entry for program leaderboard in student layout in app/(student)/_layout.tsx
- [x] T013 [US2] Export useProgramLeaderboard and ProgramLeaderboard from barrel in src/features/gamification/index.ts

**Checkpoint**: Program leaderboard screen functional with top-20 + own rank. Class leaderboard untouched. SC-002 verifiable.

---

## Phase 4: User Story 3 — Enrollment Milestone Badges (Priority: P2)

**Goal**: 9 milestone badge types automatically awarded via inline checks (session/streak) and daily cron (enrollment duration). Badge grid on student profile shows earned/locked state.

**Independent Test**: Student completes 10th session → sessions_10 badge auto-awarded. Student views profile → earned badge in color, locked badges grayed out with descriptions.

### Implementation

- [x] T014 [US3] Add getStudentBadges(studentId, programId?) and getMilestoneBadges() methods to gamification.service.ts — getStudentBadges LEFT JOINs milestone_badges with student_badges to return all badges with earned/locked status in src/features/gamification/services/gamification.service.ts
- [x] T015 [US3] Add checkSessionMilestones(studentId, programId) method to gamification.service.ts that calls supabase.rpc('check_session_milestones') in src/features/gamification/services/gamification.service.ts
- [x] T016 [P] [US3] Create useStudentBadges hook with queryKey ['gamification', 'badges', studentId, programId] in src/features/gamification/hooks/useStudentBadges.ts
- [x] T017 [P] [US3] Create useMilestoneBadges hook for fetching all badge type definitions in src/features/gamification/hooks/useMilestoneBadges.ts
- [x] T018 [US3] Create BadgeCard component showing icon (full color if earned, monochrome+reduced opacity if locked), badge name, program name, earned date or lock description, accessibilityRole and accessibilityState for screen readers in src/features/gamification/components/BadgeCard.tsx
- [x] T019 [US3] Create BadgeGrid component rendering BadgeCards grouped by category (enrollment, sessions, streak) with section headers, using the fixed category order in src/features/gamification/components/BadgeGrid.tsx
- [x] T020 [US3] Create badges screen that reads studentId from auth, fetches enrolled programs, renders BadgeGrid per program with loading/error states in app/(student)/profile/badges.tsx
- [x] T021 [US3] Add Stack.Screen entry for badges in student layout in app/(student)/_layout.tsx
- [x] T022 [US3] Integrate check_session_milestones call into the existing session creation flow — after a session is saved with program_id, call supabase.rpc('check_session_milestones') from the session save hook/service (find the existing session creation call site, likely in src/features/sessions/ or a teacher screen, and add the RPC call after successful save)
- [x] T023 [US3] Add milestone_badge_earned notification category to send-notification Edge Function: add to NotificationCategory type, DIRECT_CATEGORIES set, getRecipients() handler (notify student directly), buildNotificationContent() with bilingual title/body and deep-link to /(student)/profile/badges in supabase/functions/send-notification/index.ts
- [x] T024 [US3] Export useStudentBadges, useMilestoneBadges, BadgeCard, BadgeGrid from barrel in src/features/gamification/index.ts

**Checkpoint**: All 9 badge types defined. Session milestone check fires inline. Streak trigger fires via Postgres. Duration cron runs daily. Badge grid shows earned/locked. SC-003 and SC-004 verifiable.

---

## Phase 5: User Story 4 — Supervisor Rewards Dashboard (Priority: P3)

**Goal**: Supervisors and program admins view aggregated gamification stats (sticker counts, top teachers, popular stickers, badge distribution) for their program.

**Independent Test**: Supervisor opens dashboard, sees this week/month sticker counts, top 5 teachers, top 5 stickers, badge distribution. Different program admin sees only their data.

### Implementation

- [x] T025 [US4] Add getRewardsDashboard(programId) method to gamification.service.ts calling supabase.rpc('get_rewards_dashboard') in src/features/gamification/services/gamification.service.ts
- [x] T026 [US4] Create useRewardsDashboard hook with queryKey ['gamification', 'rewards', programId] in src/features/gamification/hooks/useRewardsDashboard.ts
- [x] T027 [US4] Create RewardsDashboard component with 4 sections: sticker counts (week/month), top teachers list, popular stickers list, badge distribution bars; empty state messages when zero data in src/features/gamification/components/RewardsDashboard.tsx
- [x] T028 [US4] Create supervisor rewards screen that reads programId from user's program_roles, renders RewardsDashboard in app/(supervisor)/rewards/index.tsx
- [x] T029 [P] [US4] Create program-admin rewards screen (identical to supervisor but scoped to program_admin role) in app/(program-admin)/rewards/index.tsx
- [x] T030 [US4] Add Stack.Screen entries for rewards in supervisor and program-admin layouts in app/(supervisor)/_layout.tsx and app/(program-admin)/_layout.tsx
- [x] T031 [US4] Export useRewardsDashboard and RewardsDashboard from barrel in src/features/gamification/index.ts

**Checkpoint**: Rewards dashboard fully functional for both supervisor and program-admin roles. SC-005 verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Integration, barrel exports, and validation

- [x] T032 Verify existing class-based leaderboard at app/(student)/leaderboard.tsx and app/(parent)/class-standing/[childId].tsx is completely unchanged — no regressions from schema or service changes (FR-006)
- [x] T033 Verify existing sticker award flow works for teachers not assigned to any program — getStickers() with no programIds returns global stickers only (SC-006)
- [x] T034 Run quickstart.md validation scenarios 1-11 in specs/010-gamification-ext/quickstart.md — include timing checks for scenario 4 (leaderboard <2s per NFR-001), scenario 9 (dashboard <3s per NFR-004), and scenario 10 (FR-014: previously awarded stickers preserved after scope change)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (US1)**: Depends on T001 (migration) and T002 (types)
- **Phase 3 (US2)**: Depends on T001 (migration, leaderboard RPC) and T002 (types). Independent of US1.
- **Phase 4 (US3)**: Depends on T001 (migration, badge tables/RPCs/trigger/cron) and T002 (types). Independent of US1/US2.
- **Phase 5 (US4)**: Depends on T001 (migration, dashboard RPC) and T002 (types). Best after US3 (badge data needed for distribution stats).
- **Phase 6 (Polish)**: Depends on all user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent — only needs migration + types
- **US2 (P1)**: Independent — only needs migration + types
- **US3 (P2)**: Independent — only needs migration + types + notification Edge Function
- **US4 (P3)**: Soft dependency on US3 (badge distribution section uses student_badges data, but dashboard works without badges — just shows zero counts)

### Within Each User Story

- Service methods before hooks
- Hooks before components
- Components before screens
- Screens before layout registration

### Parallel Opportunities

- T003 (i18n) can run in parallel with T001/T002
- T016 and T017 (badge hooks) can run in parallel
- T028 and T029 (supervisor/program-admin screens) can run in parallel
- US1 and US2 can run in parallel after Phase 1
- US3 can start in parallel with US1/US2 after Phase 1

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: US1 — Program-scoped stickers (T004–T008)
3. Complete Phase 3: US2 — Program leaderboard (T009–T013)
4. **STOP and VALIDATE**: Award picker filtered, leaderboard works, class leaderboard preserved
5. Deploy/demo if ready

### Incremental Delivery

1. Setup → Foundation ready
2. US1 (stickers) → Program-aware sticker system live
3. US2 (leaderboard) → Program competition live
4. US3 (badges) → Milestone engagement system live
5. US4 (dashboard) → Supervisor analytics live
6. Polish → Full regression validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Migration T001 is large but atomic — it must be a single file for transaction safety
- Existing gamification files (StickerGrid, StickerDetailSheet, useStickers, gamification.service) are modified, not replaced
- All new components use logical CSS (paddingStart/paddingEnd), i18n strings, and FlashList where applicable
