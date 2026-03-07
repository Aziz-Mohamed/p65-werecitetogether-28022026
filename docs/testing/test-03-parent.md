# Test Script 03 — Parent Role

**Role:** Parent
**Dashboard route:** `/(parent)/`
**Layout:** 3 tabs (Dashboard, Children, Settings)
**Theme color:** Rose
**Data scope:** Linked children only (via `student_guardians` table)

**Prerequisites:**
- Parent account exists with `role = 'parent'` in `profiles`
- At least 1 child linked via `student_guardians` table
- Linked child has sessions, attendance records, memorization progress, and a class assignment
- At least 1 completed session exists for the linked child

---

## 1. Dashboard

### 1.1 Tab Bar
- [ ] Login as parent — lands on `/(parent)/` dashboard
- [ ] Tab bar shows exactly 3 tabs: Dashboard, Children, Settings
- [ ] Tab bar uses Rose theme color for active tab
- [ ] Tapping each tab navigates to the correct screen

### 1.2 Dashboard Content (`(tabs)/index.tsx`)
- [ ] Dashboard loads without errors
- [ ] Summary stats for linked children are displayed (e.g., total sessions, attendance rate)
- [ ] Children summary cards are visible with key info (name, recent activity)
- [ ] Tapping a child card navigates to child profile screen
- [ ] Pull-to-refresh reloads dashboard data
- [ ] Loading state shown while data is fetching

---

## 2. Children Management

### 2.1 Children List (`(tabs)/children.tsx`)
- [ ] Children tab shows a list of all linked children
- [ ] Each child card displays name and basic info
- [ ] List only shows children linked via `student_guardians` (no unlinked students visible)
- [ ] Tapping a child navigates to `children/[id].tsx`

### 2.2 Child Profile (`children/[id].tsx`)
- [ ] Child profile screen loads with correct child data
- [ ] Child name, class, and enrollment info displayed
- [ ] Navigation options to memorization, progress, schedule, attendance, and class standing are available
- [ ] Back navigation returns to children list

---

## 3. Child Progress

### 3.1 Memorization (`memorization/[childId].tsx`)
- [ ] Navigating to child's memorization screen loads successfully
- [ ] Memorization progress data is displayed (surahs, ayah ranges, completion percentage)
- [ ] Data matches what was logged by the child's teacher
- [ ] Parent can view but CANNOT edit memorization progress
- [ ] Empty state shown if child has no memorization records

### 3.2 Overall Progress (`progress/[childId].tsx`)
- [ ] Child overall progress screen loads with charts/stats
- [ ] Progress data reflects session history and memorization
- [ ] Data is read-only (no edit controls visible)

### 3.3 Schedule (`schedule/[childId].tsx`)
- [ ] Child's session schedule is displayed
- [ ] Upcoming and past sessions are shown with dates and times
- [ ] Schedule is read-only (no ability to modify)
- [ ] Empty state shown if no scheduled sessions

### 3.4 Attendance (`attendance/[childId].tsx`)
- [ ] Child's attendance records are displayed
- [ ] Attendance shows dates, status (present/absent), and class info
- [ ] Parent can view but CANNOT mark attendance
- [ ] Data is consistent with what admin/teacher recorded

### 3.5 Class Standing (`class-standing/[childId].tsx`)
- [ ] Child's class standing is displayed
- [ ] Ranking or performance relative to class is visible
- [ ] Data is read-only

### 3.6 Session Details (`sessions/[id].tsx`)
- [ ] Tapping a session from schedule or progress navigates to session details
- [ ] Session details show: surah, ayah range, grade, teacher name, date
- [ ] Session data matches what teacher logged
- [ ] Parent can view but CANNOT edit session details
- [ ] Back navigation returns to previous screen

---

## 4. Settings & Profile

### 4.1 Settings Tab (`(tabs)/settings.tsx`)
- [ ] Settings tab loads with profile information
- [ ] Parent's name and email are displayed correctly
- [ ] Profile edit option is available
- [ ] Parent can update own profile fields (name, etc.)
- [ ] Language toggle is available and functional (switches between languages)
- [ ] Logout option is present and functional

### 4.2 Notification Preferences (`notification-preferences.tsx`)
- [ ] Navigation to notification preferences works
- [ ] Category toggles are displayed for relevant notification types
- [ ] Toggling a category saves the preference (verify in `notification_preferences` table)
- [ ] Toggling a category off then on again works correctly
- [ ] Changes persist after leaving and returning to the screen

---

## 5. Negative Tests

### 5.1 Route Restrictions
- [ ] Navigating to `/(teacher)/` URL directly does not show teacher dashboard (RLS blocks data)
- [ ] Navigating to `/(admin)/` URL directly does not show admin dashboard (RLS blocks data)
- [ ] Navigating to `/(student)/` URL directly does not show student data (shows parent's own profile only)
- [ ] Navigating to `/(program-admin)/` URL directly does not show program admin data
- [ ] Navigating to `/(supervisor)/` URL directly does not show supervisor data
- [ ] Navigating to `/(master-admin)/` URL directly does not show master admin data

### 5.2 Permission Enforcement
- [ ] Parent CANNOT log sessions (no session creation UI exists)
- [ ] Parent CANNOT award stickers (no sticker award UI exists)
- [ ] Parent CANNOT enroll students in programs
- [ ] Parent CANNOT manage programs, cohorts, or tracks
- [ ] Parent CANNOT access admin screens (students/teachers/classes CRUD)
- [ ] Parent CANNOT mark attendance
- [ ] Parent CANNOT edit any child's data (memorization, sessions, grades)
- [ ] Parent CANNOT see children not linked via `student_guardians`

### 5.3 Data Scoping
- [ ] API calls return only data for linked children (verify via Supabase logs)
- [ ] No data from unlinked students appears anywhere in the UI
- [ ] Attempting to access `children/[id].tsx` with an unlinked child ID returns empty/error

---

## 6. Edge Cases

### 6.1 No Linked Children
- [ ] Parent with no rows in `student_guardians` sees empty states on Dashboard and Children tabs
- [ ] No errors or crashes when dashboard has zero children
- [ ] Appropriate empty-state message displayed (e.g., "No children linked to your account")

### 6.2 Child with No Data
- [ ] Linked child with zero sessions shows empty state on session/progress screens
- [ ] Linked child with no attendance records shows empty state on attendance screen
- [ ] Linked child with no memorization progress shows empty state
- [ ] Linked child with no schedule shows empty state
- [ ] No crashes on any empty-data screen

### 6.3 Multiple Children
- [ ] Parent with multiple linked children sees all of them in the Children tab
- [ ] Each child's data is separate and correct (no cross-child data leakage)
- [ ] Navigating between child profiles works without stale data

### 6.4 Network & Loading
- [ ] Slow network shows loading indicators on all data screens
- [ ] Network error displays appropriate error message with retry option
- [ ] Switching tabs while data is loading does not cause crashes
