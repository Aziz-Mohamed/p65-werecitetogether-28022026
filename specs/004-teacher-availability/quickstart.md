# Quickstart: Teacher Availability (Green Dot System)

**Feature**: 004-teacher-availability
**Date**: 2026-03-05

## Prerequisites

- Migration `00005_programs_enrollment.sql` applied (programs, program_roles, enrollments tables exist)
- Migration `00004_auth_evolution.sql` applied (profiles extended with 7 roles)
- `pg_cron` extension available (created in `00001_consolidated_schema.sql:15`)

## Implementation Order

### Phase 1: Database (Migration 00006)
1. ALTER `profiles` — add `meeting_link`, `meeting_platform`, `languages` columns
2. CREATE `teacher_availability` table with indexes
3. CREATE `toggle_availability()` RPC function
4. CREATE `join_teacher_session()` RPC function (no leave RPC — counter resets on offline/timeout)
5. CREATE `clear_teacher_availability()` trigger function + trigger on `program_roles`
6. CREATE `updated_at` trigger on `teacher_availability`
7. ENABLE RLS + CREATE policies
8. ADD to `supabase_realtime` publication
9. SCHEDULE `pg_cron` job for stale expiry

### Phase 2: Types & Service Layer
1. Define TypeScript types in `src/features/teacher-availability/types/`
2. Create `availability.service.ts` singleton
3. Export via barrel `src/features/teacher-availability/index.ts`

### Phase 3: Hooks
1. `useAvailableTeachers(programId)` — query hook
2. `useMyAvailability()` — query hook
3. `useTeacherProfile()` — query hook
4. `useToggleAvailability()` — mutation hook
5. `useJoinSession()` — mutation hook
6. `useUpdateTeacherProfile()` — mutation hook

### Phase 4: Realtime Integration
1. Extend `event-query-map.ts` with `teacher_availability` case
2. Extend role subscription configs for student + teacher roles

### Phase 5: Teacher UI
1. Availability toggle component (program selector + per-program toggles)
2. Teacher dashboard integration (green dot, toggle button)
3. Profile settings — meeting link, platform, languages fields

### Phase 6: Student UI
1. Available Now screen (FlashList of AvailableTeacher cards)
2. Teacher availability card component (name, languages, rating placeholder, join button)
3. Green dot indicator component (reusable)
4. "Join Session" deep-link handler (Linking.openURL)

### Phase 7: i18n
1. Add `availability.*` keys to `en.json` and `ar.json`

### Phase 8: Integration & Polish
1. Wire Available Now into student navigation (tab or program detail)
2. Add green dot to teacher name displays throughout app
3. Handle edge cases (teacher full, no meeting link, enrollment revoked)

## Smoke Test

1. `supabase db reset` — migration applies cleanly
2. Sign in as teacher → configure meeting link → go available for a program
3. Sign in as student enrolled in same program → see teacher in Available Now
4. Tap "Join Session" → meeting link opens in browser
5. Teacher goes offline → student list updates within 5 seconds
6. Wait 4+ hours (or manually adjust `available_since`) → cron expires availability

## Key Files

```
supabase/migrations/00006_teacher_availability.sql
src/features/teacher-availability/
├── types/availability.types.ts
├── services/availability.service.ts
├── hooks/useAvailableTeachers.ts
├── hooks/useMyAvailability.ts
├── hooks/useTeacherProfile.ts
├── hooks/useToggleAvailability.ts
├── hooks/useJoinSession.ts
├── hooks/useUpdateTeacherProfile.ts
├── components/AvailabilityToggle.tsx
├── components/AvailableTeacherCard.tsx
├── components/GreenDotIndicator.tsx
├── components/ProgramSelector.tsx
└── index.ts
app/(teacher)/availability.tsx
app/(student)/available-now/[programId].tsx
src/features/realtime/config/event-query-map.ts (extend)
src/i18n/en.json (extend)
src/i18n/ar.json (extend)
```
