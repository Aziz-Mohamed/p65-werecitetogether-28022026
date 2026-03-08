# Feature Specification: Gamification Extension for Programs

**Feature Branch**: `010-gamification-ext`
**Created**: 2026-03-06
**Status**: Draft
**Input**: User description: "Extend existing sticker system to work with programs, add program-specific rewards"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Program-Scoped Sticker Catalog (Priority: P1)

An admin or program admin creates stickers that belong to a specific program. Teachers within that program see program-specific stickers alongside the global (heritage) catalog when awarding stickers to students. Students see which program a sticker came from in their collection.

**Why this priority**: This is the foundation — without program-scoped stickers, the gamification system cannot distinguish between programs. All other stories depend on stickers being program-aware.

**Independent Test**: Admin creates a sticker assigned to the "Himam" program. A teacher in that program sees the sticker in their award picker. A teacher in a different program does not see it. A student receiving the sticker sees the program name in their collection.

**Acceptance Scenarios**:

1. **Given** an admin creating a new sticker, **When** they optionally assign it to a program, **Then** the sticker becomes visible only to teachers and students within that program (plus global visibility if no program is assigned).
2. **Given** a teacher awarding a sticker to a student, **When** the award picker opens, **Then** the teacher sees global stickers plus stickers scoped to programs they are assigned to, grouped by program.
3. **Given** a student viewing their sticker collection, **When** a sticker has a program association, **Then** the sticker card shows the program name as a subtle label.
4. **Given** a global sticker (no program assigned), **When** any teacher opens the award picker, **Then** the global sticker appears regardless of which program the teacher belongs to.
5. **Given** a program-scoped sticker, **When** a teacher from a different program opens the award picker, **Then** the sticker does not appear in their list.

---

### User Story 2 - Program Leaderboard (Priority: P1)

Students enrolled in a program can see a leaderboard scoped to that program, showing top students ranked by their rubʿ level. The existing class-based leaderboard continues to work for backwards compatibility.

**Why this priority**: Leaderboards are a key motivational driver. With multiple programs, students need program-scoped competition to stay engaged.

**Independent Test**: Two students enrolled in the same program view the leaderboard. Both see each other ranked by level. A student not enrolled in that program does not appear.

**Acceptance Scenarios**:

1. **Given** a student enrolled in a program, **When** they navigate to the program leaderboard, **Then** they see students from the same program ranked by rubʿ level descending, with ties broken by longest streak.
2. **Given** a program with 50+ enrolled students, **When** the leaderboard loads, **Then** only the top 20 students are shown, with the current student's rank always visible (even if outside top 20).
3. **Given** a student enrolled in multiple programs, **When** they switch between program leaderboards, **Then** rankings update to reflect each program's enrolled students.
4. **Given** a student who is not enrolled in a program, **When** they attempt to view that program's leaderboard, **Then** they see a message indicating they are not enrolled.
5. **Given** the existing class-based leaderboard, **When** accessed from the original route, **Then** it continues to work unchanged.

---

### User Story 3 - Enrollment Milestone Badges (Priority: P2)

Students automatically earn milestone badges when they reach specific achievements within a program: enrollment anniversary (30 days, 90 days, 1 year), session count milestones (10, 50, 100 sessions), and streak milestones (7-day, 30-day, 100-day streaks). These badges are different from stickers — they are non-transferable system-awarded recognitions.

**Why this priority**: Milestones encourage long-term engagement but are not blocking for the core sticker and leaderboard functionality.

**Independent Test**: A student completes their 10th session in a program. The system automatically awards a "10 Sessions" badge. The student sees the badge on their profile.

**Acceptance Scenarios**:

1. **Given** a student who has been enrolled for 30 days, **When** the system checks milestones, **Then** the "30-Day Member" badge is automatically awarded and the student is notified.
2. **Given** a student who completes their 10th session, **When** the session is recorded, **Then** the "10 Sessions" milestone badge is awarded.
3. **Given** a student who maintains a 7-day streak, **When** the streak counter reaches 7, **Then** the "7-Day Streak" badge is awarded.
4. **Given** a student who already earned a milestone badge, **When** the milestone condition is met again (e.g., another 30-day period passes), **Then** the badge is NOT re-awarded (each milestone badge is earned once).
5. **Given** a student viewing their profile, **When** they look at the badges section, **Then** they see all earned badges with the program name and date earned.
6. **Given** a badge that has not been earned yet, **When** the student views the badges section, **Then** locked badges are shown as grayed-out silhouettes with a description of how to earn them.

---

### User Story 4 - Supervisor Rewards Dashboard (Priority: P3)

Supervisors and program admins can view aggregated gamification stats for their program: total stickers awarded this week/month, top sticker-awarding teachers, most collected stickers, and milestone badge distribution. This helps supervisors understand engagement levels.

**Why this priority**: Analytics are valuable but the system works without them. This provides insight into how gamification is being used across the program.

**Independent Test**: A supervisor opens the rewards dashboard for their program. They see sticker award counts for the current week, top teachers, and badge distribution.

**Acceptance Scenarios**:

1. **Given** a supervisor viewing the rewards dashboard, **When** the dashboard loads, **Then** they see total stickers awarded this week and this month for their program.
2. **Given** the rewards dashboard, **When** the supervisor views the "Top Teachers" section, **Then** they see the top 5 teachers ranked by stickers awarded this month, with counts.
3. **Given** the rewards dashboard, **When** the supervisor views the "Popular Stickers" section, **Then** they see the top 5 most-awarded stickers with counts.
4. **Given** the rewards dashboard, **When** the supervisor views the "Milestones" section, **Then** they see a breakdown of how many students have earned each milestone badge type.
5. **Given** a program admin for a different program, **When** they open the rewards dashboard, **Then** they only see stats for their own program.

---

### Edge Cases

- What happens when a sticker is re-assigned from global to program-scoped? Previously awarded instances remain visible to the student, but the sticker no longer appears in the global catalog for new awards.
- What happens when a student is un-enrolled from a program? Their earned stickers and badges remain in their collection permanently. They no longer appear on the program leaderboard.
- What happens when a program is deactivated? All program-scoped stickers become inactive for new awards. Existing awards are preserved. Leaderboard becomes read-only showing final state.
- What happens if two programs have stickers with the same name? Each sticker has a unique ID regardless of name. The program label disambiguates them in the UI.
- What happens when a milestone check runs but the student was recently un-enrolled? Milestones are checked at the moment of the triggering action (e.g., session completion). If the student is enrolled at that moment, the badge is awarded. Un-enrollment after does not revoke badges.
- What happens when a sticker is re-assigned from one program to another (not global-to-program)? Same as global-to-program: previously awarded instances remain; the sticker now appears only for the new program's teachers.
- What happens when a student re-enrolls in a program they previously dropped? Previously earned badges from the old enrollment remain. New enrollment duration starts fresh from the new `enrolled_at` date. Session/streak badges already earned are not re-awarded (uniqueness constraint per student+badge+program).
- What happens if the daily pg_cron job fails or runs late? Badges are simply awarded on the next successful run. The check is idempotent — it only inserts badges not yet awarded, so delayed runs cause no duplicates or data corruption.
- What happens when two leaderboard students have identical current_level AND longest_streak? Final tiebreaker is full_name ascending (alphabetical). This ensures deterministic ordering.

## Clarifications

### Session 2026-03-06

- Q: Should the leaderboard ranking metric be configurable per program or always rubʿ level? → A: Rubʿ level is always the ranking metric for all program leaderboards (all programs center on Quran memorization).
- Q: Can program admins create global stickers, or only program-scoped ones? → A: Program admins can only create stickers scoped to their assigned program(s). Only admins/master admins can create global stickers.
- Q: How are time-based enrollment duration milestones checked if no user action triggers them? → A: Hybrid approach — daily pg_cron job checks duration milestones (30d, 90d, 1yr); session count and streak milestones are checked inline at the triggering action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow stickers to optionally be associated with a specific program (nullable program association on stickers). Program admins can only create stickers scoped to their assigned program(s); only admins/master admins can create global (unscoped) stickers. Students, teachers, and supervisors MUST NOT create or delete stickers. Sticker management UI is provided in the existing admin screens (master-admin for global, program-admin for program-scoped).
- **FR-002**: System MUST show teachers only global stickers plus stickers for programs they are assigned to when awarding. Stickers MUST be grouped in the picker with section headers: "Global" for unscoped stickers, then one section per program name. Teachers assigned to multiple programs see stickers from all their programs.
- **FR-003**: System MUST display the program name on program-scoped stickers in the student's collection view.
- **FR-004**: System MUST provide a program-scoped leaderboard ranking enrolled students by rubʿ level (`students.current_level`) descending, with ties broken by `longest_streak` descending, then `full_name` ascending as final tiebreaker. This metric is fixed for all programs and is not configurable. When a program has zero enrolled students, the leaderboard MUST show an empty state message.
- **FR-005**: System MUST show the current student's rank on the leaderboard even if they are outside the top 20. The student's own row MUST be visually distinguished (e.g., highlighted background, "You" label) and separated from the top-20 list by a divider when outside it.
- **FR-006**: System MUST preserve the existing class-based leaderboard without modification.
- **FR-007**: System MUST define milestone badge types for enrollment duration (30, 90, 365 days), session count (10, 50, 100 completed sessions), and streak length (7, 30, 100 consecutive days). Session count milestones count only completed sessions (status = 'completed' or NULL for legacy) filtered by student and program_id.
- **FR-008**: System MUST automatically award milestone badges when conditions are met and send a push notification with category `milestone_badge_earned`, deep-linking to the badges screen `/(student)/profile/badges`. Session/streak milestones are checked inline at the triggering action; enrollment duration milestones are checked by a daily scheduled job (pg_cron at 04:00 UTC). If the notification infrastructure is unavailable (missing push token or Edge Function error), the badge MUST still be awarded — notification failure MUST NOT block badge insertion. When the daily cron job awards multiple badges to the same student, each badge generates a separate notification.
- **FR-009**: System MUST prevent duplicate milestone badge awards (each badge earned once per program).
- **FR-010**: System MUST show earned badges on the student profile with program name and date, grouped by category in fixed order: enrollment, sessions, streak.
- **FR-011**: System MUST show unearned badges as locked state (reduced opacity, monochrome icon) with the badge description explaining how to earn it. Screen readers MUST announce locked/earned state.
- **FR-012**: System MUST provide a supervisor rewards dashboard with sticker counts (this week/this month), top 5 teachers, top 5 popular stickers, and milestone badge distribution. When no stickers have been awarded yet, sections MUST show zero counts with an empty state message (not an error). Both supervisors and program admins can access this dashboard.
- **FR-013**: System MUST scope the rewards dashboard to the viewer's assigned program(s). Supervisors and program admins see only data for programs they are assigned to via `program_roles`.
- **FR-014**: System MUST preserve all previously awarded stickers when a sticker's program scope changes.

### Non-Functional Requirements

- **NFR-001**: Leaderboard queries MUST return results within 2 seconds for programs with up to 500 enrolled students.
- **NFR-002**: Inline milestone badge checks (session count, streak) MUST add less than 200ms to the session recording or streak update operation.
- **NFR-003**: All new UI text MUST be bilingual (English and Arabic).
- **NFR-004**: Rewards dashboard queries MUST return results within 3 seconds for programs with up to 500 enrolled students and 10,000 sticker awards.
- **NFR-005**: Badge grid MUST be accessible: earned/locked states announced by screen readers, all icons have accessible labels.

### Key Entities

- **Sticker**: Existing entity, extended with an optional program association. Represents a collectible reward that teachers award to students.
- **Milestone Badge**: New entity representing an automatically-awarded, non-transferable achievement. Has a type (enrollment_30d, sessions_10, streak_7d, etc.), associated program, and the student who earned it.
- **Student Badge**: Join entity linking a student to a milestone badge they earned, with the date earned and program context.
- **Program Leaderboard**: Derived view of enrolled students ranked by rubʿ level within a program, computed from existing student and enrollment data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can award program-scoped stickers to students within 3 taps from the student's profile screen (open award picker → select sticker → confirm).
- **SC-002**: Program leaderboard loads and displays rankings for up to 500 students within 2 seconds.
- **SC-003**: 100% of defined milestone types (9 total) are automatically checked and awarded without manual intervention.
- **SC-004**: Students can view all earned badges in a dedicated badges tab/screen on their profile, and all stickers (both global and program-scoped) in the existing sticker collection screen.
- **SC-005**: Supervisors can view program gamification stats within one screen without navigating to multiple places.
- **SC-006**: Existing sticker award flow continues to work identically for teachers not assigned to any program.

## Assumptions

- The existing `stickers` and `student_stickers` tables are preserved and extended — not replaced.
- The `programs`, `enrollments`, and `program_roles` tables from 003-programs-enrollment are available.
- The existing `students.current_level`, `students.current_streak`, and `students.longest_streak` columns are the source of truth for rubʿ levels and streaks. Note: `current_level` is program-independent (global to the student) — the leaderboard ranks students by this global level within the context of program enrollment.
- Session counts for milestones are derived from the existing `sessions` table filtered by student and `sessions.program_id` (added in 005-session-evolution, migration 00007). Only completed sessions are counted (status IS NULL or status = 'completed').
- Milestone badge checks use a hybrid approach: session count and streak milestones are triggered inline (during session save / streak update) for immediate feedback; enrollment duration milestones (30d, 90d, 1yr) are checked by a daily pg_cron job since no user action occurs on the exact anniversary.
- The notification infrastructure from 004-push-notifications is available for milestone award notifications.
- **Prerequisites**: 003-programs-enrollment (programs, enrollments, program_roles tables), 004-push-notifications (send-notification Edge Function, push_tokens table), 005-session-evolution (sessions.program_id column).
- Enrollment duration milestones use `enrollments.enrolled_at` as the start date (not `created_at`).
- When a program is deactivated, student_badges records are retained permanently (badges are never revoked). The daily cron job skips inactive programs.

## Scope Boundaries

**In scope**:
- Adding optional program association to stickers
- Program-scoped sticker visibility in award picker
- Program leaderboard (alongside existing class leaderboard)
- Milestone badge system (9 badge types)
- Supervisor rewards dashboard
- Bilingual support for all new content

**Out of scope**:
- Modifying the existing rubʿ certification or freshness system
- Custom badge design by program admins (system-defined badges only)
- Cross-program leaderboard (global ranking across all programs)
- Sticker trading or gifting between students
- Removing or deprecating the class-based leaderboard
