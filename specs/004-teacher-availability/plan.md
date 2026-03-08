# Implementation Plan: Teacher Availability (Green Dot System)

**Branch**: `004-teacher-availability` | **Date**: 2026-03-05 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/004-teacher-availability/spec.md`

## Summary

Add a real-time teacher availability system ("Green Dot") that allows teachers in free/mixed programs to toggle online/offline status, lets enrolled students browse available teachers and join sessions via external meeting links. The implementation requires one new table (`teacher_availability`), three profile column extensions, RPC functions for atomic operations, `pg_cron` for stale expiry, Supabase Realtime for live updates, and teacher/student UI screens.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, i18next, FlashList 2, react-hook-form 7 + zod 4
**Storage**: Supabase PostgreSQL (remote) — 1 new table, 1 altered table, 2 new RPC functions, 1 trigger, 1 pg_cron job
**Testing**: Manual smoke testing, `supabase db reset` for migration validation
**Target Platform**: iOS + Android (Expo managed workflow)
**Project Type**: mobile
**Performance Goals**: Toggle < 2s, list refresh < 5s (Realtime), 100+ concurrent available teachers
**Constraints**: External meeting platforms only (Constitution IX), program-scoped RLS (Constitution I)
**Scale/Scope**: ~15 new files, ~5 modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | `teacher_availability` includes `program_id` FK. RLS uses `get_user_programs()`. No `school_id` on new table. |
| II. Role-Based Access (7 Roles) | PASS | RLS policies scoped to student (read enrolled), teacher (own rows), master_admin (all). Uses `get_user_role()`. |
| III. TypeScript-First, Strict Mode | PASS | All code in TypeScript strict mode. Types defined for all entities. |
| IV. Feature Colocation | PASS | New `src/features/teacher-availability/` with colocated hooks, services, types, components. |
| V. Logical CSS Only (RTL/LTR) | PASS | All layout uses `paddingStart`/`paddingEnd`, `marginStart`/`marginEnd`. |
| VI. i18n Mandatory | PASS | All strings through i18next. Both `en.json` and `ar.json` updated. |
| VII. Supabase-Native Patterns | PASS | Auth via Supabase Auth. Direct SDK calls in service. RLS on all tables. `SET search_path = public` on all functions. |
| VIII. Minimal Animation | PASS | Green dot uses simple opacity/color, no heavy animations. |
| IX. External Meeting Integration | PASS | `Linking.openURL()` to teacher's meeting link. No streaming/proxy. |

**Post-Phase 1 Re-check**: All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-teacher-availability/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── availability-service.ts
│   └── hooks.ts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 00006_teacher_availability.sql    # DDL, RLS, triggers, cron

src/features/teacher-availability/
├── types/
│   └── availability.types.ts         # Domain types, input types
├── services/
│   └── availability.service.ts       # Supabase SDK calls (singleton)
├── hooks/
│   ├── useAvailableTeachers.ts       # Query: available teachers for program
│   ├── useMyAvailability.ts          # Query: teacher's own availability
│   ├── useTeacherProfile.ts          # Query: teacher profile extensions
│   ├── useToggleAvailability.ts      # Mutation: toggle on/off
│   ├── useJoinSession.ts             # Mutation: join teacher session
│   └── useUpdateTeacherProfile.ts    # Mutation: update profile extensions
├── components/
│   ├── AvailabilityToggle.tsx        # Per-program toggle with selector
│   ├── AvailableTeacherCard.tsx      # Student-facing teacher card
│   └── ProgramSelector.tsx           # Multi-program toggle sheet
└── index.ts                          # Barrel exports

src/components/ui/
└── GreenDotIndicator.tsx             # Shared green dot badge (Constitution IV)

app/(teacher)/
└── availability.tsx                  # Availability management screen

app/(student)/
└── available-now/
    └── [programId].tsx               # Available Now list for a program

src/features/realtime/config/
├── event-query-map.ts                # EXTEND: add teacher_availability case
└── subscription-profiles.ts          # EXTEND: add teacher_availability to student + teacher profiles

src/i18n/
├── en.json                           # EXTEND: add availability.* keys
└── ar.json                           # EXTEND: add availability.* keys
```

**Structure Decision**: Feature colocation under `src/features/teacher-availability/` following the established pattern from `src/features/programs/`. Teacher route added to existing `app/(teacher)/` group. Student route added under `app/(student)/`.

## Complexity Tracking

No violations — no entry needed.
