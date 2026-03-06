# Quickstart: Session Logging Evolution

**Feature Branch**: `005-session-evolution`
**Date**: 2026-03-06

---

## Prerequisites

- Supabase local running (`supabase start`)
- Migration 00005 (programs_enrollment) applied
- At least 1 program, 1 teacher with program_role, 1 student enrolled
- expo-av installed (`npx expo install expo-av`)

---

## Scenario 1: Session with Program Context (US1)

### Setup
1. Ensure teacher has `program_roles` entry for at least one program
2. Ensure at least one student exists

### Steps
1. Sign in as teacher
2. Navigate to Sessions tab
3. Tap "+" to create new session
4. **Verify**: Program chip row appears above class selection, showing only assigned programs
5. Select a program, select a student, enter scores
6. Submit
7. **Verify**: Session saved with program_id in database
8. View session detail — **Verify**: Program name displayed
9. Sign in as student — view session — **Verify**: Program name visible

### Edge Case: No Program Selected
1. Create session without selecting any program
2. **Verify**: Session created successfully with program_id = NULL
3. **Verify**: Session displays normally without program label

---

## Scenario 2: Draft Workflow (US2)

### Steps
1. Sign in as teacher
2. Tap "+" to create new session
3. Select student, enter one score (e.g., memorization_score = 4)
4. Tap "Save Draft" instead of Submit
5. **Verify**: Session saved with status = 'draft'
6. Navigate away, return to sessions list
7. **Verify**: Draft appears at top with "Draft" badge, visually distinct
8. Tap the draft
9. **Verify**: Previously entered data is pre-filled
10. Fill remaining scores and notes, tap "Submit"
11. **Verify**: Status changes to 'completed'
12. **Verify**: Session now visible to student

### Edge Case: Student Cannot See Drafts
1. While draft exists, sign in as student
2. View sessions list
3. **Verify**: Draft is NOT visible

### Edge Case: Draft Auto-Cleanup
1. Create a draft session
2. Manually set `created_at` to 8 days ago in database
3. Trigger cleanup-drafts Edge Function
4. **Verify**: Draft is deleted
5. **Verify**: Teacher receives push notification "1 draft session was removed after 7 days"

---

## Scenario 3: Voice Memo Recording (US3)

### Steps
1. Sign in as teacher
2. Create and submit a session (status = 'completed')
3. **Verify**: "Record a voice memo for [student name]?" prompt appears
4. Press and hold record button
5. **Verify**: Waveform animation visible, countdown timer counting from 2:00
6. Release after ~10 seconds
7. **Verify**: Preview playback available
8. Tap "Send"
9. **Verify**: Upload happens in background (no blocking UI)
10. **Verify**: Success indicator appears
11. Sign in as student
12. Open the session detail
13. **Verify**: Audio player visible with play/pause, seek bar, speed controls (1x, 1.25x, 1.5x)
14. Play the memo — **Verify**: Audio plays correctly

### Edge Case: 2-Minute Limit
1. Start recording
2. Let it run to 1:45
3. **Verify**: Warning shown ("15 seconds remaining")
4. Let it reach 2:00
5. **Verify**: Recording auto-stops

### Edge Case: Re-record
1. After recording, tap "Re-record"
2. **Verify**: Previous recording discarded
3. Record again, preview, send
4. **Verify**: New recording uploaded successfully

---

## Scenario 4: Retroactive Voice Memo (US4)

### Steps
1. Sign in as teacher
2. View a completed session from earlier today (no voice memo)
3. **Verify**: "Add voice memo" button visible
4. Record and send voice memo
5. **Verify**: Memo appears on session detail

### Edge Case: 24-Hour Window
1. View a session from 25 hours ago
2. **Verify**: "Add voice memo" button is NOT shown

### Edge Case: One Memo Per Session
1. View a session that already has a voice memo
2. **Verify**: Play button visible, but no "Add voice memo" button
3. **Verify**: Cannot replace existing memo

---

## Scenario 5: Voice Memo Expiration

### Steps
1. Create a session with a voice memo
2. Manually set `expires_at` to past in database
3. Trigger cleanup-voice-memos Edge Function
4. **Verify**: Storage file deleted from voice-memos bucket
5. **Verify**: `session_voice_memos.is_expired = true`
6. Sign in as student, view session detail
7. **Verify**: Shows "Voice memo expired" with original recording date and duration
8. **Verify**: No play button available

---

## Scenario 6: Mic Icon on Session Cards

### Steps
1. Ensure some sessions have voice memos and some don't
2. View sessions list (teacher or student)
3. **Verify**: Sessions with memos show microphone icon
4. **Verify**: Sessions without memos have no mic icon

---

## Scenario 7: Supervisor/Admin Voice Memo Access (FR-020)

### Steps
1. Sign in as supervisor assigned to a program
2. View a session within that program that has a voice memo
3. **Verify**: Can play the voice memo
4. View a session in a program NOT assigned to
5. **Verify**: Cannot access/play the memo

---

## Verification Checklist

- [ ] Program selector shows only teacher's assigned programs
- [ ] Session created without program works (backward compat)
- [ ] Program name displays on session detail and list
- [ ] Draft saves with partial data (student required, scores optional)
- [ ] Drafts visually distinct in list
- [ ] Drafts hidden from students/parents
- [ ] Draft editing pre-fills all fields
- [ ] Draft submit changes status to completed
- [ ] Voice memo records up to 2 minutes
- [ ] Waveform animation during recording
- [ ] Preview and re-record work
- [ ] Background upload doesn't block UI
- [ ] Student audio player has play/pause, seek, speed controls
- [ ] Mic icon on session cards with memos
- [ ] Voice memo expired shows date + duration
- [ ] 24-hour window enforced for retroactive memos
- [ ] One memo per session enforced
- [ ] Push notification sent to student on memo attachment
- [ ] Batched notification for expired drafts
- [ ] Existing sessions work unchanged
