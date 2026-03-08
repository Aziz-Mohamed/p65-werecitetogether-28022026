# API Contracts: Himam Quranic Marathon Events

**Feature**: 009-himam | **Date**: 2026-03-06

## RPC Functions

### register_for_himam_event

**Purpose**: Register a student for a Himam event with track, juz selection, and time slots.

**Signature**: `register_for_himam_event(p_event_id uuid, p_track text, p_selected_juz int[], p_time_slots jsonb) → jsonb`

**Auth**: Authenticated student enrolled in Himam program.

**Validation**:
- Event exists and status = 'upcoming'
- Current time < event.registration_deadline
- Student not already registered for this event (UNIQUE constraint)
- Track is valid ('3_juz', '5_juz', '10_juz', '15_juz', '30_juz')
- `p_selected_juz` array length matches track requirement
- All juz values between 1 and 30, no duplicates
- `p_time_slots` contains valid prayer-time labels

**Success Response**:
```json
{
  "registration_id": "uuid",
  "event_date": "2026-03-07",
  "track": "5_juz",
  "selected_juz": [1, 2, 3, 4, 5],
  "time_slots": ["fajr", "dhuhr", "asr"],
  "status": "registered"
}
```

**Errors**:
- `HIMAM_EVENT_NOT_FOUND`: Event does not exist
- `HIMAM_REGISTRATION_CLOSED`: Past registration deadline
- `HIMAM_ALREADY_REGISTERED`: Student already registered for this event
- `HIMAM_INVALID_TRACK`: Invalid track value
- `HIMAM_INVALID_JUZ_COUNT`: Juz count doesn't match track
- `HIMAM_INVALID_JUZ_RANGE`: Juz values out of 1-30 range or duplicates
- `HIMAM_NOT_ENROLLED`: Student not enrolled in Himam program

**Side effects**: Creates `himam_progress` rows (one per selected juz) with status "pending".

---

### cancel_himam_registration

**Purpose**: Cancel a student's registration before the deadline.

**Signature**: `cancel_himam_registration(p_registration_id uuid) → void`

**Auth**: Registration owner (student_id = auth.uid()).

**Validation**:
- Registration exists and belongs to caller
- Registration status = 'registered' (not yet paired)
- Current time < event.registration_deadline

**Errors**:
- `HIMAM_REG_NOT_FOUND`: Registration not found
- `HIMAM_ALREADY_PAIRED`: Cannot cancel after pairing
- `HIMAM_DEADLINE_PASSED`: Past registration deadline

**Side effects**: Deletes associated `himam_progress` rows. Sets registration status to 'cancelled'.

---

### mark_juz_complete

**Purpose**: Mark a juz as completed for both partners.

**Signature**: `mark_juz_complete(p_registration_id uuid, p_juz_number int) → jsonb`

**Auth**: Registration owner OR their partner.

**Validation**:
- Registration exists
- Caller is student_id or partner_id on the registration
- Registration status = 'in_progress'
- Juz number exists in the registration's selected_juz
- Progress record for this juz exists and status = 'pending'

**Success Response**:
```json
{
  "completed_count": 3,
  "total_count": 5,
  "all_complete": false,
  "registration_status": "in_progress"
}
```

**Logic**:
1. Update progress row for caller's registration: status → 'completed', completed_at → now(), completed_by → auth.uid()
2. Find partner's registration (via partner_id)
3. Update partner's matching progress row identically
4. Count completed vs total for caller's registration
5. If all complete → update registration status to 'completed' for both partners
6. Return completion stats

**Errors**:
- `HIMAM_REG_NOT_FOUND`: Registration not found
- `HIMAM_NOT_PARTICIPANT`: Caller is not student or partner
- `HIMAM_EVENT_NOT_ACTIVE`: Event is not in "active" status
- `HIMAM_JUZ_NOT_IN_SELECTION`: Juz number not in selected_juz
- `HIMAM_JUZ_ALREADY_COMPLETE`: Juz already marked as completed (not a true error — returns current completion state, idempotent)

---

### generate_himam_pairings

**Purpose**: Run the pairing algorithm for an event. Supervisor-triggered or cron-invoked.

**Signature**: `generate_himam_pairings(p_event_id uuid) → jsonb`

**Auth**: Supervisor or program_admin for Himam program, OR service role (when invoked by Edge Function).

**Logic**:
1. Fetch all registrations with status = 'registered', grouped by track
2. Within each track, sort by time slot overlap potential
3. Pair adjacent students: set partner_id on both, status → 'paired'
4. Flag unpaired students (odd counts)

**Success Response**:
```json
{
  "pairs_created": 15,
  "unpaired_students": 1,
  "tracks": {
    "3_juz": { "pairs": 4, "unpaired": 0 },
    "5_juz": { "pairs": 6, "unpaired": 1 },
    "10_juz": { "pairs": 3, "unpaired": 0 },
    "15_juz": { "pairs": 2, "unpaired": 0 },
    "30_juz": { "pairs": 0, "unpaired": 0 }
  }
}
```

**Errors**:
- `HIMAM_EVENT_NOT_FOUND`: Event does not exist
- `HIMAM_UNAUTHORIZED`: Caller lacks supervisor/program_admin role

---

### swap_himam_partners

**Purpose**: Supervisor manually swaps two students' pairings.

**Signature**: `swap_himam_partners(p_registration_id_a uuid, p_registration_id_b uuid) → void`

**Auth**: Supervisor or program_admin for Himam program.

**Validation**:
- Both registrations exist, same event, same track
- Both are in 'paired' or 'registered' status (or one is unpaired)
- Event status = 'upcoming' (swaps NOT allowed after event activation)

**Logic**: Swap the `partner_id` values between the two students' registrations (and their respective original partners).

**Errors**:
- `HIMAM_REG_NOT_FOUND`: Registration not found
- `HIMAM_DIFFERENT_EVENTS`: Registrations are for different events
- `HIMAM_EVENT_NOT_UPCOMING`: Event is active or completed, swaps not allowed
- `HIMAM_UNAUTHORIZED`: Caller lacks role

---

### create_himam_event

**Purpose**: Supervisor manually creates an event for a specific Saturday.

**Signature**: `create_himam_event(p_event_date date) → jsonb`

**Auth**: Supervisor or program_admin for Himam program.

**Validation**:
- Caller has supervisor or program_admin role for the Himam program
- `p_event_date` is a Saturday (EXTRACT(DOW FROM p_event_date) = 6)
- No event already exists for this date (UNIQUE constraint)

**Logic**:
1. Find the Himam program ID from `programs` table
2. Calculate registration_deadline as `p_event_date - interval '1 day'` at midnight Makkah time (Friday 21:00 UTC)
3. Insert event with start_time = '05:00', end_time = '05:00', status = 'upcoming', created_by = auth.uid()
4. Return event summary

**Success Response**:
```json
{
  "event_id": "uuid",
  "event_date": "2026-03-14",
  "registration_deadline": "2026-03-13T21:00:00Z",
  "status": "upcoming"
}
```

**Errors**:
- `HIMAM_UNAUTHORIZED`: Caller lacks supervisor/program_admin role
- `HIMAM_INVALID_DATE`: Event date is not a Saturday
- `HIMAM_EVENT_EXISTS`: An event already exists for this date

---

### cancel_himam_event

**Purpose**: Supervisor cancels an upcoming event, cascading cancellation to all registrations.

**Signature**: `cancel_himam_event(p_event_id uuid) → void`

**Auth**: Supervisor or program_admin for Himam program.

**Validation**:
- Event exists and status = 'upcoming'
- Caller has supervisor or program_admin role for the Himam program

**Logic**:
1. Set event status → 'cancelled'
2. Update ALL registrations for this event → status = 'cancelled'
3. Send notification to all affected students (category: himam_event_cancelled)

**Errors**:
- `HIMAM_EVENT_NOT_FOUND`: Event does not exist
- `HIMAM_EVENT_NOT_UPCOMING`: Event is already active or completed
- `HIMAM_UNAUTHORIZED`: Caller lacks role

---

### get_himam_event_stats

**Purpose**: Get completion statistics for a completed event.

**Signature**: `get_himam_event_stats(p_event_id uuid) → jsonb`

**Auth**: Supervisor, program_admin, or master_admin.

**Success Response**:
```json
{
  "event_date": "2026-03-07",
  "total_registrations": 30,
  "total_paired": 28,
  "completed": 22,
  "incomplete": 6,
  "cancelled": 2,
  "tracks": {
    "3_juz": { "registered": 8, "completed": 6, "incomplete": 2 },
    "5_juz": { "registered": 12, "completed": 10, "incomplete": 2 }
  }
}
```

---

## Edge Functions

### generate-himam-events

**Purpose**: Auto-generate the next Saturday's event if none exists. Invoked by pg_cron weekly.

**Trigger**: pg_cron `net.http_post()` every Friday midnight (Saturday 00:00:00 Makkah time = Friday 21:00 UTC).

**Logic**:
1. Find the Himam program ID from `programs` table
2. Calculate next Saturday's date
3. Check if event already exists for that date
4. If not, insert new event with:
   - event_date = next Saturday
   - start_time = '05:00'
   - end_time = '05:00' (next day)
   - registration_deadline = Saturday 00:00:00 Makkah time (end of Friday)
   - status = 'upcoming'
5. Return `{ created: true/false, event_id, event_date }`

**Auth**: Service role key (from cron context).

---

### generate-himam-pairings

**Purpose**: Batch partner pairing for an event. Can be invoked by pg_cron (automated) or by supervisor via RPC.

**Trigger**: pg_cron after registration deadline, OR supervisor button.

**Logic**:
1. Fetch all `registered` status registrations for the event, grouped by track
2. Within each track:
   a. Parse `time_slots` JSONB for each registration
   b. Build compatibility matrix based on overlapping slots
   c. Sort by number of overlapping slots (greedy matching)
   d. Pair adjacent students, update both with partner_id, status → 'paired'
3. For each pair created, invoke `send-notification` with category `himam_partner_assigned`
4. Return pairing summary stats

**Auth**: Service role key (from cron) or supervisor role (checked in calling RPC).

**Response**:
```json
{
  "success": true,
  "pairs_created": 15,
  "unpaired_students": ["uuid1"],
  "notifications_sent": 30
}
```

---

## Direct Queries (via Service Layer)

### getUpcomingEvent(programId)

```sql
SELECT * FROM himam_events
WHERE program_id = $1 AND status = 'upcoming'
ORDER BY event_date ASC LIMIT 1
```

### getEvents(programId)

```sql
SELECT * FROM himam_events
WHERE program_id = $1
ORDER BY event_date DESC
```

Note: Returns all events (all statuses) for supervisor event list screen.

### getMyRegistration(eventId, studentId)

```sql
SELECT hr.*,
  student:profiles!himam_registrations_student_id_fkey(id, full_name, avatar_url, meeting_link),
  partner:profiles!himam_registrations_partner_id_fkey(id, full_name, avatar_url, meeting_link)
FROM himam_registrations hr
WHERE hr.event_id = $1 AND (hr.student_id = $2 OR hr.partner_id = $2)
LIMIT 1
```

Note: Both student and partner meeting_links are returned so the UI can display both links.

### getProgressForRegistration(registrationId)

```sql
SELECT * FROM himam_progress
WHERE registration_id = $1
ORDER BY juz_number ASC
```

### getStudentHistory(studentId)

```sql
SELECT hr.*, he.event_date, he.status as event_status,
  partner:profiles!himam_registrations_partner_id_fkey(id, full_name)
FROM himam_registrations hr
JOIN himam_events he ON hr.event_id = he.id
WHERE hr.student_id = $1
ORDER BY he.event_date DESC
```

### getEventRegistrations(eventId)

```sql
SELECT hr.*,
  student:profiles!himam_registrations_student_id_fkey(id, full_name, avatar_url),
  partner:profiles!himam_registrations_partner_id_fkey(id, full_name)
FROM himam_registrations hr
WHERE hr.event_id = $1
ORDER BY hr.track, hr.created_at
```
