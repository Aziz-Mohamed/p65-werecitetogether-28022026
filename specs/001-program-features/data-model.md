# Data Model: Program-Specific Features

**Date**: 2026-03-01
**Feature**: 001-program-features
**Extends**: 19 existing tables from 001-platform-core

## New Tables (8)

### 1. certifications

Stores certification lifecycle from recommendation to issuance.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| student_id | UUID | FK → profiles(id) ON DELETE CASCADE, NOT NULL | |
| program_id | UUID | FK → programs(id) ON DELETE CASCADE, NOT NULL | Program-scoped |
| track_id | UUID | FK → program_tracks(id) ON DELETE SET NULL | Nullable for program-level certs |
| enrollment_id | UUID | FK → enrollments(id) ON DELETE SET NULL | Links to specific enrollment |
| type | TEXT | NOT NULL, CHECK (type IN ('ijazah', 'graduation', 'completion', 'participation')) | |
| status | TEXT | NOT NULL DEFAULT 'recommended', CHECK (status IN ('recommended', 'supervisor_approved', 'issued', 'rejected', 'revoked')) | |
| title | TEXT | NOT NULL | e.g., "إجازة في رواية حفص عن عاصم" |
| title_ar | TEXT | NOT NULL | Arabic title |
| description | TEXT | | Optional notes |
| certificate_number | TEXT | UNIQUE | Auto-generated: WRT-YYYY-NNNNN |
| teacher_id | UUID | FK → profiles(id) ON DELETE SET NULL, NOT NULL | Teacher who taught |
| recommended_by | UUID | FK → profiles(id) ON DELETE SET NULL | Teacher who recommended |
| supervisor_id | UUID | FK → profiles(id) ON DELETE SET NULL | Supervisor who reviewed |
| issued_by | UUID | FK → profiles(id) ON DELETE SET NULL | Program admin who issued |
| chain_of_narration | TEXT | | سند — free text, for Qiraat Ijazahs |
| rejection_reason | TEXT | | Mandatory when status = 'rejected' |
| revocation_reason | TEXT | | Mandatory when status = 'revoked' |
| revoked_by | UUID | FK → profiles(id) ON DELETE SET NULL | |
| issue_date | DATE | | Set when status changes to 'issued' |
| metadata | JSONB | DEFAULT '{}' | Riwayah name, matn name, etc. |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(student_id, program_id)`, `(status)`, `(certificate_number)`
**Constraints**: `CHECK (status != 'rejected' OR rejection_reason IS NOT NULL)`, `CHECK (status != 'revoked' OR revocation_reason IS NOT NULL)`
**Trigger**: `updated_at` auto-update, certificate_number generation on INSERT when status = 'issued'

**State machine**:
```
recommended → supervisor_approved → issued
recommended → rejected (by supervisor)
supervisor_approved → rejected (by program admin)
supervisor_approved → issued
issued → revoked
```

### 2. himam_events

Weekly marathon events.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| program_id | UUID | FK → programs(id) ON DELETE CASCADE, NOT NULL | Program-scoped |
| event_date | DATE | NOT NULL | Must be a Saturday |
| start_time | TIME | NOT NULL DEFAULT '05:00' | Fajr |
| end_time | TIME | NOT NULL DEFAULT '05:00' | Next day Fajr (24h window) |
| status | TEXT | NOT NULL DEFAULT 'upcoming', CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) | |
| timezone | TEXT | NOT NULL | From program's organization timezone; falls back to 'Asia/Riyadh' if unset |
| created_by | UUID | FK → profiles(id) ON DELETE SET NULL | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(program_id, event_date)`, `(status)`
**Constraint**: CHECK `EXTRACT(DOW FROM event_date) = 6` (Saturday)

### 3. himam_registrations

Student enrollment in a specific event and track.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| event_id | UUID | FK → himam_events(id) ON DELETE CASCADE, NOT NULL | |
| student_id | UUID | FK → profiles(id) ON DELETE CASCADE, NOT NULL | |
| track | TEXT | NOT NULL, CHECK (track IN ('3_juz', '5_juz', '10_juz', '15_juz', '30_juz')) | |
| partner_id | UUID | FK → profiles(id) ON DELETE SET NULL | Paired partner |
| status | TEXT | NOT NULL DEFAULT 'registered', CHECK (status IN ('registered', 'paired', 'in_progress', 'completed', 'incomplete', 'cancelled')) | |
| time_slots | JSONB | DEFAULT '[]' | Selected prayer-time blocks |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(event_id, student_id)`, `(event_id, track, status)`
**Constraint**: UNIQUE `(event_id, student_id)` — one track per event per student

**State machine**:
```
registered → paired (after partner matching)
paired → in_progress (when event starts)
in_progress → completed (all Juz' done)
in_progress → incomplete (event window closes)
registered/paired → cancelled (student cancels)
```

### 4. himam_progress

Per-Juz' completion tracking within a registration.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| registration_id | UUID | FK → himam_registrations(id) ON DELETE CASCADE, NOT NULL | |
| juz_number | INT | NOT NULL, CHECK (juz_number BETWEEN 1 AND 30) | |
| status | TEXT | NOT NULL DEFAULT 'pending', CHECK (status IN ('pending', 'completed', 'partner_absent')) | |
| completed_at | TIMESTAMPTZ | | |
| logged_by | UUID | FK → profiles(id) ON DELETE SET NULL | Which partner logged it |
| notes | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(registration_id)`
**Constraint**: UNIQUE `(registration_id, juz_number)`

### 5. curriculum_progress

Shared progress tracking for Mutoon, Qiraat, and Arabic Language programs.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| enrollment_id | UUID | FK → enrollments(id) ON DELETE CASCADE, NOT NULL | |
| student_id | UUID | FK → profiles(id) ON DELETE CASCADE, NOT NULL | Denormalized for query perf |
| program_id | UUID | FK → programs(id) ON DELETE CASCADE, NOT NULL | Program-scoped |
| progress_type | TEXT | NOT NULL, CHECK (progress_type IN ('mutoon', 'qiraat', 'arabic')) | |
| section_number | INT | NOT NULL | Verse/line number (mutoon), Juz' number (qiraat), recitation number (arabic) |
| section_title | TEXT | | From curriculum metadata |
| status | TEXT | NOT NULL DEFAULT 'not_started', CHECK (status IN ('not_started', 'in_progress', 'memorized', 'certified', 'passed', 'failed')) | |
| score | NUMERIC(5,2) | | 0-5 for mutoon, NULL for qiraat (pass/fail), 0-100 for arabic |
| teacher_notes | TEXT | | |
| reviewed_by | UUID | FK → profiles(id) ON DELETE SET NULL | Teacher who last reviewed |
| last_reviewed_at | TIMESTAMPTZ | | |
| completed_at | TIMESTAMPTZ | | Set when status changes to a completion state; tracks actual completion order for non-linear sign-off |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(enrollment_id, section_number)`, `(student_id, program_id)`, `(progress_type, status)`
**Constraint**: UNIQUE `(enrollment_id, section_number)`
**Trigger**: `updated_at` auto-update

### 6. student_guardians

Parent/guardian information linked to children's student profiles.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| student_id | UUID | FK → profiles(id) ON DELETE CASCADE, NOT NULL | |
| guardian_name | TEXT | NOT NULL | |
| guardian_phone | TEXT | | |
| guardian_email | TEXT | | |
| relationship | TEXT | NOT NULL DEFAULT 'parent', CHECK (relationship IN ('parent', 'guardian', 'grandparent', 'sibling', 'other')) | |
| is_primary | BOOLEAN | NOT NULL DEFAULT false | Primary contact |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(student_id)`
**Constraint**: `CHECK (guardian_phone IS NOT NULL OR guardian_email IS NOT NULL)`

### 7. guardian_notification_preferences

Per-guardian notification category preferences. Controls which notifications fire on the child's shared device.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| guardian_id | UUID | FK → student_guardians(id) ON DELETE CASCADE, NOT NULL | |
| category | TEXT | NOT NULL | Notification category name |
| enabled | BOOLEAN | NOT NULL DEFAULT true | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Constraint**: UNIQUE `(guardian_id, category)`

### 8. peer_pairings

Student-to-student peer recitation matches.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, DEFAULT gen_random_uuid() | |
| program_id | UUID | FK → programs(id) ON DELETE CASCADE, NOT NULL | Program-scoped |
| section_type | TEXT | NOT NULL, CHECK (section_type IN ('quran', 'mutoon')) | Program 1 Section 2 subsection |
| student_a_id | UUID | FK → profiles(id) ON DELETE CASCADE, NOT NULL | Requester |
| student_b_id | UUID | FK → profiles(id) ON DELETE CASCADE, NOT NULL | Acceptor |
| status | TEXT | NOT NULL DEFAULT 'pending', CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) | |
| session_count | INT | NOT NULL DEFAULT 0 | Incremented on each logged session |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Indexes**: `(program_id, status)`, `(student_a_id)`, `(student_b_id)`

## Modified Tables (0)

## Modified Tables (1)

### profiles (ALTER)

| Column | Type | Change | Notes |
|--------|------|--------|-------|
| peer_available | BOOLEAN | ADD, NOT NULL DEFAULT false | Opt-in toggle for peer recitation availability (FR-039) |

All other new features build on top of existing `profiles`, `programs`, `program_tracks`, and `enrollments` tables via foreign keys only.

## New Database Functions

### get_certification_eligibility(p_enrollment_id UUID)

Returns whether a student's curriculum progress is complete enough for certification.
- For mutoon: all sections in 'memorized' or 'certified' status
- For qiraat: all 30 Juz' in 'passed' status
- For arabic: all recitations with score >= passing threshold

### generate_certificate_number()

Trigger function that generates `WRT-YYYY-NNNNN` certificate numbers on INSERT when status is 'issued'. Uses `cert_number_seq` sequence.

## RLS Policies Summary

| Table | Student | Teacher | Supervisor | Program Admin | Master Admin |
|-------|---------|---------|------------|---------------|--------------|
| certifications | Read own (status IN issued, revoked) | Read/recommend own students | Read/approve in program | Full CRUD in program | Full read |
| himam_events | Read all | Read all | Read in program | Full CRUD in program | Full read |
| himam_registrations | Own CRUD | Read in program | Read in program | Full CRUD in program | Full read |
| himam_progress | Own read + log | Read in program | Read in program | Read in program | Full read |
| curriculum_progress | Read own | Read/update own students | Read in program | Read in program | Full read |
| student_guardians | Own CRUD | Read own students | Read in program | Read in program | Full read |
| guardian_notification_preferences | Own CRUD | None | None | None | Full read |
| peer_pairings | Own CRUD | None | None | Read in program | Full read |

## Entity Relationships

```
profiles ──< certifications (student_id, teacher_id, recommended_by, supervisor_id, issued_by)
programs ──< certifications (program_id)
enrollments ──< certifications (enrollment_id)

programs ──< himam_events (program_id)
himam_events ──< himam_registrations (event_id)
profiles ──< himam_registrations (student_id, partner_id)
himam_registrations ──< himam_progress (registration_id)

enrollments ──< curriculum_progress (enrollment_id)
profiles ──< curriculum_progress (student_id, reviewed_by)
programs ──< curriculum_progress (program_id)

profiles ──< student_guardians (student_id)
student_guardians ──< guardian_notification_preferences (guardian_id)

programs ──< peer_pairings (program_id)
profiles ──< peer_pairings (student_a_id, student_b_id)
```
