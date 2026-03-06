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

Students enrolled in a program can see a leaderboard scoped to that program, showing top students ranked by their level (rubʿ certifications) or by total stickers earned within the program context. The existing class-based leaderboard continues to work for backwards compatibility.

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

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow stickers to optionally be associated with a specific program (nullable program association on stickers).
- **FR-002**: System MUST show teachers only global stickers plus stickers for programs they are assigned to when awarding.
- **FR-003**: System MUST display the program name on program-scoped stickers in the student's collection view.
- **FR-004**: System MUST provide a program-scoped leaderboard ranking enrolled students by rubʿ level.
- **FR-005**: System MUST show the current student's rank on the leaderboard even if they are outside the top 20.
- **FR-006**: System MUST preserve the existing class-based leaderboard without modification.
- **FR-007**: System MUST define milestone badge types for enrollment duration (30d, 90d, 1yr), session count (10, 50, 100), and streak length (7d, 30d, 100d).
- **FR-008**: System MUST automatically award milestone badges when conditions are met and send a notification.
- **FR-009**: System MUST prevent duplicate milestone badge awards (each badge earned once per program).
- **FR-010**: System MUST show earned badges on the student profile with program name and date.
- **FR-011**: System MUST show unearned badges as locked silhouettes with descriptions.
- **FR-012**: System MUST provide a supervisor rewards dashboard with sticker counts, top teachers, popular stickers, and milestone distribution.
- **FR-013**: System MUST scope the rewards dashboard to the supervisor's assigned program(s).
- **FR-014**: System MUST preserve all previously awarded stickers when a sticker's program scope changes.

### Non-Functional Requirements

- **NFR-001**: Leaderboard queries MUST return results within 2 seconds for programs with up to 500 enrolled students.
- **NFR-002**: Milestone badge checks MUST not add noticeable delay to session recording or streak updates.
- **NFR-003**: All new UI text MUST be bilingual (English and Arabic).

### Key Entities

- **Sticker**: Existing entity, extended with an optional program association. Represents a collectible reward that teachers award to students.
- **Milestone Badge**: New entity representing an automatically-awarded, non-transferable achievement. Has a type (enrollment_30d, sessions_10, streak_7d, etc.), associated program, and the student who earned it.
- **Student Badge**: Join entity linking a student to a milestone badge they earned, with the date earned and program context.
- **Program Leaderboard**: Derived view of enrolled students ranked by rubʿ level within a program, computed from existing student and enrollment data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can award program-scoped stickers to students within 3 taps (same flow as global stickers, just filtered).
- **SC-002**: Program leaderboard loads and displays rankings for up to 500 students within 2 seconds.
- **SC-003**: 100% of defined milestone types (9 total) are automatically checked and awarded without manual intervention.
- **SC-004**: Students can view all earned badges and stickers (both global and program-scoped) in a single unified collection screen.
- **SC-005**: Supervisors can view program gamification stats within one screen without navigating to multiple places.
- **SC-006**: Existing sticker award flow continues to work identically for teachers not assigned to any program.

## Assumptions

- The existing `stickers` and `student_stickers` tables are preserved and extended — not replaced.
- The `programs`, `enrollments`, and `program_roles` tables from 003-programs-enrollment are available.
- The existing `students.current_level`, `students.current_streak`, and `students.longest_streak` columns are the source of truth for rubʿ levels and streaks.
- Session counts for milestones are derived from the existing `sessions` table filtered by student and program.
- Milestone badge checks are triggered inline (during session save / streak update) rather than via scheduled jobs, to provide immediate feedback.
- The notification infrastructure from 004-push-notifications is available for milestone award notifications.

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
