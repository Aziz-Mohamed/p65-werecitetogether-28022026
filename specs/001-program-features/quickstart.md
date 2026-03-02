# Quickstart: Program-Specific Features

**Feature**: 001-program-features
**Date**: 2026-03-01
**Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md)

## Prerequisites

- 001-platform-core fully deployed (19 tables, profiles/programs/enrollments/program_tracks exist)
- Supabase project running with existing migrations applied
- Expo development environment configured
- Access to Supabase Dashboard for migration execution

## Setup Steps

### 1. Apply Database Migration

Apply the single consolidated migration `00004_program_features.sql` which creates:
- 8 new tables: `certifications`, `himam_events`, `himam_registrations`, `himam_progress`, `curriculum_progress`, `student_guardians`, `guardian_notification_preferences`, `peer_pairings`
- 2 database functions: `get_certification_eligibility()`, `generate_certificate_number()`
- 1 sequence: `cert_number_seq`
- RLS policies for all 8 tables (5-role RBAC)
- Storage bucket: `certificates`

### 2. Install New Dependencies

```bash
npx expo install react-native-view-shot react-native-qrcode-svg
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy verify-certificate --no-verify-jwt
supabase functions deploy himam-partner-matching
```

### 4. Regenerate Supabase Types

```bash
npx supabase gen types typescript --project-id $PROJECT_ID > src/lib/database.types.ts
```

## Integration Scenarios

### Scenario 1: Teacher Recommends Student for Certification

**Flow**: Teacher → Student Detail → "Recommend for Certification" button

1. Teacher navigates to student detail and sees the student's curriculum progress
2. `checkCertificationEligibility(enrollmentId)` returns `{ eligible: true }`
3. Teacher presses "Recommend for Certification"
4. `recommendForCertification({ student_id, program_id, track_id, enrollment_id, type, title, title_ar, teacher_id })` is called
5. Certification row created with `status: 'recommended'`
6. Supervisor sees the request in their review queue

**Verify**: Query `certifications` table where `status = 'recommended'` shows the new record.

### Scenario 2: Full Certification Lifecycle

**Flow**: recommended → supervisor_approved → issued

1. Supervisor reviews: `reviewCertification(certId, 'approve')` → status becomes `supervisor_approved`
2. Program admin issues: `issueCertification(certId, chainOfNarration)` → status becomes `issued`, `certificate_number` auto-generated (WRT-YYYY-NNNNN)
3. Student sees certificate in their Certificates tab
4. Student can generate/share certificate image via `react-native-view-shot`
5. Public verification: `GET /functions/v1/verify-certificate/{certificate_number}` returns HTML page

**Verify**: Certificate has `status = 'issued'`, `certificate_number` matches `WRT-YYYY-NNNNN` format, public verification URL resolves.

### Scenario 3: Himam Marathon Event Registration + Completion

**Flow**: Student registers → gets paired → completes all Juz'

1. Program admin creates event: `createEvent({ program_id, event_date: '2026-03-07', ... })`
2. Student registers: `registerForEvent(eventId, studentId, '3_juz')` → creates 3 `himam_progress` rows (Juz' 1-3)
3. Admin triggers partner matching: `POST /functions/v1/himam-partner-matching { event_id }` → pairs students by track (FIFO)
4. Registration status: `registered → paired`
5. Partner logs completions: `logBlockCompletion(registrationId, juzNumber, loggedBy)` for each Juz'
6. When all Juz' completed → registration status becomes `completed`

**Verify**: `himam_registrations.status = 'completed'`, all `himam_progress` rows have `status = 'completed'`.

### Scenario 4: Teacher Reviews Mutoon Progress (Section-by-Section)

**Flow**: Student enrolls → progress initialized → teacher reviews sections

1. Student enrolls in a Mutoon track → `initializeProgress(enrollmentId, trackId, 'mutoon')` creates one `curriculum_progress` row per section (from `program_tracks.curriculum` JSONB)
2. Teacher opens student's curriculum workspace
3. Teacher updates a section: `updateSectionProgress(progressId, { status: 'memorized', score: 4.5, teacher_notes: 'Good tajweed' })`
4. Progress bar updates showing completion percentage
5. When all sections memorized/certified → `checkCertificationEligibility()` returns `eligible: true`

**Verify**: `curriculum_progress` rows match expected statuses, progress percentage calculation is accurate.

### Scenario 5: Guardian Management for Children's Program

**Flow**: Add guardian → set notification preferences

1. During enrollment or from student profile: `addGuardian({ student_id, guardian_name, guardian_phone, guardian_email, relationship: 'parent', is_primary: true })`
2. Guardian appears in student's guardian list
3. Guardian preferences set: `updateGuardianNotificationPreference(guardianId, 'attendance', true)`
4. Notifications route to child's shared device push tokens, filtered by guardian preferences

**Verify**: `student_guardians` row created, `guardian_notification_preferences` row created with correct category + enabled values.

### Scenario 6: Peer Recitation Pairing

**Flow**: Student A requests → Student B accepts → sessions logged

1. Student A browses available partners: `getAvailablePartners(programId, 'quran', studentAId)`
2. Student A sends request: `requestPairing({ program_id, section_type: 'quran', student_a_id, student_b_id })`
3. Student B receives notification, accepts: `respondToPairing(pairingId, 'accept')` → status becomes `active`
4. After each session: `logPairingSession(pairingId, loggedBy)` → `session_count` increments
5. When done: `completePairing(pairingId)` → status becomes `completed`

**Verify**: `peer_pairings.status = 'active'` after acceptance, `session_count` increments correctly.

## Key Validation Points

| Feature | Table | Key Check |
|---------|-------|-----------|
| Certification lifecycle | `certifications` | Status transitions follow state machine |
| Certificate number generation | `certifications` | `certificate_number` matches `WRT-YYYY-NNNNN` |
| Himam event constraint | `himam_events` | `event_date` must be Saturday |
| Himam registration uniqueness | `himam_registrations` | One registration per student per event |
| Curriculum progress init | `curriculum_progress` | Rows match sections in `program_tracks.curriculum` |
| Mutoon scoring | `curriculum_progress` | Score 0-5 when `progress_type = 'mutoon'` |
| Qiraat pass/fail | `curriculum_progress` | No score (NULL) when `progress_type = 'qiraat'` |
| Arabic scoring | `curriculum_progress` | Score 0-100 when `progress_type = 'arabic'` |
| Guardian validation | `student_guardians` | At least one of phone or email required |
| Peer pairing uniqueness | `peer_pairings` | No duplicate active pairings for same student+program+section_type |

## Edge Function Testing

### verify-certificate (Public)

```bash
# No auth needed
curl https://<project-ref>.supabase.co/functions/v1/verify-certificate/WRT-2026-00001
# Returns: HTML page with certificate details or error
```

### himam-partner-matching (Admin Only)

```bash
# Requires service role key
curl -X POST https://<project-ref>.supabase.co/functions/v1/himam-partner-matching \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"event_id": "<uuid>"}'
# Returns: { "paired": 4, "unmatched": 1 }
```

### himam-event-lifecycle (Scheduled — Hourly)

```bash
# Scheduled invocation via pg_cron or Supabase cron (service role)
curl -X POST https://<project-ref>.supabase.co/functions/v1/himam-event-lifecycle \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"
# Returns: { "activated": 1, "completed": 0, "reminders_sent": 12 }
```
