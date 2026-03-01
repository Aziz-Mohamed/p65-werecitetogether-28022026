# Implementation Plan: Program-Specific Features

**Branch**: `001-program-features` | **Date**: 2026-03-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-program-features/spec.md`

## Summary

Add program-specific features to the WeReciteTogether platform: a certification/Ijazah system with digital certificate generation, Himam Quranic Marathon event management, Mutoon linear progress tracking, Qiraat per-Juz' tracking, Arabic Language recitation tracking, Children's Program guardian management, and student-to-student peer pairing. Builds on top of the 19-table schema and 21 feature modules delivered by 001-platform-core.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Zustand 5, Supabase JS 2, react-hook-form 7 + zod 4, react-native-reanimated 4, i18next, FlashList 2, react-native-svg 15, expo-file-system ~19, react-native-view-shot (NEW), react-native-qrcode-svg (NEW)
**Storage**: Supabase PostgreSQL (remote) — 8 new tables, 1 modified table (profiles: add peer_available). Supabase Storage — 1 new bucket (certificates).
**Testing**: Jest + React Native Testing Library (unit/integration)
**Target Platform**: iOS 15+ / Android 10+ (mobile-first)
**Project Type**: Mobile (Expo managed workflow)
**Performance Goals**: Certificate image generation < 3s, progress views load < 2s, section updates < 30s teacher workflow
**Constraints**: Client-side certificate rendering (no server-side PDF), offline viewing of cached certificates, single-tenant program-scoped RLS
**Scale/Scope**: 8 new DB tables, 7 new feature modules, ~16 new screens, 3 new edge functions, 43 functional requirements

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | All new tables include `program_id` FK. Certifications, Himam events, progress tables are all program-scoped. |
| II. Role-Based Access (5 Roles) | PASS | Certification workflow uses teacher → supervisor → program_admin chain. Guardian is metadata on student profile, not a new role. |
| III. TypeScript-First, Strict Mode | PASS | All new code in TypeScript strict. Supabase-generated types will be regenerated after migration. |
| IV. Feature Colocation | PASS | New features: `src/features/certifications/`, `src/features/himam/`, `src/features/curriculum-progress/` (shared for Mutoon/Qiraat/Arabic), `src/features/guardians/`, `src/features/peer-pairing/`. |
| V. Logical CSS Only (RTL/LTR) | PASS | All new layouts use paddingStart/End, marginStart/End. Certificate image uses absolute positioning with RTL-aware flipping. |
| VI. i18n Mandatory | PASS | All new strings in en.json + ar.json. Certificate templates support bilingual rendering. |
| VII. Supabase-Native Patterns | PASS | Direct Supabase SDK in services. RLS on all new tables. Migrations via Supabase tooling. |
| VIII. Minimal Animation | PASS | Progress bars use simple fills. Certificate view uses subtle fade-in only. No heavy animations. |
| IX. External Meeting Integration | PASS | Himam partners use external meeting links. Peer pairing reveals meeting links. No streaming. |

**Gate result**: ALL PASS — proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-program-features/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── certifications.md
│   ├── himam.md
│   ├── curriculum-progress.md
│   ├── guardians.md
│   └── peer-pairing.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/features/
├── certifications/          # NEW — Certification lifecycle + certificate generation
│   ├── components/
│   │   ├── CertificateCard.tsx
│   │   ├── CertificateDetail.tsx
│   │   ├── CertificateImage.tsx      # Renderable certificate for view-shot capture
│   │   ├── CertificationRequestCard.tsx
│   │   └── CertificationWorkflow.tsx  # Teacher/supervisor/admin approval steps
│   ├── hooks/
│   │   ├── useCertifications.ts
│   │   ├── useCertificationRequests.ts
│   │   └── useCertificateImage.ts     # View-shot capture + share
│   ├── services/
│   │   └── certifications.service.ts
│   └── types/
│       └── certifications.types.ts
│
├── himam/                   # NEW — Himam marathon event management
│   ├── components/
│   │   ├── HimamEventCard.tsx
│   │   ├── HimamTrackPicker.tsx
│   │   ├── PartnerCard.tsx
│   │   ├── TimeSlotPicker.tsx
│   │   └── JuzProgressGrid.tsx
│   ├── hooks/
│   │   ├── useHimamEvents.ts
│   │   ├── useHimamRegistration.ts
│   │   └── useHimamProgress.ts
│   ├── services/
│   │   └── himam.service.ts
│   └── types/
│       └── himam.types.ts
│
├── curriculum-progress/     # NEW — Shared progress tracking for Mutoon, Qiraat, Arabic
│   ├── components/
│   │   ├── SectionProgressList.tsx    # Linear section/verse list with statuses
│   │   ├── SectionProgressBar.tsx     # Completion % bar
│   │   ├── SectionUpdateForm.tsx      # Teacher: update section status + score
│   │   └── CertificationEligibility.tsx # "Recommend" button when complete
│   ├── hooks/
│   │   ├── useCurriculumProgress.ts   # Generic: works for mutoon, qiraat, arabic
│   │   ├── useCurriculumSections.ts   # Loads pre-defined sections from track metadata
│   │   └── useCompletionPercentage.ts
│   ├── services/
│   │   └── curriculum-progress.service.ts
│   └── types/
│       └── curriculum-progress.types.ts
│
├── guardians/               # NEW — Children's program guardian management
│   ├── components/
│   │   ├── GuardianForm.tsx
│   │   └── GuardianList.tsx
│   ├── hooks/
│   │   ├── useGuardians.ts
│   │   └── useGuardianNotificationPrefs.ts
│   ├── services/
│   │   └── guardians.service.ts
│   └── types/
│       └── guardians.types.ts
│
├── peer-pairing/            # NEW — Student-to-student alternating recitation
│   ├── components/
│   │   ├── AvailablePeerList.tsx
│   │   ├── PeerPairingCard.tsx
│   │   └── PeerSessionLogger.tsx
│   ├── hooks/
│   │   ├── usePeerAvailability.ts
│   │   ├── usePeerPairing.ts
│   │   └── usePeerSessions.ts
│   ├── services/
│   │   └── peer-pairing.service.ts
│   └── types/
│       └── peer-pairing.types.ts

app/
├── (student)/
│   ├── (tabs)/
│   │   └── certificates.tsx           # REPLACE placeholder with real certificate list
│   ├── certificates/
│   │   └── [id].tsx                   # Certificate detail + share
│   ├── himam/
│   │   ├── index.tsx                  # Himam event list
│   │   └── [eventId].tsx              # Event detail + registration + progress
│   ├── peer-recitation/
│   │   └── index.tsx                  # Peer availability + pairing
│   └── program/
│       └── [enrollmentId]/
│           └── progress.tsx           # Student curriculum progress view (FR-031)
│
├── (teacher)/
│   ├── certifications/
│   │   └── index.tsx                  # Certification recommendations list
│   ├── curriculum/
│   │   └── [enrollmentId].tsx         # Section-by-section progress update
│   └── students/
│       └── [id].tsx                   # MODIFY: add "Recommend for Certification" button
│
├── (supervisor)/
│   └── certifications/
│       └── index.tsx                  # Certification review queue
│
├── (program-admin)/
│   ├── certifications/
│   │   └── index.tsx                  # Certification issuance queue
│   └── himam/
│       ├── index.tsx                  # Event management
│       └── [eventId]/
│           ├── index.tsx              # Event detail + registrations
│           └── pairings.tsx           # Partner matching
│
└── (master-admin)/
    └── certifications/
        └── index.tsx                  # Cross-program certification overview

supabase/
├── migrations/
│   └── 00004_program_features.sql     # All 8 new tables + RLS + triggers + functions
├── functions/
│   ├── verify-certificate/
│   │   └── index.ts                   # Public HTML verification page
│   ├── himam-partner-matching/
│   │   └── index.ts                   # Automatic partner pairing algorithm
│   └── himam-event-lifecycle/
│       └── index.ts                   # Scheduled: event activation, auto-incomplete, reminders
└── storage/
    └── (certificates bucket via migration)
```

**Structure Decision**: Follows the established feature colocation pattern. A shared `curriculum-progress` module handles Mutoon, Qiraat, and Arabic Language tracking since they share the same section-based progress model (differing only in granularity and scoring). Certifications are a standalone feature since the lifecycle spans all roles. Himam and peer-pairing are isolated features with distinct UX.

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design artifacts (data-model.md, contracts/, quickstart.md) finalized.*

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| I. Single-Tenant, Program-Scoped | PASS | All 8 tables verified: `certifications`, `himam_events`, `curriculum_progress`, `peer_pairings` include `program_id` FK. `himam_registrations/progress` scoped via `himam_events.program_id`. `student_guardians/guardian_notification_preferences` scoped via `profiles.id` (student-owned). |
| II. Role-Based Access (5 Roles) | PASS | RLS policies defined for all 8 tables in data-model.md. Certification workflow chain: teacher recommends → supervisor approves → program_admin issues. Guardian is metadata, not a role. |
| III. TypeScript-First, Strict Mode | PASS | All contracts define TypeScript interfaces. `ServiceResult<T>` pattern used throughout. Types: `ProgressType`, `MutoonStatus`, `QiraatStatus`, `ArabicStatus`, `SectionType`, `AddGuardianInput`, etc. |
| IV. Feature Colocation | PASS | 5 feature directories defined in plan structure. No cross-feature imports. Shared `curriculum-progress` module handles 3 program types via `progress_type` discriminator. |
| V. Logical CSS Only (RTL/LTR) | PASS | Certificate image template uses RTL-aware absolute positioning. No physical directional properties in planned components. |
| VI. i18n Mandatory | PASS | All entities have bilingual fields: `title` + `title_ar` (certifications), `section_title` (curriculum_progress). Certificate rendering supports bilingual output. |
| VII. Supabase-Native Patterns | PASS | Direct Supabase SDK in all 5 service files. RLS on all 8 tables. Edge functions use Deno runtime. `verify-certificate` is public (`verify_jwt: false`). `himam-partner-matching` uses service role. |
| VIII. Minimal Animation | PASS | Progress bars use simple fills. Certificate view uses subtle fade-in. Juz progress grid uses no animation. No heavy animations planned. |
| IX. External Meeting Integration | PASS | Himam partners use `profiles.meeting_link`. Peer pairing reveals partner's meeting link. No streaming or in-app voice/video. |

**Post-design gate result**: ALL PASS — design artifacts are constitution-compliant.

## Complexity Tracking

No constitution violations to justify.
