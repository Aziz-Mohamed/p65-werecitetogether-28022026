# Implementation Plan: Supervisor & Admin Panels

**Branch**: `007-admin-roles` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-admin-roles/spec.md`

## Summary

Build out the supervisor, program-admin, and master-admin route groups with real dashboards, team management, program-scoped data access, and reports. Replace placeholder screens with tab-based navigation (supervisor: 4 tabs, program-admin: 5 tabs with program selector) and extend the master-admin stack navigation with user management, reports, and platform settings. Add migration for `supervisor_id` on `program_roles` and `platform_config` table. Create RPC functions for aggregated dashboard metrics. All screens enforce program-scoped access and support bilingual display.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, react-hook-form 7 + zod 4, i18next + react-i18next, FlashList 2, Ionicons, victory-native, @gorhom/bottom-sheet 5
**Storage**: Supabase PostgreSQL (remote) — 1 altered table (program_roles), 1 new table (platform_config), 8 new RPC functions
**Testing**: Manual QA via quickstart scenarios
**Target Platform**: iOS + Android (React Native / Expo)
**Project Type**: Mobile app (Expo managed workflow)
**Performance Goals**: Dashboard loads within 2 seconds (SC-005)
**Constraints**: All screens must support RTL/LTR, program-scoped access enforcement
**Scale/Scope**: ~25 new/modified screens across 3 route groups

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | All new queries scoped by program_id. Master admin bypasses scoping. RPC functions enforce program scope. |
| II. Role-Based Access (7 Roles) | PASS | Supervisor, program_admin, master_admin screens enforce role checks. program_roles table used for program-scoped role assignment. profiles.role only changed for master_admin. |
| III. TypeScript-First, Strict Mode | PASS | All new code in TypeScript strict mode. Types defined for all entities. `as any` only for untyped Supabase tables until types regenerated. |
| IV. Feature Colocation | PASS | New feature module `src/features/admin/` for shared admin services/hooks/types. Route-specific components stay in route files. Shared dashboard components in `src/components/`. |
| V. Logical CSS Only (RTL/LTR) | PASS | All new styles use logical properties (paddingInline, marginBlock, start/end). |
| VI. i18n Mandatory | PASS | All strings through i18n. New keys under `supervisor`, `programAdmin`, `masterAdmin` namespaces. Both en.json and ar.json updated. |
| VII. Supabase-Native Patterns | PASS | Direct Supabase SDK in service files. RLS on platform_config. RPC functions with SET search_path. No ORM. |
| VIII. Minimal Animation | PASS | Tab transitions via CustomTabBar (existing). No heavy animations. |
| IX. External Meeting Integration | N/A | No meeting link changes in this spec. |

**Post-design re-check**: All principles remain PASS after data model and contracts design.

## Project Structure

### Documentation (this feature)

```text
specs/007-admin-roles/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── supervisor-api.md
│   ├── program-admin-api.md
│   └── master-admin-api.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Migration
supabase/migrations/00009_admin_roles.sql

# New feature module for shared admin logic
src/features/admin/
├── types/admin.types.ts
├── services/admin.service.ts
├── hooks/
│   ├── useSupervisorDashboard.ts
│   ├── useSupervisedTeachers.ts
│   ├── useTeacherStudents.ts
│   ├── useReassignStudent.ts
│   ├── useProgramAdminDashboard.ts
│   ├── useProgramAdminPrograms.ts
│   ├── useProgramTeam.ts
│   ├── useLinkSupervisor.ts
│   ├── useProgramSettings.ts
│   ├── useProgramReports.ts
│   ├── useMasterAdminDashboard.ts
│   ├── useAdminUsers.ts
│   ├── useManageRoles.ts
│   ├── usePlatformConfig.ts
│   └── useMasterAdminReports.ts
├── components/
│   ├── TeacherCard.tsx
│   ├── StatCard.tsx
│   ├── ProgramSelector.tsx
│   ├── TeamMemberRow.tsx
│   ├── UserSearchSheet.tsx
│   ├── RoleAssignmentSheet.tsx
│   ├── ProgramSummaryRow.tsx
│   └── ReassignSheet.tsx
└── index.ts

# Supervisor route group (replace placeholder)
app/(supervisor)/
├── _layout.tsx                    # MODIFY: Stack → (tabs) + stack
├── (tabs)/
│   ├── _layout.tsx               # NEW: 4-tab layout
│   ├── index.tsx                  # NEW: Dashboard (replaces placeholder)
│   ├── teachers.tsx              # NEW: Teacher list
│   ├── reports.tsx               # NEW: Reports
│   └── profile.tsx               # NEW: Profile
└── teachers/
    ├── [id]/
    │   ├── index.tsx             # NEW: Teacher detail
    │   ├── students.tsx          # NEW: Teacher's students
    │   └── reviews.tsx           # EXISTING (from 006)

# Program Admin route group (replace placeholder)
app/(program-admin)/
├── _layout.tsx                    # MODIFY: add program context
├── select.tsx                    # NEW: Program selector
├── (tabs)/
│   ├── _layout.tsx               # NEW: 5-tab layout
│   ├── index.tsx                 # NEW: Dashboard
│   ├── cohorts.tsx              # NEW: Cohorts list (extends existing)
│   ├── team.tsx                 # NEW: Team management (extends existing)
│   ├── reports.tsx              # NEW: Reports
│   └── settings.tsx             # NEW: Program settings
├── cohorts/
│   ├── [cohortId].tsx           # EXISTING (from 003)
│   └── create.tsx               # EXISTING (from 003)
└── team/
    └── add.tsx                  # NEW: Add team member search

# Master Admin route group (extend)
app/(master-admin)/
├── _layout.tsx                    # MODIFY: add new screens
├── index.tsx                     # MODIFY: Replace placeholder with dashboard
├── programs/                     # EXISTING (from 003)
│   ├── index.tsx
│   ├── create.tsx
│   └── [id]/index.tsx
├── users/
│   ├── index.tsx                # NEW: User list/search
│   └── [id].tsx                 # NEW: User detail + role management
├── reports.tsx                  # NEW: Cross-program reports
└── settings.tsx                 # NEW: Platform settings

# i18n
src/i18n/en.json                 # MODIFY: add admin keys
src/i18n/ar.json                 # MODIFY: add admin keys
```

**Structure Decision**: Feature colocation pattern — shared admin services, types, and hooks in `src/features/admin/`. Route-specific screens in their respective route groups. Reuses existing `CustomTabBar`, `SearchableList`, chart components, and form patterns from the codebase.
