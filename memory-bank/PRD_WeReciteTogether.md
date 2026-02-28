# نتلو معاً (We Recite Together) — Product Requirements Document (PRD)
# Online Quranic Learning & Recitation Platform

---

## Document Metadata

| Field | Value |
|---|---|
| **App Name (Arabic)** | نتلو معاً |
| **App Name (English)** | WeReciteTogether |
| **Tagline (Arabic)** | نتلو معاً — منصة لتعليم القرآن الكريم |
| **Tagline (English)** | We Recite Together — Online Quranic Learning Platform |
| **Document Version** | 1.2 |
| **Date** | February 2026 |
| **Status** | Updated with competitive insights + voice memo + ratings + waitlist |
| **Base Codebase** | Quran School (React Native / Expo / Supabase) |
| **Approach** | Fork & customize Quran School into WeReciteTogether |

---

## Name Rationale

**نتلو معاً (We Recite Together)** — captures the collaborative, community-driven spirit of the platform. The Arabic verb تلا (to recite) is deeply tied to Quranic recitation (تلاوة), and معاً (together) emphasizes the peer and teacher-student connection at the heart of every program. The name is:
- Immediately understandable in both Arabic and English
- Emphasizes community and togetherness — central to the مقرأة tradition
- Globally accessible — the English form "WeReciteTogether" works for non-Arabic speakers (Program 3)
- Clean for app store listing: "نتلو معاً" (Arabic) / "WeReciteTogether" (English)
- Memorable and distinctive in a market dominated by single-word Arabic names

---

## 1. Product Vision & Overview

### 1.1 What Is This Product?

WeReciteTogether is a **mobile-first platform** for a volunteer-based online Quranic organization (مقرأة إلكترونية) that connects Quran students with certified teachers for live recitation, memorization, tajweed correction, Quranic studies (متون), and Arabic language learning — all conducted remotely via external video/voice conferencing tools (Google Meet, Zoom, etc.).

The platform **manages everything around the learning sessions**: enrollment, scheduling, teacher availability, student progress tracking, certifications (إجازات), notifications, and administrative oversight. The actual voice/video communication happens **outside the app** via external meeting links, keeping infrastructure costs zero.

### 1.2 How Is This Different from Quran School?

| Dimension | Quran School | WeReciteTogether |
|---|---|---|
| **Model** | Physical school, in-person | Fully online, remote |
| **Tenancy** | Multi-tenant (many schools) | Single organization |
| **Sessions** | GPS-verified, on-site | External meeting links (Google Meet, etc.) |
| **Programs** | Single memorization program | 8+ distinct programs |
| **Structure** | Fixed classes only | Mix of free (drop-in) + structured (cohorts) |
| **Certification** | Rub-based level tracking | Formal Ijazah system |
| **Roles** | 4 roles (student/teacher/parent/admin) | 5 roles (student/teacher/supervisor/program admin/master admin) |
| **Content scope** | Quran memorization only | Quran + Qiraat + Mutoon + Arabic language |
| **Audience** | Children (with parent role) | All ages, including dedicated children's program |
| **Languages served** | Arabic/English speakers | Arabic speakers + non-Arabic speakers (أعاجم) |

### 1.3 Core Principles

1. **Zero streaming cost** — All live communication via external tools (Google Meet links). The app manages everything else.
2. **Program-based architecture** — Each program is a self-contained module. Students enroll in programs, not "classes."
3. **Dual participation model** — Some programs are free/drop-in (حر), others are structured with enrollment, tracking, and graduation (مقيد).
4. **Volunteer-friendly** — The system must be simple enough for volunteer teachers and admins who are not tech-savvy.
5. **Certification-centric** — Many programs culminate in an إجازة (Ijazah/certification). The system must track progress toward and issuance of certifications.
6. **Mobile-first** — Primary usage is on phones. Tablet/web are secondary.

---

## 2. User Roles & Hierarchy

### 2.1 Role Hierarchy

```
Master Admin (مدير عام)
├── Program Admin (مدير البرنامج) — one per program
│   ├── Supervisor (مشرف) — manages a group of teachers within a program
│   │   ├── Teacher (معلم) — conducts sessions with students
│   │   │   └── Student (طالب) — enrolled in one or more programs
```

### 2.2 Role Definitions

#### Master Admin (مدير عام)
- Full control over the entire platform
- Can create/manage Program Admins
- Views cross-program analytics and reports
- Manages global settings (meeting link policies, branding, etc.)
- Can access any program's data

#### Program Admin (مدير البرنامج)
- Assigned to manage one specific program (e.g., "حفظ القرآن" or "المتون")
- Full CRUD within their program: teachers, supervisors, students, cohorts
- Views program-specific analytics
- Manages program schedules and enrollment
- Issues certifications/Ijazahs within their program
- Cannot see or modify other programs

#### Supervisor (مشرف)
- Manages a group of teachers within a program
- Monitors teacher activity and session logs
- Reviews student progress under their teachers
- Can reassign students between their teachers
- Reports to Program Admin

#### Teacher (معلم)
- Can be assigned to one or more programs
- Two modes of operation:
  - **Free programs**: Toggles availability (green dot), accepts drop-in students
  - **Structured programs**: Has assigned students/cohorts, follows a curriculum plan
- Records session outcomes (scores, notes, attendance)
- Recommends students for certification
- Has a personal meeting link (Google Meet or other) stored in profile

#### Student (طالب)
- Can enroll in multiple programs simultaneously
- Two participation modes:
  - **Free programs**: Joins available teachers for drop-in sessions
  - **Structured programs**: Follows assigned curriculum, tracked progress, works toward certification
- Views own progress, upcoming sessions, certificates earned
- For children's program: a parent/guardian manages the account (sub-role, not a separate role — the parent IS the student account manager)

### 2.3 Key Difference from Quran School Roles

- **No separate "Parent" role** as a top-level role. Instead, for the children's program, parent information is stored as metadata on the child's student profile. The parent logs in as the child's account.
- **Added Supervisor role** between Teacher and Program Admin.
- **Program Admin** is a scoped admin, not a full system admin.
- **Teachers can belong to multiple programs** (a teacher might teach in both تسميع بالتناوب and حفظ القرآن).

---

## 3. Programs — Complete Specification

The platform hosts **8 main programs**, each with its own structure, rules, and tracking needs. Programs are divided into two operational categories:

### Program Categories

**Category A — Free Programs (برامج حرة)**
- No enrollment required (or lightweight registration)
- Drop-in participation
- No cohort system
- No mandatory curriculum or timeline
- Teacher toggles availability; student joins any available teacher
- Minimal admin oversight

**Category B — Structured Programs (برامج مقيدة)**
- Formal enrollment required
- Cohort/batch system (دفعات)
- Defined curriculum and timeline
- Progress tracking and milestones
- Administrative oversight and reporting
- Certification upon completion

---

### Program 1: تسميع بالتناوب (Alternating Recitation)

**Category:** Mixed (has both free and structured sections)

#### Section 1: حلقات مع معلمين مجازين (Sessions with Certified Teachers)
- **Type:** Free / Drop-in
- **Purpose:** Tajweed correction and recitation review (تصحيح التلاوة)
- **How it works:**
  - Teachers go "online/available" throughout the day (green dot indicator)
  - Students browse available teachers and join one
  - Session happens via the teacher's external meeting link
  - After the session, teacher logs brief feedback (optional for free sessions)
- **Content scope:** Quran recitation only
- **No enrollment, no tracking, no certification**

#### Section 2: تسميع بالتناوب للطلاب (Student-to-Student Alternating Recitation)
- **Type:** Free / Peer-to-peer
- **Purpose:** Review practice (مراجعة) between students
- **How it works:**
  - Students are paired or form small groups
  - They recite to each other in turns
  - No teacher required (self-organized)
  - The app facilitates matching/pairing
- **Sub-sections:**
  - قسم قرآن (Quran section) — reciting from the Mushaf
  - قسم متون (Mutoon section) — reciting Islamic texts/poems
- **Not managed by admin; student-driven**
- **No certification**

---

### Program 2: برنامج الأطفال (Children's Program)

**Category:** Structured

#### Tracks (مسارات):

| Track | Arabic Name | Description | Target Age |
|---|---|---|---|
| Track 1 | التلقين | Oral transmission — teacher recites, child repeats | 3-6 years |
| Track 2 | القاعدة النورانية | Nooraniyah method — phonetic Arabic reading | 4-8 years |
| Track 3 | مسار الحفظ | Memorization track | 6+ years |

#### Structure:
- Each track has **independent halaqat (circles/groups)**
- Each group: 1 teacher + fixed number of students (configurable, e.g., 5-10)
- **Parent manages the child's account** (parent info stored on student profile)
- Follows a **defined curriculum plan** per track
- **Continuous monitoring** by supervisors
- Progress tracking per child
- Regular reports to parents (in-app)

#### Enrollment:
- Parent registers child → assigned to a track → placed in a group with a teacher
- Waiting list if groups are full

---

### Program 3: برنامج الأعاجم (Non-Arabic Speakers Program)

**Category:** Free

- **Purpose:** Quran recitation correction for non-Arabic speakers
- **How it works:** Same as Program 1 Section 1 (live sessions with available teachers)
- **Key difference:** Teachers in this program are specifically trained to work with non-Arabic speakers
- **Languages:** The app should support interface localization for common languages (Turkish, Urdu, English, French, Malay, etc.) — at minimum English + Arabic at launch
- **Drop-in, no enrollment, no cohort system**
- **No certification**
- **Separate teacher pool** from the Arabic-speakers program

---

### Program 4: برنامج القراءات (Quranic Readings/Qiraat Program)

**Category:** Structured

- **Purpose:** Teaching the various Quranic readings (روايات) and granting Ijazah
- **Structure:**
  - Students are enrolled and assigned to a specific teacher
  - Each teacher has a **maximum student capacity** (configurable)
  - Students are organized by **Riwayah (رواية)** — e.g., Hafs from Asim, Warsh from Nafi', etc.
- **Progress tracking:**
  - Track which sections the student has completed per Riwayah
  - Session logs with detailed feedback
- **Certification:**
  - Upon completing the entire reading, the teacher recommends the student
  - Program Admin reviews and issues the **إجازة (Ijazah)**
  - Ijazah includes: student name, teacher name, Riwayah, chain of narration (سند), date
  - Digital certificate generated by the app

---

### Program 5: برنامج المتون (Islamic Texts/Mutoon Program)

**Category:** Mixed

#### Section 1: قسم حر (Free Section)
- **Type:** Free / Drop-in
- Same as alternating recitation but specifically for Mutoon texts
- Students recite memorized portions of texts to available teachers
- No enrollment or tracking

#### Section 2: قسم منتظم (Structured Section)
- **Type:** Structured / Cohort-based

**Three tracks:**

| Track | Arabic Name | Content |
|---|---|---|
| Track 1 | متن تحفة الأطفال | Tuhfat al-Atfal (tajweed poem for beginners) |
| Track 2 | الجزرية | Al-Jazariyyah (comprehensive tajweed poem) |
| Track 3 | الشاطبية | Al-Shatibiyyah (poem on the seven Quranic readings) |

**Cohort system (دفعات):**
- Each cohort: **15–30 students**
- Fixed start and end dates
- Regular scheduled sessions (halaqat)
- Progress tracked per student: which sections memorized, recited, and passed
- **Continuous monitoring** by supervisor
- **Certification (إجازة)** upon completing the entire matn
- New cohorts opened on a rolling basis

---

### Program 6: برنامج اللغة العربية (Arabic Language Program)

**Category:** Structured

**Purpose:** Teaching Arabic grammar through classical Islamic texts

**Tracks:**

| Track | Arabic Name | Content | Level |
|---|---|---|---|
| Track 1 | متن الآجرومية | Al-Ajurumiyyah | Beginner |
| Track 2 | متن قطر الندى | Qatr al-Nada | Intermediate |

**Structure:**
- Cohort-based (دفعات)
- Fixed curriculum per track
- Regular scheduled sessions
- Progress tracking per student
- **Graduation (تخريج)** upon completing the track
- Certificate issued upon graduation

---

### Program 7: برنامج حفظ القرآن الكريم (Quran Memorization Program)

**Category:** Structured

**Purpose:** Comprehensive Quran memorization and review management

**Sub-programs:**

#### 7A: برنامج متين القرآني للمراجعة (Mateen Quranic Review Program)
- **Purpose:** Structured review of memorized portions
- **Variants by scope:**
  - 10 Juz' track
  - 15 Juz' track
  - 30 Juz' track (full Quran)
- Students are assigned a review schedule
- Spaced repetition principles apply (reuse SM-2 algorithm from Quran School)
- Teacher verifies review quality in sessions
- Progress tracked per Juz'/Surah

#### 7B: برنامج "ثبتها" (Thabbitha — "Solidify It")
- **Purpose:** Intensive review of specific Surahs that need strengthening
- Student or teacher identifies weak Surahs
- Focused repetition plan generated
- Short-term program (days/weeks, not months)

#### 7C: برنامج الإتقان في الحفظ (Itqan Memorization Program)
- **Purpose:** New memorization (تحفيظ) — students memorize new portions
- Structured curriculum: portion assignment per session
- Teacher listens, corrects, and logs progress
- Milestone tracking: pages, Juz', total memorized

**Common features across all sub-programs:**
- Enrollment required
- Assigned teacher with max student capacity
- Session logging with scores
- Progress dashboard for student
- Supervisor oversight

---

### Program 8: برنامج همم القرآني (Himam Quranic Marathon)

**Category:** Structured / Event-based

**Purpose:** Weekly marathon event where participants recite their entire assigned portion in one day.

**Schedule:** Every Saturday, from **Fajr (5:00 AM) Saturday → Fajr (5:00 AM) Sunday** (24 hours)

**Tracks by volume:**

| Track | Portion |
|---|---|
| Track 1 | 3 Juz' |
| Track 2 | 5 Juz' |
| Track 3 | 10 Juz' |
| Track 4 | 15 Juz' |
| Track 5 | 30 Juz' (full Quran) |

**Mechanics:**
1. Student enrolls in a track based on their memorization level
2. System **pairs two students together** (رفيقين — partners)
3. Partners agree on time slots within the 24-hour window:
   - They choose matching prayer-time blocks (e.g., "Dhuhr with Dhuhr", "Asr with Asr")
   - Each block = one recitation session
4. During their slot, Partner A recites to Partner B, then they switch
5. They use an external meeting link for the actual recitation
6. After each block, they log completion in the app
7. Goal: complete the entire track portion by 5:00 AM Sunday
8. The app tracks:
   - Which portions have been completed
   - Partner pairing
   - Time slots selected
   - Completion status per block

**Partner Matching Algorithm:**
- Automatic: system pairs students in the same track
- Manual: supervisor can adjust pairings
- Preference: pair students with compatible time-zone/availability

---

## 4. Core Platform Features

### 4.1 Teacher Availability System (Green Dot)

**Applies to:** Free programs (تسميع بالتناوب، الأعاجم، المتون الحر)

**How it works:**
1. Teacher opens app → taps "Go Available" toggle
2. Teacher's card appears in the "Available Now" list with a **green indicator**
3. List shows: teacher name, rating (stars + review count), program(s) they teach, languages, specializations, meeting link type (Google Meet, Zoom, etc.)
4. Student browses list → taps a teacher → sees the teacher's meeting link
5. Student taps "Join" → app opens the external meeting link (deep link to Google Meet, etc.)
6. Teacher can set **maximum concurrent students** (for group sessions) or mark as "1-on-1 only"
7. When teacher is done, they tap "Go Offline" → removed from available list

**Data model:**
```
teacher_availability:
  - teacher_id (FK → profiles)
  - program_id (FK → programs)
  - is_available (boolean)
  - available_since (timestamp)
  - max_students (int, default 1)
  - meeting_link (text) — stored on teacher profile, shown when available
```

**Queue system:** When no teachers are available, students join a notification queue. See Section 4.11 for full waitlist and capacity management design.

### 4.2 External Meeting Link Integration

**Approach:** The app stores and manages meeting links but never hosts video/audio.

**Per-teacher meeting link:**
- Each teacher has a persistent meeting link in their profile (Google Meet, Zoom, Jitsi, or any URL)
- When a student "joins" a teacher, the app reveals the link and opens it via deep linking
- The teacher can update their link at any time

**System-generated option (future):**
- For standardization, the platform could auto-generate Google Meet links via Google Calendar API
- This is a **Phase 2 enhancement**, not required for MVP

**Session flow:**
```
Student taps "Join Session"
  → App opens external URL (Google Meet / Zoom / etc.)
  → Student and teacher conduct session outside the app
  → After session, teacher returns to app
  → Teacher logs session outcome (scores, notes, attendance)
  → Teacher optionally records a voice memo summarizing key corrections
```

### 4.3 Post-Session Voice Memo (Teacher Corrections Recording)

**Purpose:** After a live session, the teacher records a short voice memo (1-2 minutes) summarizing the student's key mistakes and corrections. The student can replay this anytime to reinforce what they learned — extending the value of every session far beyond its live duration.

**Why this matters:** Both Moddakir and Quran Mobasher offer session recordings, and users love them. Our sessions happen on external platforms (Google Meet), so we can't record the full session. But a focused teacher voice memo is actually *more* valuable than a raw session recording — it's distilled, targeted feedback.

**UX Flow:**

#### Teacher Side (Recording):
```
Teacher finishes session
  → Opens app to log session outcome (scores, notes)
  → After submitting scores, app shows: "Record a voice memo for [student name]?"
  → Teacher taps and holds the record button (WhatsApp-style)
  → Waveform animation shows recording in progress
  → Max duration: 2 minutes (hard limit with countdown)
  → Teacher releases button → preview plays back
  → Teacher taps "Send" ✓ or "Re-record" ↻
  → Upload happens in background (doesn't block teacher)
```

#### Student Side (Playback):
- Voice memo appears in the **session detail screen** alongside scores and text notes
- Simple audio player: play/pause, seek bar, playback speed (1x, 1.25x, 1.5x)
- Badge indicator on session card: 🎤 icon if voice memo is attached
- Push notification to student: "Your teacher left you a voice memo from today's session"

#### Technical Implementation:

**Recording:**
- Use `expo-av` (already in Expo ecosystem) for audio recording
- Record in **Opus/OGG format** (best compression-to-quality ratio for speech)
- Target: ~60KB per minute at speech-quality bitrate (32kbps Opus)
- Max file size per memo: ~120KB (2 minutes)
- Record to temporary local file, then upload

**Storage:**
- Supabase Storage bucket: `voice-memos`
- File path: `voice-memos/{session_id}/{timestamp}.ogg`
- Supabase Pro plan ($25/month) includes 100GB storage — at ~120KB per memo, this supports **~800,000 recordings** before needing more storage
- **Auto-deletion policy: 30 days** — recordings older than 30 days are automatically purged via a scheduled Edge Function (cron job)
- Students see a notice: "Voice memos are available for 30 days after the session"

**Storage Cost Estimate:**
| Monthly Sessions | Storage/Month | Annual Storage (with 30-day cleanup) |
|---|---|---|
| 500 sessions | ~60 MB | ~60 MB (rolling) |
| 2,000 sessions | ~240 MB | ~240 MB (rolling) |
| 5,000 sessions | ~600 MB | ~600 MB (rolling) |
| 10,000 sessions | ~1.2 GB | ~1.2 GB (rolling) |

With 30-day auto-deletion, storage stays bounded regardless of growth. Even at 10,000 sessions/month, you stay well within Supabase Pro's 100GB limit.

**Offline Support:**
- Once a student plays a voice memo, it's cached locally on their device
- Cached memos are accessible offline
- Local cache auto-clears after 7 days to manage device storage

**Data Model:**

```sql
-- Add to sessions table (or as a separate linked table)
session_voice_memos (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  storage_path TEXT NOT NULL, -- path in Supabase Storage bucket
  duration_seconds INT NOT NULL, -- actual recording duration
  file_size_bytes INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL, -- 30 days from creation
  UNIQUE(session_id) -- one voice memo per session
);
```

**Edge Function — Cleanup Cron:**
```
-- Runs daily at 3:00 AM
-- Deletes voice memo files from storage where expires_at < now()
-- Deletes corresponding database rows
-- Logs count of deleted memos for monitoring
```

**RLS Policies:**
- Teacher: Can upload for their own sessions, can read their own recordings
- Student: Can read voice memos from their own sessions only
- Supervisor/Program Admin: Can listen to any memo within their program (quality oversight)
- Master Admin: Can access all

**Optional — Phase 2 Enhancement:**
- Student can "save" a voice memo before it expires (moves to a personal saved collection, exempt from auto-delete, counts against a per-student storage quota of 50MB)
- Teacher can re-record/replace a memo within 1 hour of upload
- Analytics: track playback rate (what % of students actually listen to memos) to measure feature value

### 4.4 Enrollment & Cohort Management

**Applies to:** Structured programs

**Enrollment flow:**
1. Student browses available programs in the app
2. Student taps "Enroll" on a program/track
3. If cohort-based: student is placed in the next available cohort (or waitlisted)
4. If teacher-assigned: student is assigned to a teacher (or waitlisted if teacher is full)
5. Program Admin approves enrollment (or auto-approve setting)
6. Student receives confirmation notification

**Cohort lifecycle:**
```
Created → Enrollment Open → Enrollment Closed → In Progress → Completed → Archived
```

**Cohort data model:**
```
cohorts:
  - id
  - program_id (FK → programs)
  - track_id (FK → program_tracks)
  - name (e.g., "الدفعة الأولى - تحفة الأطفال")
  - status (enrollment_open / enrollment_closed / in_progress / completed / archived)
  - max_students (15-30)
  - start_date
  - end_date (nullable — some programs are ongoing)
  - teacher_id (FK → profiles)
  - supervisor_id (FK → profiles)
  - meeting_link (text, nullable — can override teacher's default)
  - schedule (JSONB — recurring session times)
  - created_at
  - updated_at
```

### 4.5 Progress Tracking

**Different tracking models per program type:**

#### For Quran Memorization (Program 7):
- Reuse and adapt the **SM-2 spaced repetition system** from Quran School
- Track per Surah/Ayah range: status, ease_factor, interval, next_review_date
- Track total memorized: pages, Juz', Surahs
- Adapt `memorization_progress`, `recitations`, and `memorization_assignments` tables

#### For Mutoon Programs (Program 5 structured):
- Track per matn: which sections (أبيات/verses of the poem) are memorized
- Simpler than Quran tracking: linear progression through the text
- Status per section: not_started → in_progress → memorized → certified

#### For Qiraat (Program 4):
- Track per Riwayah: which portions have been read and approved
- Teacher signs off on sections
- Final certification when complete

#### For Arabic Language (Program 6):
- Track per lesson/chapter of the curriculum
- Assessment scores per lesson
- Completion percentage

#### For Free Programs (Programs 1, 3, 5-free):
- Minimal tracking: session count, last session date
- Optional: teacher can log brief notes

#### For Himam (Program 8):
- Track per weekly event: enrolled, portions completed, partner assigned
- Historical log of participation and completion

### 4.6 Certification System (إجازة)

**Programs that issue certifications:** Qiraat (4), Mutoon structured (5), Arabic Language (6), Quran Memorization (7)

**Certification flow:**
```
Student completes curriculum
  → Teacher recommends for certification
  → Supervisor reviews
  → Program Admin approves
  → System generates digital certificate
  → Student receives certificate in-app
  → Certificate stored in student's profile
```

**Certificate data model:**
```
certifications:
  - id
  - student_id (FK → profiles)
  - program_id (FK → programs)
  - track_id (FK → program_tracks, nullable)
  - type (ijazah / graduation / completion)
  - title (e.g., "إجازة في رواية حفص عن عاصم")
  - description
  - issued_by (FK → profiles — Program Admin)
  - teacher_id (FK → profiles — the teacher who taught)
  - chain_of_narration (text, nullable — for Qiraat Ijazah: السند)
  - issue_date
  - certificate_number (unique, auto-generated)
  - metadata (JSONB — riwayah, matn name, etc.)
  - created_at
```

**Digital certificate display:**
- Beautiful in-app certificate view
- Shareable as image/PDF
- QR code for verification (links to a public verification page)

### 4.7 Notifications

**Reuse Quran School's notification infrastructure** (Expo Push API + Edge Functions)

**Notification categories:**

| Event | Recipients |
|---|---|
| Session reminder | Student (+ parent for children's program) |
| Teacher went available | Students in that program (or first in queue) |
| Enrollment approved | Student |
| Cohort starting soon | All cohort students |
| Certification issued | Student |
| Himam event reminder (Saturday) | All Himam participants |
| Himam partner assigned | Both partners |
| Progress milestone reached | Student |
| Assignment due | Student |
| New cohort enrollment open | All students in that program |
| Rate your session | Student (post-session, 48hr window) |
| Voice memo received | Student (after teacher uploads memo) |
| Low rating alert | Supervisor (auto-flag on ≤2 stars) |
| Rating threshold breach | Program Admin (teacher drops below 3.5) |
| Queue: teacher available | First student in queue (3-min claim window) |
| Queue: students waiting | Offline teachers (when queue ≥ threshold) |
| Waitlist: spot opened | First waitlisted student (24hr to confirm) |
| Waitlist: new cohort | All waitlisted students for that track |
| Teacher impact summary | Teacher (weekly: "You helped X students") |

### 4.8 Reporting & Analytics

#### Master Admin Dashboard:
- Total students, teachers, active sessions across all programs
- Program-by-program enrollment and activity stats
- Teacher activity heatmap (sessions per day/week)
- Certification issuance rates
- Student retention/drop-off rates per program

#### Program Admin Dashboard:
- Their program's enrollment numbers and capacity
- Cohort status overview
- Teacher workload within their program
- Student progress distribution
- Certification pipeline (who's close to graduating)

#### Supervisor Dashboard:
- Their teachers' activity and session logs
- Students under their supervision — progress overview
- Flags: inactive students, teachers with low session counts

#### Teacher Dashboard:
- Their assigned students and current progress
- Upcoming scheduled sessions
- Session history log
- For free programs: their session count and availability history

#### Student Dashboard:
- Programs enrolled in
- Progress per program
- Upcoming sessions and assignments
- Certificates earned
- For Himam: next event details and partner info

### 4.9 Admin Management Features

#### Master Admin can:
- Create/edit/deactivate Program Admins
- Create/manage programs and tracks
- View all data across programs
- Configure global settings
- Generate cross-program reports
- Export data

#### Program Admin can:
- Create/edit/deactivate Supervisors and Teachers within their program
- Manage cohorts (create, open enrollment, close, archive)
- Assign students to teachers/cohorts
- Approve/reject enrollment requests
- Issue certifications
- Configure program-specific settings (max students per teacher, session duration, etc.)
- Generate program reports

#### Supervisor can:
- View/manage teachers assigned to them
- View students under their teachers
- Reassign students between their teachers
- Flag issues to Program Admin

### 4.10 Teacher Rating & Feedback System

**Why this matters:** In a volunteer organization, you can't use salary or bonuses to incentivize quality. Student feedback becomes the primary quality signal. Both Moddakir and Quran Mobasher use student ratings — and the competitor analysis confirmed that teacher quality is the #1 driver of positive reviews across the entire market.

**How it works:**

#### Post-Session Rating (Lightweight)
After every session ends (when the teacher logs the session outcome), the student receives a **push notification** prompting a quick rating:
1. **Star rating (1-5)** — mandatory, single tap
2. **Quick tags (optional)** — pre-defined selectable tags for common feedback:
   - Positive: "Patient", "Clear explanation", "Encouraging", "Excellent tajweed", "Well-prepared"
   - Constructive: "Session felt rushed", "Hard to understand", "Frequently late", "Disorganized"
3. **Written comment (optional)** — free text, max 500 characters
4. Total time to rate: **under 10 seconds** for star + tags, optional extra for comment

#### Rating Visibility Rules
- **Students see:** Teacher's average rating and total review count on teacher profile cards (in the available teachers list and teacher detail screens). Individual reviews are NOT visible to other students (prevents social pressure).
- **Teachers see:** Their own aggregate stats: average rating, rating trend (improving/declining), most common tags. Teachers do NOT see individual student names on reviews (anonymous to the teacher).
- **Supervisors see:** Per-teacher rating breakdown, individual reviews WITH student names (for investigation), flagged reviews (below 2 stars auto-flagged), rating trends over time.
- **Program Admins see:** Everything supervisors see, plus cross-teacher comparisons, program-wide rating distribution.
- **Master Admin sees:** Cross-program teacher quality overview.

#### Anti-Abuse Protections
- **One rating per session** — students cannot rate the same session twice
- **Rating window** — student has 48 hours after session to submit rating; after that, the prompt expires
- **Minimum sessions before public display** — a teacher's rating only becomes visible to students after **5 rated sessions** (prevents a single bad rating from defining a new teacher)
- **Outlier dampening** — if a teacher has 50+ ratings at 4.5 avg and receives a single 1-star, the system flags it for supervisor review rather than immediately tanking the average
- **Report abuse** — supervisors can flag and exclude reviews that are clearly abusive or retaliatory

#### Quality Thresholds & Actions
- **4.0+ stars** — Good standing, no action needed
- **3.5-3.9 stars** — Supervisor receives alert, recommends additional training or mentoring
- **3.0-3.4 stars** — Program Admin notified, teacher placed on improvement plan, student assignment paused for new students
- **Below 3.0 stars** — Program Admin reviews for possible reassignment or removal from program
- These thresholds are **configurable per program** in program settings

#### Impact on Teacher Availability Display
When students browse available teachers (green dot), the teacher card shows:
- Teacher name
- Average rating (stars) + review count (e.g., "4.7 ★ (43 reviews)")
- Programs they teach
- Languages spoken
- Specializations (e.g., "Tajweed correction", "Hifz for beginners")
- Meeting platform icon (Google Meet, Zoom, etc.)

This gives students agency to choose based on quality, not just availability — which is a pattern proven effective in both Moddakir and Quran Mobasher.

### 4.11 Waitlist & Capacity Management System

**Why this matters:** Quran Mobasher's #1 complaint is their 8-minute daily session limit — a direct result of teacher supply being unable to meet student demand. If WeReciteTogether doesn't solve this proactively, we'll face the same problem. This system manages supply/demand across both free and structured programs.

#### For Free Programs (Drop-in Sessions)

**The core problem:** At peak times, all teachers may be busy. Student opens the app, sees no available teachers, and leaves frustrated.

**Solution: Smart Queue + Notification System**

1. **When teachers ARE available:** Student joins immediately (current green dot flow, no change).

2. **When NO teachers are available:** Instead of showing an empty list, the app shows:
   - "All teachers are currently in sessions"
   - **Estimated wait time** (calculated from average session duration in that program)
   - **"Notify me"** button — student opts in to receive a push notification when a teacher becomes available
   - **Queue position** — "You are #3 in line for this program"

3. **Queue mechanics:**
   - Student taps "Notify me" → added to program-specific queue
   - When a teacher finishes a session and goes back to "available", the system:
     a. Checks the queue for that program
     b. Sends push notification to the **first student in queue**: "A teacher is now available! Tap to join."
     c. Student has **3 minutes** to tap and claim the slot
     d. If they don't respond, notification goes to the next student in queue
   - Students can leave the queue at any time
   - Queue expires after **2 hours** of inactivity (student must re-join)

4. **Fair usage policy (to prevent Quran Mobasher's 8-minute problem):**
   - **Daily session limit per student per free program:** configurable, default = 2 sessions/day
   - After reaching the limit, student can still browse and join IF no queue exists (no one is waiting)
   - But if there IS a queue, students who haven't had a session that day get priority
   - This is a **soft limit**, not a hard block — it manages fairness, not restriction
   - The limit is visible to the student: "You've had 2 sessions today. You can still join if no one is waiting."

5. **Supply-side incentives:**
   - When the queue is long (e.g., 5+ students waiting), teachers who are offline receive a notification: "Students are waiting in [program name]. Can you come online?"
   - Teacher dashboard shows "Current demand" indicator — helping volunteers know when they're most needed
   - Weekly "impact summary" notification to teachers: "This week you helped 12 students. Thank you!"

#### For Structured Programs (Cohort/Enrollment)

**The core problem:** A popular program/teacher fills up. New students can't enroll.

**Solution: Waitlist with Transparency**

1. **When cohort/teacher is full:**
   - Student sees: "This cohort is full (23/25 students)" or "This teacher has reached capacity (8/8 students)"
   - **"Join Waitlist"** button → student added to ordered waitlist
   - Student sees their position: "You are #4 on the waitlist"

2. **Waitlist resolution triggers:**
   - A student drops from the cohort → first waitlisted student gets notified
   - A new cohort opens for the same track → all waitlisted students get notified
   - A new teacher is added to the program → waitlisted students can be redistributed

3. **Notification to waitlisted student:**
   - "A spot has opened in [cohort name]! Tap to confirm your enrollment."
   - **24-hour window** to confirm (longer than free queue since this is a commitment)
   - If not confirmed, offer goes to next person

4. **Admin visibility:**
   - Program Admin dashboard shows waitlist sizes per cohort/track
   - This data directly informs decisions about opening new cohorts or recruiting more teachers
   - Alert: "Track [X] has 15+ students on waitlist — consider opening a new cohort"

#### Capacity Data Model

```
-- Queue for free programs (real-time, ephemeral)
free_program_queue (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  position INT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ, -- when teacher-available notification was sent
  status TEXT NOT NULL CHECK (status IN ('waiting', 'notified', 'claimed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL, -- auto-expire after 2 hours
  UNIQUE(student_id, program_id, status) -- one active queue entry per student per program
);

-- Daily session tracking for fair usage
daily_session_count (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_count INT NOT NULL DEFAULT 0,
  UNIQUE(student_id, program_id, date)
);

-- Waitlist for structured programs (persistent)
program_waitlist (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  track_id UUID REFERENCES program_tracks(id),
  cohort_id UUID REFERENCES cohorts(id), -- nullable (waiting for ANY cohort in track)
  teacher_id UUID REFERENCES profiles(id), -- nullable (waiting for specific teacher)
  position INT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  notified_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('waiting', 'offered', 'accepted', 'expired', 'cancelled')),
  offer_expires_at TIMESTAMPTZ, -- 24-hour window when offered
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher reviews
teacher_reviews (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id),
  student_id UUID REFERENCES profiles(id),
  session_id UUID REFERENCES sessions(id),
  program_id UUID REFERENCES programs(id),
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  tags TEXT[], -- array of selected feedback tags
  comment TEXT, -- max 500 chars, enforced at app level
  is_flagged BOOLEAN DEFAULT false, -- auto-flagged if rating <= 2
  is_excluded BOOLEAN DEFAULT false, -- supervisor excluded from aggregate
  excluded_by UUID REFERENCES profiles(id),
  exclusion_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, session_id) -- one review per session
);

-- Aggregated teacher stats (materialized for performance)
teacher_rating_stats (
  teacher_id UUID PRIMARY KEY REFERENCES profiles(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  total_reviews INT DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  rating_1_count INT DEFAULT 0,
  rating_2_count INT DEFAULT 0,
  rating_3_count INT DEFAULT 0,
  rating_4_count INT DEFAULT 0,
  rating_5_count INT DEFAULT 0,
  common_positive_tags TEXT[], -- top 3 most frequent positive tags
  common_constructive_tags TEXT[], -- top 3 most frequent constructive tags
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, program_id)
);
```

#### Platform Configuration Additions

```
-- Add to program settings JSONB:
{
  "capacity": {
    "max_students_per_teacher": 10,
    "max_daily_free_sessions": 2,
    "queue_expiry_minutes": 120,
    "waitlist_offer_hours": 24,
    "notify_teachers_queue_threshold": 5
  },
  "ratings": {
    "min_reviews_for_display": 5,
    "good_standing_threshold": 4.0,
    "warning_threshold": 3.5,
    "concern_threshold": 3.0,
    "review_window_hours": 48
  }
}
```

---

## 5. Database Schema — Key Changes from Quran School

### 5.1 Tables to REMOVE (Quran School specific):
- `schools` → replaced by single organization config
- `work_attendance` → no GPS attendance (online platform)
- `scheduled_sessions` → replaced by program-based scheduling
- `quran_rub_reference` → keep but supplemented
- `student_rub_certifications` → replaced by broader certification system

### 5.2 Tables to KEEP & MODIFY:
- `profiles` → add: `meeting_link`, `supervisor_id`, remove: `school_id` (single tenant)
- `students` → adapt: remove `class_id`, add `enrollment` junction table
- `sessions` → adapt: add `program_id`, `meeting_link_used`
- `recitations` → keep mostly as-is, add `program_id`
- `memorization_progress` → keep SM-2 fields, add `program_id`
- `memorization_assignments` → keep, add `program_id`
- `attendance` → simplify: no GPS, just session attendance
- `push_tokens` → keep as-is
- `notification_preferences` → expand categories
- `stickers` / `student_stickers` → evaluate if gamification applies (optional for Phase 1)

### 5.3 NEW Tables:

```sql
-- Core organizational tables
programs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL CHECK (category IN ('free', 'structured', 'mixed')),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  -- settings can include: max_students_per_teacher, session_duration, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

program_tracks (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  description_ar TEXT,
  curriculum JSONB, -- structured curriculum definition
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enrollment & Cohorts
cohorts (
  id UUID PRIMARY KEY,
  program_id UUID REFERENCES programs(id),
  track_id UUID REFERENCES program_tracks(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('enrollment_open', 'enrollment_closed', 'in_progress', 'completed', 'archived')),
  max_students INT DEFAULT 30,
  teacher_id UUID REFERENCES profiles(id),
  supervisor_id UUID REFERENCES profiles(id),
  meeting_link TEXT,
  schedule JSONB, -- recurring session times
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

enrollments (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  track_id UUID REFERENCES program_tracks(id),
  cohort_id UUID REFERENCES cohorts(id), -- nullable for non-cohort programs
  teacher_id UUID REFERENCES profiles(id), -- nullable for free programs
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'active', 'completed', 'dropped', 'waitlisted')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, program_id, track_id, cohort_id)
);

-- Teacher availability (for free programs)
teacher_availability (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  is_available BOOLEAN DEFAULT false,
  available_since TIMESTAMPTZ,
  max_concurrent_students INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(teacher_id, program_id)
);

-- Certifications
certifications (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  track_id UUID REFERENCES program_tracks(id),
  type TEXT NOT NULL CHECK (type IN ('ijazah', 'graduation', 'completion', 'participation')),
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT,
  issued_by UUID REFERENCES profiles(id),
  teacher_id UUID REFERENCES profiles(id),
  chain_of_narration TEXT, -- for Qiraat Ijazah
  issue_date DATE NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Role assignments (which admin/supervisor manages which program)
program_roles (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  program_id UUID REFERENCES programs(id),
  role TEXT NOT NULL CHECK (role IN ('program_admin', 'supervisor', 'teacher')),
  assigned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, program_id, role)
);

-- Himam-specific tables
himam_events (
  id UUID PRIMARY KEY,
  event_date DATE NOT NULL, -- always a Saturday
  start_time TIME DEFAULT '05:00',
  end_time TIME DEFAULT '05:00', -- next day
  status TEXT NOT NULL CHECK (status IN ('upcoming', 'active', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

himam_registrations (
  id UUID PRIMARY KEY,
  event_id UUID REFERENCES himam_events(id),
  student_id UUID REFERENCES profiles(id),
  track TEXT NOT NULL CHECK (track IN ('3_juz', '5_juz', '10_juz', '15_juz', '30_juz')),
  partner_id UUID REFERENCES profiles(id), -- paired partner
  status TEXT NOT NULL CHECK (status IN ('registered', 'paired', 'in_progress', 'completed', 'incomplete')),
  time_slots JSONB, -- selected time blocks
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, student_id)
);

himam_progress (
  id UUID PRIMARY KEY,
  registration_id UUID REFERENCES himam_registrations(id),
  juz_number INT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  notes TEXT
);

-- Mutoon-specific progress (for structured mutoon programs)
mutoon_progress (
  id UUID PRIMARY KEY,
  enrollment_id UUID REFERENCES enrollments(id),
  student_id UUID REFERENCES profiles(id),
  section_number INT NOT NULL, -- verse/line number in the matn
  section_text TEXT, -- the actual text (optional, for reference)
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'memorized', 'certified')),
  score INT, -- 0-5
  teacher_notes TEXT,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Children's program parent info
student_guardians (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES profiles(id),
  guardian_name TEXT NOT NULL,
  guardian_phone TEXT,
  guardian_email TEXT,
  relationship TEXT DEFAULT 'parent',
  receives_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform configuration (replaces multi-tenant schools table)
platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'نتلو معاً',
  name_ar TEXT NOT NULL DEFAULT 'نتلو معاً',
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  -- settings: default_meeting_platform, timezone, notification_defaults, etc.
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Session schedule templates for structured programs
session_schedules (
  id UUID PRIMARY KEY,
  cohort_id UUID REFERENCES cohorts(id),
  program_id UUID REFERENCES programs(id),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_link TEXT, -- override cohort/teacher default
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 Modified Profiles Table

```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'supervisor', 'program_admin', 'master_admin')),
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  phone TEXT,
  email TEXT,
  meeting_link TEXT, -- teacher's default meeting link
  meeting_platform TEXT CHECK (meeting_platform IN ('google_meet', 'zoom', 'jitsi', 'other')),
  bio TEXT, -- teacher bio shown to students
  languages TEXT[], -- languages the teacher/student speaks
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.5 RLS Strategy

Since this is a **single-tenant** platform (one organization, not multi-school), the RLS simplifies:

- **Remove** `get_user_school_id()` — no longer needed
- **Keep** `get_user_role()` — still needed for role-based access
- **Add** `get_user_programs()` — returns list of program_ids the user has access to
- **Program scoping:** Program Admins and Supervisors only see data within their assigned programs
- **Master Admin:** bypasses program scoping (sees everything)

---

## 6. Authentication Changes from Quran School

### 6.1 Remove Multi-Tenant Auth
- **Remove** synthetic email pattern (`{username}@{schoolSlug}.quranic.io`)
- **Use** simple email or phone-based auth
- **Or** keep username-based auth but without the school slug: `{username}@werecitetogether.app`

### 6.2 Registration Flow
- **Self-registration** for students (unlike Quran School where admin creates all users)
- Student signs up → creates account → can immediately join free programs
- For structured programs, they apply for enrollment (which may require approval)
- Teachers and admins are still created by higher-level admins

### 6.3 Role Assignment
- Default role on signup: `student`
- Master Admin promotes users to other roles
- Program Admin can assign `teacher` and `supervisor` roles within their program

---

## 7. Navigation & Screen Architecture

### 7.1 Student Navigation

**Bottom tabs (5 tabs):**
1. **الرئيسية (Home)** — Dashboard: enrolled programs, quick actions, upcoming sessions
2. **البرامج (Programs)** — Browse all programs, enroll, view details
3. **التقدم (Progress)** — Progress across all enrolled programs
4. **الشهادات (Certificates)** — Earned certifications
5. **الملف (Profile)** — Personal info, settings, language toggle

**Key screens:**
- Program detail screen (per program: schedule, progress, teacher info)
- Available teachers list (for free programs)
- Himam event screen (register, view partner, track progress)
- Session detail / feedback view

### 7.2 Teacher Navigation

**Bottom tabs (5 tabs):**
1. **الرئيسية (Home)** — Dashboard: today's sessions, quick availability toggle
2. **الطلاب (Students)** — List of assigned students across programs
3. **الجلسات (Sessions)** — Session management and logging
4. **الحلقات (Circles)** — View cohorts/groups they teach
5. **الملف (Profile)** — Personal info, meeting link, availability settings

**Key screens:**
- Session workspace (record scores, notes, attendance)
- Student detail (progress per student)
- Availability toggle for free programs

### 7.3 Supervisor Navigation

**Bottom tabs (4 tabs):**
1. **الرئيسية (Home)** — Dashboard: program overview, flags
2. **المعلمون (Teachers)** — Teachers under supervision
3. **التقارير (Reports)** — Program analytics
4. **الملف (Profile)**

### 7.4 Program Admin Navigation

**Bottom tabs (5 tabs):**
1. **الرئيسية (Home)** — Program dashboard
2. **الدفعات (Cohorts)** — Manage cohorts, enrollment
3. **الفريق (Team)** — Manage teachers and supervisors
4. **التقارير (Reports)** — Program analytics, certifications
5. **الإعدادات (Settings)** — Program configuration

### 7.5 Master Admin Navigation

**Stack navigation (no tabs)** — similar to Quran School's admin:
- Dashboard (cross-program overview)
- Programs management (CRUD)
- Users management (all roles)
- Reports (cross-program analytics)
- Platform settings
- Certification management

---

## 8. Technical Architecture Decisions

### 8.1 What to Reuse from Quran School (As-Is)

| System | Files/Modules | Notes |
|---|---|---|
| Expo + React Native setup | `app.json`, `eas.json`, `tsconfig.json` | Update bundle ID and app name |
| Feature module pattern | All `src/features/` structure | Same pattern, new features |
| Component library | `src/components/` (all) | Reuse all UI primitives |
| Design system | `src/theme/` | Update colors/branding for WeReciteTogether |
| TanStack Query setup | `src/lib/queryClient.ts` | Reuse as-is |
| Zustand stores pattern | `src/stores/` | Adapt authStore, keep pattern |
| i18n framework | `src/i18n/` | New translations, same system |
| Push notification infra | `notifications` feature + Edge Functions | Adapt trigger categories |
| Realtime subscriptions | `src/features/realtime/` | Adapt table list |
| Supabase client setup | `src/lib/supabase.ts` | Update URL/keys |
| Form system | react-hook-form + zod patterns | Reuse all patterns |
| Error handling | ErrorBoundary, ErrorState, etc. | Reuse as-is |

### 8.2 What to Build New

| Feature | Priority | Complexity |
|---|---|---|
| Program browsing & enrollment | P0 (MVP) | Medium |
| Teacher availability system (green dot) | P0 (MVP) | Medium |
| External meeting link integration | P0 (MVP) | Low |
| Cohort management | P0 (MVP) | Medium |
| 5-role permission system | P0 (MVP) | High |
| Program-scoped admin panels | P0 (MVP) | High |
| Student self-registration | P0 (MVP) | Low |
| Teacher rating & feedback system | P0 (MVP) | Medium |
| Free program queue & notification system | P0 (MVP) | Medium |
| Structured program waitlist | P0 (MVP) | Low |
| Fair usage daily session tracking | P0 (MVP) | Low |
| Post-session voice memo (teacher corrections) | P1 | Medium |
| Certification system | P1 | Medium |
| Himam event management | P1 | Medium |
| Mutoon progress tracking | P1 | Low |
| Certificate generation (PDF/image) | P2 | Medium |
| Partner matching for Himam | P1 | Medium |
| Peer-to-peer student matching (Program 1 Section 2) | P2 | Medium |

### 8.3 What to Remove from Quran School

| Feature | Reason |
|---|---|
| GPS/WiFi attendance verification | Not applicable (online platform) |
| Multi-tenant school system | Single organization |
| School creation flow | Not needed |
| Geofence configuration | Not needed |
| Physical location tracking | Not needed |
| Work attendance (teacher GPS check-in) | Not needed |
| Class-based student grouping | Replaced by program/cohort model |

### 8.4 Architecture Diagram

```
┌──────────────────────────────────────────────────────┐
│           WeReciteTogether Mobile App (Expo ~54)      │
├──────────────────────────────────────────────────────┤
│  UI Layer                                            │
│  ├─ 5 Role-based route groups (Expo Router)          │
│  │   ├─ (student)/ — 5-tab navigation               │
│  │   ├─ (teacher)/ — 5-tab navigation               │
│  │   ├─ (supervisor)/ — 4-tab navigation             │
│  │   ├─ (program-admin)/ — 5-tab navigation          │
│  │   └─ (master-admin)/ — Stack navigation           │
│  ├─ Shared component library (reused from QS)        │
│  └─ Feature modules (programs, enrollment, certs...) │
│                                                      │
│  Data Layer                                          │
│  ├─ TanStack Query (reused from QS)                  │
│  ├─ Feature services (new Supabase queries)          │
│  ├─ Zustand stores (auth, locale, theme)             │
│  └─ Realtime (teacher availability, notifications)   │
│                                                      │
│  External Integrations                               │
│  ├─ Deep linking to Google Meet / Zoom / Jitsi       │
│  ├─ expo-notifications (reused from QS)              │
│  └─ Certificate PDF generation                       │
└──────────────────────────────────────────────────────┘
                          ↕
┌──────────────────────────────────────────────────────┐
│           Supabase Cloud                             │
├──────────────────────────────────────────────────────┤
│  REST API + PostgREST                                │
│  ├─ RLS policies (role + program scoped)             │
│  ├─ Helper functions: get_user_role(),               │
│  │   get_user_programs()                             │
│  └─ RPC functions for analytics                      │
│                                                      │
│  PostgreSQL v17                                      │
│  ├─ New schema (programs, cohorts, enrollments, etc.)│
│  ├─ Adapted tables (profiles, sessions, recitations) │
│  ├─ Triggers (updated_at, notification webhooks)     │
│  └─ Realtime publication (availability, sessions)    │
│                                                      │
│  Edge Functions (Deno)                               │
│  ├─ send-notification (reused + adapted)             │
│  ├─ create-member (adapted — no school context)      │
│  ├─ generate-himam-pairings (new)                    │
│  ├─ generate-certificate (new)                       │
│  └─ session-reminders (cron)                         │
│                                                      │
│  Storage                                             │
│  ├─ Avatars                                          │
│  └─ Certificate PDFs                                 │
└──────────────────────────────────────────────────────┘
```

---

## 9. Migration Plan from Quran School Codebase

### Phase 0: Setup (Week 1)
1. Fork the Quran School repository
2. Update `app.json`: bundle ID → `com.werecitetogether.app`, app name → "نتلو معاً"
3. Update Supabase project (new project or wipe existing)
4. Update branding: colors, logo, app icon
5. Update i18n translations (new content, remove school-specific strings)
6. Remove GPS/WiFi/geofence related code and dependencies
7. Remove multi-tenant school system
8. Remove `work_attendance` feature entirely

### Phase 1: Core Platform (Weeks 2-4) — MVP
1. **Database migration**: Create new schema (programs, cohorts, enrollments, etc.)
2. **Auth refactor**: Remove synthetic email, implement self-registration
3. **Role system**: Implement 5-role system with program scoping
4. **Programs feature**: Program listing, detail, and enrollment
5. **Teacher availability**: Green dot system for free programs
6. **Meeting link integration**: Store/display/deep-link external meeting URLs
7. **Session logging**: Adapt from Quran School — add program context
8. **Basic admin panels**: Master Admin + Program Admin core functionality

### Phase 2: Program-Specific Features (Weeks 5-7)
1. **Cohort management**: Full lifecycle for structured programs
2. **Quran memorization tracking**: Adapt SM-2 system from Quran School
3. **Mutoon progress tracking**: New linear progress system
4. **Certification system**: Application, approval, generation
5. **Himam event management**: Registration, pairing, tracking
6. **Children's program**: Guardian info, parent management
7. **Supervisor role**: Full dashboard and management screens

### Phase 3: Polish & Enhancement (Weeks 8-10)
1. **Notifications**: All categories implemented
2. **Reports & analytics**: All admin-level dashboards
3. **Certificate PDF generation**: Beautiful, shareable certificates
4. **Student-to-student pairing** (Program 1 Section 2)
5. **Advanced Himam**: Partner matching algorithm
6. **Non-Arabic speakers**: Extended language support
7. **Testing, QA, and performance optimization

---

## 10. Non-Functional Requirements

### 10.1 Performance
- App launch to interactive: < 3 seconds
- Teacher availability list refresh: real-time (Supabase Realtime)
- Session logging: < 1 second submission
- Offline capability: cached data viewable offline, sync when reconnected

### 10.2 Security
- All API calls via Supabase RLS (no client-side data filtering)
- JWT tokens in secure storage (expo-secure-store)
- Role + program scoping enforced at database level
- No sensitive data in AsyncStorage

### 10.3 Scalability
- Support 1,000+ concurrent students
- Support 100+ teachers online simultaneously
- Efficient real-time teacher availability updates

### 10.4 Accessibility
- Full RTL support (Arabic primary)
- English secondary language
- Minimum tap target: 44x44 points
- High contrast text for readability

### 10.5 Platform Support
- iOS 15+ and Android 10+
- Optimized for phone screens
- Tablet layout as stretch goal

---

## 11. Open Questions & Decisions Needed

1. **Gamification:** Should we bring over the sticker/points system from Quran School, or is certification enough motivation for this audience? (Recommendation: skip for MVP, add later if needed)

2. **Student self-registration approval:** Should free program access be instant, or should all students be approved by an admin first?

3. **Meeting link standardization:** Should the platform enforce one meeting tool (e.g., Google Meet only) or allow any URL?

4. **Qiraat program — chain of narration (سند):** How is this data structured? Is it free text or should we model it as a linked chain of teachers?

5. **Children's program — age verification:** Any mechanism needed to verify the child's age or is it honor-system?

6. **Himam timezone handling:** Participants may be in different timezones. Should the 5AM-5AM window be based on a fixed timezone (e.g., Makkah time) or each student's local time?

7. **Revenue model:** Is this purely free/volunteer, or will there be any paid programs in the future? (Affects whether we need payment integration)

---

## Appendix A: Seed Data — Programs & Tracks

```json
{
  "programs": [
    {
      "name": "Alternating Recitation",
      "name_ar": "تسميع بالتناوب",
      "category": "mixed",
      "tracks": [
        { "name_ar": "حلقات مع معلمين مجازين", "type": "free" },
        { "name_ar": "تسميع بالتناوب للطلاب - قرآن", "type": "free" },
        { "name_ar": "تسميع بالتناوب للطلاب - متون", "type": "free" }
      ]
    },
    {
      "name": "Children's Program",
      "name_ar": "برنامج الأطفال",
      "category": "structured",
      "tracks": [
        { "name_ar": "التلقين", "type": "structured" },
        { "name_ar": "القاعدة النورانية", "type": "structured" },
        { "name_ar": "مسار الحفظ", "type": "structured" }
      ]
    },
    {
      "name": "Non-Arabic Speakers",
      "name_ar": "برنامج الأعاجم",
      "category": "free",
      "tracks": []
    },
    {
      "name": "Quranic Readings",
      "name_ar": "برنامج القراءات",
      "category": "structured",
      "tracks": [
        { "name_ar": "رواية حفص عن عاصم" },
        { "name_ar": "رواية ورش عن نافع" },
        { "name_ar": "رواية قالون عن نافع" }
      ]
    },
    {
      "name": "Islamic Texts (Mutoon)",
      "name_ar": "برنامج المتون",
      "category": "mixed",
      "tracks": [
        { "name_ar": "قسم حر", "type": "free" },
        { "name_ar": "متن تحفة الأطفال", "type": "structured" },
        { "name_ar": "الجزرية", "type": "structured" },
        { "name_ar": "الشاطبية", "type": "structured" }
      ]
    },
    {
      "name": "Arabic Language",
      "name_ar": "برنامج اللغة العربية",
      "category": "structured",
      "tracks": [
        { "name_ar": "متن الآجرومية" },
        { "name_ar": "متن قطر الندى" }
      ]
    },
    {
      "name": "Quran Memorization",
      "name_ar": "برنامج حفظ القرآن الكريم",
      "category": "structured",
      "tracks": [
        { "name_ar": "برنامج متين القرآني - 10 أجزاء" },
        { "name_ar": "برنامج متين القرآني - 15 جزء" },
        { "name_ar": "برنامج متين القرآني - 30 جزء" },
        { "name_ar": "برنامج ثبتها" },
        { "name_ar": "برنامج الإتقان في الحفظ" }
      ]
    },
    {
      "name": "Himam Quranic Marathon",
      "name_ar": "برنامج همم القرآني",
      "category": "structured",
      "tracks": [
        { "name_ar": "3 أجزاء" },
        { "name_ar": "5 أجزاء" },
        { "name_ar": "10 أجزاء" },
        { "name_ar": "15 جزء" },
        { "name_ar": "30 جزء" }
      ]
    }
  ]
}
```

---

## Appendix B: Quran School Systems Reuse Checklist

| Quran School System | Reuse Status | Action |
|---|---|---|
| Multi-tenant auth (synthetic email) | ❌ Replace | Simple email/username auth |
| RLS framework | ✅ Adapt | Remove school_id, add program scoping |
| Feature module pattern | ✅ Reuse | Same structure for all new features |
| TanStack Query setup | ✅ Reuse | No changes needed |
| Realtime subscriptions | ✅ Adapt | New table subscriptions |
| Push notifications | ✅ Adapt | New event categories |
| Design system tokens | ✅ Adapt | Update brand colors |
| Component library (30+ components) | ✅ Reuse | All reusable as-is |
| i18n + RTL framework | ✅ Reuse | New translation strings |
| SM-2 spaced repetition | ✅ Reuse | For Quran memorization program |
| GPS/WiFi verification | ❌ Remove | Not needed |
| Sticker/gamification system | ⏸ Defer | Evaluate for Phase 3 |
| Report/chart infrastructure | ✅ Adapt | New data sources, same patterns |
| Admin CRUD pattern | ✅ Adapt | More roles, program-scoped |
| Zustand store pattern | ✅ Reuse | Same pattern, adapted auth store |
| Custom tab bar | ✅ Adapt | New tab configurations per role |
| Session workspace | ✅ Adapt | Add program context, remove GPS |
| Memorization tracking | ✅ Adapt | Add program scoping |
| Lesson/curriculum system | ✅ Adapt | Generalize for mutoon + Arabic |

---

*End of PRD — نتلو معاً (WeReciteTogether) Platform v1.2*
