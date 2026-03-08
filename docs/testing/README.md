# Testing Guide

This directory contains systematic testing documentation for WeReciteTogether. It covers all 7 user roles, their permissions, and step-by-step test scripts.

## Documents

| File | Purpose |
|------|---------|
| [role-permission-matrix.md](./role-permission-matrix.md) | Complete role-to-feature access map |
| [critical-paths.md](./critical-paths.md) | Prioritized cross-role flows to test first |
| [test-01-student.md](./test-01-student.md) | Student role test script |
| [test-02-teacher.md](./test-02-teacher.md) | Teacher role test script |
| [test-03-parent.md](./test-03-parent.md) | Parent role test script |
| [test-04-admin.md](./test-04-admin.md) | School admin role test script |
| [test-05-supervisor.md](./test-05-supervisor.md) | Supervisor role test script |
| [test-06-program-admin.md](./test-06-program-admin.md) | Program admin role test script |
| [test-07-master-admin.md](./test-07-master-admin.md) | Master admin role test script |
| [test-results-template.md](./test-results-template.md) | Blank template for recording test runs |

## Test Setup

### 1. Create Test Accounts

You need one account per role. Create them via Supabase Dashboard > Authentication > Users, then set the role in the `profiles` table.

| Role | Suggested Email | Profile `role` Value |
|------|----------------|---------------------|
| Student | test-student@test.com | `student` |
| Teacher | test-teacher@test.com | `teacher` |
| Parent | test-parent@test.com | `parent` |
| Admin | test-admin@test.com | `admin` |
| Supervisor | test-supervisor@test.com | `supervisor` |
| Program Admin | test-padmin@test.com | `program_admin` |
| Master Admin | test-madmin@test.com | `master_admin` |

### 2. Seed Required Test Data

After creating accounts, set up the following data via Supabase Dashboard or SQL:

1. **Programs**: Ensure at least 2 programs exist (one free, one structured)
2. **Tracks**: At least 1 track per program
3. **Cohorts**: At least 1 cohort per program (one with capacity, one full for waitlist testing)
4. **Program Roles**: Assign the teacher, supervisor, and program_admin test accounts to the programs:
   ```sql
   -- Assign teacher to program
   INSERT INTO program_roles (profile_id, program_id, role)
   VALUES ('<teacher-id>', '<program-id>', 'teacher');

   -- Assign supervisor to program, link to teacher
   INSERT INTO program_roles (profile_id, program_id, role, supervisor_id)
   VALUES ('<teacher-id>', '<program-id>', 'teacher', '<supervisor-id>');

   -- Assign program admin
   INSERT INTO program_roles (profile_id, program_id, role)
   VALUES ('<padmin-id>', '<program-id>', 'program_admin');
   ```
5. **Enrollments**: Enroll the student in at least 1 cohort
6. **Sessions**: Create at least 2 sessions (one completed, one draft) for the teacher-student pair
7. **Stickers**: Create a few stickers in the sticker catalog
8. **Parent-Child Link**: Add a row to `student_guardians` linking the parent and student accounts

### 3. Solo Testing Tips

- **Use two browser tabs**: Keep Supabase Dashboard open in one tab to inspect data changes in real-time
- **Fast account switching**: Log out → log in with next role's credentials. The app auto-routes to the correct dashboard.
- **Test order**: Follow the critical paths first (see [critical-paths.md](./critical-paths.md)), then work through individual role scripts
- **Record results**: Copy [test-results-template.md](./test-results-template.md) for each test run

### 4. Supabase Dashboard Shortcuts

- **Table Editor**: Inspect/edit rows directly — useful for verifying writes
- **SQL Editor**: Run `SELECT` queries to verify RLS policies
- **Auth > Users**: Manage test accounts
- **Logs > API**: See real-time API calls — helpful for debugging permission errors (look for `42501` PostgreSQL permission denied errors)

### 5. Testing RLS Policies Directly

To verify a policy works correctly, you can impersonate a user in the SQL Editor:

```sql
-- Set the JWT to impersonate a specific user
SET request.jwt.claims = '{"sub": "<user-uuid>", "role": "authenticated"}';
SET role = 'authenticated';

-- Now run a query — it will be filtered by RLS
SELECT * FROM enrollments;

-- Reset
RESET role;
RESET request.jwt.claims;
```

## Roles Overview

| Role | Dashboard Route | Tab Count | Scope |
|------|----------------|-----------|-------|
| Student | `/(student)/` | 6 tabs | Own data only |
| Teacher | `/(teacher)/` | 5 tabs | Own students/sessions |
| Parent | `/(parent)/` | 3 tabs | Linked children only |
| Admin | `/(admin)/` | No tabs (scroll) | School-scoped |
| Supervisor | `/(supervisor)/` | 4 tabs | Supervised teachers in assigned programs |
| Program Admin | `/(program-admin)/` | 5 tabs | Assigned programs |
| Master Admin | `/(master-admin)/` | No tabs (scroll + nav) | Entire platform |
