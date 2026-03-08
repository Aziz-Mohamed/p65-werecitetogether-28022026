# Research: 007-admin-roles

## R1: Supervisor-to-Teacher Linking Mechanism

**Decision**: Add `supervisor_id` nullable FK column to the existing `program_roles` table.

**Rationale**: The `supervisor_id` on `profiles` is a single global FK — it cannot represent per-program supervisor assignments. Since supervisors are program-scoped (a teacher might have Supervisor X in Program 1 and Supervisor Y in Program 3), the linkage must live in `program_roles` where both the teacher and supervisor have entries for the same program.

**Alternatives considered**:
- `supervisor_id` on profiles (global, single supervisor) — rejected: cannot model per-program assignments
- New `supervisor_teachers` junction table — rejected: over-engineering for a simple FK; program_roles already has the (profile_id, program_id) context needed

## R2: Program Admin Navigation Architecture

**Decision**: Program selector screen first, then 5-tab view scoped to the selected program. Auto-selects when only one program is assigned.

**Rationale**: PRD states program admins manage "one specific program." The selector handles the edge case of multi-program assignment gracefully while keeping the primary UX simple.

**Alternatives considered**:
- Top-level tabs with cross-program aggregation — rejected: contradicts PRD's per-program model and adds unnecessary complexity
- Hard single-program constraint — rejected: too rigid if the organization needs a PA managing 2 programs temporarily

## R3: Role Assignment & profiles.role Interaction

**Decision**: Program-scoped roles (supervisor, program_admin, teacher) are managed via `program_roles` only — `profiles.role` stays unchanged. Only `master_admin` changes `profiles.role` since it's a platform-wide routing role.

**Rationale**: The root layout switch statement routes based on `profiles.role`. A teacher who supervises in one program should still route to `app/(teacher)/` as their primary experience. Supervisors who need the supervisor dashboard must have `profiles.role = 'supervisor'` set by a master admin — this is an explicit platform-level role change.

**Clarification**: Users whose `profiles.role` is `supervisor` route to the supervisor dashboard. Users whose `profiles.role` is `teacher` but who also have a `program_roles` entry with `role='supervisor'` remain in the teacher experience — the `program_roles` entry gives them supervisor-level data access within that program, but doesn't change their routing. To get the full supervisor dashboard experience, a master admin must change their `profiles.role` to `supervisor`.

**Alternatives considered**:
- Always change profiles.role — rejected: a teacher promoted to supervisor in one program loses their teacher dashboard
- Use program_roles for everything including master_admin — rejected: master_admin is a platform-wide role that needs dedicated routing

## R4: Existing Codebase State

**Decision**: Extend existing code rather than rebuild.

**Findings**:
- `program_roles` table exists (migration 00005) with id, profile_id, program_id, role, assigned_by, created_at. **Missing**: `supervisor_id` column.
- `platform_config` table does **not** exist yet — needs migration.
- Programs service already has `assignProgramRole`, `removeProgramRole`, `getProgramRoles` methods.
- `useProgramRoles` hook exists with full CRUD.
- Auth routing for all 7 roles already works in `app/_layout.tsx`.
- All three route groups exist with placeholder screens.
- `app/(program-admin)/programs/[id]/team.tsx` and cohort screens are already implemented.
- `app/(master-admin)/programs/` has create/edit/list screens.
- `app/(supervisor)/teachers/[id]/reviews.tsx` exists from 006-ratings-queue.
- Dashboard pattern (service → hook → component with TanStack Query) well established in admin/teacher dashboards.
- Tab navigation uses `CustomTabBar` component with Expo Router `Tabs`.
- `SearchableList` generic component available for searchable lists.
- victory-native charts (CartesianChart + Line) pattern established in reports.
- react-hook-form + zod pattern established for settings forms.
- i18n keys partially exist for roles (`auth.role.supervisor`, `auth.role.master_admin`, etc.).

## R5: Dashboard Data Sources

**Decision**: All dashboard metrics will be computed via Supabase queries — no new aggregate tables needed. Use `Promise.all` pattern for parallel count queries, matching existing admin dashboard approach.

**Data sources by dashboard**:

| Dashboard | Tables Queried |
|-----------|---------------|
| Supervisor Home | program_roles, sessions, enrollments, teacher_rating_stats |
| Supervisor Reports | sessions, enrollments, teacher_rating_stats |
| Program Admin Home | enrollments, cohorts, program_roles, sessions |
| Program Admin Reports | sessions, enrollments, teacher_rating_stats, certifications |
| Master Admin Home | programs, enrollments, sessions, profiles |
| Master Admin Reports | programs, enrollments, sessions, certifications |
| Master Admin Users | profiles, program_roles |

**RPC functions needed**: New RPC functions for aggregated metrics (supervisor dashboard stats, program admin stats, cross-program stats) to avoid complex client-side joins.

## R6: FR-021 Supervisor Flags

**Decision**: Implement as a lightweight notification — supervisor taps "Flag Issue" on a teacher, types a note, and the note is sent as a push notification to the program admin. No new table for flags.

**Rationale**: The spec says "simple text-based flag with optional note." A full ticketing system is over-engineering. A push notification is immediate and actionable. If persistence is needed later, a `supervisor_flags` table can be added in a future spec.
