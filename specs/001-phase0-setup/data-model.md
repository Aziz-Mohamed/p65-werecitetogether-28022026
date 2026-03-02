# Data Model: Branch Setup & Surgical Removals

**Branch**: `001-phase0-setup` | **Date**: 2026-03-02

## Overview

This spec makes **no schema changes**. All database tables and columns remain unchanged. This document records the schema audit results that confirm no migrations are needed.

## Tables Audit

### Tables Unaffected (PRESERVE)

| Table | Status | Notes |
|-------|--------|-------|
| `schools` | PRESERVE | GPS columns (`latitude`, `longitude`) already nullable. `verification_mode`, `geofence_radius_meters` remain — schools table is deprecated, not deleted. |
| `profiles` | PRESERVE | `school_id` column preserved, deprecated in code comments. |
| `classes` | PRESERVE | No changes. |
| `students` | PRESERVE | `class_id` column preserved, deprecated in code comments. |
| `sessions` | PRESERVE | `school_id` column preserved. |
| `attendance` | PRESERVE | No GPS columns exist on this table. `school_id` preserved. |
| `recitations` | PRESERVE | No changes. |
| `memorization_progress` | PRESERVE | No changes. |
| `memorization_assignments` | PRESERVE | No changes. |
| `scheduled_sessions` | PRESERVE | No changes. |
| `stickers` | PRESERVE | No changes. |
| `student_stickers` | PRESERVE | No changes. |
| `push_tokens` | PRESERVE | No changes. |
| `notification_preferences` | PRESERVE | No changes. |

### Tables Belonging to Removed Feature (NO ACTION)

| Table | Status | Notes |
|-------|--------|-------|
| `teacher_checkins` | NO ACTION | Part of work-attendance. Feature code deleted, table persists in database. GPS columns already nullable. Table is NOT dropped (out of scope). |
| `teacher_work_schedules` | NO ACTION | Part of work-attendance. Feature code deleted, table persists. Table is NOT dropped (out of scope). |

### RLS Policies (NO CHANGES)

All existing RLS policies using `get_user_school_id()` remain in place. The `get_user_school_id()` function is preserved. No new policies are added. No existing policies are modified.

A deprecation comment will be added to the migration file above the `get_user_school_id()` function and above the policy blocks, but the SQL itself is unchanged.

## FR-011 Resolution

The spec's FR-011 states: "GPS-related columns in the attendance table (latitude, longitude, verification-related fields) MUST be made nullable."

**Finding**: The `attendance` table has no GPS columns. GPS columns exist only in `teacher_checkins` (part of work-attendance, being removed as code) and `schools` (already nullable). **FR-011 is already satisfied — no migration needed.**

## Entity Relationship Notes

No entity relationships are added, modified, or removed by this spec. The work-attendance feature's tables (`teacher_checkins`, `teacher_work_schedules`) remain in the database but become orphaned (no application code references them after feature removal).
