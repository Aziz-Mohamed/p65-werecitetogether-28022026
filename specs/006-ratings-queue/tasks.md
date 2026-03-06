# Tasks: Ratings & Queue System

**Input**: Design documents from `/specs/006-ratings-queue/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Organization**: Tasks grouped by user story (P1→P5) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create feature directory structures, types, constants, and i18n keys shared across all user stories

- [ ] T001 [P] Create ratings types file with Rating, RatingStats, FeedbackTag, ExclusionLogEntry interfaces in src/features/ratings/types/ratings.types.ts
- [ ] T002 [P] Create queue types file with QueueEntry, QueueStatus, DailySessionCount, ProgramDemand interfaces in src/features/queue/types/queue.types.ts
- [ ] T003 [P] Create feedback tag constants with i18n keys (5 positive + 4 constructive, en + ar) in src/features/ratings/constants/feedback-tags.ts
- [ ] T004 [P] Add all ratings + queue i18n keys (en + ar) — rating prompt, stats labels, tag labels, error messages, "New teacher" label, queue status, wait time, fair usage messages, demand indicator, notifications in src/i18n/locales/en.json and src/i18n/locales/ar.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migration with all tables, RPC functions, triggers, RLS policies, and pg_cron jobs. MUST complete before any user story.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Write Supabase migration 00008_ratings_queue.sql with all 5 new tables (teacher_ratings, teacher_rating_stats, rating_exclusion_log, program_queue_entries, daily_session_counts), ALTER programs table (add daily_session_limit, queue_notification_threshold columns), ALTER notification_preferences table (add rating_prompt, low_rating_alert, flagged_review_alert, queue_available, teacher_demand, recovered_alert columns) in supabase/migrations/00008_ratings_queue.sql
- [ ] T007 Add RPC functions to migration: submit_rating, get_teacher_rating_stats, exclude_rating, restore_rating, recalculate_teacher_stats (with 3.5 threshold check and 0.2 trend threshold), get_teacher_reviews in supabase/migrations/00008_ratings_queue.sql
- [ ] T008 Add RPC functions to migration: join_queue, leave_queue, claim_queue_slot, get_queue_status, get_program_demand, get_daily_session_count in supabase/migrations/00008_ratings_queue.sql
- [ ] T009 Add triggers to migration: after_rating_insert_or_update (calls recalculate_teacher_stats), after_session_completed (increments daily_session_counts for free programs), on_teacher_available (invokes queue-processor Edge Function via pg_net) in supabase/migrations/00008_ratings_queue.sql
- [ ] T010 Add RLS policies to migration for all 5 new tables per data-model.md (student/teacher/supervisor/program_admin/master_admin access) in supabase/migrations/00008_ratings_queue.sql
- [ ] T011 Add pg_cron jobs to migration: queue_cascade_processor (every 1 min), queue_auto_expiry (every 5 min), teacher_demand_check (every 5 min), queue_entry_cleanup (daily at 03:00 UTC) in supabase/migrations/00008_ratings_queue.sql
- [ ] T012 Add Realtime publication for teacher_ratings, teacher_rating_stats, program_queue_entries tables in supabase/migrations/00008_ratings_queue.sql
- [ ] T013 Create ratings service with submitRating, getRatingForSession, getTeacherRatingStats, getTeacherReviews, excludeRating, restoreRating methods wrapping Supabase RPC calls in src/features/ratings/services/ratings.service.ts
- [ ] T014 Create queue service with joinQueue, leaveQueue, claimQueueSlot, getQueueStatus, getProgramDemand, getDailySessionCount methods wrapping Supabase RPC calls in src/features/queue/services/queue.service.ts

**Checkpoint**: Database schema deployed, services ready. User story implementation can begin.

---

## Phase 3: User Story 1 — Post-Session Teacher Rating (Priority: P1) MVP

**Goal**: Students can rate completed sessions (1-5 stars, tags, comment) within 48h. Auto-flagging for low ratings. One rating per session enforced.

**Independent Test**: Sign in as student. Open completed session < 48h. Rate 4 stars + tags. Submit. Verify saved. Verify duplicate blocked. Verify 2-star auto-flags.

### Implementation for User Story 1

- [ ] T015 [US1] Create useRatingPrompt hook — checks if session is ratable (completed, < 48h, not yet rated by current user) in src/features/ratings/hooks/useRatingPrompt.ts
- [ ] T016 [US1] Create useSubmitRating hook — TanStack mutation calling ratingsService.submitRating, invalidates session and rating stats queries on success in src/features/ratings/hooks/useSubmitRating.ts
- [ ] T017 [P] [US1] Create StarRating component — tappable 1-5 star input with reanimated scale feedback, accessibilityLabel per star, 44x44pt touch targets in src/features/ratings/components/StarRating.tsx
- [ ] T018 [P] [US1] Create FeedbackTags component — selectable chip list rendering positive + constructive tags from feedback-tags.ts constants, multi-select, i18n labels in src/features/ratings/components/FeedbackTags.tsx
- [ ] T019 [US1] Create RatingPrompt component — @gorhom/bottom-sheet combining StarRating, FeedbackTags, optional TextInput (500 char limit), submit button. Uses react-hook-form + zod validation in src/features/ratings/components/RatingPrompt.tsx
- [ ] T020 [US1] Integrate RatingPrompt into student session detail screen — show prompt when useRatingPrompt returns true, hide after submission in app/(student)/sessions/[id].tsx
- [ ] T021 [US1] Extend send-notification Edge Function with rating_prompt category — refactor TABLE_TO_CATEGORY to support multiple categories per table event (sessions.completed now triggers both session_completed and rating_prompt), send bilingual push to student with session deep link in supabase/functions/send-notification/index.ts
- [ ] T022 [US1] Extend send-notification Edge Function with flagged_review_alert category — trigger on teacher_ratings INSERT where is_flagged = true, send to supervisors in the rating's program in supabase/functions/send-notification/index.ts

**Checkpoint**: Students can rate sessions. Auto-flagging works. Rating prompt notification sent.

---

## Phase 4: User Story 2 — Teacher Rating Stats & Profile Display (Priority: P2)

**Goal**: Teachers see own aggregate stats (avg, distribution, trend, tags). Students see rating badge on teacher cards (5+ reviews only). Supervisors see individual reviews with exclusion controls.

**Independent Test**: Sign in as teacher with 5+ ratings. View stats. Sign in as student. See rating badges on available-now list. Sign in as supervisor. View individual reviews. Exclude a review. Verify stats recalculate.

### Implementation for User Story 2

- [ ] T023 [US2] Create useTeacherRatingStats hook — TanStack query calling ratingsService.getTeacherRatingStats, subscribes to teacher_rating_stats Realtime changes in src/features/ratings/hooks/useTeacherRatingStats.ts
- [ ] T024 [P] [US2] Create TeacherRatingBadge component — displays average rating (stars) + review count inline, shows "New teacher" label if total_reviews < 5 in src/features/ratings/components/TeacherRatingBadge.tsx
- [ ] T025 [P] [US2] Create RatingStatsCard component — teacher's own stats: average rating, star distribution bar chart, trend direction badge (improving/declining/stable), common positive + constructive tags in src/features/ratings/components/RatingStatsCard.tsx
- [ ] T026 [US2] Integrate TeacherRatingBadge into available-now teacher cards — import from ratings feature, display on each teacher card where total_reviews >= 5 in app/(student)/available-now/[programId].tsx
- [ ] T027 [US2] Integrate RatingStatsCard into teacher dashboard — show own rating stats below profile info in app/(teacher)/(tabs)/index.tsx
- [ ] T028 [US2] Create useTeacherReviews hook — TanStack query calling ratingsService.getTeacherReviews with pagination in src/features/ratings/hooks/useTeacherReviews.ts
- [ ] T029 [US2] Create useExcludeRating hook — TanStack mutation calling ratingsService.excludeRating / restoreRating, invalidates teacher reviews and stats queries in src/features/ratings/hooks/useExcludeRating.ts
- [ ] T030 [US2] Create SupervisorReviewList component — FlashList of individual reviews with student names, flagged highlight, exclusion/restore toggle with reason input, audit trail display in src/features/ratings/components/SupervisorReviewList.tsx
- [ ] T031 [US2] Create supervisor teacher reviews screen — route file displaying SupervisorReviewList for a specific teacher+program in app/(supervisor)/teachers/[id]/reviews.tsx
- [ ] T032 [US2] Extend send-notification Edge Function with low_rating_alert category — triggered when recalculate_teacher_stats detects avg < 3.5 (was >= 3.5), send to program admins in supabase/functions/send-notification/index.ts
- [ ] T033 [US2] Extend send-notification Edge Function with recovered_alert category — triggered when avg recovers above 3.5 (was < 3.5), send to program admins in supabase/functions/send-notification/index.ts

**Checkpoint**: Rating stats display end-to-end. Supervisor exclusion/restore works. Threshold alerts sent.

---

## Phase 5: User Story 3 — Free Program Queue (Priority: P3)

**Goal**: Students join queue when no teachers available. Push notification with 3-min claim window when teacher arrives. Cascade to next student on expiry. Auto-expiry after 2h.

**Independent Test**: Student joins queue in free program. Teacher goes available. First student gets notified. Tap notification claims slot and shows meeting link. If unclaimed, cascades to next student.

### Implementation for User Story 3

- [ ] T034 [US3] Create useJoinQueue hook — TanStack mutation calling queueService.joinQueue, returns position and estimated wait in src/features/queue/hooks/useJoinQueue.ts
- [ ] T035 [US3] Create useLeaveQueue hook — TanStack mutation calling queueService.leaveQueue in src/features/queue/hooks/useLeaveQueue.ts
- [ ] T036 [US3] Create useQueuePosition hook — TanStack query calling queueService.getQueueStatus + Supabase Realtime subscription on program_queue_entries filtered by program_id for live position updates in src/features/queue/hooks/useQueuePosition.ts
- [ ] T037 [P] [US3] Create QueueStatus component — displays current position ("You are #N in line"), estimated wait time, expires_at countdown, "Leave queue" button in src/features/queue/components/QueueStatus.tsx
- [ ] T038 [P] [US3] Create JoinQueueButton component — "Notify me" button shown when no teachers available in a free program, calls useJoinQueue on press, shows QueueStatus after joining in src/features/queue/components/JoinQueueButton.tsx
- [ ] T039 [US3] Integrate JoinQueueButton and QueueStatus into program detail screen — when program.category = 'free' and no teachers available, show JoinQueueButton; when in queue, show QueueStatus in app/(student)/programs/[id].tsx
- [ ] T040 [US3] Create queue-processor Edge Function — handles teacher-available trigger: find first waiting student, set notified + 3-min claim window, send queue_available push notification via Expo Push API in supabase/functions/queue-processor/index.ts
- [ ] T041 [US3] Extend send-notification Edge Function with queue_available category — bilingual notification with deep link werecitetogether://queue/claim/{entry_id} in supabase/functions/send-notification/index.ts
- [ ] T042 [US3] Create queue claim deep link route — handles werecitetogether://queue/claim/[entryId], calls queueService.claimQueueSlot, redirects to teacher meeting link on success or shows expiry message in app/(student)/queue/claim/[entryId].tsx
- [ ] T043 [US3] Extend Realtime subscription profiles — add program_queue_entries subscription for students (INSERT/UPDATE/DELETE on program_id filter) to invalidate queue position queries in src/features/realtime/config/subscription-profiles.ts
- [ ] T044 [US3] Extend Realtime event-query-map — map program_queue_entries changes to queue query keys for automatic invalidation in src/features/realtime/config/event-query-map.ts

**Checkpoint**: Full queue flow works. Join → notify → claim/cascade → expiry. Deep link claim works.

---

## Phase 6: User Story 4 — Fair Usage Daily Session Tracking (Priority: P4)

**Goal**: Track daily sessions per student per program. Show fair usage message at limit. Prioritize students with fewer sessions in queue.

**Independent Test**: Student completes 2 sessions in free program. Sees "You've had 2 sessions today" message. When queue exists, student is deprioritized behind zero-session students.

**Dependencies**: Depends on US3 (queue) for prioritization integration.

### Implementation for User Story 4

- [ ] T045 [US4] Create useDailySessionCount hook — TanStack query calling queueService.getDailySessionCount in src/features/queue/hooks/useDailySessionCount.ts
- [ ] T046 [US4] Create FairUsageNotice component — displays "You've had N sessions today. You can still join if no one is waiting." when has_reached_limit = true, i18n bilingual in src/features/queue/components/FairUsageNotice.tsx
- [ ] T047 [US4] Integrate FairUsageNotice into program detail screen — show below JoinQueueButton / QueueStatus when daily limit reached in app/(student)/programs/[id].tsx
- [ ] T048 [US4] Add program admin config UI for daily_session_limit and queue_notification_threshold — add two numeric input fields to program settings screen (daily_session_limit default 2, queue_notification_threshold default 5) in app/(master-admin)/programs/[id]/index.tsx

**Checkpoint**: Daily session tracking works. Fair usage message displays. Queue prioritization respects daily counts.

---

## Phase 7: User Story 5 — Supply-Side Teacher Notifications (Priority: P5)

**Goal**: Notify offline teachers when queue grows past threshold. Show demand indicator on teacher dashboard.

**Independent Test**: Add 5 students to queue. Verify offline teachers get notification. Teacher dashboard shows "5 students waiting".

**Dependencies**: Depends on US3 (queue) for queue count data.

### Implementation for User Story 5

- [ ] T049 [US5] Create useProgramDemand hook — TanStack query calling queueService.getProgramDemand for each of teacher's assigned programs in src/features/queue/hooks/useProgramDemand.ts
- [ ] T050 [US5] Create DemandIndicator component — displays "N students waiting" badge for each program with active queue, styled as attention-grabbing chip in src/features/queue/components/DemandIndicator.tsx
- [ ] T051 [US5] Integrate DemandIndicator into teacher dashboard — show demand indicators for all assigned programs with waiting students in app/(teacher)/(tabs)/index.tsx
- [ ] T052 [US5] Extend send-notification Edge Function with teacher_demand category — bilingual notification to offline teachers (is_available = false) with program name and waiting count, respects 60-min debounce per program in supabase/functions/send-notification/index.ts

**Checkpoint**: Teacher demand notifications work. Debounce enforced. Demand indicator shows on dashboard.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Barrel exports, Realtime updates, final integration, validation

- [ ] T054 [P] Create barrel export file for ratings feature — export all public components, hooks, types, constants in src/features/ratings/index.ts
- [ ] T055 [P] Create barrel export file for queue feature — export all public components, hooks, types in src/features/queue/index.ts
- [ ] T056 Add teacher_rating_stats Realtime subscription to student subscription profile — invalidate teacher cards query when stats change (for badge updates on available-now list) in src/features/realtime/config/subscription-profiles.ts
- [ ] T057 Add teacher_ratings Realtime subscription to supervisor subscription profile — invalidate reviews queries when new ratings arrive or exclusions change in src/features/realtime/config/subscription-profiles.ts
- [ ] T058 Verify all i18n keys have both en and ar translations — audit src/i18n/locales/en.json and src/i18n/locales/ar.json for ratings and queue namespaces
- [ ] T059 Run quickstart.md validation scenarios 1-8 against the implementation — verify all acceptance scenarios pass per specs/006-ratings-queue/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. All T001-T005 are parallel.
- **Foundational (Phase 2)**: T006-T012 (migration) are sequential (same file). T013-T014 (services) depend on migration but are parallel with each other.
- **US1 (Phase 3)**: Depends on Phase 2 completion (migration + ratings service)
- **US2 (Phase 4)**: Depends on Phase 2 completion. Can run in parallel with US1 but benefits from US1 being done first (ratings exist to display stats for).
- **US3 (Phase 5)**: Depends on Phase 2 completion (migration + queue service)
- **US4 (Phase 6)**: Depends on US3 (queue components to integrate with)
- **US5 (Phase 7)**: Depends on US3 (queue count data)
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — can start immediately after Phase 2
- **US2 (P2)**: Independent — can start after Phase 2. Logically benefits from US1 data existing but not blocked.
- **US3 (P3)**: Independent — can start after Phase 2
- **US4 (P4)**: Depends on US3 (uses queue components and fair usage integrates with queue screen)
- **US5 (P5)**: Depends on US3 (uses queue count data and teacher demand relies on queue existing)

### Within Each User Story

- Types/constants before services
- Services before hooks
- Hooks before components
- Components before screen integration
- Edge Function extensions after core implementation

### Parallel Opportunities

- Phase 1: All 4 tasks (T001-T004) run in parallel
- Phase 2: T013 and T014 (services) run in parallel after migration
- Phase 3: T017 and T018 (StarRating, FeedbackTags) run in parallel
- Phase 4: T024 and T025 (TeacherRatingBadge, RatingStatsCard) run in parallel
- Phase 5: T037 and T038 (QueueStatus, JoinQueueButton) run in parallel
- Phase 8: T054 and T055 (barrel exports) run in parallel
- US1 and US3 can run fully in parallel after Phase 2

---

## Parallel Example: User Story 1

```bash
# After Phase 2 is complete, launch parallel component tasks:
Task T017: "Create StarRating component in src/features/ratings/components/StarRating.tsx"
Task T018: "Create FeedbackTags component in src/features/ratings/components/FeedbackTags.tsx"

# Then sequential: RatingPrompt (depends on T017+T018) → Integration → Notifications
```

## Parallel Example: US1 + US3

```bash
# After Phase 2, both stories can proceed simultaneously:
# Stream A (US1): T015 → T016 → T017+T018 → T019 → T020 → T021+T022
# Stream B (US3): T034 → T035 → T036 → T037+T038 → T039 → T040 → (wait for T022) → T041 → T042 → T043+T044
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 parallel tasks)
2. Complete Phase 2: Foundational (migration + services)
3. Complete Phase 3: User Story 1 (rating submission)
4. **STOP and VALIDATE**: Students can rate sessions end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Database and services ready
2. US1 (Ratings) → Test independently → Deploy (MVP!)
3. US2 (Stats Display) → Test independently → Deploy
4. US3 (Queue) → Test independently → Deploy
5. US4 (Fair Usage) → Test independently → Deploy
6. US5 (Supply-Side) → Test independently → Deploy
7. Polish → Final validation → Release

### Parallel Team Strategy

With 2 developers after Phase 2:
- Developer A: US1 → US2 (ratings track)
- Developer B: US3 → US4 → US5 (queue track)
- Both: Phase 8 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Migration tasks T006-T012 are sequential (same SQL file) but logically grouped
- All `as any` casts in services are required until database types are regenerated after migration deployment
- Realtime subscription tasks (T043, T056, T057) all modify src/features/realtime/config/subscription-profiles.ts — apply sequentially: T043 (US3) → T056 → T057 (Polish)
- Edge Function extensions (T021, T022, T032, T033, T041, T052) ALL modify supabase/functions/send-notification/index.ts — these MUST be applied sequentially across phases: T021→T022 (US1) → T032→T033 (US2) → T041 (US3) → T052 (US5). When running US1+US3 in parallel, the US3 send-notification task (T041) must wait for US1's T022 to complete first
- Commit after each completed phase or user story
