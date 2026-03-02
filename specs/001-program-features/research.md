# Research: Program-Specific Features

**Date**: 2026-03-01
**Feature**: 001-program-features

## R1: Client-Side Certificate Image Generation

**Decision**: Use `react-native-view-shot` to capture a rendered React Native view as a PNG image, combined with `react-native-qrcode-svg` for the QR code.

**Rationale**: The spec requires < 3s certificate generation on-device. `react-native-view-shot` captures any React Native view hierarchy as an image — meaning we can design the certificate in JSX using standard RN components + `react-native-svg` (already installed) and capture it. This avoids the complexity of HTML-to-PDF conversion and keeps everything native.

**Alternatives considered**:
- `expo-print` (HTML → PDF): Heavier, requires WebView, slower on older devices, harder to control layout precisely across platforms.
- Server-side PDF generation (Edge Function): Requires a PDF library in Deno, adds network dependency, violates the MVP assumption of client-side rendering.
- `react-native-skia`: More powerful but overkill for static certificate layouts and adds ~2MB to bundle.

**Implementation pattern**:
1. Render `<CertificateImage />` component offscreen (opacity: 0, position: absolute)
2. Capture via `captureRef()` from react-native-view-shot → returns a file URI
3. Share via React Native's built-in `Share.share({ url: fileUri })` on iOS or `expo-sharing` for cross-platform
4. Cache captured images in `expo-file-system` documentDirectory for offline viewing

**New dependencies**: `react-native-view-shot@^3.8.0`, `react-native-qrcode-svg@^6.3.0`

## R2: Public Certificate Verification Page

**Decision**: Create a Supabase Edge Function (`verify-certificate`) that serves an HTML page.

**Rationale**: Edge Functions can return HTML responses. This avoids needing a separate web hosting service. The function accepts a certificate token in the URL path, queries the database, and returns a styled HTML page with certificate details or a "revoked/not found" message.

**Alternatives considered**:
- Separate web app (Next.js / static site): Overkill for a single verification page. Adds hosting complexity.
- Supabase Storage static HTML + client-side fetch: Would require CORS and expose the API key. Less secure.

**Implementation pattern**:
- URL: `https://<project-ref>.supabase.co/functions/v1/verify-certificate/{certificate_number}`
- Edge function queries `certifications` table by certificate_number
- Returns HTML with inline CSS (no external deps), bilingual (AR/EN)
- `verify_jwt: false` since this must be publicly accessible
- Includes meta tags for social sharing (og:title, og:description)

## R3: Shared Curriculum Progress Model

**Decision**: Use a single `curriculum_progress` table for Mutoon, Qiraat, and Arabic Language tracking, differentiated by `progress_type` column.

**Rationale**: All three programs share the same pattern: enrollment → pre-defined sections → per-section status/score → completion % → certification eligibility. A shared table avoids three near-identical tables and allows a single reusable `curriculum-progress` feature module.

**Alternatives considered**:
- Three separate tables (`mutoon_progress`, `qiraat_progress`, `arabic_progress`): More explicit but creates redundant schema, services, and hooks. Violates DRY.
- JSONB progress blob on enrollments: Loses queryability and indexing. Can't efficiently filter "all sections with status = memorized".

**Differentiation via `progress_type`**:
- `mutoon`: sections are verses/lines, score is 0-5, statuses are not_started/in_progress/memorized/certified
- `qiraat`: sections are 30 Juz', score is pass/fail (boolean), teacher signs off
- `arabic`: sections are recitations/chapters, score is 0-100, passing threshold configurable (default 60)

## R4: Himam Partner Matching Algorithm

**Decision**: Implement as a Supabase Edge Function (`himam-partner-matching`) triggered manually by the program admin.

**Rationale**: Automatic matching needs to consider: same track, unmatched status, and potentially timezone preferences. Running it as an Edge Function gives the admin control over when pairing happens (they can adjust registrations first) and avoids complex database triggers.

**Alternatives considered**:
- Database trigger on registration: Too eager — pairs immediately, doesn't let admin review registrations first.
- Client-side matching in the admin app: Puts logic in the wrong layer and can't handle concurrent matching safely.

**Algorithm**:
1. Query all unmatched registrations for the event, grouped by track
2. Within each track, sort by `created_at` (FIFO fairness)
3. Pair adjacent students: [1,2], [3,4], [5,6], ...
4. If odd number in a track, leave the last student unmatched (admin can manually assign or create a 3-person group)
5. Update `partner_id` on both registrations
6. Send partner assignment notifications via the existing `send-notification` edge function

## R5: Guardian Notification Routing

**Decision**: Guardians share the child's device and push tokens. Per-guardian notification preferences are stored in `guardian_notification_preferences` table but all route to the child's `push_tokens`.

**Rationale**: Per the clarification session, guardians don't have separate app accounts. The child's device receives all notifications. Per-guardian preferences control which categories fire (e.g., guardian A wants session alerts, guardian B does not). The notification system checks: is this a children's program student? If yes, check each guardian's preferences before sending.

**Implementation impact**:
- Modify `send-notification` edge function to check `student_guardians` → `guardian_notification_preferences` for children's program notifications
- No new push token infrastructure needed
- Guardian preferences are a simple boolean-per-category table keyed by `guardian_id`

## R6: Certificate Number Generation

**Decision**: Use a database sequence + trigger to generate `WRT-YYYY-NNNNN` format numbers.

**Rationale**: Database sequences are atomic and concurrent-safe. A trigger on INSERT to `certifications` generates the number from a sequence, formatted with the current year and zero-padded.

**Implementation**:
- Create sequence `cert_number_seq`
- Trigger on `certifications` INSERT: `certificate_number = 'WRT-' || EXTRACT(YEAR FROM issue_date) || '-' || LPAD(nextval('cert_number_seq')::TEXT, 5, '0')`
- The sequence does NOT reset per year (avoids collision if year changes mid-insert)
- Uniqueness enforced by UNIQUE constraint on `certificate_number`
