# Quickstart Scenarios: Certification System (Ijazah)

## Prerequisites

- App running locally via `npx expo start`
- Supabase migration `00010_certifications.sql` applied
- Test data: at least one structured program with a teacher, supervisor, program admin, and enrolled student
- Edge function `verify-certificate` deployed locally or remotely

---

## QS-1: Teacher Submits Certification Recommendation

**Actor**: Teacher
**Route**: `/(teacher)/students/[id]/recommend`

1. Log in as a teacher who has assigned students in a structured program
2. Navigate to a student's detail screen
3. Tap "Recommend for Certification"
4. Fill in: type = "ijazah", title = "إجازة في رواية حفص عن عاصم"
5. Add optional notes: "Student has completed the full riwayah with excellent tajweed"
6. Submit the recommendation

**Expected**:
- Success message displayed
- Certification record created with status = "recommended"
- Notification sent to the student's supervisor

**Verify**: Query `certifications` table — new row with status = 'recommended', teacher_id matches logged-in teacher

---

## QS-2: Duplicate Recommendation Prevention

**Actor**: Teacher
**Route**: `/(teacher)/students/[id]/recommend`

1. Using the same teacher and student from QS-1
2. Tap "Recommend for Certification" again

**Expected**:
- System shows message that an active recommendation already exists
- No new record created

**Verify**: Only one row in `certifications` for this student + program + track

---

## QS-3: Supervisor Reviews and Approves

**Actor**: Supervisor
**Route**: `/(supervisor)/certifications`

1. Log in as the supervisor for the teacher from QS-1
2. Open the Certifications tab / review queue
3. See the pending recommendation from QS-1
4. Tap to open detail — verify student progress summary and teacher notes are shown
5. Tap "Approve"

**Expected**:
- Status changes to "supervisor_approved"
- Recommendation moves to program admin's queue
- reviewed_by set to supervisor's ID

---

## QS-4: Supervisor Returns Recommendation

**Actor**: Supervisor
**Route**: `/(supervisor)/certifications/[id]`

1. Create a new recommendation (different student or reset QS-1)
2. Log in as supervisor, open the pending recommendation
3. Tap "Return to Teacher"
4. Enter feedback: "Please include more detail about the student's final exam"
5. Confirm

**Expected**:
- Status changes to "returned"
- Teacher is notified with feedback
- review_notes populated

---

## QS-5: Teacher Re-submits Returned Recommendation

**Actor**: Teacher
**Route**: `/(teacher)/students/[id]` or a returned cert detail screen

1. Log in as the teacher from QS-4
2. See the returned certification with supervisor feedback
3. Update notes addressing the feedback
4. Tap "Re-submit"

**Expected**:
- Status changes back to "recommended"
- Re-enters supervisor review queue
- review_notes cleared, notes updated

---

## QS-6: Program Admin Issues Certificate

**Actor**: Program Admin
**Route**: `/(program-admin)/certifications`

1. Log in as program admin for the program
2. Open the certifications approval queue
3. See the supervisor-approved recommendation
4. Tap to open detail
5. For Qiraat program: enter chain of narration (sanad)
6. Tap "Issue Certificate"

**Expected**:
- Status changes to "issued"
- Certificate number generated (e.g., WRT-2026-00001)
- issue_date set
- issued_by set to program admin's ID
- Student receives push notification

**Verify**: Certificate number is unique and follows WRT-YYYY-NNNNN format

---

## QS-7: Program Admin Views Pipeline

**Actor**: Program Admin
**Route**: `/(program-admin)/certifications`

1. Log in as program admin
2. View the certifications screen — should show pipeline counts at top
3. Verify counts match: recommended, supervisor_approved, issued, returned, rejected, revoked, total

**Expected**:
- Pipeline bar shows accurate counts for each status
- Tapping a status filters the list to that status

---

## QS-8: Student Views Earned Certificate

**Actor**: Student
**Route**: `/(student)/certificates`

1. Log in as the student who was issued a certificate in QS-6
2. Navigate to certificates section (profile or dedicated tab)
3. See the issued certificate in the list
4. Tap to open the certificate detail

**Expected**:
- Certificate card displays: title (Arabic), type, student name, teacher name, program, issue date, certificate number
- For Qiraat: chain of narration displayed
- QR code visible with verification URL

---

## QS-9: Student Shares Certificate as Image

**Actor**: Student
**Route**: `/(student)/certificates/[id]`

1. Open the certificate detail from QS-8
2. Tap "Share"
3. Native share sheet opens

**Expected**:
- Certificate view captured as image
- Share sheet shows the image ready to share
- Image includes all certificate details and QR code

---

## QS-10: Public Certificate Verification (Valid)

**Actor**: Anyone (unauthenticated)
**Endpoint**: `verify-certificate?number=WRT-2026-00001`

1. Copy the certificate number from QS-6
2. Access the verification URL (via browser or curl)

**Expected**:
- Response shows `valid: true`
- Displays: holder name, program, track, type, title, issue date, certificate number
- For adult students: full name shown
- For Children's Program students: first name + last initial

---

## QS-11: Public Certificate Verification (Invalid)

**Endpoint**: `verify-certificate?number=WRT-9999-99999`

1. Access verification with a non-existent certificate number

**Expected**:
- Response shows `valid: false, error: "Certificate not found"`

---

## QS-12: Program Admin Rejects Certification

**Actor**: Program Admin
**Route**: `/(program-admin)/certifications/[id]`

1. Create and supervisor-approve a new recommendation
2. Log in as program admin
3. Open the pending approval
4. Tap "Reject"
5. Enter reason: "Student has not completed all required sections"
6. Confirm

**Expected**:
- Status changes to "rejected"
- Teacher and supervisor notified with rejection reason
- Teacher can create a new recommendation later (different record)

---

## QS-13: Master Admin Revokes Certificate

**Actor**: Master Admin
**Route**: `/(master-admin)/certifications`

1. Log in as master admin
2. Open the certifications management screen
3. Filter by status = "issued"
4. Select the certificate from QS-6
5. Tap "Revoke"
6. Enter reason: "Discovered irregularity in examination process"
7. Confirm

**Expected**:
- Status changes to "revoked"
- revoked_at, revoked_by, revocation_reason recorded
- Student and program admin notified

---

## QS-14: Verify Revoked Certificate

**Endpoint**: `verify-certificate?number=WRT-2026-00001`

1. After QS-13, access the same verification URL

**Expected**:
- Response shows `valid: false, status: "revoked"`
- revoked_at date included
- Certificate details still shown (for context)

---

## QS-15: Program Admin Revokes Own Program Certificate

**Actor**: Program Admin
**Route**: `/(program-admin)/certifications/[id]`

1. Log in as program admin
2. View an issued certificate in their program
3. Tap "Revoke" and enter reason
4. Confirm

**Expected**:
- Revocation succeeds for own program
- Student notified

---

## QS-16: Master Admin Oversight with Filters

**Actor**: Master Admin
**Route**: `/(master-admin)/certifications`

1. Log in as master admin
2. Open certifications management
3. Apply filter: program = "القراءات"
4. Apply filter: type = "ijazah"
5. Apply filter: status = "issued"

**Expected**:
- List shows only matching certifications
- Counts update with filters
- Can clear filters to see all

---

## QS-17: Enrollment Check Enforcement

**Actor**: Teacher
**Route**: `/(teacher)/students/[id]/recommend`

1. Find or create a student who is NOT enrolled (or has dropped) from the program
2. Attempt to recommend for certification

**Expected**:
- System blocks the recommendation
- Error message: student is not actively enrolled in this program
