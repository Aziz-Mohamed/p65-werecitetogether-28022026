# Implementation Plan: Gamification Extension for Programs

**Branch**: `010-gamification-ext` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-gamification-ext/spec.md`

## Summary

Extend the existing sticker-based gamification system to be program-aware, add a program-scoped leaderboard, introduce 9 milestone badge types with hybrid auto-awarding (inline + pg_cron), and provide a supervisor rewards dashboard. All changes are additive — existing stickers, student_stickers, and class-based leaderboard continue to work unchanged.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) + Deno (Edge Functions)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, react-hook-form 7 + zod 4, i18next + react-i18next, FlashList 2, Ionicons, react-native-reanimated 4
**Storage**: Supabase PostgreSQL (remote) — 1 altered table (stickers), 2 new tables (milestone_badges, student_badges), ~5 new RPC functions, 2 triggers, 1 pg_cron job
**Testing**: Manual validation via quickstart.md scenarios
**Target Platform**: iOS & Android (Expo managed)
**Project Type**: Mobile (React Native / Expo)
**Performance Goals**: Leaderboard queries < 2s for 500 enrolled students
**Constraints**: All new columns on existing tables MUST be NULLABLE; bilingual (en/ar) for all UI text
**Scale/Scope**: Up to 500 students per program, 9 milestone badge types, ~40 stickers per program

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | New tables use `program_id` FK. `stickers.program_id` is NULLABLE (global stickers have NULL). RLS enforces program scoping via `get_user_programs()`. |
| II. Role-Based Access (7 Roles) | PASS | Sticker creation: admin/master_admin for global, program_admin for program-scoped. Award picker: teachers see global + their program stickers. Dashboard: supervisor/program_admin. Leaderboard: students within enrolled programs. |
| III. TypeScript-First, Strict Mode | PASS | All code in strict TypeScript. Supabase-generated types used. |
| IV. Feature Colocation | PASS | Extends existing `src/features/gamification/` with new hooks, types, and components. New milestone badge code colocated there. |
| V. Logical CSS Only (RTL/LTR) | PASS | All new components use paddingStart/paddingEnd, marginStart/marginEnd. |
| VI. i18n Mandatory | PASS | All new strings in en.json/ar.json. 9 badge names + descriptions bilingual. |
| VII. Supabase-Native Patterns | PASS | Direct Supabase SDK in services. RLS on all new tables. Migrations via migration tooling. Functions use `SET search_path = public`. |
| VIII. Minimal Animation | PASS | Badge award notification uses simple fade-in. No heavy celebrations. |
| IX. External Meeting Integration | N/A | No meeting features in this spec. |

**Gate Result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/010-gamification-ext/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── rpc-functions.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Altered existing files
supabase/migrations/00011_gamification_ext.sql     # Schema: alter stickers, new tables, RPC, triggers, cron
src/features/gamification/types/gamification.types.ts   # Extended types
src/features/gamification/services/gamification.service.ts  # Extended service
src/features/gamification/hooks/useStickers.ts      # Updated for program filtering
src/features/gamification/hooks/useLeaderboard.ts   # Updated for program scope
src/i18n/locales/en.json                            # New gamification keys
src/i18n/locales/ar.json                            # New gamification keys (Arabic)
supabase/functions/send-notification/index.ts       # New milestone_badge_earned category

# New files — gamification feature
src/features/gamification/hooks/useProgramLeaderboard.ts
src/features/gamification/hooks/useMilestoneBadges.ts
src/features/gamification/hooks/useStudentBadges.ts
src/features/gamification/hooks/useRewardsDashboard.ts
src/features/gamification/components/ProgramLeaderboard.tsx
src/features/gamification/components/BadgeGrid.tsx
src/features/gamification/components/BadgeCard.tsx
src/features/gamification/components/RewardsDashboard.tsx

# New route screens
app/(student)/program/[programId]/leaderboard.tsx
app/(student)/profile/badges.tsx
app/(supervisor)/rewards/index.tsx
app/(program-admin)/rewards/index.tsx
```

**Structure Decision**: Extends existing `src/features/gamification/` directory per Feature Colocation principle. No new feature directory needed — badges are part of gamification. New routes added under existing role-based route groups.

## Complexity Tracking

No violations to justify — all gates passed.
