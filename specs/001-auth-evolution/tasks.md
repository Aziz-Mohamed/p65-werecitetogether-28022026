# Tasks: Auth Evolution (OAuth)

**Input**: Design documents from `/specs/001-auth-evolution/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.md, quickstart.md
**Generated**: 2026-03-03

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks grouped by user story (P1→P4) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Install new dependencies required for OAuth

- [x] T001 Install npm dependencies: `@react-native-google-signin/google-signin`, `expo-apple-authentication`, `expo-crypto`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migration, type extensions, synthetic email removal, placeholder route groups, and routing updates that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Database & Schema

- [x] T002 Create migration `supabase/migrations/00004_auth_evolution.sql` — make `school_id` nullable, extend role CHECK to 7 roles, add `bio` (text, nullable) and `onboarding_completed` (boolean, default false) columns, replace `handle_new_profile()` trigger to handle OAuth metadata (name fallback chain: full_name → name → email prefix), add `prevent_role_self_update()` trigger to block non-service-role callers from changing `profiles.role` (FR-020 data-layer enforcement), add "Users can read own profile" RLS policy per data-model.md

### Type System & Constants

- [x] T003 [P] Extend `UserRole` union to 7 roles (`'student' | 'teacher' | 'parent' | 'admin' | 'supervisor' | 'program_admin' | 'master_admin'`) in `src/types/common.types.ts`
- [x] T004 [P] Extend `ROLES` array to include all 7 roles in `src/lib/constants.ts`

### Synthetic Email System Removal (FR-022)

- [x] T005 [P] Rewrite auth types — remove `LoginInput`, `CreateSchoolInput`, `CreateSchoolResponse`, `ResetMemberPasswordInput`, `buildSyntheticEmail` helper. Add `OAuthProvider` type (`'google' | 'apple'`), `OAuthLoginResult`, and `DevLoginInput` types in `src/features/auth/types/auth.types.ts`
- [x] T006 [P] Remove `login()`, `createSchool()`, `resetMemberPassword()` methods and `buildSyntheticEmail` usage from auth service. Keep `logout()`, `getProfile()`, `getSession()`, `onAuthStateChange()`. Keep `createMember()` shell (adapted in US3) in `src/features/auth/services/auth.service.ts`
- [x] T007 [P] Delete `app/(auth)/create-school.tsx`
- [x] T008 [P] Delete `supabase/functions/create-school/` directory
- [x] T009 [P] Delete `supabase/functions/reset-member-password/` directory

### Auth Store

- [x] T010 Adapt auth store — remove `schoolSlug` state and `setSchoolSlug()` action, simplify for OAuth session flow (session + profile + isLoading + isAuthenticated) in `src/stores/authStore.ts`

### i18n

- [x] T011 [P] Add i18n strings in `src/i18n/en.json` and `src/i18n/ar.json` — 7 role display names (student/طالب, teacher/معلم, parent/ولي أمر, admin/مدير, supervisor/مشرف, program_admin/مدير البرنامج, master_admin/المدير العام), OAuth button labels ("Continue with Google"/"Continue with Apple"), 4 error message categories (network/cancelled/provider/unknown), onboarding labels, placeholder screen text ("Your dashboard is coming soon")

### Placeholder Route Groups (FR-024)

- [x] T012 [P] Create placeholder route group `app/(supervisor)/` — `_layout.tsx` (minimal stack layout) and `placeholder.tsx` (app logo, localized role title "Supervisor", coming-soon message, sign-out button)
- [x] T013 [P] Create placeholder route group `app/(program-admin)/` — `_layout.tsx` (minimal stack layout) and `placeholder.tsx` (app logo, localized role title "Program Admin", coming-soon message, sign-out button)
- [x] T014 [P] Create placeholder route group `app/(master-admin)/` — `_layout.tsx` (minimal stack layout) and `placeholder.tsx` (app logo, localized role title "Master Admin", coming-soon message, sign-out button)

### Routing

- [x] T015 [P] Extend AuthGuard role routing for 7 roles in `app/_layout.tsx` — route supervisor → `/(supervisor)/`, program_admin → `/(program-admin)/`, master_admin → `/(master-admin)/`
- [x] T016 [P] Extend role-based redirect for 7 roles in `app/index.tsx` — add cases for supervisor, program_admin, master_admin to their respective route groups

**Checkpoint**: Foundation ready — synthetic email removed, 7-role types in place, placeholder screens reachable, user story implementation can begin

---

## Phase 3: User Story 1 — Student Self-Registration via OAuth (Priority: P1) MVP

**Goal**: New users tap "Continue with Google" or "Continue with Apple" on the login screen, authenticate via native OAuth, and land on the student dashboard with role "student"

**Independent Test**: Launch on physical device → tap "Continue with Google" → complete consent → verify student dashboard loads. Repeat with Apple. Verify both English and Arabic locales. Verify returning user auto-signs-in via persisted session.

### Implementation

- [x] T017 [US1] Create `useOAuthLogin` hook in `src/features/auth/hooks/useOAuthLogin.ts` — Google sign-in via `@react-native-google-signin/google-signin` → `signInWithIdToken({ provider: 'google', token })`, Apple sign-in via `expo-apple-authentication` with nonce → `signInWithIdToken({ provider: 'apple', token })`, Apple first-login name capture via `supabase.auth.updateUser()` (R6), avatar_url extraction from Google's `picture` field (FR-025), error categorization into 4 types: network/cancelled/provider/unknown (FR-012)
- [x] T018 [US1] Create `OAuthButtons` component in `src/features/auth/components/OAuthButtons.tsx` — "Continue with Google" and "Continue with Apple" buttons (FR-006), loading indicator on button during OAuth flow (FR-023), disabled state during active flow to prevent double-taps, accessibility labels for VoiceOver/TalkBack, 44x44pt minimum touch targets (FR-026), localized error display below buttons
- [x] T019 [US1] Rewrite login screen in `app/(auth)/login.tsx` — remove schoolSlug/username/password form entirely, render `OAuthButtons` component, app branding header (logo + app name), support both English and Arabic layout
- [x] T020 [P] [US1] Adapt `useCurrentUser` hook for OAuth session handling in `src/features/auth/hooks/useCurrentUser.ts` — remove school-specific profile fetching, handle null school_id gracefully
- [x] T021 [US1] Update auth feature barrel exports and cleanup — delete `src/features/auth/hooks/useLogin.ts` (replaced by useOAuthLogin + useDevLogin), delete unused `src/features/auth/components/AuthFormField.tsx`, add new hooks (`useOAuthLogin`, `useDevLogin`) and components (`OAuthButtons`, `DevRolePills`) to exports, remove old exports (`useLogin`, `buildSyntheticEmail`, `LoginInput`, `CreateSchoolInput`, `CreateSchoolResponse`, `ResetMemberPasswordInput`) in `src/features/auth/index.ts`

**Checkpoint**: OAuth sign-in works end-to-end on physical device. New users auto-get student role. Returning users auto-sign-in via persisted session.

---

## Phase 4: User Story 2 — Development Mode Role Testing (Priority: P2)

**Goal**: Developers can tap role pills on the simulator login screen to sign in as any of the 7 roles without OAuth, enabling rapid testing of all role-based flows

**Independent Test**: Launch on iOS simulator in dev mode → verify 7 role pills visible → tap "Teacher" → verify teacher dashboard → sign out → tap "Supervisor" → verify placeholder screen → build for production → verify pills absent

### Implementation

- [x] T022 [US2] Create seed data with 7 test users in `supabase/seed.sql` — one user per role using raw SQL inserts into `auth.users` with `raw_user_meta_data` containing `role` and `full_name` per data-model.md seed table (emails: `dev-{role}@test.werecitetogether.app`, password: `devtest123`). The `handle_new_profile` trigger auto-creates profile rows.
- [x] T023 [US2] Create `useDevLogin` hook in `src/features/auth/hooks/useDevLogin.ts` — sign in via `supabase.auth.signInWithPassword({ email: 'dev-${role}@test.werecitetogether.app', password: 'devtest123' })`, fetch profile on success, set auth store
- [x] T024 [P] [US2] Create `DevRolePills` component in `src/features/auth/components/DevRolePills.tsx` — 7 role pills with localized labels (en + ar), wrapped in `__DEV__` check so component renders nothing in production, accessibility labels ("Sign in as {role}"), 44x44pt touch targets (FR-026)
- [x] T025 [US2] Integrate dev role pills into login screen — render `DevRolePills` below `OAuthButtons` in `app/(auth)/login.tsx`, wrapped in `{__DEV__ && <DevRolePills />}`

**Checkpoint**: All 7 roles testable on simulator via pills. Production builds have zero pill code paths.

---

## Phase 5: User Story 3 — Admin Role Promotion (Priority: P3)

**Goal**: Admins can change a user's role from the user management screen. Regular admins assign student/teacher/parent. Master_admins assign all 7 roles. Changes take effect on the user's next login.

**Independent Test**: Sign in as admin (via dev pill) → navigate to user management → select a student user → promote to teacher → sign out → sign in as that user (via dev pill or re-seed) → verify teacher dashboard. Repeat as master_admin promoting to supervisor → verify placeholder screen.

### Implementation

- [x] T026 [US3] Update `create-member` edge function in `supabase/functions/create-member/index.ts` — add `action: 'update-role'` handler that updates an existing user's role, validate 7 roles, enforce role-gating (admin: student/teacher/parent only, master_admin: all 7), prevent self-role-change, return updated profile. Remove the original password-based member creation action (consistent with FR-022 synthetic email removal) per contracts/auth-api.md §8
- [x] T027 [P] [US3] Update `RoleSelector` component in `src/features/auth/components/RoleSelector.tsx` — extend from 4 to 7 roles, accept `allowedRoles` prop to control which roles are visible (FR-009: admin sees 3, FR-010: master_admin sees 7), localized role labels
- [x] T028 [US3] Create role promotion screen in `app/(admin)/members/edit-role.tsx` — fetch target user profile, display `RoleSelector` with `allowedRoles` based on current admin's role, call `create-member` edge function with `action: 'update-role'`, show success/error feedback, navigate back on success

**Checkpoint**: Admin role promotion works end-to-end. Regular admin restricted to 3 roles. Master_admin can assign all 7.

---

## Phase 6: User Story 4 — Post-Registration Onboarding (Priority: P4)

**Goal**: New OAuth users see a brief onboarding screen that collects display name, preferred language (en/ar), and optional bio. Skippable with sensible defaults. Tracks completion via `onboarding_completed` field.

**Independent Test**: Register new account via OAuth → verify onboarding screen appears → fill name + select Arabic → skip bio → verify profile updated and app switches to Arabic → sign out → sign in again → verify dashboard loads directly (no onboarding). Force-close during onboarding → reopen → verify onboarding appears again.

### Implementation

- [x] T029 [US4] Create onboarding screen in `app/(auth)/onboarding.tsx` — form using react-hook-form + zod validation (per Constitution) with display name (pre-filled from OAuth, required), language selector (English/Arabic radio), optional bio textarea, "Continue" button (updates profile via `supabase.from('profiles').update()` with `onboarding_completed: true`), "Skip" button (sets `onboarding_completed: true` with defaults: OAuth name, device locale), localized labels (en + ar)
- [x] T030 [US4] Add onboarding redirect logic in `app/_layout.tsx` — after successful auth, check `profile.onboarding_completed`: if false, route to `/(auth)/onboarding` instead of role dashboard (FR-027). This runs on every app open until onboarding is completed or skipped.

**Checkpoint**: Full new-user journey works: OAuth sign-in → onboarding → dashboard. Interrupted onboarding resumes on next app open.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification and validation across all user stories

- [x] T031 [P] Verify dev pills absent from production bundle per SC-004 — run `npx expo export` and search output bundle for `DevRolePills` string. Must return zero matches.
- [x] T032 Run quickstart.md validation — follow the full quickstart.md setup guide from scratch: install deps, apply migration via `npx supabase db reset`, verify seed data, run app on simulator, test role pills, verify OAuth buttons render

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion
- **Phase 4 (US2)**: Depends on Phase 2 + US1's login screen rewrite (T019)
- **Phase 5 (US3)**: Depends on Phase 2 — can run in parallel with US1
- **Phase 6 (US4)**: Depends on Phase 2 (including T015 AuthGuard routing)
- **Phase 7 (Polish)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2 (Foundational)
    │
    ├──→ US1 (OAuth Sign-In) ──→ US2 (Dev Pills — needs login screen from T019)
    │                          └──→ US4 (Onboarding — needs auth flow from T015)
    │
    └──→ US3 (Admin Role Promotion — fully independent of US1)
```

- **US1 → US2**: US2's T025 adds dev pills to the login screen created in US1's T019
- **US1 → US4**: US4's T030 modifies the AuthGuard routing set up in foundational T015
- **US3**: Fully independent — edge function + role selector + admin screen can all be built without US1/US2/US4
- **US2 ↔ US3**: No dependency — but testing US3 on simulator requires US2's dev pills

### Within Each User Story

- Hooks before components (component imports hook)
- Components before screen integration (screen renders component)
- Core implementation before barrel export updates

### Critical Task Dependencies

| Task | Depends On | Reason |
|------|------------|--------|
| T005-T009 | T002 | Migration creates schema that types reference |
| T010 | T005 | Store types depend on new auth types |
| T015-T016 | T012-T014 | Routing references placeholder route groups |
| T018 | T017 | OAuthButtons component uses useOAuthLogin hook |
| T019 | T018 | Login screen renders OAuthButtons component |
| T021 | T017-T020 | Barrel exports all new hooks/components |
| T025 | T019, T023, T024 | Integrates dev pills into rewritten login screen |
| T028 | T026, T027 | Edit-role screen uses edge function + RoleSelector |
| T030 | T029, T015 | Onboarding redirect needs both screen and AuthGuard |

### Parallel Opportunities

**Within Phase 2** (all [P] tasks):
```
T003, T004, T005, T006, T007, T008, T009  ← all parallel (different files)
T011, T012, T013, T014                     ← all parallel (different files)
T015, T016                                 ← parallel (different files)
```

**Across User Stories** (after Phase 2):
```
US1 (T017→T018→T019→T020→T021) ← sequential chain
US3 (T026, T027 in parallel → T028) ← can run alongside US1
```

**Within User Stories**:
```
US1: T020 is [P] with T017-T019 chain (different file)
US2: T024 is [P] with T023 (different files)
US3: T027 is [P] with T026 (different files)
```

---

## Parallel Example: Phase 2 Foundational

```bash
# After T002 (migration), launch all type/deletion tasks in parallel:
T003: Extend UserRole in src/types/common.types.ts
T004: Extend ROLES in src/lib/constants.ts
T005: Rewrite auth types in src/features/auth/types/auth.types.ts
T006: Strip auth service in src/features/auth/services/auth.service.ts
T007: Delete app/(auth)/create-school.tsx
T008: Delete supabase/functions/create-school/
T009: Delete supabase/functions/reset-member-password/
T011: Add i18n strings in src/i18n/en.json + ar.json

# Then launch placeholder groups in parallel:
T012: Create app/(supervisor)/ route group
T013: Create app/(program-admin)/ route group
T014: Create app/(master-admin)/ route group

# Then routing (parallel, different files):
T015: Extend AuthGuard in app/_layout.tsx
T016: Extend redirects in app/index.tsx
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup (1 task)
2. Complete Phase 2: Foundational (15 tasks)
3. Complete Phase 3: US1 — OAuth Sign-In (5 tasks)
4. **STOP and VALIDATE**: Test OAuth on physical device, verify student dashboard
5. This alone delivers: user acquisition via OAuth, 7-role routing, placeholder screens

### Incremental Delivery

1. Setup + Foundational → Foundation ready (16 tasks)
2. Add US1 → OAuth works on device → **MVP** (21 tasks)
3. Add US2 → Dev pills work on simulator → Development unblocked (25 tasks)
4. Add US3 → Admin role promotion works → Org hierarchy enabled (28 tasks)
5. Add US4 → Onboarding collects demographics → Polish complete (30 tasks)
6. Polish → Verification (32 tasks)

### Suggested Execution Order for Solo Developer

1. T001 → T002 → T003-T009 (parallel) → T010 → T011-T014 (parallel) → T015-T016 (parallel)
2. T017 → T018 → T019 → T020 → T021 (US1 chain)
3. T022 → T023 → T024 → T025 (US2 chain)
4. T026 + T027 (parallel) → T028 (US3)
5. T029 → T030 (US4)
6. T031 → T032 (Polish)

---

## Summary

| Phase | Tasks | Parallel Opportunities |
|-------|-------|----------------------|
| Phase 1: Setup | 1 | — |
| Phase 2: Foundational | 15 | T003-T009 (7 parallel), T011-T014 (4 parallel), T015-T016 (2 parallel) |
| Phase 3: US1 — OAuth Sign-In | 5 | T020 parallel with T017-T019 chain |
| Phase 4: US2 — Dev Role Pills | 4 | T024 parallel with T023 |
| Phase 5: US3 — Admin Role Promotion | 3 | T027 parallel with T026 |
| Phase 6: US4 — Onboarding | 2 | — |
| Phase 7: Polish | 2 | T031 parallel with others |
| **Total** | **32** | |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after Phase 2
- US3 can run fully in parallel with US1 (different files, no shared dependencies)
- Seed data (T022) requires migration (T002) to be applied first (`npx supabase db reset`)
- The `useLogin` hook and `AuthFormField` component are deleted in T021 (replaced by `useOAuthLogin` + `useDevLogin`; AuthFormField was unused dead code)
- Edge function deletions (T008, T009) require removing the directories: `supabase/functions/create-school/` and `supabase/functions/reset-member-password/`
- FR-013 (duplicate email linking) and FR-014 (Apple Hide My Email) are handled natively by Supabase Auth — no custom task needed
- FR-019 (OAuth provider links) is managed by Supabase's `auth.identities` table — no custom task needed
