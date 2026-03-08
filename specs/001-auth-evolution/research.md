# Research: Auth Evolution (OAuth)

**Feature Branch**: `001-auth-evolution`
**Date**: 2026-03-03

## R1: OAuth Library Choice for React Native + Expo

**Decision**: Use `@react-native-google-signin/google-signin` for Google and `expo-apple-authentication` for Apple. Both feed tokens to Supabase `signInWithIdToken()`.

**Rationale**: Supabase documentation recommends native sign-in libraries over web-based OAuth redirects for mobile apps. Native libraries provide better UX (no browser popup), better security (OS-level token handling), and work reliably on both iOS and Android. The `signInWithIdToken` method accepts an ID token from any native provider and exchanges it server-side, keeping the Supabase session management intact.

**Alternatives considered**:
- `expo-auth-session` (web-based OAuth redirect): Works on simulators but worse UX on physical devices (opens browser). Not recommended by Supabase for production mobile apps.
- `supabase.auth.signInWithOAuth()` (web redirect flow): Opens a browser window, poor mobile experience, deep linking complexity.
- Direct REST API calls to Google/Apple: Over-engineering, loses Supabase Auth integration benefits.

**Key implementation detail**: Both Google and Apple native libraries return an ID token. This token is passed to `supabase.auth.signInWithIdToken({ provider: 'google'|'apple', token: idToken })`. Supabase verifies the token server-side and creates/signs-in the user. The `handle_new_profile` trigger then auto-creates the profile row.

## R2: Development Test Pills Pattern

**Decision**: Use React Native's `__DEV__` global flag to conditionally render role pills on the login screen. Pills sign in using pre-seeded test users in the local/development database via Supabase email/password auth.

**Rationale**: `__DEV__` is `true` in development builds and `false` in production builds. This is compiled out at build time by Metro bundler — there is zero risk of test pills appearing in production. Pre-seeded test users (one per role) in `supabase/seed.sql` provide consistent, repeatable test accounts.

**Alternatives considered**:
- Environment variable flag (`EXPO_PUBLIC_DEV_MODE`): Works but adds another config point. `__DEV__` is simpler and can't be accidentally misconfigured.
- Mock auth service (intercept all auth calls): Over-engineering for development convenience. Real Supabase calls with test users better simulate production behavior.
- Expo dev-client custom plugin: Too complex for a simple UI toggle.

**Test user seeding strategy**: `supabase/seed.sql` creates 7 auth users (one per role) using `supabase.auth.admin.createUser()` via raw SQL against `auth.users` or via a seed edge function. Each test user has email `dev-{role}@test.werecitetogether.app` and a fixed password. The `handle_new_profile` trigger auto-creates their profiles.

## R3: Profile Trigger Adaptation for OAuth Users

**Decision**: Update `handle_new_profile()` trigger to handle OAuth users who lack `school_id` in their metadata. Extract display name from OAuth provider data (`name` or `full_name` field in `raw_user_meta_data`). Default role to `'student'`.

**Rationale**: The current trigger reads `school_id` from `raw_user_meta_data` and casts to UUID. For OAuth users, this field is absent. Google OAuth provides `name`, `email`, `picture` in user metadata. Apple provides `email` (and `name` only on first sign-in). The trigger must gracefully handle missing fields.

**Current trigger logic** (lines 454-475 of consolidated migration):
```sql
INSERT INTO public.profiles (id, school_id, role, full_name, username, name_localized)
VALUES (
  NEW.id,
  (NEW.raw_user_meta_data->>'school_id')::UUID,  -- FAILS if null (NOT NULL constraint)
  COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
  COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
  NEW.raw_user_meta_data->>'username',
  COALESCE(
    (NEW.raw_user_meta_data->>'name_localized')::JSONB,
    jsonb_build_object('en', COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  )
);
```

**Updated trigger logic**:
```sql
INSERT INTO public.profiles (id, school_id, role, full_name, username, name_localized)
VALUES (
  NEW.id,
  (NEW.raw_user_meta_data->>'school_id')::UUID,  -- NULL for OAuth users (school_id now NULLABLE)
  COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
  COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',        -- Google OAuth provides 'name'
    split_part(COALESCE(NEW.email, ''), '@', 1)  -- fallback: email prefix
  ),
  NEW.raw_user_meta_data->>'username',
  COALESCE(
    (NEW.raw_user_meta_data->>'name_localized')::JSONB,
    jsonb_build_object('en', COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ))
  )
);
```

## R4: school_id Nullable Strategy

**Decision**: Make `school_id` NULLABLE on the profiles table. OAuth users will have `school_id = NULL`. Existing rows keep their school_id values. Existing RLS policies using `get_user_school_id()` continue to work for legacy data.

**Rationale**: New OAuth users don't belong to a "school" — they are the beginning of the program-scoped model (spec 003). The Constitution requires that `school_id` columns are NOT removed (backward compatibility), but doesn't prohibit relaxing the NOT NULL constraint. This is the minimal, non-destructive change that enables OAuth self-registration.

**Impact analysis**:
- Existing RLS policies use `school_id = get_user_school_id()`. For OAuth users with `school_id = NULL`, `get_user_school_id()` returns NULL, and `NULL = NULL` is FALSE in SQL. This means OAuth users cannot see any legacy school-scoped data — which is correct behavior (they don't belong to a school).
- The `profiles_school_id_fkey` foreign key constraint uses `ON DELETE CASCADE`. Making it nullable doesn't affect this.
- Existing application code that reads `profile.school_id` must handle `null` gracefully. The auth store and useAuth hook already use optional chaining.

**Alternatives considered**:
- Create a default "global school" record: Semantic hack — a school with no real meaning.
- Add `program_id` to profiles now: Premature — programs don't exist yet (spec 003).
- Keep school_id NOT NULL and create a placeholder: Would confuse admin queries and reports.

## R5: Edge Function Strategy

**Decision**: Delete `create-school` and `reset-member-password` edge functions. Modify `create-member` to become a role-promotion function (no password creation, supports 7 roles, role-gated access).

**Rationale**:
- `create-school`: No longer needed — there's no school creation flow in the OAuth model.
- `reset-member-password`: OAuth users reset passwords via their OAuth provider (Google/Apple account settings). No in-app password reset.
- `create-member`: Still needed for admin role promotion but must be adapted — instead of creating a new auth user with a password, it updates an existing user's role. Renamed conceptually to "update-member-role" but can keep the same function slug for simplicity.

**Role-gating for create-member**:
- Regular admin: Can set role to student, teacher, parent only
- Master admin: Can set any of the 7 roles
- All other roles: Forbidden (403)

## R6: Apple Sign-In First Login Name Handling

**Decision**: On first Apple Sign-In, capture `fullName` from the credential response and store it via `supabase.auth.updateUser({ data: { full_name } })`. The `handle_new_profile` trigger uses this from `raw_user_meta_data`.

**Rationale**: Apple only provides the user's full name during the first authorization. Subsequent sign-ins return `null` for name fields. If we don't capture it immediately, the user's display name is permanently lost. Supabase stores `updateUser` data in `raw_user_meta_data`, which the trigger reads.

**Implementation**: In the `useOAuthLogin` hook, after Apple sign-in succeeds:
1. Check if `credential.fullName` is non-null
2. If so, call `supabase.auth.updateUser({ data: { full_name: formatName(credential.fullName) } })`
3. The profile's `full_name` is populated by the trigger on first sign-in, or updated via this call
