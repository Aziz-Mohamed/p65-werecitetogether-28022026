// Types
export type {
  MeetingPlatform,
  TeacherAvailability,
  TeacherProfileExtensions,
  AvailableTeacher,
  MyAvailability,
  ToggleAvailabilityInput,
  UpdateTeacherProfileInput,
} from './types/availability.types';

// Service
export { availabilityService } from './services/availability.service';

// Hooks
export { useAvailableTeachers } from './hooks/useAvailableTeachers';
export { useMyAvailability } from './hooks/useMyAvailability';
export { useTeacherProfile } from './hooks/useTeacherProfile';
export { useToggleAvailability } from './hooks/useToggleAvailability';
export { useJoinSession } from './hooks/useJoinSession';
export { useUpdateTeacherProfile } from './hooks/useUpdateTeacherProfile';

// Components
export { AvailabilityToggle } from './components/AvailabilityToggle';
export { AvailableTeacherCard, AvailableTeacherCardSkeleton } from './components/AvailableTeacherCard';
export { ProgramSelector } from './components/ProgramSelector';
