# Quickstart: Session Join Flow

**Feature**: 005-session-join-flow
**Date**: 2026-03-02

## Prerequisites

- Node.js 18+, npm
- Docker (for local Supabase)
- Expo CLI (`npx expo`)
- iOS Simulator or Android Emulator (or physical device with Expo Go)

## Setup

### 1. Install dependencies (if not already)

```bash
npm install
```

No new packages are required for this feature. All dependencies (Supabase JS, TanStack Query, @gorhom/bottom-sheet, expo-linking, expo-notifications) are already installed.

### 2. Start local Supabase

```bash
npm run supabase:start
```

### 3. Apply migrations

```bash
npm run supabase:reset
```

This applies all migrations including the new `sessions.status` CHECK constraint update.

### 4. Regenerate types

```bash
npm run supabase:gen-types
```

### 5. Start the Expo dev server

```bash
npx expo start
```

## Testing Deep Links

### iOS Simulator

```bash
xcrun simctl openurl booted "werecitetogether://session/join?teacher=TEACHER_UUID&program=PROGRAM_UUID"
```

### Android Emulator

```bash
adb shell am start -W -a android.intent.action.VIEW -d "werecitetogether://session/join?teacher=TEACHER_UUID&program=PROGRAM_UUID"
```

### Physical Device

Share a deep link via messaging app and tap it, or use Expo's `npx uri-scheme open` tool.

## Key File Locations

### Screens (to create)
- `app/(student)/programs/[programId]/available-teachers.tsx` — Main browsing screen
- `app/(student)/queue-claim.tsx` — Queue claim screen
- `app/(student)/session-join.tsx` — Deep link entry screen

### Existing Features (to enhance)
- `src/features/sessions/` — Session service, hooks, JoinSessionFlow
- `src/features/teacher-availability/` — Service, hooks, components, realtime
- `src/features/queue/` — Service, hooks, components, realtime
- `src/features/notifications/` — Handler, categories, types

### New Components (to create)
- `src/features/sessions/components/PostSessionPrompt.tsx`
- `src/features/sessions/hooks/useActiveDraftSession.ts`
- `src/features/sessions/hooks/usePostSessionDetection.ts`
- `src/features/queue/components/QueueOfferBanner.tsx`

### Migrations
- `supabase/migrations/00006_session_join_flow.sql`

### Edge Functions
- `supabase/functions/expire-draft-sessions/index.ts` (new)

### i18n
- `src/i18n/locales/en.json` — Add session-join, queue, post-session keys
- `src/i18n/locales/ar.json` — Arabic translations

## Seed Data for Testing

To test the join flow locally, you need:

1. **A teacher profile** with `meeting_link` and `meeting_platform` set
2. **A program** with `category = 'free'`
3. **Teacher enrolled** in the program with a teacher role
4. **Student enrolled** in the program
5. **Teacher availability** record with `is_available = true`

Check existing seed data or insert test records via Supabase Studio (localhost:54323).

## Architecture Notes

- **No new API layer** — all data access via Supabase JS SDK in service files
- **Realtime** — teacher_availability and free_program_queue already have realtime subscriptions
- **Meeting link protection** — link is only fetched server-side during draft session creation, never exposed in teacher list queries (enforced by service layer, not RLS)
- **Queue single-entry** — enforced at application level in queueService.joinQueue()
- **Daily limit** — checked before allowing join, configurable via programs.settings JSONB
