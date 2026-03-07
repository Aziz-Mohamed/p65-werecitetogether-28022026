# Test Script 05 — Supervisor Role

**Role:** Supervisor
**Dashboard route:** `/(supervisor)/`
**Layout:** Tab bar with 4 tabs (Home, Teachers, Reports, Profile)
**Data scope:** Program-scoped (sees only teachers/data within assigned programs)
**Program role:** Assigned via `program_roles` table with `role='supervisor'`

**Prerequisites:**
- Supervisor account exists with `role = 'supervisor'` in `program_roles` for at least 1 program
- Program has at least 2 supervised teachers assigned
- Each supervised teacher has at least 1 student with session history
- At least 1 Himam event exists within the supervisor's program
- At least 1 certification record exists within the supervisor's program
- Sticker/reward catalog has at least 1 entry
- Teacher ratings/reviews exist for at least 1 supervised teacher

---

## 1. Dashboard Verification

### 1.1 Dashboard Home (`(tabs)/index.tsx`)
- [ ] Login as supervisor — lands on `/(supervisor)/` dashboard
- [ ] Tab bar is visible with exactly 4 tabs: Home, Teachers, Reports, Profile
- [ ] Home tab is selected by default
- [ ] Dashboard stats load via `get_supervisor_dashboard_stats()` RPC
- [ ] Supervised teacher count is displayed and accurate
- [ ] Aggregated student count across supervised teachers is shown
- [ ] Session statistics (total, recent) are displayed
- [ ] Stats reflect only data from the supervisor's assigned programs
- [ ] Pull-to-refresh reloads dashboard stats
- [ ] Loading state shown while data is fetching
- [ ] Tapping stat cards or sections navigates to relevant detail screens

### 1.2 Tab Navigation
- [ ] Tapping Teachers tab navigates to teacher oversight list
- [ ] Tapping Reports tab navigates to supervisor reports
- [ ] Tapping Profile tab navigates to profile screen
- [ ] Tapping Home tab returns to dashboard
- [ ] Active tab is visually highlighted
- [ ] Tab state persists when navigating back from sub-screens

---

## 2. Teacher Oversight

### 2.1 Teacher List (`(tabs)/teachers.tsx`)
- [ ] Teacher list loads with all supervised teachers via `get_supervised_teachers()` RPC
- [ ] Only teachers within the supervisor's assigned programs are shown
- [ ] Teacher cards display name, student count, and recent activity summary
- [ ] List handles scrolling for many teachers
- [ ] Search/filter functionality works (if implemented)
- [ ] Empty state shown if supervisor has no supervised teachers
- [ ] Pull-to-refresh reloads teacher list

### 2.2 Teacher Details (`teachers/[id]/index.tsx`)
- [ ] Tapping a teacher navigates to their profile/details screen
- [ ] Teacher profile displays name, contact info, and program assignment
- [ ] Session statistics for the teacher are shown (total sessions, recent sessions)
- [ ] Student count and student progress summary are visible
- [ ] Navigation options to Reviews and Students sub-screens are accessible
- [ ] Back navigation returns to teacher list

### 2.3 Teacher Reviews (`teachers/[id]/reviews.tsx`)
- [ ] Reviews screen loads with aggregated ratings for the selected teacher
- [ ] Ratings data is scoped to the supervisor's program
- [ ] Individual review entries are displayed with date and rating details
- [ ] Average rating or summary score is visible
- [ ] Empty state shown if teacher has no reviews
- [ ] Data is read-only (supervisor cannot create or edit reviews)

### 2.4 Teacher's Students (`teachers/[id]/students.tsx`)
- [ ] Student list loads with all students assigned to the selected teacher
- [ ] Student cards display name and progress summary
- [ ] Only students within the supervisor's program scope are shown
- [ ] Tapping a student shows relevant detail (if applicable)
- [ ] Empty state shown if teacher has no students

---

## 3. Student Reassignment

### 3.1 Reassign Student Between Supervised Teachers
- [ ] Reassignment action is accessible from the teacher's student list or student detail
- [ ] Reassignment UI shows list of eligible target teachers (only supervised teachers within the same program)
- [ ] Selecting a target teacher and confirming triggers `reassign_student()` RPC
- [ ] Confirmation dialog is shown before executing reassignment
- [ ] After reassignment, student no longer appears under the original teacher
- [ ] After reassignment, student appears under the new teacher
- [ ] Reassignment is reflected in dashboard stats after refresh
- [ ] Cannot reassign a student to a teacher outside the supervisor's program scope
- [ ] Cannot reassign a student to the same teacher they are already assigned to
- [ ] Error message displayed if reassignment RPC fails

---

## 4. Reports

### 4.1 Supervisor Reports (`(tabs)/reports.tsx`)
- [ ] Reports screen loads with available report types
- [ ] All report data is scoped to the supervisor's assigned programs
- [ ] Reports show aggregated data across supervised teachers
- [ ] Session completion metrics are visible (completed vs pending)
- [ ] Student progress/memorization summaries are available
- [ ] Teacher performance comparisons are accessible
- [ ] Can filter by date range (if implemented)
- [ ] Can filter by individual teacher (if implemented)
- [ ] Data presented in charts/tables as appropriate
- [ ] Pull-to-refresh reloads report data
- [ ] All data is read-only

---

## 5. Himam Management

### 5.1 Himam Event Oversight (`himam/index.tsx`)
- [ ] Himam events list loads with events within the supervisor's program
- [ ] Events display name, date, status, and participant count
- [ ] Supervisor can create a new Himam event
- [ ] Event creation form validates required fields (name, date, etc.)
- [ ] Newly created event appears in the event list
- [ ] Events outside the supervisor's program are not visible
- [ ] Empty state shown if no Himam events exist

### 5.2 Event Registrations (`himam/[eventId]/registrations.tsx`)
- [ ] Tapping an event shows its registration list
- [ ] Registered participants are listed with name and status
- [ ] Registration count matches the event summary
- [ ] Supervisor can view registration details
- [ ] Data is scoped to the supervisor's program

### 5.3 Participant Pairings (`himam/[eventId]/pairings.tsx`)
- [ ] Pairings screen loads for the selected event
- [ ] Supervisor can generate pairings for participants
- [ ] Generated pairings are displayed with paired participant names
- [ ] Pairings persist after generation
- [ ] Re-generating pairings updates the pairing list
- [ ] Empty state shown if no pairings have been generated yet
- [ ] Cannot generate pairings if there are insufficient registrations

---

## 6. Certification Oversight

### 6.1 Certification List (`certifications/index.tsx`)
- [ ] Certification list loads with certifications within the supervisor's program
- [ ] Certification cards display student name, certification type, date, and status
- [ ] Only certifications scoped to the supervisor's program are shown
- [ ] List supports scrolling for many entries
- [ ] Empty state shown if no certifications exist

### 6.2 Certification Detail (`certifications/[id].tsx`)
- [ ] Tapping a certification navigates to its detail screen
- [ ] Certification details are displayed (student name, type, date issued, status)
- [ ] Supervisor can revoke a certification within their program
- [ ] Revocation triggers confirmation dialog before executing
- [ ] Revoked certification status updates in the list after action
- [ ] Cannot revoke certifications outside the supervisor's program scope
- [ ] Back navigation returns to certification list

---

## 7. Rewards Management

### 7.1 Rewards (`rewards/index.tsx`)
- [ ] Rewards screen loads with reward data scoped to the supervisor's program
- [ ] Reward items are listed with name, description, and availability
- [ ] Supervisor can manage reward entries (create/edit/remove as permitted)
- [ ] Changes to rewards persist after save
- [ ] Empty state shown if no rewards exist
- [ ] Data is scoped to the supervisor's assigned programs

---

## 8. Profile & Settings

### 8.1 Profile Screen (`(tabs)/profile.tsx`)
- [ ] Profile tab loads with current supervisor's profile data
- [ ] Profile displays name, email, assigned programs, and role
- [ ] Supervisor can edit own profile information (name, contact details)
- [ ] Profile updates persist after save
- [ ] Validation errors shown for invalid input
- [ ] Cancel/discard reverts changes without saving
- [ ] Logout action is available and functional

---

## 9. Negative Tests

### 9.1 Route Restrictions
- [ ] Navigating to `/(teacher)/` URL directly does not show teacher dashboard (RLS blocks)
- [ ] Navigating to `/(student)/` URL directly does not show student dashboard (RLS blocks)
- [ ] Navigating to `/(admin)/` URL directly does not show admin dashboard (RLS blocks)
- [ ] Navigating to `/(program-admin)/` URL directly does not show program admin data (RLS blocks)
- [ ] Navigating to `/(master-admin)/` URL directly does not show master admin data (RLS blocks)

### 9.2 Permission Enforcement — Actions Not Allowed
- [ ] Supervisor CANNOT log sessions (no session creation UI, RLS blocks API)
- [ ] Supervisor CANNOT award stickers to students (no UI, RLS blocks)
- [ ] Supervisor CANNOT enroll students into programs (no UI, RLS blocks)
- [ ] Supervisor CANNOT manage team assignments (program_admin scope only)
- [ ] Supervisor CANNOT access master admin features (platform config, global user management)
- [ ] Supervisor CANNOT create or manage programs (program_admin/master_admin scope only)
- [ ] Supervisor CANNOT create or manage cohorts/tracks
- [ ] Supervisor CANNOT approve/reject enrollment applications

### 9.3 Data Scoping
- [ ] Teacher list only shows teachers from supervisor's assigned programs
- [ ] Student data only shows students from supervisor's assigned programs
- [ ] Session data only shows sessions from supervisor's assigned programs
- [ ] Certification list only shows certifications from supervisor's assigned programs
- [ ] Himam events only show events from supervisor's assigned programs
- [ ] Reports only include data from supervisor's assigned programs
- [ ] Attempting to access a teacher outside the supervisor's program returns an error or empty result
- [ ] Attempting to access data from another program via direct URL/API does not expose data (RLS blocks)
- [ ] API calls verified via Supabase logs to include program-scoped filtering

---

## 10. Edge Cases

### 10.1 No Supervised Teachers
- [ ] Supervisor with no supervised teachers sees empty state on Teachers tab
- [ ] Dashboard stats show 0 for teacher count without errors
- [ ] Reports show empty/zero data without errors
- [ ] Reassignment action is not available (no teachers to reassign between)
- [ ] No crashes on any empty-data screen

### 10.2 Teacher With No Students
- [ ] Navigating to a teacher with no students shows empty student list
- [ ] Teacher details still load correctly (session count = 0, student count = 0)
- [ ] Reassignment action is not available for that teacher (no students to move)
- [ ] Teacher reviews screen handles zero reviews gracefully

### 10.3 No Active Himam Events
- [ ] Himam index shows empty state when no events exist
- [ ] Create event action is still accessible
- [ ] No crashes or errors on empty Himam screen

### 10.4 No Certifications
- [ ] Certification list shows empty state when no certifications exist
- [ ] No crashes or errors on empty certification screen

### 10.5 Supervisor With Multiple Programs
- [ ] If supervisor is assigned to multiple programs, data from all assigned programs is aggregated
- [ ] Dashboard stats reflect combined data across all assigned programs
- [ ] Teacher list includes teachers from all assigned programs
- [ ] Filtering by program (if available) correctly narrows data

### 10.6 Network & Loading
- [ ] Slow network shows loading indicators on all data screens
- [ ] Network error displays appropriate error message with retry option
- [ ] Form submissions show loading state to prevent double-submit
- [ ] Navigating between tabs and sub-screens while data is loading does not cause crashes

### 10.7 Concurrent Operations
- [ ] Two supervisors in the same program reassigning the same student do not cause data corruption
- [ ] Revoking a certification while another supervisor views it handles gracefully
