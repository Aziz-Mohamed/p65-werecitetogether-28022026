# Research: Session Logging Evolution

**Feature Branch**: `005-session-evolution`
**Date**: 2026-03-06

---

## Decision 1: Audio Recording Library

**Decision**: Use `expo-av` for audio recording and playback.

**Rationale**: `expo-av` is Expo's built-in audio module, supports recording in compressed formats (AAC, Opus via container), provides real-time metering for waveform visualization, and handles playback with seek/speed controls. It's already compatible with the Expo ~54 managed workflow. No native module linking required.

**Alternatives considered**:
- `expo-audio` (new Expo Audio API) — Still experimental in Expo 54, limited recording control. Not mature enough for production voice memo features.
- `react-native-audio-recorder-player` — Third-party, requires config plugin, not Expo-managed-compatible without ejecting.

**Installation**: `npx expo install expo-av`

---

## Decision 2: Voice Memo Storage Format

**Decision**: Record as M4A (AAC-LC, mono, 64kbps, 22050Hz). Target ~60KB per minute.

**Rationale**: `expo-av` on iOS records natively to M4A/AAC without transcoding. Android also supports AAC via MediaRecorder. Opus/OGG would require custom native code. AAC-LC at 64kbps mono produces speech-quality audio at ~480KB per minute raw, but with VBR and speech content, effective size is closer to 60-120KB/min. The 2-minute limit keeps files under 250KB worst case.

**Alternatives considered**:
- Opus/OGG — Superior compression but requires native codec setup outside Expo managed workflow.
- WAV — Lossless but ~10MB per minute, impractical for mobile upload.
- MP3 — Comparable quality but patent concerns and no native iOS recording support.

---

## Decision 3: Voice Memo Storage Architecture

**Decision**: Use Supabase Storage with a dedicated `voice-memos` bucket (private). File path convention: `{session_id}.m4a`. Signed URLs for playback (1-hour expiry).

**Rationale**: Supabase Storage is already in use (rewards, stickers buckets). Private bucket + signed URLs ensures only authorized users (teacher, student, supervisor) can access memos. Single file per session (1:1 relationship) makes the path simple. Signed URL expiry (1 hour) prevents URL sharing/leaking.

**Alternatives considered**:
- Public bucket — No access control, anyone with URL can listen.
- Direct Supabase client upload — Chosen, avoids Edge Function overhead for upload.
- CDN/external storage — Over-engineered for ~250KB files with 30-day retention.

---

## Decision 4: Voice Memo Expiration Strategy

**Decision**: pg_cron daily job deletes expired voice memo files from storage and updates memo records. Memo metadata row is preserved (marks `is_expired = true`).

**Rationale**: Consistent with existing pg_cron patterns (3 jobs already running). Daily cleanup at 3:00 AM UTC is sufficient since the 30-day window is not time-critical. Preserving the metadata row allows the UI to show "Voice memo expired" with original date/duration. The Edge Function handles the actual storage deletion since pg_cron can't directly call Supabase Storage APIs.

**Alternatives considered**:
- Client-side expiration check only — Files would accumulate in storage indefinitely.
- Supabase Storage lifecycle policies — Not available in current Supabase version.
- Real-time deletion (trigger on access) — Complex, race conditions.

---

## Decision 5: Draft Session Implementation

**Decision**: Add a `status` column to the existing `sessions` table (TEXT, nullable, default 'completed'). Values: 'draft', 'completed'. NULL treated as 'completed' for backward compatibility.

**Rationale**: Adding a column to the existing table is simpler than a separate drafts table. Nullable with default 'completed' means all existing sessions automatically have the correct status without data migration. RLS policies filter drafts to teacher-only visibility. The 7-day cleanup uses pg_cron with an Edge Function to send batched notifications before deletion.

**Alternatives considered**:
- Separate `session_drafts` table — Would require duplicating the session schema and a "promote to session" workflow. Over-complex.
- Boolean `is_draft` column — Less extensible than text status if future states are needed.
- Client-side draft storage (AsyncStorage) — Data loss risk, no multi-device sync.

---

## Decision 6: Program Selector in Session Creation

**Decision**: Extend the existing `CreateSessionSheet` bottom sheet with a program picker chip row above the existing class/student selection. The program selector queries `program_roles` for the teacher's assigned programs.

**Rationale**: The existing CreateSessionSheet uses a chip row pattern for class selection. Adding a program chip row follows the same UX pattern. The program_id is optional (nullable FK) so the form works without selection for backward compatibility. When a program is selected, the student list can optionally filter to students enrolled in that program.

**Alternatives considered**:
- Separate "New Session" screen — Breaks existing UX flow, unnecessary navigation.
- Auto-infer program from class — Classes don't have program_id yet (would require additional migration).

---

## Decision 7: Push Notification for Voice Memo

**Decision**: Extend the existing `send-notification` Edge Function to handle a new `voice_memo_attached` event category. Add a database trigger on `session_voice_memos` INSERT that calls the Edge Function.

**Rationale**: Follows the established pattern — other events (sticker_awarded, session_completed) use the same Edge Function. Adding a new category column to `notification_preferences` (`voice_memo_received`) lets students opt out. The trigger fires on INSERT only (one memo per session, no updates).

**Alternatives considered**:
- Client-side push trigger — Unreliable if app is killed during upload.
- Separate Edge Function — Unnecessary duplication of notification logic.
- Realtime webhook (like existing events) — Would work but trigger approach is simpler for a single-table event.

---

## Decision 8: Draft Cleanup Notification

**Decision**: pg_cron daily job at 3:30 AM UTC calls an Edge Function `cleanup-drafts` that: (1) queries drafts older than 7 days grouped by teacher, (2) deletes them, (3) sends one batched push notification per teacher with the count.

**Rationale**: Batched notification avoids spam (clarification decision). Separate Edge Function from voice memo cleanup keeps concerns isolated. Running at 3:30 AM UTC (after voice memo cleanup at 3:00 AM) avoids overlapping database load.

**Alternatives considered**:
- In-app notification only (no push) — Teachers may not open the app for days; push ensures awareness.
- Per-draft notification — Clarification explicitly chose batched.

---

## Decision 9: Waveform Visualization

**Decision**: Use `expo-av`'s `onRecordingStatusUpdate` metering data to drive a custom waveform component built with `react-native-reanimated`. No third-party waveform library.

**Rationale**: `expo-av` provides real-time `metering` values (dBFS) during recording. These can be sampled at ~100ms intervals and mapped to bar heights in a simple animated component. This avoids adding a heavy waveform library dependency. For playback waveform, a simpler progress bar with seek is sufficient (no need for full waveform rendering of the audio file).

**Alternatives considered**:
- `react-native-audio-waveform` — Not Expo-managed compatible.
- Pre-rendered waveform from audio analysis — Over-engineered for a 2-minute recording preview.
- No waveform (just timer) — Spec explicitly requires waveform animation (FR-010).

---

## Decision 10: Offline Voice Memo Queuing

**Decision**: Record audio to local filesystem (`expo-file-system`). If upload fails, store the local file path and session_id in AsyncStorage as a retry queue. On app foreground, check queue and retry uploads.

**Rationale**: The spec requires recordings to survive app kills and retry on reconnection. `expo-file-system` provides persistent local storage. AsyncStorage is a lightweight key-value store for the retry queue. The upload service checks the queue on app start and network recovery.

**Alternatives considered**:
- Background upload service — Expo managed workflow has limited background execution. Best-effort foreground retry is more reliable.
- expo-background-fetch — Limited to periodic wakeups, not event-driven. Unreliable for upload retry.
