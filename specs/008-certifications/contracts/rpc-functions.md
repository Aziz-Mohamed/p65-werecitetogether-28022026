# API Contracts: Certification System RPC Functions

**Note**: All RPC functions MUST be created as `SECURITY DEFINER` with `SET search_path = public` per Constitution VII.

## RPC-001: recommend_certification

**Caller**: Teacher
**Purpose**: Submit a new certification recommendation for a student (FR-001)

**Input**:
```
p_student_id    uuid        REQUIRED
p_program_id    uuid        REQUIRED
p_track_id      uuid        NULLABLE (null for trackless programs)
p_type          text        REQUIRED ('ijazah' | 'graduation' | 'completion')
p_title         text        REQUIRED
p_title_ar      text        NULLABLE
p_notes         text        NULLABLE
p_metadata      jsonb       DEFAULT '{}'
```

**Returns**: `SETOF certifications` (the created record)

**Validation**:
1. `auth.uid()` must be non-null
2. Caller must be the teacher (verified via `program_roles` or enrollment teacher_id)
3. Student must have an active enrollment in the program (`enrollments.status IN ('active', 'approved')`) (FR-015)
4. No duplicate active certification exists for this student + program + track (FR-006)

**Errors**:
- `CERT_NOT_TEACHER` — caller is not a teacher in this program
- `CERT_NOT_ENROLLED` — student not actively enrolled
- `CERT_DUPLICATE` — active certification already exists

---

## RPC-002: review_certification

**Caller**: Supervisor
**Purpose**: Approve or return a recommendation (FR-002, FR-014)

**Input**:
```
p_certification_id  uuid    REQUIRED
p_action            text    REQUIRED ('approve' | 'return')
p_review_notes      text    NULLABLE (required when action = 'return')
```

**Returns**: `SETOF certifications` (the updated record)

**Validation**:
1. `auth.uid()` must be non-null
2. Certification must exist and have status = 'recommended'
3. Caller must be a supervisor in the certification's program
4. Caller MUST NOT be the same user as `teacher_id` (FR-018: no self-approval)
5. If action = 'return', `p_review_notes` must be non-empty

**State transitions**:
- approve: `recommended` → `supervisor_approved`, sets `reviewed_by = auth.uid()`
- return: `recommended` → `returned`, sets `review_notes`

**Errors**:
- `CERT_NOT_FOUND` — certification doesn't exist
- `CERT_INVALID_STATUS` — not in 'recommended' status
- `CERT_NOT_SUPERVISOR` — caller is not supervisor in this program
- `CERT_SELF_APPROVAL` — caller is the recommending teacher (FR-018)
- `CERT_RETURN_NOTES_REQUIRED` — return action without notes

---

## RPC-003: resubmit_certification

**Caller**: Teacher
**Purpose**: Re-submit a returned certification after addressing feedback (Clarification Q1)

**Input**:
```
p_certification_id  uuid    REQUIRED
p_notes             text    NULLABLE (updated notes)
p_title             text    NULLABLE (updated title, keeps original if null)
p_title_ar          text    NULLABLE
```

**Returns**: `SETOF certifications` (the updated record)

**Validation**:
1. `auth.uid()` must be non-null
2. Certification must exist and have status = 'returned'
3. Caller must be the original recommending teacher (`teacher_id = auth.uid()`)

**State transitions**:
- `returned` → `recommended`, clears `review_notes`, updates `notes`/`title` if provided

**Errors**:
- `CERT_NOT_FOUND`
- `CERT_INVALID_STATUS` — not in 'returned' status
- `CERT_NOT_TEACHER` — caller is not the recommending teacher

---

## RPC-004: issue_certification

**Caller**: Program Admin
**Purpose**: Issue or reject a supervisor-approved certification (FR-002, FR-003)

**Input**:
```
p_certification_id      uuid    REQUIRED
p_action                text    REQUIRED ('issue' | 'reject')
p_chain_of_narration    text    NULLABLE (for Qiraat ijazah)
p_review_notes          text    NULLABLE (required when action = 'reject')
```

**Returns**: `SETOF certifications` (the updated record)

**Validation**:
1. `auth.uid()` must be non-null
2. Certification must exist and have status = 'supervisor_approved'
3. Caller must be a program admin in the certification's program (FR-013)
4. Caller MUST NOT be the same user as `teacher_id` (FR-018: no self-approval)
5. If action = 'reject', `p_review_notes` must be non-empty

**State transitions**:
- issue: `supervisor_approved` → `issued`, generates `certificate_number` from sequence, sets `issued_by`, `issue_date`
- reject: `supervisor_approved` → `rejected`, sets `review_notes`

**Certificate number generation**:
```sql
'WRT-' || extract(year from now())::text || '-' || lpad(nextval('certification_number_seq')::text, 5, '0')
```

**Errors**:
- `CERT_NOT_FOUND`
- `CERT_INVALID_STATUS`
- `CERT_NOT_PROGRAM_ADMIN`
- `CERT_REJECT_NOTES_REQUIRED`

---

## RPC-005: revoke_certification

**Caller**: Master Admin or Program Admin (own program)
**Purpose**: Revoke an issued certificate (FR-012)

**Input**:
```
p_certification_id      uuid    REQUIRED
p_revocation_reason     text    REQUIRED
```

**Returns**: `SETOF certifications` (the updated record)

**Validation**:
1. `auth.uid()` must be non-null
2. Certification must exist and have status = 'issued'
3. Caller must be either:
   - master_admin (any program), OR
   - program_admin in the certification's program
4. `p_revocation_reason` must be non-empty

**State transitions**:
- `issued` → `revoked`, sets `revoked_by`, `revoked_at`, `revocation_reason`

**Errors**:
- `CERT_NOT_FOUND`
- `CERT_INVALID_STATUS`
- `CERT_NOT_AUTHORIZED` — caller lacks permission
- `CERT_REASON_REQUIRED`

---

## RPC-006: get_certification_pipeline

**Caller**: Program Admin
**Purpose**: Get counts of certifications at each workflow stage for a program (FR-017)

**Input**:
```
p_program_id    uuid    REQUIRED
```

**Returns**: `json`

**Output shape**:
```json
{
  "recommended": 3,
  "supervisor_approved": 1,
  "issued": 25,
  "returned": 2,
  "rejected": 1,
  "revoked": 0,
  "total": 32
}
```

**Validation**:
1. `auth.uid()` must be non-null
2. Caller must be program admin or master admin

---

## RPC-007: get_certification_queue

**Caller**: Supervisor or Program Admin
**Purpose**: Get pending certifications for review (FR-016)

**Input**:
```
p_program_id    uuid    REQUIRED
p_role          text    REQUIRED ('supervisor' | 'program_admin')
```

**Returns**: `TABLE(id uuid, student_name text, student_avatar text, teacher_name text, program_name text, track_name text, type text, status text, title text, created_at timestamptz)`

**Behavior**:
- If role = 'supervisor': returns certifications with status = 'recommended' where teacher is supervised by caller
- If role = 'program_admin': returns certifications with status = 'supervisor_approved' in the program

---

## Edge Function: verify-certificate

**Method**: GET
**Path**: `/functions/v1/verify-certificate?number=WRT-2026-00001`
**Auth**: None (public endpoint)
**CORS**: Enabled (Access-Control-Allow-Origin: *)
**Rate Limit**: Max 30 requests per minute per IP (FR-011). Returns 429 Too Many Requests when exceeded.
**Status Filter**: Only returns data for "issued" and "revoked" statuses. All other statuses return 404 "Certificate not found."

**Input**: Query parameter `number` (certificate number)

**Response (200 — found)**:
```json
{
  "valid": true,
  "certificate": {
    "holder_name": "Ahmed Al-Rashid",
    "program": "Quranic Readings (القراءات)",
    "track": "Hafs from Asim (حفص عن عاصم)",
    "type": "ijazah",
    "title": "إجازة في رواية حفص عن عاصم",
    "issue_date": "2026-03-06",
    "certificate_number": "WRT-2026-00001",
    "issued_by": "WeReciteTogether (نتلو معاً)"
  }
}
```

**Response (200 — revoked)**:
```json
{
  "valid": false,
  "status": "revoked",
  "revoked_at": "2026-04-01",
  "certificate": { ... }
}
```

**Response (404 — not found)**:
```json
{
  "valid": false,
  "error": "Certificate not found"
}
```

**Privacy**: If the certification's program is the Children's Program, `holder_name` returns first name + last initial (e.g., "Ahmed K.") instead of full name (FR-011, Clarification Q2).
