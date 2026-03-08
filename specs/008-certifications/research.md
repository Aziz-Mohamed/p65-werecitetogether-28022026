# Research: Certification System (Ijazah)

## R1: Certificate Number Generation Strategy

**Decision**: Use a PostgreSQL sequence + trigger to generate certificate numbers in format `WRT-YYYY-NNNNN` upon issuance (status change to 'issued').

**Rationale**: Sequential numbers must be gap-free for trust and auditability. A DB-level sequence guarantees uniqueness even under concurrent issuance. The number is only generated at issuance (not at recommendation), so the sequence isn't wasted on rejected/returned records.

**Alternatives considered**:
- UUID-based: Rejected — not human-readable, hard to communicate verbally
- Application-level counter: Rejected — race conditions, gaps on failures
- Timestamp-based: Rejected — not sequential, harder to audit

**Implementation**:
```sql
CREATE SEQUENCE certification_number_seq START 1;

-- In the issue_certification RPC function:
cert_number := 'WRT-' || extract(year from now())::text || '-' || lpad(nextval('certification_number_seq')::text, 5, '0');
```

## R2: Public Verification Approach

**Decision**: Supabase Edge Function at `verify-certificate` that accepts a certificate number as query parameter and returns JSON. No authentication required. CORS enabled for browser access.

**Rationale**: Edge Functions are the existing pattern for public-facing endpoints in this codebase. A dedicated edge function is simpler than exposing a database view publicly. The function can handle privacy logic (minor name masking) server-side.

**Alternatives considered**:
- Expo API Route: Rejected — requires EAS Hosting, adds complexity
- Public Supabase view: Rejected — can't implement privacy logic (minor masking) in a view
- In-app-only verification (deep link): Rejected — QR codes should work in a browser without the app installed

**Implementation**: Edge Function returns JSON. The QR code URL format: `https://<project>.supabase.co/functions/v1/verify-certificate?number=WRT-2026-00001`. The app can also display verification results in-app via the same endpoint.

## R3: QR Code and Image Sharing Libraries

**Decision**: Add `react-native-qrcode-svg`, `react-native-view-shot`, and `expo-sharing`.

**Rationale**:
- `react-native-qrcode-svg` — most popular QR code library for RN, renders as SVG (crisp at any size), depends on already-installed `react-native-svg@15.12.1`
- `react-native-view-shot` — standard approach for capturing a React Native view as an image. Captures the certificate card as PNG for sharing
- `expo-sharing` — Expo-managed library for invoking the native share sheet. Compatible with managed workflow

**Alternatives considered**:
- `qrcode` (JS-only, canvas-based): Rejected — requires canvas polyfill in RN
- `expo-print` for PDF generation: Rejected — spec explicitly chose client-side image capture over PDF
- Manual Blob handling for sharing: Rejected — `expo-sharing` handles cross-platform differences

## R4: Notification Categories for Certification Workflow

**Decision**: Add 6 new notification categories to `send-notification` edge function, one per workflow transition (aligned with FR-007):
1. `certification_recommended` — Notify supervisor when teacher recommends
2. `certification_supervisor_approved` — Notify program admin when supervisor approves
3. `certification_returned` — Notify teacher when supervisor returns
4. `certification_issued` — Notify student when certificate is issued
5. `certification_rejected` — Notify teacher and supervisor when program admin rejects
6. `certification_revoked` — Notify student, teacher, and program admin (if revoked by master admin)

**Rationale**: The spec (FR-007) requires notifications at each of the 6 workflow transitions with explicit recipient lists. Using one category per transition enables precise message customization and clear recipient targeting.

**Alternatives considered**:
- Single generic `certification_update` category: Rejected — too vague, can't customize messages per transition
- 4 categories (skip return/reject): Rejected — FR-007 explicitly requires notification for all 6 transitions

**Implementation**: All 6 are DIRECT_CATEGORIES (invoked via `supabase.functions.invoke()` from client, not via database webhooks), following the `supervisor_flag` pattern.

## R5: Uniqueness Constraint Design

**Decision**: Partial unique index on `(student_id, program_id, track_id)` where `status NOT IN ('rejected')`.

**Rationale**: The spec clarifies that "returned" records cycle back to "recommended" (same record), so they don't cause uniqueness issues. Only "rejected" records need to be excluded from the constraint so teachers can create new recommendations after rejection. Using a partial index rather than application-level checks ensures data integrity.

**Implementation**:
```sql
CREATE UNIQUE INDEX certifications_active_unique
ON certifications (student_id, program_id, COALESCE(track_id, '00000000-0000-0000-0000-000000000000'))
WHERE status NOT IN ('rejected');
```
Note: `COALESCE` handles nullable `track_id` for programs without tracks.

## R6: Certification Status State Machine

**Decision**: 6 statuses with the following valid transitions:

```
recommended → supervisor_approved → issued
    ↑               |                   |
    |               ↓                   ↓
    └── returned   rejected           revoked
```

**Valid transitions**:
- `recommended` → `supervisor_approved` (supervisor approves)
- `recommended` → `returned` (supervisor returns to teacher)
- `returned` → `recommended` (teacher re-submits)
- `supervisor_approved` → `issued` (program admin issues)
- `supervisor_approved` → `rejected` (program admin rejects)
- `issued` → `revoked` (master admin or program admin revokes)

**Enforced at**: RPC function level. Each transition function validates the current status before updating.

## R7: Minor Detection for Privacy Masking

**Decision**: Determine minor status by checking if the certification's `program_id` corresponds to the Children's Program (Program 2). This is checked at the edge function level during verification.

**Rationale**: The platform doesn't store age/DOB. The Children's Program is the only program with minors. Checking program association is simpler and more reliable than age calculation.

**Alternatives considered**:
- Store DOB on profiles: Rejected — scope creep, not needed for other features
- Boolean `is_minor` flag on certification: Rejected — redundant with program association
- Client-side masking: Rejected — verification page must work without the app

**Implementation**: The `verify-certificate` edge function joins `certifications` → `programs` and checks if `programs.slug = 'children'` (or uses a program metadata flag). If so, returns first name + last initial.
