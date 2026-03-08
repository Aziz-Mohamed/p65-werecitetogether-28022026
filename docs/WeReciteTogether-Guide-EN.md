# WeReciteTogether — Complete Guide

---

# PART ONE: Understanding the App

---

## What Is WeReciteTogether?

WeReciteTogether is the app we built to replace our Telegram channels and manual tracking. Instead of scattered messages, spreadsheets, and voice notes — everything now lives in one place: sessions, progress, attendance, evaluations, and reports.

When you log in, the app recognizes your role and shows you exactly the screens and tools you need.

---

## The Five Roles

Our system has five roles. Each role sees a different dashboard and has different capabilities:

```
        المدير العام (Master Admin)
               │
               │ oversees everything
               ▼
        مدير البرنامج (Program Admin)
               │
               │ manages a program
               ▼
           المشرف (Supervisor)
               │
               │ oversees assigned teachers
               ▼
           المعلّم (Teacher)
               │
               │ teaches and evaluates
               ▼
           الطالب (Student)
```

Each level sees everything below it, but not above. A supervisor sees their teachers and those teachers' students — but not other supervisors' teams.

---

## How We Organize Things

```
Program (البرنامج)
  └── Track (المسار) — a learning pathway within the program
        └── Class (الحلقة) — a group of students with a teacher
              └── Student Enrollment (تسجيل)
```

**Program types:**
- **Free**: Open enrollment, join instantly
- **Structured**: Formal tracks with capacity limits, may need approval
- **Mixed**: Has both free and structured sections

---

## Key Concepts

### Sessions
A teaching encounter where the teacher evaluates the student on three scores (1–5 each):
- **Memorization (الحفظ)** — accuracy of recall
- **Tajweed (التجويد)** — recitation rules
- **Recitation (القراءة)** — fluency and delivery

### Memorization Tracking
The Quran is divided into 240 Rub' (quarters). Students build memorization block by block. Each Rub' goes through: **In Progress → Ready for Certification → Certified**.

### Revision System
Certified Rub' are tracked for freshness using spaced repetition:
- **Fresh** — recently reviewed, well-retained
- **Fading** — weakening, review soon
- **At Risk** — needs attention
- **Urgent** — overdue, prioritize now
- **Dormant** (90+ days) — requires full re-certification

Students get daily **Revision Homework** to keep their memorization alive.

### Certification (Ijazah)
When a student masters a portion: Teacher recommends → Supervisor approves → Certificate issued.

### Gamification
- **Stickers** — teachers award them (Bronze, Silver, Gold, Diamond)
- **Badges** — earned automatically at milestones
- **Streaks** — consecutive days of activity
- **Leaderboard** — rankings by level and streak

---

## Getting Started

1. Open the app and sign in with **Google** or **Apple**
2. First time? Complete your profile (name, language, optional bio)
3. The app takes you to your role's dashboard automatically
4. Enable notifications when prompted to stay updated

---

---

# PART TWO: Role-by-Role Manual

---

## Chapter 1: Student (طالب)

### Your Tabs

| Tab | What It Does |
|-----|-------------|
| **Dashboard** | Upcoming sessions, streak, quick stats, homework |
| **Programs** | Browse and join programs |
| **Memorization** | Track your Rub' progress |
| **Revision** | Manage revision health and homework |
| **Journey** | Quran map, sticker collection, share progress |
| **Profile** | Settings and preferences |

### Key Actions

**Enroll in a program:**
1. Programs tab → browse → tap a program
2. Free program: tap "Join"
3. Structured program: select track → select class → tap "Enroll"
4. If full, join the waitlist

**Track memorization:**
- Your teacher assigns new Hifz → it appears as homework on your Dashboard
- Study → recite to your teacher → teacher certifies the Rub' → it enters your revision cycle

**Manage revision:**
- Check Revision tab daily for homework
- After reciting to your teacher, tap "Mark as Recited"
- If a Rub' is dormant 90+ days, it needs re-certification

**View session history:**
- Dashboard → "View Sessions" → see scores, notes, and details for each past session

**Available teachers:**
- "Available Now" from Dashboard shows teachers currently online with meeting links

**HIMAM events:**
- When announced, choose your track (3–30 Juz'), select Juz' numbers, pick prayer time slots, register

---

## Chapter 2: Teacher (معلّم)

### Your Tabs

| Tab | What It Does |
|-----|-------------|
| **Dashboard** | Sessions today, students seen, availability, ratings |
| **Students** | Your assigned students |
| **Sessions** | Upcoming and past sessions |
| **Class Progress** | Performance analytics |
| **Profile** | Availability, meeting link settings |

### Key Actions

**Log a session:**
1. Dashboard → "Log Session" (or Sessions tab)
2. Select student → set date
3. Rate: Memorization, Tajweed, Recitation (1–5 each)
4. Add notes → optionally attach a voice memo → Save

**Run a scheduled session:**
1. Sessions → Upcoming → tap the session → "Start Session"
2. Mark attendance (Present/Absent/Late/Excused)
3. Evaluate each student → Complete session

**Award a sticker:**
1. "Award Sticker" from Dashboard or student profile
2. Pick student → pick sticker → optional reason → Confirm

**Certify a Rub':**
1. Student's memorization screen → find Rub' marked "Ready"
2. Tap "Certify" → Confirm

**Review a certified Rub':**
- Mark "Good" → freshness resets to 100%
- Mark "Poor" → freshness resets to 50%
- Dormant 90+ days → needs re-certification

**Manage availability:**
1. Profile → Availability → toggle on/off per program
2. Set your meeting link (Google Meet, Zoom, etc.) in Profile

**Assign homework:**
1. Student profile → "Assign New Hifz"
2. Choose Surah, Ayah range, type, due date → Create

**Check in (if enabled):**
- Dashboard → "Check In" → verified via GPS/WiFi
- Outside expected area? "Request Override" with reason
- End of session → "Check Out"

---

## Chapter 3: Supervisor (مشرف)

### Your Tabs

| Tab | What It Does |
|-----|-------------|
| **Home** | Stats, alerts, quick actions |
| **Teachers** | Your assigned teachers |
| **Reports** | Teacher performance analytics |
| **Profile** | Your profile and programs |

### Key Actions

**Monitor your team:**
- Home shows: teacher count, student count, sessions this week
- Inactive alert warns about teachers who haven't taught this week

**Review a teacher:**
1. Teachers tab → tap a teacher
2. See: session history, student list, performance metrics
3. Tap any student to see their individual progress

**Flag an issue:**
1. Teacher detail → "Flag Issue"
2. Describe the concern (up to 500 chars)
3. "Send Flag to Program Admins"

**Reassign a student:**
1. Teacher detail → Students → select student → "Reassign"
2. Choose new teacher → Confirm

**Handle certifications:**
- Home → "Certification Queue" → review pending requests → Approve or request more evaluation

**Rewards dashboard:**
- View sticker distribution stats, top awarding teachers, badge distribution

**Reports available:**
- Sessions per teacher, student distribution, average rating per teacher, inactive alerts

---

## Chapter 4: Program Admin (مدير البرنامج)

### Your Tabs

| Tab | What It Does |
|-----|-------------|
| **Home** | Program stats and alerts |
| **Classes** | Manage classes/Halaqat |
| **Team** | Manage teachers, supervisors, admins |
| **Reports** | Workload and progress analytics |
| **Settings** | Program configuration |
| **Profile** | Your profile |

*If you manage multiple programs, you'll pick which one to manage first. Switch anytime with "Switch Program".*

### Key Actions

**Create a class:**
1. Classes tab → "Create Class"
2. Enter name, max students, assign teacher, pick track → Create

**Manage enrollment:**
- Pending requests appear as alerts on Home
- Tap to review → Approve or Reject each request
- "Approve All" for bulk approval
- Waitlist: "Promote Next" offers the spot (student has 48 hours to accept)

**Manage your team:**
1. Team tab → "Add Team Member"
2. Search user → assign role (Teacher, Supervisor, or Program Admin)
3. Link supervisors to teachers: find teacher → "Link Supervisor" → select supervisor
4. Remove: select member → "Remove" (warning shown if teacher has active students)

**Configure settings:**

| Setting | What It Controls |
|---------|-----------------|
| Max Students Per Teacher | Teacher capacity limit |
| Daily Free Session Limit | Max free sessions per day |
| Queue Notification Threshold | When to alert about queue length |
| Rating Thresholds | Define Good Standing / Warning / Concern levels |

**Reports available:**
- Teacher workload distribution, student progress, session frequency trends

---

## Chapter 5: Master Admin (المدير العام)

### Your Sections

No tabs — full-page navigation to all areas: Dashboard, Users, Programs, Classes, Teachers, Students, Stickers, Attendance, Reports, Settings, Certifications.

### Key Actions

**Dashboard overview:**
- Total students, teachers, active sessions, programs count
- Quick actions: Add Class, Create Program, Manage Users

**Manage users:**
1. Users → search by name/email → tap user
2. Change global role: "Change Role" → select → Confirm
3. Assign program role: "Assign Program Role" → pick program and role
4. Promote to Master Admin: "Promote to Master Admin" → Confirm
   - *Cannot remove the last Master Admin*

**Create a program:**
1. Programs → "Create Program"
2. Name (EN + AR), description, category (Free/Structured/Mixed)
3. Settings: auto-approve, max students/teacher, session duration
4. Add tracks if needed

**Manage sticker catalog:**
1. Stickers → "Create Sticker"
2. Pick icon (6 categories: Worship, Celestial, Architecture, Nature, Achievement, Calligraphy)
3. Set name (EN + AR), tier → Save

**Teacher attendance:**
1. Attendance → see today's check-ins
2. Pending overrides: review reason → Approve or Reject

**Configure verification:**
1. Settings → Verification Settings
2. Set GPS coordinates + geofence radius (50–2000m)
3. Set WiFi network name
4. Method: GPS Only / WiFi Only / Both / Either

**Platform settings:**
- Platform name (EN + AR), default meeting platform, quiet hours, teacher permissions

**Create users:**
- Students: name, username, password (6+ chars), optional class
- Teachers: name, username, password → then assign to programs/classes

**Reset passwords:**
- Settings → "Reset Password" → select user → enter new password

**Reports available:**
- Enrollment trends, session volume by program, teacher activity, teacher attendance, memorization progress, session completion rates

---

## Quick Reference: Who Does What

| Action | Student | Teacher | Supervisor | Program Admin | Master Admin |
|--------|:-------:|:-------:|:----------:|:-------------:|:------------:|
| Enroll in programs | Yes | | | | |
| Attend sessions | Yes | | | | |
| Earn stickers & badges | Yes | | | | |
| Log & evaluate sessions | | Yes | | | |
| Award stickers | | Yes | | | |
| Certify memorization | | Yes | | | |
| Assign homework | | Yes | | | |
| Set availability | | Yes | | | |
| Monitor teachers | | | Yes | Yes | Yes |
| Flag issues | | | Yes | | |
| Approve certifications | | | Yes | Yes | Yes |
| Reassign students | | | Yes | Yes | Yes |
| Manage classes | | | | Yes | Yes |
| Manage team | | | | Yes | Yes |
| Approve enrollments | | | | Yes | Yes |
| Create programs | | | | | Yes |
| Manage all users | | | | | Yes |
| Platform settings | | | | | Yes |
| Manage sticker catalog | | | | | Yes |

---

*WeReciteTogether — everything that was in Telegram, now in one app.*
