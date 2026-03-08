# Role-Permission Matrix

This document maps every feature to the 5 user roles with expected access levels.

**Legend:**
- **R** = Read only
- **W** = Write (create/update)
- **D** = Delete
- **Own** = Only own records
- **Scope** = Limited to specific scope (program, class, school)
- **-** = No access
- **All** = Unrestricted access

Sources: RLS policies in `supabase/migrations/00001`, `00005`, `00008`, `00009`, `00010`, `00011`, `00012`, `00014`; routing guards in `app/_layout.tsx`; RPC function permission checks.

---

## 1. Authentication & Profile

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| Login (OAuth/password) | Yes | Yes | Yes | Yes | Yes |
| View own profile | R | R | R | R | R |
| Update own profile | W | W | W | W | W |
| Change own role | - | - | - | - | - |
| View school profiles | R (school) | R (school) | R (school) | R (school) | R (school) |
| Create profiles | - | - | - | - | W |
| Delete profiles | - | - | - | - | D |
| Notification preferences | W (own) | W (own) | W (own) | W (own) | W (own) |

**RLS enforcement:** `profiles` table — users can only read/update own profile. Admins can insert/delete within their school via `get_user_school_id()`. Role changes blocked by `prevent_role_self_update()` trigger.

---

## 2. Programs & Tracks

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| Browse all programs | R | R | R | R | R |
| View program details | R | R | R | R | R |
| Create program | - | - | - | - | W |
| Update program settings | - | - | - | W (assigned) | W |
| View tracks | R | R | R | R | R |
| Create/edit tracks | - | - | - | W (assigned) | W |
| View classes | R | R | R | R | R |
| Create/edit classes | - | - | - | W (assigned) | W |

**RLS enforcement:** Programs/tracks/classes readable by all authenticated users. Write access via `get_user_programs()` check — only program_admin for their programs, or master_admin.

---

## 3. Enrollment & Waitlist

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| Enroll self in program | W (own) | - | - | - | - |
| View own enrollments | R (own) | - | - | - | - |
| Drop/leave program | W (own) | - | - | - | - |
| View enrollments (teacher's class) | - | R (class) | - | - | - |
| View enrollments (program-scoped) | - | - | R (program) | R (program) | R (all) |
| Approve/reject enrollment | - | - | - | W (program) | W |
| View waitlist | R (own) | - | - | R (program) | R (all) |
| Promote from waitlist | - | - | - | W (program) | W |

**RLS enforcement:** `enrollments` table has role-specific SELECT policies. Students can only INSERT own enrollments and UPDATE status to 'dropped'. Enrollment via `enroll_student()` RPC handles capacity, waitlisting, and auto-approval atomically.

---

## 4. Sessions & Attendance

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| View own sessions | R (own) | - | - | - | - |
| View sessions (as teacher) | - | R (own) | - | - | - |
| Log new session | - | W | - | - | - |
| Edit/complete session | - | W (own) | - | - | - |
| Draft sessions | - | W (own) | - | - | - |
| View attendance | R (own) | R (class) | R (program) | R (program) | R (all) |
| Mark attendance | - | W | - | - | - |
| View session schedule | R (own) | R (own) | - | - | - |

**RLS enforcement:** Sessions tied to teacher_id for writes. Students see sessions where they are the student. Voice memos scoped to session ownership.

---

## 5. Memorization & Revision

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| View own memorization progress | R (own) | - | - | - | - |
| View student memorization | - | R (own students) | R (program) | R (program) | R (all) |
| Record recitation | - | W | - | - | - |
| View revision schedule | R (own) | - | - | - | - |
| Record revision | W (own) | - | - | - | - |
| Rub progress tracking | R (own) | R (students) | - | - | - |
| Create assignments | - | W | - | - | - |
| View assignments | R (own) | R (own created) | - | - | - |

**RLS enforcement:** Recitation entries scoped to teacher who logged them. Revision uses spaced repetition (SM-2 algorithm) with client-side scheduling.

---

## 6. Mutoon Progress

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| View own mutoon progress | R (own) | - | - | - | - |
| Update own mutoon progress | W (own) | - | - | - | - |
| View student mutoon progress | - | R (program staff) | R (program) | R (program) | R (all) |
| Update student mutoon progress | - | W (program staff) | - | - | - |

**RLS enforcement:** `mutoon_progress` table — students read/write own. Program staff (teacher/supervisor/program_admin) read via `get_user_programs()`. Teachers can update via program role check.

---

## 7. Gamification (Stickers, Badges, Leaderboard)

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| View own stickers/badges | R (own) | - | - | - | - |
| View leaderboard | R | R | - | R | R |
| Award sticker to student | - | W | - | - | - |
| Undo sticker award (30s) | - | W (own awarded) | - | - | - |
| View sticker catalog | R | R | R | R | R |
| Create/edit stickers | - | - | - | W (program) | W |
| View student badges | R (own) | R (students) | - | - | - |
| View milestone badges | R (own) | - | - | - | - |
| Program leaderboard | R (enrolled) | R (program) | R (program) | R (program) | R (all) |

**RLS enforcement:** `student_stickers` — students read own, teachers read/write for their students. Sticker catalog readable by all. Badge awarding via `check_and_award_badges()` SECURITY DEFINER trigger.

---

## 8. Ratings & Queue

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| Rate a session (post-session) | W (own sessions) | - | - | - | - |
| View own ratings given | R (own) | - | - | - | - |
| View aggregated ratings | - | - | R (supervised) | R (program) | R (all) |
| View individual ratings | - | - | - | - | R (all) |
| Join free program queue | W (own) | - | - | - | - |
| Claim queue entry | - | W (teachers) | - | - | - |
| View queue status | R (own entry) | R (available) | R (program) | R (program) | R (all) |

**RLS enforcement:** Ratings via `submit_session_rating()` RPC — student only, within 48-hour window. Ratings anonymous to teachers. Queue entries via `join_queue()` / `claim_queue_entry()` RPCs with role checks.

---

## 9. Teacher Availability

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| View available teachers | R (program) | - | - | - | - |
| Toggle own availability | - | W (own) | - | - | - |
| View teacher availability | R (green dot) | - | R (supervised) | R (program) | R (all) |

**RLS enforcement:** `teacher_availability` — teachers insert/update/delete own. Students read via `get_available_teachers()` RPC. Auto-cleanup via `pg_cron` job.

---

## 10. Certifications (Ijazah)

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| View own certificates | R (own) | - | - | - | - |
| Issue certificate | - | W (own students) | - | - | - |
| Revoke certificate | - | W (own issued) | W (program) | W (program) | W (all) |
| View certificates (oversight) | - | R (own issued) | R (program) | R (program) | R (all) |
| Verify certificate (QR) | Public | Public | Public | Public | Public |

**RLS enforcement:** Certifications via `issue_certification()` RPC — teacher role required. Revocation via `revoke_certification()` — issuer, supervisor (program-scoped), program_admin, or master_admin. Verification via `verify-certificate` Edge Function (public, no auth required).

---

## 11. Himam (Special Events)

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| View events | R (active) | R (active) | R (program) | R (program) | R (all) |
| Register for event | W (own) | - | - | - | - |
| View registrations | R (own) | - | R (program) | R (program) | R (all) |
| Create/manage events | - | - | W (program) | W (program) | W |
| Generate pairings | - | - | W (program) | - | W |
| Record progress | W (own) | - | - | - | - |
| View progress history | R (own) | - | R (program) | R (program) | R (all) |

**RLS enforcement:** Himam via RPCs (`register_for_himam_event()`, `generate_himam_pairings()`, etc.) with explicit role checks. Events scoped by program.

---

## 12. Reports & Analytics

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| Dashboard stats | Own | Class | Supervised teachers | Program | Platform |
| Memorization reports | - | R (class) | - | - | R (all) |
| Session completion reports | - | R (class) | - | - | R (all) |
| Teacher activity reports | - | - | R (supervised) | R (program) | R (all) |
| Teacher attendance reports | - | - | - | - | R (all) |
| Class progress (trends/charts) | - | R (own class) | - | - | - |

**RLS enforcement:** Reports via RPC functions (`get_supervisor_dashboard_stats()`, `get_program_admin_dashboard_stats()`, `get_master_admin_dashboard_stats()`) — each with role checks. School-scoped reports use `get_user_school_id()`.

---

## 13. Admin Operations

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| CRUD students | - | - | - | - | W |
| CRUD teachers | - | - | - | - | W |
| Manage classes | - | - | - | - | - |
| Manage sticker catalog | - | - | - | W (program) | W |
| Manage team (program roles) | - | - | - | W (program) | W |
| Reassign students | - | - | W (supervised) | W (program) | W |
| Assign master_admin role | - | - | - | - | W |
| Revoke master_admin role | - | - | - | - | W |
| Update platform config | - | - | - | - | W |
| View all users | - | - | - | - | R |
| Search users for role assign | - | - | - | - | R |

**RLS enforcement:** Admin CRUD via school_id scoping. Program role management via `program_roles` INSERT/DELETE policies. Master admin operations via `assign_master_admin_role()` / `revoke_master_admin_role()` RPCs. Platform config UPDATE restricted to master_admin.

---

## 14. Voice Memos

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| Record voice memo | - | W (own sessions) | - | - | - |
| Listen to voice memo | - | R (own sessions) | - | - | - |

**RLS enforcement:** `session_voice_memos` tied to session's teacher_id. Storage bucket `voice-memos` uses RLS.

---

## 15. Push Notifications

| Feature | Student | Teacher | Supervisor | Program Admin | Master Admin |
|---------|---------|---------|------------|---------------|--------------|
| Register push token | W (own) | W (own) | W (own) | W (own) | W (own) |
| Manage preferences | W (own) | W (own) | W (own) | W (own) | W (own) |
| Receive notifications | Yes | Yes | Yes | Yes | Yes |

**RLS enforcement:** `push_tokens` — users insert/update/delete own tokens only. `notification_preferences` — users read/write own only.

---

## 16. Routing & Navigation Guard

| Aspect | Enforcement |
|--------|-------------|
| Auth check | `app/_layout.tsx` AuthGuard — unauthenticated users redirected to `/(auth)/login` |
| Onboarding check | Incomplete onboarding redirects to `/(auth)/onboarding` |
| Role routing | Authenticated users routed to `/(role)/` based on `profile.role` |
| Cross-role navigation | No explicit server-side guard on routes — RLS protects data; UI simply doesn't expose cross-role navigation |
| Unknown role | Redirects to `/(auth)/login` (default switch case) |

**Important note:** Expo Router does not enforce server-side route protection. Any role could technically navigate to any route group. Security relies on RLS policies blocking data access, not route guards. The routing is UX guidance, not a security boundary.
