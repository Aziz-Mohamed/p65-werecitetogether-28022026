# Implementation Plan: Himam Quranic Marathon Events

**Branch**: `009-himam` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-himam/spec.md`

## Summary

Implement the Himam Quranic Marathon (Program 8) — a weekly Saturday event (Fajr-to-Fajr, 24 hours) where paired students recite assigned juz together via external meeting links. The feature includes event auto-generation, student registration with track/juz selection, automatic partner pairing, real-time progress tracking, and supervisor management. Three new database tables, ~6 RPC functions, 2 Edge Functions, 3 pg_cron jobs, and screens for students and supervisors.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) + Deno (Edge Functions)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, react-hook-form 7 + zod 4, i18next + react-i18next, FlashList 2, @gorhom/bottom-sheet 5
**Storage**: Supabase PostgreSQL (remote) — 3 new tables, 1 altered Edge Function, ~6 RPC functions, 3 pg_cron jobs, 2 new Edge Functions
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS 15+ / Android (Expo managed workflow)
**Project Type**: Mobile (React Native / Expo)
**Performance Goals**: Pairing completes in <30s for all registrations per event
**Constraints**: Fixed timezone (Makkah UTC+3), external meeting links only (no streaming), bilingual AR/EN
**Scale/Scope**: ~50-200 participants per weekly event, 5 tracks, ~8 new screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | `himam_events` is program-global (only one Himam program); registrations/progress scoped via event → program chain. No `school_id` usage. |
| II. Role-Based Access (7 Roles) | PASS | Students register/track progress. Supervisors manage events/pairings. RLS enforces role checks. |
| III. TypeScript-First, Strict Mode | PASS | All code in TypeScript strict mode. Supabase-generated types used. |
| IV. Feature Colocation | PASS | All Himam code in `src/features/himam/` with hooks, services, types, components. |
| V. Logical CSS Only (RTL/LTR) | PASS | All styles use `paddingStart/End`, `marginStart/End`, `start/end`. |
| VI. i18n Mandatory | PASS | All strings through i18next. Both `en.json` and `ar.json` maintained. |
| VII. Supabase-Native Patterns | PASS | Supabase Auth, RLS on all tables, migrations via tooling, `SET search_path = public`. |
| VIII. Minimal Animation | PASS | Progress bar fill animation only. No heavy animations. |
| IX. External Meeting Integration | PASS | Partners use profile meeting links. No in-app streaming. |

**Gate result**: ALL PASS. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/009-himam/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── himam-api.md     # RPC & Edge Function contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/features/himam/
├── components/
│   ├── EventCard.tsx              # Event summary card (upcoming/past)
│   ├── TrackSelector.tsx          # Track selection (3/5/10/15/30 juz)
│   ├── JuzPicker.tsx              # Multi-select juz picker (1-30)
│   ├── TimeSlotSelector.tsx       # Prayer-time block multi-select
│   ├── PartnerCard.tsx            # Partner info display with meeting link
│   ├── ProgressTracker.tsx        # Juz completion list with progress bar
│   └── TrackStatsCard.tsx         # Per-track completion stats (supervisor)
├── hooks/
│   ├── useUpcomingEvent.ts        # Query: next upcoming event
│   ├── useMyRegistration.ts       # Query: current user's registration for event
│   ├── useEventRegistrations.ts   # Query: all registrations for event (supervisor)
│   ├── useHimamProgress.ts        # Query: progress records for registration
│   ├── useHimamHistory.ts         # Query: student's past event participation
│   ├── useEventStats.ts           # Query: completion stats per track (supervisor)
│   ├── useRegisterForEvent.ts     # Mutation: register for event
│   ├── useCancelRegistration.ts   # Mutation: cancel registration
│   ├── useMarkJuzComplete.ts      # Mutation: mark juz as completed
│   └── useRunPairing.ts           # Mutation: trigger pairing (supervisor)
├── services/
│   └── himam.service.ts           # Singleton service wrapping Supabase RPCs/queries
├── types/
│   └── himam.types.ts             # TypeScript interfaces and union types
└── index.ts                       # Barrel exports

app/(student)/
├── himam/
│   ├── index.tsx                  # Event discovery & registration
│   └── [eventId]/
│       └── progress.tsx           # Marathon day progress tracking
│   └── history.tsx                # Past event participation history

app/(supervisor)/
├── himam/
│   ├── index.tsx                  # Event management list
│   └── [eventId]/
│       ├── registrations.tsx      # View registrations by track
│       └── pairings.tsx           # View/adjust pairings + stats

supabase/migrations/
└── 00011_himam.sql                # Tables, RLS, RPC functions, triggers, pg_cron

supabase/functions/
├── generate-himam-events/
│   └── index.ts                   # Auto-generate weekly events (cron-invoked)
└── generate-himam-pairings/
    └── index.ts                   # Batch pairing algorithm (cron or supervisor-invoked)

src/i18n/
├── en.json                        # Add himam.* keys
└── ar.json                        # Add himam.* keys (Arabic)
```

**Structure Decision**: Follows established feature colocation pattern (Constitution IV). New `src/features/himam/` directory with standard subdirectories. Student and supervisor screens added to existing route groups. Migration follows sequential numbering (00011).

## Complexity Tracking

No violations to justify. All gates pass.
