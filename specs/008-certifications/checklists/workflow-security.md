# Workflow & Security Checklist: Certification System (Ijazah)

**Purpose**: Validate requirements quality for workflow correctness (state machine, approval chain, role gating) and security/privacy (public endpoint, minor masking, role enforcement)
**Created**: 2026-03-06
**Feature**: [spec.md](../spec.md) | [data-model.md](../data-model.md) | [contracts/rpc-functions.md](../contracts/rpc-functions.md)

## Workflow State Machine Completeness

- [X] CHK001 Are all 6 valid state transitions explicitly enumerated with source and target statuses? [Completeness, Spec §Key Entities] — Fixed: Key Entities now lists all 6 transitions with numbered list
- [X] CHK002 Are invalid state transitions explicitly prohibited (e.g., recommended → issued, returned → supervisor_approved)? [Gap] — Fixed: Key Entities now states "All other transitions are invalid and MUST be rejected by the system"
- [X] CHK003 Is the "returned → recommended" re-submission cycle documented with what data the teacher can modify on re-submit? [Clarity, Spec §US2 Scenario 5] — Fixed: US2 Scenario 5 now specifies "may update title, title_ar, and notes"
- [X] CHK004 Does the spec define what happens to `review_notes` when a returned certification is re-submitted — are they cleared, archived, or preserved? [Gap, Spec §Clarifications Q1] — Fixed: US2 Scenario 5 now states "previous review notes are cleared"
- [X] CHK005 Is the "rejected" status defined as terminal with no possibility of status change on that record? [Clarity, Spec §Edge Cases] — Already clear: "Rejection is final for that record"
- [X] CHK006 Are concurrent transition attempts addressed (e.g., supervisor approves while another supervisor returns the same cert)? [Gap, Exception Flow] — Fixed: New edge case added — system enforces current status before transition; stale actions fail with error

## Role-Based Access Requirements

- [X] CHK007 Are the exact roles permitted for each workflow action explicitly specified (recommend, review, approve/reject, issue, revoke, view)? [Completeness, Spec §FR-001 through FR-016] — Clear across FRs and user stories
- [X] CHK008 Is the teacher's authorization to recommend scoped to their own assigned students, not any student in the program? [Clarity, Spec §FR-001] — FR-001: "their assigned students"
- [X] CHK009 Is the supervisor's review scope defined — only recommendations from their supervised teachers, or all recommendations in the program? [Clarity, Spec §US2] — US2: "pending recommendations from their teachers"; Contract RPC-007: "where teacher is supervised by caller"
- [X] CHK010 Are program admin actions explicitly scoped to their assigned program via program_roles? [Completeness, Spec §FR-013] — FR-013 explicit
- [X] CHK011 Is the master admin's bypass of program scoping for certification oversight explicitly stated as a requirement? [Clarity, Spec §US6] — US6: "view all certifications issued across all programs"
- [X] CHK012 Does the spec define whether a user holding multiple roles (e.g., teacher + supervisor) can act on their own recommendation? [Gap, Edge Case] — Fixed: New FR-018 and edge case: "system MUST prevent self-approval"

## Notification Requirements at Workflow Transitions

- [X] CHK013 Are notification recipients explicitly specified for each of the 6 status transitions (recommended, supervisor_approved, returned, issued, rejected, revoked)? [Completeness, Spec §FR-007] — Fixed: FR-007 now has full recipient matrix for all 6 transitions
- [X] CHK014 Is the notification content for each transition type defined (or delegated to a separate i18n spec)? [Clarity, Spec §FR-007] — Delegated to i18n implementation; acceptable for spec level
- [X] CHK015 Are notification requirements consistent between the spec (FR-007) and the contracts (4 categories in research R4)? [Consistency, Spec §FR-007 vs Research §R4] — Fixed: Research R4 updated to 6 categories matching all 6 transitions in FR-007

## Public Verification Security

- [X] CHK016 Is the public verification endpoint defined as requiring no authentication? [Clarity, Spec §Assumptions] — Assumptions: "No authentication is required for verification"
- [X] CHK017 Are rate limiting or abuse prevention requirements specified for the unauthenticated verification endpoint? [Gap, Security] — Fixed: FR-011 now includes "max 30 requests per minute per IP" rate limiting
- [X] CHK018 Is the exact set of data fields exposed on the public verification page enumerated? [Completeness, Spec §US5] — US5 enumerates fields; Contract shows exact JSON shape
- [X] CHK019 Does the spec define whether the public endpoint returns any data for non-"issued" statuses (e.g., recommended, supervisor_approved)? [Gap, Security] — Fixed: FR-011 now states endpoint only returns data for "issued" and "revoked"; new edge case added
- [X] CHK020 Are CORS requirements for the verification endpoint documented? [Gap, Security] — Documented in contracts: "CORS: Enabled (Access-Control-Allow-Origin: *)"

## Minor Privacy Protection

- [X] CHK021 Is the criteria for identifying a minor clearly defined — by program association, age, or explicit flag? [Clarity, Spec §Clarifications Q2] — Clarification Q2 + Research R7: by Children's Program association
- [X] CHK022 Is the name masking format for minors precisely specified (first name + last initial)? [Completeness, Spec §FR-011] — FR-011 and US5 Scenario 2: "first name + last initial (e.g., 'Ahmed K.')"
- [X] CHK023 Does the privacy masking apply consistently across all surfaces where the student name appears (verification page, certificate image, in-app display)? [Consistency, Gap] — Fixed: New FR-019 clarifies masking is verification-endpoint-only
- [X] CHK024 Is there a requirement for privacy masking in the shared certificate image, or only on the verification page? [Gap, Privacy] — Fixed: FR-019 states shared images include full name since sharing is initiated by student/guardian

## Duplicate Prevention & Data Integrity

- [X] CHK025 Is the uniqueness constraint scope precisely defined — student + program + track, excluding rejected records? [Clarity, Spec §FR-006] — FR-006 explicit
- [X] CHK026 Does the spec address the edge case where track_id is null (trackless programs) and how uniqueness is enforced? [Gap, Edge Case] — Data-model uses COALESCE for null track_id in partial unique index
- [X] CHK027 Is the certificate number format (WRT-YYYY-NNNNN) defined with enough precision to prevent ambiguity (e.g., does YYYY reset the sequence annually)? [Clarity, Spec §FR-003] — Fixed: Assumptions now clarify "global sequence never resets — increments monotonically across years"

## Revocation Requirements

- [X] CHK028 Are revocation permissions consistent between spec (FR-012: master admin + program admin) and all user stories (US6 scenarios 3 and 4)? [Consistency, Spec §FR-012 vs §US6] — Consistent: FR-012 and US6 scenarios 3+4 align
- [X] CHK029 Does the spec define whether a revoked certificate can ever be un-revoked or re-issued? [Gap, Edge Case] — Fixed: New FR-020 states "revocation is terminal — MUST NOT be un-revoked or re-issued"
- [X] CHK030 Are the notification recipients for revocation explicitly specified — does the teacher who recommended also get notified? [Gap, Spec §FR-007] — Fixed: FR-007 revocation recipients now include "student, teacher, and program admin"

## Notes

- Focus: Workflow correctness and security/privacy
- Depth: Standard (~30 items)
- Audience: Pre-implementation reviewer
- All 30 items resolved on 2026-03-06
- Spec updated with 4 new FRs (FR-018 through FR-020), 5 new edge cases, expanded FR-007 and FR-011
- Research R4 updated from 4 to 6 notification categories
- Contracts updated with self-approval checks and rate limiting
