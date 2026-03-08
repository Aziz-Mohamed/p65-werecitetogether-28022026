# Test Script 07 — Master Admin Role

## Role Overview

- **Dashboard route:** `/(master-admin)/`
- **Layout:** Scroll dashboard with stat cards + navigation buttons (no tabs)
- **Scope:** Entire platform — unrestricted access
- **Nav buttons:** Users, Program Admins, Supervisors, Teachers, Students, Classes, Programs, Stickers, Reports, Certifications, Settings, Permissions, Reset Password, Language

## Screens Under Test

| Screen | Route | Purpose |
|--------|-------|---------|
| Dashboard | `index.tsx` | Stats + nav cards (students, teachers, sessions, programs) |
| User Management | `users/index.tsx` | User search and filter |
| User Details | `users/[id].tsx` | User details + role management |
| Student List | `students/index.tsx` | All students |
| Create Student | `students/create.tsx` | Create new student |
| Teacher List | `teachers/index.tsx` | All teachers |
| Create Teacher | `teachers/create.tsx` | Create new teacher |
| Class List | `classes/index.tsx` | All classes |
| Create Class | `classes/create.tsx` | Create new class |
| Programs List | `programs/index.tsx` | All programs list |
| Create Program | `programs/create.tsx` | Create new program |
| Program Details | `programs/[id]/index.tsx` | Program details |
| Reports | `reports/index.tsx` | Platform-wide analytics |
| Settings | `settings/index.tsx` | Platform config |
| Permissions | `settings/permissions.tsx` | Feature permissions |
| Sticker Catalog | `stickers/index.tsx` | Manage sticker catalog |
| Certifications List | `certifications/index.tsx` | All certifications |
| Certification Details | `certifications/[id].tsx` | Single certification view |
| Supervisors | `supervisors/index.tsx` | Supervisor management |
| Program Admins | `program-admins/index.tsx` | Program admin management |
| Reset Password | `members/reset-password.tsx` | Reset member passwords |

## Key Permissions (Unrestricted)

- View/manage ALL users, programs, enrollments, sessions, certifications
- Create new programs (W)
- Assign/revoke `master_admin` role via `assign_master_admin_role()` / `revoke_master_admin_role()` RPCs
- Update platform config via `platform_config` table (exclusive)
- Search users via `search_users_for_role_assignment()` RPC
- View platform-wide stats via `get_master_admin_dashboard_stats()` RPC
- Cannot revoke the last `master_admin` (safety check in RPC)

---

## 1. Dashboard Verification

- [ ] **1.1** Log in as a user with `master_admin` role
- [ ] **1.2** Confirm the dashboard uses a scroll layout (not tab-based navigation)
- [ ] **1.3** Verify stat cards are displayed: total students, total teachers, active sessions
- [ ] **1.4** Verify a program list section is visible on the dashboard
- [ ] **1.5** Confirm quick action buttons are present: Add Student, Add Teacher, Add Class
- [ ] **1.6** Confirm nav cards are present: Users, Program Admins, Supervisors, Teachers, Students, Classes, Programs, Stickers, Reports, Certifications, Settings, Permissions, Reset Password, Language
- [ ] **1.7** Tap each nav card and verify it navigates to the correct screen
- [ ] **1.7** Verify stats are fetched via `get_master_admin_dashboard_stats()` RPC (check network/logs)
- [ ] **1.8** Pull to refresh (if supported) and confirm stats update

## 2. User Management

- [ ] **2.1** Navigate to Users screen (`users/index.tsx`)
- [ ] **2.2** Verify all platform users are listed
- [ ] **2.3** Search for a user by name — confirm results filter correctly
- [ ] **2.4** Search for a user by email — confirm results filter correctly
- [ ] **2.5** Apply role filter (e.g., show only teachers) — confirm list updates
- [ ] **2.6** Clear filters — confirm full list returns
- [ ] **2.7** Tap a user to navigate to user details (`users/[id].tsx`)
- [ ] **2.8** Verify user details screen shows profile info, current roles, and associated programs
- [ ] **2.9** Verify `search_users_for_role_assignment()` RPC is used for search functionality

## 3. Role Management

- [ ] **3.1** From user details, assign `master_admin` role to a non-admin user via `assign_master_admin_role()` RPC
- [ ] **3.2** Confirm success feedback is shown
- [ ] **3.3** Verify the user now appears with `master_admin` role in their details
- [ ] **3.4** Revoke `master_admin` role from a user who has it (when multiple master admins exist) via `revoke_master_admin_role()` RPC
- [ ] **3.5** Confirm success feedback is shown
- [ ] **3.6** Verify the user no longer has the `master_admin` role
- [ ] **3.7** Attempt to revoke `master_admin` from the last remaining master admin
- [ ] **3.8** Confirm the operation is rejected with an appropriate error message (safety check)
- [ ] **3.9** Verify the last master admin still retains their role after the failed revocation

## 4. Program Management

- [ ] **4.1** Navigate to Programs screen (`programs/index.tsx`)
- [ ] **4.2** Verify all programs across the platform are listed
- [ ] **4.3** Tap a program to view its details (`programs/[id]/index.tsx`)
- [ ] **4.4** Verify program details show enrolled students, teachers, sessions, and settings
- [ ] **4.5** Navigate to Create Program screen (`programs/create.tsx`)
- [ ] **4.6** Fill in all required fields and submit
- [ ] **4.7** Confirm the new program appears in the programs list
- [ ] **4.8** Verify the newly created program is accessible from its details screen

## 5. Platform Reports

- [ ] **5.1** Navigate to Reports screen (`reports.tsx`)
- [ ] **5.2** Verify platform-wide analytics are displayed (not scoped to a single program)
- [ ] **5.3** Confirm report data includes cross-program metrics (total sessions, attendance rates, etc.)
- [ ] **5.4** If date range filters exist, change the range and verify data updates
- [ ] **5.5** Verify charts/graphs render correctly without visual glitches

## 6. Platform Settings / Config

- [ ] **6.1** Navigate to Settings screen (`settings.tsx`)
- [ ] **6.2** Verify current platform config values are displayed from `platform_config` table
- [ ] **6.3** Update a config value and save
- [ ] **6.4** Confirm success feedback is shown
- [ ] **6.5** Refresh or re-navigate to Settings — verify the updated value persists
- [ ] **6.6** Verify only `master_admin` users can access and modify the `platform_config` table

## 7. Certification Management

- [ ] **7.1** Navigate to Certifications list (`certifications/index.tsx`)
- [ ] **7.2** Verify all certifications across the platform are listed
- [ ] **7.3** Tap a certification to view details (`certifications/[id].tsx`)
- [ ] **7.4** Verify certification details include student info, program, date, and status
- [ ] **7.5** Revoke a certification (if supported) and confirm the status updates
- [ ] **7.6** Verify the revoked certification reflects the change in the list view

## 8. Profile & Logout

- [ ] **8.1** Navigate to profile / account section
- [ ] **8.2** Verify profile information is displayed correctly
- [ ] **8.3** Log out of the app
- [ ] **8.4** Confirm redirect to the login screen
- [ ] **8.5** Attempt to access a master admin route directly while logged out — verify redirect to login

## 9. Negative Tests

- [ ] **9.1** Attempt to revoke `master_admin` from the sole remaining master admin — confirm rejection
- [ ] **9.2** Log in as a non-master-admin user and attempt to access `/(master-admin)/` routes — verify access denied
- [ ] **9.3** As a non-master-admin, attempt to call `assign_master_admin_role()` RPC directly — verify permission error
- [ ] **9.4** As a non-master-admin, attempt to update `platform_config` table — verify permission error
- [ ] **9.5** Submit the create program form with missing required fields — verify validation errors
- [ ] **9.6** Attempt to assign `master_admin` role to a user who already has it — verify graceful handling

## 10. Edge Cases

- [ ] **10.1** Dashboard with zero programs — verify empty state is shown gracefully
- [ ] **10.2** User list with zero users matching a search query — verify empty state message
- [ ] **10.3** Large dataset (many users/programs) — verify list performance and scrolling remain smooth
- [ ] **10.4** Rapidly toggling between nav buttons — verify no navigation glitches or stale data
- [ ] **10.5** Network disconnect while on dashboard — verify appropriate error/offline state
- [ ] **10.6** Session timeout during an admin action — verify graceful re-authentication prompt
