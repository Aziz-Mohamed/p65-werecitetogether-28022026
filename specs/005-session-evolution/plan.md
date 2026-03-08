# Implementation Plan: Session Logging Evolution

**Branch**: `005-session-evolution` | **Date**: 2026-03-06 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-session-evolution/spec.md`

## Summary

Extend the existing sessions system with three additive capabilities: (1) optional program context via nullable `program_id` FK, (2) draft-then-submit workflow via nullable `status` column, and (3) post-session voice memos via a new `session_voice_memos` table + Supabase Storage bucket. All changes are backward-compatible — existing sessions continue to work unchanged. Voice memos use `expo-av` for recording/playback with a custom reanimated waveform. Two pg_cron jobs handle automated cleanup (30-day memo expiration, 7-day draft deletion).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, expo-av (NEW), react-native-reanimated 4, react-hook-form 7 + zod 4, i18next, @gorhom/bottom-sheet 5
**Storage**: Supabase PostgreSQL (remote) — 1 altered table (sessions), 1 new table (session_voice_memos), 1 altered table (notification_preferences), 1 new Storage bucket (voice-memos)
**Testing**: Manual testing via quickstart scenarios. Jest + RNTL for unit tests on hooks/services.
**Target Platform**: iOS + Android (Expo managed workflow)
**Project Type**: Mobile app (React Native)
**Performance Goals**: Voice memo upload < 5s for 2-min recording, playback start < 2s, draft save < 2s
**Constraints**: Max 2-min recording (~250KB), 30-day memo retention, 7-day draft retention, offline recording with queued upload
**Scale/Scope**: ~10,000 sessions/month, ~1.2GB rolling voice memo storage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | New `program_id` FK on sessions is nullable (backward compat). New `session_voice_memos` table does not need program_id directly — program context comes from the parent session. Legacy `school_id` on sessions preserved. |
| II. Role-Based Access (7 Roles) | PASS | RLS policies scope draft visibility to teachers, voice memo access by role. Supervisors/program_admins access via program scoping. |
| III. TypeScript-First, Strict Mode | PASS | All new types defined as interfaces. Supabase types will need `as any` casts until types are regenerated. |
| IV. Feature Colocation | PASS | Voice memo components, hooks, services, types colocated under `src/features/voice-memos/`. Session extensions stay in `src/features/sessions/`. No cross-feature internal imports. |
| V. Logical CSS Only (RTL/LTR) | PASS | All new UI uses paddingStart/paddingEnd, marginStart/marginEnd. Waveform renders bidirectionally. |
| VI. i18n Mandatory | PASS | All new strings in en.json + ar.json. No hardcoded text. |
| VII. Supabase-Native Patterns | PASS | Direct SDK calls, RLS on new table, migration-first, functions with `SET search_path = public`. |
| VIII. Minimal Animation | PASS | Waveform uses reanimated for real-time metering bars. No heavy animations. |
| IX. External Meeting Integration | PASS | Voice memos are the sole exception per constitution. Stored in Supabase Storage. No streaming. |

**Post-Design Re-Check**: All gates still pass. Voice memo storage is explicitly allowed by Principle IX.

## Project Structure

### Documentation (this feature)

```text
specs/005-session-evolution/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── sessions-api.md  # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Migration
supabase/migrations/00007_session_evolution.sql

# Edge Functions
supabase/functions/cleanup-voice-memos/index.ts
supabase/functions/cleanup-drafts/index.ts

# Extended sessions feature
src/features/sessions/
├── types/sessions.types.ts          # EXTEND with program_id, status
├── services/sessions.service.ts     # EXTEND with draft CRUD, program filter
├── hooks/useSessions.ts             # EXTEND with draft/program filters
├── hooks/useDraftSessions.ts        # NEW — draft-specific queries
└── components/
    ├── DraftBadge.tsx               # NEW — visual draft indicator
    └── ProgramChip.tsx              # NEW — program display on cards

# New voice memos feature
src/features/voice-memos/
├── types/voice-memo.types.ts        # NEW
├── services/voice-memo.service.ts   # NEW — upload, get URL, metadata
├── services/upload-queue.ts         # NEW — AsyncStorage retry queue for failed uploads
├── hooks/
│   ├── useVoiceMemo.ts              # NEW — query memo metadata
│   ├── useUploadVoiceMemo.ts        # NEW — upload mutation
│   └── useAudioRecorder.ts          # NEW — expo-av recording hook
├── components/
│   ├── VoiceMemoRecorder.tsx        # NEW — record UI with waveform
│   ├── VoiceMemoPlayer.tsx          # NEW — playback UI with seek/speed
│   ├── VoiceMemoPrompt.tsx          # NEW — post-session "Record?" prompt
│   └── MicIndicator.tsx             # NEW — mic icon for session cards
└── index.ts

# Extended session screens
app/(teacher)/(tabs)/sessions.tsx    # EXTEND — draft section, program chips
app/(teacher)/sessions/[id].tsx      # EXTEND — voice memo player, draft editing
app/(student)/sessions/[id].tsx      # EXTEND — voice memo player
app/(parent)/sessions/[id].tsx       # EXTEND — voice memo player

# i18n
src/i18n/en.json                     # EXTEND — voice memo + draft keys
src/i18n/ar.json                     # EXTEND — voice memo + draft keys
```

**Structure Decision**: Follows existing feature colocation pattern. Voice memos are a separate feature module (not inside sessions) because they have independent types, services, hooks, and components. Session extensions (program_id, status) stay in the sessions feature since they modify existing entities.

## Complexity Tracking

No constitution violations to justify.
