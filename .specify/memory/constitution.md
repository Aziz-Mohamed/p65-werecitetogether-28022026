<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 2.0.0 → 2.0.1 (PATCH)

  Bump rationale: Clarification — Principle VII auth method
  updated from "email or phone-based auth" to "OAuth (Google +
  Apple Sign-In)" to align with spec clarification decision
  (OAuth-only, no email/password or phone/SMS).

  Modified principles:
  - VII: Auth method clarified — "email or phone-based" → "OAuth (Google + Apple)"

  Previous version history:
  - 2.0.0: MAJOR — multi-tenant → single-tenant, 4 → 5 roles,
    new Principle IX, Quran School → WeReciteTogether

  Unchanged principles:
  - III: TypeScript-First, Strict Mode
  - IV: Feature Colocation
  - V: Logical CSS Only (RTL/LTR)
  - VI: i18n Mandatory
  - VIII: Minimal Animation, Maximum Responsiveness

  Added sections:
  - Principle IX: External Meeting Integration (Zero Streaming Cost)

  Removed sections: None

  Templates requiring updates:
  - .specify/templates/plan-template.md: ✅ No update needed
    (Constitution Check section references constitution dynamically)
  - .specify/templates/spec-template.md: ✅ No update needed
    (Spec template is generic; principles enforced at plan/task level)
  - .specify/templates/tasks-template.md: ✅ No update needed
    (Task phases align with constitution workflow)
  - .specify/templates/checklist-template.md: ✅ No update needed
    (Checklist template is generic)
  - .specify/templates/agent-file-template.md: ✅ No update needed
    (Agent file template is generic)

  Follow-up TODOs: None
-->

# WeReciteTogether Constitution

## Core Principles

### I. Single-Tenant, Program-Scoped

WeReciteTogether operates as a single organization (مقرأة
إلكترونية). There is no `school_id` or multi-tenant scoping.
Instead, all data MUST be scoped by `program_id`. Every
program-scoped table MUST include a `program_id` foreign key.
All Row Level Security (RLS) policies MUST enforce program-scoping
via `get_user_programs()` for non-master-admin roles. Global
tables (platform config, shared reference data) are the only
exceptions. Master Admins bypass program scoping and see all data.

### II. Role-Based Access (5 Roles)

The system recognizes exactly five roles: `student`, `teacher`,
`supervisor`, `program_admin`, `master_admin`. Every RLS policy
and application-level guard MUST be scoped to one or more of
these roles using `get_user_role()`. Role assignment occurs at
the `profiles` table level. The `program_roles` junction table
governs which users hold which roles within specific programs.
No implicit role escalation is permitted — a user MUST have the
declared role to access role-gated functionality. Program Admins
and Supervisors MUST only access data within their assigned
programs.

### III. TypeScript-First, Strict Mode

All application code MUST be written in TypeScript with strict
mode enabled. No `any` types are permitted. Supabase-generated
types (`database.types.ts`) MUST be used for all database
interactions. Every entity passed between layers MUST have a
defined TypeScript interface.

### IV. Feature Colocation

Each feature MUST keep its hooks, services, types, and components
colocated in a single directory under `src/features/`. Shared code
lives in `src/components/`, `src/hooks/`, `src/lib/`, `src/stores/`,
`src/types/`, `src/theme/`, and `src/i18n/`. No feature may
directly import from another feature's internal files — shared
dependencies MUST be elevated to the shared layer.

### V. Logical CSS Only (RTL/LTR)

All layout properties MUST use logical CSS equivalents:
`paddingStart`/`paddingEnd` (not `paddingLeft`/`paddingRight`),
`marginStart`/`marginEnd`, `start`/`end` positioning (not
`left`/`right`). `flexDirection: 'row'` auto-flips and MUST be
used instead of `row-reverse` for standard layouts. Directional
icons MUST be flipped using `I18nManager.isRTL`. No physical
directional properties are permitted in any StyleSheet.

### VI. i18n Mandatory

All user-visible strings MUST go through the i18n system
(`i18next` + `react-i18next`). No hardcoded text strings in
components. Both English (`en.json`) and Arabic (`ar.json`)
translations MUST be maintained for every string. Language
switching MUST trigger RTL/LTR layout reconfiguration via
`I18nManager.forceRTL()`.

### VII. Supabase-Native Patterns

Authentication MUST use Supabase Auth. Students self-register
via OAuth providers (Google Sign-In, Apple Sign-In) — no
email/password or phone/SMS authentication.
Teachers, supervisors, and admins are created by higher-level
admins. Data access MUST use the Supabase JS SDK directly in
service files — no ORM or repository abstraction layer. RLS
MUST be enabled on every table. Migrations MUST be applied via
Supabase migration tooling. Functions MUST include
`SET search_path = public` for security compliance. Tables MUST
be created before functions that reference them.

### VIII. Minimal Animation, Maximum Responsiveness

Use `react-native-reanimated` for layout transitions and
shared-element transitions only. Micro-interactions (button press
feedback, pull-to-refresh, progress fills) are encouraged.
Full-screen celebrations, heavy Lottie/Rive packs, particle
effects, and animations that block user interaction are prohibited.
The app MUST feel alive and responsive, not animated and heavy.

### IX. External Meeting Integration (Zero Streaming Cost)

All live voice/video communication MUST happen via external
tools (Google Meet, Zoom, Jitsi, or any URL). The app MUST NOT
host, proxy, or stream any audio or video content (voice memos
stored in Supabase Storage are the sole exception). Each teacher
stores a persistent meeting link in their profile. The app
reveals and deep-links to this URL when a student joins a session.
Session outcomes (scores, notes, attendance) are logged in-app
after the external session concludes.

## Technology & Architecture Constraints

- **Framework**: Expo ~54, managed workflow, Expo Router v6
- **Server state**: TanStack Query (React Query) — all data
  fetching and caching MUST use this library
- **Client state**: Zustand — limited to auth, theme, and locale
  stores. No global state for server-fetched data.
- **Forms**: `react-hook-form` + `zod` for all form handling
  and validation
- **Lists**: `FlashList` from `@shopify/flash-list` for all
  scrollable data lists (not FlatList or ScrollView)
- **Images**: `expo-image` for all image rendering (not RN Image)
- **Backend**: Supabase (Auth, Database, Storage, Realtime,
  Edge Functions)
- **Database design rules**:
  - All FKs MUST have explicit `ON DELETE` (CASCADE for ownership,
    SET NULL for optional refs)
  - All columns with defaults MUST have `NOT NULL`
  - CHECK constraints on all numeric ranges and enum-like text
  - `is_active` is a status flag, not soft-delete; RLS does NOT
    filter by `is_active` — app layer handles it
  - `updated_at` triggers on tables that need them
  - Program-scoped tables MUST include `program_id` FK

## Development Workflow

- **Routing**: File-based via Expo Router. Route groups map to
  roles: `(auth)`, `(student)`, `(teacher)`, `(supervisor)`,
  `(program-admin)`, `(master-admin)`.
- **Query keys**: Follow `[feature, ...params]` convention
- **Services**: Each feature has a `.service.ts` file that wraps
  Supabase SDK calls. Services MUST NOT throw raw errors.
- **Components**: Business logic lives in hooks, not components.
  Components MUST be pure renderers.
- **Testing**: Jest + React Native Testing Library. Critical paths
  require integration tests. E2E via Detox or Maestro for login
  and session creation flows.
- **Code style**: ESLint + Prettier enforced. No inline styles for
  reusable patterns — use `StyleSheet.create`.
- **Naming**: PascalCase for components, camelCase with `use`
  prefix for hooks, `.service.ts` suffix for services,
  `.types.ts` suffix for types, kebab-case for route files,
  UPPER_SNAKE_CASE for constants.
- **Git commits**: Conventional Commits format. No AI attribution
  in commit messages. Write commit messages as if a human
  developer wrote them.

## Governance

This constitution is the authoritative reference for all
architectural and code-quality decisions in the WeReciteTogether
project. It supersedes ad-hoc practices and local conventions.

- **Amendments**: Any change to a principle MUST be documented
  with rationale, approved by the project owner, and reflected
  in a version bump. Principle removals or redefinitions require
  a MAJOR version increment.
- **Versioning**: MAJOR.MINOR.PATCH semantic versioning.
  MAJOR = breaking governance changes; MINOR = new principles or
  expanded guidance; PATCH = clarifications and wording fixes.
- **Compliance**: All feature specs, implementation plans, and
  task lists MUST pass a Constitution Check before implementation
  begins. The plan template's "Constitution Check" section
  validates alignment with these principles.
- **Source of truth**: The PRD at
  `memory-bank/PRD_WeReciteTogether.md` is the product-level
  source of truth. This constitution governs technical execution
  of that PRD.

**Version**: 2.0.1 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-28
