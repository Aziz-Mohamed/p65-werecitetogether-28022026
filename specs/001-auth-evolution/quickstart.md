# Quickstart: Auth Evolution (OAuth)

**Feature Branch**: `001-auth-evolution`
**Date**: 2026-03-03

## Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- Supabase CLI (`npx supabase`)
- iOS Simulator (Xcode) or Android Emulator
- Google Cloud Console access (for Google OAuth client ID)
- Apple Developer Account (for Apple Sign-In)

## Local Development Setup

### 1. Install new dependencies

```bash
npm install @react-native-google-signin/google-signin expo-apple-authentication expo-crypto
```

- `@react-native-google-signin/google-signin`: Native Google Sign-In for React Native
- `expo-apple-authentication`: Native Apple Sign-In for Expo
- `expo-crypto`: Nonce generation for Apple Sign-In security

### 2. Apply database migration

```bash
npx supabase db reset
```

This applies all migrations including `00004_auth_evolution.sql` which:
- Makes `profiles.school_id` nullable
- Extends the role CHECK constraint to 7 roles
- Adds `bio` and `onboarding_completed` columns
- Updates `handle_new_profile()` trigger for OAuth metadata
- Adds "Users can read own profile" RLS policy

### 3. Seed test users

After `db reset`, seed data is automatically applied from `supabase/seed.sql`. This creates 7 test users (one per role) for development pill testing.

Verify seed data:
```bash
npx supabase db execute "SELECT email, role FROM auth.users JOIN profiles ON auth.users.id = profiles.id ORDER BY role;"
```

### 4. Configure OAuth providers (for physical device testing)

**Google OAuth**:
1. Go to [Google Cloud Console](https://console.cloud.google.com/auth/clients)
2. Create OAuth 2.0 client IDs for:
   - iOS: Use bundle ID `com.werecitetogether.app`
   - Android: Use package `com.werecitetogether.app` + SHA-1 fingerprint
   - Web: Required for Supabase server-side verification
3. In Supabase Dashboard → Authentication → Providers → Google:
   - Enable Google provider
   - Add Web client ID and client secret
   - Add all client IDs (comma-separated, web ID first)

**Apple Sign-In**:
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers)
2. Enable "Sign in with Apple" capability for App ID `com.werecitetogether.app`
3. Create a Services ID for web-based verification
4. In Supabase Dashboard → Authentication → Providers → Apple:
   - Enable Apple provider
   - Add Services ID, Team ID, and Key ID

### 5. Run the app

```bash
# Development (with test pills visible)
npx expo start

# iOS simulator
npx expo run:ios

# Android emulator
npx expo run:android
```

On the simulator, use the role pills on the login screen to sign in as any of the 7 roles without OAuth.

## Development Workflow

### Testing auth flows on simulator (no OAuth)

1. Launch app on simulator
2. Login screen shows role pills (dev mode only)
3. Tap any role pill (e.g., "Student") to sign in as that test user
4. Verify correct dashboard loads
5. Sign out and try another role

### Testing OAuth on physical device

1. Build a development client: `npx expo run:ios --device` or `npx expo run:android --device`
2. Tap "Sign in with Google" or "Sign in with Apple"
3. Complete the provider consent screen
4. Verify new profile created with role "student"
5. Complete onboarding flow
6. Verify dashboard loads with correct locale

### Testing role promotion

1. Sign in as admin (via dev pill or OAuth)
2. Navigate to user management
3. Select a user and change their role
4. Sign out
5. Sign in as the promoted user
6. Verify they see the correct dashboard for their new role

## Key Files

| File | Purpose |
|------|---------|
| `src/features/auth/hooks/useOAuthLogin.ts` | Google + Apple OAuth sign-in hook |
| `src/features/auth/hooks/useDevLogin.ts` | Development test pill sign-in |
| `src/features/auth/components/OAuthButtons.tsx` | Sign-in button UI |
| `src/features/auth/components/DevRolePills.tsx` | Dev-only role pills |
| `app/(auth)/login.tsx` | Login screen (OAuth + dev pills) |
| `app/(auth)/onboarding.tsx` | Post-registration onboarding |
| `supabase/migrations/00004_auth_evolution.sql` | Schema changes |
| `supabase/seed.sql` | Test user seeding |

## Troubleshooting

**"No test users found" on simulator**: Run `npx supabase db reset` to re-apply seed data.

**Google Sign-In fails on physical device**: Verify the OAuth client ID matches the platform (iOS client ID for iOS, Android client ID for Android). Check that the web client ID is configured in Supabase.

**Apple Sign-In not showing**: Apple Sign-In requires a real device with iOS 13+ and a valid Apple Developer account. It won't work on the simulator — use dev pills instead.

**Profile not created after OAuth**: Check the `handle_new_profile` trigger logs: `npx supabase db logs --service postgres`. Ensure the trigger function was updated by the migration.

**school_id errors**: Ensure migration `00004_auth_evolution.sql` has been applied (makes school_id nullable). Run `npx supabase db reset` if needed.
