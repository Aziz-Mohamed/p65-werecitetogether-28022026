# API Contracts: Auth Evolution (OAuth)

**Feature Branch**: `001-auth-evolution`
**Date**: 2026-03-03

This feature uses Supabase SDK calls directly (per Constitution VII — no ORM, no repository abstraction). Contracts are defined as SDK call signatures and expected behaviors.

## 1. OAuth Sign-In (Google)

**SDK Call**: `supabase.auth.signInWithIdToken()`

```typescript
// Input
{
  provider: 'google',
  token: string,  // ID token from @react-native-google-signin/google-signin
}

// Success Response (Supabase Session)
{
  data: {
    user: {
      id: string,           // UUID
      email: string,        // Google email
      user_metadata: {
        name: string,        // Google display name
        picture: string,     // Google avatar URL
        email: string,
        email_verified: boolean,
      },
    },
    session: {
      access_token: string,
      refresh_token: string,
      expires_in: number,
      token_type: 'bearer',
    },
  },
  error: null,
}

// Error Response
{
  data: { user: null, session: null },
  error: {
    message: string,
    status: number,  // 400 invalid token, 422 user banned, etc.
  },
}
```

**Side effect**: On first sign-in, the `handle_new_profile` trigger creates a profile row with `role='student'`, `full_name` from Google's `name` field, `school_id=NULL`.

## 2. OAuth Sign-In (Apple)

**SDK Call**: `supabase.auth.signInWithIdToken()`

```typescript
// Input
{
  provider: 'apple',
  token: string,  // identityToken from expo-apple-authentication
}

// Response: same shape as Google (section 1)
```

**Special handling**: Apple only provides `fullName` on first authorization. The client must call `supabase.auth.updateUser()` immediately after first sign-in to persist the name:

```typescript
// After first Apple sign-in (fullName is non-null)
await supabase.auth.updateUser({
  data: {
    full_name: `${credential.fullName.givenName} ${credential.fullName.familyName}`,
  },
});
```

## 3. Development Test Login (dev pills)

**SDK Call**: `supabase.auth.signInWithPassword()`

```typescript
// Input (only in __DEV__ builds)
{
  email: `dev-${role}@test.werecitetogether.app`,
  password: 'devtest123',
}

// Response: same session shape as OAuth
```

**Precondition**: Test users must exist in the database (created by `supabase/seed.sql`).

## 4. Sign Out

**SDK Call**: `supabase.auth.signOut()`

```typescript
// Input: none
// Success: { error: null }
// Error: { error: { message: string } }
```

**Side effect**: Clears session from SecureStore. Push token cleanup (existing behavior preserved).

## 5. Get Current Session

**SDK Call**: `supabase.auth.getSession()`

```typescript
// Response
{
  data: {
    session: {
      access_token: string,
      refresh_token: string,
      user: { id: string, email: string, ... },
    } | null,
  },
  error: null,
}
```

## 6. Profile Read

**SDK Call**: `supabase.from('profiles').select('*').eq('id', userId).single()`

```typescript
// Response shape (after auth evolution)
{
  id: string,              // UUID
  school_id: string | null, // NULL for OAuth users
  role: 'student' | 'teacher' | 'parent' | 'admin'
      | 'supervisor' | 'program_admin' | 'master_admin',
  full_name: string,
  avatar_url: string | null,
  phone: string | null,
  preferred_language: string,  // 'en' | 'ar'
  created_at: string,
  updated_at: string,
  username: string | null,    // NULL for OAuth users
  name_localized: Record<string, string>,
  bio: string | null,         // NEW
  onboarding_completed: boolean, // NEW
}
```

## 7. Profile Update (onboarding)

**SDK Call**: `supabase.from('profiles').update(data).eq('id', userId)`

```typescript
// Input (onboarding completion)
{
  full_name: string,
  preferred_language: 'en' | 'ar',
  bio?: string,
  name_localized: { en: string, ar?: string },
  onboarding_completed: true,
}

// RLS: "Users can update own profile" (id = auth.uid())
```

## 8. Role Update (admin action)

**Edge Function**: `create-member` (repurposed as role-update)

```typescript
// Request
POST /functions/v1/create-member
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{
  action: 'update-role',    // NEW action type
  userId: string,           // Target user's UUID
  role: UserRole,           // New role to assign
}

// Success Response (200)
{
  profile: {
    id: string,
    role: string,
    full_name: string,
  },
}

// Error Responses
// 400: Invalid role or action
// 403: Insufficient permissions (admin trying to assign supervisor/program_admin/master_admin)
// 404: Target user not found
```

**Authorization rules**:
- Caller must have role `admin` or `master_admin`
- Admin can assign: `student`, `teacher`, `parent`
- Master_admin can assign: all 7 roles
- No user can change their own role via this endpoint

## 9. Auth State Change Listener

**SDK Call**: `supabase.auth.onAuthStateChange(callback)`

```typescript
// Callback signature
(event: AuthChangeEvent, session: Session | null) => void

// Events handled:
// 'SIGNED_IN' → set session + fetch profile → route to dashboard
// 'SIGNED_OUT' → clear auth store → route to login
// 'TOKEN_REFRESHED' → update session in store
// 'USER_UPDATED' → re-fetch profile (for role changes)
```
