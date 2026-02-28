# Research: WeReciteTogether Core Platform

**Date**: 2026-02-28
**Feature**: 001-platform-core

## R1: OAuth Authentication with Supabase (Google + Apple)

**Decision**: Use Supabase Auth with native OAuth providers — Google Sign-In via `@react-native-google-signin/google-signin` and Apple Sign-In via `expo-apple-authentication`.

**Rationale**: Supabase Auth supports both providers natively. The `signInWithIdToken` method accepts a provider token from the native SDK and creates/matches a Supabase user. This avoids browser-based OAuth flows (which are jarring on mobile) and provides a seamless native experience.

**Alternatives considered**:
- Browser-based OAuth (`signInWithOAuth`): Rejected — opens an in-app browser, poor UX on mobile, slower, and requires redirect URI handling.
- Custom OAuth server: Rejected — unnecessary complexity, Supabase handles it.

**Implementation notes**:
- Google: `@react-native-google-signin/google-signin` provides the ID token → pass to `supabase.auth.signInWithIdToken({ provider: 'google', token: idToken })`
- Apple: `expo-apple-authentication` provides the identity token → pass to `supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })`
- On first sign-in, a profile row is created via a Postgres trigger (`on auth.users insert`) with `role = 'student'` and `onboarding_completed = false`
- The app checks `onboarding_completed` after auth — if false, redirect to onboarding screen

## R2: Voice Memo Recording & Playback

**Decision**: Use `expo-av` for both recording and playback. Store files in Supabase Storage bucket `voice-memos`.

**Rationale**: `expo-av` is the standard Expo audio library, provides recording quality controls, and works in managed workflow. It supports all needed features: recording, playback, seek, speed control.

**Alternatives considered**:
- `react-native-audio-recorder-player`: Rejected — not Expo-compatible in managed workflow.
- `expo-audio` (new module): Still experimental, less documentation. Could migrate later.

**Implementation notes**:
- Recording format: AAC (M4A) at 32kbps for speech-quality compression (~60KB/min)
- Max duration: 120 seconds (enforced in UI with countdown)
- Upload path: `voice-memos/{session_id}/{timestamp}.m4a`
- Playback: `expo-av` Audio.Sound with `rate` prop for speed control (1x, 1.25x, 1.5x)
- Cleanup: Edge Function cron job runs daily, deletes files where `expires_at < now()` and removes DB rows
- Offline: Recording saved to local temp file; upload queued for when connectivity restores

## R3: Real-Time Teacher Availability

**Decision**: Use Supabase Realtime subscriptions on the `teacher_availability` table with `postgres_changes` channel.

**Rationale**: The existing codebase already has a robust realtime infrastructure (`src/features/realtime/`). Teacher availability is a natural fit — INSERT/UPDATE/DELETE on `teacher_availability` propagate to all connected students viewing the "Available Now" list.

**Alternatives considered**:
- Polling: Rejected — 2-second propagation target requires near-real-time; polling at 1s intervals is wasteful.
- Supabase Broadcast (ephemeral): Rejected — we need the availability state persisted for query on app open, not just live broadcasts.

**Implementation notes**:
- Subscribe to `teacher_availability` changes filtered by `program_id`
- Use the existing `useRealtimeSubscription` hook pattern from `src/features/realtime/`
- Invalidate TanStack Query cache for `['teacher-availability', programId]` on change events
- Draft session creation also triggers an update to the availability record (current student count)

## R4: Free Program Queue Implementation

**Decision**: Database-backed queue with Supabase Realtime for position updates and Edge Functions for notification dispatch.

**Rationale**: The queue must survive app closes (student should retain position even if they leave the app), which rules out purely ephemeral solutions. A database-backed queue with Supabase Realtime provides persistence + live position updates.

**Alternatives considered**:
- In-memory queue (Supabase Broadcast): Rejected — lost on disconnect, can't survive app restart.
- External queue service (Redis, SQS): Rejected — adds infrastructure cost and complexity for a volunteer platform.

**Implementation notes**:
- `free_program_queue` table with ordered positions per program
- When teacher becomes available: database trigger fires → calls Edge Function `queue-processor` → sends push notification to first-in-queue student
- 3-minute claim window tracked via `notified_at` + `status` transition (waiting → notified → claimed/expired)
- 2-hour auto-expiry via a scheduled check (can piggyback on the voice memo cleanup cron)
- Position updates propagate via Realtime subscription to connected students

## R5: Offline Caching Strategy

**Decision**: Use TanStack Query's built-in cache persistence via `@tanstack/query-async-storage-persister` + AsyncStorage. Read-only offline — all mutations require connectivity.

**Rationale**: TanStack Query already manages all server state. Adding persistence means cached query results survive app restarts. Since all writes go through Supabase (which requires connectivity), the "read-only offline" requirement maps perfectly to TanStack Query's cache model without needing a separate sync engine.

**Alternatives considered**:
- WatermelonDB (local-first): Rejected — massive complexity for read-only offline; overkill.
- Custom SQLite cache: Rejected — TanStack Query persistence handles this with 3 lines of config.

**Implementation notes**:
- Add `@tanstack/query-async-storage-persister` + `@tanstack/react-query-persist-client`
- Wrap `QueryClientProvider` with `PersistQueryClientProvider`
- Set `gcTime` to `Infinity` for persisted queries (programs, profile, session history)
- Mutations check `NetInfo` and show "You're offline" toast before attempting
- When connectivity restores, `onlineManager` from TanStack Query triggers refetch of stale queries

## R6: Supabase OAuth + App Configuration

**Decision**: Update `app.json` to WeReciteTogether branding, add Google/Apple OAuth Expo plugins, configure Supabase Auth providers.

**Rationale**: The existing app.json references "Quran School" — all identifiers need updating. OAuth requires native module configuration through Expo plugins.

**Implementation notes**:
- Bundle ID: `com.werecitetogether.app` (iOS + Android)
- App name: "نتلو معاً" (Arabic) / "WeReciteTogether" (English display)
- Expo plugins to add: `@react-native-google-signin/google-signin`, `expo-apple-authentication`
- Supabase Dashboard: Enable Google + Apple providers, configure OAuth client IDs
- Remove: `expo-location` plugin (GPS no longer needed), WiFi entitlement

## R7: Database Migration Strategy

**Decision**: Single consolidated migration that creates the full WeReciteTogether schema from scratch, dropping all Quran School tables first.

**Rationale**: Since this is a new Supabase project (not migrating live data), a clean-slate consolidated migration is simpler and more maintainable than incremental migrations from the existing schema.

**Alternatives considered**:
- Incremental migrations (ALTER TABLE, rename, etc.): Rejected — the schema changes are too fundamental (different tenancy model, different roles, different core tables). Incremental would be error-prone.
- Keep old tables alongside new: Rejected — creates confusion and bloat.

**Implementation notes**:
- Archive existing `supabase/migrations/` to `supabase/migrations-archive/`
- Create new `00001_werecitetogether_schema.sql` with all tables, RLS, functions, triggers
- Create `00002_seed_programs.sql` with the 8 programs and tracks from PRD Appendix A
- Create `00003_storage_buckets.sql` for voice-memos bucket
- Drop old RPC functions (`get_user_school_id`, etc.) and create new ones (`get_user_programs`, updated `get_user_role`)
