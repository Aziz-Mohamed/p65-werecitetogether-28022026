# Quickstart: Gamification Extension Validation Scenarios

## Prerequisites

- App running locally via `npx expo start`
- Supabase migration 00011_gamification_ext.sql applied
- At least 2 programs with enrolled students and assigned teachers
- Existing stickers seeded (38 heritage stickers from migration 00001)

## Scenario 1: Program-Scoped Sticker Creation

**Actors**: Admin (master_admin), Program Admin

1. Log in as master_admin
2. Navigate to sticker management
3. Create a new sticker with name "Himam Star" and assign to the "Himam" program
4. Create a new sticker with name "Global Star" with no program assignment

**Verify**:
- [ ] "Himam Star" has program_id set in DB
- [ ] "Global Star" has program_id = NULL in DB

5. Log in as a program_admin for the "Tajweed" program
6. Attempt to create a sticker

**Verify**:
- [ ] Program admin can only assign to their own program(s)
- [ ] No option to create global stickers

## Scenario 2: Program-Scoped Sticker Visibility in Award Picker

**Actors**: Teacher in Himam program, Teacher in Tajweed program

1. Log in as a teacher assigned to the "Himam" program
2. Open the sticker award picker for a student

**Verify**:
- [ ] Global stickers (38 heritage) appear
- [ ] "Himam Star" appears
- [ ] "Tajweed-only" sticker does NOT appear
- [ ] Stickers are grouped: "Global" section, "Himam" section

3. Log in as a teacher assigned to the "Tajweed" program
4. Open the sticker award picker

**Verify**:
- [ ] Global stickers appear
- [ ] "Tajweed-only" sticker appears (if created)
- [ ] "Himam Star" does NOT appear

## Scenario 3: Student Sticker Collection with Program Labels

**Actor**: Student enrolled in Himam program

1. Award the student a "Himam Star" sticker and a global "Star of Knowledge"
2. Log in as the student
3. Navigate to sticker collection

**Verify**:
- [ ] Both stickers visible
- [ ] "Himam Star" shows "Himam" program label
- [ ] "Star of Knowledge" shows no program label (or "Global")

## Scenario 4: Program Leaderboard

**Actors**: 2+ students enrolled in the same program

1. Ensure students have different `current_level` values
2. Log in as student A
3. Navigate to program leaderboard

**Verify**:
- [ ] Students from the same program appear ranked by level
- [ ] Students from other programs do NOT appear
- [ ] Ties broken by longest_streak
- [ ] If student A is outside top 20, their row still appears at the bottom
- [ ] Leaderboard loads within 2 seconds

4. Navigate to the existing class leaderboard

**Verify**:
- [ ] Class leaderboard works unchanged

## Scenario 5: Milestone Badge — Session Count

**Actor**: Student with 9 completed sessions in a program

1. Log in as teacher, record the student's 10th session
2. Check student_badges table

**Verify**:
- [ ] `sessions_10` badge row exists for the student + program
- [ ] Push notification sent to student
- [ ] Badge appears on student's profile as earned
- [ ] Other session badges (50, 100) still show as locked

3. Record another session (11th)

**Verify**:
- [ ] `sessions_10` badge NOT re-awarded (no duplicate row)

## Scenario 6: Milestone Badge — Streak

**Actor**: Student with 6-day streak

1. Trigger streak increment to 7 (e.g., complete a daily review)

**Verify**:
- [ ] `streak_7d` badge auto-awarded via trigger
- [ ] Badge appears on profile immediately
- [ ] Notification sent

## Scenario 7: Milestone Badge — Enrollment Duration (pg_cron)

**Actor**: Student enrolled 30+ days ago

1. Manually run `SELECT check_enrollment_duration_milestones()` (simulating cron)

**Verify**:
- [ ] `enrollment_30d` badge awarded for students with >= 30 days enrollment
- [ ] Students with < 30 days NOT awarded
- [ ] Already-awarded students NOT duplicated

## Scenario 8: Badge Display on Profile

**Actor**: Student with some badges earned

1. Log in as student
2. Navigate to badges section on profile

**Verify**:
- [ ] Earned badges show full color with program name and date
- [ ] Unearned badges show as grayed-out silhouettes
- [ ] Badge descriptions explain how to earn them
- [ ] Badges grouped by category (enrollment, sessions, streak)
- [ ] All text in correct language (en/ar)

## Scenario 9: Supervisor Rewards Dashboard

**Actor**: Supervisor for a program

1. Log in as supervisor
2. Navigate to rewards dashboard

**Verify**:
- [ ] Sticker counts for this week and this month display correctly
- [ ] Top 5 teachers by sticker awards shown
- [ ] Top 5 popular stickers shown
- [ ] Milestone badge distribution shown (count per badge type)
- [ ] Only data from supervisor's program visible

3. Log in as program_admin for a different program

**Verify**:
- [ ] Dashboard shows only their program's data

## Scenario 10: Edge Case — Sticker Re-scoping

1. As admin, change "Global Star" sticker to be scoped to "Himam" program
2. Check a student who previously earned "Global Star"

**Verify**:
- [ ] Previously awarded "Global Star" still visible in student's collection
- [ ] "Global Star" no longer appears in global catalog for new awards
- [ ] "Global Star" now appears only for Himam teachers in award picker

## Scenario 11: Edge Case — Student Un-enrollment

1. Un-enroll a student from a program (set enrollment status to 'dropped')

**Verify**:
- [ ] Student's earned stickers and badges remain in their collection
- [ ] Student no longer appears on the program leaderboard
- [ ] Student can still view their badges on their profile
