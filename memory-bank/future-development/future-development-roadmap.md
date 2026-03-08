# Future Development Roadmap

Last updated: 2026-03-07

This document catalogs features that were identified during the production readiness gap analysis but deferred because they each require dedicated design specs before implementation. These are real product gaps — not bugs or missing wiring — but entire new features with undefined requirements.

---

## What Was Already Completed

The gap analysis found 12 gaps. Phases A-C and part of Phase D are done:

| Phase | What | Status |
|-------|------|--------|
| A | Missing tables (student_guardians, mutoon_progress, program_waitlist) | Done |
| A | TypeScript type regeneration, `as never` cast removal | Done |
| A | Profile service rewrite (was a stub) | Done |
| B | Session reminders edge function + pg_cron | Done |
| B | Navigation fixes (badges, leaderboard, rewards deep links) | Done |
| B | i18n audit (all keys present in en + ar) | Done |
| C | Waitlist UI (student + admin) | Done |
| C | Tests (91 new: freshness, enrollment helpers, waitlist service) | Done |
| D | Mutoon progress (student + teacher screens) | Done |

---

## Feature 1: Qiraat Reading Variant Tracking

**Priority:** Medium
**Effort:** Medium (1-2 weeks)
**PRD Reference:** Program 4 — Qiraat

### What It Is

Qiraat is the study of different reading styles (qira'at) of the Quran — e.g., Hafs, Warsh, Qalun, etc. Students study one or more variants and need to track which variant they're practicing in each session.

### What's Missing

- No way to record which qira'a variant a session covers
- No variant selection when a teacher logs a session for a Qiraat program
- No student-facing view of their variant progress
- No variant metadata in the database (a reference table of the 10 canonical readings)

### What Needs to Be Built

1. **Database**: `qiraat_variants` reference table (id, name, name_ar, reader_name, reader_name_ar, transmitter, sort_order)
2. **Schema change**: Add optional `qiraat_variant_id` column to `sessions` table for Qiraat program sessions
3. **Teacher UI**: Variant selector in session creation/logging when the program is Qiraat
4. **Student UI**: Progress breakdown by variant on program detail screen
5. **Reports**: Filter session reports by variant for supervisors/admins

### Prerequisites

- Decide the canonical list of variants to include (10 major qira'at? 7? just Hafs/Warsh?)
- Decide if students can study multiple variants simultaneously or sequentially

---

## Feature 2: Arabic Language Curriculum System

**Priority:** Medium
**Effort:** Large (3-4 weeks)
**PRD Reference:** Program 6 — Arabic Language

### What It Is

A lesson/curriculum management system that allows teachers to define structured lesson plans, assign homework, and track lesson-level progress for language learning programs.

### What's Missing

- No concept of "lessons" or "units" in the data model
- Teachers can only log free-form session notes — no structured lesson plan
- No vocabulary tracking or assessment system
- No homework assignment beyond free-form text
- No lesson-level completion tracking for students

### What Needs to Be Built

1. **Database**: `lessons` table (program_id, track_id, unit, title, title_ar, content, content_ar, sort_order, lesson_type), `lesson_progress` table (student_id, lesson_id, status, completed_at), `vocabulary` table (optional — word, translation, lesson_id)
2. **Teacher UI**: Lesson plan builder (create/reorder lessons within a track), assign lessons to sessions
3. **Student UI**: Lesson list with completion status, lesson detail view
4. **Reports**: Lesson completion rates per student, per cohort

### Prerequisites

- Define what a "lesson" contains (text? audio? exercises? just metadata?)
- Decide if lessons are shared across cohorts or per-cohort
- Determine if vocabulary tracking is in-scope or a separate feature

---

## Feature 3: Children's Program Adaptations

**Priority:** Low
**Effort:** Medium (2-3 weeks)
**PRD Reference:** Program 2 — Children's Program

### What It Is

Age-appropriate UI adaptations and parental consent workflows for programs targeting younger students (typically under 12).

### What's Missing

- No age detection or program-level age gating
- No simplified/larger UI for younger students
- No parental consent flow before enrollment
- No parent-linked notifications for children's sessions
- The `student_guardians` table exists (migration 00013) but isn't used in any consent workflow

### What Needs to Be Built

1. **Schema change**: Add `min_age` / `max_age` columns to `programs` table, add `date_of_birth` to `profiles` or `students` table
2. **Consent flow**: Before enrolling in a children's program, require a linked guardian to approve via `student_guardians` table
3. **UI adaptations**: Larger touch targets, simpler navigation, more visual feedback for children's program screens (could be a theme variant)
4. **Parent notifications**: Auto-notify guardians of session outcomes, attendance, and awards for their linked children

### Prerequisites

- Define age thresholds (what age makes a program "children's"?)
- Decide if the simplified UI is a full separate layout or just CSS adjustments
- Clarify if parental consent is blocking (student can't enroll without guardian approval) or optional

---

## Feature 4: Peer-to-Peer Student Matching

**Priority:** Low
**Effort:** Large (3-4 weeks)
**PRD Reference:** Section 7.2 (peer pairing)

### What It Is

A system where students can find practice partners for peer recitation sessions — practicing together without a teacher present.

### What's Missing

- No matching algorithm
- No UI for students to find or request practice partners
- No "paired session" type in the session model
- No moderation system for peer interactions
- No scheduling for peer sessions

### What Needs to Be Built

1. **Database**: `peer_requests` table (student_id, program_id, status, preferred_times), `peer_sessions` table (or add `session_type: 'peer'` to sessions)
2. **Matching algorithm**: Match students by program, track, skill level, availability, and language preference
3. **Student UI**: "Find a Partner" screen, partner request/accept flow, peer session scheduling
4. **Moderation**: Reporting mechanism, session time limits, optional teacher oversight
5. **Notifications**: Partner match found, session reminder, partner cancelled

### Prerequisites

- Define moderation policy (are peer sessions recorded? can they be reviewed?)
- Decide matching criteria priority (same track? same level? same language?)
- Determine if peer sessions count toward progress/gamification or are separate
- Consider safety implications for minors using peer matching

---

## Feature 5: Waitlist Auto-Expiry and Notifications

**Priority:** Medium
**Effort:** Small (3-5 days)

### What It Is

The waitlist system (Phase C) is built but lacks automated expiry of offered spots and push notifications when a student gets promoted.

### What's Missing

- No pg_cron job to expire waitlist offers after 48 hours
- No push notification when a student is promoted from the waitlist
- No notification when a waitlist offer is about to expire
- No automatic re-promotion when an offer expires

### What Needs to Be Built

1. **pg_cron job**: Run every hour, find `program_waitlist` entries where `status = 'offered'` and `expires_at < now()`, set to `expired`, revert the enrollment status, then call `promote_from_waitlist` for the cohort
2. **Edge function update**: Extend `send-notification` to handle `waitlist_promoted` and `waitlist_expiring` categories
3. **Notification preferences**: Add waitlist notification toggles to `notification_preferences`

### Prerequisites

- The `promote_from_waitlist` RPC already exists (migration 00015)
- The `send-notification` edge function already handles push delivery
- Just needs the cron job and notification integration

---

## Feature 6: Enhanced Test Coverage

**Priority:** Medium
**Effort:** Ongoing

### Current State

- 46 test suites, 544 tests passing
- Utils: 100% covered
- Stores: 71% covered
- Services: ~20% covered (9 of 46)
- Hooks: ~3% covered (4 of 135)

### High-Priority Untested Code

| File | Lines | Why It Matters |
|------|-------|----------------|
| `admin-reports.service.ts` | 328 | School KPI computation, used by 5+ features |
| `scheduled-session.service.ts` | 260 | Session creation, validation, teacher assignment |
| `recitation-plan.service.ts` | 255 | Plan CRUD, schedule conversion |
| `auth.service.ts` | 222 | OAuth login, session management |
| `parent-dashboard.service.ts` | 190 | KPI aggregation for parent UI |
| `admin.service.ts` | 190 | User management, role assignment |
| `teacher-reports.service.ts` | 187 | Performance metrics, analytics |

### Testing Infrastructure

The test infrastructure is solid and ready for expansion:
- `jest-expo` preset with TypeScript
- `src/__test-utils__/supabase-mock.ts` provides `createQueryMock()`, `whenFrom()`, `whenRpc()`, `whenGetUser()`
- Established patterns for service tests, hook tests (extract pure logic), and store tests

---

## Implementation Order Recommendation

When picking up these features, this is the suggested order based on impact and complexity:

1. **Waitlist auto-expiry** (Feature 5) — smallest effort, completes an existing feature
2. **Test coverage** (Feature 6) — ongoing, can be done alongside other work
3. **Qiraat variants** (Feature 1) — medium effort, well-scoped
4. **Curriculum system** (Feature 2) — large but high impact for Arabic Language program
5. **Children's adaptations** (Feature 3) — depends on UX design decisions
6. **Peer matching** (Feature 4) — largest effort, most design questions

---

## How to Start a Feature

Each feature above should go through the speckit workflow before coding:

```bash
# 1. Create the spec
/speckit.specify "Description of the feature"

# 2. Clarify requirements
/speckit.clarify

# 3. Generate implementation plan
/speckit.plan

# 4. Generate tasks
/speckit.tasks

# 5. Implement
/speckit.implement
```

Specs should be created in `specs/011-{feature-name}/` following the existing convention (001-010 are already used).

---

## Related Plans

- **[Supabase Performance Optimization](./supabase-performance-optimization.md)** — 7-phase plan for scaling to 60K+ users (indexes, RLS helpers, async triggers, Edge Function optimization, text search)
