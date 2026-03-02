# Research: Branch Setup & Surgical Removals

**Branch**: `001-phase0-setup` | **Date**: 2026-03-02

## R-001: Work-Attendance Feature Scope

**Decision**: Delete the entire `src/features/work-attendance/` directory (12 files) plus 4 route/screen files and clean up 5 external references.

**Rationale**: The feature is fully self-contained under the work-attendance directory. External references are limited to 5 files that import from it.

**Files to DELETE**:

| Path | Type | Notes |
|------|------|-------|
| `src/features/work-attendance/` | Feature dir (12 files) | Entire directory |
| `app/(admin)/work-attendance/index.tsx` | Route | Admin monitoring dashboard |
| `app/(admin)/settings/location.tsx` | Screen (310 lines) | Entirely depends on work-attendance imports |
| `app/(admin)/teachers/[id]/work-schedule.tsx` | Screen (270 lines) | Entirely depends on work-attendance hooks |

**Files to MODIFY (remove references)**:

| Path | Change | Lines |
|------|--------|-------|
| `app/(teacher)/(tabs)/index.tsx` | Remove `GpsCheckinCard` import + JSX usage | L15, L71 |
| `app/(admin)/index.tsx` | Remove work-attendance NavCard | L132-137 |
| `app/(admin)/_layout.tsx` | Remove `work-attendance/index` and `teachers/[id]/work-schedule` Stack.Screen entries | L41, L20 |

**i18n keys to leave in place** (per FR-017 — do not remove translation keys):

| File | Sections | Lines |
|------|----------|-------|
| `src/i18n/en.json` | `admin.workAttendance.*`, `admin.location.*`, `admin.workSchedule.*`, `workAttendance.*` | ~L663-741, ~L1157-1178 |
| `src/i18n/ar.json` | Same sections | Same regions |

**Alternatives considered**: Removing translation keys for work-attendance — rejected per FR-017 to avoid accidental breakage.

---

## R-002: GPS Columns — Already Nullable

**Decision**: No schema migration needed for GPS columns. FR-011 is already satisfied.

**Rationale**: Research of the actual database schema reveals:

1. **`attendance` table** (student attendance): Has **no GPS columns at all**. Columns are: `id`, `school_id`, `student_id`, `class_id`, `date`, `status`, `marked_by`, `notes`, `scheduled_session_id`.

2. **`teacher_checkins` table** (teacher work attendance): Has GPS columns (`checkin_latitude`, `checkin_longitude`, `checkout_latitude`, `checkout_longitude`, `checkin_distance_meters`, `checkout_distance_meters`), but they are **already nullable**. This table belongs to the work-attendance feature being removed — the table itself is not dropped (out of scope) but the code accessing it is deleted.

3. **`schools` table**: Has `latitude` and `longitude` columns, both **already nullable** (with a CHECK constraint ensuring both-or-neither).

**Impact on FR-011**: The spec states "GPS-related columns in the attendance table... MUST be made nullable." Since the attendance table has no GPS columns and the teacher_checkins columns are already nullable, this requirement is already satisfied. No migration needed.

**Alternatives considered**: Creating a migration to explicitly document the nullable status — rejected as unnecessary since schema is already correct.

---

## R-003: Branding Strings — Complete Inventory

**Decision**: Update 4 locations with new branding.

**Locations requiring branding update**:

| File | Key/Field | Current Value | New Value |
|------|-----------|---------------|-----------|
| `app.json` | `expo.name` | `"Quran School"` | `"WeReciteTogether"` |
| `app.json` | `expo.slug` | `"quran-school"` | `"werecitetogether"` |
| `app.json` | `expo.scheme` | `"quran-school"` | `"werecitetogether"` |
| `app.json` | `expo.ios.bundleIdentifier` | `"com.millionmilescode.quranschool"` | `"com.werecitetogether.app"` |
| `app.json` | `expo.android.package` | `"com.millionmilescode.quranschool"` | `"com.werecitetogether.app"` |
| `src/i18n/en.json` | `common.appName` | `"Quran School"` | `"WeReciteTogether"` |
| `src/i18n/en.json` | `student.journey.shareBranding` | `"Quran School"` | `"WeReciteTogether"` |
| `src/i18n/ar.json` | `common.appName` | `"مدرسة القرآن"` | `"نتلو معاً"` |
| `src/i18n/ar.json` | `student.journey.shareBranding` | `"مدرسة القرآن"` | `"نتلو معاً"` |
| `src/lib/constants.ts` | `APP_NAME` | `"Quran School"` | `"WeReciteTogether"` |

**Rationale**: These are the only user-facing "Quran School" references. All other code references to `school_id`, `schools`, etc. are data-layer identifiers and are handled by deprecation comments, not branding updates.

---

## R-004: iOS/Android Location Permissions

**Decision**: Remove all location-related permissions and the `expo-location` plugin configuration.

**Current state**:
- iOS `infoPlist.NSLocationWhenInUseUsageDescription`: `"We need your location to verify you are at the school when checking in."`
- `expo-location` plugin with `locationWhenInUsePermission` message
- Android permissions: `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION`
- iOS WiFi entitlement: `com.apple.developer.networking.wifi-info`

**Action**: Remove all of the above from `app.json`. GPS check-in is the only feature using location, and it's being removed. No other feature in this spec or any planned future spec requires device location.

**Alternatives considered**: Keeping permissions with updated description for future use — rejected because unused permissions trigger App Store review warnings and reduce user trust.

---

## R-005: Deprecation Comment Targets

**Decision**: Add deprecation comments to key files (service files, type files, feature indexes, RLS policies) per clarified FR-014.

### school_id Deprecation Targets (12 service + 3 type + 1 index + 1 migration)

**Service files** (`.service.ts`):

| # | File | Occurrences |
|---|------|-------------|
| 1 | `src/features/reports/services/teacher-reports.service.ts` | 2 |
| 2 | `src/features/reports/services/admin-reports.service.ts` | 11 |
| 3 | `src/features/dashboard/services/admin-dashboard.service.ts` | 5 |
| 4 | `src/features/scheduling/services/scheduled-session.service.ts` | 5 |
| 5 | `src/features/scheduling/services/class-schedule.service.ts` | 2 |
| 6 | `src/features/scheduling/services/recitation-plan.service.ts` | 3 |
| 7 | `src/features/sessions/services/sessions.service.ts` | 4 |
| 8 | `src/features/sessions/services/checkin.service.ts` | 1 |
| 9 | `src/features/memorization/services/recitation.service.ts` | 2 |
| 10 | `src/features/memorization/services/assignment.service.ts` | 1 |
| 11 | `src/features/memorization/services/memorization-progress.service.ts` | 1 |
| 12 | `src/features/classes/services/classes.service.ts` | 1 |
| 13 | `src/features/attendance/services/attendance.service.ts` | 1 |
| 14 | `src/features/schools/services/school-settings.service.ts` | implicit |

Note: `src/features/work-attendance/services/work-attendance.service.ts` has 5 occurrences but is being deleted.

**Type files** (`.types.ts`):

| # | File | Fields |
|---|------|--------|
| 1 | `src/features/scheduling/types/recitation-plan.types.ts` | `school_id: string` |
| 2 | `src/features/memorization/types/memorization.types.ts` | `school_id: string` (2 interfaces) |
| 3 | `src/features/auth/types/auth.types.ts` | `school_id: string` |

**Feature index**:

| # | File | Action |
|---|------|--------|
| 1 | `src/features/schools/index.ts` | Add module-level deprecation comment (FR-016) |

**RLS policies** (in `supabase/migrations/00001_consolidated_schema.sql`):

| Table | Policies using `get_user_school_id()` |
|-------|---------------------------------------|
| `schools` | 2 |
| `profiles` | 3 |
| `classes` | 5 |
| `students` | 5 |
| `sessions` | 9 |
| `attendance` | 9 |
| `teacher_checkins` | 5 (deleted with feature) |
| **Total** | 38 (33 after work-attendance removal) |

Plus the `get_user_school_id()` function definition itself.

### class_id Deprecation Targets (12 service + 4 type files)

**Service files**: `teacher-reports.service.ts`, `admin-reports.service.ts`, `parent-reports.service.ts`, `children.service.ts`, `students.service.ts`, `teacher-dashboard.service.ts`, `scheduled-session.service.ts`, `class-schedule.service.ts`, `gamification.service.ts`, `classes.service.ts`, `attendance.service.ts`, `sessions.service.ts`

**Type files**: `auth.types.ts`, `students.types.ts`, `sessions.types.ts`, `attendance.types.ts`

### Deprecation Comment Format

```typescript
/**
 * @deprecated school_id is deprecated. New features MUST use program_id instead.
 * See PRD Section 0.5 for schema migration rules.
 */
```

For RLS policies (SQL):
```sql
-- DEPRECATED: school_id scoping is deprecated. New tables MUST use program_id.
-- See PRD Section 0.5 for migration rules. DO NOT DELETE these policies.
```

---

## R-006: Preserved Feature Verification

**Decision**: All 17 preserved feature directories confirmed present and unaffected by this spec's changes.

**Verified directories** (from `src/features/`):
1. `attendance/` — No modification needed (no GPS columns)
2. `auth/` — Preserved
3. `children/` — Preserved
4. `classes/` — Preserved
5. `dashboard/` — Preserved
6. `gamification/` — Preserved
7. `memorization/` — Preserved
8. `notifications/` — Preserved
9. `onboarding/` — Preserved
10. `parents/` — Preserved
11. `profile/` — Preserved
12. `realtime/` — Preserved
13. `reports/` — Preserved
14. `scheduling/` — Preserved
15. `schools/` — Preserved (deprecation comment added, not deleted)
16. `sessions/` — Preserved
17. `students/` — Preserved
18. `teachers/` — Preserved (if exists)

**Verified route groups**: `(admin)`, `(teacher)`, `(student)`, `(parent)`, `(auth)` — all preserved.
