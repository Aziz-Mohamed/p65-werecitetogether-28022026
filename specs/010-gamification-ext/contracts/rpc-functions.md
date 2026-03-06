# API Contracts: Gamification Extension RPC Functions

All functions use Supabase JS SDK `supabase.rpc()` calls. No REST endpoints needed.

## get_program_leaderboard

**Call**: `supabase.rpc('get_program_leaderboard', { p_program_id, p_limit?, p_student_id? })`

**Parameters**:
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| p_program_id | UUID | Yes | — | Program to get leaderboard for |
| p_limit | INT | No | 20 | Max rows to return (top N) |
| p_student_id | UUID | No | NULL | Current student to always include |

**Response** (array of rows):
```typescript
interface LeaderboardEntry {
  student_id: string;
  full_name: string;
  avatar_url: string | null;
  current_level: number;
  longest_streak: number;
  rank: number;
}
```

**Error cases**:
- Not enrolled in program → empty array (RLS filters)
- Invalid program_id → empty array

---

## get_rewards_dashboard

**Call**: `supabase.rpc('get_rewards_dashboard', { p_program_id })`

**Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| p_program_id | UUID | Yes | Program to get stats for |

**Response** (single JSON object):
```typescript
interface RewardsDashboard {
  stickers_this_week: number;
  stickers_this_month: number;
  top_teachers: Array<{
    teacher_id: string;
    full_name: string;
    award_count: number;
  }>;
  popular_stickers: Array<{
    sticker_id: string;
    name_en: string;
    name_ar: string;
    award_count: number;
  }>;
  badge_distribution: Array<{
    badge_id: string;
    name_en: string;
    name_ar: string;
    earned_count: number;
  }>;
}
```

**Error cases**:
- Not supervisor/program_admin for program → null (RLS)

---

## check_session_milestones

**Call**: `supabase.rpc('check_session_milestones', { p_student_id, p_program_id })`

**Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| p_student_id | UUID | Yes | Student who completed session |
| p_program_id | UUID | Yes | Program context |

**Response**: `void` (side effects: inserts student_badges, sends notifications)

**Called by**: App layer after session save (not called directly by UI).

---

## check_streak_milestones

**Call**: Triggered automatically via Postgres trigger on `students.current_streak` update. Not called from client.

---

## check_enrollment_duration_milestones

**Call**: Triggered automatically via daily pg_cron job at 04:00 UTC. Not called from client.

---

## Existing Service Methods (Modified)

### gamificationService.getStickers(programIds?: string[])

**Before**: `SELECT * FROM stickers WHERE is_active = true`
**After**: `SELECT * FROM stickers WHERE is_active = true AND (program_id IS NULL OR program_id = ANY(programIds))`

When `programIds` is undefined/empty, returns only global stickers (backward-compatible).

### gamificationService.getStudentBadges(studentId: string, programId?: string)

**New method**: Fetches earned + all badge types for display.

```typescript
// Returns all milestone_badges with earned status
interface StudentBadgeDisplay {
  badge_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  category: 'enrollment' | 'sessions' | 'streak';
  earned: boolean;
  earned_at: string | null;
  program_name: string | null;
}
```
