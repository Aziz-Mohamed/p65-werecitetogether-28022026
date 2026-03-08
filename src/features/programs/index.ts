// ─── Components ─────────────────────────────────────────────────────────────
export { CategoryBadge } from './components/CategoryBadge';
export { ProgramCard } from './components/ProgramCard';
export { ProgramDetailHeader } from './components/ProgramDetailHeader';
export { TrackList } from './components/TrackList';
export { CohortCard } from './components/CohortCard';
export { EnrollmentStatusBadge } from './components/EnrollmentStatusBadge';
export { EmptyProgramState } from './components/EmptyProgramState';

// ─── Hooks ──────────────────────────────────────────────────────────────────
export { usePrograms } from './hooks/usePrograms';
export { useProgram } from './hooks/useProgram';
export { useCohorts } from './hooks/useCohorts';
export { useEnroll, useJoinFreeProgram } from './hooks/useEnroll';
export { useEnrollments } from './hooks/useEnrollments';
export { useLeaveProgram } from './hooks/useLeaveProgram';
export { useProgramRoles, useAssignProgramRole, useRemoveProgramRole } from './hooks/useProgramRoles';
export { useAllPrograms, useUpdateProgram, useCreateProgram, useCreateTrack } from './hooks/useAdminPrograms';
export { useCreateCohort, useUpdateCohortStatus, useBulkApproveEnrollments } from './hooks/useAdminCohorts';
export { useCohortEnrollments, useUpdateEnrollmentStatus } from './hooks/useAdminEnrollments';

// ─── Services ───────────────────────────────────────────────────────────────
export { programsService } from './services/programs.service';

// ─── Utils ──────────────────────────────────────────────────────────────────
export {
  useLocalizedField,
  getEnrollmentStatusColor,
  getEnrollmentStatusVariant,
  getCategoryVariant,
  getNextCohortStatus,
  getWaitlistPosition,
  getEnrollErrorKey,
} from './utils/enrollment-helpers';

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  Program,
  ProgramTrack,
  Cohort,
  Enrollment,
  ProgramRole,
  ProgramWithTracks,
  CohortWithTeacher,
  EnrollmentWithDetails,
  ProgramRoleWithProfile,
  ProgramCategory,
  TrackType,
  EnrollmentStatus,
  CohortStatus,
  ProgramRoleType,
  ProgramSettings,
  CohortScheduleEntry,
  TrackCurriculum,
  CohortFilters,
  EnrollInput,
  CreateCohortInput,
  UpdateProgramInput,
  CreateTrackInput,
  AssignRoleInput,
} from './types/programs.types';
