# Tasks: Program-Specific Features

**Input**: Design documents from `/specs/001-program-features/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/, research.md, quickstart.md

**Tests**: Not explicitly requested — test tasks omitted. Add via a follow-up `/speckit.checklist` if needed.

**Organization**: Tasks grouped by user story. US1+US8 combined (P1, tightly coupled). US4/US5/US6 share curriculum-progress module — US4 builds shared infrastructure, US5/US6 extend it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US8)
- Exact file paths included for every task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies, create feature directory scaffolding

- [x] T001 Install new dependencies: `npx expo install react-native-view-shot react-native-qrcode-svg`
- [x] T002 [P] Create feature directory structure for `src/features/certifications/` with components/, hooks/, services/, types/ subdirectories
- [x] T003 [P] Create feature directory structure for `src/features/himam/` with components/, hooks/, services/, types/ subdirectories
- [x] T004 [P] Create feature directory structure for `src/features/curriculum-progress/` with components/, hooks/, services/, types/ subdirectories
- [x] T005 [P] Create feature directory structure for `src/features/guardians/` with components/, hooks/, services/, types/ subdirectories
- [x] T006 [P] Create feature directory structure for `src/features/peer-pairing/` with components/, hooks/, services/, types/ subdirectories

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migration, type generation, and shared types that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Write SQL migration with all 8 new tables, RLS policies, triggers, functions (get_certification_eligibility, generate_certificate_number), sequence (cert_number_seq), and certificates storage bucket in `supabase/migrations/00004_program_features.sql` per data-model.md
- [x] T008 Apply migration to remote Supabase project via `supabase db push` or Supabase Dashboard
- [x] T009 Regenerate TypeScript types from Supabase schema into `src/types/database.types.ts`
- [x] T010 [P] Create certifications types (Certification, CertificationType, CertificationStatus, RecommendInput) in `src/features/certifications/types/certifications.types.ts` per contracts/certifications.md
- [x] T011 [P] Create himam types (HimamEvent, HimamRegistration, HimamProgress, HimamTrack, CreateEventInput) in `src/features/himam/types/himam.types.ts` per contracts/himam.md
- [x] T012 [P] Create curriculum-progress types (ProgressType, MutoonStatus, QiraatStatus, ArabicStatus, CurriculumSection, UpdateSectionInput) in `src/features/curriculum-progress/types/curriculum-progress.types.ts` per contracts/curriculum-progress.md
- [x] T013 [P] Create guardians types (StudentGuardian, AddGuardianInput, UpdateGuardianInput, GuardianRelationship) in `src/features/guardians/types/guardians.types.ts` per contracts/guardians.md
- [x] T014 [P] Create peer-pairing types (PeerPairing, SectionType, RequestPairingInput) in `src/features/peer-pairing/types/peer-pairing.types.ts` per contracts/peer-pairing.md
- [x] T015 [P] Add certifications, himam, curriculum-progress, guardians, and peer-pairing i18n keys to `src/i18n/en.json`
- [x] T016 [P] Add certifications, himam, curriculum-progress, guardians, and peer-pairing i18n keys to `src/i18n/ar.json`

**Checkpoint**: Foundation ready — all tables exist, types generated, user story implementation can begin

---

## Phase 3: User Story 1 + 8 — Certification/Ijazah Issuance + Certificate Generation (Priority: P1) MVP

**Goal**: Complete certification lifecycle (recommend → approve → issue) with digital certificate generation, sharing, and public verification

**Independent Test**: Create a certification record for a student, verify the multi-role approval workflow (teacher recommends → supervisor reviews → program admin issues), generate a certificate image with QR code, share it, and verify the public verification page

### Service & Hooks

- [x] T017 [US1] Implement certifications service with getCertificationsForStudent, getCertificationById, getCertificationRequests, recommendForCertification, reviewCertification, issueCertification, revokeCertification in `src/features/certifications/services/certifications.service.ts` per contracts/certifications.md
- [x] T018 [US1] Implement useCertifications hook with TanStack Query wrapper for student certificate list and single certificate queries in `src/features/certifications/hooks/useCertifications.ts`
- [x] T019 [US1] Implement useCertificationRequests hook for supervisor/admin queues with status filtering in `src/features/certifications/hooks/useCertificationRequests.ts`
- [x] T020 [US8] Implement useCertificateImage hook with react-native-view-shot captureRef, expo-file-system caching, and Share.share integration in `src/features/certifications/hooks/useCertificateImage.ts`

### Components

- [x] T021 [P] [US1] Create CertificateCard component showing title, program, teacher, issue date, and certificate number in `src/features/certifications/components/CertificateCard.tsx`
- [x] T022 [P] [US1] Create CertificationRequestCard component showing student info, status badge, and action buttons (approve/reject) in `src/features/certifications/components/CertificationRequestCard.tsx`
- [x] T023 [US1] Create CertificationWorkflow component with role-aware action buttons (teacher: recommend, supervisor: approve/reject, admin: issue/reject) in `src/features/certifications/components/CertificationWorkflow.tsx`
- [x] T024 [US8] Create CertificateImage component (offscreen renderable certificate with student name, program, teacher, date, certificate number, organization logo, QR code via react-native-qrcode-svg) in `src/features/certifications/components/CertificateImage.tsx`
- [x] T025 [US8] Create CertificateDetail component with certificate fields, chain of narration (for Qiraat), share button, and QR code in `src/features/certifications/components/CertificateDetail.tsx`

### Screens

- [x] T026 [US1] Replace placeholder certificates tab with real certificate list using FlashList and CertificateCard in `app/(student)/(tabs)/certificates.tsx`
- [x] T027 [US8] Create certificate detail screen with CertificateDetail, CertificateImage capture, and share functionality in `app/(student)/certificates/[id].tsx`
- [x] T028 [US1] Create teacher certifications screen showing recommendations list and "Recommend" workflow in `app/(teacher)/certifications/index.tsx`
- [x] T029 [US1] Modify teacher student detail screen to add "Recommend for Certification" button (visible when checkCertificationEligibility returns eligible) in `app/(teacher)/students/[id].tsx`
- [x] T030 [US1] Create supervisor certification review queue screen with approve/reject actions and mandatory rejection reason in `app/(supervisor)/certifications/index.tsx`
- [x] T031 [US1] Create program admin certification issuance queue screen with issue action and optional chain of narration field in `app/(program-admin)/certifications/index.tsx`
- [x] T032 [US1] Create master admin cross-program certification overview screen (read-only) in `app/(master-admin)/certifications/index.tsx`

### Edge Function

- [x] T033 [US8] Create verify-certificate edge function serving bilingual HTML page with certificate details, revocation status, and social meta tags (verify_jwt: false) in `supabase/functions/verify-certificate/index.ts`
- [x] T034 [US8] Deploy verify-certificate edge function to Supabase project via `supabase functions deploy verify-certificate --no-verify-jwt`

**Checkpoint**: Full certification lifecycle works end-to-end. Students see certificates, can share images, and QR codes resolve to verification page.

---

## Phase 4: User Story 2 — Himam Quranic Marathon Events (Priority: P2)

**Goal**: Program admins create Saturday marathon events, students register for tracks, get paired with partners, select time slots, and log per-Juz' completions

**Independent Test**: Create an event, register two students in the same track, run partner matching, select time slots, log block completions until track goal is met, verify auto-completion

### Service & Hooks

- [x] T035 [US2] Implement himam service with getUpcomingEvents, getEventById, getRegistration, getEventRegistrations, getProgress, createEvent, registerForEvent, updateTimeSlots, logBlockCompletion, cancelRegistration in `src/features/himam/services/himam.service.ts` per contracts/himam.md
- [x] T036 [US2] Implement useHimamEvents hook with TanStack Query for event list and single event queries in `src/features/himam/hooks/useHimamEvents.ts`
- [x] T037 [US2] Implement useHimamRegistration hook for student registration, partner info, and time slot management in `src/features/himam/hooks/useHimamRegistration.ts`
- [x] T038 [US2] Implement useHimamProgress hook for per-Juz' progress tracking and block completion logging in `src/features/himam/hooks/useHimamProgress.ts`

### Components

- [x] T039 [P] [US2] Create HimamEventCard component showing event date, status, track options, and registration count in `src/features/himam/components/HimamEventCard.tsx`
- [x] T040 [P] [US2] Create HimamTrackPicker component with 5 track options (3/5/10/15/30 Juz') in `src/features/himam/components/HimamTrackPicker.tsx`
- [x] T041 [P] [US2] Create PartnerCard component showing partner name, avatar, meeting link, and status in `src/features/himam/components/PartnerCard.tsx`
- [x] T042 [US2] Create TimeSlotPicker component with prayer-time block grid for the 24h event window in `src/features/himam/components/TimeSlotPicker.tsx`
- [x] T043 [US2] Create JuzProgressGrid component showing per-Juz' completion status (pending/completed/partner_absent) in `src/features/himam/components/JuzProgressGrid.tsx`

### Screens

- [x] T044 [US2] Create student Himam event list screen showing upcoming/active events with registration status in `app/(student)/himam/index.tsx`
- [x] T045 [US2] Create student Himam event detail screen with track registration, partner info, time slot selection, and Juz' progress grid in `app/(student)/himam/[eventId].tsx`
- [x] T046 [US2] Create program admin event management screen with event list and "Create Event" form (Saturday date validation) in `app/(program-admin)/himam/index.tsx`
- [x] T047 [US2] Create program admin event detail screen with registrations list and status overview in `app/(program-admin)/himam/[eventId]/index.tsx`
- [x] T048 [US2] Create program admin partner matching screen with "Run Matching" button and pairing results in `app/(program-admin)/himam/[eventId]/pairings.tsx`

### Edge Function

- [x] T049 [US2] Create himam-partner-matching edge function implementing FIFO pairing algorithm (group by track, pair adjacently, handle odd counts) with partner assignment notifications in `supabase/functions/himam-partner-matching/index.ts`
- [x] T050 [US2] Deploy himam-partner-matching edge function to Supabase project via MCP deploy

### Scheduled Functions

- [x] T051 [US2] Create himam-event-lifecycle edge function that: (1) marks events as 'active' when start_time arrives, (2) marks registrations as 'incomplete' when the 24h window closes (FR-020), and (3) sends event reminder notifications 24h before event start (FR-021) in `supabase/functions/himam-event-lifecycle/index.ts`
- [x] T052 [US2] Deploy himam-event-lifecycle edge function and configure pg_cron or Supabase scheduled invocation (hourly check) via MCP deploy

**Checkpoint**: Himam events work end-to-end. Admins create events, students register, partners get matched, time slots selected, completions tracked, and events auto-transition through lifecycle.

---

## Phase 5: User Story 3 — Children's Program Guardian Management (Priority: P2)

**Goal**: Store guardian information on children's student profiles, support multiple guardians with per-guardian notification preferences, and enforce age-based track filtering

**Independent Test**: Add a guardian to a student profile, verify guardian appears in list, set notification preferences per category, verify age-based track filtering works for enrollment

### Service & Hooks

- [x] T053 [US3] Implement guardians service with getGuardians, getGuardianNotificationPreferences, addGuardian, updateGuardian, removeGuardian, updateGuardianNotificationPreference in `src/features/guardians/services/guardians.service.ts` per contracts/guardians.md
- [x] T054 [US3] Implement useGuardians hook with TanStack Query for guardian list and mutations in `src/features/guardians/hooks/useGuardians.ts`
- [x] T055 [US3] Implement useGuardianNotificationPrefs hook for per-guardian notification category toggles in `src/features/guardians/hooks/useGuardianNotificationPrefs.ts`

### Components

- [x] T056 [P] [US3] Create GuardianForm component with react-hook-form + zod validation (name required, at least one of phone/email, relationship picker, is_primary toggle) in `src/features/guardians/components/GuardianForm.tsx`
- [x] T057 [P] [US3] Create GuardianList component showing guardians with edit/delete actions and primary badge in `src/features/guardians/components/GuardianList.tsx`

### Screen Integration

- [x] T058 [US3] Integrate GuardianList and GuardianForm into the student profile screen (show guardian section for children's program students) in `app/(student)/(tabs)/profile.tsx`
- [x] T059 [US3] Add notification preference toggles per guardian (attendance, session outcomes, milestones) to the guardian detail view within GuardianList

### Age-Based Track Filtering (FR-027, FR-028)

- [x] T060 [US3] Implement age-based track filtering in Children's Program enrollment flow: filter available tracks by child's age (Talqeen 3-6, Nooraniyah 4-8, Memorization 6+) and prevent under-age enrollment in `src/features/enrollment/utils/ageTrackFilter.ts`

### Guardian Notification Integration (FR-025)

- [x] T061 [US3] Modify send-notification edge function to check `student_guardians` and `guardian_notification_preferences` tables for children's program notifications — filter notification delivery by each guardian's per-category preferences before sending to child's push tokens in `supabase/functions/send-notification/index.ts`

**Checkpoint**: Guardians can be added/edited/removed on student profiles. Per-guardian notification preferences are configurable. Age-based enrollment filtering works. Guardian notification routing integrated.

---

## Phase 6: User Story 4 — Mutoon Linear Progress Tracking (Priority: P3)

**Goal**: Track per-section (verse/line) progress for Mutoon enrollments with shared curriculum-progress infrastructure that also serves US5 and US6

**Independent Test**: Enroll a student in a Mutoon track, verify progress rows are initialized from track curriculum metadata, update section statuses and scores (0-5), verify completion percentage updates and certification eligibility check

### Service & Hooks (shared curriculum-progress module)

- [x] T062 [US4] Implement curriculum-progress service with getProgressByEnrollment, getProgressSummary, getCurriculumSections, checkCertificationEligibility, initializeProgress, updateSectionProgress, batchUpdateSections in `src/features/curriculum-progress/services/curriculum-progress.service.ts` per contracts/curriculum-progress.md
- [x] T063 [US4] Implement useCurriculumProgress hook with TanStack Query for progress list, mutations, and optimistic updates in `src/features/curriculum-progress/hooks/useCurriculumProgress.ts`
- [x] T064 [US4] Implement useCurriculumSections hook to load pre-defined sections from program_tracks.curriculum JSONB in `src/features/curriculum-progress/hooks/useCurriculumSections.ts`
- [x] T065 [US4] Implement useCompletionPercentage hook computing completed/total ratio per progress_type in `src/features/curriculum-progress/hooks/useCompletionPercentage.ts`

### Components (shared, parameterized by progress_type)

- [x] T066 [P] [US4] Create SectionProgressBar component showing completion percentage with color-coded fill in `src/features/curriculum-progress/components/SectionProgressBar.tsx`
- [x] T067 [P] [US4] Create SectionProgressList component showing linear section list with status icons, scores, and last review date in `src/features/curriculum-progress/components/SectionProgressList.tsx`
- [x] T068 [US4] Create SectionUpdateForm component (teacher view) with status picker, score input (range varies by progress_type: 0-5 Mutoon, pass/fail Qiraat, 0-100 Arabic), and notes field in `src/features/curriculum-progress/components/SectionUpdateForm.tsx`
- [x] T069 [US4] Create CertificationEligibility component showing progress summary and "Recommend for Certification" button when eligible in `src/features/curriculum-progress/components/CertificationEligibility.tsx`

### Screens

- [x] T070 [US4] Create teacher curriculum workspace screen showing section list, progress bar, section update form, and certification eligibility for a given enrollment in `app/(teacher)/curriculum/[enrollmentId].tsx`
- [x] T071 [US4] Create student curriculum progress screen showing section list, progress bar, per-section status/scores, and last review dates (FR-031) in `app/(student)/program/[enrollmentId]/progress.tsx`

**Checkpoint**: Mutoon progress tracking works. Teachers update sections, students see progress bars, certification eligibility triggers. Shared infrastructure ready for US5/US6.

---

## Phase 7: User Story 5 — Qiraat Per-Riwayah Tracking (Priority: P3)

**Goal**: Extend shared curriculum-progress module for Qiraat: 30 Juz' sections, pass/fail only (no score), chain of narration on Ijazah

**Independent Test**: Enroll a student in a Qiraat track, verify 30 Juz' progress rows created, sign off Juz' as pass/fail, verify Ijazah recommendation includes سند field

**Note**: Reuses all infrastructure from US4. Only Qiraat-specific validation and UI additions needed.

- [x] T072 [US5] Add Qiraat-specific validation to SectionUpdateForm: pass/fail status only, no score field, 30-section constraint in `src/features/curriculum-progress/components/SectionUpdateForm.tsx`
- [x] T073 [US5] Add chain of narration (سند) text input field to the certification issuance workflow for Qiraat-type certifications in `src/features/certifications/components/CertificationWorkflow.tsx`
- [x] T074 [US5] Ensure CertificateDetail displays Riwayah name and chain of narration for Qiraat Ijazah certificates in `src/features/certifications/components/CertificateDetail.tsx`

**Checkpoint**: Qiraat tracking works with pass/fail per Juz'. Ijazah includes chain of narration.

---

## Phase 8: User Story 6 — Arabic Language Recitation Tracking (Priority: P3)

**Goal**: Extend shared curriculum-progress module for Arabic Language: recitation-based sections, score 0-100, configurable passing threshold (default 60)

**Independent Test**: Enroll a student in an Arabic Language track, record scores per recitation, verify graduation eligibility when all recitations pass threshold

**Note**: Reuses all infrastructure from US4. Only Arabic-specific scoring and threshold logic needed.

- [x] T075 [US6] Add Arabic-specific validation to SectionUpdateForm: score range 0-100, status auto-set based on passing threshold in `src/features/curriculum-progress/components/SectionUpdateForm.tsx`
- [x] T076 [US6] Add graduation eligibility check with configurable passing threshold (default 60) to CertificationEligibility component in `src/features/curriculum-progress/components/CertificationEligibility.tsx`

**Checkpoint**: Arabic Language tracking works with scored recitations. Graduation eligibility respects configurable threshold.

---

## Phase 9: User Story 7 — Student-to-Student Alternating Recitation (Priority: P4)

**Goal**: Students browse available peers, send pairing requests, accept/decline, see partner meeting links, and log peer sessions

**Independent Test**: Two students request pairing, one accepts, both see each other's meeting links, log a session, verify session count increments

### Service & Hooks

- [x] T077 [US7] Implement peer-pairing service with getActivePairings, getPairingById, getAvailablePartners, getPairingHistory, requestPairing, respondToPairing, logPairingSession, completePairing, cancelPairing in `src/features/peer-pairing/services/peer-pairing.service.ts` per contracts/peer-pairing.md
- [x] T078 [US7] Implement usePeerAvailability hook for available partners list query in `src/features/peer-pairing/hooks/usePeerAvailability.ts`
- [x] T079 [US7] Implement usePeerPairing hook for active pairings, request/respond mutations in `src/features/peer-pairing/hooks/usePeerPairing.ts`
- [x] T080 [US7] Implement usePeerSessions hook for session logging and history in `src/features/peer-pairing/hooks/usePeerSessions.ts`

### Components

- [x] T081 [P] [US7] Create AvailablePeerList component showing available students with name, avatar, and "Request Pairing" button in `src/features/peer-pairing/components/AvailablePeerList.tsx`
- [x] T082 [P] [US7] Create PeerPairingCard component showing partner info, meeting link, status, and session count in `src/features/peer-pairing/components/PeerPairingCard.tsx`
- [x] T083 [US7] Create PeerSessionLogger component with "Log Session" button and optional notes field in `src/features/peer-pairing/components/PeerSessionLogger.tsx`

### Screen

- [x] T084 [US7] Create student peer recitation screen with availability toggle (FR-039), available peers list, active pairings, pairing requests, and session logger in `app/(student)/peer-recitation/index.tsx`

**Checkpoint**: Peer pairing works end-to-end. Students toggle availability, find partners, pair up, see meeting links, and log sessions.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Verify completeness, i18n, RTL, security, and cross-story integration

- [x] T085 Verify and complete all i18n translations for new screens and components in `src/i18n/en.json` and `src/i18n/ar.json`
- [x] T086 [P] Verify RTL layout correctness for certificate image, progress views, guardian forms, and all new screens
- [x] T087 [P] Run Supabase security advisors check on all 8 new tables to validate RLS policies
- [x] T088 Run quickstart.md validation scenarios (all 6 integration scenarios)

### Auto-Cancel Certification on Student Un-Enrollment (Edge Case 1)

- [x] T089 Add database trigger or RPC on enrollments table that automatically cancels pending/recommended certifications (status → 'cancelled') when a student's enrollment is deleted or deactivated, and sends notification to the recommending teacher in `supabase/migrations/00004_program_features.sql` (append to migration or create `00005_cert_auto_cancel_trigger.sql`)

**Checkpoint**: All edge cases covered, i18n complete, RLS validated, integration scenarios pass.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **US1+US8 (Phase 3)**: Depends on Foundational (Phase 2) — No dependencies on other stories
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — No dependencies on other stories
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) — No dependencies on other stories
- **US4 (Phase 6)**: Depends on Foundational (Phase 2) — **Builds shared curriculum-progress module used by US5/US6**
- **US5 (Phase 7)**: Depends on US4 (Phase 6) — extends shared curriculum-progress
- **US6 (Phase 8)**: Depends on US4 (Phase 6) — extends shared curriculum-progress
- **US7 (Phase 9)**: Depends on Foundational (Phase 2) — No dependencies on other stories
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

```text
Phase 1 (Setup)
  │
  v
Phase 2 (Foundational) ──── BLOCKS ALL ────┐
  │                                          │
  ├──> Phase 3 (US1+US8) ──────────────┐    │
  ├──> Phase 4 (US2) ──────────────────┤    │
  ├──> Phase 5 (US3) ──────────────────┤    │
  ├──> Phase 6 (US4) ───┐              │    │
  │                      ├──> Phase 7 (US5) │
  │                      └──> Phase 8 (US6) │
  └──> Phase 9 (US7) ──────────────────┤    │
                                        │    │
                                        v    │
                                 Phase 10 (Polish)
```

### Within Each User Story

- Types created in Phase 2 (foundational)
- Service before hooks
- Hooks before components
- Components before screens
- Edge functions before their consuming screens
- Story complete before moving to next priority

### Parallel Opportunities

**After Phase 2 completes, these can run in parallel**:
- US1+US8 (Phase 3) — independent
- US2 (Phase 4) — independent
- US3 (Phase 5) — independent
- US7 (Phase 9) — independent

**Sequential requirement**:
- US4 (Phase 6) MUST complete before US5 (Phase 7) or US6 (Phase 8)
- US5 and US6 CAN run in parallel after US4

---

## Parallel Example: Phase 3 (US1+US8)

```bash
# After T017-T020 (service + hooks) complete sequentially:

# Launch parallel component tasks:
T021: "CertificateCard in src/features/certifications/components/CertificateCard.tsx"
T022: "CertificationRequestCard in src/features/certifications/components/CertificationRequestCard.tsx"

# Then sequential screen tasks after components:
T026 → T027 → T028 → T029 → T030 → T031 → T032
```

## Parallel Example: Phase 2 (Foundational)

```bash
# After T007-T009 (migration + types) complete sequentially:

# Launch all feature type files in parallel:
T010: "certifications.types.ts"
T011: "himam.types.ts"
T012: "curriculum-progress.types.ts"
T013: "guardians.types.ts"
T014: "peer-pairing.types.ts"
T015: "en.json i18n keys"
T016: "ar.json i18n keys"
```

---

## Implementation Strategy

### MVP First (US1+US8 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1+US8 (Certification + Certificate Generation)
4. **STOP and VALIDATE**: Test certification lifecycle end-to-end
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1+US8 → Certification lifecycle + certificate sharing → **MVP!**
3. US2 → Himam marathon events → Deploy/Demo
4. US3 → Guardian management + age filtering + notification integration → Deploy/Demo
5. US4 → Mutoon progress (+ shared curriculum module) → Deploy/Demo
6. US5 → Qiraat tracking (lightweight extension) → Deploy/Demo
7. US6 → Arabic tracking (lightweight extension) → Deploy/Demo
8. US7 → Peer pairing → Deploy/Demo
9. Polish → Final validation (auto-cancel trigger, security check)

### Parallel Team Strategy

With multiple developers after Phase 2:
- Developer A: US1+US8 (certification — highest priority)
- Developer B: US2 (Himam events)
- Developer C: US3 (guardians) then US7 (peer pairing)
- Developer A (after US1+US8): US4 → US5 → US6 (curriculum progress chain)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps tasks to specific user stories for traceability
- US5/US6 are lightweight extensions of US4's shared module (3 and 2 tasks respectively)
- The certificates storage bucket is created by the migration (T007), not a separate task
- Edge function deployments (T034, T050, T052) are separate tasks from writing the code to allow review before deployment
- T089 (auto-cancel trigger) is in Polish phase to allow migration planning after all stories are understood
- Commit after each logical task group (service, hooks, components, screens)
