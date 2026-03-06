# Implementation Plan: Ratings & Queue System

**Branch**: `006-ratings-queue` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-ratings-queue/spec.md`

## Summary

Add teacher ratings (1-5 stars, feedback tags, comments) with aggregate statistics, a free program student queue with real-time position updates and push notification cascading, fair usage daily session tracking, and supply-side teacher demand notifications. All new tables are program-scoped. Ratings use database triggers for aggregate stat materialization. Queue uses Supabase Realtime for live position updates and Edge Functions for cascade processing.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) + Deno (Edge Functions)
**Primary Dependencies**: React Native 0.81.5, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, react-hook-form 7 + zod 4, i18next + react-i18next, FlashList 2, Ionicons, react-native-reanimated 4
**Storage**: Supabase PostgreSQL (remote) — 5 new tables, 1 altered table, ~8 new RPC functions, 3 triggers, 1 new Edge Function
**Testing**: Jest + React Native Testing Library (unit/integration)
**Target Platform**: iOS + Android (Expo managed workflow)
**Project Type**: Mobile (React Native / Expo)
**Performance Goals**: Rating submission < 10s UX (SC-001), queue notification < 5s (SC-004), position update < 3s (SC-005), stats update < 10s (SC-010)
**Constraints**: Offline-tolerant rating submission (queue locally, retry), real-time queue positions via Supabase Realtime, push notifications via existing Expo Push API infrastructure
**Scale/Scope**: ~20 screens/components across 2 feature modules, 1 migration file, 1 Edge Function, extension of send-notification + realtime subscriptions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | ✅ PASS | All 5 new tables include `program_id` FK. RLS uses `get_user_programs()`. |
| II. Role-Based Access (7 Roles) | ✅ PASS | Ratings: students submit, teachers see aggregate, supervisors see individual. Queue: students join, teachers trigger. Admins get alerts. |
| III. TypeScript-First, Strict Mode | ✅ PASS | All code in TypeScript strict. `as any` casts only for tables not yet in generated types (regenerate after migration). |
| IV. Feature Colocation | ✅ PASS | Two new feature modules: `src/features/ratings/`, `src/features/queue/`. No cross-feature imports. |
| V. Logical CSS Only | ✅ PASS | All layout uses `paddingStart`/`paddingEnd`, `marginStart`/`marginEnd`. |
| VI. i18n Mandatory | ✅ PASS | All user-visible strings through i18n. Feedback tags have en/ar keys. |
| VII. Supabase-Native Patterns | ✅ PASS | RLS on all tables. Supabase JS SDK direct. Migrations via tooling. Functions include `SET search_path = public`. |
| VIII. Minimal Animation | ✅ PASS | Star rating tap feedback only (reanimated scale). No heavy animations. |
| IX. External Meeting Integration | ✅ PASS | Queue claim deep-links to teacher's meeting URL. No streaming. |

**Gate result**: All principles pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/006-ratings-queue/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── ratings-rpc.md   # Rating RPC function contracts
│   └── queue-rpc.md     # Queue RPC function contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/features/ratings/
├── components/
│   ├── RatingPrompt.tsx           # Bottom sheet: star + tags + comment form
│   ├── StarRating.tsx             # Tappable 1-5 star input
│   ├── FeedbackTags.tsx           # Selectable tag chips (positive + constructive)
│   ├── TeacherRatingBadge.tsx     # Inline avg + count on teacher cards
│   ├── RatingStatsCard.tsx        # Teacher's own stats: avg, distribution, trend, tags
│   └── SupervisorReviewList.tsx   # Individual reviews with student names + exclusion controls
├── hooks/
│   ├── useSubmitRating.ts         # TanStack mutation for rating submission
│   ├── useTeacherRatingStats.ts   # TanStack query for teacher's own stats
│   ├── useTeacherReviews.ts       # TanStack query for supervisor review list
│   ├── useRatingPrompt.ts         # Logic: can this session be rated?
│   └── useExcludeRating.ts        # TanStack mutation for supervisor exclusion/restore
├── services/
│   └── ratings.service.ts         # Supabase SDK calls for all rating operations
├── types/
│   └── ratings.types.ts           # Rating, RatingStats, FeedbackTag types
├── constants/
│   └── feedback-tags.ts           # Hardcoded positive + constructive tag definitions with i18n keys
└── index.ts                       # Barrel exports

src/features/queue/
├── components/
│   ├── QueueStatus.tsx            # Position display + estimated wait time
│   ├── JoinQueueButton.tsx        # "Notify me" button (replaces available-now when empty)
│   ├── FairUsageNotice.tsx        # "You've had N sessions today" message
│   └── DemandIndicator.tsx        # Teacher dashboard: "N students waiting"
├── hooks/
│   ├── useQueuePosition.ts        # TanStack query + Realtime subscription
│   ├── useJoinQueue.ts            # TanStack mutation
│   ├── useLeaveQueue.ts           # TanStack mutation
│   ├── useDailySessionCount.ts    # TanStack query for fair usage display
│   └── useProgramDemand.ts        # TanStack query for teacher demand indicator
├── services/
│   └── queue.service.ts           # Supabase SDK calls for all queue operations
├── types/
│   └── queue.types.ts             # QueueEntry, QueueStatus, DailyCount types
└── index.ts                       # Barrel exports

supabase/
├── migrations/
│   └── 00008_ratings_queue.sql    # All tables, RPC functions, triggers, RLS
└── functions/
    └── queue-processor/
        └── index.ts               # Queue cascade: 3-min timeout → next student notification
```

**Structure Decision**: Two colocated feature modules (`ratings` and `queue`) under `src/features/`. Queue is separated from ratings because it has independent lifecycle (ephemeral entries vs. persistent ratings) and different real-time requirements. Shared dependency: both use `program_id` scoping and push notification infrastructure.

## Complexity Tracking

No constitution violations to justify.
