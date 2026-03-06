# Implementation Plan: Certification System (Ijazah)

**Branch**: `008-certifications` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-certifications/spec.md`

## Summary

Build a multi-step certification workflow (teacher recommend → supervisor review → program admin issue) with digital certificate generation, QR code verification, and sharing capabilities. The feature adds a new `certifications` table, RPC functions for workflow transitions and pipeline stats, a public verification edge function, and screens across teacher, supervisor, program admin, master admin, and student route groups.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native 0.83, Expo ~54, Expo Router v6, TanStack Query 5, Supabase JS 2, react-hook-form 7 + zod 4, i18next + react-i18next, FlashList 2, Ionicons, @gorhom/bottom-sheet 5, react-native-qrcode-svg (NEW), react-native-view-shot (NEW), expo-sharing (NEW)
**Storage**: Supabase PostgreSQL (remote) — 1 new table (certifications), 1 new Edge Function (verify-certificate), ~6 new RPC functions, send-notification extension
**Testing**: Manual testing via quickstart scenarios
**Target Platform**: iOS + Android (mobile-first), Expo managed workflow
**Project Type**: Mobile (React Native / Expo)
**Performance Goals**: Certificate verification < 3s, recommendation submission < 2 min user flow
**Constraints**: Client-side certificate image capture (no server-side PDF), public verification endpoint (no auth), bilingual AR/EN
**Scale/Scope**: ~17 screens, 1 migration, 1 edge function, ~10 hooks, ~15 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Single-Tenant, Program-Scoped | PASS | `certifications` table includes `program_id` FK. RLS enforces program scoping. |
| II. Role-Based Access (7 Roles) | PASS | Teacher recommends, supervisor reviews, program admin issues, master admin oversees, student views. All role-gated. |
| III. TypeScript-First, Strict Mode | PASS | All code in strict TypeScript. Supabase-generated types used. |
| IV. Feature Colocation | PASS | All cert code in `src/features/certifications/` with hooks, services, types, components. |
| V. Logical CSS Only (RTL/LTR) | PASS | All styles use logical properties. Certificate card layout RTL-safe. |
| VI. i18n Mandatory | PASS | All strings via i18n. Certificate display bilingual AR/EN. |
| VII. Supabase-Native Patterns | PASS | Supabase Auth, RLS on certifications table, Edge Function for verification, migrations via tooling. |
| VIII. Minimal Animation | PASS | No heavy animations. Simple status transitions and loading states only. |
| IX. External Meeting Integration | N/A | Feature does not involve meetings. |

## Project Structure

### Documentation (this feature)

```text
specs/008-certifications/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── rpc-functions.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
# Feature module
src/features/certifications/
├── components/
│   ├── CertificationCard.tsx        # List item for cert review queues
│   ├── CertificateView.tsx          # Beautiful certificate display card
│   ├── CertificatePipeline.tsx      # Pipeline status counts bar
│   ├── RecommendationForm.tsx       # Teacher recommendation form
│   ├── ReviewActions.tsx            # Approve/Return/Reject action buttons
│   ├── StatusBadge.tsx              # Certification status badge
│   └── QRCodeDisplay.tsx            # QR code with verification URL
├── hooks/
│   ├── useRecommendCertification.ts    # Mutation: teacher submits recommendation
│   ├── useReviewCertification.ts       # Mutation: supervisor approve/return
│   ├── useIssueCertification.ts        # Mutation: program admin issue/reject
│   ├── useRevokeCertification.ts       # Mutation: revoke certificate
│   ├── useResubmitCertification.ts     # Mutation: teacher re-submits returned cert
│   ├── useCertificationQueue.ts        # Query: review queue (supervisor or program admin)
│   ├── useCertificationPipeline.ts     # Query: pipeline counts for program admin
│   ├── useStudentCertificates.ts       # Query: student's issued certificates
│   ├── useAllCertifications.ts         # Query: master admin list with filters
│   └── useCertificationDetail.ts       # Query: single cert full detail
├── services/
│   └── certifications.service.ts       # Supabase SDK calls
├── types/
│   └── certifications.types.ts         # TypeScript interfaces
└── index.ts                            # Barrel exports

# Route screens
app/(teacher)/students/[id]/recommend.tsx          # Teacher recommendation form screen
app/(teacher)/certifications/index.tsx              # Teacher's own recommendations list
app/(teacher)/certifications/[id].tsx               # Teacher recommendation detail + resubmit
app/(supervisor)/certifications/index.tsx           # Supervisor review queue
app/(supervisor)/certifications/[id].tsx            # Supervisor review detail
app/(program-admin)/certifications/index.tsx        # Program admin approval queue + pipeline
app/(program-admin)/certifications/[id].tsx         # Program admin review/issue detail
app/(master-admin)/certifications/index.tsx         # Master admin oversight list
app/(master-admin)/certifications/[id].tsx          # Master admin detail + revoke
app/(student)/certificates/index.tsx                # Student's earned certificates list
app/(student)/certificates/[id].tsx                 # Student certificate detail + share + QR

# Database
supabase/migrations/00010_certifications.sql        # Table, RPC functions, RLS, triggers

# Edge Function
supabase/functions/verify-certificate/index.ts      # Public verification endpoint

# i18n
src/i18n/locales/en.json                           # English translations (extend)
src/i18n/locales/ar.json                           # Arabic translations (extend)
```

**Structure Decision**: Mobile app with feature colocation pattern. New feature module `src/features/certifications/` following existing patterns from `src/features/programs/` and `src/features/admin/`. Screens distributed across 5 existing route groups. One migration file, one new edge function.

## New Dependencies

| Package | Purpose | Justification |
|---------|---------|---------------|
| `react-native-qrcode-svg` | Generate QR codes on certificate cards | Lightweight, SVG-based, works with existing `react-native-svg` |
| `react-native-view-shot` | Capture certificate view as image for sharing | Standard approach for view-to-image in RN |
| `expo-sharing` | Share captured certificate image via native share sheet | Expo ecosystem, managed workflow compatible |
