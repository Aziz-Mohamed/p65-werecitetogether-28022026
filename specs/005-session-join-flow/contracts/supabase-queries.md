# API Contracts: Session Join Flow

**Feature**: 005-session-join-flow
**Date**: 2026-03-02

## Overview

This feature uses Supabase JS SDK for all data operations (no REST API layer). Contracts are defined as Supabase query patterns used by service files. Edge functions handle server-side queue processing and scheduled tasks.

---

## Client-Side Queries (Service Layer)

### 1. Get Available Teachers for Program

**Service**: `teacherAvailabilityService.getAvailableTeachers(programId)`
**Status**: EXISTS — no changes needed

```typescript
// Query pattern (already implemented)
supabase
  .from('teacher_availability')
  .select(`
    *,
    profile:profiles!teacher_id (
      id, full_name, display_name, avatar_url,
      meeting_link, meeting_platform, languages
    ),
    rating_stats:teacher_rating_stats!teacher_id (
      average_rating, total_reviews
    )
  `)
  .eq('program_id', programId)
  .eq('is_available', true)
```

**Returns**: `AvailableTeacher[]`

---

### 2. Create Draft Session

**Service**: `sessionsService.createDraftSession(input)`
**Status**: EXISTS — enhance to record meeting_link_used and increment daily count

```typescript
// Input
interface CreateDraftSessionInput {
  teacherId: string;
  programId: string;
  cohortId?: string;
  meetingLinkUsed?: string;  // Already supported
}

// Query pattern (already implemented)
supabase
  .from('sessions')
  .insert({
    teacher_id: input.teacherId,
    program_id: input.programId,
    cohort_id: input.cohortId,
    meeting_link_used: input.meetingLinkUsed,
    status: 'draft',
  })
  .select()
  .single()
```

**Enhancement needed**: After session creation, upsert daily_session_count:
```typescript
supabase
  .from('daily_session_count')
  .upsert({
    student_id: userId,
    program_id: input.programId,
    date: new Date().toISOString().split('T')[0],
    session_count: currentCount + 1,
  }, { onConflict: 'student_id,program_id,date' })
```

---

### 3. Check Daily Session Limit

**Service**: `queueService.getDailySessionCount(studentId, programId)`
**Status**: EXISTS — no changes needed

```typescript
supabase
  .from('daily_session_count')
  .select('session_count')
  .eq('student_id', studentId)
  .eq('program_id', programId)
  .eq('date', new Date().toISOString().split('T')[0])
  .maybeSingle()
```

**Returns**: `{ session_count: number } | null`

---

### 4. Join Queue (with single-entry enforcement)

**Service**: `queueService.joinQueue(studentId, programId)`
**Status**: EXISTS — enhance to cancel existing entries first

```typescript
// NEW: Cancel any existing active queue entry for this student
supabase
  .from('free_program_queue')
  .update({ status: 'cancelled' })
  .eq('student_id', studentId)
  .in('status', ['waiting', 'notified'])

// Then insert new entry (already implemented)
supabase
  .from('free_program_queue')
  .insert({
    student_id: studentId,
    program_id: programId,
    position: nextPosition,
    status: 'waiting',
  })
  .select()
  .single()
```

---

### 5. Leave Queue

**Service**: `queueService.leaveQueue(queueEntryId)`
**Status**: EXISTS — no changes needed

```typescript
supabase
  .from('free_program_queue')
  .update({ status: 'cancelled' })
  .eq('id', queueEntryId)
```

---

### 6. Claim Queue Slot

**Service**: `queueService.claimQueueSlot(queueEntryId)`
**Status**: EXISTS — no changes needed

```typescript
supabase
  .from('free_program_queue')
  .update({ status: 'claimed' })
  .eq('id', queueEntryId)
  .eq('status', 'notified')
  .select()
  .single()
```

---

### 7. Get Student's Active Draft Session

**Service**: `sessionsService.getActiveDraftSession(studentId)` — NEW

```typescript
supabase
  .from('sessions')
  .select(`
    *,
    teacher_profile:profiles!teacher_id (
      id, full_name, display_name, avatar_url,
      meeting_platform
    ),
    attendance:session_attendance!inner (student_id)
  `)
  .eq('session_attendance.student_id', studentId)
  .eq('status', 'draft')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
```

**Returns**: `SessionWithDetails | null`

---

### 8. Submit Teacher Review

**Service**: `reviewsService.submitReview(input)` — verify if EXISTS

```typescript
interface SubmitReviewInput {
  teacherId: string;
  studentId: string;
  sessionId: string;
  programId: string;
  rating: number;  // 1-5
  tags?: string[];
  comment?: string;
}

supabase
  .from('teacher_reviews')
  .insert(input)
  .select()
  .single()
```

---

## Edge Functions

### 9. Queue Processor

**Function**: `queue-processor`
**Status**: EXISTS — no changes needed
**Trigger**: Called when teacher toggles availability on

```typescript
// Input
{ program_id: string }

// Logic:
// 1. Find first queue entry with status='waiting' for program
// 2. Update to status='notified', set notified_at and expires_at (+3 min)
// 3. Send push notification via Expo Push API
// 4. Notification deep links to /(student)/queue-claim
```

---

### 10. Draft Session Expiry

**Function**: `expire-draft-sessions` — NEW edge function (or pg_cron)
**Trigger**: Scheduled (every 15 minutes)

```typescript
// Calls expire_draft_sessions() database function
// OR runs the equivalent SQL:
// UPDATE sessions SET status = 'expired'
//   WHERE status = 'draft'
//   AND created_at < now() - interval '4 hours';
// Then decrements teacher_availability.current_session_count
```

---

### 11. Notify Teachers (Queue Threshold)

**Enhancement to**: `queue-processor` OR new function
**Trigger**: When queue size reaches threshold

```typescript
// After advancing queue, check queue size
// If queue_size >= program.settings.queue_notify_teachers_threshold (default 5):
//   Find offline teachers for this program
//   Send notification: "X students are waiting — please come online"
//   Category: 'queue_threshold'
```

---

## Realtime Subscriptions

### Teacher Availability (EXISTS)
```typescript
// Channel: teacher-availability-{programId}
// Table: teacher_availability
// Event: * (INSERT, UPDATE, DELETE)
// Filter: program_id=eq.{programId}
// Invalidates: ['teacher-availability', programId]
// Debounce: 300ms
```

### Queue Status (EXISTS)
```typescript
// Channel: queue-{programId}
// Table: free_program_queue
// Event: * (INSERT, UPDATE, DELETE)
// Filter: program_id=eq.{programId}
// Invalidates: ['queue-position'], ['queue-size', programId]
// Debounce: 300ms
```

### Sessions (EXISTS — may need enhancement)
```typescript
// Channel: sessions-{programId}
// Table: sessions
// Event: UPDATE (for status changes)
// Filter: program_id=eq.{programId}
// Invalidates: ['sessions'], ['active-draft-session']
// Debounce: 300ms
```

---

## Deep Link Routes

### Session Join Deep Link
```
werecitetogether://session/join?teacher={teacherId}&program={programId}
```

**Expo Router mapping**: `app/(student)/session-join.tsx`
- Reads `teacher` and `program` from `useLocalSearchParams()`
- Fetches teacher details
- Renders JoinSessionFlow or error fallback
- Auth guard: redirects to login if unauthenticated, preserves deep link URL for post-login redirect

### Queue Claim Deep Link (from push notification)
```
/(student)/queue-claim?queueEntryId={id}&programId={id}
```

**Expo Router mapping**: `app/(student)/queue-claim.tsx`
- Reads `queueEntryId` and `programId` from params
- Shows QueueClaimPrompt with countdown
- On claim: calls `useClaimQueueSlot()` → routes to JoinSessionFlow
