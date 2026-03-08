# Implementation Plan: Programs & Enrollment

**Branch**: `003-programs-enrollment` | **Date**: 2026-03-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-programs-enrollment/spec.md`

## Summary

Add 5 new database tables (`programs`, `program_tracks`, `cohorts`, `enrollments`, `program_roles`) with RLS policies, seed all 8 PRD programs with their tracks, create a `get_user_programs()` helper function for program-scoped RLS, and build student-facing UI (Programs tab + detail + enrollment) and admin-facing UI (program/cohort/team management) using existing project patterns (TanStack Query, Supabase JS, Expo Router, i18n).

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, Zustand 5, react-hook-form 7 + zod 4, i18next + react-i18next, FlashList 2, Ionicons
**Storage**: Supabase PostgreSQL (remote) — 5 new tables, 0 modified tables
**Testing**: Jest + React Native Testing Library (critical paths)
**Target Platform**: iOS + Android (Expo managed workflow)
**Project Type**: Mobile (React Native / Expo)
**Performance Goals**: Programs list loads in <2s (SC-001), `get_user_programs()` <100ms (SC-007)
**Constraints**: Additive-only schema (no existing table drops or column removals), bilingual AR+EN, RTL/LTR support
**Scale/Scope**: 8 programs, ~25 tracks, expected hundreds of enrollments per program

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | All 5 new tables include `program_id` FK. RLS uses `get_user_programs()`. No existing tables modified. |
| II. Role-Based Access (7 Roles) | PASS | RLS policies scope by role: student (read programs, manage own enrollments), program_admin (manage assigned programs), master_admin (all access). |
| III. TypeScript-First, Strict Mode | PASS | All code in strict TS. Supabase-generated types used for DB interactions. Feature types defined in `programs.types.ts`. |
| IV. Feature Colocation | PASS | New `src/features/programs/` directory with colocated hooks, services, types, components. |
| V. Logical CSS Only (RTL/LTR) | PASS | All styles use logical properties (paddingStart, marginEnd, etc.). No physical directional properties. |
| VI. i18n Mandatory | PASS | All strings through i18next. Both `en.json` and `ar.json` maintained. Program names stored bilingually in DB. |
| VII. Supabase-Native Patterns | PASS | Supabase JS SDK in service files. RLS on all tables. Migrations via Supabase tooling. Functions use `SET search_path = public`. |
| VIII. Minimal Animation | PASS | No heavy animations. Standard list/card transitions only. |
| IX. External Meeting Integration | N/A | Meeting links stored on cohorts but deep-linking is out of scope (spec 004). |

## Project Structure

### Documentation (this feature)

```text
specs/003-programs-enrollment/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── programs-api.md  # Supabase query contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 00005_programs_enrollment.sql    # Schema + RLS + seed data

src/features/programs/
├── components/
│   ├── ProgramCard.tsx              # Program list item card
│   ├── ProgramDetailHeader.tsx      # Program detail hero section
│   ├── TrackList.tsx                # Track listing within program detail
│   ├── CohortCard.tsx               # Cohort info card (capacity, status)
│   ├── EnrollmentStatusBadge.tsx    # Badge showing enrollment state
│   ├── CategoryBadge.tsx            # free/structured/mixed badge
│   └── EmptyProgramState.tsx        # Empty state for no programs
├── hooks/
│   ├── usePrograms.ts               # List all active programs
│   ├── useProgram.ts                # Single program with tracks
│   ├── useProgramTracks.ts          # Tracks for a program
│   ├── useCohorts.ts                # Cohorts for a track/program
│   ├── useEnrollments.ts            # Student's enrollments
│   ├── useEnroll.ts                 # Enrollment mutation
│   ├── useLeaveProgram.ts           # Drop/leave mutation
│   ├── useProgramRoles.ts           # Program role assignments
│   ├── useAdminPrograms.ts          # Admin: program CRUD
│   ├── useAdminCohorts.ts           # Admin: cohort CRUD
│   └── useAdminEnrollments.ts       # Admin: approve/reject enrollments
├── services/
│   └── programs.service.ts          # Supabase query wrappers
├── types/
│   └── programs.types.ts            # Feature-specific types
└── utils/
    └── enrollment-helpers.ts        # Status logic, locale fallback

app/(student)/(tabs)/
└── programs.tsx                     # Programs tab screen (list)

app/(student)/programs/
├── [id].tsx                         # Program detail screen
└── my-programs.tsx                  # My enrollments screen

app/(program-admin)/programs/
├── index.tsx                        # Program management list
├── [id]/
│   ├── index.tsx                    # Program detail (edit)
│   ├── tracks.tsx                   # Track management
│   ├── cohorts/
│   │   ├── index.tsx                # Cohort list for program
│   │   ├── create.tsx               # Create cohort form
│   │   └── [cohortId].tsx           # Cohort detail + enrollment management
│   └── team.tsx                     # Program role assignment

app/(master-admin)/programs/
├── index.tsx                        # All programs management
├── create.tsx                       # Create new program
└── [id]/
    └── index.tsx                    # Edit program (full access)

src/i18n/
├── en.json                          # English translations (programs.* keys)
└── ar.json                          # Arabic translations (programs.* keys)
```

**Structure Decision**: Mobile (Expo Router file-based routing). Feature code colocated in `src/features/programs/`. Route groups follow existing role-based pattern: `(student)` for browsing/enrollment, `(program-admin)` for program-scoped management, `(master-admin)` for global management.

## Complexity Tracking

No constitution violations. No complexity justification needed.
