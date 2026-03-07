# Critical Test Paths

Prioritized cross-role flows to test first. Each path involves multiple roles interacting. Test these before diving into individual role scripts.

---

## P0 — Must Work (Test First)

### CP-01: Role Routing

Verifies each role lands on the correct dashboard after login.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Log in as **student** | Lands on `/(student)/` with 6 tabs: Dashboard, Programs, Memorization, Revision, Journey, Profile |
| 2 | Log out, log in as **teacher** | Lands on `/(teacher)/` with 5 tabs: Dashboard, Students, Sessions, Class Progress, Profile |
| 3 | Log out, log in as **parent** | Lands on `/(parent)/` with 3 tabs: Dashboard, Children, Settings |
| 4 | Log out, log in as **admin** | Lands on `/(admin)/` scroll dashboard with nav cards |
| 5 | Log out, log in as **supervisor** | Lands on `/(supervisor)/` with 4 tabs: Home, Teachers, Reports, Profile |
| 6 | Log out, log in as **program_admin** | Lands on `/(program-admin)/` program selector, then 5 tabs: Home, Cohorts, Team, Reports, Settings |
| 7 | Log out, log in as **master_admin** | Lands on `/(master-admin)/` scroll dashboard with stat cards + nav buttons |
| 8 | Verify unauthenticated user → redirected to `/(auth)/login` | Login screen shown |
| - | **Pass criteria** | All 7 roles route correctly, no cross-role leakage |

---

### CP-02: Enrollment Flow

Tests the complete student enrollment lifecycle.

**Roles involved:** Student, Teacher, Program Admin

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Student | Navigate to Programs tab | List of available programs shown |
| 2 | Student | Tap a program with open enrollment | Program details screen with "Enroll" button |
| 3 | Student | Tap "Enroll" on a cohort with capacity | Status changes to "active" (auto-approve) or "pending" (approval required) |
| 4 | Teacher | Navigate to Students tab | Newly enrolled student appears in the teacher's student list (if assigned to same cohort) |
| 5 | Program Admin | Navigate to Home tab | Enrollment count updated in dashboard stats |
| 6 | Student | Navigate to "My Programs" | Enrolled program appears with status |
| 7 | Student | Tap "Drop" on the enrollment | Status changes to "dropped", program disappears from active list |
| - | **Pass criteria** | Enrollment created, visible to teacher and program admin, droppable by student |

---

### CP-03: Session Logging Flow

Tests the teacher-student session lifecycle.

**Roles involved:** Teacher, Student

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Teacher | Navigate to schedule, tap a session slot | Session workspace opens |
| 2 | Teacher | Select student, log recitation (surah, ayah range, type, grade) | Session created (draft or completed) |
| 3 | Teacher | Complete the session | Session status changes to "completed" |
| 4 | Student | Navigate to Dashboard or Sessions | Completed session appears in session history |
| 5 | Student | View session details | Surah, ayah range, grade, teacher name visible |
| 6 | Student | Check memorization progress | Progress updated to reflect the new session |
| - | **Pass criteria** | Session logged by teacher, visible to student with correct details |

---

### CP-04: Sticker Award Flow

Tests the gamification sticker award lifecycle.

**Roles involved:** Teacher, Student

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Teacher | Navigate to Awards screen | Award interface shown with student list |
| 2 | Teacher | Select student, pick a sticker, confirm | Sticker awarded, success feedback |
| 3 | Teacher | Immediately try to undo (within 30s) | Undo option available, sticker removed on undo |
| 4 | Teacher | Award another sticker (let 30s pass) | Undo option disappears after grace period |
| 5 | Student | Navigate to Profile > Badges | New sticker appears in collection |
| 6 | Student | Check Leaderboard | Points/level updated |
| - | **Pass criteria** | Sticker awarded, undo works within window, student sees sticker and updated score |

---

## P1 — Important

### CP-05: Waitlist Flow

Tests enrollment into a full cohort.

**Roles involved:** Student, Program Admin

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Setup | Ensure a cohort is at max capacity | - |
| 2 | Student | Enroll in the full cohort | Placed on waitlist (not active enrollment) |
| 3 | Student | View waitlist status | Position number visible |
| 4 | Program Admin | Navigate to Waitlist screen for that cohort | Student appears in waitlist |
| 5 | Program Admin | Promote student from waitlist | Student status changes to "active" |
| 6 | Student | Refresh My Programs | Status now shows "active" enrollment |
| - | **Pass criteria** | Full cohort → waitlist → admin promotes → student enrolled |

---

### CP-06: Supervisor Oversight

Tests supervisor's ability to view and manage teachers.

**Roles involved:** Supervisor, Teacher

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Supervisor | Navigate to Teachers tab | List of supervised teachers with session/student counts |
| 2 | Supervisor | Tap a teacher | Teacher profile with student list and session stats |
| 3 | Supervisor | View a teacher's students | Student list with progress data |
| 4 | Supervisor | Reassign a student to different teacher | Student moves to new teacher's roster |
| 5 | Teacher | Refresh Students tab | Student no longer appears (if reassigned away) |
| 6 | Supervisor | Check dashboard stats | Stats reflect the reassignment |
| - | **Pass criteria** | Supervisor can view teachers, their students, and reassign between supervised teachers |

---

### CP-07: Certification Flow

Tests the certificate issuance and verification lifecycle.

**Roles involved:** Teacher, Student

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Teacher | Navigate to Certifications | Certification management screen |
| 2 | Teacher | Issue a certificate to student | Certificate created with unique code |
| 3 | Student | Navigate to Certificates screen | New certificate appears |
| 4 | Student | View certificate details | Shows issuer, date, type, QR code |
| 5 | Any | Scan or visit QR code URL | Certificate verification page confirms validity |
| - | **Pass criteria** | Certificate issued, visible to student, QR verification works |

---

### CP-08: Push Notification Registration

Tests the notification setup flow.

**Roles involved:** Any authenticated user

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Any | Log in (first time on device) | Soft-ask notification prompt appears |
| 2 | Any | Tap "Enable" | System permission dialog shown |
| 3 | Any | Grant permission | Push token registered in `push_tokens` table |
| 4 | Any | Navigate to Notification Preferences | Category toggles visible |
| 5 | Any | Toggle a category off | Preference saved in `notification_preferences` table |
| - | **Pass criteria** | Token registered, preferences saved, categories toggleable |

---

## P2 — Should Work

### CP-09: Himam Event Lifecycle

**Roles involved:** Supervisor, Student

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Supervisor | Create/view an active Himam event | Event visible in Himam section |
| 2 | Student | Navigate to Himam | Active event shown |
| 3 | Student | Register for event | Registration confirmed |
| 4 | Supervisor | View registrations for event | Student appears |
| 5 | Supervisor | Generate pairings | Pairings created |
| 6 | Student | View pairing and record progress | Progress saved |
| 7 | Student | View history | Past event progress visible |
| - | **Pass criteria** | Full Himam lifecycle works end-to-end |

---

### CP-10: Voice Memo Recording

**Roles involved:** Teacher

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Teacher | Open session workspace | Recording button visible |
| 2 | Teacher | Record a voice memo | Recording captured |
| 3 | Teacher | Save session with memo | Memo uploaded to storage |
| 4 | Teacher | Re-open session | Memo playable |
| - | **Pass criteria** | Memo recorded, uploaded, and playable on revisit |

---

### CP-11: Teacher Availability (Green Dot)

**Roles involved:** Teacher, Student

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Teacher | Navigate to Availability screen | Toggle visible |
| 2 | Teacher | Toggle availability ON | Status saved, green dot active |
| 3 | Student | Browse "Available Now" for that program | Teacher appears with green dot indicator |
| 4 | Teacher | Toggle availability OFF | Green dot disappears |
| 5 | Student | Refresh "Available Now" | Teacher no longer listed |
| - | **Pass criteria** | Green dot reflects teacher's live availability status |

---

### CP-12: Ratings Flow

**Roles involved:** Student, Supervisor

| Step | Role | Action | Expected |
|------|------|--------|----------|
| 1 | Setup | Ensure a completed session exists (< 48 hours old) | - |
| 2 | Student | View session details | Rating prompt visible |
| 3 | Student | Submit 1-5 star rating with optional tags | Rating saved |
| 4 | Student | Try to re-rate same session | Not allowed (one rating per session) |
| 5 | Supervisor | Navigate to Reports | Aggregated ratings visible for supervised teachers |
| - | **Pass criteria** | Student rates within window, supervisor sees aggregate, no double-rating |
