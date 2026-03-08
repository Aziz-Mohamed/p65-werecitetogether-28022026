# Test Script 06 — Program Admin Role

**Role:** Program Admin
**Dashboard route:** `/(program-admin)/`
**First screen:** Program selector (if multiple programs), then 5-tab dashboard
**Tabs:** Home, Classes, Team, Reports, Settings (5 tabs)
**Data scope:** Assigned programs only — can manage everything within their programs
**Program role:** Assigned via `program_roles` table with `role='program_admin'`

**Prerequisites:**
- Program admin account exists with an entry in `program_roles` where `role = 'program_admin'`
- Admin is assigned to at least 2 programs (to test program selector)
- At least 1 program has 2+ classes with enrolled students
- At least 1 class has a waitlist with pending students
- At least 1 teacher and 1 supervisor are assigned to the program via `program_roles`
- A supervisor is linked to a teacher via `supervisor_id` on `program_roles`
- At least 1 memorization track exists in the program
- Sticker catalog has at least 2 stickers scoped to the program
- At least 1 enrollment is in `pending` status (for approve/reject testing)
- At least 1 certification exists for a student in the program
- Sessions have been logged so dashboard stats and reports have data
- RPC function `get_program_admin_dashboard_stats()` is deployed and functional

---

## 1. Dashboard Verification

### 1.1 Program Selector (`select.tsx`)
- [ ] Login as program admin — lands on `/(program-admin)/`
- [ ] If assigned to multiple programs, program selector screen (`select.tsx`) appears first
- [ ] Program selector lists only programs the admin is assigned to
- [ ] Programs not assigned to this admin are NOT shown
- [ ] Tapping a program navigates to the 5-tab dashboard for that program
- [ ] Selected program name is displayed in the dashboard header

### 1.2 Single Program Redirect (`index.tsx`)
- [ ] If assigned to only 1 program, selector is skipped and dashboard loads directly
- [ ] Dashboard loads for the single assigned program without user action

### 1.3 Dashboard Home (`(tabs)/index.tsx`)
- [ ] Dashboard home screen loads with program-scoped stats
- [ ] Enrollment stats visible (total enrolled, pending, approved counts)
- [ ] Class stats visible (total classes, active classes)
- [ ] Teacher stats visible (total teachers assigned)
- [ ] Session stats visible (total sessions, recent activity)
- [ ] Stats are fetched via `get_program_admin_dashboard_stats()` RPC
- [ ] Pull-to-refresh reloads dashboard stats
- [ ] Loading state shown while data is fetching
- [ ] Stats reflect only data from the selected program

### 1.4 Tab Bar Verification
- [ ] Bottom tab bar displays exactly 5 tabs: Home, Classes, Team, Settings, Profile
- [ ] Tapping each tab navigates to the correct screen
- [ ] Active tab is visually highlighted
- [ ] No admin-only tabs (e.g., platform config) are visible
- [ ] No student-only tabs (e.g., enrollment browsing) are visible

---

## 2. Program Management

### 2.1 Program List (`programs/index.tsx`)
- [ ] Program list screen loads
- [ ] Only programs assigned to this admin are listed
- [ ] Programs from other admins or unassigned programs are NOT shown
- [ ] Program cards display name and basic info (class count, enrollment count)
- [ ] Tapping a program navigates to program details

### 2.2 Program Details (`programs/[id]/index.tsx`)
- [ ] Program details screen loads for a selected program
- [ ] Program name, description, and metadata are displayed
- [ ] Navigation options visible for: Classes, Team, Tracks
- [ ] Edit/update options are available for program settings
- [ ] Back navigation returns to program list

### 2.3 Update Program Settings
- [ ] Admin can update program-level settings (e.g., name, description)
- [ ] Changes persist after save
- [ ] Updated values are reflected on the program details screen
- [ ] Validation errors shown for invalid input

---

## 3. Class Management

### 3.1 Class List — Tab (`(tabs)/classes.tsx`)
- [ ] Classes tab loads with list of classes in the selected program
- [ ] Only classes from the current program are shown
- [ ] Class cards display name, student count, and status
- [ ] "Create" button/action is visible and accessible
- [ ] Empty state shown if no classes exist

### 3.2 Class List — Program Scoped (`programs/[id]/classes/index.tsx`)
- [ ] Navigating from program details to classes shows classes for that specific program
- [ ] Class list matches the classes tab for the same program

### 3.3 Create Class (`programs/[id]/classes/create.tsx`)
- [ ] Create class form loads with required fields (name, capacity, start date, etc.)
- [ ] Submitting valid data creates a new class
- [ ] New class appears in the class list after creation
- [ ] New class is scoped to the current program
- [ ] Validation errors shown for missing/invalid fields
- [ ] Cancel/back navigation returns to class list without creating

### 3.4 Class Details (`programs/[id]/classes/[classId].tsx`)
- [ ] Tapping a class navigates to class details
- [ ] Class details show: name, capacity, enrolled student roster, assigned teacher(s)
- [ ] Student list within the class is accurate
- [ ] Edit options are available
- [ ] Back navigation returns to class list

### 3.5 Edit Class
- [ ] Edit form pre-fills with current class data
- [ ] Updating fields (name, capacity, status) and saving persists changes
- [ ] Changes reflected on class details after save
- [ ] Validation errors shown for invalid input (e.g., capacity below current enrollment)
- [ ] Cancel returns to class details without saving

---

## 4. Track Management

### 4.1 Track List (`programs/[id]/tracks.tsx`)
- [ ] Tracks screen loads with memorization tracks for the selected program
- [ ] Only tracks scoped to the current program are shown
- [ ] Track cards display name, description, and associated content
- [ ] "Create" button/action is visible and accessible
- [ ] Empty state shown if no tracks exist

### 4.2 Create Track
- [ ] Create track form loads with required fields
- [ ] Submitting valid data creates a new track in the program
- [ ] New track appears in the track list after creation
- [ ] Track is scoped to the current program
- [ ] Validation errors shown for missing/invalid fields

### 4.3 Edit Track
- [ ] Edit form pre-fills with current track data
- [ ] Updating fields and saving persists changes
- [ ] Changes reflected in track list and details after save
- [ ] Validation errors shown for invalid input

---

## 5. Team Management

### 5.1 Team List — Tab (`(tabs)/team.tsx`)
- [ ] Team tab loads with list of team members assigned to the program
- [ ] Shows teachers and supervisors with their roles
- [ ] Only team members in the current program are shown
- [ ] "Add" button/action is visible and accessible
- [ ] Empty state shown if no team members exist

### 5.2 Program Team (`programs/[id]/team.tsx`)
- [ ] Team management screen loads for the selected program
- [ ] Lists all team members (teachers and supervisors) with their roles
- [ ] Supervisor-teacher linkages are visible (which supervisor oversees which teacher)

### 5.3 Add Team Member (`team/add.tsx`)
- [ ] Add team member form loads
- [ ] Can search/select a user to add to the program
- [ ] Can assign role as `teacher` or `supervisor`
- [ ] Submitting valid data creates a new `program_roles` entry
- [ ] New team member appears in the team list after adding
- [ ] Cannot assign `program_admin` or `master_admin` roles (not available in role picker)
- [ ] Validation errors shown for missing/invalid fields

### 5.4 Link Supervisor to Teacher
- [ ] Admin can link a supervisor to a teacher via `supervisor_id` on `program_roles`
- [ ] Linked relationship is displayed on the team management screen
- [ ] Supervisor can only be linked to teachers within the same program
- [ ] Unlinking a supervisor-teacher pair persists correctly

### 5.5 Remove Team Member
- [ ] Admin can remove a teacher or supervisor from the program
- [ ] Confirmation dialog shown before removal
- [ ] Removed member no longer appears in the team list
- [ ] Removed member's `program_roles` entry is deleted
- [ ] Removing a supervisor also unlinks them from assigned teachers

---

## 6. Enrollment Management

### 6.1 View Enrollments
- [ ] Admin can view all enrollments across classes in the program
- [ ] Enrollment list shows student name, class, and status (pending, approved, rejected)
- [ ] Only enrollments from the admin's assigned programs are shown
- [ ] Can filter by enrollment status

### 6.2 Approve Enrollment
- [ ] Admin can approve a pending enrollment
- [ ] Approved enrollment status changes to `approved`
- [ ] Student gains access to the class after approval
- [ ] Enrollment count updates on dashboard stats

### 6.3 Reject Enrollment
- [ ] Admin can reject a pending enrollment
- [ ] Rejected enrollment status changes to `rejected`
- [ ] Student does not gain access to the class
- [ ] Confirmation dialog shown before rejection

---

## 7. Waitlist Management

### 7.1 View Waitlist (`waitlist/[classId].tsx`)
- [ ] Waitlist screen loads for a specific class
- [ ] Shows students on the waitlist with their position/order
- [ ] Only waitlist entries for the selected class are shown
- [ ] Empty state shown if waitlist is empty

### 7.2 Promote from Waitlist
- [ ] Admin can promote a student from the waitlist to enrolled status
- [ ] Promoted student is removed from the waitlist
- [ ] Promoted student appears in the class's enrolled student roster
- [ ] Class enrollment count updates accordingly
- [ ] If class is at capacity, promotion is blocked with appropriate message
- [ ] Confirmation dialog shown before promotion

---

## 8. Reports & Analytics

### 8.1 Dashboard Stats
- [ ] Dashboard home displays aggregated stats from `get_program_admin_dashboard_stats()` RPC
- [ ] Stats include: enrollment totals, class activity, teacher activity, session counts
- [ ] Stats are scoped to the selected program only
- [ ] Stats update after changes (new enrollments, sessions, etc.)

### 8.2 Program Reports (`(tabs)/reports.tsx`)
- [ ] Reports tab loads with program-scoped analytics
- [ ] Charts/tables display meaningful data (enrollment trends, session activity, student progress)
- [ ] Data is read-only (no editing from reports screen)
- [ ] Can filter by date range or class
- [ ] Empty state shown if insufficient data for charts
- [ ] Reports do NOT include data from other programs

### 8.3 Aggregated Ratings
- [ ] Admin can view aggregated student ratings scoped to the program
- [ ] Ratings are read-only
- [ ] Ratings from other programs are NOT visible

---

## 9. Rewards & Stickers

### 9.1 Sticker Catalog (`rewards/index.tsx`)
- [ ] Rewards/sticker management screen loads
- [ ] Shows sticker catalog scoped to the program
- [ ] Sticker cards display name, image/icon, and point value
- [ ] "Create" button/action is visible and accessible

### 9.2 Create Sticker
- [ ] Create sticker form loads with required fields (name, icon, point value)
- [ ] Submitting valid data creates a new sticker in the program catalog
- [ ] New sticker appears in the catalog after creation
- [ ] Validation errors shown for missing/invalid fields

### 9.3 Edit Sticker
- [ ] Edit form pre-fills with current sticker data
- [ ] Updating fields and saving persists changes
- [ ] Changes reflected in catalog
- [ ] Updated stickers are available to teachers in the program

### 9.4 Delete Sticker
- [ ] Admin can delete a sticker from the catalog
- [ ] Confirmation dialog shown before deletion
- [ ] Deleted sticker no longer appears in the catalog
- [ ] Previously awarded instances of the sticker are handled gracefully (not removed from students)

---

## 10. Certification Management

### 10.1 Certification List (`certifications/index.tsx`)
- [ ] Certification list loads with certifications scoped to the program
- [ ] Each certification shows student name, track/level, date issued, and status
- [ ] Only certifications from the admin's assigned programs are shown
- [ ] Empty state shown if no certifications exist

### 10.2 Certification Details (`certifications/[id].tsx`)
- [ ] Tapping a certification navigates to its detail screen
- [ ] Full certification details are displayed (student, program, track, date, QR code, etc.)
- [ ] Back navigation returns to certification list

### 10.3 Revoke Certification
- [ ] Admin can revoke an active certification
- [ ] Confirmation dialog shown before revocation
- [ ] Revoked certification status updates (e.g., marked as `revoked`)
- [ ] Revoked certification is no longer verifiable via the verify-certificate Edge Function
- [ ] Revocation is logged/auditable

---

## 11. Profile & Settings

### 11.1 Program Settings (`(tabs)/settings.tsx`)
- [ ] Settings tab loads with program-level configuration options
- [ ] Admin can view and update settings for the selected program
- [ ] Changes persist after save
- [ ] Settings are scoped to the current program only (not platform-wide)

### 11.2 Personal Profile
- [ ] Admin can view their own profile
- [ ] Admin can edit their own profile (name, contact info, etc.)
- [ ] Profile changes persist after save
- [ ] Validation errors shown for invalid input

---

## 12. Negative Tests

### 12.1 Cannot Create Programs
- [ ] No "Create Program" button/action exists in the program admin UI
- [ ] Directly calling the create-program API/RPC as program admin is rejected by RLS
- [ ] No route or screen exists for program creation within `/(program-admin)/`

### 12.2 Cannot Manage Other Programs
- [ ] Program admin CANNOT see programs they are not assigned to
- [ ] Navigating to a program ID the admin is not assigned to returns an error or empty state
- [ ] API calls scoped to unassigned programs are blocked by RLS
- [ ] Classes, team, tracks from other programs are NOT accessible

### 12.3 Cannot Assign Master Admin Role
- [ ] Role picker when adding team members does NOT include `master_admin` option
- [ ] Role picker does NOT include `program_admin` option
- [ ] Directly calling the assign-role API with `master_admin` is rejected by RLS
- [ ] Directly calling the assign-role API with `program_admin` is rejected by RLS

### 12.4 Cannot Access Platform Config
- [ ] No "Platform Config" or global settings menu exists in program admin UI
- [ ] Navigating to `/(master-admin)/` URL directly does not show master admin data (RLS blocks)
- [ ] `platform_config` table is not readable by program admin (RLS blocks)

### 12.5 Route Restrictions
- [ ] Navigating to `/(student)/` URL directly does not show student dashboard
- [ ] Navigating to `/(teacher)/` URL directly does not show teacher dashboard
- [ ] Navigating to `/(supervisor)/` URL directly does not show supervisor dashboard

---

## 13. Edge Cases

### 13.1 Single Program Assignment
- [ ] Admin assigned to only 1 program bypasses the program selector
- [ ] Dashboard loads directly for the single program
- [ ] All screens function correctly without the selector step
- [ ] Program switching UI is hidden or disabled

### 13.2 No Classes
- [ ] Program with zero classes shows empty state on Classes tab
- [ ] Dashboard stats show 0 classes without errors
- [ ] "Create Class" action is still accessible
- [ ] Enrollment and waitlist screens handle the absence of classes gracefully

### 13.3 Empty Team
- [ ] Program with no assigned teachers or supervisors shows empty state on Team tab
- [ ] "Add Team Member" action is still accessible
- [ ] Dashboard stats show 0 teachers without errors
- [ ] Reports handle absence of team data gracefully

### 13.4 Full Class
- [ ] Class at maximum capacity does not allow new enrollments (approval blocked)
- [ ] Waitlist promotion is blocked with an appropriate capacity message
- [ ] Error message clearly indicates the class is full
- [ ] Class capacity is displayed on the class details screen

### 13.5 No Enrollments
- [ ] Program with zero enrollments shows empty state on enrollment views
- [ ] Approve/reject actions are not rendered when no pending enrollments exist
- [ ] Dashboard stats show 0 enrollments without errors

### 13.6 No Certifications
- [ ] Program with zero certifications shows empty state on certifications screen
- [ ] No crashes or errors on empty certification list

### 13.7 Program Switching
- [ ] Switching between programs via the selector updates all tabs with the new program's data
- [ ] No stale data from the previous program is shown after switching
- [ ] Stats, classes, team, reports, and settings all reflect the newly selected program

### 13.8 Network & Loading
- [ ] Slow network shows loading indicators on all data screens
- [ ] Network error displays appropriate error message with retry option
- [ ] Form submissions show loading state to prevent double-submit
- [ ] Navigating between tabs while data is loading does not cause crashes

### 13.9 Concurrent Operations
- [ ] Two program admins on the same program editing the same class do not cause data corruption
- [ ] Approving an enrollment while another admin rejects the same enrollment is handled gracefully
- [ ] Promoting from waitlist while another admin fills the last class spot shows an appropriate error
