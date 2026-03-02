# API Contract: Himam Events

**Service file**: `src/features/himam/services/himam.service.ts`
**Pattern**: Supabase SDK direct queries, ServiceResult<T> return type

## Queries

### getUpcomingEvents(programId: string)
- **Table**: `himam_events`
- **Filter**: `program_id = programId`, `status IN ('upcoming', 'active')`
- **Order**: `event_date ASC`
- **Used by**: Student Himam event list, program admin event management

### getEventById(eventId: string)
- **Table**: `himam_events`
- **Select**: Full row
- **Used by**: Event detail screen

### getRegistration(eventId: string, studentId: string)
- **Table**: `himam_registrations`
- **Filter**: `event_id = eventId`, `student_id = studentId`
- **Select**: `*, partner:profiles!himam_registrations_partner_id_fkey(full_name, display_name, avatar_url, meeting_link)`
- **Used by**: Student event detail (shows their registration + partner)

### getEventRegistrations(eventId: string, track?: string)
- **Table**: `himam_registrations`
- **Filter**: `event_id = eventId`, optional `track` filter
- **Select**: `*, student:profiles!himam_registrations_student_id_fkey(full_name, display_name), partner:profiles!himam_registrations_partner_id_fkey(full_name, display_name)`
- **Order**: `created_at ASC`
- **Used by**: Program admin registrations view, pairing screen

### getProgress(registrationId: string)
- **Table**: `himam_progress`
- **Filter**: `registration_id = registrationId`
- **Order**: `juz_number ASC`
- **Used by**: Student progress grid

## Mutations

### createEvent(input: CreateEventInput)
- **Table**: `himam_events`
- **Operation**: INSERT
- **Fields**: `program_id, event_date, start_time, end_time, timezone, status: 'upcoming', created_by`
- **Validation**: `event_date` must be a Saturday
- **Used by**: Program admin event creation

### registerForEvent(eventId: string, studentId: string, track: string)
- **Table**: `himam_registrations`
- **Operation**: INSERT
- **Fields**: `event_id, student_id, track, status: 'registered'`
- **Side effect**: Create `himam_progress` rows for each Juz' in the track (e.g., 3 rows for '3_juz')
- **Used by**: Student event registration

### updateTimeSlots(registrationId: string, timeSlots: TimeSlot[])
- **Table**: `himam_registrations`
- **Operation**: UPDATE
- **Fields**: `time_slots = timeSlots`
- **Used by**: Partner time slot selection

### logBlockCompletion(registrationId: string, juzNumber: number, loggedBy: string, status: 'completed' | 'partner_absent', notes?: string)
- **Table**: `himam_progress`
- **Operation**: UPDATE
- **Filter**: `registration_id = registrationId`, `juz_number = juzNumber`
- **Fields**: `status → status, completed_at = now() (if completed), logged_by, notes`
- **Side effect**: If status is 'completed', check if all Juz' completed → update registration status to 'completed'. Blocks logged as 'partner_absent' do NOT count toward track completion.
- **Used by**: Partner block completion logging

### cancelRegistration(registrationId: string)
- **Table**: `himam_registrations`
- **Operation**: UPDATE
- **Fields**: `status → 'cancelled'`
- **Side effect**: If paired, set partner's `partner_id = NULL`, revert partner status to 'registered', and notify partner
- **Used by**: Student cancellation

### cancelEvent(eventId: string)
- **Table**: `himam_events`
- **Operation**: UPDATE
- **Fields**: `status → 'cancelled'`
- **Side effect**: Bulk-update all non-completed registrations to `status → 'cancelled'`. Notify all affected participants.
- **Used by**: Program admin event cancellation

## Edge Function: himam-partner-matching

- **Path**: `/functions/v1/himam-partner-matching`
- **Method**: POST
- **Auth**: Service role (admin-only invocation)
- **Body**: `{ event_id: string }`
- **Logic**: All operations execute in a single transaction. Query unmatched registrations → pair by track (FIFO) → update partner_id on both → set status → 'paired' → send notifications. Odd-number registrants in a track remain at 'registered' status and are eligible for re-pairing in subsequent runs.
- **Response**: `{ paired: number, unmatched: number }`

## Edge Function: himam-event-lifecycle (Scheduled)

- **Path**: `/functions/v1/himam-event-lifecycle`
- **Method**: POST
- **Auth**: Service role (scheduled invocation via pg_cron or Supabase cron)
- **Schedule**: Hourly
- **Logic**:
  1. Query events where `status = 'upcoming'` and `event_date + start_time <= now()` → update `status → 'active'`, and transition all 'paired' registrations for that event to `status → 'in_progress'`
  2. Query events where `status = 'active'` and `event_date + end_time + 24h <= now()` → update `status → 'completed'`, mark all non-completed registrations as `status → 'incomplete'`
  3. Query events where `status = 'upcoming'` and `event_date - interval '24 hours' <= now()` and reminder not yet sent → send event reminder notifications to all registered participants (FR-021)
- **Response**: `{ activated: number, completed: number, reminders_sent: number }`
