# Queue RPC Contracts

**Feature**: 006-ratings-queue
**Date**: 2026-03-06

All contracts use Supabase RPC (`supabase.rpc()`). No REST endpoints — Supabase JS SDK direct.

## join_queue

**Purpose**: Student joins a program-specific queue when no teachers are available (FR-019, FR-026)

**Caller**: Student (authenticated)

**Input**:
```typescript
{
  p_program_id: string;   // UUID of the free program
}
```

**Output** (success):
```typescript
{
  entry_id: string;          // UUID of the queue entry
  position: number;          // 1-based queue position
  estimated_wait_minutes: number;  // position × avg_session_duration
  expires_at: string;        // ISO timestamp (created_at + 2h)
}
```

**Errors**:
| Code | Message | Condition |
|------|---------|-----------|
| P0001 | Program not found | program_id doesn't exist |
| P0001 | Not a free program | program.category != 'free' |
| P0001 | Already in queue | Active entry exists for student+program |
| P0001 | Not enrolled | Student not enrolled in program |

**Side Effects**:
- Creates `program_queue_entries` row with status = 'waiting'
- May trigger teacher_demand notification if queue count >= threshold (checked by pg_cron)

---

## leave_queue

**Purpose**: Student voluntarily leaves the queue (FR-025)

**Caller**: Student (authenticated, must own the entry)

**Input**:
```typescript
{
  p_program_id: string;   // UUID of the program
}
```

**Output** (success):
```typescript
{
  success: boolean;
}
```

**Errors**:
| Code | Message | Condition |
|------|---------|-----------|
| P0001 | Not in queue | No active entry for student+program |

**Side Effects**:
- Sets entry status = 'left'
- Decrements positions for all entries behind this one

---

## claim_queue_slot

**Purpose**: Student claims a queue slot after tapping notification (FR-022, clarification)

**Caller**: Student (authenticated, must own the entry)

**Input**:
```typescript
{
  p_entry_id: string;   // UUID of the queue entry (from deep link)
}
```

**Output** (success):
```typescript
{
  success: boolean;
  teacher_id: string;
  teacher_name: string;
  meeting_link: string;
  meeting_platform: string;
}
```

**Errors**:
| Code | Message | Condition |
|------|---------|-----------|
| P0001 | Entry not found | entry_id doesn't exist |
| P0001 | Not your entry | auth.uid() != entry.student_id |
| P0001 | Claim window expired | entry.claim_expires_at <= now() |
| P0001 | Already claimed | entry.status = 'claimed' |
| P0001 | Entry expired | entry.status = 'expired' |

**Side Effects**:
- Sets entry status = 'claimed'
- Returns teacher's meeting link for deep-linking to external session

---

## get_queue_status

**Purpose**: Get student's current queue position and wait estimate (FR-021, FR-020)

**Caller**: Student (authenticated)

**Input**:
```typescript
{
  p_program_id: string;   // UUID of the program
}
```

**Output** (success — in queue):
```typescript
{
  in_queue: true;
  entry_id: string;
  position: number;
  total_in_queue: number;
  estimated_wait_minutes: number;
  status: 'waiting' | 'notified';
  expires_at: string;
  claim_expires_at: string | null;
}
```

**Output** (success — not in queue):
```typescript
{
  in_queue: false;
  total_in_queue: number;        // How many others are waiting
}
```

---

## get_program_demand

**Purpose**: Teacher sees how many students are waiting in their program queues (FR-035)

**Caller**: Teacher (authenticated, must be assigned to program)

**Input**:
```typescript
{
  p_program_id: string;   // UUID of the program
}
```

**Output** (success):
```typescript
{
  waiting_count: number;      // Students in 'waiting' or 'notified' status
  program_id: string;
  program_name: string;
}
```

---

## get_daily_session_count

**Purpose**: Get student's completed session count for today in a program (FR-027)

**Caller**: Student (authenticated)

**Input**:
```typescript
{
  p_program_id: string;   // UUID of the program
}
```

**Output** (success):
```typescript
{
  session_count: number;         // 0 if no sessions today
  daily_limit: number;           // Program's configured limit (default 2)
  has_reached_limit: boolean;    // session_count >= daily_limit
}
```

---

## Queue Processor Edge Function

**Purpose**: Process queue cascade when teacher becomes available or claim window expires

**Trigger**: Called by pg_cron (every 1 minute) or by database trigger when teacher goes available

**Location**: `supabase/functions/queue-processor/index.ts`

### Process Teacher Available

When a teacher's `is_available` changes to `true`:

1. Find the teacher's program_id(s)
2. For each program with waiting queue entries:
   - Get the first entry (lowest position, status = 'waiting')
   - Set status = 'notified', notified_at = now(), claim_expires_at = now() + 3 minutes
   - Send push notification to the student via Expo Push API
3. If no waiting entries, teacher remains available for direct joins

### Process Expired Claims (pg_cron)

Every 1 minute:

1. Find entries WHERE status = 'notified' AND claim_expires_at <= now()
2. Set each to status = 'expired'
3. For each expired entry's program:
   - Find next 'waiting' entry
   - Set to 'notified' with new 3-minute window
   - Send push notification

### Process Auto-Expiry (pg_cron)

Every 5 minutes:

1. Find entries WHERE status IN ('waiting','notified') AND expires_at <= now()
2. Set all to status = 'expired'

### Notification Payloads

**queue_available** (to student):
```json
{
  "to": "<push_token>",
  "title": "Teacher Available! / معلم متاح!",
  "body": "A teacher is now available in [Program]. Tap to join! / معلم متاح الآن في [البرنامج]. اضغط للانضمام!",
  "data": {
    "type": "queue_available",
    "entry_id": "<uuid>",
    "program_id": "<uuid>",
    "url": "werecitetogether://queue/claim/<entry_id>"
  }
}
```

**teacher_demand** (to offline teachers):
```json
{
  "to": "<push_token>",
  "title": "Students Waiting / طلاب بالانتظار",
  "body": "N students are waiting in [Program]. Can you come online? / N طلاب بالانتظار في [البرنامج]. هل يمكنك الانضمام؟",
  "data": {
    "type": "teacher_demand",
    "program_id": "<uuid>",
    "waiting_count": N,
    "url": "werecitetogether://teacher/availability"
  }
}
```
