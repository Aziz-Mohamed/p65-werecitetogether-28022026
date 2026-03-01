# Research: Session Join Flow

**Feature**: 005-session-join-flow
**Date**: 2026-03-02

## Executive Summary

Research confirms that **~80% of the infrastructure already exists**. The database schema, services, hooks, realtime subscriptions, queue processing, and notification delivery are all in place. The remaining work is primarily **screen composition, deep link routing, and a few missing behaviors** (draft session expiry, in-app banner for queue offers, post-session return detection).

## Decision Log

### D-001: Database Schema Changes Required

**Decision**: Minimal schema changes — only alter the `sessions.status` CHECK constraint to add `'expired'` and `'in_progress'` statuses.

**Rationale**: All tables exist (teacher_availability, sessions, session_attendance, free_program_queue, daily_session_count). The spec introduced two new session statuses during clarification (expired for 4-hour TTL, in_progress for teacher acknowledgment) that the current CHECK constraint (`'draft' | 'completed' | 'cancelled'`) doesn't include.

**Alternatives considered**:
- Adding new tables: Rejected — all needed tables exist
- Adding columns: Not needed — `meeting_link_used`, `started_at`, `completed_at`, `duration_minutes`, `notes` all already present on `sessions`

### D-002: Draft Session Auto-Expiry Mechanism

**Decision**: Use a database trigger + pg_cron extension OR a scheduled edge function to expire draft sessions older than 4 hours.

**Rationale**: The existing `sessions` table has `created_at` but no `expires_at`. Rather than adding a column, we can run a periodic check: `UPDATE sessions SET status = 'expired' WHERE status = 'draft' AND created_at < now() - interval '4 hours'`. This also decrements `teacher_availability.current_session_count`.

**Alternatives considered**:
- Client-side expiry: Rejected — unreliable, depends on app being open
- Adding expires_at column: Unnecessary overhead — created_at + configurable interval is sufficient
- Supabase cron (pg_cron): Preferred if available, otherwise use edge function called on a schedule

### D-003: Queue Single-Entry Enforcement

**Decision**: Add application-level logic to cancel existing queue entry before inserting new one. Database already has partial unique index `(student_id, program_id) WHERE status IN ('waiting', 'notified')`.

**Rationale**: The existing unique index prevents duplicate entries per program but not across programs. The `queueService.joinQueue()` method needs a pre-step: cancel any active entry for the student before inserting the new one.

**Alternatives considered**:
- Database trigger: Would work but adds complexity; app-level is simpler to test and debug
- Unique index across programs: Would prevent insertion but not clean up the old entry

### D-004: Deep Link Routing Strategy

**Decision**: Use Expo Router's built-in URL handling. The `werecitetogether://` scheme is configured in `app.json`. Create a route at `app/(student)/session-join.tsx` that reads `teacher` and `program` query params and renders the JoinSessionFlow.

**Rationale**: Expo Router v6 natively maps URL schemes to file routes. The URL `werecitetogether://session/join?teacher=X&program=Y` can be routed to a screen that handles the join flow. Auth guard already redirects unauthenticated users.

**Alternatives considered**:
- Manual Linking.addEventListener in root layout: Rejected — Expo Router handles this natively
- Separate deep link handler service: Unnecessary abstraction over Expo Router's built-in capability

### D-005: In-App Banner for Queue Offers

**Decision**: Use the existing `useNotificationHandler`'s `onForegroundNotification` callback to display an in-app banner when a queue offer arrives while the app is open.

**Rationale**: The notification handler already has a foreground listener that calls `onForegroundNotification`. We need to enhance this to show a prominent banner with countdown timer and "Claim Now" action for queue-related notifications.

**Alternatives considered**:
- Polling queue status: Rejected — wasteful, realtime subscription already exists
- Zustand store for active offers: Rejected — over-engineering; the notification handler + realtime subscription already covers this

### D-006: Post-Session Return Detection

**Decision**: Use React Native's `AppState` listener to detect when the app comes to the foreground. Check for active draft sessions and display the post-session prompt.

**Rationale**: When a student opens an external meeting link via `Linking.openURL()`, the app goes to background. When they return, `AppState` fires 'active'. We query for any draft sessions belonging to the student and show the post-session card.

**Alternatives considered**:
- Timer-based detection: Unreliable — session length varies
- Push notification from teacher: Only works if teacher logs first, which we can't guarantee
- Zustand flag set before opening link: Works but loses state on app kill; AppState + DB query is more robust

## Existing Infrastructure Inventory

### Database (All Exist)

| Table | Status | Realtime | Notes |
|-------|--------|----------|-------|
| teacher_availability | Exists | Yes | Needs no changes |
| sessions | Exists | Yes | Needs CHECK constraint update for 'expired', 'in_progress' |
| session_attendance | Exists | No | Needs no changes |
| free_program_queue | Exists | Yes | Needs no changes |
| daily_session_count | Exists | No | Needs no changes |
| profiles | Exists | No | Has meeting_link, meeting_platform |
| programs | Exists | No | Has settings JSONB with configurable limits |
| teacher_reviews | Exists | Yes | For post-session rating |
| teacher_rating_stats | Exists | No | Materialized aggregate table |

### Frontend (What Exists)

| Component/Hook | Status | Location |
|----------------|--------|----------|
| JoinSessionFlow (bottom sheet) | Exists | src/features/sessions/components/JoinSessionFlow.tsx |
| useCreateDraftSession | Exists | src/features/sessions/hooks/useCreateDraftSession.ts |
| AvailableTeacherCard | Exists | src/features/teacher-availability/components/AvailableTeacherCard.tsx |
| AvailableTeachersList | Exists | src/features/teacher-availability/components/AvailableTeachersList.tsx |
| NoTeachersAvailable | Exists | src/features/teacher-availability/components/NoTeachersAvailable.tsx |
| useAvailableTeachers | Exists | src/features/teacher-availability/hooks/useTeacherAvailability.ts |
| useTeacherAvailabilityRealtime | Exists | src/features/teacher-availability/hooks/useTeacherAvailabilityRealtime.ts |
| QueueStatus | Exists | src/features/queue/components/QueueStatus.tsx |
| QueueClaimPrompt | Exists | src/features/queue/components/QueueClaimPrompt.tsx |
| useJoinQueue / useLeaveQueue / useClaimQueueSlot | Exists | src/features/queue/hooks/useQueue.ts |
| useQueueRealtime | Exists | src/features/queue/hooks/useQueueRealtime.ts |
| queueService | Exists | src/features/queue/services/queue.service.ts |
| sessionsService | Exists | src/features/sessions/services/sessions.service.ts |
| teacherAvailabilityService | Exists | src/features/teacher-availability/services/teacher-availability.service.ts |
| useNotificationHandler | Exists | src/features/notifications/hooks/useNotificationHandler.ts |
| Realtime subscription profiles | Exists | src/features/realtime/config/subscription-profiles.ts |

### Edge Functions (What Exists)

| Function | Status | Notes |
|----------|--------|-------|
| queue-processor | Exists | Advances queue, sends push notification |
| send-notification | Exists | Central notification hub with i18n + categories |

### What Needs to Be Built

| Item | Type | Priority |
|------|------|----------|
| Available Teachers browsing screen | Screen | P1 |
| Daily session limit enforcement in join flow | Hook enhancement | P1 |
| Queue join screen (with auto-cancel existing entry) | Screen enhancement | P2 |
| Queue claim screen `/(student)/queue-claim` | Screen (new) | P2 |
| In-app banner for queue offers | Component | P2 |
| Deep link route `/(student)/session-join` | Screen (new) | P3 |
| Deep link auth guard + redirect | Hook enhancement | P3 |
| Post-session return prompt | Component + hook | P4 |
| Draft session auto-expiry | Migration + edge function | P4 |
| Sessions status CHECK constraint update | Migration | P1 |
| Queue single-entry enforcement | Service enhancement | P2 |
| Notify teachers when queue threshold reached | Edge function enhancement | P2 |
| i18n strings for all new screens | Translation | P1-P4 |
