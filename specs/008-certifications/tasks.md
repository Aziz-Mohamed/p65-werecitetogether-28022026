# Tasks: Certification System (Ijazah)

**Input**: Design documents from `/specs/008-certifications/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/rpc-functions.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies and create feature directory structure

- [x] T001 Install new npm dependencies: `react-native-qrcode-svg`, `react-native-view-shot`, `expo-sharing` via `npx expo install`
- [x] T002 Create feature directory structure: `src/features/certifications/` with subdirectories `components/`, `hooks/`, `services/`, `types/` — also verify `EXPO_PUBLIC_SUPABASE_URL` env var exists (needed for QR code verification URL in T027)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, types, service layer, i18n, and shared components that ALL user stories depend on

- [x] T003 Write database migration in `supabase/migrations/00010_certifications.sql` — create `certifications` table with all columns per data-model.md, `certification_number_seq` sequence, partial unique index on `(student_id, program_id, COALESCE(track_id, ...))` WHERE status NOT IN ('rejected'), B-tree indexes on student_id/program_id+status/teacher_id/certificate_number, `updated_at` trigger, RLS policies for student/teacher/supervisor/program_admin/master_admin per data-model.md, and all 7 RPC functions: `recommend_certification`, `review_certification`, `resubmit_certification`, `issue_certification`, `revoke_certification`, `get_certification_pipeline`, `get_certification_queue` per contracts/rpc-functions.md — include self-approval checks (FR-018), enrollment validation (FR-015), certificate number generation, and status transition enforcement
- [x] T003a Apply migration locally via `supabase db reset` and regenerate TypeScript types via MCP `generate_typescript_types` to update `supabase/types/database.types.ts`
- [x] T004 Create TypeScript types in `src/features/certifications/types/certifications.types.ts` — define `Certification`, `CertificationType`, `CertificationStatus`, `CertificationWithDetails` (joined with profiles/programs/tracks), `RecommendInput`, `ReviewInput`, `IssueInput`, `RevokeInput`, `ResubmitInput`, `CertificationPipeline`, `CertificationQueueItem`, `VerificationResult` interfaces
- [x] T005 Create service in `src/features/certifications/services/certifications.service.ts` — wrap all 7 RPC calls (`recommend_certification`, `review_certification`, `resubmit_certification`, `issue_certification`, `revoke_certification`, `get_certification_pipeline`, `get_certification_queue`), plus direct Supabase queries for `getStudentCertificates(studentId)`, `getCertificationById(id)`, `getAllCertifications(filters)` — follow singleton export pattern from `programsService`
- [x] T006 [P] Add bilingual i18n keys for certifications feature in `src/i18n/locales/en.json` and `src/i18n/locales/ar.json` — keys for: certification types (ijazah/graduation/completion), statuses (recommended/supervisor_approved/issued/returned/rejected/revoked), form labels, button text, empty states, error messages, notification messages, certificate display labels, pipeline labels, queue labels, share action, QR verification
- [x] T007 [P] Create StatusBadge component in `src/features/certifications/components/StatusBadge.tsx` — maps certification status to Badge variant (recommended=info, supervisor_approved=warning, issued=success, returned=warning, rejected=default, revoked=default) with i18n labels
- [x] T008 [P] Create CertificationCard component in `src/features/certifications/components/CertificationCard.tsx` — list item for review queues showing student name, teacher name, program, track, certification type, status badge, created date, with onPress handler — used across supervisor, program admin, and master admin screens
- [x] T009 Create barrel export in `src/features/certifications/index.ts` — export all components, hooks, services, types organized by section

**Checkpoint**: Foundation ready — all user story implementation can begin

---

## Phase 3: User Story 1 - Teacher Recommends Student for Certification (Priority: P1)

**Goal**: Teachers can submit certification recommendations for their assigned students in structured programs

**Independent Test**: Teacher opens student detail → taps "Recommend for Certification" → fills form → submits → record created with status "recommended" (QS-1, QS-2, QS-17)

- [x] T010 [US1] Create `useRecommendCertification` mutation hook in `src/features/certifications/hooks/useRecommendCertification.ts` — calls `certificationsService.recommend()`, invalidates certification queries on success, returns mutation state
- [x] T011 [US1] Create RecommendationForm component in `src/features/certifications/components/RecommendationForm.tsx` — react-hook-form + zod schema with fields: type (picker: ijazah/graduation/completion), title, title_ar (optional), notes (optional) — pre-fills program and track context from route params — shows duplicate warning if active cert exists — validates enrollment status before submission
- [x] T012 [US1] Create teacher recommendation screen at `app/(teacher)/students/[id]/recommend.tsx` — receives studentId, programId, trackId from route params — shows student info header, RecommendationForm, success/error feedback — navigates back on success
- [x] T012a [US1] Create teacher certifications list screen at `app/(teacher)/certifications/index.tsx` — FlashList of teacher's own certification recommendations using a query filtered by `teacher_id = auth.uid()`, CertificationCard items showing status, pull-to-refresh, navigates to detail on press
- [x] T012b [US1] Create teacher certification detail screen at `app/(teacher)/certifications/[id].tsx` — shows certification details using `useCertificationDetail`, displays supervisor feedback (`review_notes`) for returned certs, ResubmitForm (update title/title_ar/notes) using `useResubmitCertification` hook for returned status, read-only view for other statuses

**Checkpoint**: Teacher recommendation and resubmit flows fully functional (QS-1, QS-2, QS-5, QS-17 testable)

---

## Phase 4: User Story 2 - Supervisor Reviews Recommendation (Priority: P2)

**Goal**: Supervisors can review pending recommendations, approve or return them with feedback

**Independent Test**: Supervisor opens certifications queue → sees pending recommendations from their teachers → taps one → reviews detail → approves or returns with notes (QS-3, QS-4, QS-5)

- [x] T013 [P] [US2] Create `useCertificationQueue` hook in `src/features/certifications/hooks/useCertificationQueue.ts` — calls `certificationsService.getQueue(programId, role)` where role is 'supervisor' or 'program_admin', returns typed `CertificationQueueItem[]` — reusable for both supervisor (US2) and program admin (US3) screens
- [x] T014 [P] [US2] Create `useCertificationDetail` hook in `src/features/certifications/hooks/useCertificationDetail.ts` — calls `certificationsService.getCertificationById(id)`, returns `CertificationWithDetails` — reusable across all detail screens
- [x] T015 [P] [US2] Create `useReviewCertification` mutation hook in `src/features/certifications/hooks/useReviewCertification.ts` — calls `certificationsService.review()` with action ('approve'|'return') and optional review_notes, invalidates queue and detail queries on success
- [x] T016 [P] [US2] Create `useResubmitCertification` mutation hook in `src/features/certifications/hooks/useResubmitCertification.ts` — calls `certificationsService.resubmit()` with optional updated title/notes, invalidates queries on success
- [x] T017 [US2] Create ReviewActions component in `src/features/certifications/components/ReviewActions.tsx` — renders Approve/Return buttons for supervisor, Issue/Reject buttons for program admin (configured via props), Return/Reject opens BottomSheet with required notes TextInput, confirm button
- [x] T018 [US2] Create supervisor certifications list screen at `app/(supervisor)/certifications/index.tsx` — FlashList of pending recommendations using `useCertificationQueue(programId, 'supervisor')`, CertificationCard items, empty state, pull-to-refresh, navigates to detail on press
- [x] T019 [US2] Create supervisor certification detail screen at `app/(supervisor)/certifications/[id].tsx` — shows full certification details (student enrollment info, teacher notes, certification info) using `useCertificationDetail`, ReviewActions (approve/return mode), BottomSheet for return notes, success/error alerts

**Checkpoint**: Supervisor review flow fully functional (QS-3, QS-4, QS-5 testable)

---

## Phase 5: User Story 3 - Program Admin Approves and Issues Certificate (Priority: P2)

**Goal**: Program admins can review supervisor-approved certifications, issue or reject them, view the certification pipeline, and revoke issued certificates

**Independent Test**: Program admin opens certifications screen → sees pipeline counts + approval queue → taps a supervisor-approved cert → issues (with sanad for Qiraat) or rejects → certificate number generated on issuance (QS-6, QS-7, QS-12, QS-15)

- [x] T020 [P] [US3] Create `useIssueCertification` mutation hook in `src/features/certifications/hooks/useIssueCertification.ts` — calls `certificationsService.issue()` with action ('issue'|'reject'), optional chain_of_narration and review_notes, invalidates pipeline and queue queries on success
- [x] T021 [P] [US3] Create `useRevokeCertification` mutation hook in `src/features/certifications/hooks/useRevokeCertification.ts` — calls `certificationsService.revoke()` with revocation_reason, invalidates queries on success — reusable for program admin (US3) and master admin (US6)
- [x] T022 [P] [US3] Create `useCertificationPipeline` hook in `src/features/certifications/hooks/useCertificationPipeline.ts` — calls `certificationsService.getPipeline(programId)`, returns `CertificationPipeline` with counts per status
- [x] T023 [US3] Create CertificatePipeline component in `src/features/certifications/components/CertificatePipeline.tsx` — horizontal bar/row showing counts for each status (recommended, supervisor_approved, issued, returned, rejected, revoked) with color coding matching StatusBadge variants, tapping a status chip calls `onFilterStatus(status)` callback to filter the list below
- [x] T024 [US3] Create program admin certifications screen at `app/(program-admin)/certifications/index.tsx` — CertificatePipeline at top, FlashList of supervisor-approved queue using `useCertificationQueue(programId, 'program_admin')`, CertificationCard items, tab or filter to view all statuses, pull-to-refresh
- [x] T025 [US3] Create program admin certification detail screen at `app/(program-admin)/certifications/[id].tsx` — shows full certification details using `useCertificationDetail`, for Qiraat: TextInput for chain_of_narration, ReviewActions (issue/reject mode), BottomSheet for reject notes, Revoke button for issued certs, success/error alerts

**Checkpoint**: Program admin issuance and revocation flow fully functional (QS-6, QS-7, QS-12, QS-15 testable)

---

## Phase 6: User Story 4 - Student Views and Shares Certificates (Priority: P3)

**Goal**: Students can view their earned certificates, see a beautiful certificate card, share as image, and view QR code for verification

**Independent Test**: Student opens certificates section → sees list of earned certs → taps one → sees beautiful certificate card with QR code → taps share → image exported via native share sheet (QS-8, QS-9)

- [x] T026 [P] [US4] Create `useStudentCertificates` hook in `src/features/certifications/hooks/useStudentCertificates.ts` — calls `certificationsService.getStudentCertificates(studentId)`, returns only issued certificates with program/track/teacher details
- [x] T027 [P] [US4] Create QRCodeDisplay component in `src/features/certifications/components/QRCodeDisplay.tsx` — renders QR code using `react-native-qrcode-svg` encoding the verification URL `https://<project>.supabase.co/functions/v1/verify-certificate?number={certificateNumber}`, with certificate number text below
- [x] T028 [P] [US4] Create CertificateView component in `src/features/certifications/components/CertificateView.tsx` — beautifully designed certificate card showing: organization name (نتلو معاً / WeReciteTogether), certification title (Arabic primary), type badge, student name, teacher name, program name, track name (if applicable), issue date, certificate number, chain of narration (if Qiraat), QRCodeDisplay — styled with decorative borders, bilingual layout, RTL-safe
- [x] T029 [US4] Create student certificates list screen at `app/(student)/certificates/index.tsx` — FlashList of issued certificates using `useStudentCertificates`, each item shows title, program, issue date, type badge, navigates to detail on press, empty state for students with no certificates
- [x] T030 [US4] Create student certificate detail screen at `app/(student)/certificates/[id].tsx` — CertificateView wrapped in `react-native-view-shot` ViewShot ref, Share button that captures the certificate view as PNG via `captureRef()` then shares via `expo-sharing` `shareAsync()`, uses `useCertificationDetail` for data

**Checkpoint**: Student certificate viewing and sharing fully functional (QS-8, QS-9 testable)

---

## Phase 7: User Story 5 - Public Certificate Verification (Priority: P3)

**Goal**: Anyone can verify a certificate's authenticity via QR code or certificate number through a public endpoint

**Independent Test**: Access verification endpoint with a valid certificate number → see certificate details. Access with invalid number → "not found". Access with revoked cert number → shows revoked status (QS-10, QS-11, QS-14)

- [x] T031 [US5] Create verify-certificate Edge Function at `supabase/functions/verify-certificate/index.ts` — Deno.serve GET handler, parse `number` query param, query certifications table joined with profiles/programs/program_tracks, only return data for 'issued' and 'revoked' statuses (else 404), apply minor name masking (first name + last initial) for Children's Program, return JSON per contract, enable CORS (Access-Control-Allow-Origin: *), implement in-memory rate limiting (30 req/min/IP using Map with TTL cleanup)

**Checkpoint**: Public verification fully functional (QS-10, QS-11, QS-14 testable)

---

## Phase 8: User Story 6 - Master Admin Certification Oversight (Priority: P4)

**Goal**: Master admins can view all certifications across all programs with filters, and revoke certificates

**Independent Test**: Master admin opens certifications screen → sees all certs across programs → filters by program/type/status → selects an issued cert → revokes with reason (QS-13, QS-16)

- [x] T032 [US6] Create `useAllCertifications` hook in `src/features/certifications/hooks/useAllCertifications.ts` — calls `certificationsService.getAllCertifications(filters)` with optional filters for programId, type, status, dateRange — returns paginated results with program/student/teacher details
- [x] T033 [US6] Create master admin certifications list screen at `app/(master-admin)/certifications/index.tsx` — FlashList of all certifications using `useAllCertifications`, filter bar (program picker, type picker, status picker), CertificationCard items, pull-to-refresh, navigates to detail
- [x] T034 [US6] Create master admin certification detail screen at `app/(master-admin)/certifications/[id].tsx` — shows full certification details using `useCertificationDetail`, Revoke button (with BottomSheet for reason input) for issued certs using `useRevokeCertification`, read-only view of revocation details for already-revoked certs

**Checkpoint**: Master admin oversight fully functional (QS-13, QS-16 testable)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Notifications, refinements, and validation across all stories

- [x] T035 Extend send-notification edge function in `supabase/functions/send-notification/index.ts` — add 6 new DIRECT_CATEGORIES: `certification_recommended` (→ supervisor), `certification_supervisor_approved` (→ program admin), `certification_returned` (→ teacher), `certification_issued` (→ student), `certification_rejected` (→ teacher + supervisor), `certification_revoked` (→ student + teacher + program admin) — add recipient lookup and bilingual message builder for each category per FR-007
- [x] T036 Add notification invocations to certification workflow screens — after successful recommend (T012), review (T019), issue/reject (T025), revoke (T034) mutations, call `supabase.functions.invoke('send-notification', { body: { type: '<category>', ... } })` with appropriate payload
- [x] T037 [P] Add pull-to-refresh RefreshControl to all certification list screens: supervisor queue (T018), program admin queue (T024), student certificates (T029), master admin list (T033)
- [x] T038 [P] Add ErrorState with retry to all certification list screens and detail screens that don't already have it
- [x] T039 Update barrel export in `src/features/certifications/index.ts` with all new hooks and components added in Phases 3-8
- [x] T040 Validate quickstart scenarios QS-1 through QS-17 per `specs/008-certifications/quickstart.md` — document any deviations or issues found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 — no other story dependencies
- **US2 (Phase 4)**: Depends on Phase 2 + US1 (needs recommendation data to review)
- **US3 (Phase 5)**: Depends on Phase 2 + US2 (needs supervisor-approved data to issue)
- **US4 (Phase 6)**: Depends on Phase 2 + US3 (needs issued certificates to display)
- **US5 (Phase 7)**: Depends on Phase 2 + US3 (needs issued certificates to verify)
- **US6 (Phase 8)**: Depends on Phase 2 (can start after foundational, but benefits from US3 test data)
- **Polish (Phase 9)**: Depends on all story phases being complete

### Within Each User Story

- Hooks before screens (screens import hooks)
- Components before screens (screens import components)
- Mutations before screens that use them
- Shared hooks created in earliest story that needs them

### Parallel Opportunities

- **Phase 2**: T006, T007, T008 can run in parallel (different files)
- **Phase 4**: T013, T014, T015, T016 can run in parallel (different hook files)
- **Phase 5**: T020, T021, T022 can run in parallel (different hook files)
- **Phase 6**: T026, T027, T028 can run in parallel (different files)
- **Phase 7 + Phase 8**: US5 and US6 can run in parallel (independent: edge function vs admin screens)
- **Phase 9**: T037, T038 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (migration + types + service + i18n)
3. Complete Phase 3: US1 — Teacher can recommend
4. **STOP and VALIDATE**: QS-1, QS-2, QS-17

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Teacher recommends) → QS-1, QS-2, QS-17
3. US2 (Supervisor reviews) → QS-3, QS-4, QS-5
4. US3 (Program admin issues) → QS-6, QS-7, QS-12, QS-15
5. US4 (Student views/shares) → QS-8, QS-9
6. US5 (Public verification) → QS-10, QS-11, QS-14
7. US6 (Master admin oversight) → QS-13, QS-16
8. Polish → notifications, refresh, errors, full QS validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Migration T003 is the largest single task — contains table, 7 RPCs, RLS, indexes, sequence, trigger
- US5 (Edge Function) and US6 (Master Admin) can be developed in parallel after US3
- Certificate image sharing (US4 T030) requires `react-native-view-shot` + `expo-sharing` installed in T001
- QR code URL uses the Supabase project URL — needs env config for the verification base URL
