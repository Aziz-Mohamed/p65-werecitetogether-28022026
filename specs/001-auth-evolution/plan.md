# Implementation Plan: Auth Evolution (OAuth)

**Branch**: `001-auth-evolution` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-evolution/spec.md`

## Summary

Replace the existing synthetic email/password authentication with OAuth-only (Google + Apple) sign-in. Students self-register via OAuth (auto-role: student). Admins promote users to privileged roles (7 total). Development builds show role-based test pills for simulator testing. The existing auth screens, services, edge functions, and create-school flow are removed. The profiles table role constraint is extended to 7 roles, school_id is made nullable for OAuth users, and the handle_new_profile trigger is adapted to support OAuth metadata.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode) + Deno (Edge Functions)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, @supabase/supabase-js 2, @react-native-google-signin/google-signin, expo-apple-authentication, zustand 5, react-hook-form 7 + zod 4, i18next + react-i18next
**Storage**: Supabase PostgreSQL (remote), expo-secure-store (auth tokens), AsyncStorage (preferences)
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS 15+ / Android (Expo managed workflow)
**Project Type**: Mobile (React Native + Expo)
**Performance Goals**: OAuth registration < 60s (SC-001), dev pill sign-in < 5s (SC-007)
**Constraints**: OAuth-only in production, dev test pills on simulator only, 7 roles, school_id backward compat
**Scale/Scope**: 7 roles, 2 OAuth providers, ~25 files modified/created, 1 migration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | JUSTIFIED | profiles.school_id must become NULLABLE for OAuth users (no school). Column is NOT removed, just relaxed. Existing rows retain their values. New features will use program_id (spec 003). See Complexity Tracking. |
| II. Role-Based Access (7 Roles) | PASS | Extending role CHECK from 4 to 7 roles. get_user_role() continues to work unchanged. |
| III. TypeScript-First, Strict Mode | PASS | All new code in TypeScript strict. UserRole union extended to 7. No `any` types. |
| IV. Feature Colocation | PASS | Auth feature stays in src/features/auth/. New hooks and services colocated. |
| V. Logical CSS Only (RTL/LTR) | PASS | All new auth screens use logical properties (paddingStart/End, marginStart/End). |
| VI. i18n Mandatory | PASS | All new strings in en.json + ar.json. OAuth button labels, error messages, onboarding — all localized. |
| VII. Supabase-Native Patterns | JUSTIFIED | Uses Supabase Auth OAuth (signInWithIdToken). No ORM. RLS preserved. Migration via Supabase tooling. search_path set on all functions. **Intentional deviation**: Constitution VII says "password-based auth PRESERVED during transition," but per Clarifications 2026-03-02, the user chose OAuth-only — synthetic email auth is fully removed (FR-022). Constitution VII will be amended post-implementation. |
| VIII. Minimal Animation | PASS | Auth screens use minimal transitions only. No celebration animations. |
| IX. External Meeting Integration | N/A | Not relevant to auth feature. |

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-evolution/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── auth-api.md      # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── features/
│   └── auth/
│       ├── services/
│       │   └── auth.service.ts          # REWRITE: OAuth + role promotion (remove synthetic email)
│       ├── types/
│       │   └── auth.types.ts            # REWRITE: OAuth types, remove synthetic email types
│       ├── hooks/
│       │   ├── useOAuthLogin.ts          # NEW: Google/Apple OAuth sign-in via signInWithIdToken
│       │   ├── useCurrentUser.ts         # MODIFY: adapt for OAuth session
│       │   ├── useLogout.ts              # KEEP: minimal changes
│       │   └── useDevLogin.ts            # NEW: development test pill sign-in
│       ├── components/
│       │   ├── OAuthButtons.tsx           # NEW: Google + Apple sign-in buttons (i18n)
│       │   ├── DevRolePills.tsx           # NEW: dev-only role pills (__DEV__ gated)
│       │   └── RoleSelector.tsx           # MODIFY: extend to 7 roles
│       └── index.ts                      # UPDATE: new exports
├── stores/
│   └── authStore.ts                     # MODIFY: remove schoolSlug, adapt for OAuth
├── hooks/
│   └── useAuth.ts                       # NO CHANGES NEEDED: pure selector, auto-updates via UserRole type extension
├── types/
│   └── common.types.ts                  # MODIFY: UserRole union → 7 roles
├── lib/
│   ├── supabase.ts                      # KEEP: detectSessionInUrl already handles callbacks
│   └── constants.ts                     # MODIFY: ROLES array → 7 roles
└── i18n/
    ├── en.json                          # MODIFY: new auth/onboarding strings, remove school strings
    └── ar.json                          # MODIFY: new auth/onboarding strings, remove school strings

app/
├── _layout.tsx                          # MODIFY: extend AuthGuard for 7 roles + placeholder routing
├── index.tsx                            # MODIFY: extend role routing for 7 roles
├── (auth)/
│   ├── _layout.tsx                      # KEEP
│   ├── login.tsx                        # REWRITE: OAuth buttons + dev pills (no username/password)
│   ├── create-school.tsx                # DELETE
│   └── onboarding.tsx                   # NEW: post-registration (name, language, bio)
├── (admin)/
│   └── members/
│       └── edit-role.tsx                # NEW: role promotion screen (or modify existing member screens)
├── (supervisor)/
│   ├── _layout.tsx                      # NEW: minimal stack layout
│   └── placeholder.tsx                  # NEW: "Dashboard coming soon" screen
├── (program-admin)/
│   ├── _layout.tsx                      # NEW: minimal stack layout
│   └── placeholder.tsx                  # NEW: "Dashboard coming soon" screen
└── (master-admin)/
    ├── _layout.tsx                      # NEW: minimal stack layout
    └── placeholder.tsx                  # NEW: "Dashboard coming soon" screen

supabase/
├── migrations/
│   └── 00004_auth_evolution.sql         # NEW: role CHECK, school_id nullable, trigger update, RLS
├── functions/
│   ├── create-school/index.ts           # DELETE
│   ├── create-member/index.ts           # MODIFY: support 7 roles, remove password, role-gated
│   └── reset-member-password/index.ts   # DELETE
└── seed.sql                             # MODIFY: add 7 test users (one per role) for dev pills
```

**Structure Decision**: Mobile (React Native + Expo) with feature colocation per Constitution IV. Auth feature colocated under `src/features/auth/`. Route groups follow role-based pattern per Constitution II. Edge functions in `supabase/functions/`. Three new route groups added for placeholder screens: `(supervisor)`, `(program-admin)`, `(master-admin)`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| school_id NULLABLE on profiles (Constitution I backward-compat) | OAuth users have no school — can't require school_id for self-registered users | Creating a "default school" record would be a semantic hack. program_id is the future scoping mechanism (spec 003). Making school_id nullable is the cleanest bridge — existing rows keep their values, existing RLS policies continue to work for legacy data, new OAuth users simply have school_id=NULL. |
| onboarding_completed NOT NULL DEFAULT false (Constitution "new columns NULLABLE" rule) | Tracking onboarding state requires a definitive true/false — NULL would add ambiguous third state requiring null-checks everywhere | DEFAULT false ensures existing rows auto-get the correct value. NOT NULL prevents null-check overhead in auth routing (T015, T030). The "new columns NULLABLE" rule exists to prevent breaking existing rows, which DEFAULT handles. |
