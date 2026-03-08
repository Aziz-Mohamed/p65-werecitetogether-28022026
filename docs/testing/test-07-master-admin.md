# Test Script 07 — Master Admin Role

## Role Overview

- **Dashboard route:** `/(master-admin)/`
- **Layout:** Scroll dashboard with stat cards + navigation buttons (no tabs)
- **Scope:** Entire platform — unrestricted access
- **Nav cards:** Users, Program Admins, Supervisors, Teachers, Students, Classes, Programs, Stickers, Reports, Certifications, Settings, Permissions, Reset Password, Language

## Screens Under Test

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `index.tsx` | Stats + nav cards + quick actions |
| User Management | `users/index.tsx` | User search and filter |
| User Details | `users/[id].tsx` | User details + role management |
| Student List | `students/index.tsx` | All students |
| Create Student | `students/create.tsx` | Create new student |
| Student Details | `students/[id]/index.tsx` | Student profile + progress |
| Student Edit | `students/[id]/edit.tsx` | Edit student info |
| Teacher List | `teachers/index.tsx` | All teachers |
| Create Teacher | `teachers/create.tsx` | Create new teacher |
| Teacher Details | `teachers/[id]/index.tsx` | Teacher profile + stats |
| Teacher Edit | `teachers/[id]/edit.tsx` | Edit teacher info |
| Class List | `classes/index.tsx` | All classes |
| Create Class | `classes/create.tsx` | Create new class |
| Class Details | `classes/[id]/index.tsx` | Class details + roster |
| Class Edit | `classes/[id]/edit.tsx` | Edit class settings |
| Class Schedule | `classes/[id]/schedule.tsx` | View/manage class schedule |
| Programs List | `programs/index.tsx` | All programs |
| Create Program | `programs/create.tsx` | Create new program |
| Program Details | `programs/[id]/index.tsx` | Program overview |
| Program Edit | `programs/[id]/edit.tsx` | Edit program settings |
| Program Team | `programs/[id]/team.tsx` | Program team management |
| Program Tracks | `programs/[id]/tracks.tsx` | Program memorization tracks |
| Program Classes | `programs/[id]/classes/index.tsx` | Classes within a program |
| Program Class Detail | `programs/[id]/classes/[classId].tsx` | Specific class in program |
| Reports Hub | `reports/index.tsx` | School Pulse overview + links |
| Platform Report | `reports/platform.tsx` | Platform-wide metrics |
| Teacher Activity | `reports/teacher-activity.tsx` | Teacher activity metrics |
| Teacher Attendance | `reports/teacher-attendance.tsx` | Teacher check-in data |
| Session Completion | `reports/session-completion.tsx` | Session completion rates |
| Memorization Report | `reports/memorization.tsx` | Memorization progress stats |
| Settings | `settings/index.tsx` | Platform config |
| Permissions | `settings/permissions.tsx` | Feature permissions |
| Sticker Catalog | `stickers/index.tsx` | Browse/manage stickers |
| Create Sticker | `stickers/create.tsx` | Create new sticker |
| Edit Sticker | `stickers/[id]/edit.tsx` | Edit existing sticker |
| Certifications List | `certifications/index.tsx` | All certifications + filters |
| Certification Details | `certifications/[id].tsx` | Single certification view |
| Supervisors | `supervisors/index.tsx` | Supervisor list |
| Program Admins | `program-admins/index.tsx` | Program admin list |
| Attendance | `attendance/index.tsx` | Bulk attendance marking |
| Edit Role | `members/edit-role.tsx` | Change member global role |
| Reset Password | `members/reset-password.tsx` | Reset member passwords |

## Key Permissions (Unrestricted)

- View/manage ALL users, programs, enrollments, sessions, certifications
- Create new programs (W)
- Change any user's global role via `change_user_role()` RPC
- Assign/revoke `master_admin` role via `assign_master_admin_role()` / `revoke_master_admin_role()` RPCs
- Update platform config via `platform_config` table (exclusive)
- Search users via `search_users_for_role_assignment()` RPC
- View platform-wide stats via `get_master_admin_dashboard_stats()` RPC
- Cannot revoke the last `master_admin` (safety check in RPC)
- Cannot demote self via `change_user_role()` (safety check)

---

## Quick Smoke Test

> Run these first. If any fail, stop and investigate before continuing with the full script.

- [ ] **QS-01** Login → scroll dashboard (no tabs) with stat cards and nav cards
- [ ] **QS-02** Stat cards load: total students, teachers, sessions, programs
- [ ] **QS-03** All 14 nav cards present and each navigates to correct screen
- [ ] **QS-04** Can create a student (form loads, submit works)
- [ ] **QS-05** Can create a teacher (form loads, submit works)
- [ ] **QS-06** Can create a class (form loads, submit works)
- [ ] **QS-07** Can create a program (form loads, submit works)
- [ ] **QS-08** Can view student details and edit
- [ ] **QS-09** Can change a user's global role from user details
- [ ] **QS-10** Reports hub loads with School Pulse overview
- [ ] **QS-11** Settings and Permissions screens load
- [ ] **QS-12** Cannot demote the last master admin (safety check works)

---

## 1. Dashboard Verification

- [ ] **1.1** Log in as a user with `master_admin` role
- [ ] **1.2** Confirm the dashboard uses a scroll layout (not tab-based navigation)
- [ ] **1.3** Verify stat cards are displayed: total students, total teachers, active sessions, programs count
- [ ] **1.4** Verify a program list section is visible on the dashboard
- [ ] **1.5** Confirm quick action buttons are present: Add Student, Add Teacher, Add Class
- [ ] **1.6** Confirm all 14 nav cards are present: Users, Program Admins, Supervisors, Teachers, Students, Classes, Programs, Stickers, Reports, Certifications, Settings, Permissions, Reset Password, Language
- [ ] **1.7** Tap each nav card and verify it navigates to the correct screen
- [ ] **1.8** Verify stats are fetched via `get_master_admin_dashboard_stats()` RPC (check network/logs)
- [ ] **1.9** Pull to refresh and confirm stats update
- [ ] **1.10** Error state shown if RPC fails, with retry option

## 2. User Management

- [ ] **2.1** Navigate to Users screen (`users/index.tsx`)
- [ ] **2.2** Verify all platform users are listed
- [ ] **2.3** Search for a user by name — confirm results filter correctly
- [ ] **2.4** Search for a user by email — confirm results filter correctly
- [ ] **2.5** Apply role filter (e.g., show only teachers) — confirm list updates
- [ ] **2.6** Clear filters — confirm full list returns
- [ ] **2.7** Tap a user to navigate to user details (`users/[id].tsx`)
- [ ] **2.8** Verify user details screen shows profile info, current global role, and program roles
- [ ] **2.9** Verify `search_users_for_role_assignment()` RPC is used for search functionality

## 3. Role Management

### 3.1 Master Admin Role Assignment
- [ ] **3.1.1** From user details, assign `master_admin` role via `assign_master_admin_role()` RPC
- [ ] **3.1.2** Confirm success feedback is shown
- [ ] **3.1.3** Verify the user now appears with `master_admin` role in their details
- [ ] **3.1.4** Revoke `master_admin` from a user (when multiple master admins exist) via `revoke_master_admin_role()`
- [ ] **3.1.5** Confirm success feedback and role removed from user details
- [ ] **3.1.6** Attempt to revoke from the last remaining master admin — confirm rejection with error message
- [ ] **3.1.7** Verify the last master admin still retains their role after the failed attempt

### 3.2 Global Role Change (`change_user_role` RPC)
- [ ] **3.2.1** From user details, tap "Manage Roles" — `RoleAssignmentSheet` opens
- [ ] **3.2.2** Change a user's global role (e.g., student → teacher)
- [ ] **3.2.3** Confirm success feedback and role updates in user details
- [ ] **3.2.4** Verify the role change persists (re-navigate to user details)
- [ ] **3.2.5** Attempt to demote self from master_admin — confirm rejection
- [ ] **3.2.6** Attempt to demote the last master_admin — confirm rejection
- [ ] **3.2.7** Navigate to `members/edit-role.tsx` — alternate role change screen loads

## 4. Student Management

### 4.1 Student List & Create
- [ ] **4.1.1** Navigate to Students screen (`students/index.tsx`)
- [ ] **4.1.2** Verify all students across the platform are listed
- [ ] **4.1.3** Navigate to Create Student (`students/create.tsx`)
- [ ] **4.1.4** Fill in required fields and submit — student created
- [ ] **4.1.5** New student appears in the student list

### 4.2 Student Details & Edit
- [ ] **4.2.1** Tap a student → details screen loads (`students/[id]/index.tsx`)
- [ ] **4.2.2** Verify student profile, enrollment info, and progress data displayed
- [ ] **4.2.3** Navigate to edit screen (`students/[id]/edit.tsx`)
- [ ] **4.2.4** Update fields and save — changes persist
- [ ] **4.2.5** Validation errors shown for invalid input
- [ ] **4.2.6** Back navigation returns to student details

## 5. Teacher Management

### 5.1 Teacher List & Create
- [ ] **5.1.1** Navigate to Teachers screen (`teachers/index.tsx`)
- [ ] **5.1.2** Verify all teachers across the platform are listed
- [ ] **5.1.3** Navigate to Create Teacher (`teachers/create.tsx`)
- [ ] **5.1.4** Fill in required fields and submit — teacher created
- [ ] **5.1.5** New teacher appears in the teacher list

### 5.2 Teacher Details & Edit
- [ ] **5.2.1** Tap a teacher → details screen loads (`teachers/[id]/index.tsx`)
- [ ] **5.2.2** Verify teacher profile, program assignments, and session stats displayed
- [ ] **5.2.3** Navigate to edit screen (`teachers/[id]/edit.tsx`)
- [ ] **5.2.4** Update fields and save — changes persist
- [ ] **5.2.5** Back navigation returns to teacher details

## 6. Class Management

### 6.1 Class List & Create
- [ ] **6.1.1** Navigate to Classes screen (`classes/index.tsx`)
- [ ] **6.1.2** Verify all classes across the platform are listed
- [ ] **6.1.3** Navigate to Create Class (`classes/create.tsx`)
- [ ] **6.1.4** Fill in required fields (name, capacity, program, etc.) and submit — class created
- [ ] **6.1.5** New class appears in the class list

### 6.2 Class Details, Edit & Schedule
- [ ] **6.2.1** Tap a class → details screen loads (`classes/[id]/index.tsx`)
- [ ] **6.2.2** Verify class name, capacity, enrolled students, and assigned teacher displayed
- [ ] **6.2.3** Navigate to edit screen (`classes/[id]/edit.tsx`)
- [ ] **6.2.4** Update fields and save — changes persist
- [ ] **6.2.5** Navigate to schedule screen (`classes/[id]/schedule.tsx`)
- [ ] **6.2.6** Schedule data loads (sessions, time slots)
- [ ] **6.2.7** Back navigation returns to class details

## 7. Program Management

### 7.1 Program List & Create
- [ ] **7.1.1** Navigate to Programs screen (`programs/index.tsx`)
- [ ] **7.1.2** Verify all programs across the platform are listed
- [ ] **7.1.3** Navigate to Create Program (`programs/create.tsx`)
- [ ] **7.1.4** Fill in all required fields and submit — program created
- [ ] **7.1.5** New program appears in the programs list

### 7.2 Program Details & Edit
- [ ] **7.2.1** Tap a program → details screen loads (`programs/[id]/index.tsx`)
- [ ] **7.2.2** Verify program name, description, enrollment stats, and team info displayed
- [ ] **7.2.3** Navigate to edit screen (`programs/[id]/edit.tsx`)
- [ ] **7.2.4** Update fields and save — changes persist

### 7.3 Program Team Management
- [ ] **7.3.1** Navigate to program team (`programs/[id]/team.tsx`)
- [ ] **7.3.2** Team members listed with roles (teachers, supervisors, program admins)
- [ ] **7.3.3** Can add/remove team members
- [ ] **7.3.4** Supervisor-teacher linkages visible and editable

### 7.4 Program Tracks
- [ ] **7.4.1** Navigate to program tracks (`programs/[id]/tracks.tsx`)
- [ ] **7.4.2** Tracks listed with name and description
- [ ] **7.4.3** Can create/edit tracks

### 7.5 Program Classes
- [ ] **7.5.1** Navigate to program classes (`programs/[id]/classes/index.tsx`)
- [ ] **7.5.2** Classes within the program listed
- [ ] **7.5.3** Tap a class → class detail loads (`programs/[id]/classes/[classId].tsx`)

## 8. Reports & Analytics

### 8.1 Reports Hub
- [ ] **8.1.1** Navigate to Reports (`reports/index.tsx`)
- [ ] **8.1.2** School Pulse overview card loads with summary metrics
- [ ] **8.1.3** Pillar cards visible: Student Health, Teacher Engagement, Academic Progress
- [ ] **8.1.4** Quick links to detailed reports are present

### 8.2 Detailed Reports
- [ ] **8.2.1** Platform Report (`reports/platform.tsx`) — platform-wide metrics load
- [ ] **8.2.2** Teacher Activity (`reports/teacher-activity.tsx`) — teacher activity data loads
- [ ] **8.2.3** Teacher Attendance (`reports/teacher-attendance.tsx`) — attendance/check-in data loads
- [ ] **8.2.4** Session Completion (`reports/session-completion.tsx`) — completion rates load
- [ ] **8.2.5** Memorization (`reports/memorization.tsx`) — memorization stats load
- [ ] **8.2.6** All reports show cross-program data (not scoped to a single program)
- [ ] **8.2.7** Charts/graphs render correctly without visual glitches
- [ ] **8.2.8** Date range filters work (if present)

## 9. Sticker Management

- [ ] **9.1** Navigate to Sticker Catalog (`stickers/index.tsx`)
- [ ] **9.2** Verify all stickers listed with name, image/icon, and tier
- [ ] **9.3** Navigate to Create Sticker (`stickers/create.tsx`)
- [ ] **9.4** Fill in required fields and submit — sticker created
- [ ] **9.5** New sticker appears in catalog
- [ ] **9.6** Tap a sticker → edit screen loads (`stickers/[id]/edit.tsx`)
- [ ] **9.7** Update fields and save — changes persist
- [ ] **9.8** Validation errors shown for invalid input

## 10. Certification Management

- [ ] **10.1** Navigate to Certifications list (`certifications/index.tsx`)
- [ ] **10.2** Verify all certifications across the platform are listed
- [ ] **10.3** Filter buttons work (Program, Type, Status dropdowns)
- [ ] **10.4** Tap a certification → details screen loads (`certifications/[id].tsx`)
- [ ] **10.5** Certification details include student info, program, type, date, and status
- [ ] **10.6** Revoke a certification — confirm status updates
- [ ] **10.7** Revoked certification reflected in the list view

## 11. Platform Settings & Config

### 11.1 Settings
- [ ] **11.1.1** Navigate to Settings (`settings/index.tsx`)
- [ ] **11.1.2** Current platform config values displayed from `platform_config` table
- [ ] **11.1.3** Update a config value and save — changes persist
- [ ] **11.1.4** Only `master_admin` users can access `platform_config`

### 11.2 Permissions
- [ ] **11.2.1** Navigate to Permissions (`settings/permissions.tsx`)
- [ ] **11.2.2** Feature permission toggles displayed
- [ ] **11.2.3** Changes persist after save

## 12. Attendance Management

- [ ] **12.1** Navigate to Attendance (`attendance/index.tsx`)
- [ ] **12.2** Bulk attendance marking interface loads
- [ ] **12.3** Can mark attendance for multiple students
- [ ] **12.4** Changes persist

> **Note:** The Attendance screen is not linked from the dashboard nav cards. Access it via direct navigation or from a class context.

## 13. Member Management

- [ ] **13.1** Navigate to Edit Role (`members/edit-role.tsx`)
- [ ] **13.2** Role selector interface loads
- [ ] **13.3** Can change a member's role and save
- [ ] **13.4** Navigate to Reset Password (`members/reset-password.tsx`)
- [ ] **13.5** Can reset a member's password
- [ ] **13.6** Confirmation/success feedback shown

## 14. Role-Specific Lists

- [ ] **14.1** Navigate to Supervisors (`supervisors/index.tsx`) — supervisor list loads
- [ ] **14.2** Navigate to Program Admins (`program-admins/index.tsx`) — program admin list loads
- [ ] **14.3** Lists show relevant user info (name, assigned programs)

## 15. Profile & Logout

- [ ] **15.1** Navigate to profile / account section
- [ ] **15.2** Verify profile information displayed correctly
- [ ] **15.3** Log out of the app — redirected to login screen
- [ ] **15.4** Attempt to access a master admin route while logged out — redirect to login

## 16. Negative Tests

- [ ] **16.1** Attempt to revoke `master_admin` from the sole remaining master admin — rejected
- [ ] **16.2** Attempt to demote self via `change_user_role()` — rejected
- [ ] **16.3** Log in as non-master-admin, attempt `/(master-admin)/` routes — data not accessible (RLS)
- [ ] **16.4** As non-master-admin, call `assign_master_admin_role()` RPC — permission error
- [ ] **16.5** As non-master-admin, call `change_user_role()` RPC — permission error
- [ ] **16.6** As non-master-admin, update `platform_config` — permission error
- [ ] **16.7** Submit create forms with missing required fields — validation errors shown
- [ ] **16.8** Assign `master_admin` to a user who already has it — graceful handling

## 17. Edge Cases

- [ ] **17.1** Dashboard with zero programs — empty state shown gracefully
- [ ] **17.2** User search with zero results — empty state message
- [ ] **17.3** Large dataset (many users/programs) — list performance and scrolling smooth
- [ ] **17.4** Rapidly toggling between nav cards — no navigation glitches or stale data
- [ ] **17.5** Network disconnect on dashboard — error/offline state shown
- [ ] **17.6** Session timeout during an admin action — re-authentication prompt
- [ ] **17.7** Create student/teacher/class with duplicate data — appropriate error handling
- [ ] **17.8** Edit a user that was deleted by another admin — graceful error

---

## Sign-Off

| Section | Tester | Date | Pass/Fail | Notes |
|---------|--------|------|-----------|-------|
| 1. Dashboard | | | | |
| 2. User Management | | | | |
| 3. Role Management | | | | |
| 4. Student Management | | | | |
| 5. Teacher Management | | | | |
| 6. Class Management | | | | |
| 7. Program Management | | | | |
| 8. Reports & Analytics | | | | |
| 9. Sticker Management | | | | |
| 10. Certification Management | | | | |
| 11. Settings & Config | | | | |
| 12. Attendance | | | | |
| 13. Member Management | | | | |
| 14. Role-Specific Lists | | | | |
| 15. Profile & Logout | | | | |
| 16. Negative Tests | | | | |
| 17. Edge Cases | | | | |

---

**Tester:** _______________
**Date:** _______________
**Build/Version:** _______________
**Device(s):** _______________
**Overall Result:** PASS / FAIL / PARTIAL
**Notes:**
