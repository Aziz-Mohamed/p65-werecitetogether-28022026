# Test Script 04 — Admin (School) Role

**Role:** Admin
**Dashboard route:** `/(admin)/`
**Layout:** Scroll dashboard (no tabs), nav cards to sub-screens
**Theme color:** Sky
**Data scope:** School-scoped (legacy role, uses `school_id`)

**Prerequisites:**
- Admin account exists with `role = 'admin'` in `profiles`, linked to a school via `school_id`
- School has at least 2 students, 1 teacher, 1 parent, and 1 class
- At least 1 class has a schedule configured
- Sticker catalog has at least 1 sticker
- At least 1 session and attendance record exists
- Teacher has logged sessions with students in the school

---

## 1. Dashboard

### 1.1 Dashboard Screen (`index.tsx`)
- [ ] Login as admin — lands on `/(admin)/` scroll dashboard
- [ ] No tab bar visible (scroll layout with nav cards)
- [ ] Dashboard uses Sky theme color
- [ ] School-scoped stats are displayed (student count, teacher count, class count, etc.)
- [ ] Stats reflect only data from the admin's `school_id`
- [ ] Nav cards are visible for: Students, Teachers, Parents, Classes, Stickers, Attendance, Reports, Settings
- [ ] Tapping each nav card navigates to the correct sub-screen
- [ ] Pull-to-refresh reloads dashboard stats
- [ ] Loading state shown while data is fetching

---

## 2. Student Management

### 2.1 Student List (`students/index.tsx`)
- [ ] Student list loads with all students in the school
- [ ] Only students scoped to admin's `school_id` are shown
- [ ] Student cards display name and basic info
- [ ] Search/filter functionality works (if implemented)
- [ ] "Create" button/action is visible and accessible
- [ ] List handles pagination or scrolling for many students

### 2.2 Create Student (`students/create.tsx`)
- [ ] Create student form loads with required fields
- [ ] Submitting valid data creates a new student
- [ ] New student appears in the student list after creation
- [ ] New student is scoped to admin's `school_id`
- [ ] Validation errors shown for missing/invalid fields
- [ ] Cancel/back navigation returns to student list without creating

### 2.3 View Student (`students/[id]/index.tsx`)
- [ ] Tapping a student navigates to their profile
- [ ] Student details are displayed (name, class, enrollment, sessions)
- [ ] Edit and other action buttons are visible
- [ ] Back navigation returns to student list

### 2.4 Edit Student (`students/[id]/edit.tsx`)
- [ ] Edit form pre-fills with current student data
- [ ] Updating fields and saving persists changes
- [ ] Changes reflected on student profile after save
- [ ] Validation errors shown for invalid input
- [ ] Cancel returns to student profile without saving changes

---

## 3. Teacher Management

### 3.1 Teacher List (`teachers/index.tsx`)
- [ ] Teacher list loads with all teachers in the school
- [ ] Only teachers scoped to admin's `school_id` are shown
- [ ] Teacher cards display name and basic info
- [ ] "Create" button/action is visible and accessible

### 3.2 Create Teacher (`teachers/create.tsx`)
- [ ] Create teacher form loads with required fields
- [ ] Submitting valid data creates a new teacher profile
- [ ] New teacher appears in the teacher list after creation
- [ ] New teacher is scoped to admin's `school_id`
- [ ] Validation errors shown for missing/invalid fields

### 3.3 View Teacher (`teachers/[id]/index.tsx`)
- [ ] Tapping a teacher navigates to their profile
- [ ] Teacher details are displayed (name, classes, student count, session stats)
- [ ] Edit and other action buttons are visible

### 3.4 Edit Teacher (`teachers/[id]/edit.tsx`)
- [ ] Edit form pre-fills with current teacher data
- [ ] Updating fields and saving persists changes
- [ ] Validation errors shown for invalid input
- [ ] Cancel returns to teacher profile without saving changes

---

## 4. Parent Management

### 4.1 Parent List (`parents/index.tsx`)
- [ ] Parent list loads with all parents in the school
- [ ] Only parents scoped to admin's `school_id` are shown
- [ ] Parent cards display name and linked children count
- [ ] "Create" button/action is visible and accessible

### 4.2 Create Parent (`parents/create.tsx`)
- [ ] Create parent form loads with required fields
- [ ] Submitting valid data creates a new parent profile
- [ ] New parent appears in the parent list after creation
- [ ] Option to link parent to existing student(s) is available
- [ ] Validation errors shown for missing/invalid fields

### 4.3 View Parent (`parents/[id]/index.tsx`)
- [ ] Tapping a parent navigates to their profile
- [ ] Parent details displayed with linked children info
- [ ] Edit button visible

### 4.4 Edit Parent (`parents/[id]/edit.tsx`)
- [ ] Edit form pre-fills with current parent data
- [ ] Updating fields and saving persists changes
- [ ] Can modify parent-child links
- [ ] Validation errors shown for invalid input

---

## 5. Member Management

### 5.1 Edit Member Role (`members/edit-role.tsx`)
- [ ] Edit role screen loads with member selection
- [ ] Admin can change a member's role within the school
- [ ] Role change persists and takes effect on next login
- [ ] Cannot assign roles outside school scope (e.g., cannot set `master_admin`)
- [ ] Cannot change own role (prevented by `prevent_role_self_update()` trigger)
- [ ] Confirmation dialog shown before role change

### 5.2 Reset Password (`members/reset-password.tsx`)
- [ ] Reset password screen loads
- [ ] Admin can select a school member and trigger password reset
- [ ] Reset action sends password reset email or sets temporary password
- [ ] Confirmation shown after successful reset
- [ ] Cannot reset password for users outside admin's school

---

## 6. Class Management

### 6.1 Class List (`classes/index.tsx`)
- [ ] Class list loads with all classes in the school
- [ ] Only classes scoped to admin's `school_id` are shown
- [ ] Class cards display name, teacher, and student count
- [ ] "Create" button/action is visible and accessible

### 6.2 Create Class (`classes/create.tsx`)
- [ ] Create class form loads with required fields (name, assigned teacher, level)
- [ ] Can assign a teacher from the school's teacher list
- [ ] Submitting valid data creates a new class
- [ ] New class appears in the class list after creation
- [ ] Validation errors shown for missing/invalid fields

### 6.3 View Class (`classes/[id]/index.tsx`)
- [ ] Tapping a class navigates to class details
- [ ] Class details show: name, teacher, student roster, level
- [ ] Edit, schedule, and other action buttons are visible

### 6.4 Edit Class (`classes/[id]/edit.tsx`)
- [ ] Edit form pre-fills with current class data
- [ ] Can change teacher assignment, name, level
- [ ] Updating and saving persists changes
- [ ] Validation errors shown for invalid input

### 6.5 Class Schedule (`classes/[id]/schedule.tsx`)
- [ ] Schedule screen loads with current class schedule
- [ ] Admin can view weekly schedule with time slots
- [ ] Admin can add/edit/remove schedule entries
- [ ] Schedule changes persist after save
- [ ] Empty state shown if no schedule configured

---

## 7. Sticker Catalog

### 7.1 Sticker List (`stickers/index.tsx`)
- [ ] Sticker catalog loads with all stickers for the school
- [ ] Only stickers scoped to admin's `school_id` are shown
- [ ] Sticker cards display name, image/icon, and point value
- [ ] "Create" button/action is visible and accessible

### 7.2 Create Sticker (`stickers/create.tsx`)
- [ ] Create sticker form loads with required fields (name, icon, point value)
- [ ] Submitting valid data creates a new sticker
- [ ] New sticker appears in the catalog after creation
- [ ] Validation errors shown for missing/invalid fields

### 7.3 Edit Sticker (`stickers/[id]/edit.tsx`)
- [ ] Edit form pre-fills with current sticker data
- [ ] Updating fields and saving persists changes
- [ ] Changes reflected in catalog and available to teachers
- [ ] Validation errors shown for invalid input

---

## 8. Attendance

### 8.1 View Attendance (`attendance/index.tsx`)
- [ ] Attendance screen loads with school-wide attendance data
- [ ] Only attendance scoped to admin's `school_id` is shown
- [ ] Can filter by class, date range, or student
- [ ] Attendance records show: student name, date, status (present/absent)
- [ ] Admin can mark attendance for students
- [ ] Marking attendance persists and is reflected in records
- [ ] Summary stats visible (attendance rate, trends)

---

## 9. Reports

### 9.1 Reports Index (`reports/index.tsx`)
- [ ] Reports index loads with navigation to all report types
- [ ] Nav options for: Memorization, Session Completion, Teacher Activity, Teacher Attendance

### 9.2 Memorization Report (`reports/memorization.tsx`)
- [ ] Memorization report loads with school-scoped data
- [ ] Shows student memorization progress across the school
- [ ] Can filter by class or student
- [ ] Data presented in charts/tables
- [ ] Data is read-only

### 9.3 Session Completion Report (`reports/session-completion.tsx`)
- [ ] Session completion report loads with school-scoped data
- [ ] Shows completed vs pending sessions for the school
- [ ] Can filter by teacher, class, or date range
- [ ] Data presented in charts/tables

### 9.4 Teacher Activity Report (`reports/teacher-activity.tsx`)
- [ ] Teacher activity report loads with school-scoped data
- [ ] Shows each teacher's session count, student count, and activity metrics
- [ ] Can identify inactive or underperforming teachers
- [ ] Data scoped to admin's school only

### 9.5 Teacher Attendance Report (`reports/teacher-attendance.tsx`)
- [ ] Teacher attendance report loads with school-scoped data
- [ ] Shows teacher attendance/punctuality records
- [ ] Can filter by teacher or date range
- [ ] Data scoped to admin's school only

---

## 10. Settings

### 10.1 Permissions (`settings/permissions.tsx`)
- [ ] Permissions screen loads with current permission configuration
- [ ] Admin can view and modify school-level permission settings
- [ ] Changes persist after save
- [ ] Only school-scoped permissions editable (not platform-wide)

---

## 11. Negative Tests

### 11.1 Route Restrictions
- [ ] Navigating to `/(program-admin)/` URL directly does not show program admin data (RLS blocks)
- [ ] Navigating to `/(master-admin)/` URL directly does not show master admin data (RLS blocks)
- [ ] Navigating to `/(supervisor)/` URL directly does not show supervisor data (RLS blocks)
- [ ] Navigating to `/(student)/` URL directly does not show student dashboard
- [ ] Navigating to `/(teacher)/` URL directly does not show teacher dashboard

### 11.2 Permission Enforcement — Programs & Cohorts
- [ ] Admin CANNOT create programs (no UI, RLS blocks)
- [ ] Admin CANNOT create/edit cohorts (no UI, RLS blocks)
- [ ] Admin CANNOT create/edit tracks (no UI, RLS blocks)
- [ ] Admin CANNOT manage program roles (team assignment — that is program_admin scope)
- [ ] Admin CANNOT approve/reject enrollments (program-scoped, not school-scoped)
- [ ] Admin CANNOT promote from waitlist

### 11.3 Permission Enforcement — Platform
- [ ] Admin CANNOT assign `master_admin` role to any user
- [ ] Admin CANNOT assign `program_admin` role to any user
- [ ] Admin CANNOT access platform configuration settings
- [ ] Admin CANNOT view or manage users outside their school

### 11.4 Data Scoping
- [ ] All student lists only show students from admin's `school_id`
- [ ] All teacher lists only show teachers from admin's `school_id`
- [ ] All parent lists only show parents from admin's `school_id`
- [ ] All class lists only show classes from admin's `school_id`
- [ ] All attendance records are scoped to admin's `school_id`
- [ ] All reports are scoped to admin's `school_id`
- [ ] API calls verified via Supabase logs to include school_id scoping

---

## 12. Edge Cases

### 12.1 Empty School
- [ ] Admin with a school that has zero students sees empty state on Students screen
- [ ] Admin with a school that has zero teachers sees empty state on Teachers screen
- [ ] Admin with a school that has zero parents sees empty state on Parents screen
- [ ] Admin with a school that has zero classes sees empty state on Classes screen
- [ ] Dashboard stats show 0 counts without errors
- [ ] No crashes on any empty-data screen

### 12.2 First Setup
- [ ] New admin with an empty school can create the first student
- [ ] New admin with an empty school can create the first teacher
- [ ] New admin with an empty school can create the first class
- [ ] New admin can create stickers before any students exist
- [ ] Reports show empty/zero data without errors

### 12.3 Large Data
- [ ] School with many students (50+) loads student list without performance issues
- [ ] Reports with large data sets render without timeout or crash
- [ ] Scrolling through long lists is smooth

### 12.4 Concurrent Operations
- [ ] Two admins in the same school editing the same student do not cause data corruption
- [ ] Creating a student while another admin deletes a class does not crash

### 12.5 Network & Loading
- [ ] Slow network shows loading indicators on all data screens
- [ ] Network error displays appropriate error message with retry option
- [ ] Form submissions show loading state to prevent double-submit
- [ ] Navigating between sub-screens while data is loading does not cause crashes
