# Data Model: Certification System (Ijazah)

## Entity Diagram

```
profiles (existing)
    │
    ├─── student_id ──────┐
    ├─── teacher_id ──────┤
    ├─── issued_by ───────┤
    ├─── reviewed_by ─────┤
    └─── revoked_by ──────┤
                          │
programs (existing) ──────┤
    │                     │
program_tracks (existing)─┤
    │                     │
enrollments (existing) ◄──┼─── enrollment check before recommendation
                          │
                   certifications (NEW)
                          │
                          ├── id (PK)
                          ├── student_id (FK → profiles)
                          ├── teacher_id (FK → profiles)
                          ├── program_id (FK → programs)
                          ├── track_id (FK → program_tracks, nullable)
                          ├── type (ijazah | graduation | completion)
                          ├── status (recommended | supervisor_approved | issued | returned | rejected | revoked)
                          ├── title (text)
                          ├── title_ar (text, nullable)
                          ├── notes (text, nullable) — teacher's recommendation notes
                          ├── review_notes (text, nullable) — supervisor/admin feedback
                          ├── chain_of_narration (text, nullable) — sanad for Qiraat
                          ├── certificate_number (text, unique, nullable) — generated on issuance
                          ├── issued_by (FK → profiles, nullable) — program admin who issued
                          ├── reviewed_by (FK → profiles, nullable) — supervisor who reviewed
                          ├── issue_date (timestamptz, nullable) — when issued
                          ├── revoked_by (FK → profiles, nullable)
                          ├── revoked_at (timestamptz, nullable)
                          ├── revocation_reason (text, nullable)
                          ├── metadata (jsonb, default '{}') — riwayah, matn name, etc.
                          ├── created_at (timestamptz, default now())
                          └── updated_at (timestamptz, default now())
```

## Table Definition

### certifications (NEW)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, DEFAULT gen_random_uuid() | |
| student_id | uuid | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Student who earned the cert |
| teacher_id | uuid | NOT NULL, FK → profiles(id) ON DELETE CASCADE | Teacher who recommended |
| program_id | uuid | NOT NULL, FK → programs(id) ON DELETE CASCADE | Program scoping (Constitution I) |
| track_id | uuid | FK → program_tracks(id) ON DELETE SET NULL, nullable | Track within program (nullable for trackless programs) |
| type | text | NOT NULL, CHECK (type IN ('ijazah', 'graduation', 'completion')) | Certification type (FR-004) |
| status | text | NOT NULL, DEFAULT 'recommended', CHECK (status IN ('recommended', 'supervisor_approved', 'issued', 'returned', 'rejected', 'revoked')) | Workflow state |
| title | text | NOT NULL | Certificate title in English |
| title_ar | text | nullable | Certificate title in Arabic |
| notes | text | nullable | Teacher's recommendation notes |
| review_notes | text | nullable | Supervisor/admin feedback (used for return/reject) |
| chain_of_narration | text | nullable, CHECK (length(chain_of_narration) <= 2000) | Sanad for Qiraat certs (FR-005) |
| certificate_number | text | UNIQUE, nullable | Generated on issuance: WRT-YYYY-NNNNN (FR-003) |
| issued_by | uuid | FK → profiles(id) ON DELETE SET NULL, nullable | Program admin who issued |
| reviewed_by | uuid | FK → profiles(id) ON DELETE SET NULL, nullable | Supervisor who reviewed |
| issue_date | timestamptz | nullable | When status changed to 'issued' |
| revoked_by | uuid | FK → profiles(id) ON DELETE SET NULL, nullable | Who revoked |
| revoked_at | timestamptz | nullable | When revoked |
| revocation_reason | text | nullable | Why revoked (FR-012) |
| metadata | jsonb | NOT NULL, DEFAULT '{}' | Flexible: riwayah name, matn name, etc. |
| created_at | timestamptz | NOT NULL, DEFAULT now() | |
| updated_at | timestamptz | NOT NULL, DEFAULT now() | |

### Indexes

| Name | Columns | Type | Condition |
|------|---------|------|-----------|
| certifications_active_unique | (student_id, program_id, COALESCE(track_id, '00000000-...')) | UNIQUE (partial) | WHERE status NOT IN ('rejected') |
| certifications_student_idx | (student_id) | B-tree | — |
| certifications_program_status_idx | (program_id, status) | B-tree | — |
| certifications_certificate_number_idx | (certificate_number) | UNIQUE | WHERE certificate_number IS NOT NULL |
| certifications_teacher_idx | (teacher_id) | B-tree | — |

### Sequence

```sql
CREATE SEQUENCE certification_number_seq START 1;
```

### Updated_at Trigger

```sql
CREATE TRIGGER certifications_updated_at
BEFORE UPDATE ON certifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## State Machine

```
                    ┌──────────────┐
                    │ recommended  │ ◄──────────────────────┐
                    └──────┬───────┘                        │
                           │                                │
              ┌────────────┼─────────────┐                  │
              ▼                          ▼                  │
    ┌──────────────────┐       ┌──────────────┐             │
    │supervisor_approved│       │   returned   │ ────────────┘
    └────────┬─────────┘       └──────────────┘  (teacher re-submits)
             │
    ┌────────┼─────────────┐
    ▼                      ▼
┌────────┐          ┌───────────┐
│ issued │          │ rejected  │  (final)
└────┬───┘          └───────────┘
     │
     ▼
┌─────────┐
│ revoked │  (final)
└─────────┘
```

**Valid transitions** (enforced by RPC functions):
- recommended → supervisor_approved
- recommended → returned
- returned → recommended (re-submission)
- supervisor_approved → issued
- supervisor_approved → rejected
- issued → revoked

## RLS Policies

| Policy | Role(s) | Operation | Condition |
|--------|---------|-----------|-----------|
| Students view own certs | student | SELECT | `student_id = auth.uid() AND status = 'issued'` |
| Teachers view/insert own recommendations | teacher | SELECT, INSERT | `teacher_id = auth.uid()` |
| Teachers update returned certs | teacher | UPDATE | `teacher_id = auth.uid() AND status = 'returned'` |
| Supervisors view program certs | supervisor | SELECT | `program_id IN (SELECT program_id FROM program_roles WHERE profile_id = auth.uid() AND role = 'supervisor')` |
| Program admins full access own program | program_admin | SELECT, UPDATE | `program_id IN (SELECT program_id FROM program_roles WHERE profile_id = auth.uid() AND role = 'program_admin')` |
| Master admins full access | master_admin | ALL | `(SELECT role FROM profiles WHERE id = auth.uid()) = 'master_admin'` |

## Relationships to Existing Tables

- `profiles`: FK for student_id, teacher_id, issued_by, reviewed_by, revoked_by
- `programs`: FK for program_id (Constitution Principle I scoping)
- `program_tracks`: FK for track_id (optional — some programs have no tracks)
- `enrollments`: Checked programmatically before allowing recommendation (FR-015) — no FK, just a query check in the RPC function
