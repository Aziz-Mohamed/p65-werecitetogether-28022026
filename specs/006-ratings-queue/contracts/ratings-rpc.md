# Ratings RPC Contracts

**Feature**: 006-ratings-queue
**Date**: 2026-03-06

All contracts use Supabase RPC (`supabase.rpc()`). No REST endpoints — Supabase JS SDK direct.

## submit_rating

**Purpose**: Student submits a rating for a completed session (FR-001 to FR-004, FR-006)

**Caller**: Student (auth.uid() must be the session's student_id)

**Input**:
```typescript
{
  p_session_id: string;       // UUID of the completed session
  p_star_rating: number;      // 1-5 integer
  p_tags: string[];           // Array of tag keys (e.g., ['patient', 'clear_explanation'])
  p_comment: string | null;   // Optional, max 500 chars
}
```

**Output** (success):
```typescript
{
  id: string;
  session_id: string;
  student_id: string;
  teacher_id: string;
  program_id: string;
  star_rating: number;
  tags: string[];
  comment: string | null;
  is_flagged: boolean;
  created_at: string;
}
```

**Errors**:
| Code | Message | Condition |
|------|---------|-----------|
| P0001 | Session not found | session_id doesn't exist |
| P0001 | Session not completed | session.status != 'completed' |
| P0001 | Rating window expired | session.created_at > 48 hours ago |
| P0001 | Already rated | UNIQUE constraint violation |
| P0001 | Not your session | auth.uid() != session.student_id |
| 23514 | Invalid star rating | star_rating not in 1-5 |
| 23514 | Comment too long | comment > 500 chars |

**Side Effects**:
- Sets `is_flagged = true` if `star_rating <= 2`
- Triggers `recalculate_teacher_stats` via trigger
- Triggers `flagged_review_alert` notification if flagged
- Triggers `low_rating_alert` if teacher avg drops below 3.5

---

## get_teacher_rating_stats

**Purpose**: Get aggregate rating stats for a teacher in a program (FR-010, FR-011, FR-012)

**Caller**: Any authenticated user (filtered by role)

**Input**:
```typescript
{
  p_teacher_id: string;   // UUID of the teacher
  p_program_id: string;   // UUID of the program
}
```

**Output** (success):
```typescript
{
  teacher_id: string;
  program_id: string;
  average_rating: number;           // e.g., 4.72
  total_reviews: number;
  star_distribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  common_positive_tags: string[];     // Top 3 tag keys
  common_constructive_tags: string[]; // Top 3 tag keys
  trend_direction: 'improving' | 'declining' | 'stable';
  last_30_days_avg: number;
  prior_30_days_avg: number;
  updated_at: string;
}
```

**Role-Based Filtering**:
- Students: Returns null if `total_reviews < 5` (FR-005)
- Teachers: Full stats for own records only
- Supervisors/Program Admins: Full stats for teachers in their programs
- Master Admins: Full stats for all

---

## exclude_rating

**Purpose**: Supervisor excludes an abusive/retaliatory review (FR-009)

**Caller**: Supervisor (must have supervisor role for rating's program)

**Input**:
```typescript
{
  p_rating_id: string;   // UUID of the rating to exclude
  p_reason: string;      // Documented reason (required, non-empty)
}
```

**Output** (success):
```typescript
{
  success: boolean;
  rating_id: string;
  is_excluded: boolean;   // true
}
```

**Errors**:
| Code | Message | Condition |
|------|---------|-----------|
| P0001 | Rating not found | rating_id doesn't exist |
| P0001 | Already excluded | rating.is_excluded = true |
| P0001 | Insufficient permissions | Caller not supervisor for this program |
| P0001 | Reason required | p_reason is empty |

**Side Effects**:
- Sets `teacher_ratings.is_excluded = true`
- Inserts row into `rating_exclusion_log` (action = 'excluded')
- Triggers `recalculate_teacher_stats` via trigger

---

## restore_rating

**Purpose**: Supervisor reverses a previous exclusion (FR-009, clarification)

**Caller**: Supervisor (must have supervisor role for rating's program)

**Input**:
```typescript
{
  p_rating_id: string;   // UUID of the rating to restore
  p_reason: string;      // Documented reason (required, non-empty)
}
```

**Output** (success):
```typescript
{
  success: boolean;
  rating_id: string;
  is_excluded: boolean;   // false
}
```

**Errors**:
| Code | Message | Condition |
|------|---------|-----------|
| P0001 | Rating not found | rating_id doesn't exist |
| P0001 | Not excluded | rating.is_excluded = false |
| P0001 | Insufficient permissions | Caller not supervisor for this program |
| P0001 | Reason required | p_reason is empty |

**Side Effects**:
- Sets `teacher_ratings.is_excluded = false`
- Inserts row into `rating_exclusion_log` (action = 'restored')
- Triggers `recalculate_teacher_stats` via trigger

---

## get_teacher_reviews

**Purpose**: Supervisor/admin views individual reviews with student names (FR-008)

**Caller**: Supervisor, Program Admin, Master Admin

**Input**:
```typescript
{
  p_teacher_id: string;   // UUID of the teacher
  p_program_id: string;   // UUID of the program
  p_page: number;         // Page number (1-based), default 1
  p_page_size: number;    // Items per page, default 20
}
```

---

## Notification Payloads (Ratings)

### rating_prompt (to student, FR-013)

Sent immediately when a session status changes to 'completed'.

```json
{
  "to": "<push_token>",
  "title": "Rate Your Session / قيّم جلستك",
  "body": "How was your session with [Teacher]? Tap to rate. / كيف كانت جلستك مع [المعلم]؟ اضغط للتقييم.",
  "data": {
    "type": "rating_prompt",
    "session_id": "<uuid>",
    "teacher_id": "<uuid>",
    "url": "werecitetogether://sessions/<session_id>"
  }
}
```

### flagged_review_alert (to supervisors, FR-015)

Sent when a rating with star_rating <= 2 is submitted.

```json
{
  "to": "<push_token>",
  "title": "Flagged Review / مراجعة مُبلّغ عنها",
  "body": "[Student] rated [Teacher] [N] stars in [Program]. / [الطالب] قيّم [المعلم] [N] نجوم في [البرنامج].",
  "data": {
    "type": "flagged_review_alert",
    "rating_id": "<uuid>",
    "teacher_id": "<uuid>",
    "program_id": "<uuid>",
    "url": "werecitetogether://supervisor/reviews/<rating_id>"
  }
}
```

### low_rating_alert (to program admins, FR-014)

Sent when a teacher's average drops below 3.5.

```json
{
  "to": "<push_token>",
  "title": "Teacher Rating Alert / تنبيه تقييم معلم",
  "body": "[Teacher]'s average rating dropped to [N] in [Program]. / انخفض متوسط تقييم [المعلم] إلى [N] في [البرنامج].",
  "data": {
    "type": "low_rating_alert",
    "teacher_id": "<uuid>",
    "program_id": "<uuid>",
    "average_rating": "<number>",
    "url": "werecitetogether://admin/teachers/<teacher_id>/ratings"
  }
}
```

### recovered_alert (to program admins, FR-036)

Sent when a teacher's average recovers above 3.5.

```json
{
  "to": "<push_token>",
  "title": "Teacher Rating Recovered / تحسن تقييم المعلم",
  "body": "[Teacher]'s average rating improved to [N] in [Program]. / تحسن متوسط تقييم [المعلم] إلى [N] في [البرنامج].",
  "data": {
    "type": "recovered_alert",
    "teacher_id": "<uuid>",
    "program_id": "<uuid>",
    "average_rating": "<number>",
    "url": "werecitetogether://admin/teachers/<teacher_id>/ratings"
  }
}
```

---

## get_teacher_reviews

**Purpose**: Supervisor/admin views individual reviews with student names (FR-008)

**Caller**: Supervisor, Program Admin, Master Admin

**Input**:
```typescript
{
  p_teacher_id: string;   // UUID of the teacher
  p_program_id: string;   // UUID of the program
  p_page: number;         // Page number (1-based), default 1
  p_page_size: number;    // Items per page, default 20
}
```

**Output** (success):
```typescript
{
  reviews: Array<{
    id: string;
    session_id: string | null;
    student_id: string;
    student_name: string;         // Full name from profiles
    star_rating: number;
    tags: string[];
    comment: string | null;
    is_flagged: boolean;
    is_excluded: boolean;
    created_at: string;
    exclusion_log: Array<{        // Audit trail
      action: 'excluded' | 'restored';
      performed_by: string;
      performer_name: string;
      reason: string;
      created_at: string;
    }>;
  }>;
  total_count: number;
  page: number;
  page_size: number;
}
```
