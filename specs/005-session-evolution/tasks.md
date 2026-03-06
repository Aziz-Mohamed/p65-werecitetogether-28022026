# Tasks: Session Logging Evolution

**Input**: Design documents from `/specs/005-session-evolution/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies and create feature directory structure

- [x] T001 Install expo-av dependency via `npx expo install expo-av`
- [x] T002 [P] Create voice-memos feature directory structure: `src/features/voice-memos/types/`, `src/features/voice-memos/services/`, `src/features/voice-memos/hooks/`, `src/features/voice-memos/components/`
- [x] T003 [P] Create sessions components directory: `src/features/sessions/components/`

---

## Phase 2: Foundational (Database + Infrastructure)

**Purpose**: Migration, storage bucket, RLS policies, RPC functions, pg_cron jobs — MUST complete before any user story

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create migration file `supabase/migrations/00007_session_evolution.sql` with: ALTER TABLE sessions ADD COLUMN program_id UUID REFERENCES programs(id) ON DELETE SET NULL, ADD COLUMN status TEXT CHECK (status IN ('draft', 'completed')). Add indexes on program_id (partial WHERE NOT NULL) and status (partial WHERE = 'draft'). Per data-model.md
- [x] T005 Add to migration `supabase/migrations/00007_session_evolution.sql`: CREATE TABLE session_voice_memos with columns id (UUID PK), session_id (UUID UNIQUE FK → sessions ON DELETE CASCADE), teacher_id (UUID FK → profiles ON DELETE CASCADE), storage_path (TEXT NOT NULL), duration_seconds (INTEGER NOT NULL CHECK 1-120), file_size_bytes (INTEGER NOT NULL CHECK > 0), is_expired (BOOLEAN NOT NULL DEFAULT false), expires_at (TIMESTAMPTZ NOT NULL), created_at (TIMESTAMPTZ NOT NULL DEFAULT now()). Add indexes per data-model.md
- [x] T006 Add to migration `supabase/migrations/00007_session_evolution.sql`: ALTER TABLE notification_preferences ADD COLUMN voice_memo_received BOOLEAN DEFAULT true, ADD COLUMN draft_expired BOOLEAN DEFAULT true
- [x] T007 Add to migration `supabase/migrations/00007_session_evolution.sql`: Create private storage bucket 'voice-memos' with file_size_limit 512000 and allowed_mime_types ['audio/mp4', 'audio/m4a', 'audio/aac', 'audio/mpeg']. Add storage policies: teacher upload (INSERT for authenticated, path matches own session), authenticated SELECT (via signed URLs), teacher DELETE (own memos), service role DELETE (for cleanup)
- [x] T008 Add to migration `supabase/migrations/00007_session_evolution.sql`: RLS policies for sessions — draft visibility (teachers see own drafts, students/parents/supervisors filter out drafts via WHERE status IS DISTINCT FROM 'draft' OR teacher_id = auth.uid()), program-scoped read for supervisors/program_admins (WHERE program_id = ANY(get_user_programs()))
- [x] T009 Add to migration `supabase/migrations/00007_session_evolution.sql`: RLS policies for session_voice_memos — teacher SELECT/INSERT own, student SELECT for own sessions (not drafts), parent SELECT via students.parent_id, supervisor/program_admin SELECT for assigned programs, master_admin SELECT all. Per data-model.md
- [x] T010 Add to migration `supabase/migrations/00007_session_evolution.sql`: CREATE FUNCTION get_voice_memo_url(p_session_id UUID) that verifies caller access, checks memo exists and is not expired, generates signed URL (1-hour expiry) from storage. SET search_path = public. Per contracts SE-006
- [x] T011 Add to migration `supabase/migrations/00007_session_evolution.sql`: pg_cron job 'cleanup-expired-voice-memos' at '0 3 * * *' (daily 3:00 AM UTC) calling Edge Function cleanup-voice-memos. pg_cron job 'cleanup-draft-sessions' at '30 3 * * *' (daily 3:30 AM UTC) calling Edge Function cleanup-drafts. Enable realtime on session_voice_memos
- [x] T012 [P] Add bilingual i18n keys for sessions evolution (program, draft, voice memo) to `src/i18n/en.json` under keys: sessions.program, sessions.draft, sessions.draftBadge, sessions.saveDraft, sessions.submitSession, voiceMemo.record, voiceMemo.skip, voiceMemo.send, voiceMemo.reRecord, voiceMemo.preview, voiceMemo.uploading, voiceMemo.uploadSuccess, voiceMemo.uploadFailed, voiceMemo.expired, voiceMemo.expiredWithDate, voiceMemo.availableFor, voiceMemo.addVoiceMemo, voiceMemo.recordPrompt, voiceMemo.timeRemaining, voiceMemo.speed, voiceMemo.micPermissionDenied, voiceMemo.openSettings, voiceMemo.playbackSpeed, notification.voiceMemoReceived, notification.draftsExpired
- [x] T013 [P] Add Arabic translations for all keys added in T012 to `src/i18n/ar.json`

**Checkpoint**: Database schema, storage, RLS, and i18n ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Program Context (Priority: P1) MVP

**Goal**: Teachers can optionally associate a session with a program. Program name displayed on session detail and list views.

**Independent Test**: Sign in as teacher assigned to a program. Create session, select program, submit. Verify program_id saved. View detail — program name displayed. Create session without program — still works.

### Implementation for User Story 1

- [x] T014 [US1] Extend session types in `src/features/sessions/types/sessions.types.ts`: add program_id (string | null) to Session interface, add program_id to CreateSessionInput, add programId to SessionFilters, add SessionWithProgram type that includes joined program name/name_ar
- [x] T015 [US1] Add getTeacherPrograms() method to `src/features/sessions/services/sessions.service.ts` that queries program_roles for teacher's assigned programs with program name/name_ar (per contracts SE-008)
- [x] T016 [US1] Extend createSession() in `src/features/sessions/services/sessions.service.ts` to accept and pass program_id to the insert. Extend getSessions() to accept programId filter and join programs table for name. Extend getSessionById() to join programs for name
- [x] T017 [P] [US1] Create ProgramChip component in `src/features/sessions/components/ProgramChip.tsx` — displays localized program name as a subtle chip/tag. Accepts programName and programNameAr props. Uses useLocalizedField for bilingual display
- [x] T018 [US1] Add useTeacherPrograms() hook in `src/features/sessions/hooks/useTeacherPrograms.ts` — TanStack Query wrapper for getTeacherPrograms(). Query key: ['teacher-programs']
- [x] T019 [US1] Extend the session creation flow in `src/features/scheduling/components/CreateSessionSheet.tsx` — add a program chip row above class selection. Query teacher programs via useTeacherPrograms(). Auto-select if only one program (FR-028). Pass program_id to createSession. Program selection is optional
- [x] T020 [US1] Extend teacher session detail screen `app/(teacher)/sessions/[id].tsx` — display ProgramChip with program name when session has program_id. Handle "Program unavailable" for deactivated/deleted programs
- [x] T021 [P] [US1] Extend student session detail screen `app/(student)/sessions/[id].tsx` — display ProgramChip with program name when session has program_id
- [x] T022 [P] [US1] Extend parent session detail screen `app/(parent)/sessions/[id].tsx` — display ProgramChip with program name when session has program_id
- [x] T023 [US1] Extend teacher sessions list `app/(teacher)/(tabs)/sessions.tsx` — show ProgramChip on each session card that has a program_id

**Checkpoint**: Sessions can be created with program context. Program name visible on detail and list views. Sessions without programs still work.

---

## Phase 4: User Story 2 — Draft Workflow (Priority: P2)

**Goal**: Teachers can save sessions as drafts with partial data, resume editing, and submit later. Drafts visible only to teacher, auto-deleted after 7 days with batched notification.

**Independent Test**: Create session, save as draft (student + one score). Navigate away. Return to list — draft visible with badge. Tap draft — data pre-filled. Add remaining scores, submit. Draft becomes completed session visible to student.

**Depends on**: US1 (program_id in CreateSessionInput)

### Implementation for User Story 2

- [x] T024 [US2] Extend session types in `src/features/sessions/types/sessions.types.ts`: add status ('draft' | 'completed' | null) to Session interface, add UpdateDraftInput interface (per contracts SE-002)
- [x] T025 [US2] Extend sessions service in `src/features/sessions/services/sessions.service.ts`: add updateDraft(sessionId, input) method (per contracts SE-002), add deleteDraft(sessionId) method (per contracts SE-004). Modify createSession to accept status parameter defaulting to 'completed'
- [x] T026 [US2] Create useDraftSessions hook in `src/features/sessions/hooks/useDraftSessions.ts` — query teacher's draft sessions (status = 'draft', teacher_id = current user). Query key: ['sessions', 'drafts']. Also add useUpdateDraft() and useDeleteDraft() mutation hooks that invalidate ['sessions'] queries
- [x] T027 [P] [US2] Create DraftBadge component in `src/features/sessions/components/DraftBadge.tsx` — small badge with "Draft" text, muted background color per FR-006. Uses i18n key sessions.draftBadge
- [x] T028 [US2] Extend CreateSessionSheet in `src/features/scheduling/components/CreateSessionSheet.tsx` — add "Save Draft" button alongside existing submit button. When Save Draft tapped: call createSession with status='draft'. Scores are optional for drafts but student_id is required
- [x] T029 [US2] Create draft editing screen/flow in `app/(teacher)/sessions/[id].tsx` — when session.status === 'draft', render editable form (pre-filled with existing data) instead of read-only detail. Show "Submit" and "Delete Draft" buttons. Submit calls updateDraft with status='completed'. Delete calls deleteDraft
- [x] T030 [US2] Extend teacher sessions list `app/(teacher)/(tabs)/sessions.tsx` — add "Drafts" section at the top when drafts exist. Render draft cards with DraftBadge and muted card background. Tapping a draft navigates to the edit flow (T029)
- [x] T031 [US2] Create Edge Function `supabase/functions/cleanup-drafts/index.ts` — query drafts older than 7 days grouped by teacher_id, delete them, send batched push notification per teacher with count via Expo Push API (per contracts EF-002). Check notification_preferences.draft_expired before sending. Use service role key

**Checkpoint**: Draft workflow complete. Drafts save, resume, submit, auto-delete with notification. Students cannot see drafts.

---

## Phase 5: User Story 3 — Voice Memo Recording & Playback (Priority: P3)

**Goal**: Teachers record up to 2-minute voice memos after submitting sessions. Students play them back with seek/speed controls. Memos expire after 30 days with metadata preserved.

**Independent Test**: Submit session → record voice memo (waveform visible, countdown from 2:00) → preview → send → verify upload. Sign in as student → open session → play voice memo with controls.

**Depends on**: US2 (session status must be 'completed' to attach memo)

### Implementation for User Story 3

- [x] T032 [P] [US3] Create voice memo types in `src/features/voice-memos/types/voice-memo.types.ts` — VoiceMemo interface (id, session_id, teacher_id, storage_path, duration_seconds, file_size_bytes, is_expired, expires_at, created_at), UploadVoiceMemoInput, VoiceMemoUrl (url, duration_seconds, created_at, is_expired)
- [x] T033 [P] [US3] Create voice memo service in `src/features/voice-memos/services/voice-memo.service.ts` — uploadMemo(sessionId, fileUri, durationSeconds): uploads to storage then inserts metadata (per contracts SE-005, with client-side orphan cleanup on metadata failure). getMemoUrl(sessionId): calls get_voice_memo_url RPC (per contracts SE-006). getMemoMetadata(sessionId): queries session_voice_memos (per contracts SE-007). Include canAttachMemo(session) helper: checks session is completed, < 24h old, no existing memo
- [x] T034 [US3] Create useAudioRecorder hook in `src/features/voice-memos/hooks/useAudioRecorder.ts` — wraps expo-av Audio.Recording. Provides: startRecording(), stopRecording(), cancelRecording(). Exposes state: isRecording, durationMs, meteringLevels (array of dBFS values from onRecordingStatusUpdate for waveform), fileUri. Auto-stops at 120 seconds. Handles microphone permission request (FR-024). Configures AAC-LC mono 64kbps recording preset
- [x] T035 [US3] Create useVoiceMemo hook in `src/features/voice-memos/hooks/useVoiceMemo.ts` — TanStack Query wrapper for getMemoMetadata(sessionId). Query key: ['voice-memo', sessionId]. Enabled only when sessionId is provided
- [x] T036 [US3] Create useUploadVoiceMemo hook in `src/features/voice-memos/hooks/useUploadVoiceMemo.ts` — mutation wrapper for uploadMemo(). Invalidates ['voice-memo', sessionId] and ['sessions'] on success. Returns upload progress state
- [x] T037 [US3] Create upload retry queue in `src/features/voice-memos/services/upload-queue.ts` — store failed upload attempts (sessionId, fileUri, durationSeconds) in AsyncStorage under key 'voice-memo-upload-queue'. On app foreground (AppState change to 'active'), check queue and retry pending uploads via uploadMemo(). Remove from queue on success. Expose useUploadQueue() hook that returns pending count and retryAll() function
- [x] T038 [US3] Create VoiceMemoRecorder component in `src/features/voice-memos/components/VoiceMemoRecorder.tsx` — uses useAudioRecorder. Shows: press-and-hold record button, animated waveform bars (react-native-reanimated driven by meteringLevels), countdown timer from 2:00, warning at 0:15. After recording: preview mode with play/pause, "Send" and "Re-record" buttons. Accessibility labels on all controls (FR-027). Handles permission denied state (FR-024)
- [x] T039 [US3] Create VoiceMemoPlayer component in `src/features/voice-memos/components/VoiceMemoPlayer.tsx` — uses expo-av Audio.Sound for playback. Shows: play/pause button, seek bar (Slider), playback speed toggle (1x/1.25x/1.5x cycle button), current time / total time display. Handles audio interruptions by pausing (FR-026). Shows "Voice memo expired" with date and duration when is_expired=true. Accessibility labels on all controls (FR-027). Caches audio file locally via expo-file-system with 7-day expiry (FR-017)
- [x] T040 [US3] Create VoiceMemoPrompt component in `src/features/voice-memos/components/VoiceMemoPrompt.tsx` — shown after session submission. Displays "Record a voice memo for [student name]?" with record button and "Skip" dismiss. Uses VoiceMemoRecorder when recording starts. On "Send": calls useUploadVoiceMemo, shows inline progress bar, toast on success/failure (FR-012). On "Skip": closes and does not reappear for this session
- [x] T041 [P] [US3] Create MicIndicator component in `src/features/voice-memos/components/MicIndicator.tsx` — small microphone icon (Ionicons 'mic') displayed on session cards when voice memo exists. Accepts hasVoiceMemo boolean prop
- [x] T042 [US3] Create feature barrel export in `src/features/voice-memos/index.ts` — export all public components (VoiceMemoRecorder, VoiceMemoPlayer, VoiceMemoPrompt, MicIndicator), hooks (useVoiceMemo, useUploadVoiceMemo, useAudioRecorder, useUploadQueue), and types
- [x] T043 [US3] Extend teacher session detail `app/(teacher)/sessions/[id].tsx` — add VoiceMemoPlayer when session has a voice memo (FR-025). Show VoiceMemoPrompt after session creation/submission if session is completed and < 24h old and has no memo
- [x] T044 [US3] Extend student session detail `app/(student)/sessions/[id].tsx` — add VoiceMemoPlayer below scores section when session has a voice memo. Show "Available for 30 days" notice (FR-016). Show "Voice memo expired" with date/duration when expired
- [x] T045 [P] [US3] Extend parent session detail `app/(parent)/sessions/[id].tsx` — add VoiceMemoPlayer below scores section (same as student view)
- [x] T046 [US3] Extend session cards in teacher and student list views (`app/(teacher)/(tabs)/sessions.tsx`, `app/(student)/sessions/index.tsx`) — add MicIndicator to session cards when voice memo exists. Requires extending session query to include voice memo existence (left join or subquery)
- [x] T047 [US3] Create Edge Function `supabase/functions/cleanup-voice-memos/index.ts` — query session_voice_memos where expires_at <= now() AND is_expired = false, delete storage files via supabase.storage.from('voice-memos').remove(), update is_expired = true. Use service role key (per contracts EF-001)
- [x] T048 [US3] Extend send-notification Edge Function `supabase/functions/send-notification/index.ts` — add handler for session_voice_memos INSERT events (voice_memo_attached category). Lookup student from session, check notification_preferences.voice_memo_received, send bilingual push notification with deep link to session detail (per contracts PN-001)

**Checkpoint**: Voice memo recording, upload, playback, expiration, and notifications all working. Mic icon on cards. Cleanup Edge Function ready.

---

## Phase 6: User Story 4 — Retroactive Voice Memo Attachment (Priority: P4)

**Goal**: Teachers can add voice memos to completed sessions within 24 hours of creation, even if they skipped the initial prompt.

**Independent Test**: View completed session from today (no memo). Tap "Add voice memo". Record, preview, send. Memo appears. View session from 25+ hours ago — no "Add" button.

**Depends on**: US3 (VoiceMemoRecorder, upload service)

### Implementation for User Story 4

- [x] T049 [US4] Extend teacher session detail `app/(teacher)/sessions/[id].tsx` — when viewing a completed session with no voice memo and created_at < 24 hours ago, show "Add voice memo" button. Tapping opens VoiceMemoRecorder inline. When session is > 24h old, hide the button. When session already has a memo, show VoiceMemoPlayer only (no replace option per FR-019). Use canAttachMemo() helper from voice memo service (created in T033)

**Checkpoint**: Teachers can retroactively attach voice memos within 24h. All 4 user stories complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, accessibility, cleanup

- [x] T050 Verify backward compatibility: existing sessions (no program_id, no status) display and function identically in teacher, student, and parent views. Test with sessions created before migration
- [x] T051 Verify RLS policies: test that students cannot see drafts, supervisors can access voice memos in their programs but not other programs, master_admin sees everything. Test draft deep link returns 404 for non-owners
- [x] T052 [P] Verify accessibility: all voice memo controls have VoiceOver/TalkBack labels. Recording state changes announced. Seek bar and speed toggle operable with assistive technology
- [x] T053 [P] Verify RTL layout: all new UI components render correctly in Arabic (RTL). Waveform, seek bar, program chips, draft badges all layout properly with paddingStart/paddingEnd
- [x] T054 Run quickstart.md validation: execute all 7 scenarios from `specs/005-session-evolution/quickstart.md` and verify the checklist items pass
- [x] T055 Verify upload retry queue: kill app during voice memo upload, reopen, verify queued upload retries automatically on foreground

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 (Phase 4)**: Depends on US1 (extends CreateSessionInput with program_id)
- **US3 (Phase 5)**: Depends on US2 (needs session status to verify 'completed')
- **US4 (Phase 6)**: Depends on US3 (reuses VoiceMemoRecorder, upload service)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependencies on other stories
- **US2 (P2)**: Requires US1 types (program_id in CreateSessionInput) — can start after US1 T014 completes
- **US3 (P3)**: Requires US2 status field — can start after US2 T024 completes. Voice memo service is independent
- **US4 (P4)**: Requires US3 components — must wait for US3 completion

### Within Each User Story

- Types before services
- Services before hooks
- Hooks before components
- Components before screen integration
- Screen integration before list view updates

### Parallel Opportunities

**Phase 2 (Foundational)**: T012 and T013 (i18n) can run in parallel with T004-T011 (migration)

**US1**: T017 (ProgramChip) and T018 (hook) can run in parallel once T015-T016 (service) complete. T021 (student detail) and T022 (parent detail) can run in parallel

**US3**: T032 (types) and T033 (service) can run in parallel. T041 (MicIndicator) can run in parallel with T038-T040 (recorder/player/prompt). T044 (student detail) and T045 (parent detail) can run in parallel

---

## Parallel Example: User Story 3

```bash
# Step 1 — Types and service (parallel):
Task T032: "Create voice memo types in src/features/voice-memos/types/voice-memo.types.ts"
Task T033: "Create voice memo service in src/features/voice-memos/services/voice-memo.service.ts"

# Step 2 — Hooks (sequential, depends on types/service):
Task T034: "Create useAudioRecorder hook"
Task T035: "Create useVoiceMemo hook"
Task T036: "Create useUploadVoiceMemo hook"
Task T037: "Create upload retry queue"

# Step 3 — Components (parallel where possible):
Task T038: "Create VoiceMemoRecorder component"
Task T039: "Create VoiceMemoPlayer component"
Task T040: "Create VoiceMemoPrompt component"
Task T041: "Create MicIndicator component" (parallel with T038-T040)

# Step 4 — Screen integration:
Task T043: "Extend teacher session detail"
Task T044: "Extend student session detail" (parallel with T045)
Task T045: "Extend parent session detail"
Task T046: "Extend session cards with mic indicator"

# Step 5 — Edge Functions:
Task T047: "Create cleanup-voice-memos Edge Function"
Task T048: "Extend send-notification Edge Function"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T013) — migration + i18n
3. Complete Phase 3: User Story 1 (T014-T023) — program context
4. **STOP and VALIDATE**: Test US1 independently — sessions with program context
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Database and infrastructure ready
2. US1 (Program Context) → Test → Deploy (MVP!)
3. US2 (Draft Workflow) → Test → Deploy
4. US3 (Voice Memo) → Test → Deploy
5. US4 (Retroactive Attachment) → Test → Deploy
6. Polish → Final validation

Each story adds value without breaking previous stories.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Migration is a single file (T004-T011 are additive sections of `00007_session_evolution.sql`)
- Edge Functions (T031, T046, T047) require Deno runtime and service role key
- `as any` casts will be needed for Supabase client calls until types are regenerated after migration
- Commit after each completed task or logical group
- Stop at any checkpoint to validate story independently
