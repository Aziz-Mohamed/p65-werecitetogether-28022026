# Quickstart: Branch Setup & Surgical Removals

**Branch**: `001-phase0-setup` | **Date**: 2026-03-02

## Prerequisites

- Node.js 18+ and npm
- Expo CLI (`npx expo`)
- Local Supabase running (`npm run supabase:start`)
- Checked out on branch `001-phase0-setup`

## What This Spec Does

1. **Removes** the work-attendance feature (GPS teacher check-in) — code only, database tables persist
2. **Updates** app branding from "Quran School" to "نتلو معاً / WeReciteTogether"
3. **Adds** deprecation comments to `school_id` and `class_id` references in key files
4. **Removes** location permissions from app.json (no longer needed)
5. **Verifies** all 17 preserved features and 5 route groups still work

## What This Spec Does NOT Do

- No database schema changes (no migrations)
- No new features added
- No authentication changes
- No new dependencies installed
- No new tables or columns

## Development Workflow

### Step 1: Remove Work-Attendance Feature

```bash
# Delete feature directory
rm -rf src/features/work-attendance/

# Delete route files
rm -f app/\(admin\)/work-attendance/index.tsx
rm -f app/\(admin\)/settings/location.tsx
rm -f app/\(admin\)/teachers/\[id\]/work-schedule.tsx
```

Then clean up imports in:
- `app/(teacher)/(tabs)/index.tsx` — remove GpsCheckinCard
- `app/(admin)/index.tsx` — remove work-attendance NavCard
- `app/(admin)/_layout.tsx` — remove Stack.Screen entries

### Step 2: Update Branding

Edit `app.json`: name, slug, scheme, bundleIdentifier, package.
Edit `src/i18n/en.json` and `ar.json`: `common.appName`, `student.journey.shareBranding`.
Edit `src/lib/constants.ts`: `APP_NAME`.

### Step 3: Remove Location Permissions

In `app.json`: remove `NSLocationWhenInUseUsageDescription`, `expo-location` plugin config, Android location permissions, WiFi entitlement.

### Step 4: Add Deprecation Comments

Add `@deprecated` JSDoc comments to service files and type files that reference `school_id` and `class_id`. Add SQL deprecation comments to the migration file.

### Step 5: Verify

```bash
# Build check
npx expo start

# Verify no TypeScript errors
npx tsc --noEmit

# Verify no dead imports
# Navigate each role flow manually: student, teacher, parent, admin
```

## Key Files

| File | Purpose |
|------|---------|
| `app.json` | App identity, permissions |
| `src/i18n/en.json` | English translations |
| `src/i18n/ar.json` | Arabic translations |
| `src/lib/constants.ts` | App constants |
| `src/features/schools/index.ts` | Schools module (deprecated, not deleted) |
| `supabase/migrations/00001_consolidated_schema.sql` | RLS policies (add deprecation comments) |
