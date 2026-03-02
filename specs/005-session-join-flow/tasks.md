# Tasks: Session Join Flow

**Input**: Design documents from `/specs/005-session-join-flow/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Database migration and type generation — all stories depend on the updated session status constraint.

- [x] T001 Create migration `supabase/migrations/00006_session_join_flow.sql` — ALTER sessions status CHECK constraint to include 'expired' and 'in_progress', and create `expire_draft_sessions()` database function per data-model.md SQL
- [x] T002 Regenerate TypeScript types by running `npm run supabase:gen-types` after applying the migration with `npm run supabase:reset`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Service and hook enhancements that multiple user stories depend on. MUST complete before any user story phase.

- [x] T003 Add `getActiveDraftSession(studentId)` method to `src/features/sessions/services/sessions.service.ts` — query sessions joined with profiles and session_attendance where status='draft', ordered by created_at desc, limit 1, per contracts/supabase-queries.md §7
- [x] T004 [P] Enhance `useCreateDraftSession` hook in `src/features/sessions/hooks/useCreateDraftSession.ts` — after successful session creation, upsert `daily_session_count` to increment the student's daily count for that program, per contracts/supabase-queries.md §2 enhancement
- [x] T005 [P] Enhance `queueService.joinQueue()` in `src/features/queue/services/queue.service.ts` — before inserting a new queue entry, cancel any existing active entries for the student across ALL programs (update status to 'cancelled' where student_id matches and status IN ('waiting', 'notified')), per contracts/supabase-queries.md §4
- [x] T006 [P] Add i18n translation keys for session-join, queue, deep-link, and post-session screens to `src/i18n/locales/en.json` — keys for: available teachers screen title, "Join Session", "Session full", daily limit message, queue position "You are #N in line", estimated wait time, "Notify Me", "Leave Queue", "Claim & Join", countdown labels, deep link error states ("Teacher not available", "Link is no longer valid", "Session join is for students only"), post-session prompt ("How was your session?", "Rate this teacher"), connection error, Linking failure fallback
- [x] T007 [P] Add Arabic translations for all keys added in T006 to `src/i18n/locales/ar.json`

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Browse & Join Available Teacher (Priority: P1) MVP

**Goal**: A student navigates to a free program, sees available teachers with realtime updates, taps "Join Session," and the external meeting app opens.

**Independent Test**: Student opens a free program → sees 2+ teachers sorted by rating → taps "Join Session" → draft session created → Google Meet/Zoom opens with the correct meeting link. Daily limit blocks join when reached while queue has students.

### Implementation

- [x] T008 [US1] Enhance `JoinSessionFlow` bottom sheet in `src/features/sessions/components/JoinSessionFlow.tsx` — add pre-join checks: (1) fetch daily session count via `useDailySessionCount` hook and queue size via `useQueueSize`, block join with i18n daily-limit message if count >= program's `max_daily_free_sessions` setting (default 2) AND queue has waiting students; (2) check teacher's `current_session_count` < `max_concurrent_students` before creating session; (3) wrap `Linking.openURL()` in try/catch — on failure show alert with i18n "Unable to open meeting link" and copy-to-clipboard fallback using `Clipboard.setStringAsync()`; (4) pass teacher's `meeting_link` as `meetingLinkUsed` to `useCreateDraftSession` for FR-010 audit recording
- [x] T009 [US1] Create available-teachers screen at `app/(student)/program/available-teachers.tsx` — read `programId` from `useLocalSearchParams()`, fetch program details to verify `category === 'free'` (redirect back if not), compose: `AvailableTeachersList` (existing, sorted by highest `average_rating` first), wire `useTeacherAvailabilityRealtime(programId)` for realtime updates, `useQueueRealtime(programId)` for queue updates, `NoTeachersAvailable` component when list is empty (with queue integration from US2), and `JoinSessionFlow` bottom sheet triggered by `onJoinSession` callback from `AvailableTeacherCard`. Use `Screen` layout component with scroll disabled (FlashList handles scroll). All styles use logical CSS properties (marginStart/End, paddingStart/End) per NFR-002.
- [x] T010 [US1] Add navigation entry point to the available-teachers screen — update the free program detail screen (find existing screen under `app/(student)/programs/`) to include a "View Available Teachers" button or auto-navigate to `available-teachers` when program category is 'free'. Wire the `router.push()` call with the programId param.

**Checkpoint**: US1 complete — student can browse teachers and join sessions in free programs

---

## Phase 4: User Story 2 — Join Queue When No Teachers Available (Priority: P2)

**Goal**: When no teachers are available, students see queue status, can join the queue, and receive push + in-app notifications when a teacher becomes available with a 3-minute claim window.

**Independent Test**: Student opens free program with 0 available teachers → sees "All teachers in sessions" + "Notify Me" → joins queue → teacher goes online → student receives notification → taps → queue-claim screen with countdown → claims → JoinSessionFlow opens.

### Implementation

- [x] T011 [US2] Enhance `NoTeachersAvailable` component in `src/features/queue/components/NoTeachersAvailable.tsx` — integrate queue join: show "All teachers are currently in sessions" message, estimated wait time (calculate from average session duration / teacher count for program), queue position as "You are #N in line" using `useQueuePosition` hook, "Notify Me" button calling `useJoinQueue` mutation (hidden if student has active draft session — check via `useActiveDraftSession` hook from T003), and "Leave Queue" button for students already in queue calling `useLeaveQueue` mutation. Use i18n keys from T006.
- [x] T012 [US2] Create `QueueOfferBanner` component at `src/features/queue/components/QueueOfferBanner.tsx` — a prominent top-of-screen banner (animated slide-down via react-native-reanimated) displayed when a queue offer is active for the student. Shows teacher name, platform icon, countdown timer (mm:ss format, red text when < 60s), and "Claim & Join" button. Accepts props: `teacherName`, `platform`, `expiresAt`, `onClaim`, `onDismiss`. Timer uses `useEffect` with `setInterval` to count down from `expiresAt`; auto-dismisses when expired. Accessible label for screen reader on countdown. 44pt minimum touch target on button per NFR-001.
- [x] T013 [US2] Enhance `useNotificationHandler` in `src/features/notifications/hooks/useNotificationHandler.ts` — in the `onForegroundNotification` handler, detect when the incoming notification has `categoryId === 'queue_available'` (or similar), extract `queueEntryId` and `programId` from notification data, and surface a `QueueOfferBanner` by calling a new callback prop `onQueueOffer({ teacherName, platform, expiresAt, queueEntryId, programId })`. The parent component (root layout or student tab layout) renders `QueueOfferBanner` when this callback fires.
- [x] T014 [US2] Create queue-claim screen at `app/(student)/queue-claim.tsx` — read `queueEntryId` and `programId` from `useLocalSearchParams()`. Fetch queue entry details and teacher info. Show teacher card (name, avatar, rating, platform), countdown timer to claim expiry, and "Claim & Join" button. On claim: call `useClaimQueueSlot(queueEntryId)` mutation, on success navigate to JoinSessionFlow for that teacher. On expiry: show "This offer has expired" with "Rejoin Queue" button (calls `useJoinQueue`). Handle edge case: if server returns error on claim (entry already expired), show expired state with rejoin option. All i18n, logical CSS, 44pt touch targets.
- [x] T015 [US2] Enhance `queue-processor` edge function at `supabase/functions/queue-processor/index.ts` — after advancing the queue entry, check queue size for the program. If `queue_size >= program.settings.queue_notify_teachers_threshold` (default 5), find offline teachers for that program (teacher_availability.is_available = false), and invoke `send-notification` edge function with category `queue_threshold` and message "X students are waiting — please come online" per FR-011. Only trigger once when threshold is first crossed — track via a simple check: only send if previous queue size was below threshold (compare count of 'waiting' entries before and after the current queue advance).

**Checkpoint**: US2 complete — queue flow works end-to-end with push + in-app notifications

---

## Phase 5: User Story 3 — Join Session via Shared Deep Link (Priority: P3)

**Goal**: A student taps a `werecitetogether://session/join?teacher=X&program=Y` deep link and is taken directly to the join flow.

**Independent Test**: Student taps deep link → app opens → session-join screen loads teacher details → student taps "Join Session" → draft session created → meeting app opens. Test fallbacks: teacher unavailable, invalid IDs, unauthenticated user, non-student role.

### Implementation

- [x] T016 [US3] Create deep-link session-join screen at `app/(student)/session-join.tsx` — read `teacher` and `program` query params from `useLocalSearchParams()`. Fetch teacher availability details via `teacherAvailabilityService.getAvailableTeachers(programId)` filtered to the specific teacher. Screen states: (1) Loading: spinner while fetching; (2) Success: show teacher card + JoinSessionFlow bottom sheet auto-opened; (3) Teacher unavailable: "This teacher is no longer available" with "Browse Available Teachers" button navigating to `available-teachers` screen + "Join Queue" button; (4) Invalid IDs: "Link is no longer valid" with "Go to Programs" button; (5) Network error: "Connection error" with retry button per NFR-003. All i18n keys from T006.
- [x] T017 [US3] Handle auth guard and role check for deep link screen — verify the student auth layout already redirects unauthenticated users to login (Expo Router group layout under `(student)/` should handle this). Add role check at the top of `session-join.tsx`: if user role is not 'student', redirect to their role-appropriate home screen (`/(teacher)/`, `/(supervisor)/`, etc.) with a toast message "Session join is for students only" per FR-008. Handle the post-login redirect scenario: Expo Router should preserve the deep link URL and navigate back to it after successful auth.
- [x] T018 [US3] Handle deep link for active session edge case in `app/(student)/session-join.tsx` — after auth/role checks, query for active draft session via `getActiveDraftSession()`. If student has one, show "You already have an active session" alert with two options: "View Current Session" (navigate to post-session or session detail) or "Continue to New Session" (proceed with join flow if daily limit allows).

**Checkpoint**: US3 complete — deep links resolve to the correct join flow with all fallback states

---

## Phase 6: User Story 4 — Post-Session Return & Logging (Priority: P4)

**Goal**: After a session, the student returns to the app and sees a post-session prompt to confirm and rate the teacher. Draft sessions auto-expire after 4 hours.

**Independent Test**: Student joins session (US1) → opens Google Meet → returns to app after 5+ minutes → sees post-session card with teacher name and "Rate this session" → dismisses or rates → prompt disappears. Draft sessions left unconfirmed expire after 4 hours.

### Implementation

- [x] T019 [P] [US4] Create `useActiveDraftSession` hook at `src/features/sessions/hooks/useActiveDraftSession.ts` — uses `useQuery` with key `['active-draft-session', studentId]` to call `sessionsService.getActiveDraftSession(studentId)` from T003. staleTime: 30s. Returns `{ data: SessionWithDetails | null, isLoading, refetch }`. This hook is used by the post-session detection and by the available-teachers screen to hide the queue join button.
- [x] T020 [P] [US4] Create `usePostSessionDetection` hook at `src/features/sessions/hooks/usePostSessionDetection.ts` — listens to React Native `AppState` changes. When state transitions to 'active', check `useActiveDraftSession` result. If a draft session exists and was created more than 5 minutes ago (`Date.now() - new Date(session.created_at).getTime() > 5 * 60 * 1000`), set a local state flag `showPrompt: true`. Expose: `{ showPrompt, activeSession, dismissPrompt }`. `dismissPrompt` sets `showPrompt` to false but does NOT clear the session — prompt will re-appear next time app comes to foreground (persists until session status changes from draft).
- [x] T021 [US4] Create `PostSessionPrompt` component at `src/features/sessions/components/PostSessionPrompt.tsx` — a card component (not bottom sheet) rendered at the top of the student's main screen. Shows: teacher name, avatar, meeting platform icon, session duration estimate (time since `created_at`), "How was your session?" prompt, star rating input (1-5), optional comment TextInput, "Submit Rating" button (calls `reviewsService.submitReview()` or creates review via direct Supabase insert), and "Dismiss" button. On successful rating submission, the session can optionally transition to a different state (or remain draft until teacher logs). Use i18n keys from T006. Accessible labels per NFR-001. Logical CSS per NFR-002.
- [x] T022 [US4] Integrate post-session detection into student tab layout — in the student's tab layout file (find under `app/(student)/(tabs)/_layout.tsx` or similar), use `usePostSessionDetection` hook. When `showPrompt` is true, render `PostSessionPrompt` as an overlay or at the top of the screen. Pass `dismissPrompt` callback and `activeSession` data. Ensure the prompt renders above tab content but below any modal/bottom sheet.
- [x] T023 [US4] Create `expire-draft-sessions` edge function at `supabase/functions/expire-draft-sessions/index.ts` — Deno edge function that calls the `expire_draft_sessions()` database function created in T001. Uses Supabase service role client. Logs the number of expired sessions. Returns JSON response with `{ expired_count }`. Include error handling: if the database function fails, log the error and return 500. This function is designed to be called on a schedule (every 15 minutes) via external cron or Supabase cron.

**Checkpoint**: US4 complete — post-session return detection and rating prompt work, draft sessions auto-expire

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, RTL, edge case hardening, and final validation.

- [x] T024 [P] Verify all new screens use logical CSS properties (no physical left/right/marginLeft/marginRight) — audit `app/(student)/programs/[programId]/available-teachers.tsx`, `app/(student)/queue-claim.tsx`, `app/(student)/session-join.tsx`, and all new components (`PostSessionPrompt.tsx`, `QueueOfferBanner.tsx`) per NFR-002
- [x] T025 [P] Verify all interactive elements have accessible labels and minimum 44pt touch targets — audit join buttons, queue action buttons, claim button, dismiss button, star rating inputs, countdown timer per NFR-001
- [x] T026 [P] Verify all i18n keys are used correctly in components and no hardcoded strings remain — check all files created/modified in T006-T023 reference translation keys via `useTranslation()` hook
- [x] T027 Run `npx tsc --noEmit` and fix any TypeScript errors in files created or modified by this feature
- [x] T028 Run the existing test suite (`npm test`) and fix any regressions caused by service/hook enhancements in T003-T005

**Checkpoint**: Feature complete — all user stories working, accessible, RTL-ready, type-safe

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001-T002) — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Phase 2 completion
  - US1 (Phase 3): Can start after Phase 2 — no dependencies on other stories
  - US2 (Phase 4): Can start after Phase 2 — uses components from US1 screen but independently testable
  - US3 (Phase 5): Can start after Phase 2 — reuses JoinSessionFlow from US1 but independently testable
  - US4 (Phase 6): Can start after Phase 2 — T019 `useActiveDraftSession` also used by US2 (T011) but can be built first
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Foundation only → MVP deliverable
- **US2 (P2)**: Foundation + shares screen with US1 (available-teachers screen shows queue when no teachers) but queue components are independently testable
- **US3 (P3)**: Foundation + reuses JoinSessionFlow (enhanced in US1) → build after US1
- **US4 (P4)**: Foundation + `useActiveDraftSession` hook (T019) is also used by US2 (T011) → build T019 early or in Phase 2

### Within Each User Story

- Services before hooks before components before screens
- Core implementation before edge case handling
- All tasks within a story phase should complete before moving to next story

### Parallel Opportunities

- T004, T005, T006, T007 can all run in parallel (Phase 2 — different files)
- T019, T020 can run in parallel (Phase 6 — different hook files)
- T024, T025, T026 can run in parallel (Phase 7 — audit tasks on different files)
- US1 and US4 (T019-T020 specifically) could start in parallel after Phase 2

---

## Parallel Example: Phase 2

```bash
# Launch all foundational enhancements together:
Task T004: "Enhance useCreateDraftSession in src/features/sessions/hooks/useCreateDraftSession.ts"
Task T005: "Enhance queueService.joinQueue in src/features/queue/services/queue.service.ts"
Task T006: "Add EN i18n keys in src/i18n/locales/en.json"
Task T007: "Add AR i18n keys in src/i18n/locales/ar.json"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T007)
3. Complete Phase 3: User Story 1 (T008-T010)
4. **STOP and VALIDATE**: Student can browse available teachers and join sessions
5. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test: browse & join → **MVP!**
3. Add US2 → Test: queue + notifications → Deploy
4. Add US3 → Test: deep links → Deploy
5. Add US4 → Test: post-session + expiry → Deploy
6. Polish → Final validation → Release

---

## Notes

- ~80% of infrastructure already exists — tasks focus on screen composition, service enhancements, and new behaviors
- No new database tables needed — only 1 migration for CHECK constraint + expiry function
- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All new screens under `app/(student)/` — student-role only
- All styles must use logical CSS (marginStart/End, not marginLeft/Right) per Constitution Principle V
- All strings via i18next (EN + AR) per Constitution Principle VI
- Commit after each task or logical group following conventional commits format
