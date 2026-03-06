# Tasks: Himam Quranic Marathon Events

**Input**: Design documents from `/specs/009-himam/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/himam-api.md, quickstart.md

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature directory structure and TypeScript types

- [ ] T001 Create feature directory structure: src/features/himam/{components,hooks,services,types}/ per plan.md
- [ ] T002 [P] Define TypeScript types (HimamEvent, HimamRegistration, HimamProgress, HimamTrack, PrayerTimeSlot, RegistrationStatus, EventStatus, input/filter types) in src/features/himam/types/himam.types.ts per data-model.md
- [ ] T003 [P] Add bilingual i18n keys for himam feature (tracks, prayer-time labels, statuses, screen titles, button labels, error messages, notifications) in src/i18n/en.json and src/i18n/ar.json per spec NFR-003

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, RLS, RPC functions, Edge Functions — MUST complete before any UI work

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create migration supabase/migrations/00011_himam.sql with himam_events table (id, program_id FK, event_date, start_time, end_time, registration_deadline, status CHECK, created_by FK, created_at, updated_at, UNIQUE on event_date, indexes) per data-model.md
- [ ] T005 Add himam_registrations table to supabase/migrations/00011_himam.sql (id, event_id FK CASCADE, student_id FK CASCADE, track CHECK, selected_juz int[], partner_id FK SET NULL, time_slots JSONB, status CHECK with 6 values, created_at, updated_at, UNIQUE on event_id+student_id, indexes) per data-model.md
- [ ] T006 Add himam_progress table to supabase/migrations/00011_himam.sql (id, registration_id FK CASCADE, juz_number CHECK 1-30, status CHECK, completed_at, completed_by FK SET NULL, notes, created_at, UNIQUE on registration_id+juz_number, index) per data-model.md
- [ ] T007 Add updated_at triggers for himam_events and himam_registrations in supabase/migrations/00011_himam.sql using existing update_updated_at_column() function
- [ ] T008 Add RLS policies for himam_events in supabase/migrations/00011_himam.sql: SELECT for enrolled students + supervisors/program_admins, INSERT/UPDATE for supervisors/program_admins per data-model.md
- [ ] T009 Add RLS policies for himam_registrations in supabase/migrations/00011_himam.sql: SELECT for own/partner/supervisors, INSERT for enrolled students, UPDATE for own/supervisors per data-model.md
- [ ] T010 Add RLS policies for himam_progress in supabase/migrations/00011_himam.sql: SELECT/INSERT/UPDATE for registration owner or partner (via join) per data-model.md
- [ ] T011 Add register_for_himam_event RPC function in supabase/migrations/00011_himam.sql (validates enrollment, event status, deadline, track, juz count/range/duplicates, time_slots; creates registration + progress rows; returns JSONB) per contracts/himam-api.md
- [ ] T012 Add cancel_himam_registration RPC function in supabase/migrations/00011_himam.sql (validates ownership, status=registered, deadline; deletes progress rows, sets status=cancelled) per contracts/himam-api.md
- [ ] T013 Add mark_juz_complete RPC function in supabase/migrations/00011_himam.sql (validates participant, event active, juz in selection; updates both partners' progress rows; auto-completes registration if all done; idempotent; returns JSONB stats) per contracts/himam-api.md
- [ ] T014 Add generate_himam_pairings RPC function in supabase/migrations/00011_himam.sql (role check supervisor/program_admin/service; groups by track, sorts by time slot overlap, pairs adjacent, flags unpaired; returns JSONB stats) per contracts/himam-api.md
- [ ] T015 Add swap_himam_partners RPC function in supabase/migrations/00011_himam.sql (validates same event/track, event upcoming; swaps partner_id values) per contracts/himam-api.md
- [ ] T016 Add cancel_himam_event RPC function in supabase/migrations/00011_himam.sql (validates event upcoming, role check; sets event cancelled, cascades all registrations to cancelled) per contracts/himam-api.md
- [ ] T017 Add get_himam_event_stats RPC function in supabase/migrations/00011_himam.sql (role check; aggregates completion counts per track; returns JSONB) per contracts/himam-api.md
- [ ] T017b Add create_himam_event RPC function in supabase/migrations/00011_himam.sql (role check supervisor/program_admin; validates event_date is a Saturday, no duplicate date; inserts event with calculated deadline; returns JSONB summary) per spec FR-010 supervisor manual creation
- [ ] T018 Add pg_cron jobs in supabase/migrations/00011_himam.sql: event activation (Saturday 02:00 UTC → status active, paired registrations → in_progress), event closure (Sunday 02:00 UTC → status completed, in_progress → incomplete) per research.md R1
- [ ] T019 Create generate-himam-events Edge Function in supabase/functions/generate-himam-events/index.ts (finds Himam program, calculates next Saturday, checks duplicate, inserts event with deadline, returns summary) per contracts/himam-api.md
- [ ] T020 Create generate-himam-pairings Edge Function in supabase/functions/generate-himam-pairings/index.ts (fetches registered students per track, sorts by time slot overlap, pairs adjacent, updates partner_id+status, sends himam_partner_assigned notifications via send-notification, returns stats) per contracts/himam-api.md
- [ ] T021 Add pg_cron jobs in supabase/migrations/00011_himam.sql for: weekly event generation (Thursday 21:00 UTC → invoke generate-himam-events via net.http_post), registration close + pairing (Friday 21:00 UTC → invoke generate-himam-pairings via net.http_post), reminder (Friday 14:00 UTC → invoke send-notification for all registered) per research.md R1
- [ ] T022 Implement HimamService singleton class in src/features/himam/services/himam.service.ts with RPC wrappers (register, cancel, markComplete, runPairing, swapPartners, cancelEvent, createEvent, getStats) and direct queries (getUpcomingEvent, getEvents, getMyRegistration, getProgress, getHistory, getEventRegistrations) per contracts/himam-api.md
- [ ] T023 Add himam_partner_assigned, himam_event_reminder, and himam_event_cancelled notification categories to supabase/functions/send-notification/index.ts: add to NotificationCategory type, DIRECT_CATEGORIES set, getRecipients(), and buildNotificationContent() with bilingual content per spec FR-006, FR-013, and FR-019

**Checkpoint**: Database, RPCs, Edge Functions, service layer, and notifications ready. UI work can begin.

---

## Phase 3: User Story 1 — Event Discovery & Registration (Priority: P1)

**Goal**: Students can view upcoming events and register with track/juz/time-slot selection

**Independent Test**: Open Himam screen → see upcoming event → register with track + juz + time slots → see confirmation

- [ ] T024 [P] [US1] Create EventCard component in src/features/himam/components/EventCard.tsx (displays event date, status badge, registration count, countdown to event/deadline) per plan.md
- [ ] T025 [P] [US1] Create TrackSelector component in src/features/himam/components/TrackSelector.tsx (radio/chip selection for 5 tracks with Arabic labels, shows juz count per track) per plan.md
- [ ] T026 [P] [US1] Create JuzPicker component in src/features/himam/components/JuzPicker.tsx (multi-select grid 1-30, validates count matches track, auto-selects all for 30_juz, accessible labels) per spec FR-002
- [ ] T027 [P] [US1] Create TimeSlotSelector component in src/features/himam/components/TimeSlotSelector.tsx (multi-select chips for 6 prayer-time blocks with bilingual labels) per plan.md
- [ ] T028 [US1] Create useUpcomingEvent query hook in src/features/himam/hooks/useUpcomingEvent.ts (queryKey: ['himam', 'upcoming', programId], calls himamService.getUpcomingEvent) per plan.md
- [ ] T029 [P] [US1] Create useRegisterForEvent mutation hook in src/features/himam/hooks/useRegisterForEvent.ts (calls himamService.register, invalidates ['himam'] queries on success) per plan.md
- [ ] T030 [P] [US1] Create useCancelRegistration mutation hook in src/features/himam/hooks/useCancelRegistration.ts (calls himamService.cancel, invalidates ['himam'] queries on success) per plan.md
- [ ] T031 [US1] Create useMyRegistration query hook in src/features/himam/hooks/useMyRegistration.ts (queryKey: ['himam', 'registration', eventId], calls himamService.getMyRegistration, enabled when eventId exists) per plan.md
- [ ] T032 [US1] Create student Himam main screen in app/(student)/himam/index.tsx (shows upcoming event via useUpcomingEvent, registration form with TrackSelector+JuzPicker+TimeSlotSelector using react-hook-form+zod, or registration details if already registered, cancel button, zero-state message if no event) per spec US1
- [ ] T033 [US1] Register himam routes in app/(student)/_layout.tsx: add Stack.Screen entries for himam/index, himam/[eventId]/progress, himam/history per plan.md

**Checkpoint**: Students can discover and register for events. Core registration flow complete.

---

## Phase 4: User Story 2 — Partner Matching & Notification (Priority: P1)

**Goal**: Partners are paired, notified, and can see each other's info and meeting links

**Independent Test**: Register two students → run pairing → both see partner info + meeting links + receive notification

**Depends on**: US1 (registration must exist)

- [ ] T034 [P] [US2] Create PartnerCard component in src/features/himam/components/PartnerCard.tsx (shows partner name, avatar, both meeting links with "Join" buttons for deep-linking, selected time slots) per plan.md
- [ ] T035 [US2] Extend student Himam main screen app/(student)/himam/index.tsx to show PartnerCard when registration status is 'paired' or later, and read-only juz list with countdown when event not yet active per spec US2 scenarios 2+5

**Checkpoint**: Paired students see partner info and meeting links. Notification sent on pairing.

---

## Phase 5: User Story 3 — Marathon Day Progress Tracking (Priority: P1)

**Goal**: Students mark juz as completed during the event, progress updates for both partners

**Independent Test**: Paired student on event day → open progress → mark juz complete → progress bar updates → all done → completion status

- [ ] T036 [P] [US3] Create ProgressTracker component in src/features/himam/components/ProgressTracker.tsx (FlashList of juz items with pending/completed status, "Mark Complete" button per item, progress bar with percentage, completion checkmark animation when 100%, optimistic update support) per spec US3 + NFR-004
- [ ] T037 [US3] Create useHimamProgress query hook in src/features/himam/hooks/useHimamProgress.ts (queryKey: ['himam', 'progress', registrationId], calls himamService.getProgress, returns sorted juz list) per plan.md
- [ ] T038 [US3] Create useMarkJuzComplete mutation hook in src/features/himam/hooks/useMarkJuzComplete.ts (calls himamService.markComplete, uses optimistic update via queryClient.setQueryData before server confirms, reverts on error, invalidates ['himam'] on success) per spec NFR-004
- [ ] T039 [US3] Create student progress screen in app/(student)/himam/[eventId]/progress.tsx (shows ProgressTracker with juz list from useHimamProgress, PartnerCard at top, event status badge, "Mark Complete" disabled if event not active) per spec US3

**Checkpoint**: Progress tracking fully functional. Students can mark juz complete with optimistic updates.

---

## Phase 6: User Story 4 — Supervisor Event Management (Priority: P2)

**Goal**: Supervisors manage events, view registrations, trigger pairing, adjust pairs, cancel events, view stats

**Independent Test**: Supervisor opens Himam management → sees events → views registrations → runs pairing → views stats

- [ ] T040 [P] [US4] Create TrackStatsCard component in src/features/himam/components/TrackStatsCard.tsx (shows track name, registered/paired/completed/incomplete counts, completion rate percentage bar) per plan.md
- [ ] T041 [US4] Create useEventRegistrations query hook in src/features/himam/hooks/useEventRegistrations.ts (queryKey: ['himam', 'registrations', eventId], calls himamService.getEventRegistrations, returns students grouped by track) per plan.md
- [ ] T042 [P] [US4] Create useRunPairing mutation hook in src/features/himam/hooks/useRunPairing.ts (calls himamService.runPairing, invalidates ['himam'] on success) per plan.md
- [ ] T043 [P] [US4] Create useEventStats query hook in src/features/himam/hooks/useEventStats.ts (queryKey: ['himam', 'stats', eventId], calls himamService.getStats) per plan.md
- [ ] T043b [P] [US4] Create useHimamEvents query hook in src/features/himam/hooks/useHimamEvents.ts (queryKey: ['himam', 'events'], calls himamService.getEvents, returns all events sorted by date DESC for supervisor event list) per plan.md
- [ ] T043c [P] [US4] Create useCancelEvent mutation hook in src/features/himam/hooks/useCancelEvent.ts (calls himamService.cancelEvent, invalidates ['himam', 'events'] on success, shows confirmation before calling) per plan.md
- [ ] T044 [US4] Create supervisor Himam event list screen in app/(supervisor)/himam/index.tsx (FlashList of events via useHimamEvents, EventCard per item, "Create Event" button calling createEvent, "Cancel Event" button for upcoming events via useCancelEvent with confirmation Alert) per spec US4 scenarios 1+6
- [ ] T045 [US4] Create supervisor registrations screen in app/(supervisor)/himam/[eventId]/registrations.tsx (FlashList of registrations grouped by track via useEventRegistrations, "Run Pairing" button, TrackStatsCard per track) per spec US4 scenarios 2+3
- [ ] T046 [US4] Create supervisor pairings screen in app/(supervisor)/himam/[eventId]/pairings.tsx (shows paired students per track, swap button between two selected students, unpaired student list, post-event stats via useEventStats with TrackStatsCard) per spec US4 scenarios 4+5
- [ ] T047 [US4] Register himam routes in app/(supervisor)/_layout.tsx: add Stack.Screen entries for himam/index, himam/[eventId]/registrations, himam/[eventId]/pairings per plan.md

**Checkpoint**: Supervisors can fully manage events, pairings, and view statistics.

---

## Phase 7: User Story 5 — Event History & Statistics (Priority: P3)

**Goal**: Students view past event participation, dashboard shows upcoming event card

**Independent Test**: Student with past events → open history → see chronological list with tracks/partners/status

- [ ] T048 [US5] Create useHimamHistory query hook in src/features/himam/hooks/useHimamHistory.ts (queryKey: ['himam', 'history', studentId], calls himamService.getHistory, returns past events with partner info) per plan.md
- [ ] T049 [US5] Create student history screen in app/(student)/himam/history.tsx (FlashList of past events via useHimamHistory, each item shows event date, track, partner name, completion status badge) per spec US5 scenario 1
- [ ] T050 [US5] Add Himam dashboard card widget to existing student dashboard: shows next event date, registration status, partner info if paired, taps to navigate to himam/index per spec US5 scenario 2

**Checkpoint**: Full event history and dashboard integration complete.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Barrel exports, final integration, validation

- [ ] T051 Create barrel exports in src/features/himam/index.ts: export all components, hooks, service singleton, and types per plan.md
- [ ] T052 Run quickstart.md validation scenarios: test registration flow, pairing, progress marking, event lifecycle transitions, cancellation cascade, notification delivery per quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (types) — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 + US1 (registration must exist for pairing)
- **US3 (Phase 5)**: Depends on Phase 2 + US2 (paired status required for progress)
- **US4 (Phase 6)**: Depends on Phase 2 only (supervisor screens are independent of student flow)
- **US5 (Phase 7)**: Depends on Phase 2 only (history reads existing data)
- **Polish (Phase 8)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P1)**: Requires US1 registration data to exist
- **US3 (P1)**: Requires US2 pairing to be complete
- **US4 (P2)**: Independent after Phase 2 (can parallel with US1-US3)
- **US5 (P3)**: Independent after Phase 2 (can parallel with US1-US4)

### Parallel Opportunities

- T002 + T003 (types + i18n) can run in parallel
- T008 → T009 → T010 (RLS policies — sequential, same migration file)
- T024 + T025 + T026 + T027 (all components in US1)
- T029 + T030 (mutation hooks in US1)
- T040 + T042 + T043 + T043b + T043c (supervisor components/hooks in US4)
- US4 and US5 can run in parallel with US1-US3

---

## Parallel Example: User Story 1

```bash
# Launch all components in parallel:
Task T024: "Create EventCard in src/features/himam/components/EventCard.tsx"
Task T025: "Create TrackSelector in src/features/himam/components/TrackSelector.tsx"
Task T026: "Create JuzPicker in src/features/himam/components/JuzPicker.tsx"
Task T027: "Create TimeSlotSelector in src/features/himam/components/TimeSlotSelector.tsx"

# Then hooks (T028 first, then T029+T030 in parallel):
Task T028: "Create useUpcomingEvent hook"
Task T029: "Create useRegisterForEvent hook"  # parallel with T030
Task T030: "Create useCancelRegistration hook"  # parallel with T029
```

---

## Implementation Strategy

### MVP First (User Stories 1-3)

1. Complete Phase 1: Setup (types + i18n)
2. Complete Phase 2: Foundational (migration + RPCs + Edge Functions + service + notifications)
3. Complete Phase 3: US1 — Event Discovery & Registration
4. Complete Phase 4: US2 — Partner Matching & Notification
5. Complete Phase 5: US3 — Marathon Day Progress Tracking
6. **STOP and VALIDATE**: Core Himam flow end-to-end
7. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Database and backend ready
2. Add US1 → Students can register → Validate
3. Add US2 → Partners paired and notified → Validate
4. Add US3 → Progress tracking live → Validate (MVP complete!)
5. Add US4 → Supervisor management → Validate
6. Add US5 → History and dashboard → Validate
7. Polish → Barrel exports + quickstart validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Migration T004-T021 must be sequential (single file, ordered SQL)
- Edge Functions T019-T020 can parallel after migration is done
- pg_cron jobs T018+T021 depend on RPC functions being defined first
- Commit after each phase checkpoint
