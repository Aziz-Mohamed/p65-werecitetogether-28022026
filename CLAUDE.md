# Project Rules

## Git Commits

- NEVER commit, push, or create PRs unless the user explicitly asks you to. Always wait for user review and approval first.
- NEVER add "Co-Authored-By: Claude" or any similar attribution line to commit messages.
- NEVER mention Claude, AI, or any AI assistant in commit messages, PR descriptions, or code comments.
- Write commit messages as if a human developer wrote them.

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
- TypeScript 5.9 (strict mode) + React Native 0.81.5, Expo ~54, Expo Router v6, React 19, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next, FlashList 2, expo-image 3, @gorhom/bottom-sheet 5, expo-av (to add), expo-notifications (001-platform-core)
- Supabase PostgreSQL (remote), expo-secure-store (auth tokens), AsyncStorage (preferences), Supabase Storage (voice memos) (001-platform-core)
- TypeScript 5.9 (strict mode) + React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next, FlashList 2, react-native-svg 15, expo-file-system ~19, react-native-view-shot (NEW), react-native-qrcode-svg (NEW) (001-program-features)
- Supabase PostgreSQL (remote) — 8 new tables, 0 modified tables. Supabase Storage — 1 new bucket (certificates). (001-program-features)

## Supabase Development Workflow (Local-First)
- ALWAYS develop against the LOCAL Supabase instance (Docker). NEVER apply schema changes directly to production during development.
- Local Supabase: `npm run supabase:start` to start, `npm run supabase:stop` to stop.
- Schema changes MUST be written as migration files in `supabase/migrations/`. Apply locally with `npm run supabase:reset`.
- After ANY local schema change, ALWAYS regenerate types: `npm run supabase:gen-types` (generates from local DB).
- `src/types/database.types.ts` is AUTO-GENERATED — NEVER edit it manually.
- Do NOT create types in `supabase/types/`. All generated types go to `src/types/database.types.ts`.
- When development is complete and tested locally, push migrations to production: `npm run supabase:push`
- After pushing to production, verify types match: `npm run supabase:gen-types:remote`
- Preview schema diff between local migrations and remote: `npm run supabase:diff`
- NEVER use MCP `apply_migration` — it applies directly to production and causes drift. ALL schema changes must go through local migration files.
- The app connects to local Supabase during development via `.env` (localhost URLs) and to production via production `.env`.

## Recent Changes
- 001-program-features: Added TypeScript 5.9 (strict mode) + React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next, FlashList 2, react-native-svg 15, expo-file-system ~19, react-native-view-shot (NEW), react-native-qrcode-svg (NEW)
- 001-mvp-phase1: Added TypeScript 5.9 (strict mode) / React Native 0.83 / React 19 + Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next + react-i18next, FlashList 2, expo-image 3, react-native-calendars, victory-native, @gorhom/bottom-sheet 5
