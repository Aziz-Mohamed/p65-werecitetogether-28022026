# Implementation Plan: WeReciteTogether Core Platform

**Branch**: `001-platform-core` | **Date**: 2026-02-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-platform-core/spec.md`

## Summary

Transform the Quran School codebase into WeReciteTogether — a single-tenant, program-based Quranic learning platform. The MVP delivers: OAuth sign-in (Google + Apple) with demographic onboarding, program browsing and enrollment, teacher availability (green dot) with external meeting deep-linking, session logging with voice memos, teacher ratings, queue/waitlist systems, and 5-role program-scoped admin panels. The migration removes multi-tenant/GPS/school infrastructure and replaces it with program-centric architecture.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.81.5, Expo ~54, Expo Router v6, React 19, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next, FlashList 2, expo-image 3, @gorhom/bottom-sheet 5, expo-av (to add), expo-notifications
**Storage**: Supabase PostgreSQL (remote), expo-secure-store (auth tokens), AsyncStorage (preferences), Supabase Storage (voice memos)
**Testing**: Jest + React Native Testing Library, Detox/Maestro for E2E
**Target Platform**: iOS 15+ and Android 10+, mobile-first
**Project Type**: Mobile (React Native / Expo)
**Performance Goals**: Teacher availability propagation < 2s, session logging < 90s, 1000+ concurrent students, 100+ simultaneous teachers
**Constraints**: Read-only offline via TanStack Query cache persistence, zero streaming cost (all video external), voice memos max 2 min / ~120KB
**Scale/Scope**: 8 programs, 5 roles, 19 new DB tables, ~15 feature modules, ~50 screens

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Single-Tenant, Program-Scoped | ✅ PASS | All tables scoped by `program_id`, `get_user_programs()` RLS function, no `school_id` |
| II. Role-Based Access (5 Roles) | ✅ PASS | 5 roles: student/teacher/supervisor/program_admin/master_admin, `program_roles` junction, `get_user_role()` |
| III. TypeScript-First, Strict Mode | ✅ PASS | All code in TS strict, Supabase generated types used for all DB interactions |
| IV. Feature Colocation | ✅ PASS | Each feature in `src/features/` with colocated hooks/services/types/components |
| V. Logical CSS Only (RTL/LTR) | ✅ PASS | Existing codebase already uses logical properties; will maintain |
| VI. i18n Mandatory | ✅ PASS | All strings through i18next, en.json + ar.json maintained |
| VII. Supabase-Native Patterns | ✅ PASS | OAuth via Supabase Auth (Google + Apple), direct SDK in services, RLS on every table, migrations via Supabase tooling |
| VIII. Minimal Animation | ✅ PASS | Micro-interactions only, reanimated for layout transitions |
| IX. External Meeting Integration | ✅ PASS | No video hosting, deep-link to teacher's meeting URL, voice memos are the sole audio exception (Supabase Storage) |

All 9 gates pass. Constitution VII patched to v2.0.1 (OAuth-only aligned). Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-core/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 dev setup guide
├── contracts/           # Phase 1 service contracts
│   └── services.md      # Service layer API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 task list (via /speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── _layout.tsx                   # Root: providers, auth guard, realtime
├── index.tsx                     # Entry redirect (role-based)
├── (auth)/
│   ├── _layout.tsx
│   ├── login.tsx                 # OAuth sign-in (Google + Apple)
│   └── onboarding.tsx            # Demographics collection (NEW)
├── (student)/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx           # 5-tab: Home, Programs, Progress, Certificates, Profile
│       ├── index.tsx             # Student dashboard
│       ├── programs.tsx          # Program browser (NEW)
│       ├── progress.tsx          # Cross-program progress (NEW)
│       ├── certificates.tsx      # Earned certifications (STUB)
│       └── profile.tsx
├── (teacher)/
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx           # 5-tab: Home, Students, Sessions, Circles, Profile
│       ├── index.tsx             # Teacher dashboard + availability toggle
│       ├── students.tsx
│       ├── sessions.tsx
│       ├── circles.tsx           # Cohort view (NEW)
│       └── profile.tsx
├── (supervisor)/                 # NEW route group
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx           # 4-tab: Home, Teachers, Reports, Profile
│       ├── index.tsx
│       ├── teachers.tsx
│       ├── reports.tsx
│       └── profile.tsx
├── (program-admin)/              # NEW route group
│   ├── _layout.tsx
│   └── (tabs)/
│       ├── _layout.tsx           # 5-tab: Home, Cohorts, Team, Reports, Settings
│       ├── index.tsx
│       ├── cohorts.tsx
│       ├── team.tsx
│       ├── reports.tsx
│       └── settings.tsx
└── (master-admin)/               # NEW route group (replaces (admin))
    ├── _layout.tsx
    ├── index.tsx                 # Cross-program dashboard
    ├── programs/                 # Program CRUD
    ├── users/                    # All-role user management
    ├── reports/                  # Cross-program analytics
    └── settings/                 # Platform config

src/
├── components/                   # KEEP — shared UI primitives (all reusable)
├── features/
│   ├── auth/                     # HEAVY REWRITE — OAuth, remove synthetic email
│   ├── onboarding/               # NEW — demographic collection flow
│   ├── programs/                 # NEW — program listing, detail, tracks
│   ├── enrollment/               # NEW — cohort enrollment, waitlist
│   ├── teacher-availability/     # NEW — green dot toggle, available list
│   ├── sessions/                 # ADAPT — add draft state, program_id, voice memos
│   ├── voice-memos/              # NEW — recording + playback
│   ├── teacher-ratings/          # NEW — rating submission, aggregation, display
│   ├── queue/                    # NEW — free program queue + fair usage
│   ├── cohorts/                  # NEW — cohort management, lifecycle
│   ├── supervisor/               # NEW — teacher oversight dashboard
│   ├── notifications/            # ADAPT — new event categories
│   ├── realtime/                 # ADAPT — new table subscriptions
│   ├── profile/                  # ADAPT — add demographics, meeting link
│   ├── dashboard/                # HEAVY REWRITE — 5-role dashboards
│   ├── reports/                  # ADAPT — program-scoped data sources
│   └── memorization/             # ADAPT — add program_id scoping (keep SM-2)
├── hooks/                        # KEEP — shared hooks (useAuth, useRole, useRTL, etc.)
├── i18n/                         # ADAPT — new translation strings
├── lib/                          # ADAPT — supabase.ts (update types), constants.ts (new roles)
├── stores/                       # ADAPT — authStore (remove schoolSlug, add onboarding)
├── theme/                        # ADAPT — update brand colors for WeReciteTogether
└── types/                        # REGENERATE — database.types.ts from new schema

supabase/
├── migrations/                   # NEW consolidated migration for WeReciteTogether schema
├── functions/
│   ├── send-notification/        # ADAPT — new notification categories
│   ├── create-member/            # ADAPT — remove school context, OAuth flow
│   ├── cleanup-voice-memos/      # NEW — daily cron to purge expired memos
│   └── queue-processor/          # NEW — handle queue notifications
├── storage/
│   └── voice-memos/              # NEW bucket
└── types/
    └── database.types.ts         # REGENERATE

# REMOVE — Quran School specific features:
# - src/features/schools/
# - src/features/work-attendance/
# - src/features/children/
# - src/features/parents/
# - src/features/classes/
# - src/features/gamification/ (defer to post-MVP)
# - app/(parent)/ route group
# - app/(admin)/ route group (replaced by (master-admin) + (program-admin))
```

**Structure Decision**: Mobile app — single Expo project at repo root. All source under `src/` with colocated features. Backend is Supabase-managed (no separate API directory). Route groups at `app/` level map to roles per constitution.

## Complexity Tracking

No constitution violations to justify.
