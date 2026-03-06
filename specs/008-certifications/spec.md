# Feature Specification: Certification System (Ijazah)

**Feature Branch**: `008-certifications`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Certification system (Ijazah) — digital certificate issuance, teacher recommendation, multi-level approval workflow, certificate generation, and public verification"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher Recommends Student for Certification (Priority: P1)

A teacher who has been working with a student in a structured program determines the student has completed their curriculum (e.g., finished memorizing a full riwayah, completed a matn, or graduated from an Arabic language track). The teacher opens the student's profile within their program, reviews the student's progress, and submits a formal recommendation for certification. The recommendation includes a certification type (ijazah, graduation, or completion), a title, and optional notes describing the student's achievement.

**Why this priority**: The recommendation is the entry point for the entire certification workflow. Without it, no certifications can be initiated. Teachers are the primary gatekeepers of academic quality.

**Independent Test**: Can be tested by having a teacher open a student's detail screen, tap "Recommend for Certification," fill in the recommendation form, and submit. The recommendation should appear in the supervisor's and program admin's review queues.

**Acceptance Scenarios**:

1. **Given** a teacher has an assigned student in a structured program, **When** the teacher opens the student detail screen, **Then** a "Recommend for Certification" action is visible.
2. **Given** the teacher taps "Recommend for Certification," **When** the form is displayed, **Then** it shows fields for certification type, title, and optional notes, pre-filled with program and track context.
3. **Given** the teacher fills in the recommendation form and submits, **When** the submission succeeds, **Then** a certification record is created with status "recommended," and the teacher receives a confirmation message.
4. **Given** a certification recommendation already exists for the same student in the same program/track, **When** the teacher tries to recommend again, **Then** the system prevents duplicate recommendations and shows an informative message about the existing one.

---

### User Story 2 - Supervisor Reviews Recommendation (Priority: P2)

A supervisor responsible for a group of teachers receives notification that one of their teachers has submitted a certification recommendation. The supervisor opens their certification review queue, sees pending recommendations from their teachers, reviews the student's progress data and the teacher's notes, and either approves (forwarding to the program admin) or returns the recommendation to the teacher with feedback.

**Why this priority**: The supervisor review is the quality gate between teacher recommendation and program admin approval. It ensures consistency and prevents premature certifications.

**Independent Test**: Can be tested by creating a recommendation (from US1), then logging in as the supervisor to see it in their review queue, reviewing the details, and approving or returning it.

**Acceptance Scenarios**:

1. **Given** a teacher has submitted a certification recommendation for a student under this supervisor, **When** the supervisor opens their certification review queue, **Then** the pending recommendation is listed with student name, teacher name, program, track, and certification type.
2. **Given** the supervisor taps a pending recommendation, **When** the detail screen loads, **Then** it shows the student's enrollment details (program, track, enrollment date), the teacher's recommendation notes, and the certification details.
3. **Given** the supervisor reviews a recommendation and taps "Approve," **When** the action completes, **Then** the certification status changes to "supervisor_approved" and appears in the program admin's approval queue.
4. **Given** the supervisor reviews a recommendation and taps "Return to Teacher," **When** they add feedback notes and confirm, **Then** the certification status changes to "returned" and the teacher is notified with the feedback.
5. **Given** a returned certification, **When** the teacher reviews the feedback and re-submits the recommendation (may update title, title_ar, and notes), **Then** the same certification record's status changes back to "recommended," previous review notes are cleared, and it re-enters the supervisor's review queue.

---

### User Story 3 - Program Admin Approves and Issues Certificate (Priority: P2)

A program admin sees supervisor-approved certification requests in their approval queue. They review the recommendation, verify the student's eligibility, and issue the formal certification. Upon issuance, the system generates a unique certificate number, records the issue date, and creates the digital certificate. For Qiraat program (Program 4) certifications, the program admin also enters the chain of narration (sanad).

**Why this priority**: This is the final approval step that results in an actual issued certificate. Without it, the workflow is incomplete. Tied with US2 as both are needed for end-to-end flow.

**Independent Test**: Can be tested by creating a supervisor-approved recommendation, then logging in as program admin to review and issue it. The certificate should appear in the student's profile.

**Acceptance Scenarios**:

1. **Given** a supervisor has approved a certification recommendation, **When** the program admin opens their certification approval queue, **Then** the approved recommendation is listed with all context (student, teacher, supervisor who approved, program, track).
2. **Given** the program admin taps a pending approval, **When** the detail screen loads, **Then** it shows complete certification details, student enrollment info, and for Qiraat programs, a field for chain of narration (sanad).
3. **Given** the program admin reviews and taps "Issue Certificate," **When** the action completes, **Then** the certification status changes to "issued," a unique certificate number is generated, the issue date is recorded, and the student receives a notification.
4. **Given** the program admin decides to reject the certification, **When** they add rejection notes and confirm, **Then** the certification status changes to "rejected" and both the teacher and supervisor are notified with the reason.

---

### User Story 4 - Student Views and Shares Certificates (Priority: P3)

A student who has been issued a certification can view it in their profile under a "Certificates" section. The certificate is displayed as a beautifully designed digital card showing the certification title, type, issuing authority, teacher name, program, issue date, and certificate number. The student can share the certificate as an image and access a QR code that links to a public verification page.

**Why this priority**: This is the student-facing result of the entire workflow. Important for user satisfaction and engagement, but the backend workflow (US1-3) must work first.

**Independent Test**: Can be tested by issuing a certificate (from US1-3 flow), then logging in as the student to view and interact with the certificate in their profile.

**Acceptance Scenarios**:

1. **Given** a student has at least one issued certification, **When** they open their profile or certificates section, **Then** they see a list of their earned certificates with title, program, and issue date.
2. **Given** the student taps a certificate, **When** the certificate detail screen loads, **Then** it displays a beautifully designed certificate card with: title (Arabic), certification type, student name, teacher name, program name, issue date, certificate number, and for Qiraat ijazah the chain of narration.
3. **Given** the student taps "Share," **When** the share action triggers, **Then** the certificate is exported as a shareable image via the device's native share sheet.
4. **Given** the certificate detail is open, **When** the student views the QR code section, **Then** a QR code is displayed that encodes a public verification URL containing the certificate number.

---

### User Story 5 - Public Certificate Verification (Priority: P3)

Anyone with a certificate number or QR code can verify the authenticity of an issued certificate. Scanning the QR code or entering the certificate number on a public verification page shows the certificate details (student name, program, certification type, issue date, issuing institution) confirming it is genuine.

**Why this priority**: Verification adds credibility to the certification system. It's a value-add that builds trust but isn't required for core functionality.

**Independent Test**: Can be tested by obtaining a certificate number from an issued certificate, then accessing the public verification URL to confirm the certificate details are displayed.

**Acceptance Scenarios**:

1. **Given** a valid certificate number for an adult student, **When** a user accesses the verification page with that number, **Then** the page displays the certificate holder's full name, program, certification type, issue date, and issuing institution.
2. **Given** a valid certificate number for a minor (Children's Program), **When** a user accesses the verification page, **Then** the page displays the holder's first name + last initial (e.g., "Ahmed K."), program, certification type, issue date, and issuing institution.
3. **Given** an invalid or non-existent certificate number, **When** a user attempts verification, **Then** the page displays a clear "Certificate not found" message.
4. **Given** a revoked certificate number, **When** a user attempts verification, **Then** the page displays that the certificate has been revoked with the revocation date.

---

### User Story 6 - Master Admin Certification Oversight (Priority: P4)

A master admin can view all certifications issued across all programs, filter by program, certification type, date range, and status. They can also revoke a certificate if needed (e.g., fraud discovered). Revocation records a reason and notifies the student and program admin. Program admins can also revoke certificates within their own program from their certification pipeline view.

**Why this priority**: Platform-wide oversight is important for governance but is an admin tool used less frequently than the core workflow.

**Independent Test**: Can be tested by logging in as master admin, browsing the certifications list with filters, and performing a revocation on a test certificate.

**Acceptance Scenarios**:

1. **Given** a master admin opens the certifications management screen, **When** the screen loads, **Then** it displays a list of all certifications across all programs with status, student name, program, and issue date.
2. **Given** the master admin applies filters (by program, type, status, or date range), **When** the filters are applied, **Then** the list updates to show only matching certifications.
3. **Given** the master admin selects an issued certificate and taps "Revoke," **When** they enter a revocation reason and confirm, **Then** the certification status changes to "revoked," the revocation date and reason are recorded, and the student and program admin are notified.
4. **Given** a program admin views an issued certificate in their certification pipeline, **When** they tap "Revoke" and enter a reason, **Then** the certificate is revoked and the student is notified. Program admins can only revoke certificates within their own program.

---

### Edge Cases

- What happens when a teacher recommends a student who is no longer enrolled in the program? The system checks active enrollment before allowing the recommendation.
- What happens when a supervisor who approved a recommendation is later removed from the program? The approval stands; the certification workflow continues to the program admin.
- What happens when a program admin tries to issue a certificate for a program they don't manage? The system enforces program-scoped access and denies the action.
- What happens when two teachers independently recommend the same student for the same certification? The system prevents duplicates at the data level (unique constraint on student + program + track + active status).
- What happens when a certificate is revoked but the student has already shared the image? The QR code verification will show "revoked" status, providing transparency.
- What happens when the chain of narration (sanad) is very long? The system supports multi-line text input with a reasonable character limit (2000 characters).
- What happens when a certification is returned to the teacher? The teacher can review supervisor feedback, update the recommendation, and re-submit. The same record is reused (status cycles returned → recommended).
- What happens when a certification is rejected by the program admin? Rejection is final for that record. The teacher must create a new certification recommendation if the student becomes eligible later.
- What happens when two reviewers try to act on the same certification simultaneously (e.g., one approves while another returns)? The system enforces the current status before applying a transition. If the status has already changed, the second action fails with an error message indicating the certification has been updated.
- What happens if a user holds multiple roles (e.g., teacher + supervisor) and tries to approve their own recommendation? The system MUST prevent self-approval — no user may review or approve a certification they themselves recommended.
- What happens if someone tries to revoke a certificate that was already revoked? The system rejects the action since "revoked" is a terminal status with no further transitions allowed.
- What happens when a certificate number is queried via public verification but the certificate is in a non-issued status (e.g., recommended, supervisor_approved)? The verification endpoint only returns data for "issued" and "revoked" statuses. All other statuses return "Certificate not found."

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow teachers to submit certification recommendations for their assigned students in structured programs.
- **FR-002**: System MUST enforce a multi-step approval workflow: teacher recommends, supervisor reviews, program admin issues.
- **FR-003**: System MUST generate a unique, sequential certificate number for each issued certification (format: WRT-YYYY-NNNNN).
- **FR-004**: System MUST support three certification types: ijazah, graduation, and completion.
- **FR-005**: System MUST store chain of narration (sanad) for Qiraat program certifications.
- **FR-006**: System MUST prevent duplicate active certifications for the same student in the same program and track. Records with "rejected" status are excluded from this constraint, allowing new attempts after rejection.
- **FR-007**: System MUST notify relevant parties at each workflow transition per this matrix: (a) recommended → notify supervisor, (b) supervisor_approved → notify program admin, (c) returned → notify teacher, (d) issued → notify student, (e) rejected → notify teacher and supervisor, (f) revoked → notify student, teacher, and program admin (if revoked by master admin).
- **FR-008**: System MUST display issued certificates in the student's profile with all relevant details.
- **FR-009**: System MUST allow students to share certificates as images via the device's native share functionality.
- **FR-010**: System MUST generate a QR code on each certificate that links to a public verification page.
- **FR-011**: System MUST provide a public verification endpoint that displays certificate details when given a valid certificate number. The endpoint MUST only return data for certificates with "issued" or "revoked" status; all other statuses return "Certificate not found." For minors (Children's Program), the displayed name MUST be abbreviated to first name + last initial to protect privacy. The endpoint MUST enforce rate limiting (max 30 requests per minute per IP) to prevent enumeration attacks.
- **FR-012**: System MUST support certificate revocation by master admins (any program) and program admins (own program only) with a recorded reason.
- **FR-013**: System MUST enforce program-scoped access for program admins issuing certificates.
- **FR-014**: System MUST allow supervisors to return recommendations to teachers with feedback notes.
- **FR-015**: System MUST check that a student is actively enrolled in the program before allowing a certification recommendation.
- **FR-016**: System MUST provide review queues for supervisors (pending recommendations) and program admins (supervisor-approved recommendations).
- **FR-017**: System MUST display a certification pipeline view for program admins showing counts at each workflow stage.
- **FR-018**: System MUST prevent self-approval — no user may review, approve, or issue a certification that they themselves recommended, regardless of what other roles they hold.
- **FR-019**: Privacy name masking (first name + last initial for minors) applies only to the public verification endpoint. In-app displays show the full student name to authorized users. Shared certificate images include the full name since sharing is initiated by the student or their guardian.
- **FR-020**: Revocation is a terminal status. A revoked certificate MUST NOT be un-revoked or re-issued. If a revocation was made in error, the teacher must start a new recommendation.

### Key Entities

- **Certification**: A formal record of a student's achievement in a program or track. Has a lifecycle with exactly 6 valid transitions: (1) recommended → supervisor_approved, (2) recommended → returned, (3) returned → recommended (re-submission), (4) supervisor_approved → issued, (5) supervisor_approved → rejected, (6) issued → revoked. All other transitions are invalid and MUST be rejected by the system. Rejected and revoked are terminal statuses — no further transitions are allowed. The uniqueness constraint (student + program + track) excludes records with "rejected" status, allowing re-attempts after rejection. Contains student, teacher, program, track, type, title, certificate number, chain of narration (for Qiraat), and metadata.
- **Certification Type**: One of three types — ijazah (religious scholarly license with chain of narration), graduation (completing a structured curriculum), or completion (finishing a defined course of study).
- **Certificate Number**: A unique, auto-generated identifier for each issued certification (format: WRT-YYYY-NNNNN), used for public verification.
- **Chain of Narration (Sanad)**: For Qiraat certifications, the unbroken chain of teachers back to the Prophet, linking the student to the original oral transmission. Stored as free text.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can submit a certification recommendation in under 2 minutes.
- **SC-002**: The complete certification workflow (recommend → review → issue) can be completed within 24 hours when all approvers are available.
- **SC-003**: 100% of issued certificates have a unique, verifiable certificate number.
- **SC-004**: Public certificate verification returns results in under 3 seconds.
- **SC-005**: Students can share a certificate image within 2 taps from the certificate detail screen.
- **SC-006**: Program admins can view their complete certification pipeline (all statuses) in a single screen.
- **SC-007**: The system prevents 100% of duplicate certification attempts for the same student, program, and track combination.
- **SC-008**: Revoked certificates show "revoked" status on the public verification page within 1 minute of revocation.

## Clarifications

### Session 2026-03-06

- Q: When a certification is returned or rejected, can the teacher re-submit, and does the original record get updated or is a new record created? → A: Return = same record re-submitted (status cycles returned → recommended). Reject = final, teacher must create a new record for any future attempt.
- Q: Should the public verification page display the student's full name or mask it for privacy? → A: Full name for adults, first name + last initial for minors (Children's Program).
- Q: Should program admins also be able to revoke certificates within their own program? → A: Yes. Both master admins (any program) and program admins (own program only) can revoke.

## Assumptions

- Structured programs (Qiraat, Mutoon structured, Arabic Language, Quran Memorization) are the only programs that issue certifications. Free and drop-in programs do not have certifications.
- The chain of narration (sanad) is a free-text field entered by the program admin, not a structured data model. The platform does not validate the chain's authenticity.
- Certificate image generation for sharing uses a client-side rendering approach (capturing a styled view as an image) rather than server-side PDF generation.
- The public verification page is a simple web-accessible endpoint that queries the certification record by certificate number. No authentication is required for verification.
- Notifications for certification workflow events use the existing push notification infrastructure (send-notification edge function).
- The certification workflow is linear: a recommendation must pass through supervisor review before reaching the program admin.
- Certificate numbers follow the format WRT-YYYY-NNNNN (prefix, year of issuance, zero-padded sequential number). The numeric sequence is global and never resets — it increments monotonically across years. The year portion reflects when the certificate was issued, not the sequence cycle (e.g., WRT-2026-00001, WRT-2026-00002, WRT-2027-00003).
- The app supports bilingual certificate display (Arabic and English).
