// ─── Components ─────────────────────────────────────────────────────────────
export { CategoryBadge } from './components/CategoryBadge';
export { ProgramCard } from './components/ProgramCard';
export { ProgramDetailHeader } from './components/ProgramDetailHeader';
export { TrackList } from './components/TrackList';
export { ProgramClassCard } from './components/ProgramClassCard';
export { EnrollmentStatusBadge } from './components/EnrollmentStatusBadge';
export { EmptyProgramState } from './components/EmptyProgramState';

// ─── Hooks ──────────────────────────────────────────────────────────────────
export { usePrograms } from './hooks/usePrograms';
export { useProgram } from './hooks/useProgram';
export { useProgramClasses } from './hooks/useClasses';
export { useEnroll, useJoinFreeProgram } from './hooks/useEnroll';
export { useEnrollments } from './hooks/useEnrollments';
export { useLeaveProgram } from './hooks/useLeaveProgram';
export { useProgramRoles, useAssignProgramRole, useRemoveProgramRole } from './hooks/useProgramRoles';
export { useAllPrograms, useUpdateProgram, useCreateProgram, useCreateTrack } from './hooks/useAdminPrograms';
export { useCreateProgramClass, useUpdateClassStatus, useBulkApproveEnrollments } from './hooks/useAdminClasses';
export { useClassEnrollments, useUpdateEnrollmentStatus } from './hooks/useAdminEnrollments';
export { useClassWaitlist, useMyWaitlistEntry, useCancelWaitlist, usePromoteFromWaitlist } from './hooks/useWaitlist';

// ─── Services ───────────────────────────────────────────────────────────────
export { programsService } from './services/programs.service';

// ─── Utils ──────────────────────────────────────────────────────────────────
export {
  useLocalizedField,
  getEnrollmentStatusColor,
  getEnrollmentStatusVariant,
  getCategoryVariant,
  getNextClassStatus,
  getWaitlistPosition,
  getEnrollErrorKey,
} from './utils/enrollment-helpers';

// ─── Types ──────────────────────────────────────────────────────────────────
export type {
  Program,
  ProgramTrack,
  Enrollment,
  ProgramRole,
  ProgramWithTracks,
  ProgramClassWithTeacher,
  EnrollmentWithDetails,
  ProgramRoleWithProfile,
  ProgramCategory,
  TrackType,
  EnrollmentStatus,
  ClassStatus,
  ProgramRoleType,
  ProgramSettings,
  ClassScheduleEntry,
  TrackCurriculum,
  ProgramClassFilters,
  EnrollInput,
  CreateProgramClassInput,
  UpdateProgramInput,
  CreateTrackInput,
  AssignRoleInput,
  WaitlistStatus,
  WaitlistEntry,
  WaitlistEntryWithStudent,
} from './types/programs.types';
