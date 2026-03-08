# Teacher Test Script

Manual test script for the **Teacher** role in WeReciteTogether.

- **Dashboard route:** `/(teacher)/`
- **Tabs:** Dashboard, Students, Sessions, Class Progress, Profile (5 tabs)
- **Role theme color:** Violet

---

## Prerequisites

- [ ] Test account with role `teacher` in the `profiles` table
- [ ] Teacher assigned to at least 1 program via `program_roles` (role = `teacher`)
- [ ] At least 2 students enrolled in the teacher's class
- [ ] Sticker catalog has entries (at least 3 stickers)
- [ ] At least 1 completed session and 1 draft session exist for the teacher-student pair
- [ ] At least 1 track exists in the assigned program (for mutoon testing)
- [ ] Device has microphone access enabled (for voice memo testing)

---

## A. Dashboard Verification

### A1. Login and Routing

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Log in with teacher credentials | Lands on `/(teacher)/` dashboard | [ ] |
| 2 | Verify bottom tab bar | 5 tabs visible: Dashboard, Students, Sessions, Class Progress, Profile | [ ] |
| 3 | Verify theme color | Violet accent color applied to active tab and header elements | [ ] |
| 4 | Verify dashboard content | Stats cards showing student count, session count, upcoming schedule | [ ] |

### A2. No Unauthorized Items

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Inspect tab bar | No "Programs" enrollment tab (student-only) | [ ] |
| 2 | Inspect tab bar | No admin-related tabs or navigation cards | [ ] |
| 3 | Inspect dashboard | No "Enroll" buttons or program browsing as a student | [ ] |
| 4 | Inspect dashboard | No supervisor-level oversight sections (team management, reassign) | [ ] |

---

## B. Student Management

### B1. Student Roster

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tap **Students** tab | `(tabs)/students.tsx` loads with list of enrolled students in teacher's class | [ ] |
| 2 | Verify student count | Matches the number of students enrolled in teacher's class | [ ] |
| 3 | Verify roster scope | Only students from teacher's own class appear (no students from other teachers) | [ ] |
| 4 | Check student list items | Each item shows student name and basic info | [ ] |

### B2. Student Details

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tap a student in the roster | `students/[id]/index.tsx` loads with student detail screen | [ ] |
| 2 | Verify student info | Name, enrollment status, and progress summary visible | [ ] |
| 3 | Verify session history | Past sessions with this student listed | [ ] |
| 4 | Navigate back | Returns to student roster cleanly | [ ] |

### B3. Memorization Tracking

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to memorization tracking | `students/memorization.tsx` loads | [ ] |
| 2 | Verify student progress | Memorization progress data shown for students in class | [ ] |
| 3 | Check progress details | Surah/ayah completion data visible | [ ] |

### B4. Top Performers

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to top performers | `students/top-performers.tsx` loads | [ ] |
| 2 | Verify list | Shows students ranked by performance metrics | [ ] |
| 3 | Verify scope | Only students from teacher's own class appear | [ ] |

### B5. Students Needing Support

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to needs support | `students/needs-support.tsx` loads | [ ] |
| 2 | Verify list | Shows students flagged for low performance or inactivity | [ ] |
| 3 | Verify scope | Only students from teacher's own class appear | [ ] |

### B6. Student Recommendations

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | From student details, navigate to recommend | `students/[id]/recommend.tsx` loads | [ ] |
| 2 | Verify recommendation interface | Form or options for recommending next steps for the student | [ ] |

---

## C. Session Management

### C1. Schedule View

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to schedule | `schedule/index.tsx` loads with teacher's schedule | [ ] |
| 2 | Verify schedule entries | Upcoming and past sessions shown in chronological order | [ ] |
| 3 | Tap a schedule entry | `schedule/[id]/index.tsx` loads with session details | [ ] |

### C2. Session Workspace

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | From schedule detail, open workspace | `schedule/[id]/workspace.tsx` loads | [ ] |
| 2 | Verify workspace UI | Student selector, recitation logging fields (surah, ayah range, type, grade) | [ ] |
| 3 | Select a student | Student selected, ready for session logging | [ ] |

### C3. Log a New Session

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | In workspace, fill in recitation details | Surah, start ayah, end ayah, recitation type, grade fields accept input | [ ] |
| 2 | Save as draft | Session created with draft status | [ ] |
| 3 | Verify in Supabase `sessions` table | Row exists with `status = 'draft'` and correct `teacher_id` | [ ] |

### C4. Complete a Session

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Open an existing draft session | Draft session loads in workspace | [ ] |
| 2 | Complete the session | Session status changes to `completed` | [ ] |
| 3 | Verify in Supabase `sessions` table | Row updated to `status = 'completed'` | [ ] |
| 4 | Verify student sees it | Log in as student -- completed session appears in session history | [ ] |

### C5. Sessions Tab

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tap **Sessions** tab | `(tabs)/sessions.tsx` loads | [ ] |
| 2 | Verify session list | Shows teacher's sessions (drafts, completed) | [ ] |
| 3 | Verify scope | Only teacher's own sessions appear (not other teachers') | [ ] |

### C6. Session Details

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tap a session in the list | `sessions/[id].tsx` loads | [ ] |
| 2 | Verify details | Student name, surah, ayah range, grade, date, status visible | [ ] |
| 3 | Verify edit capability (if draft) | Can modify session details for own draft sessions | [ ] |

---

## D. Recitation & Assignments

### D1. Record Recitation

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | In session workspace, log a recitation | Recitation entry created with surah, ayah range, type, and grade | [ ] |
| 2 | Verify recitation saved | Entry appears in session details | [ ] |
| 3 | Verify student memorization updated | Student's memorization progress reflects the new recitation | [ ] |

### D2. Create Assignment

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to create assignment | `assignments/create.tsx` loads | [ ] |
| 2 | Fill in assignment details | Select student, surah/ayah range, due date, instructions | [ ] |
| 3 | Submit assignment | Assignment created successfully | [ ] |
| 4 | Verify in database | Assignment row exists with correct teacher and student IDs | [ ] |
| 5 | Verify student sees it | Log in as student -- assignment appears in their view | [ ] |

---

## E. Awards & Gamification

### E1. Award a Sticker

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to awards | `awards/index.tsx` loads with student list and sticker catalog | [ ] |
| 2 | Select a student | Student highlighted/selected | [ ] |
| 3 | Pick a sticker from catalog | Sticker selected | [ ] |
| 4 | Confirm award | Sticker awarded, success feedback shown | [ ] |
| 5 | Verify in `student_stickers` table | Row exists linking student, sticker, and teacher | [ ] |

### E2. Undo Sticker Award

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Immediately after awarding | Green undo banner appears at the top with "Undo" tap target | [ ] |
| 2 | Tap "Undo" on the banner | Sticker award reverted, row removed from `student_stickers`, banner disappears | [ ] |
| 3 | Award another sticker, wait 30+ seconds | Undo banner disappears automatically after grace period | [ ] |

### E3. View Sticker Catalog

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Browse sticker catalog in awards screen | All available stickers shown with names and images | [ ] |
| 2 | Verify read-only | Cannot create or edit stickers (no edit/add buttons) | [ ] |

### E4. View Leaderboard

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to leaderboard (from dashboard or awards) | Leaderboard loads | [ ] |
| 2 | Verify scope | Shows students from teacher's program | [ ] |
| 3 | Verify ranking | Students ranked by points/stickers | [ ] |

---

## F. Mutoon Progress Management

### F1. View Student Mutoon Progress

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to mutoon tracking | `mutoon/[trackId].tsx` loads for a track | [ ] |
| 2 | Verify track content | Track sections/items listed with completion status per student | [ ] |
| 3 | Verify scope | Only students from teacher's program visible | [ ] |

### F2. Update Student Mutoon Progress

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Select a student's progress entry | Entry opens for editing | [ ] |
| 2 | Mark section as completed | Progress updated | [ ] |
| 3 | Verify in `mutoon_progress` table | Row updated with new completion status | [ ] |
| 4 | Verify student sees update | Log in as student -- mutoon progress reflects the change | [ ] |

---

## G. Certifications

### G1. Issue a Certificate

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to certifications | `certifications/index.tsx` loads | [ ] |
| 2 | Initiate certificate issuance | Form/wizard for issuing a certificate to a student | [ ] |
| 3 | Select student and certificate type | Fields populated | [ ] |
| 4 | Submit issuance | Certificate created with unique verification code | [ ] |
| 5 | Verify in `certifications` table | Row exists with `issued_by = teacher_id`, unique code, and student ID | [ ] |

### G2. View Issued Certificates

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | View certifications list | `certifications/index.tsx` shows previously issued certificates | [ ] |
| 2 | Tap a certificate | `certifications/[id].tsx` loads with details | [ ] |
| 3 | Verify details | Student name, date, type, verification code/QR visible | [ ] |
| 4 | Verify scope | Only certificates issued by this teacher are shown | [ ] |

### G3. Revoke a Certificate

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | From certificate details, tap revoke | Confirmation dialog appears | [ ] |
| 2 | Confirm revocation | Certificate status changes to revoked | [ ] |
| 3 | Verify in database | `certifications` row updated with revoked status | [ ] |
| 4 | Verify scope | Can only revoke certificates the teacher personally issued | [ ] |

---

## H. Teacher Availability

### H1. Toggle Availability

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to availability | `availability.tsx` loads with toggle | [ ] |
| 2 | Toggle availability ON | Status saved, UI reflects "available" state | [ ] |
| 3 | Verify in `teacher_availability` table | Row exists with teacher's ID and active status | [ ] |
| 4 | Toggle availability OFF | Status updated, UI reflects "unavailable" state | [ ] |
| 5 | Verify in database | Row removed or marked inactive | [ ] |

### H2. Cross-Role Verification

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Toggle ON, then log in as student | Student sees teacher in "Available Now" list with green dot | [ ] |
| 2 | Log back in as teacher, toggle OFF | Availability cleared | [ ] |
| 3 | Log in as student again | Teacher no longer in "Available Now" list | [ ] |

---

## I. Voice Memos

### I1. Record a Voice Memo

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Open a session workspace | Recording button visible | [ ] |
| 2 | Tap record | Recording starts (timer or waveform indicator) | [ ] |
| 3 | Stop recording | Recording captured and preview available | [ ] |
| 4 | Save session with memo | Memo uploaded to `voice-memos` storage bucket | [ ] |
| 5 | Verify in `session_voice_memos` table | Row exists linking memo to session | [ ] |

### I2. Playback a Voice Memo

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Open a session that has a saved voice memo | Playback control visible | [ ] |
| 2 | Tap play | Audio plays back correctly | [ ] |
| 3 | Verify scope | Can only listen to memos from own sessions | [ ] |

---

## J. Class Progress Analytics

### J1. View Class Progress

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tap **Class Progress** tab | `(tabs)/class-progress.tsx` loads | [ ] |
| 2 | Verify charts/graphs | Visual analytics displayed (progress trends, completion rates) | [ ] |
| 3 | Verify scope | Data reflects only the teacher's own class/class | [ ] |

### J2. Trends and Insights

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Check for trend data | Historical data shown over time (weekly/monthly) | [ ] |
| 2 | Verify data accuracy | Compare chart values against raw data in Supabase | [ ] |
| 3 | Interact with charts | Tapping data points shows tooltips or detail views (if applicable) | [ ] |

---

## K. Profile & Settings

### K1. View Profile

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tap **Profile** tab | `(tabs)/profile.tsx` loads | [ ] |
| 2 | Verify profile data | Name, email, role (teacher), and other profile fields shown | [ ] |

### K2. Edit Profile

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tap edit on profile | Edit mode enabled | [ ] |
| 2 | Change display name | Field accepts new value | [ ] |
| 3 | Save changes | Profile updated successfully | [ ] |
| 4 | Verify in `profiles` table | Row updated with new name | [ ] |

### K3. Notification Preferences

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Navigate to notification preferences | `notification-preferences.tsx` loads | [ ] |
| 2 | Verify category toggles | Notification categories listed with on/off toggles | [ ] |
| 3 | Toggle a category off | Preference saved | [ ] |
| 4 | Verify in `notification_preferences` table | Row updated with new preference | [ ] |
| 5 | Toggle it back on | Preference restored | [ ] |

---

## L. Negative Tests

These verify that the teacher role is properly restricted from unauthorized actions.

### L1. Cannot Enroll as Student

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Attempt to navigate to `/(student)/` route manually | Route inaccessible or redirects to teacher dashboard | [ ] |
| 2 | Attempt to call `enroll_student()` RPC via Supabase SQL | Permission denied (RPC checks role) | [ ] |

### L2. Cannot Access Admin Dashboards

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Attempt to navigate to `/(admin)/` | Route inaccessible or redirects | [ ] |
| 2 | Attempt to navigate to `/(program-admin)/` | Route inaccessible or redirects | [ ] |
| 3 | Attempt to navigate to `/(master-admin)/` | Route inaccessible or redirects | [ ] |
| 4 | Attempt to navigate to `/(supervisor)/` | Route inaccessible or redirects | [ ] |

### L3. Cannot See Other Teachers' Students

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Query `sessions` table via Supabase SQL (impersonating teacher) | Only own sessions returned (RLS filters) | [ ] |
| 2 | Query enrollments for other classs | No results or permission denied | [ ] |

### L4. Cannot Manage Team or Programs

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Attempt to insert into `program_roles` via SQL | Permission denied by RLS | [ ] |
| 2 | Attempt to update `programs` table via SQL | Permission denied by RLS | [ ] |
| 3 | Attempt to create/edit stickers via SQL | Permission denied by RLS (teacher cannot write to sticker catalog) | [ ] |

### L5. Cannot Access Reports Beyond Own Class

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Attempt to call `get_supervisor_dashboard_stats()` RPC | Permission denied or empty result | [ ] |
| 2 | Attempt to call `get_master_admin_dashboard_stats()` RPC | Permission denied or empty result | [ ] |
| 3 | Attempt to call `get_program_admin_dashboard_stats()` RPC | Permission denied or empty result | [ ] |

### L6. Cannot Revoke Certificates Issued by Others

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Attempt to call `revoke_certification()` on a certificate issued by a different teacher | Permission denied | [ ] |

---

## M. Edge Cases

### M1. Empty Class (No Students)

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Remove all students from teacher's class (via Supabase) | - |
| 2 | Navigate to Students tab | Empty state shown (e.g., "No students enrolled yet") | [ ] |
| 3 | Navigate to top performers | Empty state or "No data" message | [ ] |
| 4 | Navigate to needs support | Empty state or "No data" message | [ ] |
| 5 | Navigate to Class Progress tab | Empty state or charts with zero data | [ ] |
| 6 | Navigate to Awards | No students to select (graceful handling) | [ ] |
| 7 | Restore students after testing | - |

### M2. No Sessions

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Ensure teacher has no sessions (via Supabase) | - |
| 2 | Navigate to Sessions tab | Empty state shown (e.g., "No sessions yet") | [ ] |
| 3 | Navigate to schedule | Empty schedule with option to create | [ ] |
| 4 | Navigate to Class Progress | Empty state or zero-data charts | [ ] |
| 5 | Restore sessions after testing | - |

### M3. First-Time Use

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Create a fresh teacher account with no program assignment | - |
| 2 | Log in | Dashboard loads without crashing | [ ] |
| 3 | Verify graceful empty states | All tabs show appropriate "getting started" or empty messages | [ ] |
| 4 | Assign teacher to a program (via Supabase) | - |
| 5 | Refresh or re-login | Dashboard populates with program data | [ ] |

### M4. Single Student in Class

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Ensure only 1 student in teacher's class | - |
| 2 | Navigate to Students tab | Single student listed | [ ] |
| 3 | Navigate to top performers | Single student listed (or appropriate message) | [ ] |
| 4 | Award a sticker to the single student | Sticker awarded successfully | [ ] |
| 5 | Issue a certificate to the single student | Certificate issued successfully | [ ] |

### M5. Session Workspace with No Student Selected

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Open workspace without selecting a student | Cannot log recitation (submit button disabled or prompt to select) | [ ] |

---

## Summary Checklist

| Section | Tests | Status |
|---------|-------|--------|
| A. Dashboard Verification | 8 | [ ] |
| B. Student Management | 16 | [ ] |
| C. Session Management | 16 | [ ] |
| D. Recitation & Assignments | 8 | [ ] |
| E. Awards & Gamification | 11 | [ ] |
| F. Mutoon Progress Management | 7 | [ ] |
| G. Certifications | 12 | [ ] |
| H. Teacher Availability | 8 | [ ] |
| I. Voice Memos | 8 | [ ] |
| J. Class Progress Analytics | 6 | [ ] |
| K. Profile & Settings | 9 | [ ] |
| L. Negative Tests | 12 | [ ] |
| M. Edge Cases | 17 | [ ] |
| **Total** | **138** | |

---

**Tester:** _______________
**Date:** _______________
**Build/Version:** _______________
**Device(s):** _______________
**Overall Result:** PASS / FAIL / PARTIAL
**Notes:**
