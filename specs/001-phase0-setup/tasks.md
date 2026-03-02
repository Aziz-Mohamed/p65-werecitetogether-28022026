# Tasks: Branch Setup & Surgical Removals

**Input**: Design documents from `/specs/001-phase0-setup/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story. US3 (GPS Optional) is pre-satisfied per research R-002 — no tasks needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Verify branch starting point before making any changes

- [x] T001 Verify branch starts from commit `6018fdb` with all 18 feature directories in `src/features/` and all 5 route groups in `app/` — list directories and confirm count matches spec assumptions

**Checkpoint**: Branch verified — implementation can begin

---

## Phase 2: User Story 2 — Work Attendance Feature Removed (Priority: P2)

**Goal**: Surgically remove the work-attendance feature code. No broken links, no dead imports, no orphaned navigation items.

**Independent Test**: Log in as admin — no work attendance menu. Log in as teacher — no GPS check-in card. Navigate all remaining screens — no errors.

**Why P2 before P1**: Removal is the riskiest operation and affects `app.json` (which US1 also modifies). Completing removal first ensures a clean codebase for branding updates.

### Implementation for User Story 2

- [x] T002 [US2] Delete the entire `src/features/work-attendance/` directory (12 files: components, hooks, services, types, utils, index)
- [x] T003 [P] [US2] Delete route file `app/(admin)/work-attendance/index.tsx`
- [x] T004 [P] [US2] Delete screen file `app/(admin)/settings/location.tsx` (310 lines — entirely depends on work-attendance imports)
- [x] T005 [P] [US2] Delete screen file `app/(admin)/teachers/[id]/work-schedule.tsx` (270 lines — entirely depends on work-attendance hooks)
- [x] T006 [US2] Remove Stack.Screen entries for `work-attendance/index` (L41) and `teachers/[id]/work-schedule` (L20) from `app/(admin)/_layout.tsx`
- [x] T007 [P] [US2] Remove `GpsCheckinCard` import (L15) and JSX usage (L71) from `app/(teacher)/(tabs)/index.tsx`
- [x] T008 [P] [US2] Remove work-attendance NavCard (L132-137) from `app/(admin)/index.tsx`
- [x] T009 [US2] Remove all location-related configuration from `app.json`: iOS `NSLocationWhenInUseUsageDescription` in `infoPlist`, `expo-location` plugin entry and its `locationWhenInUsePermission`, Android permissions (`ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`), and iOS WiFi entitlement (`com.apple.developer.networking.wifi-info`)
- [x] T010 [US2] Remove `expo-location` package from dependencies — run `npm uninstall expo-location` and verify `package.json` and lock file are updated

**Checkpoint**: Work attendance feature completely removed. App should build without errors. Verify with `npx tsc --noEmit`.

---

## Phase 3: User Story 1 — App Launches with New Branding (Priority: P1) — MVP

**Goal**: Replace all "Quran School" branding with "نتلو معاً" (Arabic) / "WeReciteTogether" (English). App identity updated across all surfaces.

**Independent Test**: Launch app in both locales — new name appears on splash screen and all screens. Switch languages — branding updates and layout reflows correctly.

### Implementation for User Story 1

- [x] T011 [US1] Update `app.json` branding: change `expo.name` from `"Quran School"` to `"WeReciteTogether"`, `expo.slug` from `"quran-school"` to `"werecitetogether"`, `expo.scheme` from `"quran-school"` to `"werecitetogether"`, `expo.ios.bundleIdentifier` from `"com.millionmilescode.quranschool"` to `"com.werecitetogether.app"`, `expo.android.package` from `"com.millionmilescode.quranschool"` to `"com.werecitetogether.app"`
- [x] T012 [P] [US1] Update English translations in `src/i18n/en.json`: change `common.appName` from `"Quran School"` to `"WeReciteTogether"` and `student.journey.shareBranding` from `"Quran School"` to `"WeReciteTogether"` — do NOT remove any existing translation keys (FR-017)
- [x] T013 [P] [US1] Update Arabic translations in `src/i18n/ar.json`: change `common.appName` from `"مدرسة القرآن"` to `"نتلو معاً"` and `student.journey.shareBranding` from `"مدرسة القرآن"` to `"نتلو معاً"` — do NOT remove any existing translation keys (FR-017)
- [x] T014 [P] [US1] Update `APP_NAME` constant in `src/lib/constants.ts` from `"Quran School"` to `"WeReciteTogether"`

**Checkpoint**: Branding fully updated. App displays new name in both locales. All 4 role-based navigation flows render correctly.

---

## Phase 4: User Story 3 — GPS Attendance Made Optional (Priority: P3) — Pre-Satisfied

**Goal**: GPS columns must be nullable so attendance works without GPS data.

**Status**: **PRE-SATISFIED — No tasks needed.** Research R-002 confirmed:
- The `attendance` table has no GPS columns at all
- The `teacher_checkins` table GPS columns are already nullable
- The `schools` table GPS columns are already nullable
- No schema migration is needed

**Independent Test**: Confirm no migration was required by reviewing data-model.md findings.

---

## Phase 5: User Story 4 — Deprecated Features Marked in Code (Priority: P4)

**Goal**: Add `@deprecated` JSDoc comments to key files referencing `school_id` and `class_id`. Code continues to function — comments only.

**Independent Test**: Search for `school_id` in service/type/index files — each has a deprecation comment. App builds and runs without errors after comments are added.

### school_id Deprecation (FR-014)

Comment format: `/** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */`

- [x] T015 [P] [US4] Add `@deprecated school_id` comments to reports service files: `src/features/reports/services/admin-reports.service.ts` (11 occurrences), `src/features/reports/services/teacher-reports.service.ts` (2 occurrences), `src/features/reports/services/parent-reports.service.ts` (class_id only — add `@deprecated class_id` comment here, using `cohort_id` direction)
- [x] T016 [P] [US4] Add `@deprecated school_id` comments to dashboard service files: `src/features/dashboard/services/admin-dashboard.service.ts` (5 occurrences), `src/features/dashboard/services/teacher-dashboard.service.ts` (class_id only — add `@deprecated class_id` comment)
- [x] T017 [P] [US4] Add `@deprecated school_id` and `@deprecated class_id` comments to scheduling files: `src/features/scheduling/services/scheduled-session.service.ts`, `src/features/scheduling/services/class-schedule.service.ts`, `src/features/scheduling/services/recitation-plan.service.ts`, `src/features/scheduling/types/recitation-plan.types.ts`
- [x] T018 [P] [US4] Add `@deprecated school_id` and `@deprecated class_id` comments to sessions files: `src/features/sessions/services/sessions.service.ts`, `src/features/sessions/services/checkin.service.ts`, `src/features/sessions/types/sessions.types.ts`
- [x] T019 [P] [US4] Add `@deprecated school_id` comments to memorization files: `src/features/memorization/services/recitation.service.ts`, `src/features/memorization/services/assignment.service.ts`, `src/features/memorization/services/memorization-progress.service.ts`, `src/features/memorization/types/memorization.types.ts`
- [x] T020 [P] [US4] Add `@deprecated school_id` and `@deprecated class_id` comments to classes, attendance, and auth files: `src/features/classes/services/classes.service.ts`, `src/features/attendance/services/attendance.service.ts`, `src/features/attendance/types/attendance.types.ts`, `src/features/auth/types/auth.types.ts`
- [x] T021 [P] [US4] Add `@deprecated class_id` comments to remaining class_id-only files: `src/features/students/services/students.service.ts`, `src/features/students/types/students.types.ts`, `src/features/children/services/children.service.ts`, `src/features/gamification/services/gamification.service.ts`

### Schools Module Deprecation (FR-016)

- [x] T022 [P] [US4] Add module-level deprecation comment to `src/features/schools/index.ts` referencing PRD Section 0.2 and add `@deprecated school_id` comment to `src/features/schools/services/school-settings.service.ts`

### RLS Policy Deprecation (SQL)

SQL comment format: `-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.`

- [x] T023 [US4] Add deprecation comments to `supabase/migrations/00001_consolidated_schema.sql`: above `get_user_school_id()` function definition and above RLS policy blocks for schools, profiles, classes, students, sessions, and attendance tables (33 policies total). Do NOT modify any SQL code — comments only.

**Checkpoint**: All key files have deprecation comments. App builds and runs without errors. No behavioral changes.

---

## Phase 6: Polish & Verification

**Purpose**: Final validation across all user stories

- [x] T024 Run TypeScript compilation check (`npx tsc --noEmit`) to verify zero build errors after all changes
- [x] T025 Verify all 17 preserved feature directories exist in `src/features/` and all 5 route groups exist in `app/` — compare against PRD Section 0.2 list
- [ ] T026 Launch the app and manually navigate all 4 role flows (student, teacher, parent, admin) to verify zero broken screens — check both English and Arabic locales with language switching

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify branch first
- **US2 Removal (Phase 2)**: Depends on Setup — should complete before US1 because both modify `app.json` and removal ensures a clean codebase
- **US1 Branding (Phase 3)**: Depends on US2 completion (shared `app.json` file) — can be done in parallel if `app.json` changes are coordinated
- **US3 GPS Optional (Phase 4)**: Pre-satisfied — no tasks
- **US4 Deprecation (Phase 5)**: Independent of US1/US2 — can run in parallel with either
- **Polish (Phase 6)**: Depends on all phases complete

### User Story Dependencies

- **US2 (P2)**: Start first — removal is the riskiest operation, establishes clean codebase
- **US1 (P1)**: Start after US2 completes (or in parallel if `app.json` edits are coordinated)
- **US4 (P4)**: Fully independent — can start any time after Setup, touches different files
- **US3 (P3)**: No tasks — pre-satisfied

### Within Each User Story

- US2: Delete feature dir first (T002), then delete routes (T003-T005 parallel), then clean imports (T006-T008 parallel), then config cleanup (T009-T010 sequential)
- US1: All branding tasks (T011-T014) can run in parallel after US2 `app.json` changes are done
- US4: All deprecation batches (T015-T022) can run in parallel. SQL task (T023) is independent.

### Parallel Opportunities

```
After T001 (Setup):
├── US2 tasks T002-T010 (sequential within, but T003/T004/T005 parallel, T007/T008 parallel)
├── US4 tasks T015-T023 (all [P] — can run in parallel, independent files)
│
After US2 complete:
├── US1 tasks T011-T014 (T012/T013/T014 parallel)
│
After all stories complete:
└── Polish T024-T026 (sequential)
```

---

## Parallel Example: User Story 4

```bash
# Launch ALL deprecation batches simultaneously (all touch different files):
Task T015: "Reports service deprecation comments"
Task T016: "Dashboard service deprecation comments"
Task T017: "Scheduling service/type deprecation comments"
Task T018: "Sessions service/type deprecation comments"
Task T019: "Memorization service/type deprecation comments"
Task T020: "Classes/attendance/auth deprecation comments"
Task T021: "Students/children/gamification deprecation comments"
Task T022: "Schools module deprecation"
Task T023: "SQL RLS policy deprecation comments"
```

---

## Implementation Strategy

### MVP First (US2 + US1)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: US2 — Remove work-attendance (T002-T010)
3. **STOP and VALIDATE**: App builds, no dead imports, admin/teacher screens clean
4. Complete Phase 3: US1 — Update branding (T011-T014)
5. **STOP and VALIDATE**: App displays new branding in both locales
6. Deploy/demo — app is functional with new identity and no deprecated feature

### Full Delivery

1. MVP (US2 + US1) as above
2. US4 — Deprecation comments (T015-T023) — can be done in parallel with MVP
3. Polish (T024-T026) — final verification

### Fastest Path (Maximum Parallelism)

1. T001 (Setup)
2. Simultaneously:
   - Stream A: T002 → T003/T004/T005 → T006/T007/T008 → T009 → T010 (US2)
   - Stream B: T015/T016/T017/T018/T019/T020/T021/T022/T023 (all US4 in parallel)
3. After Stream A completes: T011/T012/T013/T014 (US1, mostly parallel)
4. T024 → T025 → T026 (Polish, sequential)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US3 (GPS Optional) has zero tasks — pre-satisfied per research R-002
- US2 is ordered before US1 despite lower priority because removal establishes a clean codebase and both modify `app.json`
- All deprecation tasks (US4) are comment-only — zero risk of breaking functionality
- Translation keys for work-attendance are intentionally LEFT IN PLACE per FR-017
- Commit after each phase checkpoint for clean rollback points
