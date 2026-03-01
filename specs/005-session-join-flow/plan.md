# Implementation Plan: Session Join Flow

**Branch**: `005-session-join-flow` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-session-join-flow/spec.md`

## Summary

Add the student-facing session join flow for free programs: an available-teachers browsing screen with realtime updates, queue management with push + in-app notifications, deep link routing for shared session links, and a post-session return prompt. ~80% of the infrastructure (DB schema, services, hooks, realtime subscriptions, edge functions) already exists. The remaining work is screen composition, deep link routing, daily limit enforcement, draft session expiry, in-app queue offer banner, and post-session detection.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, @gorhom/bottom-sheet 5, expo-linking, expo-notifications, react-native-reanimated 4, i18next
**Storage**: Supabase PostgreSQL (remote) — 0 new tables, 1 altered table (sessions status constraint)
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS + Android (managed Expo workflow)
**Project Type**: Mobile (React Native + Supabase backend)
**Performance Goals**: Join flow < 15 seconds end-to-end (SC-001), deep link resolve < 3 seconds (SC-004), queue notification < 10 seconds (SC-003)
**Constraints**: Meeting links hidden until draft session created (security), single active queue entry per student, daily session limit enforced before join
**Scale/Scope**: 3 new screens, ~5 new/enhanced components, ~3 new/enhanced hooks, 1 migration, 1 new edge function, i18n for EN + AR

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Single-Tenant, Program-Scoped | PASS | All queries scoped by program_id. Queue entries, sessions, availability all use program_id FK. |
| II. Role-Based Access (5 Roles) | PASS | Student-only screens under `(student)/`. RLS policies on all tables enforce role checks. |
| III. TypeScript-First, Strict Mode | PASS | All code in TypeScript strict. Supabase generated types used for DB interactions. |
| IV. Feature Colocation | PASS | Session join uses existing `src/features/sessions/`, `src/features/teacher-availability/`, `src/features/queue/`. No cross-feature imports. |
| V. Logical CSS Only (RTL/LTR) | PASS | All new components use marginStart/End, paddingStart/End, start/end positioning. |
| VI. i18n Mandatory | PASS | All user-visible strings via i18next. EN + AR translations for all new keys. |
| VII. Supabase-Native Patterns | PASS | Direct Supabase SDK in services. RLS enabled. OAuth auth. Migrations via tooling. |
| VIII. Minimal Animation | PASS | Only bottom sheet transitions and countdown timer. No heavy animations. |
| IX. External Meeting Integration | PASS | Core feature — opens external meeting links via Linking.openURL(). No in-app streaming. |

**Post-design re-check**: All principles remain satisfied. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-session-join-flow/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: codebase research findings
├── data-model.md        # Phase 1: entity documentation + migration SQL
├── quickstart.md        # Phase 1: developer setup guide
├── contracts/           # Phase 1: Supabase query contracts
│   └── supabase-queries.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
# Existing features to enhance
src/features/sessions/
├── components/
│   ├── JoinSessionFlow.tsx          # EXISTS — enhance with daily limit check
│   └── PostSessionPrompt.tsx        # NEW — post-session return card
├── hooks/
│   ├── useCreateDraftSession.ts     # EXISTS — enhance to increment daily count
│   ├── useActiveDraftSession.ts     # NEW — query active draft for student
│   └── usePostSessionDetection.ts   # NEW — AppState listener for return detection
├── services/
│   └── sessions.service.ts          # EXISTS — add getActiveDraftSession()
└── types/
    └── index.ts                     # EXISTS — no changes needed

src/features/teacher-availability/
├── components/
│   ├── AvailableTeacherCard.tsx      # EXISTS — no changes needed
│   ├── AvailableTeachersList.tsx     # EXISTS — no changes needed
│   └── NoTeachersAvailable.tsx       # EXISTS — no changes needed
├── hooks/
│   ├── useTeacherAvailability.ts     # EXISTS — no changes needed
│   └── useTeacherAvailabilityRealtime.ts  # EXISTS — no changes needed
└── services/
    └── teacher-availability.service.ts    # EXISTS — no changes needed

src/features/queue/
├── components/
│   ├── QueueStatus.tsx              # EXISTS — no changes needed
│   ├── QueueClaimPrompt.tsx         # EXISTS — no changes needed
│   ├── NoTeachersAvailable.tsx      # EXISTS — may need queue join integration
│   └── QueueOfferBanner.tsx         # NEW — in-app banner for queue offers
├── hooks/
│   ├── useQueue.ts                  # EXISTS — no changes needed
│   └── useQueueRealtime.ts          # EXISTS — no changes needed
└── services/
    └── queue.service.ts             # EXISTS — enhance joinQueue() for single-entry

src/features/notifications/
├── hooks/
│   └── useNotificationHandler.ts    # EXISTS — enhance for in-app queue banner
└── config/
    └── notification-categories.ts   # EXISTS — verify queue_available category

# New screens
app/(student)/
├── programs/
│   └── [programId]/
│       └── available-teachers.tsx   # NEW — main browsing screen
├── queue-claim.tsx                  # NEW — queue claim screen
└── session-join.tsx                 # NEW — deep link entry screen

# Migration
supabase/migrations/
└── 00006_session_join_flow.sql      # NEW — sessions status + expiry function

# Edge function
supabase/functions/
└── expire-draft-sessions/
    └── index.ts                     # NEW — scheduled draft expiry

# i18n
src/i18n/locales/
├── en.json                          # ENHANCE — add session-join keys
└── ar.json                          # ENHANCE — add Arabic translations
```

**Structure Decision**: Follows existing feature colocation pattern. New code integrates into existing `src/features/sessions/`, `src/features/queue/`, and `src/features/notifications/` directories. New screens placed under `app/(student)/` per Expo Router role-based routing convention. No new feature directories needed.

## Complexity Tracking

No constitution violations. All design decisions align with existing patterns.
