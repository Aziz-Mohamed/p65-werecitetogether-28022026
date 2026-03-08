# Data Model: 007-admin-roles

## Schema Changes

### ALTER: program_roles (existing table)

Add `supervisor_id` column to support per-program supervisor-to-teacher linking.

```sql
ALTER TABLE program_roles
  ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN program_roles.supervisor_id IS
  'For teacher rows: the supervisor responsible for this teacher in this program. NULL for non-teacher roles.';
```

**Updated entity shape**:

| Column | Type | Constraints | Notes |
|--------|------|------------|-------|
| id | UUID | PK | Existing |
| profile_id | UUID | FK → profiles, NOT NULL | Existing |
| program_id | UUID | FK → programs, NOT NULL | Existing |
| role | TEXT | CHECK IN ('program_admin', 'supervisor', 'teacher'), NOT NULL | Existing |
| assigned_by | UUID | FK → profiles | Existing |
| supervisor_id | UUID | FK → profiles, ON DELETE SET NULL | **NEW** — only set when role='teacher' |
| created_at | TIMESTAMPTZ | DEFAULT now() | Existing |

**Unique**: (profile_id, program_id, role)

### NEW: platform_config

Global platform settings. Single-row table.

```sql
CREATE TABLE IF NOT EXISTS platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'WeReciteTogether',
  name_ar TEXT NOT NULL DEFAULT 'نتلو معاً',
  description TEXT,
  logo_url TEXT,
  default_meeting_platform TEXT CHECK (default_meeting_platform IN ('google_meet', 'zoom', 'jitsi', 'other')),
  settings JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**settings JSONB shape**:
```json
{
  "notification_defaults": {
    "quiet_hours_enabled": false,
    "quiet_hours_start": "22:00",
    "quiet_hours_end": "06:00"
  }
}
```

**RLS**: Master admin full access. All authenticated users can SELECT (read platform info).

## RPC Functions

### get_supervisor_dashboard_stats

Returns aggregated stats for a supervisor's assigned teachers and students.

**Parameters**: `p_supervisor_id UUID`

**Returns**: JSON with:
- `teacher_count`: count of teachers where supervisor_id = p_supervisor_id in program_roles
- `student_count`: count of distinct students enrolled under those teachers
- `sessions_this_week`: count of sessions by those teachers in the last 7 days
- `inactive_teachers`: array of teacher_ids with zero sessions in last 7 days

### get_program_admin_dashboard_stats

Returns aggregated stats for a specific program.

**Parameters**: `p_program_id UUID`

**Returns**: JSON with:
- `total_enrolled`: count of enrollments with status IN ('active', 'approved')
- `active_cohorts`: count of cohorts with status IN ('enrollment_open', 'in_progress')
- `total_teachers`: count of program_roles where role='teacher'
- `sessions_this_week`: count of sessions with program_id in last 7 days
- `pending_enrollments`: count of enrollments with status='pending'

### get_master_admin_dashboard_stats

Returns cross-program aggregated stats.

**Parameters**: none

**Returns**: JSON with:
- `total_students`: count of distinct profiles with role='student'
- `total_teachers`: count of distinct profiles with role='teacher'
- `total_active_sessions`: count of sessions in last 7 days
- `programs`: array of { program_id, name, name_ar, enrolled_count, session_count }

### get_supervised_teachers

Returns teachers assigned to a supervisor in their programs with activity stats.

**Parameters**: `p_supervisor_id UUID`

**Returns**: Set of rows:
- teacher_id, full_name, avatar_url, program_id, program_name
- student_count (enrolled under this teacher)
- sessions_this_week (count)
- average_rating (from teacher_rating_stats)
- is_active (has sessions in last 7 days)

### reassign_student

Moves a student's enrollment from one teacher to another within the same program.

**Parameters**: `p_enrollment_id UUID`, `p_new_teacher_id UUID`, `p_supervisor_id UUID`

**Returns**: void

**Validation**:
- Caller must be supervisor for the student's program
- New teacher must be in same program
- New teacher must be under the same supervisor

### search_users_for_role_assignment

Searches profiles for the master admin user management screen.

**Parameters**: `p_search_query TEXT`, `p_limit INT DEFAULT 20`

**Returns**: Set of rows:
- id, full_name, email, role, avatar_url, created_at
- program_roles: array of { program_id, program_name, role }

### assign_master_admin_role

Promotes a user to master_admin (changes profiles.role).

**Parameters**: `p_user_id UUID`, `p_assigned_by UUID`

**Returns**: void

**Validation**: Caller must be master_admin.

### revoke_master_admin_role

Demotes a master_admin back to their previous role.

**Parameters**: `p_user_id UUID`

**Returns**: void

**Validation**: Cannot remove the last master_admin (count check).

## Existing Tables Referenced (Read-Only)

| Table | Used For |
|-------|----------|
| profiles | User info, role routing, supervisor_id (deprecated) |
| programs | Program info, settings |
| program_tracks | Track info for cohort creation |
| cohorts | Cohort listing, status, teacher assignment |
| enrollments | Student counts, enrollment status |
| sessions | Session counts, activity metrics |
| teacher_rating_stats | Teacher quality metrics |
| teacher_ratings | Individual reviews (supervisor screen already exists) |
| program_queue_entries | Queue demand indicators |

## Entity Relationships

```
platform_config (singleton)

profiles ──┐
           │ profile_id
program_roles ──── programs
           │ supervisor_id (NEW)
           └──── profiles (supervisor)

enrollments ──── profiles (student)
           └──── profiles (teacher)
           └──── programs
           └──── cohorts
```
