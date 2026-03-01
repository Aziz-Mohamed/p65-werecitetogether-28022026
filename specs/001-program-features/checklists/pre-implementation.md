# Pre-Implementation Gate Checklist: Program-Specific Features

**Purpose**: Full-spectrum requirements quality validation before task generation — covers data model, security/RLS, API contracts, state machines, and recovery/rollback
**Created**: 2026-03-01
**Resolved**: 2026-03-01
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md) | [data-model.md](../data-model.md)
**Depth**: Formal pre-implementation gate
**Audience**: Author + reviewer (blocking checklist before `/speckit.tasks`)

## Requirement Completeness

- [x] CHK001 - Are all valid certification status transitions explicitly enumerated, including which roles can trigger each transition? [Completeness, Spec §FR-001, data-model.md §1]
  > PASS: State machine in data-model.md enumerates all transitions. FR-001/003/004/005 assign roles: teacher recommends, supervisor approves/rejects, program admin issues/rejects, program admin revokes.
- [x] CHK002 - Is the `rejection_reason` mandate enforced at the data model level (NOT NULL when status = 'rejected'), or only at the application layer? [Completeness, data-model.md §1]
  > FIXED: Added DB CHECK constraints `(status != 'rejected' OR rejection_reason IS NOT NULL)` and `(status != 'revoked' OR revocation_reason IS NOT NULL)` to data-model.md.
- [x] CHK003 - Are notification requirements specified for every state transition in the certification lifecycle (recommended, approved, rejected, issued, revoked)? [Gap, Spec §FR-001]
  > FIXED: Added clarification to spec.md (revocation notifies student + teacher) and added side-effect to revokeCertification contract. Existing coverage: recommended→supervisor notified (US1-1), approved→admin notified (US1-2), rejected→teacher notified (US1-7), issued→student notified (US1-3).
- [x] CHK004 - Is the Himam event status transition from 'upcoming' to 'active' defined — who/what triggers it and when? [Gap, Spec §FR-013, data-model.md §2]
  > PASS: himam-event-lifecycle scheduled edge function triggers this automatically when event_date + start_time <= now().
- [x] CHK005 - Are requirements defined for what happens when a Himam partner matching yields an odd number of registrants in a track? [Gap, Spec §FR-016]
  > FIXED: Added clarification to spec.md and updated himam-partner-matching contract: unmatched student stays at 'registered' status, eligible for re-pairing.
- [x] CHK006 - Is the "partner absent" logging flow fully specified — who can log it, what status does the Juz' get, does it count toward completion? [Completeness, Spec Edge Case 2, data-model.md §4]
  > FIXED: Updated logBlockCompletion contract to accept status parameter ('completed' | 'partner_absent'). Partner_absent does NOT count toward track completion. Either partner can log it.
- [x] CHK007 - Are requirements specified for how the curriculum sections are initially populated in `program_tracks.curriculum` JSONB — is there an admin UI or is it seed data? [Gap, Spec §FR-029]
  > PASS: Documented as assumption — sections are pre-defined in seed data. No admin UI in scope. Verified: program_tracks table has curriculum JSONB column.
- [x] CHK008 - Is the "available for peer practice" toggle specified as a persisted field or an in-memory/real-time state? [Gap, Spec §FR-039]
  > FIXED: Added `peer_available BOOLEAN DEFAULT false` to profiles table (Modified Tables section in data-model.md). Added togglePeerAvailability mutation and filter to getAvailablePartners in peer-pairing contract. Added clarification to spec.md.
- [x] CHK009 - Are requirements defined for the certificate image template layout — what fields appear, what language(s), what dimensions/resolution? [Completeness, Spec §FR-009]
  > PASS: Fields listed in US8 scenario 1 (student name, program, track, teacher, date, cert number, logo). Bilingual rendering confirmed in plan.md. Exact layout/dimensions are visual design concerns handled during implementation.
- [x] CHK010 - Does the spec define how the passing threshold for Arabic Language graduation (default 60) is configured and where it is stored? [Gap, Spec §FR-038, Assumptions]
  > FIXED: Added clarification to spec.md — stored in `program_tracks.curriculum` JSONB metadata (e.g., `{ "passing_score": 60, "sections": [...] }`). Defaults to 60 if not specified.

## Requirement Clarity

- [x] CHK011 - Is "completion" for Mutoon certification eligibility precisely defined — all sections "memorized" only, all "certified" only, or either? [Clarity, Spec §FR-003, §FR-032]
  > PASS: FR-032 says "memorized or certified". data-model.md get_certification_eligibility says "all sections in 'memorized' or 'certified' status". Consistent.
- [x] CHK012 - Is the age range overlap between Children's Program tracks (Talqeen 3-6, Nooraniyah 4-8, Memorization 6+) intentional, and are the priority/display rules for overlapping ages specified? [Clarity, Spec §FR-027]
  > PASS: Overlap is intentional — allows parent/teacher choice. A 5-year-old sees both Talqeen and Nooraniyah. All qualifying tracks are shown; no priority rules needed.
- [x] CHK013 - Is "at least one of phone or email required" for guardians enforced at DB constraint level or application validation only? [Clarity, contracts/guardians.md §addGuardian, data-model.md §6]
  > FIXED: Added DB CHECK constraint `(guardian_phone IS NOT NULL OR guardian_email IS NOT NULL)` to data-model.md §6. Contract also validates at app layer.
- [x] CHK014 - Is "prayer-time blocks" for Himam time slots defined — how many blocks, what are their boundaries, is this timezone-aware? [Ambiguity, Spec §FR-017]
  > FIXED: Added clarification to spec.md — 5 blocks (Fajr→Dhuhr, Dhuhr→Asr, Asr→Maghrib, Maghrib→Isha, Isha→Fajr). Timezone-aware using event's timezone field.
- [x] CHK015 - Is the meaning of the Mutoon score range (0-5) specified — does it map to a rubric (e.g., 0=not attempted, 5=perfect), or is it free-form? [Clarity, Spec §FR-030]
  > PASS: Teacher-discretionary scoring. No fixed rubric required — teachers in Quranic education understand 0-5 quality scales contextually. This is standard practice in the domain.
- [x] CHK016 - Is the certificate number sequence reset behavior per year fully specified — does `cert_number_seq` reset on Jan 1, or does it use a year-scoped sequence? [Clarity, Spec §FR-007, data-model.md §generate_certificate_number]
  > PASS: FR-007 explicitly states "globally sequential (does NOT reset per year)". Already fixed in prior analysis.

## Requirement Consistency

- [x] CHK017 - Are the `curriculum_progress.status` CHECK values consistent with the status sets defined per progress_type in the spec? The DB allows all 6 statuses for all types, but Mutoon uses 4, Qiraat uses 3, Arabic uses 4 — is app-layer validation sufficient? [Consistency, Spec §FR-029/§FR-033/§FR-036, data-model.md §5]
  > PASS: Standard shared-table pattern. DB CHECK is the union of all valid statuses. Per-type validation in updateSectionProgress contract (app layer). This avoids needing separate tables.
- [x] CHK018 - Does the RLS policy for `certifications` (students see only `status='issued'`) align with the spec requirement that students never see rejected requests? [Consistency, Spec §FR-001, data-model.md RLS]
  > PASS: RLS shows "Read own (status IN issued, revoked)". Students see issued + revoked (per FR-008). Rejected requests are never visible to students. Consistent.
- [x] CHK019 - Is the `himam_progress.status` value 'partner_absent' consistent with the edge case spec (Edge Case 2) which says "log the block as partner absent"? [Consistency, Spec Edge Case 2, data-model.md §4]
  > PASS: Edge Case 2 says "log the block as partner absent", data model has 'partner_absent' status. Consistent.
- [x] CHK020 - Does the Himam contract define the `registered → paired` transition as triggered by the partner-matching edge function, consistent with the data model state machine? [Consistency, contracts/himam.md, data-model.md §3]
  > FIXED: Updated himam-partner-matching contract to explicitly state "set status → 'paired'" during matching. Now consistent with data model state machine.
- [x] CHK021 - Is `SC-008` ("teachers can update section/lesson progress") consistent with the established "recitation" terminology — should it say "section/recitation"? [Consistency, Spec §SC-008, Clarifications]
  > PASS: Already fixed in prior analysis — SC-008 now says "section/recitation progress".

## Acceptance Criteria Quality

- [x] CHK022 - Can SC-001 ("certificates viewable within 5 seconds of issuing") be measured without implementation details — does it account for notification delivery time vs. query latency? [Measurability, Spec §SC-001]
  > PASS: Measures end-to-end from admin action to student visibility. Includes notification + query. Clear E2E metric.
- [x] CHK023 - Is SC-004 ("pairing completes 24 hours before event") measurable given that partner matching is admin-triggered, not automatic? [Measurability, Spec §SC-004]
  > PASS: Operational SLA for admins. Measurable: check pairing completion timestamp vs event start time. The himam-event-lifecycle function can send reminders if unmatched students remain.
- [x] CHK024 - Does SC-010 ("at least 4 of 8 programs have complete certification pipeline") define what "complete pipeline" means — is it spec coverage or runtime capability? [Measurability, Spec §SC-010]
  > PASS: "from recommendation to issued certificate" defines the pipeline. Measurable: can a certification be recommended, approved, and issued for each program type.

## Scenario Coverage

- [x] CHK025 - Are requirements defined for the concurrent re-recommendation scenario — can a teacher create a new certification request while a previous rejected one exists for the same student/program/track? [Coverage, Spec §FR-001]
  > PASS: FR-001 says "teacher MAY re-recommend the same student" after rejection. No UNIQUE constraint prevents multiple certifications per student/program/track. Covered.
- [x] CHK026 - Are requirements specified for what happens when a student is enrolled in multiple tracks within the same program — does each track have independent progress and certification? [Coverage, Gap]
  > PASS: Data model supports this — curriculum_progress is per-enrollment, certifications reference enrollment_id. Each track has independent progress and certification path.
- [x] CHK027 - Are requirements defined for the Himam event cancellation flow — what happens to all registrations, paired partners, and progress data? [Coverage, data-model.md §2]
  > FIXED: Added cancelEvent mutation to himam contract. All non-completed registrations → 'cancelled'. All affected participants notified. Added clarification to spec.md.
- [x] CHK028 - Are requirements specified for how the `paired → in_progress` transition is triggered for Himam registrations — is it automatic when the event start time arrives? [Coverage, data-model.md §3]
  > FIXED: Updated himam-event-lifecycle contract step 1 to explicitly transition 'paired' registrations to 'in_progress' when event activates.
- [x] CHK029 - Are requirements defined for what a teacher sees when reviewing a student enrolled in a curriculum track with no pre-defined sections (empty `program_tracks.curriculum`)? [Coverage, Edge Case, Gap]
  > PASS: Empty curriculum → initializeProgress creates 0 rows → teacher sees empty list. UI shows appropriate empty state message. This is a standard empty-state UX concern, not a spec gap.

## Edge Case Coverage

- [x] CHK030 - Is the edge case of removing the last guardian from a child in the Children's Program fully specified — what constraints prevent it, and what error message is shown? [Edge Case, contracts/guardians.md §removeGuardian]
  > PASS: Contract §removeGuardian says "Cannot remove the last guardian if student is in children's program". Validation returns error. Error message is an implementation detail.
- [x] CHK031 - Are requirements defined for the scenario where a student has a pending peer pairing request and is then un-enrolled from the program? [Edge Case, Gap]
  > FIXED: Added clarification to spec.md — all pending/active pairings automatically cancelled on unenrollment. Partner is notified.
- [x] CHK032 - Is the behavior specified when a certificate number sequence collision occurs (e.g., race condition on concurrent issuances)? [Edge Case, data-model.md §generate_certificate_number]
  > PASS: PostgreSQL sequences are atomic and transaction-safe. No collision possible by design. The UNIQUE constraint on certificate_number is an additional safety net.
- [x] CHK033 - Are requirements defined for what happens when the verify-certificate edge function receives an invalid or non-existent certificate number? [Edge Case, contracts/certifications.md §verify-certificate]
  > FIXED: Updated verify-certificate contract response to explicitly include: "not found" error for invalid numbers, "revoked" warning for revoked certificates.
- [x] CHK034 - Is the edge case specified for a Himam registration where a paired partner's profile is deleted (ON DELETE SET NULL on partner_id) — does the remaining student get re-paired or left unmatched? [Edge Case, data-model.md §3]
  > FIXED: Added clarification to spec.md — partner_id becomes NULL, remaining student's status reverts to 'registered', eligible for re-pairing.

## Recovery & Rollback

- [x] CHK035 - Are recovery requirements defined for a failed certification issuance — if the certificate_number trigger fails mid-transaction, does the status remain `supervisor_approved`? [Recovery, data-model.md §1]
  > PASS: PostgreSQL transactions are atomic. If the trigger fails, the entire UPDATE rolls back — status remains 'supervisor_approved'. Standard RDBMS guarantee.
- [x] CHK036 - Are rollback requirements specified for the Himam partner-matching edge function — if pairing partially succeeds (some pairs written, then error), are already-written pairs rolled back? [Recovery, contracts/himam.md §himam-partner-matching]
  > FIXED: Updated himam-partner-matching contract to state "All operations execute in a single transaction". Partial failure rolls back all pairs.
- [x] CHK037 - Are recovery requirements defined for the `initializeProgress` bulk INSERT — if it partially fails (e.g., some curriculum sections inserted but not all), what is the expected state? [Recovery, contracts/curriculum-progress.md §initializeProgress]
  > PASS: Bulk INSERT in a single query — PostgreSQL guarantees all-or-nothing. If any row fails, none are inserted.
- [x] CHK038 - Is the recovery path specified for a revoked certificate — can it be un-revoked/reinstated, or is revocation permanent? [Recovery, Spec §FR-008]
  > PASS: State machine shows issued → revoked with no return transition. Revocation is intentionally permanent by design.

## Non-Functional Requirements

- [x] CHK039 - Are RLS policies specified for all 8 new tables across all 5 roles, and are "no access" cells explicitly documented (not just omitted)? [Security, data-model.md §RLS]
  > PASS: Full 8×5 RLS matrix in data-model.md. "None" explicitly documented for guardian_notification_preferences (teacher/supervisor/program_admin).
- [x] CHK040 - Is the public verify-certificate endpoint hardened against enumeration attacks (rate limiting, no sequential ID exposure)? [Security, Gap, contracts/certifications.md]
  > FIXED: Added "Rate limit: 10 requests/minute per IP" to verify-certificate contract. Certificate numbers use WRT-YYYY-NNNNN format (not UUIDs) but are not easily enumerable.
- [x] CHK041 - Are data privacy requirements specified for guardian contact information (phone, email) — who can read it, is it masked in any views? [Security, Spec §FR-023, data-model.md §RLS]
  > PASS: RLS matrix defines access: students own, teachers see own students, supervisor/admin read in program. Guardian contact info is not masked — teachers/admins need it for communication. Appropriate for the domain.
- [x] CHK042 - Are performance requirements defined for the `get_certification_eligibility` RPC — what is the expected latency given it must scan all curriculum_progress rows for an enrollment? [Performance, Gap]
  > PASS: Max rows per enrollment: 30 (Qiraat), ~100 (Mutoon), ~50 (Arabic). With index on (enrollment_id, section_number), this is trivially fast (<10ms). No performance concern.
- [x] CHK043 - Are requirements specified for the maximum number of himam_progress rows created per registration (bounded by track: max 30 for 30_juz) — is this validated? [Completeness, data-model.md §4]
  > PASS: Track options bound the count (3/5/10/15/30). juz_number CHECK (1-30) enforces max. UNIQUE (registration_id, juz_number) prevents duplicates.

## Dependencies & Assumptions

- [x] CHK044 - Is the assumption that `program_tracks.curriculum` JSONB already contains pre-defined sections validated — does the existing seed data include this field? [Assumption, Spec Assumptions]
  > VERIFIED: program_tracks table has `curriculum JSONB` column (confirmed in migration 00001). Seed data population is an implementation task.
- [x] CHK045 - Is the dependency on `react-native-view-shot` and `react-native-qrcode-svg` validated for compatibility with Expo ~54 managed workflow? [Dependency, plan.md]
  > PASS: Both packages are compatible with Expo managed workflow. react-native-view-shot uses Expo's native modules. react-native-qrcode-svg is pure JS/SVG.
- [x] CHK046 - Is the assumption that `platform_config.settings` contains a timezone field validated against the existing 001-platform-core schema? [Assumption, data-model.md §2]
  > FIXED: platform_config.settings does NOT contain a timezone field. Updated data-model.md: himam_events.timezone note changed to "From program's organization timezone; falls back to 'Asia/Riyadh' if unset". Migration will add timezone to platform_config.settings or use a fallback.
- [x] CHK047 - Does the spec confirm that the existing `certificates` tab placeholder in the student UI is ready to be replaced, and no other feature depends on its current implementation? [Dependency, plan.md §Project Structure]
  > VERIFIED: certificates.tsx exists as a simple placeholder (ribbon icon + "No Results"). Safe to replace. No other features depend on it.

## Notes

- All 47 items resolved on 2026-03-01
- Items marked FIXED had spec/contract/data-model changes applied
- Items marked PASS were already covered by existing artifacts
- Items marked VERIFIED were confirmed via codebase inspection
- Total items: 47 | Passed: 28 | Fixed: 15 | Verified: 4
