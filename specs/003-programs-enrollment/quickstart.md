# Quickstart: Programs & Enrollment

**Feature**: 003-programs-enrollment
**Date**: 2026-03-04

---

## Prerequisites

- Branch `003-programs-enrollment` checked out
- Supabase local dev running (`supabase start`)
- Auth evolution migration (00004) applied
- Node dependencies installed (`npm install`)

## Implementation Order

### Phase 1: Database Layer

1. **Create migration** `supabase/migrations/00005_programs_enrollment.sql`
   - 5 tables: `programs`, `program_tracks`, `cohorts`, `enrollments`, `program_roles`
   - Helper functions: `get_user_programs()`, `enroll_student()`
   - RLS policies for all tables
   - Seed 8 programs + 25 tracks
   - Indexes and triggers

2. **Test locally**: `supabase db reset` → verify tables, seed data, RLS

3. **Generate types**: Run type generation after migration applied

### Phase 2: Feature Module

4. **Types**: Create `src/features/programs/types/programs.types.ts`
   - `Program`, `ProgramTrack`, `Cohort`, `Enrollment`, `ProgramRole`
   - `ProgramSettings`, `CohortStatus`, `EnrollmentStatus`
   - Input types for mutations

5. **Service**: Create `src/features/programs/services/programs.service.ts`
   - Read methods: getPrograms, getProgram, getCohorts, getMyEnrollments
   - Write methods: enrollStructured (RPC), joinFreeProgram, leaveProgram
   - Admin methods: createCohort, updateCohortStatus, assignProgramRole

6. **Hooks**: Create hooks in `src/features/programs/hooks/`
   - Query hooks: usePrograms, useProgram, useCohorts, useEnrollments
   - Mutation hooks: useEnroll, useLeaveProgram
   - Admin hooks: useAdminCohorts, useAdminEnrollments, useAdminPrograms

### Phase 3: Student UI

7. **Components**: Create reusable components in `src/features/programs/components/`
   - ProgramCard, CategoryBadge, EnrollmentStatusBadge
   - TrackList, CohortCard, EmptyProgramState

8. **Programs tab**: Add to student tab bar
   - Add `programs.tsx` screen in `app/(student)/(tabs)/`
   - Update `_layout.tsx` to include Programs tab
   - Add i18n keys

9. **Program detail**: Create `app/(student)/programs/[id].tsx`
   - Show tracks, cohorts, enrollment action

10. **My Programs**: Create `app/(student)/programs/my-programs.tsx`
    - Student's enrollments grouped by status

11. **i18n**: Add all translation keys to `en.json` and `ar.json`

### Phase 4: Admin UI

12. **Program admin screens**: Under `app/(program-admin)/programs/`
    - Program list, cohort CRUD, enrollment approval, team management

13. **Master admin screens**: Under `app/(master-admin)/programs/`
    - All programs, create/edit, full access

## Key Patterns to Follow

| Pattern | Reference File |
|---------|---------------|
| Tab bar config | `app/(student)/(tabs)/_layout.tsx` |
| Service class | `src/features/students/services/students.service.ts` |
| Query hook | `src/features/students/hooks/useStudents.ts` |
| Admin list screen | `app/(admin)/students/index.tsx` |
| Admin detail screen | `app/(admin)/students/[id]/index.tsx` |
| Migration style | `supabase/migrations/00004_auth_evolution.sql` |
| RLS pattern | `supabase/migrations/00001_consolidated_schema.sql` |

## Verification Checklist

- [ ] `supabase db reset` succeeds with no errors
- [ ] 8 programs visible in DB after seed
- [ ] 25 tracks linked to correct programs
- [ ] RLS blocks student from modifying programs
- [ ] RLS allows program admin to manage only assigned programs
- [ ] `get_user_programs()` returns correct IDs
- [ ] `enroll_student()` handles capacity correctly
- [ ] Programs tab renders in student app
- [ ] Bilingual content displays in both locales
- [ ] RTL layout works correctly
