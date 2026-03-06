# Security & UX Requirements Quality Checklist: Supervisor & Admin Panels

**Purpose**: Validate security/access control and UX/navigation requirements for completeness, clarity, consistency, and coverage before implementation
**Created**: 2026-03-06
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [contracts/](../contracts/)

## Requirement Completeness

- [x] CHK001 - Are program-scoped access rules specified for ALL data queries across supervisor, program admin, and master admin roles? [Completeness, Spec §FR-018]
  - FR-018 covers all admin screens. FR-026 adds per-RPC validation rules. SC-006 lists specific screens requiring verification.
- [x] CHK002 - Are empty state requirements defined for each dashboard widget (zero teachers, zero sessions, zero enrollments, new program)? [Completeness, Spec §Edge Cases]
  - Edge case: "All dashboard cards show zero values with appropriate empty states, not errors." Also: supervisor no teachers, PA 0 programs, deactivated program.
- [x] CHK003 - Are loading state requirements specified for dashboard metrics that involve multiple aggregated queries? [Gap]
  - FR-022 added: loading skeleton while fetching, partial failure shows available data with inline error for failed section.
- [x] CHK004 - Are error state requirements defined for when RPC functions fail or return partial data? [Gap]
  - FR-022 added: retry-able error state on query failure, partial data with inline error indicators.
- [x] CHK005 - Is the program selector behavior fully specified for edge cases: 0 programs assigned, 1 program, 2+ programs? [Completeness, Spec §FR-002]
  - FR-002: auto-selects if 1 program. Edge case added: 0 programs shows empty state message.
- [x] CHK006 - Are tab badge/indicator requirements specified (e.g., pending enrollment count on Cohorts tab)? [Gap]
  - Explicitly deferred in Assumptions: "Tab badges are out of scope for this spec. Tabs use static icons."
- [x] CHK007 - Are pull-to-refresh requirements defined for each dashboard and list screen? [Gap]
  - FR-023 added: all dashboards and lists support pull-to-refresh following existing patterns.
- [x] CHK008 - Is the supervisor flag mechanism (FR-021) fully specified: input fields, character limits, confirmation, delivery method? [Completeness, Spec §FR-021]
  - FR-021 updated: teacher selection, note text (max 500 chars, sanitized), confirmation before sending, push notification delivery.

## Requirement Clarity

- [x] CHK009 - Is "sessions this week" precisely defined — does it mean last 7 days or current calendar week (Sunday–Saturday)? [Ambiguity, Spec §FR-004]
  - FR-004 updated: "last 7 rolling days from today, not the current calendar week."
- [x] CHK010 - Is "Inactive" teacher flag threshold clearly defined — exactly 0 sessions in 7 days, or below a configurable minimum? [Clarity, Spec §FR-007]
  - FR-007: "zero sessions in the past 7 days" — defined as exactly 0.
- [x] CHK011 - Is "active students" precisely defined for the removal warning (FR-009) — students with status='active' in enrollments, or students with recent sessions? [Ambiguity, Spec §FR-009]
  - FR-009 updated: "students with enrollment status IN ('active', 'approved') under that teacher."
- [x] CHK012 - Are "rating thresholds" in program settings (FR-010) the same thresholds defined in the ratings spec (4.0/3.5/3.0), and is this cross-reference explicit? [Clarity, Spec §FR-010]
  - FR-010 updated: explicit cross-reference to 006-ratings-queue thresholds and settings JSONB key.
- [x] CHK013 - Is the scope of "certification pipeline" in reports (FR-012) defined — what metric quantifies "close to completion"? [Ambiguity, Spec §FR-012]
  - FR-012 updated: "students with enrollment status='active' who have completed 80%+ of curriculum, configurable."
- [x] CHK014 - Is "teacher activity heatmap" (FR-016) defined with specific dimensions (days x hours, days x weeks, etc.)? [Ambiguity, Spec §FR-016]
  - FR-016 updated: "days x teachers grid showing session counts over the last 4 weeks."

## Requirement Consistency

- [x] CHK015 - Are navigation patterns consistent between spec (FR-001: 4 tabs for supervisor) and plan (project structure shows (tabs)/ directory with 4 files)? [Consistency, Spec §FR-001 vs Plan §Project Structure]
  - Spec: 4 tabs (Home, Teachers, Reports, Profile). Plan: 4 tab files (index.tsx, teachers.tsx, reports.tsx, profile.tsx). Consistent.
- [x] CHK016 - Does the plan's RPC function `get_supervised_teachers` return all fields needed by the spec's per-teacher card requirements (name, student count, sessions, rating)? [Consistency, Spec §US1 vs Contracts §supervisor-api]
  - Contracts return: teacher_id, full_name, avatar_url, program_id, program_name, student_count, sessions_this_week, average_rating, is_active. Covers all spec requirements.
- [x] CHK017 - Are the team management capabilities consistent between program admin (FR-008/FR-009) and master admin (FR-014) — can master admin also manage program teams, or only via program_roles? [Consistency, Spec §FR-008 vs §FR-014]
  - FR-025 added: master admin has full team management across all programs, unrestricted by program_roles scoping.
- [x] CHK018 - Is the "profile" tab for supervisor (FR-001/US5) consistent with the existing profile screen pattern used by other roles? [Consistency, Gap]
  - FR-024 added: defines profile tab content and states it follows existing teacher/student profile pattern.
- [x] CHK019 - Does the data model's `supervisor_id` on `program_roles` align with all spec acceptance scenarios that reference supervisor-teacher relationships? [Consistency, Spec §Clarifications vs Data Model]
  - Data model: supervisor_id on program_roles (nullable FK, per-program). Spec: all supervisor scenarios reference "their supervised group" which maps to this column. Consistent.

## Acceptance Criteria Quality

- [x] CHK020 - Can SC-001 ("within 3 taps") be objectively verified — is the tap path defined (login → tab → teacher card)? [Measurability, Spec §SC-001]
  - SC-001 updated: "Tap path: login → Home tab (auto) → Teachers tab (tap 1) → teacher card (tap 2). Teacher detail is 2 taps from default landing."
- [x] CHK021 - Can SC-002 ("under 30 seconds") be measured — is the flow defined (tap Add → search → select → confirm)? [Measurability, Spec §SC-002]
  - SC-002 updated: "Flow: Team tab → Add button → type name in search → tap user → confirm role → done (5 taps + typing)."
- [x] CHK022 - Is SC-005 ("within 2 seconds") measurable in practice — does it account for cold start vs warm cache, and which specific queries are included? [Measurability, Spec §SC-005]
  - SC-005 updated: "Warm cache: 2 seconds. Cold start: up to 3 seconds. Measured from tab visible to stat cards showing data."
- [x] CHK023 - Is SC-006 ("100% of admin screens enforce program-scoped access") testable — is there a list of all screens that must be verified? [Measurability, Spec §SC-006]
  - SC-006 updated: lists 9 specific screens requiring verification. Master admin screens exempted by design.

## Scenario Coverage

- [x] CHK024 - Are requirements defined for a supervisor who supervises teachers across multiple programs — do they see a unified view or per-program view? [Coverage, Gap]
  - Edge case added: "Supervisor dashboard shows unified view of ALL supervised teachers across all programs. Each teacher card indicates which program."
- [x] CHK025 - Are requirements defined for the master admin assigning a program_admin role to someone who already has a different profiles.role (e.g., teacher)? [Coverage, Spec §FR-014 Clarification]
  - Edge case added: "profiles.role stays 'teacher'. program_admin role stored in program_roles only. To get PA dashboard, master admin must change profiles.role."
- [x] CHK026 - Are requirements specified for what happens when a program admin switches between programs (via selector) — is state preserved or reset? [Coverage, Spec §FR-002]
  - Edge case added: "All tab state (scroll position, form inputs) is reset. Dashboard reloads with newly selected program's data."
- [x] CHK027 - Are requirements defined for concurrent editing scenarios — two program admins editing the same program settings simultaneously? [Coverage, Gap]
  - Edge case added: "Last-write-wins — no optimistic locking. Acceptable for current scale."
- [x] CHK028 - Are requirements defined for the supervisor reassignment flow when the target teacher is at max student capacity? [Coverage, Spec §FR-006]
  - Edge case added: "System shows warning with current/max count but allows reassignment — capacity is a soft limit for supervisors."

## Edge Case Coverage

- [x] CHK029 - Does the spec define behavior when a supervisor's only assigned program is deactivated? [Edge Case, Gap]
  - Edge case added: "Dashboard shows empty state: 'Your program has been deactivated. Contact a master admin.'"
- [x] CHK030 - Does the spec define behavior when a program admin is removed from a program while viewing that program's tabs? [Edge Case, Gap]
  - Edge case added: "On next data refresh, app shows access denied and navigates back to program selector."
- [x] CHK031 - Is the "last master admin" check (FR-019) specified for the case where the admin tries to change their own profiles.role away from master_admin? [Edge Case, Spec §FR-019]
  - Edge case added: "Same 'last master admin' check applies to self-demotion. Blocked if they are the only master_admin."
- [x] CHK032 - Does the spec address what happens when the master admin promotes a user to master_admin who already has that role? [Edge Case, Gap]
  - Edge case added: "Shows informational message: 'This user is already a master admin.' No duplicate action."

## Security & Access Control

- [x] CHK033 - Are RLS policy requirements documented for the new `platform_config` table — who can read vs write? [Security, Data Model]
  - FR-027 added: all authenticated can SELECT, only master_admin can UPDATE, INSERT restricted to seed.
- [x] CHK034 - Are RLS or application-level guards specified for each RPC function (who can call `reassign_student`, `assign_master_admin_role`, etc.)? [Security, Contracts]
  - FR-026 added: per-RPC role validation — supervisor RPCs require supervisor role, PA RPCs require program_roles entry, master admin RPCs require master_admin role.
- [x] CHK035 - Is the `reassign_student` RPC validation requirement complete — does it check that both teachers belong to the supervisor's program? [Security, Contracts §supervisor-api]
  - FR-026 added: "reassign_student MUST additionally validate that both source and target teachers are supervised by the calling supervisor in the same program."
- [x] CHK036 - Are requirements defined to prevent a program admin from escalating their own role to master_admin via the Users or Team screens? [Security, Gap]
  - Edge case added: "Program admins cannot access Users screen (FR-014 is master_admin only). program_roles only allows PA/supervisor/teacher roles. Self-escalation structurally impossible."
- [x] CHK037 - Is the supervisor flag notification (FR-021) validated to prevent injection of arbitrary content in the notification payload? [Security, Spec §FR-021]
  - FR-021 updated: "note text (max 500 characters, sanitized to prevent injection)."
- [x] CHK038 - Are audit trail requirements specified for role assignment/revocation actions (who assigned whom, when)? [Security, Gap]
  - Assumption added: "program_roles.assigned_by and created_at provide basic audit. No additional audit table needed at current scale."

## Dependencies & Assumptions

- [x] CHK039 - Is the assumption that `program_roles` table exists validated against actual migration 00005? [Assumption, Spec §Assumptions]
  - Research R4 confirmed: program_roles created in migration 00005 with id, profile_id, program_id, role, assigned_by, created_at.
- [x] CHK040 - Is the assumption that `platform_config` does NOT exist validated — and is the creation included in the plan's migration? [Assumption, Spec §Assumptions vs Data Model]
  - Research R4 confirmed: platform_config NOT in any migration. Data model includes CREATE TABLE. Plan lists migration 00009.
- [x] CHK041 - Are the existing program admin screens (team.tsx, cohorts/) documented as preserved-and-extended, with specific extension points identified? [Dependency, Spec §Assumptions]
  - Assumption updated: identifies team.tsx form/FlashList reuse and cohort screen exposure via Cohorts tab.
- [x] CHK042 - Is the dependency on 006-ratings-queue's supervisor review screen explicitly preserved in the plan's file structure? [Dependency, Spec §Dependencies vs Plan §Project Structure]
  - Plan project structure shows `teachers/[id]/reviews.tsx # EXISTING (from 006)`. Preserved.

## Notes

- Focus: Security/RBAC + UX/Navigation combined
- Depth: Standard
- Audience: Reviewer (PR review gate)
- Covers both spec.md requirements and plan/contracts alignment
- Items are numbered CHK001-CHK042 for traceability
- **All 42/42 items resolved** on 2026-03-06
- Spec updated with: FR-022 through FR-027 (6 new requirements), 12 new edge cases, clarified FR-004/FR-009/FR-010/FR-012/FR-016/FR-021, refined SC-001/SC-002/SC-005/SC-006
