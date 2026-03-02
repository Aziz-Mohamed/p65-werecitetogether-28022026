# Quickstart: WeReciteTogether Core Platform

**Date**: 2026-02-28
**Feature**: 001-platform-core

## Prerequisites

- Node.js >= 18
- Expo CLI (`npx expo`)
- EAS CLI (`npm install -g eas-cli`)
- Supabase CLI (`brew install supabase/tap/supabase`)
- iOS Simulator (Xcode 15+) or Android Emulator
- Supabase project with Google + Apple OAuth providers configured

## Environment Setup

1. Clone and install:
```bash
git clone <repo>
cd p65-werecitetogether-28022026
git checkout 001-platform-core
npm install
```

2. Add `expo-av` (for voice memos) and OAuth dependencies:
```bash
npx expo install expo-av expo-apple-authentication @react-native-google-signin/google-signin
```

3. Configure environment variables (`.env`):
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

4. Set up Supabase:
```bash
supabase link --project-ref <project-ref>
supabase db push          # Apply migrations
supabase functions deploy  # Deploy edge functions
```

5. Configure OAuth in Supabase Dashboard:
   - Authentication → Providers → Google: Add Web Client ID + iOS/Android Client IDs
   - Authentication → Providers → Apple: Add Service ID + Team ID

6. Create Supabase Storage bucket:
   - Storage → New bucket → `voice-memos` (private, 2MB max file size)

## Running the App

```bash
# Development
npx expo start

# iOS (requires dev client for native OAuth modules)
npx expo run:ios

# Android
npx expo run:android
```

**Note**: OAuth sign-in requires a development build (not Expo Go) since it uses native modules (`@react-native-google-signin/google-signin`, `expo-apple-authentication`).

## Database Migration

After linking your Supabase project:

```bash
# Reset to clean state (development only!)
supabase db reset

# Or apply migrations incrementally
supabase migration up
```

Seed data (8 programs + tracks) is applied automatically via `00002_seed_programs.sql`.

## Key Commands

| Command | Description |
|---------|-------------|
| `npx expo start` | Start Metro bundler |
| `npx expo run:ios` | Build and run on iOS |
| `npx expo run:android` | Build and run on Android |
| `npm test` | Run Jest tests |
| `supabase db reset` | Reset local DB with migrations |
| `supabase gen types typescript --linked > src/types/database.types.ts` | Regenerate DB types |
| `supabase functions serve` | Run Edge Functions locally |
| `eas build --profile development` | Build dev client |

## Verification Checklist

After setup, verify:

- [ ] App launches and shows the OAuth sign-in screen
- [ ] Google Sign-In redirects back to app and creates a profile
- [ ] Apple Sign-In works on iOS
- [ ] Onboarding form appears for new users
- [ ] Programs list shows 8 seeded programs after onboarding
- [ ] Supabase types regenerated successfully
- [ ] Edge Functions deploy without errors
- [ ] Voice memos Storage bucket is accessible
