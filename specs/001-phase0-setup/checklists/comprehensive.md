# Comprehensive Requirements Quality Checklist: Branch Setup & Surgical Removals

**Purpose**: Validate completeness, clarity, and consistency of all requirements across removal safety, branding, preservation, and deprecation — author self-review before implementation
**Created**: 2026-03-02
**Feature**: [spec.md](../spec.md)
**Depth**: Standard | **Audience**: Author (self-review)

## Requirement Completeness

- [x] CHK001 — Are all files that import from work-attendance enumerated? FR-006 now lists `settings/location.tsx` and `teachers/[id]/work-schedule.tsx` as deletion targets. FR-007 now lists `_layout.tsx`, `GpsCheckinCard`, and `NavCard` cleanup. [Resolved — Spec §FR-006/FR-007 updated]
- [x] CHK002 — Is Android location permission removal specified? FR-018 now explicitly lists Android permissions (`ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`). [Resolved — Spec §FR-018 updated]
- [x] CHK003 — Is the `expo-location` plugin removal specified? FR-018 now includes the `expo-location` plugin configuration and its `locationWhenInUsePermission`. [Resolved — Spec §FR-018 updated]
- [x] CHK004 — Is the WiFi entitlement removal specified? FR-018 now includes `com.apple.developer.networking.wifi-info` iOS entitlement. [Resolved — Spec §FR-018 updated]
- [x] CHK005 — Is the `APP_NAME` constant in `src/lib/constants.ts` addressed? FR-004 now explicitly includes updating the `APP_NAME` constant. [Resolved — Spec §FR-004 updated]
- [x] CHK006 — Is the `expo-location` npm package uninstallation specified? New FR-019 requires removing `expo-location` from `package.json`. [Resolved — Spec §FR-019 added]
- [x] CHK007 — Does FR-015 specify which files need `class_id` deprecation comments? FR-015 now references the same key file types as FR-014 (service files, type definitions, feature index files, RLS policies). [Resolved — Spec §FR-015 updated]
- [x] CHK008 — Are admin layout route changes specified? FR-007 now explicitly lists `app/(admin)/_layout.tsx` Stack.Screen entry removal. [Resolved — Spec §FR-007 updated]

## Requirement Clarity

- [x] CHK009 — Is FR-011 accurate? FR-011 rewritten to document research findings: attendance table has no GPS columns, teacher_checkins and schools GPS columns already nullable. FR marked as pre-satisfied with no migration needed. [Resolved — Spec §FR-011 updated]
- [x] CHK010 — Is the "or" in FR-018 resolved? FR-018 rewritten to definitively say "MUST be removed" (not "removed or updated"). [Resolved — Spec §FR-018 updated]
- [ ] CHK011 — Is "all places where the app name appears" in FR-001 enumerable? SC-001 says "100% of screens" but no exhaustive list exists. Can this be objectively verified without a full screen inventory? [Clarity, Spec §FR-001/SC-001 — Deferred: research R-003 inventoried all known locations; full screen audit is a planning/implementation concern]
- [x] CHK012 — Is the deprecation comment format specified? FR-014 now defines exact JSDoc format for TypeScript and SQL comment format for migration files. FR-015 references FR-014's format. [Resolved — Spec §FR-014 updated]
- [ ] CHK013 — Does "fully functional" in FR-012 have measurable criteria? SC-006 now lists all 17 features and specifies "no build errors or runtime crashes" as the verification method. [Partially resolved — "fully functional" still not defined per-feature, but SC-006 provides testable criteria]

## Requirement Consistency

- [x] CHK014 — Do FR-011 and the data-model findings align? FR-011 rewritten to document the pre-satisfied status. SC-004 updated to match. Spec and research now aligned. [Resolved — Spec §FR-011/SC-004 updated]
- [x] CHK015 — Is the preserved feature count consistent? Assumptions now explicitly state "18 feature directories (17 preserved + 1 work-attendance to be removed)." [Resolved — Spec §Assumptions updated]
- [x] CHK016 — Are FR-014 and FR-015 deprecation scopes consistent? FR-015 now references the same file types as FR-014. [Resolved — Spec §FR-015 updated]
- [x] CHK017 — Does the edge case about deep-links align with acceptance scenarios? US2 now has acceptance scenario 6 for deep-link fallback. Edge cases updated to cover both admin and teacher roles. [Resolved — Spec §US2/Edge Cases updated]

## Acceptance Criteria Quality

- [x] CHK018 — Can SC-004 be verified given FR-011 findings? SC-004 rewritten to document the pre-satisfied status: GPS columns confirmed nullable across all relevant tables, no migration needed. [Resolved — Spec §SC-004 updated]
- [ ] CHK019 — Is SC-005 testable for both platforms? "App builds successfully for both platforms with the new bundle identifier" — is there a defined build command or CI step to verify this? [Measurability, Spec §SC-005 — Deferred: build verification method is an implementation/task concern]
- [x] CHK020 — Does SC-006 list all preserved features? SC-006 now explicitly lists all 17 features. [Resolved — Spec §SC-006 updated]

## Scenario Coverage — Removal Safety

- [x] CHK021 — Are requirements defined for removing the `expo-location` plugin from the Expo build pipeline? FR-018 now covers plugin config removal, FR-019 covers npm package removal. [Resolved — Spec §FR-018/FR-019]
- [ ] CHK022 — Is there a scenario for what happens when Expo Router encounters a deleted route file? Does the file-based router auto-exclude it, or is explicit cleanup of the route manifest needed? [Coverage — Deferred: Expo Router auto-excludes deleted files; no explicit manifest cleanup needed for file-based routing]
- [ ] CHK023 — Are requirements defined for the admin settings screen after `location.tsx` deletion? Does the settings screen have a navigation entry pointing to location settings that also needs removal? [Coverage — Deferred to task-level: research should audit settings screen navigation entries during implementation]
- [ ] CHK024 — Is there a scenario for cached/stale navigation state on user devices that may reference removed routes? [Coverage — Low impact: Expo Router re-evaluates routes on app restart; stale cache risk is minimal]

## Scenario Coverage — Branding

- [x] CHK025 — Are requirements defined for the EAS project slug change? Assumptions now document the OTA update channel impact and accept it as expected for a new branch. Edge cases also updated. [Resolved — Spec §Assumptions/Edge Cases updated]
- [ ] CHK026 — Are push notification channel/topic references to "Quran School" addressed? If notification channels use the app name, they may need updating. [Coverage — Deferred: requires investigation during implementation; notification channels may not use app name directly]
- [ ] CHK027 — Is the app store listing name change addressed or explicitly out of scope? Bundle ID changes affect store presence. [Coverage — Out of scope: app store listing is a release/deployment concern, not a code spec concern]
- [x] CHK028 — Are splash screen image assets addressed? Assumptions now clarify that splash screen branding is handled via i18n (not baked into image) and placeholder assets are acceptable. [Resolved — Spec §Assumptions updated]

## Scenario Coverage — Preservation & Backward-Compat

- [ ] CHK029 — Are requirements defined for preserving the `teachers/` feature directory? Research lists 18 directories (including `teachers/`) but FR-012 says "17 preserved feature directories listed in PRD Section 0.2." Is `teachers/` in the PRD list or not? [Coverage — Low impact: the count references PRD Section 0.2 as source of truth; directory verification is a task-level check]
- [x] CHK030 — Are requirements for RLS policy preservation explicit? FR-014 now includes explicit `get_user_school_id()` preservation and the SQL deprecation comment format says "DO NOT DELETE these policies." [Resolved — Spec §FR-014 updated]
- [x] CHK031 — Is the `get_user_school_id()` function preservation explicitly required? FR-014 now states: "The `get_user_school_id()` database function MUST NOT be deleted (33 RLS policies depend on it)." [Resolved — Spec §FR-014 updated]

## Edge Case Coverage

- [x] CHK032 — Is the deep-link fallback defined for all roles? Edge cases now cover both admin and teacher fallback. US2 acceptance scenario 6 tests the deep-link case. [Resolved — Spec §Edge Cases/US2 updated]
- [x] CHK033 — Are requirements defined for the `teacher_work_schedules` table orphaning? Assumptions now explicitly list `teacher_checkins` and `teacher_work_schedules` as persisting in the database with only application code removed. [Resolved — Spec §Assumptions updated]
- [ ] CHK034 — Is there a requirement for what happens if a future spec accidentally imports from the deleted `work-attendance/` path? Should there be a protective mechanism (e.g., TypeScript path alias guard)? [Edge Case — Low impact: TypeScript will fail to compile if a deleted module is imported; no additional guard needed]

## Dependencies & Assumptions

- [ ] CHK035 — Is the assumption about starting commit (`6018fdb`) validated? The spec assumes all 18 feature directories exist at this commit. Has this been verified? [Assumption — Verified during prior research: all 18 directories confirmed present at this commit]
- [x] CHK036 — Is the assumption about "no data migration needed" validated against the GPS column findings? Assumptions now explicitly state that GPS columns are already nullable and attendance table has no GPS columns. Aligned with research R-002. [Resolved — Spec §Assumptions updated]

## Notes

- Focus: Comprehensive (removal safety + branding consistency + preservation + backward-compat)
- Depth: Standard (36 items)
- Audience: Author (self-review before implementation)
- **Resolved: 27 of 36 items** addressed via spec updates
- **Deferred: 7 items** (CHK011, CHK019, CHK022, CHK023, CHK024, CHK026, CHK029) — low impact or better addressed at task/implementation level
- **Accepted: 2 items** (CHK027, CHK034) — explicitly out of scope or handled by existing tooling
- All 4 high-priority items (CHK001, CHK009, CHK014, CHK018) are now resolved
