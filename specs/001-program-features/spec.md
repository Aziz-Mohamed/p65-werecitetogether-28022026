# Feature Specification: Program-Specific Features

**Feature Branch**: `001-program-features`
**Created**: 2026-03-01
**Status**: Draft
**Input**: PRD WeReciteTogether v1.2 — remaining Phase 2/3 features not covered by 001-platform-core

## Context

The core platform (001-platform-core) delivered: 5-role RBAC, enrollment, sessions, teacher availability, queue/waitlist, ratings, voice memos, memorization with SM-2, notifications, and realtime. This spec covers the **program-specific features** that remain unimplemented from the PRD:

1. Certification/Ijazah system (PRD 4.6)
2. Himam Quranic Marathon event management (PRD 3, Program 8)
3. Mutoon (Islamic Texts) progress tracking (PRD 3, Program 5)
4. Qiraat (Quranic Readings) per-Riwayah tracking (PRD 3, Program 4)
5. Arabic Language program tracking (PRD 3, Program 6)
6. Children's program with guardian management (PRD 3, Program 2)
7. Student-to-student pairing for alternating recitation (PRD 3, Program 1 Section 2)
8. Digital certificate generation (PRD 4.6)

## Clarifications

### Session 2026-03-01

- Q: How do guardians receive notifications — through the child's device or independently? → A: Guardians share the child's account and device. Notifications go to the child's registered push tokens. Per-guardian notification preferences are stored separately but all route to the same device.
- Q: After a certification request is rejected, can the teacher re-recommend the same student? → A: Yes. Rejection includes a mandatory reason. The teacher sees the rejection with feedback and can re-recommend after addressing it. Students see only issued certificates, never rejected requests.
- Q: How is the total section/recitation count per track defined? → A: Pre-defined in the track's curriculum metadata (program_tracks.curriculum JSONB) by program admins. Teachers select from the defined list. This ensures consistent completion percentage calculations. Note: the app uses "recitation" terminology consistently — not "lesson."
- Q: What format should the certificate number follow? → A: Org-year-sequential format: WRT-2026-00001. Human-readable, sortable by year, avoids cross-year collisions.
- Q: At what granularity are Qiraat sections tracked? → A: Per Juz' (30 sections per Riwayah). Standard Ijazah granularity, manageable UI, aligns with existing Quran memorization tracking.

## User Scenarios & Testing

### User Story 1 — Certification/Ijazah Issuance (Priority: P1)

A teacher recommends a student who has completed a structured program's curriculum for certification. The supervisor reviews the recommendation, then the program admin approves and issues a formal digital certificate (Ijazah). The student receives the certificate in-app, can view it in their certificates tab, and share it externally.

**Why this priority**: Certifications are the culmination of every structured program (Qiraat, Mutoon, Arabic Language, Quran Memorization). Without them, the programs have no formal completion outcome — the primary motivation for students in these programs.

**Independent Test**: Can be tested by creating a certification record for a student, displaying it in their certificates tab, and verifying the approval workflow (teacher recommends, supervisor reviews, program admin issues).

**Acceptance Scenarios**:

1. **Given** a student has completed all curriculum requirements in a structured program, **When** the teacher taps "Recommend for Certification" on the student's profile, **Then** a certification request is created with status "recommended" and the supervisor is notified.
2. **Given** a supervisor sees a certification recommendation, **When** they review the student's progress and tap "Approve", **Then** the request status changes to "supervisor_approved" and the program admin is notified.
3. **Given** a program admin sees a supervisor-approved certification request, **When** they review and tap "Issue Certificate", **Then** the system generates a certificate with a unique number, the student is notified, and the certificate appears in the student's certificates tab.
4. **Given** a student has a certificate, **When** they open the certificates tab, **Then** they see all earned certificates with title, program name, teacher name, issue date, and certificate number.
5. **Given** a student views a certificate detail, **When** they tap "Share", **Then** the system generates a shareable image of the certificate.
6. **Given** a Qiraat program certificate, **When** the program admin issues it, **Then** the certificate includes the chain of narration (سند) and the specific Riwayah name.
7. **Given** a supervisor or program admin rejects a certification request, **When** they submit the rejection with a mandatory reason, **Then** the teacher is notified with the rejection reason and can re-recommend the student. The student is not notified of the rejection.

---

### User Story 2 — Himam Quranic Marathon Events (Priority: P2)

Program admins create weekly Himam marathon events (Saturday Fajr-to-Fajr, 24 hours). Students enroll in a track based on their memorization level (3, 5, 10, 15, or 30 Juz'). The system pairs students as recitation partners. Partners select time slots within the event window, recite to each other via external meeting links, and log block completions in the app. The app tracks overall progress toward the goal.

**Why this priority**: Himam (Program 8) is a distinctive community-building feature that differentiates WeReciteTogether. It involves complex logistics (pairing, time slots, real-time progress) that make it a standalone deliverable.

**Independent Test**: Can be tested by creating an event, registering two students in the same track, pairing them, selecting time slots, and logging block completions until the track goal is met.

**Acceptance Scenarios**:

1. **Given** a program admin for Himam, **When** they create a new event with a date (Saturday), **Then** the event is created with status "upcoming" and a 24-hour window from Fajr to Fajr.
2. **Given** an upcoming Himam event, **When** a student browses the event detail, **Then** they see available tracks (3/5/10/15/30 Juz') and can register for one.
3. **Given** two students registered in the same track, **When** the admin or system runs partner matching, **Then** the two students are paired and both receive a notification with their partner's name.
4. **Given** a paired partnership, **When** partners open the event screen, **Then** they see a time-slot picker organized by prayer-time blocks and can agree on recitation slots.
5. **Given** a selected time slot, **When** both partners complete the recitation and one logs it, **Then** the block is marked as completed for both and the Juz' progress bar updates.
6. **Given** a student completes all Juz' in their track before the event ends, **Then** their status changes to "completed" and a congratulatory banner is shown.
7. **Given** the event's 24-hour window expires, **When** any student has not completed their track, **Then** their status changes to "incomplete" with a summary of what was completed.

---

### User Story 3 — Children's Program Guardian Management (Priority: P2)

Parents/guardians register their children for the Children's Program (Program 2). Guardian information is stored on the child's profile. The guardian manages the child's account, receives progress notifications, and can view the child's session outcomes. The child is placed in an age-appropriate track (Talqeen for ages 3-6, Nooraniyah for 4-8, or Memorization for 6+).

**Why this priority**: The Children's Program is a core structured offering. Guardian management is essential for safeguarding minors and enabling parent engagement.

**Independent Test**: Can be tested by creating a student profile with guardian details, enrolling the child in a track, and verifying the guardian receives session notifications and can view progress.

**Acceptance Scenarios**:

1. **Given** a user creating a student account for a child, **When** they enroll in the Children's Program, **Then** the system requires guardian information (name, phone, optional email, relationship).
2. **Given** a child enrolled in a track, **When** a session is completed, **Then** the guardian receives a push notification with session outcome (score, teacher notes).
3. **Given** a guardian opens the child's profile, **When** they view the progress tab, **Then** they see the child's memorization progress, attendance rate, and recent session outcomes.
4. **Given** a child is under 6, **When** enrolling in the Children's Program, **Then** only Talqeen and Nooraniyah tracks are shown as options.
5. **Given** a guardian linked to a child's profile, **When** notification preferences are configured, **Then** each guardian can opt in/out of specific notification categories; notifications route to the child's shared device.

---

### User Story 4 — Mutoon Linear Progress Tracking (Priority: P3)

Students enrolled in structured Mutoon programs (Tuhfat al-Atfal, Al-Jazariyyah, Al-Shatibiyyah) have their memorization tracked section-by-section (verse/line of the poem). Teachers mark sections as not_started, in_progress, memorized, or certified after each session. Students see a linear progress bar showing how far they've advanced through the matn.

**Why this priority**: Mutoon tracking is simpler than Quran memorization (linear, not Juz'-based) but is required for three distinct tracks and their certification pipeline.

**Independent Test**: Can be tested by creating a student enrollment in a Mutoon track, recording section-by-section progress, and verifying the progress bar and certification eligibility.

**Acceptance Scenarios**:

1. **Given** a student enrolled in a Mutoon structured track, **When** the teacher opens the session workspace, **Then** they see the student's current section position and can advance or review sections.
2. **Given** a teacher marks a section as "memorized", **When** the session is saved, **Then** the student's progress bar updates and the next section becomes "in_progress".
3. **Given** a student has all sections marked as "memorized" or "certified", **When** the teacher views their profile, **Then** a "Recommend for Certification" button becomes available.
4. **Given** a student's progress detail screen, **When** the student opens it, **Then** they see each section (verse) with its status, score, and last review date.

---

### User Story 5 — Qiraat Per-Riwayah Tracking (Priority: P3)

Students enrolled in the Qiraat program (Program 4) are assigned to a specific Riwayah (e.g., Hafs from Asim, Warsh from Nafi'). Their progress is tracked per section of the Quran read in that Riwayah. The teacher signs off on completed sections. Upon completing the entire reading, the student is recommended for an Ijazah that includes the chain of narration (سند).

**Why this priority**: Qiraat tracking is structurally similar to Mutoon tracking (section-based sign-off) but requires Riwayah-specific metadata and the chain of narration for the Ijazah.

**Independent Test**: Can be tested by enrolling a student in a Riwayah, logging section sign-offs, and verifying the Ijazah includes the سند field.

**Acceptance Scenarios**:

1. **Given** a student enrolling in the Qiraat program, **When** they select a track, **Then** each track corresponds to a specific Riwayah (e.g., "Hafs from Asim").
2. **Given** a teacher conducting a Qiraat session, **When** the student reads a Juz', **Then** the teacher can sign off on that Juz' with a pass/fail status and notes.
3. **Given** all 30 Juz' of a Riwayah are signed off as passed, **When** the teacher views the student's profile, **Then** a "Recommend for Ijazah" button appears.
4. **Given** a Qiraat Ijazah is issued, **When** the student views the certificate, **Then** it displays the Riwayah name, the teacher's name, and the chain of narration (سند) as entered by the program admin.

---

### User Story 6 — Arabic Language Recitation Tracking (Priority: P3)

Students enrolled in the Arabic Language program (Program 6) progress through a curriculum of recitations/chapters (Al-Ajurumiyyah or Qatr al-Nada). Teachers record assessment scores per recitation. Students see their completion percentage and per-recitation results.

**Why this priority**: Arabic Language tracking is the simplest form of curriculum progress — recitation completion with scores — and shares the same certification pipeline.

**Independent Test**: Can be tested by enrolling a student, recording recitation scores, and verifying the completion percentage calculation.

**Acceptance Scenarios**:

1. **Given** a student enrolled in an Arabic Language track, **When** the teacher opens the session workspace, **Then** they see the student's current recitation and can record an assessment score (0-100).
2. **Given** scores are recorded for multiple recitations, **When** the student views their progress, **Then** they see a completion percentage and per-recitation scores.
3. **Given** all recitations are completed with passing scores, **When** the teacher views the student profile, **Then** a "Recommend for Graduation" button appears.

---

### User Story 7 — Student-to-Student Alternating Recitation (Priority: P4)

Students in Program 1 Section 2 can find peers for alternating recitation practice. The system facilitates matching students who want to practice together. Students browse available peers, send pairing requests, agree on meeting times, and conduct sessions via external meeting links without a teacher present.

**Why this priority**: Peer-to-peer recitation is a secondary, student-driven feature. It expands the platform's value but is not required for any structured program's completion.

**Independent Test**: Can be tested by having two students request pairing, matching them, and verifying they can see each other's meeting links.

**Acceptance Scenarios**:

1. **Given** a student in Program 1 Section 2, **When** they open the peer recitation screen, **Then** they see a list of students who are currently available for peer practice.
2. **Given** a student taps "Go Available" for peer recitation, **When** another student requests to pair, **Then** the first student receives a notification and can accept or decline.
3. **Given** two students are paired, **When** they open the session screen, **Then** they see each other's meeting link and can start the session.
4. **Given** a completed peer session, **When** either student logs it, **Then** both students' session counts are incremented.

---

### User Story 8 — Certificate Generation and Sharing (Priority: P1)

When a program admin issues a certification, the system generates a visually attractive digital certificate. The certificate can be viewed in-app, shared as an image, and verified via a unique QR code that links to a public verification page.

**Why this priority**: Certificate generation is a direct dependency of User Story 1 (Certification Issuance). Without a generated artifact, the certification has no tangible output for the student.

**Independent Test**: Can be tested by issuing a certificate and verifying the generated image contains all required fields (student name, program, teacher, date, certificate number, QR code).

**Acceptance Scenarios**:

1. **Given** a certificate is issued, **When** the student opens it in the certificates tab, **Then** they see a beautifully rendered certificate with: student name, program name, track (if applicable), teacher name, issue date, certificate number, and organization logo.
2. **Given** a certificate detail screen, **When** the student taps "Share", **Then** the system generates a shareable image file and opens the device share sheet.
3. **Given** a Qiraat Ijazah, **When** viewing the certificate, **Then** it additionally displays the Riwayah name and the chain of narration (سند).
4. **Given** a certificate image, **When** someone scans the QR code, **Then** they are directed to a public verification page showing the certificate details and confirmation of authenticity.

---

### Edge Cases

- What happens if a teacher recommends a student for certification but the student drops from the program before approval? The certification request MUST be automatically cancelled and the teacher notified.
- What happens if a Himam partner doesn't show up for their time slot? The other partner MUST be able to log the block as "partner absent" and the system counts only the portions they personally recited.
- What happens if a guardian changes their phone number? The guardian MUST be able to update contact info without affecting the child's enrollment or progress data.
- What happens if the same student tries to register for two Himam tracks in the same event? The system MUST prevent duplicate registrations — one track per event per student.
- What happens if a paired Himam partner cancels their registration after pairing? The system MUST notify the remaining partner and place them back in the unmatched pool for re-pairing.
- What happens if a student completes Mutoon sections out of order (teacher reviews a later section)? The system MUST allow non-linear sign-off but track actual completion order separately from section number order.
- What happens if a certificate verification QR code is accessed after the certificate is revoked? The verification page MUST clearly show "This certificate has been revoked" with the revocation date and reason.

## Requirements

### Functional Requirements

**Certification System**

- **FR-001**: System MUST support a certification lifecycle: recommended → supervisor_approved → issued (or rejected at any stage). Rejection MUST include a mandatory reason. Rejected requests revert to the teacher with the reason visible; the teacher MAY re-recommend the same student. Students MUST only see issued certificates — rejected requests are never shown to students.
- **FR-002**: System MUST store for each certificate: student name, program, track, teacher, issue date, unique certificate number, type (ijazah / graduation / completion / participation), and optional chain of narration (سند).
- **FR-003**: Teachers MUST be able to recommend a student for certification only when the student's program-specific progress indicates completion.
- **FR-004**: Supervisors MUST be able to approve or reject a certification recommendation with an optional note.
- **FR-005**: Program admins MUST be able to issue or reject a supervisor-approved certification.
- **FR-006**: Students MUST see all earned certificates in a dedicated "Certificates" tab with details and sharing capability.
- **FR-007**: System MUST generate a unique certificate number in the format `WRT-YYYY-NNNNN` (e.g., `WRT-2026-00001`) where YYYY is the issuance year and NNNNN is a globally sequential zero-padded number (does NOT reset per year — avoids race-condition collisions at year boundaries).
- **FR-008**: System MUST support certificate revocation by a program admin with a reason, and revoked certificates MUST be clearly marked in the student's view.

**Certificate Generation**

- **FR-009**: System MUST generate a visually formatted certificate image when a certificate is issued, containing all certificate fields and the organization logo.
- **FR-010**: Each certificate image MUST include a QR code that links to a public verification URL.
- **FR-011**: The public verification page MUST display certificate details and authenticity confirmation without requiring authentication.
- **FR-012**: Students MUST be able to share the certificate image via the device's native share sheet.

**Himam Event Management**

- **FR-013**: Program admins MUST be able to create Himam events with a date (must be a Saturday) and the standard 24-hour window (Fajr to Fajr).
- **FR-014**: System MUST offer 5 tracks per event: 3, 5, 10, 15, and 30 Juz'.
- **FR-015**: Students MUST be able to register for exactly one track per event.
- **FR-016**: System MUST support partner pairing — either automatic (matching students in the same track) or manual (supervisor adjustment).
- **FR-017**: Paired partners MUST be able to select time slots organized by prayer-time blocks within the event window.
- **FR-018**: Partners MUST be able to log block completions, and the system MUST update both partners' progress.
- **FR-019**: System MUST track per-Juz' completion status (pending / completed) for each registration.
- **FR-020**: System MUST automatically mark incomplete registrations when the event window closes.
- **FR-021**: System MUST send event reminders to all registered participants 24 hours before the event starts.
- **FR-022**: System MUST send partner assignment notifications when pairing is completed.

**Children's Program and Guardians**

- **FR-023**: System MUST store guardian information (name, phone, optional email, relationship) linked to a child's student profile.
- **FR-024**: A student profile MUST support multiple guardians (e.g., both parents).
- **FR-025**: Guardians MUST receive push notifications for their child's session outcomes, attendance, and milestone achievements via the child's registered device (guardians share the child's account — no separate guardian app accounts).
- **FR-026**: Each guardian linked to a child's profile MUST have their own notification preference record, controlling which categories trigger notifications on the shared device.
- **FR-027**: The Children's Program enrollment MUST filter available tracks by the child's age range: Talqeen (3-6), Nooraniyah (4-8), Memorization (6+).
- **FR-028**: System MUST prevent children under the minimum age for a track from enrolling.

**Mutoon Progress Tracking**

- **FR-029**: System MUST track per-section (verse/line) progress for each Mutoon enrollment with statuses: not_started, in_progress, memorized, certified. The total section list MUST be pre-defined in the track's curriculum metadata.
- **FR-030**: Teachers MUST be able to update section status and record a score (0-5) and notes per section, selecting from the pre-defined curriculum sections.
- **FR-031**: Students MUST see a linear progress view showing all sections with their current status.
- **FR-032**: System MUST calculate and display completion percentage based on sections in "memorized" or "certified" status out of the total pre-defined sections.

**Qiraat/Riwayah Tracking**

- **FR-033**: System MUST track per-Juz' progress (30 sections) for each Qiraat enrollment, scoped to the student's assigned Riwayah. The 30 Juz' are pre-defined in the track's curriculum metadata.
- **FR-034**: Teachers MUST be able to sign off on individual Juz' (pass/fail with notes).
- **FR-035**: System MUST store the chain of narration (سند) as free text on the Qiraat Ijazah, entered by the program admin at issuance.

**Arabic Language Tracking**

- **FR-036**: System MUST track per-recitation progress for Arabic Language enrollments with assessment scores (0-100). The recitation list MUST be pre-defined in the track's curriculum metadata.
- **FR-037**: Students MUST see completion percentage and per-recitation scores.
- **FR-038**: System MUST determine graduation eligibility based on all recitations completed with passing scores (configurable passing threshold, default 60).

**Student-to-Student Pairing**

- **FR-039**: Students in peer recitation programs MUST be able to toggle "available for peer practice".
- **FR-040**: System MUST show a list of available peers in the same program section (Quran or Mutoon).
- **FR-041**: Students MUST be able to send and accept/decline pairing requests.
- **FR-042**: Paired students MUST see each other's meeting link to conduct the session externally.
- **FR-043**: Either partner MUST be able to log the session completion, incrementing both students' session counts.

### Key Entities

- **Certification**: A formal recognition of program completion. Types include Ijazah (Qiraat), graduation (Arabic Language), and completion (Mutoon, Memorization). Contains student, program, track, teacher, issuer, certificate number, optional chain of narration, and revocation status.
- **Himam Event**: A weekly marathon occurring on Saturdays, spanning 24 hours. Contains date, status (upcoming/active/completed), and configuration for the five tracks.
- **Himam Registration**: A student's enrollment in a specific event and track. Contains partner assignment, time slot selections, and per-Juz' completion status.
- **Himam Progress**: Per-Juz' completion tracking within a registration. Contains Juz' number, status, and completion timestamp.
- **Student Guardian**: A parent or guardian linked to a child's student profile. Contains contact information, relationship type, and per-guardian notification preferences. Guardians share the child's app account — no separate guardian accounts exist. Notifications route to the child's device.
- **Mutoon Progress**: Per-section (verse/line) tracking for Mutoon enrollments. Contains section number, status, score, teacher notes, and review timestamps.
- **Qiraat Progress**: Per-Juz' tracking (30 sections) scoped to a Riwayah. Teacher signs off on each Juz' as the student reads through it. Shares structure with Mutoon progress but at Juz' granularity with Riwayah context.
- **Arabic Language Progress**: Per-recitation tracking with assessment scores. Contains recitation number, score, completion status. Recitation list pre-defined in track curriculum metadata.
- **Student Pairing**: A peer-to-peer match for alternating recitation. Contains both student IDs, program section, status, and session log.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Students can view earned certificates within 5 seconds of the program admin issuing them.
- **SC-002**: Certificate sharing generates a shareable image in under 3 seconds.
- **SC-003**: 100% of issued certificates have a unique, verifiable QR code that resolves to a public verification page.
- **SC-004**: Himam event registration and partner pairing completes for all participants at least 24 hours before the event starts.
- **SC-005**: Partners can log block completions and see updated progress within 2 seconds.
- **SC-006**: Guardians receive session outcome notifications within 1 minute of the teacher submitting the session log.
- **SC-007**: Mutoon, Qiraat, and Arabic Language progress views load within 2 seconds showing accurate completion percentages.
- **SC-008**: Teachers can update section/recitation progress for a student in under 30 seconds per section.
- **SC-009**: Peer pairing requests are delivered within 10 seconds of being sent.
- **SC-010**: At least 4 of the 8 programs (Qiraat, Mutoon structured, Arabic Language, Quran Memorization) have a complete certification pipeline from recommendation to issued certificate.

## Assumptions

- The core platform (001-platform-core) is deployed and stable: enrollments, sessions, teacher availability, notifications, and the 19-table schema are operational.
- The existing `programs` and `program_tracks` tables already contain seed data for all 8 programs with their tracks.
- Certificate image generation will use device-side rendering (no server-side PDF generation required for MVP). A future enhancement may add server-side PDF generation.
- The Himam 24-hour window uses a fixed timezone (the organization's configured timezone in `platform_config.settings`) rather than each participant's local timezone.
- Guardian management applies specifically to the Children's Program; other programs do not require guardian information.
- The chain of narration (سند) for Qiraat Ijazahs is stored as free text, not as a structured linked chain of teachers.
- Peer-to-peer pairing (User Story 7) has no admin oversight — it is fully student-driven.
- The passing threshold for Arabic Language graduation (default 60) is configurable in program settings.

## Out of Scope

- Auto-generated Google Meet links via Calendar API (PRD labels this as a future enhancement).
- Voice memo "save before expiry" feature (PRD Phase 2 enhancement).
- Gamification/sticker system (PRD recommends skipping for MVP).
- Extended language localization beyond Arabic and English (Turkish, Urdu, French, Malay).
- Tablet/web layouts.
- Payment integration.
- Server-side PDF certificate generation (client-side image rendering is sufficient for MVP).
- Analytics playback tracking for voice memos.
