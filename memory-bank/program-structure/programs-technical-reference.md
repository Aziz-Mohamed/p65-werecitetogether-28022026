# Programs Technical Reference

> Last updated: 2026-03-08
> Migration: `00026_realign_programs_tracks.sql`

## Overview

Programs are organized into two divisions based on their enrollment model:

| Division | DB Category | Description |
|----------|-------------|-------------|
| **Open** (القسم الحر) | `free` | Join anytime, no fixed schedules, no class limits. All programs are free of charge — "free" here means flexible/open, not pricing. |
| **Structured** (القسم المنظم) | `structured` | Fixed classes with set schedules and defined student limits per class. |

There is **no** `mixed` category. It was removed in migration 00026.

---

## Data Model

### Tables

- **`programs`** — Root entity. Has `category` (`free` | `structured`), `sort_order` for display.
- **`program_tracks`** — Sub-divisions within a program. Supports hierarchy via `parent_track_id`.
- **`classes`** — Organized groups for structured programs. Links to program + optional track.
- **`enrollments`** — Student enrollment records. Students enroll in **leaf tracks** (not parent tracks).
- **`program_roles`** — Admin/supervisor/teacher assignments per program.

### Track Hierarchy

`program_tracks.parent_track_id` enables 3-level nesting:

```
Program → Track (parent) → Track (child)
```

- **Parent tracks** are grouping headers (e.g., مراجعة, قسم القرآن). They are NOT enrollable.
- **Leaf tracks** (no children) are the actual enrollment targets.
- **Flat tracks** have `parent_track_id = NULL` and no children — they are directly enrollable.

Use `buildTrackTree()` from `src/features/programs/utils/enrollment-helpers.ts` to convert flat DB results into a tree.

---

## Complete Program Hierarchy

### Open Division (`category = 'free'`, `sort_order` 1-3)

#### 1. التسميع بالتناوب — Rotating Recitation (`sort_order=1`)

| Track | Arabic | Type | Parent |
|-------|--------|------|--------|
| Mutoon Section | قسم المتون | flat | — |
| Quran Section | قسم القرآن | **parent** | — |
| ↳ Certified Teachers | معلمون مجازون | leaf | Quran Section |
| ↳ Students | طلاب | leaf | Quran Section |

> **Design decision**: "Certified Teachers" and "Students" are separate enrollment paths under the Quran section, not roles. A user explicitly chooses which sub-track to join.

#### 2. الأعاجم — Non-Arab Students (`sort_order=3`)

| Track | Arabic | Type | Parent |
|-------|--------|------|--------|
| Pronunciation Correction | تصحيح | flat | — |

---

### Structured Division (`category = 'structured'`, `sort_order` 2, 4-8)

#### 3. الأطفال — Children (`sort_order=2`)

| Track | Arabic |
|-------|--------|
| Talqeen | التلقين |
| Nooraniah Method | القاعدة النورانية |
| Memorization Track | مسار الحفظ |

#### 4. القراءات — Qira'at (`sort_order=4`)

| Track | Arabic |
|-------|--------|
| Hafs from Asim | حفص عن عاصم |
| Warsh from Nafi | ورش عن نافع |
| Qalun from Nafi | قالون عن نافع |
| Al-Duri from Abu Amr | الدوري عن أبي عمرو |

#### 5. المتون — Mutoon (`sort_order=5`)

> 15–30 students per class. Ijaza (certification) issued upon completion.

| Track | Arabic |
|-------|--------|
| Tuhfat Al-Atfal | تحفة الأطفال |
| Al-Jazariyyah | الجزرية |
| Al-Shatibiyyah | الشاطبية |

> **Design decision**: Previously `mixed` with a "Free Section" track. The free mutoon recitation now lives under التسميع بالتناوب (Mutoon Section track). The "Free Section" track was deactivated (`is_active = false`).

#### 6. اللغة العربية — Arabic Language (`sort_order=6`)

| Track | Arabic |
|-------|--------|
| Al-Ajrumiyyah | الآجرومية |
| Qatr Al-Nada | قطر الندى |

#### 7. القرآن الكريم — The Holy Quran (`sort_order=7`)

| Track | Arabic | Type | Parent |
|-------|--------|------|--------|
| Memorization | تحفيظ | flat | — |
| Revision | مراجعة | **parent** | — |
| ↳ Mateen 10 Juz | متين ١٠ أجزاء | leaf | Revision |
| ↳ Mateen 15 Juz | متين ١٥ جزء | leaf | Revision |
| ↳ Mateen 30 Juz | متين ٣٠ جزء | leaf | Revision |
| ↳ Thabbitaha | ثبتها | leaf | Revision |

> **Design decisions**:
> - Mateen 10/15/30 are separate tracks (not one track with config) because each represents a different commitment level with distinct classes.
> - الإتقان (Itqan) was deactivated (`is_active = false`). It can be reactivated later if needed.
> - تحفيظ (Memorization) is a new top-level track added in migration 00026.

#### 8. همم القرآني — Himam Quranic Marathon (`sort_order=8`)

> Held every Saturday. Has its own event system (`himam_events`, `himam_registrations`, `himam_progress`).

| Track | Arabic |
|-------|--------|
| 3 Juz | ٣ أجزاء |
| 5 Juz | ٥ أجزاء |
| 10 Juz | ١٠ أجزاء |
| 15 Juz | ١٥ جزء |
| 30 Juz | ٣٠ جزء |

---

## Key Implementation Files

| File | Purpose |
|------|---------|
| `supabase/migrations/00005_programs_enrollment.sql` | Original schema + seed data |
| `supabase/migrations/00026_realign_programs_tracks.sql` | Restructuring migration |
| `src/features/programs/types/programs.types.ts` | TypeScript types (`ProgramCategory`, `ProgramTrack`, `ProgramTrackNode`) |
| `src/features/programs/services/programs.service.ts` | Supabase queries |
| `src/features/programs/utils/enrollment-helpers.ts` | `buildTrackTree()`, category helpers |
| `src/features/programs/components/TrackList.tsx` | Hierarchical track rendering |
| `app/(student)/programs/index.tsx` | Programs listing (sectioned by Open/Structured) |
| `app/(student)/programs/[id].tsx` | Program detail with hierarchical tracks |
| `memory-bank/program-structure/maqraa-programs-structure.md` | Arabic reference |
| `memory-bank/program-structure/maqraa-programs-structure-en.md` | English reference |

## Enrollment Rules

- **Open programs**: Direct insert into `enrollments` with `status = 'active'`. No class selection needed.
- **Structured programs**: Via `enroll_student()` RPC. Requires selecting a class. May result in `pending` (needs approval) or `waitlisted` (class full) status.
- **Students enroll in leaf tracks only**, never in parent tracks.
- **Deactivated tracks** (`is_active = false`) remain in the DB for FK integrity. Existing enrollments persist but no new enrollments are accepted. The service filters `is_active = true` for browsing.
