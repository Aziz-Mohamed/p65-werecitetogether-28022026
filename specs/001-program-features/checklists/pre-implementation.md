# Pre-Implementation Gate Checklist: Program-Specific Features

**Purpose**: Full-spectrum requirements quality validation before task generation — covers data model, security/RLS, API contracts, state machines, and recovery/rollback
**Created**: 2026-03-01
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)
**Depth**: Formal pre-implementation gate
**Audience**: Author + reviewer (blocking checklist before `/speckit.tasks`)

## Requirement Completeness

- [ ] CHK001 - Are all valid certification status transitions explicitly enumerated, including which roles can trigger each transition? [Completeness, Spec §FR-001, data-model.md §1]
- [ ] CHK002 - Is the `rejection_reason` mandate enforced at the data model level (NOT NULL when status = 'rejected'), or only at the application layer? [Completeness, data-model.md §1]
- [ ] CHK003 - Are notification requirements specified for every state transition in the certification lifecycle (recommended, approved, rejected, issued, revoked)? [Gap, Spec §FR-001]
- [ ] CHK004 - Is the Himam event status transition from 'upcoming' to 'active' defined — who/what triggers it and when? [Gap, Spec §FR-013, data-model.md §2]
- [ ] CHK005 - Are requirements defined for what happens when a Himam partner matching yields an odd number of registrants in a track? [Gap, Spec §FR-016]
- [ ] CHK006 - Is the "partner absent" logging flow fully specified — who can log it, what status does the Juz' get, does it count toward completion? [Completeness, Spec Edge Case 2, data-model.md §4]
- [ ] CHK007 - Are requirements specified for how the curriculum sections are initially populated in `program_tracks.curriculum` JSONB — is there an admin UI or is it seed data? [Gap, Spec §FR-029]
- [ ] CHK008 - Is the "available for peer practice" toggle specified as a persisted field or an in-memory/real-time state? [Gap, Spec §FR-039]
- [ ] CHK009 - Are requirements defined for the certificate image template layout — what fields appear, what language(s), what dimensions/resolution? [Completeness, Spec §FR-009]
- [ ] CHK010 - Does the spec define how the passing threshold for Arabic Language graduation (default 60) is configured and where it is stored? [Gap, Spec §FR-038, Assumptions]

## Requirement Clarity

- [ ] CHK011 - Is "completion" for Mutoon certification eligibility precisely defined — all sections "memorized" only, all "certified" only, or either? [Clarity, Spec §FR-003, §FR-032]
- [ ] CHK012 - Is the age range overlap between Children's Program tracks (Talqeen 3-6, Nooraniyah 4-8, Memorization 6+) intentional, and are the priority/display rules for overlapping ages specified? [Clarity, Spec §FR-027]
- [ ] CHK013 - Is "at least one of phone or email required" for guardians enforced at DB constraint level or application validation only? [Clarity, contracts/guardians.md §addGuardian, data-model.md §6]
- [ ] CHK014 - Is "prayer-time blocks" for Himam time slots defined — how many blocks, what are their boundaries, is this timezone-aware? [Ambiguity, Spec §FR-017]
- [ ] CHK015 - Is the meaning of the Mutoon score range (0-5) specified — does it map to a rubric (e.g., 0=not attempted, 5=perfect), or is it free-form? [Clarity, Spec §FR-030]
- [ ] CHK016 - Is the certificate number sequence reset behavior per year fully specified — does `cert_number_seq` reset on Jan 1, or does it use a year-scoped sequence? [Clarity, Spec §FR-007, data-model.md §generate_certificate_number]

## Requirement Consistency

- [ ] CHK017 - Are the `curriculum_progress.status` CHECK values consistent with the status sets defined per progress_type in the spec? The DB allows all 6 statuses for all types, but Mutoon uses 4, Qiraat uses 3, Arabic uses 4 — is app-layer validation sufficient? [Consistency, Spec §FR-029/§FR-033/§FR-036, data-model.md §5]
- [ ] CHK018 - Does the RLS policy for `certifications` (students see only `status='issued'`) align with the spec requirement that students never see rejected requests? [Consistency, Spec §FR-001, data-model.md RLS]
- [ ] CHK019 - Is the `himam_progress.status` value 'partner_absent' consistent with the edge case spec (Edge Case 2) which says "log the block as partner absent"? [Consistency, Spec Edge Case 2, data-model.md §4]
- [ ] CHK020 - Does the Himam contract define the `registered → paired` transition as triggered by the partner-matching edge function, consistent with the data model state machine? [Consistency, contracts/himam.md, data-model.md §3]
- [ ] CHK021 - Is `SC-008` ("teachers can update section/lesson progress") consistent with the established "recitation" terminology — should it say "section/recitation"? [Consistency, Spec §SC-008, Clarifications]

## Acceptance Criteria Quality

- [ ] CHK022 - Can SC-001 ("certificates viewable within 5 seconds of issuing") be measured without implementation details — does it account for notification delivery time vs. query latency? [Measurability, Spec §SC-001]
- [ ] CHK023 - Is SC-004 ("pairing completes 24 hours before event") measurable given that partner matching is admin-triggered, not automatic? [Measurability, Spec §SC-004]
- [ ] CHK024 - Does SC-010 ("at least 4 of 8 programs have complete certification pipeline") define what "complete pipeline" means — is it spec coverage or runtime capability? [Measurability, Spec §SC-010]

## Scenario Coverage

- [ ] CHK025 - Are requirements defined for the concurrent re-recommendation scenario — can a teacher create a new certification request while a previous rejected one exists for the same student/program/track? [Coverage, Spec §FR-001]
- [ ] CHK026 - Are requirements specified for what happens when a student is enrolled in multiple tracks within the same program — does each track have independent progress and certification? [Coverage, Gap]
- [ ] CHK027 - Are requirements defined for the Himam event cancellation flow — what happens to all registrations, paired partners, and progress data? [Coverage, data-model.md §2]
- [ ] CHK028 - Are requirements specified for how the `paired → in_progress` transition is triggered for Himam registrations — is it automatic when the event start time arrives? [Coverage, data-model.md §3]
- [ ] CHK029 - Are requirements defined for what a teacher sees when reviewing a student enrolled in a curriculum track with no pre-defined sections (empty `program_tracks.curriculum`)? [Coverage, Edge Case, Gap]

## Edge Case Coverage

- [ ] CHK030 - Is the edge case of removing the last guardian from a child in the Children's Program fully specified — what constraints prevent it, and what error message is shown? [Edge Case, contracts/guardians.md §removeGuardian]
- [ ] CHK031 - Are requirements defined for the scenario where a student has a pending peer pairing request and is then un-enrolled from the program? [Edge Case, Gap]
- [ ] CHK032 - Is the behavior specified when a certificate number sequence collision occurs (e.g., race condition on concurrent issuances)? [Edge Case, data-model.md §generate_certificate_number]
- [ ] CHK033 - Are requirements defined for what happens when the verify-certificate edge function receives an invalid or non-existent certificate number? [Edge Case, contracts/certifications.md §verify-certificate]
- [ ] CHK034 - Is the edge case specified for a Himam registration where a paired partner's profile is deleted (ON DELETE SET NULL on partner_id) — does the remaining student get re-paired or left unmatched? [Edge Case, data-model.md §3]

## Recovery & Rollback

- [ ] CHK035 - Are recovery requirements defined for a failed certification issuance — if the certificate_number trigger fails mid-transaction, does the status remain `supervisor_approved`? [Recovery, data-model.md §1]
- [ ] CHK036 - Are rollback requirements specified for the Himam partner-matching edge function — if pairing partially succeeds (some pairs written, then error), are already-written pairs rolled back? [Recovery, contracts/himam.md §himam-partner-matching]
- [ ] CHK037 - Are recovery requirements defined for the `initializeProgress` bulk INSERT — if it partially fails (e.g., some curriculum sections inserted but not all), what is the expected state? [Recovery, contracts/curriculum-progress.md §initializeProgress]
- [ ] CHK038 - Is the recovery path specified for a revoked certificate — can it be un-revoked/reinstated, or is revocation permanent? [Recovery, Spec §FR-008]

## Non-Functional Requirements

- [ ] CHK039 - Are RLS policies specified for all 8 new tables across all 5 roles, and are "no access" cells explicitly documented (not just omitted)? [Security, data-model.md §RLS]
- [ ] CHK040 - Is the public verify-certificate endpoint hardened against enumeration attacks (rate limiting, no sequential ID exposure)? [Security, Gap, contracts/certifications.md]
- [ ] CHK041 - Are data privacy requirements specified for guardian contact information (phone, email) — who can read it, is it masked in any views? [Security, Spec §FR-023, data-model.md §RLS]
- [ ] CHK042 - Are performance requirements defined for the `get_certification_eligibility` RPC — what is the expected latency given it must scan all curriculum_progress rows for an enrollment? [Performance, Gap]
- [ ] CHK043 - Are requirements specified for the maximum number of himam_progress rows created per registration (bounded by track: max 30 for 30_juz) — is this validated? [Completeness, data-model.md §4]

## Dependencies & Assumptions

- [ ] CHK044 - Is the assumption that `program_tracks.curriculum` JSONB already contains pre-defined sections validated — does the existing seed data include this field? [Assumption, Spec Assumptions]
- [ ] CHK045 - Is the dependency on `react-native-view-shot` and `react-native-qrcode-svg` validated for compatibility with Expo ~54 managed workflow? [Dependency, plan.md]
- [ ] CHK046 - Is the assumption that `platform_config.settings` contains a timezone field validated against the existing 001-platform-core schema? [Assumption, data-model.md §2]
- [ ] CHK047 - Does the spec confirm that the existing `certificates` tab placeholder in the student UI is ready to be replaced, and no other feature depends on its current implementation? [Dependency, plan.md §Project Structure]

## Notes

- Check items off as completed: `[x]`
- Items referencing `[Gap]` indicate missing requirements that should be added to the spec before implementation
- Items referencing `[Recovery]` indicate state mutation scenarios needing explicit rollback/recovery behavior
- This checklist blocks `/speckit.tasks` — all CRITICAL gaps should be resolved first
- Total items: 47
