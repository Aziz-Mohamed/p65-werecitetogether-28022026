# Project Rules

## Git Commits

- NEVER commit, push, or create PRs unless the user explicitly asks you to. Always wait for user review and approval first.
- NEVER add "Co-Authored-By: Claude" or any similar attribution line to commit messages.
- NEVER mention Claude, AI, or any AI assistant in commit messages, PR descriptions, or code comments.
- Write commit messages as if a human developer wrote them.

## Supabase Workflow

### Local-First Development
- ALL schema changes MUST be written as migration files in `supabase/migrations/` FIRST.
- NEVER apply DDL changes directly to the remote database. The local `supabase/migrations/` folder is the single source of truth.
- Test migrations locally with `supabase db reset` before considering remote deployment.

### Remote Database Protection
- NEVER use MCP tools (`apply_migration`, `execute_sql` with DDL) to modify the remote Supabase schema unless the user explicitly says to push/deploy.
- Read-only queries (`SELECT`) via `execute_sql` are safe and do not require approval.
- Before applying migrations to remote, list the migration names and summarize changes for user review.

### Edge Functions
- Develop edge functions locally in `supabase/functions/<name>/index.ts`.
- NEVER deploy edge functions to remote unless the user explicitly asks to deploy.

### Migration Naming
- Follow the numbered pattern: `NNNNN_snake_case_description.sql` (e.g., `00004_add_badges_table.sql`).
- Use `IF NOT EXISTS` / `IF EXISTS` where possible for idempotency.

### TypeScript Types
- After schema changes are applied to remote, regenerate types via the `generate_typescript_types` MCP tool.
- Types live in `supabase/types/database.types.ts`.

### Remote Project
- Project ID: `cwakivlyvnxdeqrkbzxc`
- Region: `ap-northeast-2`

## Active Technologies
- TypeScript 5.9 (strict mode) / React Native 0.83 / React 19 + Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next + react-i18next, FlashList 2, expo-image 3, react-native-calendars, victory-native, @gorhom/bottom-sheet 5 (001-mvp-phase1)
- Supabase PostgreSQL (remote), expo-secure-store (auth tokens), AsyncStorage (preferences) (001-mvp-phase1)
- TypeScript 5.9 (strict mode) + React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, victory-native 41.20.2, Supabase JS 2 (002-reports-analytics)
- Supabase PostgreSQL (remote) — existing tables: sessions, attendance, students, student_stickers, classes, profiles, levels (002-reports-analytics)
- TypeScript 5.9 (strict mode) + `@supabase/supabase-js` v2 (Realtime built-in), `@tanstack/react-query` v5, Expo ~54, React Native 0.83 (003-realtime-updates)
- No new storage — subscribes to existing Supabase PostgreSQL tables via Realtime (003-realtime-updates)
- TypeScript 5.9 (strict mode), Deno (Edge Functions) + expo-notifications, expo-device, expo-constants, @supabase/supabase-js 2, Expo Push API (004-push-notifications)
- Supabase PostgreSQL — 2 new tables (`push_tokens`, `notification_preferences`), 1 altered table (`schools` — timezone column) (004-push-notifications)
- TypeScript 5.9 (strict mode) + React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, react-native-reanimated 4, i18next + react-i18next, @gorhom/bottom-sheet 5 (001-gamification-redesign)
- Supabase PostgreSQL (remote) — 2 new tables, 5 dropped tables, 3 modified tables/functions (001-gamification-redesign)
- TypeScript 5.9 (strict mode) + Expo ~54, React Native 0.83, React 19, Expo Router v6, Supabase JS 2, i18next + react-i18nex (001-phase0-setup)
- Supabase PostgreSQL (remote) — no schema changes in this spec (001-phase0-setup)
- TypeScript 5.9 (strict mode) + Deno (Edge Functions) + React Native 0.83, Expo ~54, Expo Router v6, @supabase/supabase-js 2, @react-native-google-signin/google-signin, expo-apple-authentication, zustand 5, react-hook-form 7 + zod 4, i18next + react-i18nex (001-auth-evolution)
- TypeScript 5.9 (strict mode) + React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, Zustand 5, react-hook-form 7 + zod 4, i18next + react-i18next, FlashList 2, Ionicons (003-programs-enrollment)
- Supabase PostgreSQL (remote) — 5 new tables, 0 modified tables (003-programs-enrollment)
- TypeScript 5.9 (strict mode) + React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, i18next, FlashList 2, react-hook-form 7 + zod 4 (004-teacher-availability)
- Supabase PostgreSQL (remote) — 1 new table, 1 altered table, 3 new RPC functions, 1 trigger, 1 pg_cron job (004-teacher-availability)

## Recent Changes
- 001-mvp-phase1: Added TypeScript 5.9 (strict mode) / React Native 0.83 / React 19 + Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next + react-i18next, FlashList 2, expo-image 3, react-native-calendars, victory-native, @gorhom/bottom-sheet 5
