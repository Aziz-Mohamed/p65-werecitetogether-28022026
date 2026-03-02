# Feature Specification: Branch Setup & Surgical Removals

**Feature Branch**: `001-phase0-setup`
**Created**: 2026-03-02
**Status**: Draft
**Input**: PRD Section 0 + Section 8.3/8.4 + Section 9 Phase 0 — Branch setup from Quran School codebase: remove work-attendance feature, deprecate school_id references in code comments, make GPS columns optional, update branding from "Quran School" to "نتلو معاً / WeReciteTogether", and verify all preserved features continue to work.

## Clarifications

### Session 2026-03-02

- Q: What is the scope of `school_id` deprecation comments — every file (~54) or key files only? → A: Key files only: service files, type definitions, feature index files, and RLS policies.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — App Launches with New Branding (Priority: P1)

An existing user opens the rebranded app. They see the new app name "نتلو معاً" (in Arabic) or "WeReciteTogether" (in English) on the splash screen and throughout the interface. All navigation, screens, and features they previously used — memorization tracking, scheduling, gamification, reports, sessions — continue to work exactly as before. The app feels familiar but carries the new organization's identity.

**Why this priority**: If the app doesn't launch and all existing features don't work, nothing else matters. Branding is the most visible change and the first thing users notice.

**Independent Test**: Launch the app, verify the new name and branding appear, navigate through all existing role-based screens (student, teacher, parent, admin), and confirm every feature renders and functions correctly.

**Acceptance Scenarios**:

1. **Given** the app is installed, **When** a user launches it, **Then** they see the new app name "نتلو معاً" (Arabic locale) or "WeReciteTogether" (English locale) on the splash screen.
2. **Given** the app is running, **When** a user navigates to any screen, **Then** all references to "Quran School" in the UI are replaced with "نتلو معاً" or "WeReciteTogether" depending on locale.
3. **Given** an existing student user logs in, **When** they navigate through Dashboard, Memorization, Revision, Journey, and Profile tabs, **Then** all screens render correctly with existing data intact.
4. **Given** an existing teacher user logs in, **When** they navigate through their tabs (Dashboard, Students, Sessions, Awards, Profile), **Then** all screens render correctly, session workspace functions, and student data is accessible.
5. **Given** an existing admin user logs in, **When** they navigate the admin dashboard, **Then** all management screens (classes, students, teachers, reports, settings) function correctly — except work attendance screens which are removed.
6. **Given** an existing parent user logs in, **When** they navigate the parent portal, **Then** all screens (child progress, attendance, reports) render and function correctly.
7. **Given** a user switches language between Arabic and English, **When** the layout reflows (RTL ↔ LTR), **Then** all screens maintain correct layout and the new branding appears in the active language.

---

### User Story 2 — Work Attendance Feature Removed (Priority: P2)

An admin who previously used the GPS-based work attendance feature no longer sees it in the admin navigation. The teacher dashboard no longer shows the GPS check-in card. All other admin features (class management, student management, reports, settings) continue to work. The removal is clean — no broken links, no error screens, no orphaned navigation items.

**Why this priority**: This is the only feature being deleted. It must be removed cleanly without breaking anything adjacent. It's lower priority than branding because it affects fewer users (only admins and teachers who used GPS check-in).

**Independent Test**: Log in as an admin, verify the work attendance menu item is gone, navigate all remaining admin screens to confirm nothing is broken. Log in as a teacher, verify the GPS check-in card is gone from the dashboard.

**Acceptance Scenarios**:

1. **Given** an admin user is logged in, **When** they view the admin navigation, **Then** there is no "Work Attendance" menu item or route.
2. **Given** a teacher user is logged in, **When** they view their dashboard, **Then** there is no GPS check-in card or work attendance section.
3. **Given** any user navigates the app, **When** they tap any link or button, **Then** no screen shows a "not found" error related to work attendance.
4. **Given** the admin settings screen, **When** an admin views location/geofence settings, **Then** those specific settings screens are removed (other settings remain).
5. **Given** the translation files, **When** the app renders, **Then** no work-attendance-related translation keys cause errors (keys may be left in files but are unused).
6. **Given** a user has a deep-link or bookmark to a work-attendance route, **When** they open that link, **Then** the app navigates to the nearest valid route (admin home for admins, teacher home for teachers) without crashing.

---

### User Story 3 — GPS Attendance Made Optional (Priority: P3)

A teacher conducting an online session no longer needs GPS verification to record attendance. The attendance system continues to function, but GPS-based fields (latitude, longitude, verification status) are optional rather than required. Schools that previously required GPS check-in can still function — the fields simply accept null values. No attendance data is lost.

**Why this priority**: Making GPS optional enables the online-first model without breaking the existing attendance flow. It's a schema-level change that doesn't affect any UI directly but is foundational for the online platform.

**Independent Test**: Record attendance for a session without providing GPS coordinates. Verify the record is saved successfully. Verify existing attendance records with GPS data are still accessible and displayed correctly.

**Acceptance Scenarios**:

1. **Given** a teacher records attendance for a session, **When** no GPS coordinates are provided, **Then** the attendance record is saved successfully with null GPS fields.
2. **Given** existing attendance records have GPS data, **When** a user views those records, **Then** the GPS data is still displayed correctly.
3. **Given** the attendance feature is used, **When** the system processes attendance without GPS, **Then** no errors or validation failures occur.

---

### User Story 4 — Deprecated Features Marked in Code (Priority: P4)

A developer working on the codebase encounters `school_id` references in the code. These references are marked with deprecation comments explaining that new code should use `program_id` instead. The deprecated code still functions — it's not broken or removed — but the intent is clear: future features should not rely on `school_id`. Similarly, the `class_id` field and multi-tenant school system code are marked as deprecated with guidance pointing to the new patterns.

**Why this priority**: This is a developer-facing change that doesn't affect end users. It sets the foundation for future specs but has no user-visible impact. It's important for code clarity but can be done last.

**Independent Test**: Search the codebase for `school_id` references in feature code — each should have a deprecation comment nearby. Verify the app still compiles and runs without errors after comments are added.

**Acceptance Scenarios**:

1. **Given** a developer opens a key file (service file, type definition, feature index, or RLS policy) containing `school_id`, **When** they read the code, **Then** there is a comment indicating it is deprecated and that new features should use `program_id`.
2. **Given** deprecation comments have been added, **When** the app is built and run, **Then** there are no build errors, runtime errors, or behavioral changes.
3. **Given** the `schools` feature module, **When** a developer inspects it, **Then** there is a top-level comment marking the module as deprecated with a reference to PRD Section 0.2.

---

### Edge Cases

- What happens if an admin bookmarked or deep-linked to a work attendance screen? Expo Router handles deleted route files by not matching them — the user should see the nearest valid route (admin home). No crash or blank screen.
- What happens if a teacher bookmarked or deep-linked to GPS check-in? Same behavior — Expo Router falls back to the teacher home tab. No crash.
- What happens if translation keys for work attendance are referenced by a third-party or overlooked import? Unused keys should not cause runtime errors (keys are left in translation files per FR-017).
- What happens if the admin dashboard component conditionally renders work attendance widgets? The conditional should be cleanly removed, not just hidden.
- What happens if attendance records reference work_attendance data via foreign keys? The `teacher_checkins` and `teacher_work_schedules` tables persist in the database (not dropped) — only application code is removed. Existing data is preserved, no cascading deletes.
- What happens if the EAS project slug changes from `quran-school` to `werecitetogether`? OTA update channels are tied to the slug. Existing app installs may not receive OTA updates after the slug change — this is acceptable since this is a new branch (fresh installs expected).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST display the name "نتلو معاً" when the locale is Arabic and "WeReciteTogether" when the locale is English, on the splash screen, app header, and all places where the app name appears.
- **FR-002**: The app bundle identifier MUST be updated to `com.werecitetogether.app` for production builds.
- **FR-003**: The app URL scheme MUST be updated from `quran-school` to `werecitetogether`.
- **FR-004**: All user-facing strings containing "Quran School" MUST be replaced with the new app name in both Arabic and English translation files. The `APP_NAME` constant in `src/lib/constants.ts` MUST also be updated.
- **FR-005**: The `src/features/work-attendance/` directory and all its contents MUST be deleted.
- **FR-006**: All route and screen files related to work attendance MUST be deleted: `app/(admin)/work-attendance/`, `app/(admin)/settings/location.tsx` (geofence config — depends entirely on work-attendance), and `app/(admin)/teachers/[id]/work-schedule.tsx` (work schedule management — depends entirely on work-attendance hooks).
- **FR-007**: All imports and references to work-attendance components, hooks, and services in other files MUST be removed cleanly (no dead imports). This includes removing Stack.Screen entries in `app/(admin)/_layout.tsx` for deleted routes, the `GpsCheckinCard` import/usage in `app/(teacher)/(tabs)/index.tsx`, and the work-attendance NavCard in `app/(admin)/index.tsx`.
- **FR-008**: The admin navigation MUST no longer include a work attendance entry.
- **FR-009**: The teacher dashboard MUST no longer include the GPS check-in card.
- **FR-010**: The admin settings MUST no longer include location/geofence configuration screens.
- **FR-011**: GPS-related columns MUST be nullable so attendance can be recorded without GPS data. Research confirmed this is already satisfied: the `attendance` table has no GPS columns, the `teacher_checkins` table GPS columns are already nullable, and the `schools` table GPS columns are already nullable. No schema migration is needed — this FR is documented as pre-satisfied.
- **FR-012**: All 17 preserved feature directories listed in PRD Section 0.2 MUST remain intact and fully functional after this spec is implemented.
- **FR-013**: All 5 preserved route groups (`(admin)`, `(teacher)`, `(student)`, `(parent)`, `(auth)`) MUST remain intact and navigable.
- **FR-014**: The `school_id` column and related code MUST NOT be deleted. The `get_user_school_id()` database function MUST NOT be deleted (33 RLS policies depend on it). Deprecation comments MUST be added to key files that reference `school_id` — specifically service files (`.service.ts`), type definitions (`.types.ts`), feature index files, and RLS policies — directing developers to use `program_id` in new code. Files that merely pass through `school_id` (e.g., component props, query results) do not require individual comments. The deprecation comment format for TypeScript files MUST use `@deprecated` JSDoc: `/** @deprecated school_id is deprecated. New features MUST use program_id instead. See PRD Section 0.5. */`. For SQL files, use: `-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id. DO NOT DELETE these policies.`
- **FR-015**: The `class_id` column and related code MUST NOT be deleted. Deprecation comments MUST be added to the same key file types as FR-014 (service files, type definitions, feature index files, and RLS policies) that reference `class_id`, directing developers to use `cohort_id` in new code. The same deprecation comment format defined in FR-014 applies.
- **FR-016**: The `schools` feature module (`src/features/schools/`) MUST NOT be deleted. A top-level deprecation comment MUST be added.
- **FR-017**: Existing i18n translation keys MUST NOT be removed (only new keys added and "Quran School" references updated).
- **FR-018**: All location-related configuration in `app.json` MUST be removed since GPS check-in is the only feature using location and it is being deleted. This includes: the iOS `NSLocationWhenInUseUsageDescription` in `infoPlist`, the `expo-location` plugin configuration and its `locationWhenInUsePermission`, Android permissions (`ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`), and the iOS WiFi entitlement (`com.apple.developer.networking.wifi-info`).
- **FR-019**: The `expo-location` npm package MUST be removed from `package.json` dependencies since no remaining feature requires device location.

### Key Entities

- **App Identity**: The name, bundle ID, URL scheme, icons, and splash screen that define the app's brand presence in stores and on devices.
- **Work Attendance**: The removed feature consisting of GPS check-in for teachers, work schedule management, and location verification. All associated code, routes, and UI components are deleted.
- **Attendance Record**: Existing attendance data that is preserved. GPS fields become optional (nullable) to support online sessions without location data.
- **Deprecated References**: Code-level markers (`school_id`, `class_id`, schools module) that still function but are annotated as deprecated with migration guidance.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The app launches successfully and displays the new branding ("نتلو معاً" / "WeReciteTogether") on 100% of screens where the app name appears.
- **SC-002**: All 4 role-based navigation flows (student, teacher, parent, admin) render without errors — 0 broken screens across all preserved routes.
- **SC-003**: The work attendance feature is completely absent — 0 references in navigation, 0 visible UI elements, 0 accessible routes.
- **SC-004**: GPS columns are confirmed nullable across all relevant tables — research verified the `attendance` table has no GPS columns, `teacher_checkins` GPS columns are already nullable, and `schools` GPS columns are already nullable. No schema migration needed (pre-satisfied).
- **SC-005**: The app builds successfully for both platforms with the new bundle identifier and URL scheme.
- **SC-006**: All 17 preserved features (memorization, gamification, scheduling, reports, sessions, classes, children, parents, dashboard, auth, notifications, onboarding, profile, realtime, schools, students, teachers) continue to function — verified by navigating each feature's primary screen and confirming no build errors or runtime crashes.
- **SC-007**: Language switching between Arabic and English works correctly with the new branding — layout reflows properly in both RTL and LTR.

## Assumptions & Dependencies

### Assumptions

- The branch starts from Quran School commit `6018fdb` with all 18 feature directories (17 preserved + 1 work-attendance to be removed) and 5 route groups intact.
- New app icons, splash screen images, and logo assets will be provided separately (placeholder or existing assets acceptable for this spec). The splash screen text/branding is handled via i18n, not baked into the image asset.
- The `work_attendance`, `teacher_checkins`, and `teacher_work_schedules` tables in the database persist — this spec removes feature code only, not database tables. GPS columns in `teacher_checkins` and `schools` are already nullable; the `attendance` table has no GPS columns.
- No data migration is needed — existing user data remains accessible through the preserved features.
- The Supabase project URL and keys will be updated in environment files but the specific values are outside this spec's scope.
- Changing the EAS project slug from `quran-school` to `werecitetogether` will create a new OTA update channel. Existing Quran School installs will not receive OTA updates from the new slug — this is acceptable for a new branch.

### Dependencies

- None — this is the first spec and depends on no other specs.

### Out of Scope

- OAuth authentication changes (covered by spec `002-auth-evolution`)
- New program tables or enrollment system (covered by spec `003-programs-enrollment`)
- New role types (supervisor, program_admin, master_admin) — these are added in later specs
- Theme color changes beyond the app name — detailed visual redesign is a separate effort
- Dropping the `work_attendance` database table — the table may persist; only the feature code is removed
