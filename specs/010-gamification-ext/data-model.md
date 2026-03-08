# Data Model: Gamification Extension for Programs

## Altered Tables

### stickers (ALTER — add program_id)

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| program_id | UUID | NULLABLE, FK → programs(id) ON DELETE SET NULL | NULL = global sticker; value = program-scoped |

**Index**: `CREATE INDEX idx_stickers_program_id ON stickers(program_id);`

**RLS update**: Existing RLS stays. Add policy for program-scoped visibility:
- SELECT: `program_id IS NULL` (global) OR `program_id IN (SELECT program_id FROM program_roles WHERE profile_id = auth.uid())` OR `program_id IN (SELECT program_id FROM enrollments WHERE student_id = auth.uid() AND status = 'active')`
- INSERT: `auth.uid()` has role `admin`/`master_admin` (for global), or `program_admin` for their program
- UPDATE/DELETE: same as INSERT

## New Tables

### milestone_badges

Reference table defining the 9 milestone badge types. Seeded at migration time.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | TEXT | PRIMARY KEY | e.g., 'enrollment_30d', 'sessions_10', 'streak_7d' |
| category | TEXT | NOT NULL, CHECK IN ('enrollment', 'sessions', 'streak') | Groups badge types |
| threshold | INTEGER | NOT NULL | The numeric threshold (30, 90, 365, 10, 50, 100, 7, 30, 100) |
| name_en | TEXT | NOT NULL | English display name |
| name_ar | TEXT | NOT NULL | Arabic display name |
| description_en | TEXT | NOT NULL | English description of how to earn |
| description_ar | TEXT | NOT NULL | Arabic description of how to earn |
| icon | TEXT | NOT NULL | Ionicons icon name |
| sort_order | INTEGER | NOT NULL DEFAULT 0 | Display ordering |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**Seed data** (9 rows):

| id | category | threshold | name_en | icon |
|----|----------|-----------|---------|------|
| enrollment_30d | enrollment | 30 | 30-Day Member | `calendar-outline` |
| enrollment_90d | enrollment | 90 | 90-Day Member | `calendar` |
| enrollment_1yr | enrollment | 365 | One Year Member | `ribbon-outline` |
| sessions_10 | sessions | 10 | 10 Sessions | `book-outline` |
| sessions_50 | sessions | 50 | 50 Sessions | `book` |
| sessions_100 | sessions | 100 | 100 Sessions | `library-outline` |
| streak_7d | streak | 7 | 7-Day Streak | `flame-outline` |
| streak_30d | streak | 30 | 30-Day Streak | `flame` |
| streak_100d | streak | 100 | 100-Day Streak | `bonfire-outline` |

**RLS**: SELECT for all authenticated users. No INSERT/UPDATE/DELETE via client (seed-only).

### student_badges

Records which students have earned which milestone badges for which programs.

| Column | Type | Constraint | Notes |
|--------|------|-----------|-------|
| id | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | |
| student_id | UUID | NOT NULL, FK → profiles(id) ON DELETE CASCADE | |
| badge_id | TEXT | NOT NULL, FK → milestone_badges(id) ON DELETE CASCADE | |
| program_id | UUID | NOT NULL, FK → programs(id) ON DELETE CASCADE | Program context for the award |
| earned_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | When the badge was earned |
| UNIQUE | | (student_id, badge_id, program_id) | Each badge earned once per program |

**RLS**:
- SELECT: `student_id = auth.uid()` OR user has supervisor/program_admin/admin/master_admin role in the badge's program
- INSERT: Only via trigger/RPC (no direct client insert)

**Index**: `CREATE INDEX idx_student_badges_student_program ON student_badges(student_id, program_id);`

## Entity Relationships

```text
programs 1──────∞ stickers        (nullable: program_id on stickers)
programs 1──────∞ student_badges  (required: program_id)
milestone_badges 1──∞ student_badges  (required: badge_id)
profiles 1──────∞ student_badges  (required: student_id)
```

## RPC Functions

### get_program_leaderboard(p_program_id UUID, p_limit INT DEFAULT 20, p_student_id UUID DEFAULT NULL)

Returns ranked list of enrolled students for a program.

**Returns**: TABLE(student_id UUID, full_name TEXT, avatar_url TEXT, current_level INT, longest_streak INT, rank BIGINT)

**Logic**:
1. Join enrollments (status='active') with students and profiles
2. Rank by current_level DESC, longest_streak DESC, full_name ASC
3. Return top p_limit rows + current student's row if outside top

### get_rewards_dashboard(p_program_id UUID)

Returns aggregated gamification stats for a program.

**Returns**: JSON object with:
- `stickers_this_week`: INT
- `stickers_this_month`: INT
- `top_teachers`: ARRAY of {teacher_id, full_name, award_count} (top 5)
- `popular_stickers`: ARRAY of {sticker_id, name_en, name_ar, award_count} (top 5)
- `badge_distribution`: ARRAY of {badge_id, name_en, name_ar, earned_count}

**Logic**: Aggregates from student_stickers (joined with stickers for program filtering) and student_badges.

### check_session_milestones(p_student_id UUID, p_program_id UUID)

Called inline after session save. Checks session count milestones.

**Logic**:
1. Count sessions for student in program
2. For each session milestone (10, 50, 100): if count >= threshold AND no existing student_badge → INSERT + notify

### check_streak_milestones(p_student_id UUID)

Called via trigger after students.current_streak update. Checks streak milestones.

**Logic**:
1. Read current_streak from students
2. For each enrolled program: for each streak milestone (7, 30, 100): if streak >= threshold AND no existing student_badge → INSERT + notify

### check_enrollment_duration_milestones()

Called via daily pg_cron. Checks all active enrollments for duration milestones.

**Logic**:
1. For each active enrollment where `now() - enrolled_at >= threshold days`
2. For each duration milestone (30, 90, 365): if elapsed >= threshold AND no existing student_badge → INSERT + notify

## Triggers

### trigger_check_streak_milestones

- **Table**: students
- **Event**: AFTER UPDATE OF current_streak
- **Function**: Calls `check_streak_milestones(NEW.id)`
- **Condition**: `NEW.current_streak > OLD.current_streak` (only on increment)

### trigger_check_session_milestones (handled via app layer)

Session milestone checks are called from the service layer after session creation, since `sessions` table needs program_id context that may come from the app.

## pg_cron Job

```sql
SELECT cron.schedule(
  'check-enrollment-duration-milestones',
  '0 4 * * *',  -- Daily at 04:00 UTC
  $$SELECT check_enrollment_duration_milestones()$$
);
```
