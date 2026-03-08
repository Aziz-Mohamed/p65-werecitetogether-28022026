# Data Model: Auth Evolution (OAuth)

**Feature Branch**: `001-auth-evolution`
**Date**: 2026-03-03
**Migration file**: `supabase/migrations/00004_auth_evolution.sql`

## Schema Changes

### 1. profiles table — ALTER (existing)

**Changes**:
- `school_id`: `NOT NULL` → `NULLABLE` (OAuth users have no school)
- `role` CHECK constraint: `('student','teacher','parent','admin')` → `('student','teacher','parent','admin','supervisor','program_admin','master_admin')`
- ADD `bio TEXT` (optional, from onboarding)
- ADD `onboarding_completed BOOLEAN NOT NULL DEFAULT false`

```sql
-- Make school_id nullable for OAuth users
ALTER TABLE profiles ALTER COLUMN school_id DROP NOT NULL;

-- Extend role CHECK constraint to 7 roles
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('student', 'teacher', 'parent', 'admin',
                  'supervisor', 'program_admin', 'master_admin'));

-- Add onboarding fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;
```

**Resulting columns**:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | — | PK, FK → auth.users |
| school_id | UUID | YES | — | FK → schools. NULL for OAuth users |
| role | TEXT | NO | — | CHECK(7 roles) |
| full_name | TEXT | NO | — | From OAuth provider or onboarding |
| avatar_url | TEXT | YES | — | |
| phone | TEXT | YES | — | |
| preferred_language | TEXT | NO | 'en' | Set during onboarding |
| created_at | TIMESTAMPTZ | NO | now() | |
| updated_at | TIMESTAMPTZ | NO | now() | Trigger-maintained |
| username | TEXT | YES | — | NULL for OAuth users |
| name_localized | JSONB | NO | '{}' | |
| bio | TEXT | YES | — | NEW: from onboarding |
| onboarding_completed | BOOLEAN | NO | false | NEW: tracks onboarding state |

### 2. handle_new_profile() — REPLACE (existing trigger function)

Updated to handle OAuth users who lack `school_id` and `full_name` in metadata. Falls back to Google's `name` field or email prefix.

```sql
CREATE OR REPLACE FUNCTION handle_new_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _full_name TEXT;
BEGIN
  -- Resolve full_name: custom metadata > OAuth 'name' > email prefix
  _full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );

  INSERT INTO public.profiles (id, school_id, role, full_name, username, name_localized)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'school_id')::UUID,  -- NULL for OAuth users
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    _full_name,
    NEW.raw_user_meta_data->>'username',
    COALESCE(
      (NEW.raw_user_meta_data->>'name_localized')::JSONB,
      jsonb_build_object('en', _full_name)
    )
  );
  RETURN NEW;
END;
$$;
```

### 3. prevent_role_self_update() — NEW trigger function (FR-020)

Prevents any non-service-role caller from changing the `role` column on profiles. Role changes MUST go through the `create-member` edge function (which uses the service_role key). This enforces FR-020 at the data layer — a user cannot escalate their own role via a direct Supabase client `UPDATE` call, even though the "Users can update own profile" RLS policy allows row-level updates.

```sql
CREATE OR REPLACE FUNCTION prevent_role_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND COALESCE(current_setting('request.jwt.claim.role', true), '') != 'service_role' THEN
    RAISE EXCEPTION 'Role changes must go through the admin edge function';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_role_update_via_service
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_role_self_update();
```

### 4. RLS Policy Updates — profiles table

**New policy**: Allow users with new roles to read their own profile:

```sql
-- Existing "Members can read school profiles" policy still works for school-scoped users.
-- Add policy for OAuth users (school_id IS NULL) to read their own profile:
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());
```

**Existing policies preserved** (no changes):
- "Members can read school profiles" — works for legacy school users
- "Users can update own profile" — works for all users (uses `id = auth.uid()`)
- "Admin can insert/delete profiles" — works for admin role management
- "Service role can insert profiles" — works for trigger-based profile creation

### 5. Seed Data — development test users

Seven test users seeded for development, one per role. Created via `supabase/seed.sql`.

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| dev-student@test.werecitetogether.app | devtest123 | student | Test Student |
| dev-teacher@test.werecitetogether.app | devtest123 | teacher | Test Teacher |
| dev-parent@test.werecitetogether.app | devtest123 | parent | Test Parent |
| dev-admin@test.werecitetogether.app | devtest123 | admin | Test Admin |
| dev-supervisor@test.werecitetogether.app | devtest123 | supervisor | Test Supervisor |
| dev-program-admin@test.werecitetogether.app | devtest123 | program_admin | Test Program Admin |
| dev-master-admin@test.werecitetogether.app | devtest123 | master_admin | Test Master Admin |

These users are created with `supabase.auth.admin.createUser()` in the seed file. The `handle_new_profile` trigger auto-creates profile rows. The `role` is passed via `user_metadata`.

## Entity Relationship Summary

```
auth.users (Supabase Auth)
    │
    │ 1:1 (trigger: handle_new_profile)
    ▼
profiles
    │ role IN ('student','teacher','parent','admin',
    │          'supervisor','program_admin','master_admin')
    │
    │ school_id → schools (NULLABLE, legacy)
    ▼
schools (legacy, preserved)
```

Supabase Auth internally manages OAuth provider links via the `auth.identities` table. No custom OAuth provider link table is needed — Supabase handles this natively.

## State Transitions

### User Authentication Flow

```
[No Account] → (OAuth Sign-In) → [Authenticated, role=student, onboarding_completed=false]
    → (Complete Onboarding) → [Authenticated, role=student, onboarding_completed=true]
    → (Admin Promotes) → [Authenticated, role=teacher|supervisor|etc., onboarding_completed=true]
```

### Role Transitions (admin-initiated only)

```
student ←→ teacher ←→ parent ←→ admin        (regular admin can assign)
student ←→ supervisor ←→ program_admin ←→ master_admin  (master_admin only)
Any role → Any role (master_admin can do all transitions)
```

No role self-assignment. All transitions enforced at the data layer (edge function + `prevent_role_self_update()` trigger).
