# API Contract: Curriculum Progress (Mutoon / Qiraat / Arabic)

**Service file**: `src/features/curriculum-progress/services/curriculum-progress.service.ts`
**Pattern**: Supabase SDK direct queries, ServiceResult<T> return type

## Queries

### getProgressByEnrollment(enrollmentId: string)
- **Table**: `curriculum_progress`
- **Filter**: `enrollment_id = enrollmentId`
- **Order**: `section_number ASC`
- **Used by**: Student progress view, teacher session workspace

### getProgressSummary(enrollmentId: string)
- **Table**: `curriculum_progress`
- **Aggregation**: Count total sections, count completed (memorized/certified/passed), calculate percentage
- **Used by**: Student progress bar, certification eligibility check

### getCurriculumSections(trackId: string)
- **Table**: `program_tracks`
- **Filter**: `id = trackId`
- **Select**: `curriculum` (JSONB field containing pre-defined section list)
- **Returns**: Array of `{ section_number, title, title_ar }`
- **Used by**: Initializing progress rows, teacher section picker

### checkCertificationEligibility(enrollmentId: string)
- **RPC**: `get_certification_eligibility(enrollmentId)`
- **Returns**: `{ eligible: boolean, total_sections: number, completed_sections: number, progress_type: string }`
- **Used by**: Teacher student detail → show/hide "Recommend" button

## Mutations

### initializeProgress(enrollmentId: string, trackId: string, progressType: string)
- **Table**: `curriculum_progress`
- **Operation**: INSERT (bulk — one row per section from curriculum metadata)
- **Fields**: `enrollment_id, student_id (from enrollment), program_id (from enrollment), progress_type, section_number, section_title, status: 'not_started'`
- **Trigger**: Called when a student enrolls in a structured Mutoon/Qiraat/Arabic track
- **Used by**: Enrollment flow

### updateSectionProgress(progressId: string, input: UpdateSectionInput)
- **Table**: `curriculum_progress`
- **Operation**: UPDATE
- **Fields**: `status, score, teacher_notes, reviewed_by, last_reviewed_at = now()`
- **Validation**:
  - Mutoon: score must be 0-5, status in (not_started, in_progress, memorized, certified)
  - Qiraat: status in (not_started, passed, failed), score is NULL
  - Arabic: score must be 0-100, status in (not_started, in_progress, passed, failed)
- **Used by**: Teacher curriculum workspace

### batchUpdateSections(updates: { progressId: string, status: string, score?: number }[])
- **Table**: `curriculum_progress`
- **Operation**: UPDATE (batch — multiple sections in one session)
- **Used by**: Teacher session workspace when reviewing multiple sections at once

## Types

```typescript
type ProgressType = 'mutoon' | 'qiraat' | 'arabic';

type MutoonStatus = 'not_started' | 'in_progress' | 'memorized' | 'certified';
type QiraatStatus = 'not_started' | 'passed' | 'failed';
type ArabicStatus = 'not_started' | 'in_progress' | 'passed' | 'failed';

interface CurriculumSection {
  section_number: number;
  title: string;
  title_ar: string;
}

interface UpdateSectionInput {
  status: string;
  score?: number;
  teacher_notes?: string;
}
```
