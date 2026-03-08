# Data Model: Himam Quranic Marathon Events

**Feature**: 009-himam | **Date**: 2026-03-06

## Entities

### himam_events

Weekly marathon event, auto-generated every Saturday.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Event identifier |
| program_id | uuid | NOT NULL, FK → programs(id) ON DELETE CASCADE | Links to Himam program |
| event_date | date | NOT NULL | Saturday date of the event |
| start_time | time | NOT NULL, DEFAULT '05:00' | Fajr start (Makkah time) |
| end_time | time | NOT NULL, DEFAULT '05:00' | Fajr next day (Makkah time) |
| registration_deadline | timestamptz | NOT NULL | Saturday 00:00:00 Makkah time (end of Friday) |
| status | text | NOT NULL, DEFAULT 'upcoming', CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) | Event lifecycle state |
| created_by | uuid | FK → profiles(id) ON DELETE SET NULL | NULL = auto-generated, set if supervisor-created |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

**Indexes**:
- `idx_himam_events_date` ON (event_date DESC)
- `idx_himam_events_status` ON (status) WHERE status = 'upcoming'
- UNIQUE ON (event_date) — one event per Saturday

**RLS Policies**:
- SELECT: authenticated users enrolled in Himam program (via enrollments join) OR supervisors/program_admins
- INSERT: supervisors and program_admins for the Himam program
- UPDATE: supervisors and program_admins for the Himam program

### himam_registrations

Student signup for a specific event and track.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Registration identifier |
| event_id | uuid | NOT NULL, FK → himam_events(id) ON DELETE CASCADE | Which event |
| student_id | uuid | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Who registered |
| track | text | NOT NULL, CHECK (track IN ('3_juz', '5_juz', '10_juz', '15_juz', '30_juz')) | Volume track |
| selected_juz | int[] | NOT NULL | Array of juz numbers student will recite |
| partner_id | uuid | FK → profiles(id) ON DELETE SET NULL | Paired partner (NULL until paired) |
| time_slots | jsonb | NOT NULL, DEFAULT '[]' | Selected prayer-time blocks, e.g., ["fajr", "dhuhr", "asr"] |
| status | text | NOT NULL, DEFAULT 'registered', CHECK (status IN ('registered', 'paired', 'in_progress', 'completed', 'incomplete', 'cancelled')) | Registration lifecycle |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

**Indexes**:
- UNIQUE ON (event_id, student_id) — one registration per student per event
- `idx_himam_reg_event_track` ON (event_id, track)
- `idx_himam_reg_student` ON (student_id)
- `idx_himam_reg_partner` ON (partner_id) WHERE partner_id IS NOT NULL

**Validation**:
- `selected_juz` array length must match track requirement: 3_juz → 3 items, 5_juz → 5, etc.
- All juz values must be between 1 and 30 inclusive
- No duplicate juz values in the array

**RLS Policies**:
- SELECT: own registration (student_id = auth.uid()) OR partner's registration (partner_id = auth.uid()) OR supervisors/program_admins
- INSERT: authenticated students enrolled in Himam program
- UPDATE: own registration (for cancellation) OR supervisors/program_admins (for pairing/status changes)
- DELETE: none (use status = 'cancelled' instead)

### himam_progress

Per-juz completion tracking within a registration.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() | Progress record identifier |
| registration_id | uuid | NOT NULL, FK → himam_registrations(id) ON DELETE CASCADE | Which registration |
| juz_number | int | NOT NULL, CHECK (juz_number BETWEEN 1 AND 30) | Which juz |
| status | text | NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'completed')) | Completion status |
| completed_at | timestamptz | | When completed (NULL if pending) |
| completed_by | uuid | FK → profiles(id) ON DELETE SET NULL | Which partner marked it complete |
| notes | text | | Optional completion notes |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |

**Indexes**:
- UNIQUE ON (registration_id, juz_number) — one record per juz per registration
- `idx_himam_progress_reg` ON (registration_id)

**RLS Policies**:
- SELECT: via registration ownership (join to himam_registrations.student_id or partner_id)
- INSERT: registration owner or their partner
- UPDATE: registration owner or their partner

## State Machine: Event Lifecycle

```
[auto-generated] → upcoming → active → completed
                      ↓
                   cancelled
```

- `upcoming` → `active`: pg_cron at Saturday Fajr (05:00 Makkah)
- `active` → `completed`: pg_cron at Sunday Fajr (05:00 Makkah)
- `upcoming` → `cancelled`: supervisor action

## State Machine: Registration Lifecycle

```
registered → paired → in_progress → completed
    ↓                      ↓
 cancelled              incomplete
```

- `registered` → `paired`: pairing algorithm sets partner_id
- `paired` → `in_progress`: event transitions to "active"
- `in_progress` → `completed`: all selected juz marked complete
- `in_progress` → `incomplete`: event window closes
- `registered` → `cancelled`: student cancels before deadline
- Any → `cancelled`: event cancelled by supervisor

## Track Requirements

| Track | Juz Count | selected_juz array length |
|-------|-----------|---------------------------|
| 3_juz | 3 | 3 |
| 5_juz | 5 | 5 |
| 10_juz | 10 | 10 |
| 15_juz | 15 | 15 |
| 30_juz | 30 | 30 |

## Prayer-Time Block Labels

Predefined constants (not calculated from actual prayer times):

| Label | Arabic | Description |
|-------|--------|-------------|
| fajr | الفجر | Dawn prayer block |
| dhuhr | الظهر | Noon prayer block |
| asr | العصر | Afternoon prayer block |
| maghrib | المغرب | Sunset prayer block |
| isha | العشاء | Night prayer block |
| night | الليل | Late night period (after Isha until Fajr) |

Stored as JSONB array in `himam_registrations.time_slots`. Used for partner matching (at least one overlapping slot required).

## Concurrency Handling

The `mark_juz_complete` RPC uses the UNIQUE constraint on `(registration_id, juz_number)` and checks `status = 'pending'` before updating. If two partners mark the same juz simultaneously:
- First write succeeds (status → 'completed')
- Second write finds status != 'pending' and returns the already-completed state (no-op)
- No error raised — idempotent by design

## Event Cancellation Cascade

When a supervisor cancels an upcoming event:
1. `himam_events.status` → 'cancelled'
2. All `himam_registrations` for that event → status = 'cancelled', regardless of current status
3. Associated `himam_progress` rows are preserved (for audit) but no longer actionable

## Relationships

```
programs (1) ──── (N) himam_events
himam_events (1) ──── (N) himam_registrations
himam_registrations (1) ──── (N) himam_progress
profiles (1) ──── (N) himam_registrations (as student_id)
profiles (1) ──── (N) himam_registrations (as partner_id)
profiles (1) ──── (N) himam_progress (as completed_by)
```
