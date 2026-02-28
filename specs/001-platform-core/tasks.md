# Tasks: WeReciteTogether Core Platform

**Input**: Design documents from `/specs/001-platform-core/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/services.md, research.md

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks grouped by user story (8 stories, P1–P8) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Mobile app**: Single Expo project at repo root
- **Source**: `src/` with colocated features under `src/features/`
- **Routes**: `app/` with role-based route groups
- **Backend**: `supabase/` (migrations, functions, storage)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Remove Quran School artifacts, rebrand to WeReciteTogether, install new dependencies

- [ ] T001 Remove Quran School feature directories: `src/features/schools/`, `src/features/work-attendance/`, `src/features/children/`, `src/features/parents/`, `src/features/classes/`, `src/features/gamification/`
- [ ] T002 Remove Quran School route groups: `app/(parent)/`, `app/(admin)/`
- [ ] T003 [P] Update `app.json` — change app name to "نتلو معاً" / "WeReciteTogether", bundle ID to `com.werecitetogether.app`, add Expo plugins for `@react-native-google-signin/google-signin` and `expo-apple-authentication`, remove `expo-location` plugin and WiFi entitlement
- [ ] T004 [P] Install new dependencies: `expo-av`, `expo-apple-authentication`, `@react-native-google-signin/google-signin`, `@tanstack/query-async-storage-persister`, `@tanstack/react-query-persist-client`
- [ ] T005 [P] Update theme/brand colors for WeReciteTogether in `src/theme/`
- [ ] T006 [P] Create `.env.example` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` placeholders

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth rewrite, type generation, and core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Types

- [ ] T007 Write consolidated schema migration `supabase/migrations/00001_consolidated_schema.sql` — all 19 tables (profiles, programs, program_tracks, program_roles, cohorts, enrollments, teacher_availability, sessions, session_attendance, session_voice_memos, teacher_reviews, teacher_rating_stats, free_program_queue, daily_session_count, program_waitlist, session_schedules, notification_preferences, push_tokens, platform_config) with all constraints, indexes, RLS helper functions (`get_user_role()`, `get_user_programs()`, `is_master_admin()`), RLS policies, triggers (`updated_at` auto-update, profile creation on `auth.users` insert, rating stats recalculation on `teacher_reviews` change), and `session_voice_memos.expires_at` default
- [ ] T008 Write seed migration `supabase/migrations/00002_seed_programs.sql` — 8 programs and their tracks from PRD Appendix A with bilingual names, categories, and default settings JSONB
- [ ] T009 Write storage migration `supabase/migrations/00003_storage_buckets.sql` — create `voice-memos` private bucket with 2MB max file size and RLS policies
- [ ] T010 Regenerate TypeScript types by running `supabase gen types typescript --linked` and writing output to `src/types/database.types.ts`

### Auth & Core Infrastructure

- [ ] T011 Rewrite `src/features/auth/services/auth.service.ts` — replace email/password with OAuth-only: `signInWithGoogle(idToken)`, `signInWithApple(identityToken)`, `signOut()`, `getCurrentSession()`, `onAuthStateChange()` per contracts/services.md
- [ ] T012 [P] Rewrite `src/stores/authStore.ts` — remove `schoolSlug`, `schoolId`, synthetic email fields; add `onboardingCompleted`, `activePrograms`, role-based state; use Zustand 5 patterns
- [ ] T013 [P] Update `src/lib/supabase.ts` — ensure Supabase client uses regenerated types from `src/types/database.types.ts`
- [ ] T014 [P] Update `src/lib/constants.ts` — define 5 roles (`student`, `teacher`, `supervisor`, `program_admin`, `master_admin`), program categories (`free`, `structured`, `mixed`), session statuses, enrollment statuses, cohort statuses, queue statuses, waitlist statuses per data-model.md
- [ ] T015 [P] Create `src/hooks/useRole.ts` — hook returning current user's global role and program-scoped roles, using `program_roles` table; export `useIsTeacher()`, `useIsSupervisor()`, `useIsProgramAdmin()`, `useIsMasterAdmin()`
- [ ] T016 Rewrite `app/_layout.tsx` — update root layout with: Supabase auth state listener, role-based redirect logic (check `onboarding_completed` → onboarding or role-based home), TanStack Query provider with persistence via `PersistQueryClientProvider` + `AsyncStoragePersister`
- [ ] T017 Rewrite `app/index.tsx` — role-based entry redirect: if not authenticated → `(auth)/login`, if `!onboarding_completed` → `(auth)/onboarding`, else redirect to role-specific tab group (`(student)`, `(teacher)`, `(supervisor)`, `(program-admin)`, `(master-admin)`)

### i18n Foundation

- [ ] T018 [P] Add new i18n keys to `src/i18n/locales/en.json` and `src/i18n/locales/ar.json` for all new features: auth (OAuth labels), onboarding, programs, enrollment, teacher-availability, sessions (draft state), voice-memos, teacher-ratings, queue, cohorts, supervisor, profile (demographics, meeting link), notifications (new categories), dashboards (5 roles)

**Checkpoint**: Foundation ready — database deployed, auth works with OAuth, types regenerated, role routing active. User story implementation can now begin.

---

## Phase 3: User Story 1 — Student Registration & Program Discovery (Priority: P1) 🎯 MVP

**Goal**: A new user signs in via Google/Apple, completes demographic onboarding, and browses all 8 programs with tracks

**Independent Test**: A new user can sign in via OAuth, complete onboarding (name, gender, age range, country), see 8 programs on the Programs tab, tap into a program, and distinguish free from structured tracks

### Implementation for User Story 1

- [ ] T019 [P] [US1] Create `src/features/onboarding/services/onboarding.service.ts` — `completeOnboarding(data: OnboardingData): Promise<ServiceResult<Profile>>` per contracts/services.md; updates `profiles` row with `full_name`, `gender`, `age_range`, `country`, `region`, sets `onboarding_completed = true`
- [ ] T020 [P] [US1] Create `src/features/onboarding/types/index.ts` — `OnboardingData` type (`fullName`, `gender`, `ageRange`, `country`, `region?`), zod schema for validation
- [ ] T021 [P] [US1] Create `src/features/programs/services/programs.service.ts` — `getPrograms()`, `getProgramById(id)`, `getProgramTracks(programId)` per contracts/services.md
- [ ] T022 [P] [US1] Create `src/features/programs/types/index.ts` — `Program`, `ProgramWithTracks`, `ProgramTrack` types derived from `database.types.ts`
- [ ] T023 [P] [US1] Create `src/features/programs/hooks/usePrograms.ts` — TanStack Query hooks: `usePrograms()`, `useProgramById(id)`, `useProgramTracks(programId)` with appropriate `staleTime` and `gcTime` for offline persistence
- [ ] T024 [P] [US1] Create `src/features/onboarding/hooks/useOnboarding.ts` — TanStack Query mutation hook `useCompleteOnboarding()` that calls service, invalidates profile cache, and navigates to student home on success
- [ ] T025 [US1] Rewrite `app/(auth)/login.tsx` — OAuth sign-in screen with "Sign in with Google" and "Sign in with Apple" buttons; Google uses `@react-native-google-signin/google-signin` to get `idToken` → `auth.service.signInWithGoogle(idToken)`; Apple uses `expo-apple-authentication` to get `identityToken` → `auth.service.signInWithApple(identityToken)`; on success, root layout handles redirect
- [ ] T026 [US1] Create `app/(auth)/onboarding.tsx` — onboarding form using `react-hook-form` + zod: display name (TextInput, required), gender (radio: male/female), age range (picker: under_13 through 50_plus), country (searchable picker, ISO 3166-1), region (TextInput, optional); submit calls `useCompleteOnboarding()`; show loading state during submission
- [ ] T027 [US1] Create `app/(student)/_layout.tsx` — student route group layout with auth guard (must be authenticated + onboarding completed + role student)
- [ ] T028 [US1] Create `app/(student)/(tabs)/_layout.tsx` — 5-tab bottom navigation: Home, Programs, Progress, Certificates, Profile with i18n labels and icons
- [ ] T029 [US1] Create `app/(student)/(tabs)/programs.tsx` — program browser screen: FlashList of all active programs, each card showing `name`/`name_ar` (based on locale), category badge (free/structured/mixed), short description; tap navigates to program detail
- [ ] T030 [US1] Create `src/features/programs/components/ProgramCard.tsx` — reusable program card component with bilingual name, category badge, description preview; used in program browser and dashboards
- [ ] T031 [US1] Create `src/features/programs/components/ProgramDetailScreen.tsx` — program detail: full description, track list (with `track_type` indicator for mixed programs), CTA button ("Browse Available Teachers" for free, "Enroll" for structured, or both for mixed per track)
- [ ] T032 [US1] Create `app/(student)/(tabs)/index.tsx` — student home/dashboard stub showing welcome message with user's display name, quick links to programs, and recent activity placeholder
- [ ] T033 [P] [US1] Create `app/(student)/(tabs)/progress.tsx` — cross-program progress stub screen (placeholder for future implementation)
- [ ] T034 [P] [US1] Create `app/(student)/(tabs)/certificates.tsx` — certificates stub screen (placeholder for future implementation)
- [ ] T035 [US1] Adapt `app/(student)/(tabs)/profile.tsx` — update profile screen to show and edit: display name, gender, age range, country, region; add meeting link field (visible for teachers); use `profile.service.updateProfile()`
- [ ] T036 [US1] Create `src/features/profile/services/profile.service.ts` — `getProfile(id)`, `updateProfile(id, data)`, `searchProfiles(query, role?)` per contracts/services.md

**Checkpoint**: User Story 1 complete — OAuth sign-in → onboarding → program browsing fully functional

---

## Phase 4: User Story 2 — Teacher Availability & Drop-In Session (Priority: P2)

**Goal**: Teacher toggles "Available", appears in real-time student list, student taps "Join Session" and is redirected to external meeting link

**Independent Test**: A teacher goes available in a free program, a student sees them in "Available Now" list within 2 seconds, taps "Join Session", a draft session is created, and the meeting link opens

### Implementation for User Story 2

- [ ] T037 [P] [US2] Create `src/features/teacher-availability/services/teacher-availability.service.ts` — `toggleAvailability()`, `getAvailableTeachers(programId)`, `updateMaxConcurrent()` per contracts/services.md
- [ ] T038 [P] [US2] Create `src/features/teacher-availability/types/index.ts` — `TeacherAvailability`, `AvailableTeacher` types (includes profile fields, rating stats)
- [ ] T039 [P] [US2] Create `src/features/teacher-availability/hooks/useTeacherAvailability.ts` — TanStack Query hooks: `useAvailableTeachers(programId)`, `useToggleAvailability()` mutation; `useAvailableTeachers` invalidated by realtime subscription
- [ ] T040 [P] [US2] Adapt `src/features/sessions/services/sessions.service.ts` — add `createDraftSession(data)` per contracts/services.md; draft creates session with `status = 'draft'`, increments `teacher_availability.current_session_count`
- [ ] T041 [P] [US2] Create `src/features/sessions/types/index.ts` — `Session`, `SessionWithDetails`, `SessionStatus`, `CompleteSessionInput`, `AttendanceEntry` types
- [ ] T042 [US2] Create `src/features/teacher-availability/components/AvailableTeacherCard.tsx` — teacher card showing: name, average rating (stars + count, only if 5+ reviews), languages, meeting platform icon, concurrent student indicator; "Join Session" button (disabled if at max capacity, shows "In Session")
- [ ] T043 [US2] Create `src/features/teacher-availability/components/AvailableTeachersList.tsx` — FlashList of `AvailableTeacherCard` items, empty state ("All teachers are currently in sessions"), uses `useAvailableTeachers(programId)`
- [ ] T044 [US2] Update realtime subscriptions in `src/features/realtime/` — add `teacher_availability` table subscription filtered by `program_id` (INSERT/UPDATE/DELETE events); on change, invalidate `['teacher-availability', programId]` TanStack Query cache
- [ ] T045 [US2] Create `src/features/sessions/hooks/useCreateDraftSession.ts` — TanStack Query mutation that calls `createDraftSession()`, invalidates teacher availability cache, and returns the meeting link for deep-linking
- [ ] T046 [US2] Create `src/features/sessions/components/JoinSessionFlow.tsx` — bottom sheet or modal triggered by "Join Session": shows teacher meeting link, "Open in [platform]" button using `Linking.openURL()`, confirmation that draft session was created
- [ ] T047 [US2] Create `app/(teacher)/_layout.tsx` — teacher route group layout with auth guard (must be authenticated + role teacher)
- [ ] T048 [US2] Create `app/(teacher)/(tabs)/_layout.tsx` — 5-tab bottom navigation: Home, Students, Sessions, Circles, Profile
- [ ] T049 [US2] Create `app/(teacher)/(tabs)/index.tsx` — teacher dashboard with: availability toggle (prominent, top of screen), current active draft sessions list, today's completed session count, program selector (if teacher is in multiple programs)
- [ ] T050 [US2] Add realtime subscription for `sessions` table in `src/features/realtime/` — filter by `teacher_id` or `student_id` for INSERT/UPDATE events; invalidate `['sessions']` cache

**Checkpoint**: User Story 2 complete — teacher availability toggle → real-time student list → join session with external meeting link

---

## Phase 5: User Story 3 — Program Administration & Role Management (Priority: P3)

**Goal**: Master Admin creates programs, defines tracks, assigns Program Admins; Program Admins assign teachers and supervisors within their program

**Independent Test**: Master Admin creates a program with tracks, assigns a Program Admin, and the Program Admin assigns teachers — all verifiable through admin screens

### Implementation for User Story 3

- [ ] T051 [P] [US3] Create `src/features/programs/services/programs.service.ts` additions — `createProgram(data)`, `updateProgram(id, data)`, `createTrack(programId, data)`, `updateTrack(id, data)` per contracts/services.md (admin write operations)
- [ ] T052 [P] [US3] Create `src/features/programs/services/program-roles.service.ts` — `assignRole()`, `removeRole()`, `getRolesForProgram(programId)`, `getUserPrograms(profileId)` per contracts/services.md
- [ ] T053 [P] [US3] Create `src/features/programs/hooks/useProgramAdmin.ts` — TanStack Query mutations: `useCreateProgram()`, `useUpdateProgram()`, `useCreateTrack()`, `useUpdateTrack()`; query: `useRolesForProgram(programId)`
- [ ] T054 [P] [US3] Create `src/features/programs/hooks/useRoleManagement.ts` — mutations: `useAssignRole()`, `useRemoveRole()`; queries: `useUserPrograms(profileId)`, `useSearchProfiles(query, role)`
- [ ] T055 [US3] Create `app/(master-admin)/_layout.tsx` — master admin route group layout with auth guard (must be `master_admin` role)
- [ ] T056 [US3] Create `app/(master-admin)/index.tsx` — cross-program dashboard: total programs, total users by role, quick links to program management and user management
- [ ] T057 [US3] Create `app/(master-admin)/programs/index.tsx` — program list with "Create Program" FAB; each row shows program name, category, active status, teacher count
- [ ] T058 [US3] Create `app/(master-admin)/programs/[id].tsx` — program detail/edit screen: name (AR/EN), description, category picker, settings JSONB editor (max students per teacher, daily limits, thresholds), track management (add/edit/reorder tracks)
- [ ] T059 [US3] Create `app/(master-admin)/users/index.tsx` — user management: searchable list of all profiles, filterable by role; tap to view/edit role assignments
- [ ] T060 [US3] Create `app/(master-admin)/users/[id].tsx` — user detail: profile info, role assignments per program, "Assign to Program" action (select program + role)
- [ ] T061 [US3] Create `app/(program-admin)/_layout.tsx` — program admin route group layout with auth guard (must have `program_admin` role for at least one program)
- [ ] T062 [US3] Create `app/(program-admin)/(tabs)/_layout.tsx` — 5-tab bottom navigation: Home, Cohorts, Team, Reports, Settings
- [ ] T063 [US3] Create `app/(program-admin)/(tabs)/index.tsx` — program admin dashboard: program overview, active cohorts count, enrolled students, teacher count
- [ ] T064 [US3] Create `app/(program-admin)/(tabs)/team.tsx` — team management: list of teachers and supervisors assigned to this program; "Assign Teacher" and "Assign Supervisor" actions; each row shows name, role, active student count, average rating
- [ ] T065 [US3] Create `app/(program-admin)/(tabs)/settings.tsx` — program settings screen: edit settings JSONB (max students, session limits, rating thresholds, enrollment auto-approve toggle)

**Checkpoint**: User Story 3 complete — Master Admin manages programs/tracks/roles, Program Admin manages team within program

---

## Phase 6: User Story 4 — Structured Program Enrollment & Cohort Management (Priority: P4)

**Goal**: Program Admin creates cohorts, opens enrollment; students enroll or join waitlist; enrollment lifecycle managed

**Independent Test**: Program Admin creates a cohort with schedule and teacher, opens enrollment, a student enrolls, and appears in the cohort roster

### Implementation for User Story 4

- [ ] T066 [P] [US4] Create `src/features/cohorts/services/cohorts.service.ts` — `createCohort()`, `updateCohort()`, `updateCohortStatus()`, `getCohortsByProgram()`, `getCohortById()` per contracts/services.md
- [ ] T067 [P] [US4] Create `src/features/enrollment/services/enrollment.service.ts` — `enroll()`, `approveEnrollment()`, `dropEnrollment()`, `getEnrollmentsByStudent()`, `getEnrollmentsByCohort()`, `getEnrollmentsByProgram()` per contracts/services.md
- [ ] T068 [P] [US4] Create `src/features/enrollment/services/waitlist.service.ts` — `joinWaitlist()`, `leaveWaitlist()`, `confirmWaitlistOffer()`, `getWaitlistPosition()`, `getWaitlistByProgram()` per contracts/services.md
- [ ] T069 [P] [US4] Create `src/features/cohorts/types/index.ts` — `Cohort`, `CohortWithDetails`, `CohortStatus`, `CreateCohortInput`, `UpdateCohortInput` types
- [ ] T070 [P] [US4] Create `src/features/enrollment/types/index.ts` — `Enrollment`, `EnrollmentWithDetails`, `EnrollmentWithProfile`, `EnrollmentStatus`, `WaitlistEntry` types
- [ ] T071 [P] [US4] Create `src/features/cohorts/hooks/useCohorts.ts` — TanStack Query hooks: `useCohortsByProgram()`, `useCohortById()`, `useCreateCohort()`, `useUpdateCohortStatus()` mutations
- [ ] T072 [P] [US4] Create `src/features/enrollment/hooks/useEnrollment.ts` — hooks: `useEnrollmentsByStudent()`, `useEnrollmentsByCohort()`, `useEnroll()`, `useApproveEnrollment()`, `useDropEnrollment()` mutations
- [ ] T073 [P] [US4] Create `src/features/enrollment/hooks/useWaitlist.ts` — hooks: `useWaitlistPosition()`, `useJoinWaitlist()`, `useLeaveWaitlist()`, `useConfirmWaitlistOffer()` mutations
- [ ] T074 [US4] Create `app/(program-admin)/(tabs)/cohorts.tsx` — cohort management: list of cohorts by program with status badges, "Create Cohort" FAB, enrollment count vs max_students indicator
- [ ] T075 [US4] Create `src/features/cohorts/components/CohortForm.tsx` — bottom sheet form for creating/editing cohort: name, track picker, max students, teacher picker, supervisor picker, schedule (recurring days/times), meeting link, start/end dates
- [ ] T076 [US4] Create `src/features/cohorts/components/CohortDetail.tsx` — cohort detail screen: roster (enrolled students), waitlist count, cohort status lifecycle buttons (open → close → start → complete → archive), schedule display
- [ ] T077 [US4] Create `src/features/enrollment/components/EnrollmentFlow.tsx` — student-facing enrollment: bottom sheet showing cohort details, capacity ("12/25 enrolled"), "Enroll" button (or "Join Waitlist" if full); pending state shown while awaiting approval
- [ ] T078 [US4] Create `src/features/enrollment/components/PendingEnrollments.tsx` — program admin view: list of pending enrollment requests per cohort with "Approve" / "Reject" actions
- [ ] T079 [US4] Add realtime subscription for `enrollments` table in `src/features/realtime/` — filter by `student_id` for UPDATE events; invalidate enrollment cache on status changes
- [ ] T080 [US4] Adapt `src/features/notifications/` — add notification dispatch for enrollment approval, waitlist offers (24-hour window), and enrollment status changes via `send-notification` Edge Function

**Checkpoint**: User Story 4 complete — cohort creation → student enrollment → waitlist → approval lifecycle

---

## Phase 7: User Story 5 — Session Logging & Post-Session Workflow (Priority: P5)

**Goal**: Teacher completes a draft session with scores, notes, and optional voice memo; student views session history with playback

**Independent Test**: Teacher logs a session with scores and notes, records a voice memo, and the student sees the completed session with audio playback in their history

### Implementation for User Story 5

- [ ] T081 [P] [US5] Add completion methods to `src/features/sessions/services/sessions.service.ts` — `completeSession(sessionId, data)`, `cancelSession(sessionId)`, `getSessionById(id)`, `getSessionsByStudent()`, `getSessionsByTeacher()`, `logAttendance(sessionId, entries)` per contracts/services.md
- [ ] T082 [P] [US5] Create `src/features/voice-memos/services/voice-memos.service.ts` — `uploadVoiceMemo()`, `getVoiceMemoForSession()`, `getVoiceMemoUrl()` per contracts/services.md
- [ ] T083 [P] [US5] Create `src/features/voice-memos/types/index.ts` — `VoiceMemo` type with `storagePath`, `durationSeconds`, `fileSizeBytes`, `expiresAt`
- [ ] T084 [P] [US5] Create `src/features/sessions/hooks/useSessions.ts` — hooks: `useSessionsByStudent()`, `useSessionsByTeacher()`, `useSessionById()`, `useCompleteSession()`, `useCancelSession()`, `useLogAttendance()` mutations
- [ ] T085 [P] [US5] Create `src/features/voice-memos/hooks/useVoiceMemos.ts` — hooks: `useUploadVoiceMemo()` mutation, `useVoiceMemoForSession(sessionId, studentId)`, `useVoiceMemoUrl(storagePath)`
- [ ] T086 [US5] Create `src/features/voice-memos/hooks/useAudioRecorder.ts` — hook wrapping `expo-av` Audio.Recording: `startRecording()`, `stopRecording()`, `getRecordingUri()`, `getDuration()`; AAC format at 32kbps, max 120 seconds with countdown
- [ ] T087 [US5] Create `src/features/voice-memos/hooks/useAudioPlayer.ts` — hook wrapping `expo-av` Audio.Sound: `play()`, `pause()`, `seek(position)`, `setRate(speed)` (1x, 1.25x, 1.5x), `positionMillis`, `durationMillis`, `isPlaying`
- [ ] T088 [US5] Create `src/features/sessions/components/SessionCompletionForm.tsx` — session logging screen: student attendance list (multi-select checkboxes), per-student score (0-5 slider/stepper), text notes (TextInput), duration (auto-calculated or manual), "Record Voice Memo" button; submit calls `useCompleteSession()` + `useLogAttendance()`
- [ ] T089 [US5] Create `src/features/voice-memos/components/VoiceMemoRecorder.tsx` — recording UI: hold-to-record button with countdown timer (120s max), waveform visualization, preview playback, "Send" or "Re-record" actions; upload on send via `useUploadVoiceMemo()`; presented per-student in SessionCompletionForm (one memo per attending student)
- [ ] T090 [US5] Create `src/features/voice-memos/components/VoiceMemoPlayer.tsx` — playback UI: play/pause button, seek bar, duration display, speed control chips (1x, 1.25x, 1.5x); "Voice memo expired" state when past `expires_at`
- [ ] T091 [US5] Create `src/features/sessions/components/SessionHistoryList.tsx` — FlashList of completed sessions: date, teacher name, score, notes preview, voice memo indicator icon; tapping opens session detail
- [ ] T092 [US5] Create `src/features/sessions/components/SessionDetail.tsx` — session detail screen: full notes, per-student scores (teacher view) or personal score (student view), `VoiceMemoPlayer` (if memo exists)
- [ ] T093 [US5] Create `app/(teacher)/(tabs)/sessions.tsx` — teacher sessions tab: pending draft sessions at top, completed sessions below (using `useSessionsByTeacher()`), tap draft → `SessionCompletionForm`
- [ ] T094 [US5] Update `app/(student)/(tabs)/index.tsx` — add recent sessions section to student dashboard using `SessionHistoryList`
- [ ] T095 [US5] Create `supabase/functions/cleanup-voice-memos/index.ts` — Edge Function cron job: query `session_voice_memos` where `expires_at < now()`, delete from Storage, delete DB rows
- [ ] T096 [US5] Adapt `src/features/notifications/` — add push notification for "Your teacher left you a voice memo" when voice memo is uploaded, and "Session completed" when teacher logs outcome

**Checkpoint**: User Story 5 complete — session logging → voice memos → session history with playback

---

## Phase 8: User Story 6 — Teacher Rating & Quality Feedback (Priority: P6)

**Goal**: Students rate teachers (1-5 stars + tags), teacher sees aggregate stats anonymously, supervisors see individual reviews

**Independent Test**: Student rates a session, teacher sees updated aggregate stats without student identity, and the rating shows on the teacher's public card after 5 reviews

### Implementation for User Story 6

- [ ] T097 [P] [US6] Create `src/features/teacher-ratings/services/teacher-ratings.service.ts` — `submitReview()`, `getReviewsForTeacher()`, `getRatingStats()`, `excludeReview()`, `canStudentReview()` per contracts/services.md
- [ ] T098 [P] [US6] Create `src/features/teacher-ratings/types/index.ts` — `TeacherReview`, `TeacherRatingStats`, rating tag constants (positive: "Patient", "Clear explanation", "Encouraging", "Excellent tajweed", "Well-prepared"; constructive: "Session felt rushed", "Hard to understand", "Frequently late", "Disorganized")
- [ ] T099 [P] [US6] Create `src/features/teacher-ratings/hooks/useTeacherRatings.ts` — hooks: `useSubmitReview()` mutation, `useRatingStats(teacherId, programId)`, `useCanStudentReview(studentId, sessionId)`, `useReviewsForTeacher(teacherId, programId)`
- [ ] T100 [US6] Create `src/features/teacher-ratings/components/RatingPrompt.tsx` — bottom sheet after session completion: 1-5 star selector (required), tag chips (multi-select from positive + constructive lists), optional comment (TextInput, max 500 chars); disabled after 48 hours; submit calls `useSubmitReview()`
- [ ] T101 [US6] Create `src/features/teacher-ratings/components/RatingStatsDisplay.tsx` — teacher-facing stats view: average rating (large number + stars), total review count, rating trend indicator (improving/declining based on last 10 vs overall), most common positive tags (top 3), most common constructive tags (top 3); NO individual student names
- [ ] T102 [US6] Create `src/components/RatingBadge.tsx` — compact rating display for teacher cards: "4.7 ★ (43)" or "New Teacher" if < 5 reviews; placed in shared components layer per Constitution IV since it is used across teacher-availability and teacher-ratings features
- [ ] T103 [US6] Update `src/features/teacher-availability/components/AvailableTeacherCard.tsx` — integrate `RatingBadge` from `src/components/RatingBadge.tsx`, showing rating only when `total_reviews >= 5`
- [ ] T104 [US6] Update `app/(teacher)/(tabs)/index.tsx` — add `RatingStatsDisplay` section to teacher dashboard showing per-program aggregate stats
- [ ] T105 [US6] Adapt `src/features/notifications/` — add push notification for rating prompt ("How was your session? Tap to rate") sent to student after teacher completes session, with 48-hour expiry

**Checkpoint**: User Story 6 complete — rating submission → anonymous aggregation → public display after threshold

---

## Phase 9: User Story 7 — Free Program Queue & Fair Usage (Priority: P7)

**Goal**: Students join queue when no teachers available, get notified with 3-min claim window when teacher comes online, daily session limits enforced

**Independent Test**: Student joins queue, teacher goes available, student gets notification and claims slot within 3 minutes; daily limit enforced after 2 sessions

### Implementation for User Story 7

- [ ] T106 [P] [US7] Create `src/features/queue/services/queue.service.ts` — `joinQueue()`, `leaveQueue()`, `getQueuePosition()`, `getQueueSize()`, `claimQueueSlot()`, `getDailySessionCount()` per contracts/services.md
- [ ] T107 [P] [US7] Create `src/features/queue/types/index.ts` — `QueueEntry`, `QueueStatus` types
- [ ] T108 [P] [US7] Create `src/features/queue/hooks/useQueue.ts` — hooks: `useJoinQueue()`, `useLeaveQueue()`, `useQueuePosition(studentId, programId)`, `useQueueSize(programId)`, `useClaimQueueSlot()`, `useDailySessionCount(studentId, programId)` with realtime invalidation
- [ ] T109 [US7] Create `supabase/functions/queue-processor/index.ts` — Edge Function triggered when teacher becomes available: find first `waiting` queue entry for program, update to `notified`, send push notification with 3-min claim link; on expiry, cascade to next entry
- [ ] T110 [US7] Create `src/features/queue/components/QueueStatus.tsx` — student-facing component: shows "You are #3 in line", estimated wait time, "Leave Queue" button; updated via realtime subscription on `free_program_queue`
- [ ] T111 [US7] Create `src/features/queue/components/NoTeachersAvailable.tsx` — empty state for Available Teachers list: "All teachers are currently in sessions", queue size info, "Notify Me" button that calls `useJoinQueue()`, daily session count indicator
- [ ] T112 [US7] Create `src/features/queue/components/QueueClaimPrompt.tsx` — notification-triggered screen/modal: "A teacher is now available! Tap to join" with countdown timer (3 min), "Join Now" button that calls `useClaimQueueSlot()` → creates draft session → opens meeting link
- [ ] T113 [US7] Add realtime subscription for `free_program_queue` table in `src/features/realtime/` — filter by `program_id` for INSERT/UPDATE/DELETE; invalidate `['queue', programId]` cache
- [ ] T114 [US7] Update `src/features/teacher-availability/components/AvailableTeachersList.tsx` — integrate `NoTeachersAvailable` component when teacher list is empty; show daily session count warning when student is at or near limit
- [ ] T115 [US7] Adapt `src/features/notifications/` — add notification for teachers when queue exceeds threshold (default 5): "Students are waiting — can you come online?"

**Checkpoint**: User Story 7 complete — queue join → notification → claim window → fair usage limits

---

## Phase 10: User Story 8 — Supervisor Oversight (Priority: P8)

**Goal**: Supervisor views assigned teachers' activity, session logs, flagged reviews, rating trends; can reassign students

**Independent Test**: Supervisor sees assigned teachers with session counts and ratings, views flagged low reviews, and reassigns a student between teachers

### Implementation for User Story 8

- [ ] T116 [P] [US8] Create `src/features/supervisor/services/supervisor.service.ts` — `getAssignedTeachers()`, `getTeacherDetail()`, `reassignStudent()`, `getFlaggedReviews()` per contracts/services.md
- [ ] T117 [P] [US8] Create `src/features/supervisor/types/index.ts` — `TeacherSummary` (profile, sessionCount, activeStudents, averageRating), `TeacherDetail` types
- [ ] T118 [P] [US8] Create `src/features/supervisor/hooks/useSupervisor.ts` — hooks: `useAssignedTeachers(supervisorId, programId)`, `useTeacherDetail(teacherId, programId)`, `useReassignStudent()`, `useFlaggedReviews(programId)`
- [ ] T119 [US8] Create `app/(supervisor)/_layout.tsx` — supervisor route group layout with auth guard (must have `supervisor` role for at least one program)
- [ ] T120 [US8] Create `app/(supervisor)/(tabs)/_layout.tsx` — 4-tab bottom navigation: Home, Teachers, Reports, Profile
- [ ] T121 [US8] Create `app/(supervisor)/(tabs)/index.tsx` — supervisor dashboard: assigned teacher count, flagged reviews count (alert badge), teachers with rating below warning threshold, recent activity feed
- [ ] T122 [US8] Create `app/(supervisor)/(tabs)/teachers.tsx` — teacher list: name, session count (week/month), active students, average rating, flag indicator for concerns; tap opens teacher detail
- [ ] T123 [US8] Create `src/features/supervisor/components/TeacherDetailView.tsx` — teacher detail: recent session logs, per-student progress, individual reviews (with student names visible to supervisor), flagged reviews highlighted, "Exclude Review" action with reason input, rating trend chart
- [ ] T124 [US8] Create `src/features/supervisor/components/ReassignStudentFlow.tsx` — bottom sheet: select student from Teacher A's roster, pick Teacher B from supervisor's group, confirm reassignment; updates enrollment `teacher_id` and notifies both teachers
- [ ] T125 [US8] Create `app/(supervisor)/(tabs)/reports.tsx` — supervisor reports stub: teacher comparison table (sessions, ratings, student progress), exportable summaries placeholder
- [ ] T126 [US8] Adapt `src/features/notifications/` — add supervisor alert notifications: teacher rating drops below warning threshold (3.5), new flagged review (≤ 2 stars)

**Checkpoint**: User Story 8 complete — supervisor oversight with teacher monitoring, review management, student reassignment

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T127 [P] Configure TanStack Query persistence in `app/_layout.tsx` — set `gcTime: Infinity` for persisted queries (programs, profile, session history), add `onlineManager` from TanStack Query for automatic refetch on connectivity restore
- [ ] T128 [P] Create `src/components/OfflineIndicator.tsx` — banner/toast component using `@react-native-community/netinfo` (bundled with Expo): when offline, shows persistent top banner "You're offline — some features unavailable"; wrap all mutation hooks to check connectivity before executing and show toast "This action requires an internet connection" on attempt; integrate in `app/_layout.tsx` as a global overlay per FR-061
- [ ] T129 [P] Create `src/features/notifications/components/NotificationPreferences.tsx` — settings screen: toggle switches per notification category (enrollment, session_reminder, queue, rating, waitlist, quality_alert), uses `notifications.service.ts` `getPreferences()` and `updatePreference()`
- [ ] T130 [P] Create `src/features/notifications/services/notifications.service.ts` — `registerPushToken()`, `getPreferences()`, `updatePreference()` per contracts/services.md
- [ ] T131 [P] Adapt `supabase/functions/send-notification/index.ts` — update Edge Function for new notification categories: enrollment_approval, session_reminder, queue_available, voice_memo_received, rating_prompt, waitlist_offer, supervisor_alert; remove Quran School-specific categories
- [ ] T132 [P] Create `app/(master-admin)/reports/index.tsx` — cross-program reports stub: total users, sessions per program, enrollment trends placeholder
- [ ] T133 [P] Create `app/(master-admin)/settings/index.tsx` — platform config screen: edit `platform_config` table (name, name_ar, logo, global defaults)
- [ ] T134 [P] Create `app/(program-admin)/(tabs)/reports.tsx` — program admin reports stub: enrollment numbers, session counts, teacher performance summary placeholder
- [ ] T135 [P] Create `app/(teacher)/(tabs)/students.tsx` — teacher's student list: enrolled students across their cohorts, per-student session history and progress
- [ ] T136 [P] Create `app/(teacher)/(tabs)/circles.tsx` — teacher's cohort view: assigned cohorts with schedules, student rosters, session logging per cohort
- [ ] T137 Adapt `app/(supervisor)/(tabs)/profile.tsx` — supervisor profile screen reusing shared profile component with role indicator
- [ ] T138 Clean up dead imports and references to removed Quran School features across `src/hooks/`, `src/stores/`, `src/lib/`
- [ ] T139 Run quickstart.md validation — verify app launches, OAuth sign-in works, programs list shows 8 seeded programs, all route groups accessible per role

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–10)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → ... → P8)
  - Some stories can run in parallel (see below)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — No dependencies on other stories
- **US2 (P2)**: Can start after Phase 2 — Uses sessions service started in US1 but independently testable
- **US3 (P3)**: Can start after Phase 2 — No dependencies on US1/US2
- **US4 (P4)**: Can start after Phase 2 — Uses enrollment/cohort models independent of US1-3
- **US5 (P5)**: Depends on US2 (draft session creation) — builds on sessions service
- **US6 (P6)**: Depends on US5 (completed sessions) — ratings are per-session
- **US7 (P7)**: Depends on US2 (teacher availability) — queue triggers on availability changes
- **US8 (P8)**: Depends on US6 (teacher ratings) — supervisor views rating data

### Parallel Opportunities

Stories that CAN run in parallel after Phase 2:
- **Group A**: US1 + US3 + US4 (independent: registration, admin, enrollment)
- **Group B**: US2 (after US1 profile/programs are usable)
- **Group C**: US5 → US6 (sequential: sessions then ratings)
- **Group D**: US7 (after US2 availability)
- **Group E**: US8 (after US6 ratings)

### Within Each User Story

- Types before services
- Services before hooks
- Hooks before UI components
- Components before screens
- Core implementation before integration with other features

---

## Parallel Example: User Story 1

```bash
# Launch types + services in parallel (different files, no deps):
Task: T019 "onboarding.service.ts"
Task: T020 "onboarding types"
Task: T021 "programs.service.ts"
Task: T022 "programs types"

# Then hooks in parallel (depend on services):
Task: T023 "usePrograms hooks"
Task: T024 "useOnboarding hooks"

# Then screens (depend on hooks):
Task: T025 "login.tsx"
Task: T026 "onboarding.tsx"
# ...
```

## Parallel Example: User Story 2

```bash
# Launch services + types in parallel:
Task: T037 "teacher-availability.service.ts"
Task: T038 "teacher-availability types"
Task: T040 "sessions.service.ts additions"
Task: T041 "sessions types"

# Then hooks in parallel:
Task: T039 "useTeacherAvailability hooks"
Task: T045 "useCreateDraftSession hook"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T018)
3. Complete Phase 3: User Story 1 (T019–T036)
4. **STOP and VALIDATE**: Test OAuth → onboarding → program browsing
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → OAuth + programs → **MVP Demo**
3. US2 → Teacher availability + join session → Core value loop
4. US3 → Admin panels → Operational capability
5. US4 → Enrollment + cohorts → Structured programs live
6. US5 → Session logging + voice memos → Learning management
7. US6 → Teacher ratings → Quality signal
8. US7 → Queue + fair usage → Scalable free programs
9. US8 → Supervisor oversight → Quality management layer

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 → US2 → US5 → US6
   - Developer B: US3 → US4
   - Developer C: US7 → US8
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies within the phase
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable at its checkpoint
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- No test tasks generated (not requested in spec)
- Total: 139 tasks across 11 phases
