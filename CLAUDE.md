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
- TypeScript 5.9 (strict mode) + Expo ~54, React Native 0.83, React 19, Expo Router v6, Supabase JS 2, i18next + react-i18nex (001-phase0-setup)
- Supabase PostgreSQL (remote) — no schema changes in this spec (001-phase0-setup)

## Recent Changes
- 001-mvp-phase1: Added TypeScript 5.9 (strict mode) / React Native 0.83 / React 19 + Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next + react-i18next, FlashList 2, expo-image 3, react-native-calendars, victory-native, @gorhom/bottom-sheet 5
