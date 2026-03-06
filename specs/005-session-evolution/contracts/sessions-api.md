# API Contracts: Session Evolution

**Feature Branch**: `005-session-evolution`
**Date**: 2026-03-06

---

## Supabase Client SDK Operations

All operations use the Supabase JS SDK directly (no REST API layer). Contracts are defined as service method signatures with expected Supabase query patterns.

---

### SE-001: Create Session (Extended)

**Service**: `sessionsService.createSession(input)`

**Extended Input**:
```typescript
interface CreateSessionInput {
  student_id: string;
  teacher_id: string;
  class_id?: string | null;        // DEPRECATED
  program_id?: string | null;       // NEW — optional program reference
  session_date?: string;
  memorization_score?: number | null;
  tajweed_score?: number | null;
  recitation_quality?: number | null;
  notes?: string | null;
  scheduled_session_id?: string | null;
  status?: 'draft' | 'completed';   // NEW — default 'completed'
}
```

**Supabase Query**:
```typescript
supabase.from('sessions').insert({
  ...input,
  school_id,  // from teacher profile (legacy)
  status: input.status ?? 'completed',
}).select().single()
```

**Validation**:
- student_id: required (even for drafts — per clarification)
- teacher_id: required
- program_id: optional, must be a program the teacher is assigned to via program_roles
- status: optional, defaults to 'completed'
- Scores: optional for drafts, recommended for completed

**Response**: Session row with id

**Error Cases**:
- 403: Teacher not assigned to selected program
- 422: Invalid score values (outside 1-5 range)

---

### SE-002: Update Draft Session

**Service**: `sessionsService.updateDraft(sessionId, input)`

**Input**:
```typescript
interface UpdateDraftInput {
  program_id?: string | null;
  student_id?: string;
  memorization_score?: number | null;
  tajweed_score?: number | null;
  recitation_quality?: number | null;
  notes?: string | null;
  status?: 'draft' | 'completed';  // 'completed' = submit
}
```

**Supabase Query**:
```typescript
supabase.from('sessions')
  .update(input)
  .eq('id', sessionId)
  .eq('status', 'draft')           // Can only update drafts
  .eq('teacher_id', currentUserId) // Can only update own drafts
  .select().single()
```

**Response**: Updated session row

**Error Cases**:
- 404: Session not found or not a draft
- 403: Not the session's teacher

---

### SE-003: Get Sessions (Extended Filters)

**Service**: `sessionsService.getSessions(filters)`

**Extended Filters**:
```typescript
interface SessionFilters {
  studentId?: string;
  teacherId?: string;
  classId?: string;       // DEPRECATED
  programId?: string;     // NEW — filter by program
  status?: 'draft' | 'completed';  // NEW — filter by status
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
```

**Supabase Query Additions**:
```typescript
// Add to existing query chain:
if (filters.programId) query = query.eq('program_id', filters.programId);
if (filters.status) query = query.eq('status', filters.status);
// For non-teacher roles, exclude drafts:
// query = query.or('status.is.null,status.eq.completed')
```

**Response**: Array of sessions with program name joined

---

### SE-004: Delete Draft Session

**Service**: `sessionsService.deleteDraft(sessionId)`

**Supabase Query**:
```typescript
supabase.from('sessions')
  .delete()
  .eq('id', sessionId)
  .eq('status', 'draft')
  .eq('teacher_id', currentUserId)
```

**Response**: void (204)

**Error Cases**:
- 404: Not found or not a draft
- 403: Not the session's teacher

---

### SE-005: Upload Voice Memo

**Service**: `voiceMemoService.uploadMemo(sessionId, fileUri, durationSeconds)`

**Flow**:
1. Upload file to Supabase Storage:
```typescript
supabase.storage
  .from('voice-memos')
  .upload(`${sessionId}.m4a`, file, {
    contentType: 'audio/mp4',
    upsert: false,  // One memo per session
  })
```

2. Create metadata record:
```typescript
supabase.from('session_voice_memos').insert({
  session_id: sessionId,
  teacher_id: currentUserId,
  storage_path: `${sessionId}.m4a`,
  duration_seconds: durationSeconds,
  file_size_bytes: fileSize,
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
})
```

**Validation**:
- Session must belong to the teacher
- Session must be completed (not draft)
- Session must be less than 24 hours old
- No existing voice memo for this session
- Duration <= 120 seconds
- File size <= 500KB

**Response**: session_voice_memos row

**Error Cases**:
- 409: Voice memo already exists for this session
- 403: Session doesn't belong to teacher
- 422: Session older than 24 hours
- 413: File too large

---

### SE-006: Get Voice Memo URL

**Service**: `voiceMemoService.getMemoUrl(sessionId)`

**RPC Function**:
```typescript
supabase.rpc('get_voice_memo_url', { p_session_id: sessionId })
```

**Server-side Logic** (RPC):
1. Verify caller has access to the session (teacher, student, parent, supervisor, program_admin, master_admin)
2. Check memo exists and is not expired
3. Generate signed URL (1-hour expiry) from storage

**Response**: `{ url: string, duration_seconds: number, created_at: string, is_expired: boolean }`

**Error Cases**:
- 404: No voice memo for session
- 403: Caller doesn't have access to the session

---

### SE-007: Get Voice Memo Metadata

**Service**: `voiceMemoService.getMemoMetadata(sessionId)`

**Supabase Query**:
```typescript
supabase.from('session_voice_memos')
  .select('id, duration_seconds, file_size_bytes, is_expired, created_at, expires_at')
  .eq('session_id', sessionId)
  .single()
```

**Response**: Memo metadata (no URL — use SE-006 for playback URL)

---

### SE-008: Get Teacher Programs (for Session Creation)

**Service**: `sessionsService.getTeacherPrograms()`

**Supabase Query**:
```typescript
supabase.from('program_roles')
  .select('program_id, programs(id, name, name_ar)')
  .eq('profile_id', currentUserId)
  .eq('role', 'teacher')
```

**Response**: Array of `{ program_id, programs: { id, name, name_ar } }`

---

## Edge Functions

### EF-001: cleanup-voice-memos

**Trigger**: pg_cron daily at 3:00 AM UTC
**Method**: POST
**Auth**: Service role key (internal only)

**Logic**:
1. Query expired memos: `SELECT * FROM session_voice_memos WHERE expires_at <= now() AND is_expired = false`
2. For each memo: `supabase.storage.from('voice-memos').remove([storage_path])`
3. Batch update: `UPDATE session_voice_memos SET is_expired = true WHERE id IN (...)`
4. Return: `{ cleaned: number, errors: number }`

---

### EF-002: cleanup-drafts

**Trigger**: pg_cron daily at 3:30 AM UTC
**Method**: POST
**Auth**: Service role key (internal only)

**Logic**:
1. Query expired drafts grouped by teacher:
```sql
SELECT teacher_id, COUNT(*) as draft_count
FROM sessions
WHERE status = 'draft' AND created_at < now() - interval '7 days'
GROUP BY teacher_id
```
2. Delete drafts: `DELETE FROM sessions WHERE status = 'draft' AND created_at < now() - interval '7 days'`
3. For each teacher: send batched push notification via Expo Push API
4. Return: `{ teachers_notified: number, drafts_deleted: number }`

---

## Push Notification Events

### PN-001: voice_memo_attached

**Trigger**: INSERT on session_voice_memos
**Recipient**: Student of the session
**Category**: `voice_memo_received`
**Preference Column**: `voice_memo_received`

**Content**:
- EN: "Your teacher left you a voice memo for your session on {date}"
- AR: "ترك لك معلمك رسالة صوتية لجلستك بتاريخ {date}"

**Data**: `{ screen: '/(student)/sessions/{session_id}' }`

### PN-002: drafts_expired

**Trigger**: cleanup-drafts Edge Function
**Recipient**: Teacher
**Category**: `draft_expired`
**Preference Column**: `draft_expired`

**Content**:
- EN: "{count} draft session(s) were removed after 7 days"
- AR: "تم حذف {count} جلسة/جلسات مسودة بعد 7 أيام"

**Data**: `{ screen: '/(teacher)/(tabs)/sessions' }`
