# Research: Himam Quranic Marathon Events

**Feature**: 009-himam | **Date**: 2026-03-06

## R1: pg_cron Patterns for Weekly Event Generation

**Decision**: Use pg_cron for three scheduled jobs: event auto-generation, event window transitions, and registration deadline reminders.

**Rationale**: The codebase already uses pg_cron extensively (00006 for availability expiry, 00008 for queue processing/cleanup). pg_cron is reliable for periodic tasks within Supabase. For complex batch operations (pairing), pg_cron invokes Edge Functions via `net.http_post()`.

**Cron schedules (all times Makkah UTC+3 = UTC hours adjusted)**:
- **Event generation**: `0 21 * * THU` (Friday midnight Makkah = Thursday 21:00 UTC) — creates next Saturday's event if none exists, one full day before registration closes
- **Registration close + pairing trigger**: `0 21 * * FRI` (Saturday 00:00:00 Makkah = Friday 21:00 UTC) — triggers pairing Edge Function for the upcoming event
- **Event activation**: `0 2 * * SAT` (Saturday Fajr 05:00 Makkah = Saturday 02:00 UTC) — transitions event to "active", registrations to "in_progress"
- **Event closure**: `0 2 * * SUN` (Sunday Fajr 05:00 Makkah = Sunday 02:00 UTC) — transitions event to "completed", incomplete registrations to "incomplete"
- **Reminder**: `0 14 * * FRI` (Friday 17:00 Makkah = Friday 14:00 UTC, ~12h before event) — invokes send-notification for all registered participants

**Alternatives considered**:
- Supabase scheduled Edge Functions: Not supported natively; pg_cron + `net.http_post()` achieves the same effect
- External cron service: Over-engineered; pg_cron is built into Supabase

## R2: Partner Pairing Algorithm

**Decision**: Simple random pairing within track, prioritizing overlapping time slots. Implemented as an Edge Function (`generate-himam-pairings`) invokable by pg_cron and supervisor RPC.

**Rationale**: The pairing needs are straightforward — pair students in the same track. Time slot compatibility is a secondary optimization. No need for complex matching algorithms at this scale (~50-200 participants, 5 tracks).

**Algorithm**:
1. Fetch all registrations for event with status "registered", grouped by track
2. Within each track, sort by number of overlapping time slots (descending) to maximize compatibility
3. Pair adjacent students (1-2, 3-4, 5-6, ...)
4. If odd count in a track, last student remains unpaired — flag for supervisor
5. Update paired registrations: set `partner_id` on both, status → "paired"
6. Send `himam_partner_assigned` notification to each pair

**Alternatives considered**:
- Graph-based optimal matching (Hungarian algorithm): Over-engineered for <100 students per track
- Pure SQL RPC: Too complex for the sorting/pairing logic; Edge Function is cleaner
- Manual-only pairing: High supervisor burden for weekly events

## R3: Progress Tracking — Shared Completion Model

**Decision**: Either partner can mark a juz as completed, which creates/updates a single `himam_progress` row. An RPC function handles the cross-registration update when one partner marks completion.

**Rationale**: Partners recite together synchronously on a call. Requiring both to confirm adds friction with no trust benefit. The RPC atomically updates both partners' progress records.

**Implementation**:
- `mark_juz_complete(p_registration_id, p_juz_number)` RPC
- Looks up the partner's registration via `partner_id`
- Inserts/updates progress rows for BOTH registrations in a single transaction
- After insert, checks if all juz for the track are complete → auto-transitions registration to "completed"
- Returns updated progress count and completion percentage

**Alternatives considered**:
- Both-confirm model: Higher friction, adds complexity for minimal benefit
- Independent tracking: Defeats the purpose of paired recitation

## R4: Juz Selection During Registration

**Decision**: Students select specific juz numbers during registration. The `himam_registrations.selected_juz` column stores an integer array (e.g., `{1, 2, 3, 4, 5}` for a 5-juz track). Progress rows are pre-created for each selected juz.

**Rationale**: Students recite juz they've already memorized, which varies per student. Pre-selecting allows partners to see what they'll recite together.

**Implementation**:
- Registration form includes a juz picker (1-30) with multi-select
- Validation: selected count must match track requirement (3, 5, 10, 15, or 30)
- On registration, `himam_progress` rows are pre-created with status "pending" for each selected juz
- Progress screen shows pre-created rows with toggle to mark complete

## R5: Event Status Lifecycle

**Decision**: Events follow a linear state machine: `upcoming` → `active` → `completed` (with optional `cancelled`).

**Rationale**: Events are time-bound weekly occurrences. The lifecycle is simple and predictable.

**State transitions**:
- `upcoming`: Created by auto-generation or supervisor. Registration open.
- `active`: Saturday Fajr (05:00 Makkah). Registration closed. Progress tracking enabled.
- `completed`: Sunday Fajr (05:00 Makkah). All registrations finalized.
- `cancelled`: Supervisor cancels before event starts. All registrations cancelled.

**Registration status transitions**:
- `registered` → `paired` (pairing runs)
- `paired` → `in_progress` (event activates at Fajr Saturday)
- `in_progress` → `completed` (all juz marked done)
- `in_progress` → `incomplete` (event window closes)
- `registered` → `cancelled` (student cancels before deadline)
- Any status → `cancelled` (event cancelled by supervisor)

## R6: Notification Integration

**Decision**: Add 2 new notification categories to the existing `send-notification` Edge Function: `himam_event_reminder` and `himam_partner_assigned`.

**Rationale**: Follows established pattern — add to `NotificationCategory` union type and `DIRECT_CATEGORIES` set. Reuse existing push token lookup and delivery infrastructure.

**Categories**:
- `himam_event_reminder`: Sent ~12h before event to all registered participants. Recipients: all students with `registered` or `paired` status for the event.
- `himam_partner_assigned`: Sent when pairing completes. Recipients: both students in each pair.

## R7: Timezone Handling

**Decision**: All Himam event times use Makkah time (UTC+3) as the fixed reference. Stored in DB as UTC, displayed to users with UTC+3 offset applied.

**Rationale**: The Himam program originates from a Makkah-centered community. Using a fixed timezone avoids complexity of per-user timezone handling for a communal event. The PRD explicitly asks for this.

**Implementation**:
- `himam_events.start_time` and `end_time` stored as `TIME` (05:00 = Fajr Makkah)
- pg_cron jobs scheduled in UTC (offset by -3 hours from Makkah time)
- Client displays times with "(Makkah time)" label
- No per-user timezone conversion needed
