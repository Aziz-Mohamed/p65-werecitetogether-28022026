# Quickstart: Himam Quranic Marathon Events

**Feature**: 009-himam | **Date**: 2026-03-06

## Prerequisites

- Himam program exists in `programs` table (seeded by 003-programs-enrollment)
- Student enrolled in Himam program (via `enrollments` table)
- `profiles.meeting_link` column exists (from 004-teacher-availability)
- Push notification infrastructure active (from 004-push-notifications)
- Migration 00011_himam.sql applied

## Integration Scenarios

### Scenario 1: Student Registers for Weekly Event

**Precondition**: Upcoming event exists with status = 'upcoming', student is enrolled in Himam.

1. Student opens Himam screen → `useUpcomingEvent(programId)` fetches next event
2. Student taps "Register" → registration form shows TrackSelector + JuzPicker + TimeSlotSelector
3. Student selects track (e.g., '5_juz'), picks 5 specific juz, selects time slots ["fajr", "dhuhr"]
4. Submit → `useRegisterForEvent` calls `register_for_himam_event` RPC
5. RPC validates juz count matches track, creates registration + progress rows
6. UI shows confirmation with registration details

**Verify**:
- `himam_registrations` row created with status 'registered'
- `himam_progress` has 5 rows (one per juz) with status 'pending'
- Student sees registration details on Himam screen

### Scenario 2: Partner Pairing Runs

**Precondition**: Registration deadline passed, multiple students registered per track.

1. pg_cron triggers `generate-himam-pairings` Edge Function (or supervisor taps "Run Pairing")
2. Edge Function groups registrations by track
3. Pairs students with overlapping time slots
4. Updates both registrations: partner_id set, status → 'paired'
5. Sends `himam_partner_assigned` notification to both partners

**Verify**:
- Both registrations have `partner_id` set and status = 'paired'
- Both students receive push notification
- Student sees partner info (name, meeting link) on Himam screen

### Scenario 3: Marathon Day Progress Tracking

**Precondition**: Event is 'active' (Saturday), student is 'in_progress', partner is paired.

1. Student opens progress screen → `useHimamProgress(registrationId)` fetches juz list
2. Student sees juz list with pending/completed status and progress bar
3. Student taps "Mark Complete" on Juz 3 → `useMarkJuzComplete` calls `mark_juz_complete` RPC
4. RPC updates progress for BOTH partners' registrations
5. UI refreshes showing Juz 3 as completed, progress bar advances
6. Partner's screen also shows Juz 3 as completed (via query invalidation or realtime)

**Verify**:
- `himam_progress` rows for juz 3 updated to 'completed' for BOTH registrations
- Progress count increments for both partners
- When all juz completed → registration status auto-transitions to 'completed'

### Scenario 4: Event Window Closes

**Precondition**: Sunday Fajr (05:00 Makkah), event is 'active'.

1. pg_cron job fires at Sunday 02:00 UTC (= 05:00 Makkah)
2. Updates event status → 'completed'
3. All registrations still 'in_progress' → status set to 'incomplete'
4. Registrations already 'completed' are unchanged

**Verify**:
- Event status = 'completed'
- Incomplete registrations have status = 'incomplete'
- Completed registrations unchanged
- Student history shows accurate final states

### Scenario 5: Supervisor Manages Event

**Precondition**: Supervisor has role for Himam program.

1. Supervisor opens Himam management → `useUpcomingEvent` + past events list
2. Taps event → sees registrations grouped by track via `useEventRegistrations(eventId)`
3. Taps "Run Pairing" → `useRunPairing` calls `generate_himam_pairings` RPC
4. Reviews pairings, optionally swaps two students via `swap_himam_partners`
5. After event completes, views stats via `useEventStats(eventId)`

**Verify**:
- Supervisor sees all tracks with registration counts
- Pairing results show pairs created + unpaired count
- Post-event stats show completion rates per track

### Scenario 6: Student Cancels Registration

**Precondition**: Student registered, status = 'registered', before deadline.

1. Student opens Himam screen, sees registration
2. Taps "Cancel Registration" → confirmation dialog
3. Confirms → `useCancelRegistration` calls `cancel_himam_registration` RPC
4. Registration status → 'cancelled', progress rows deleted

**Verify**:
- Registration status = 'cancelled'
- No `himam_progress` rows remain for this registration
- Student can re-register if before deadline

## Bilingual Testing

All screens must be tested in both English and Arabic:
- Event dates formatted per locale
- Track names: "3 Juz" / "3 أجزاء"
- Prayer-time labels: "Fajr" / "الفجر"
- Status badges: "Paired" / "تم الإقران"
- Progress: "3/5 completed" / "3/5 مكتمل"
