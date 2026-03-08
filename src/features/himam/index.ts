// Components
export { EventCard } from './components/EventCard';
export { TrackSelector } from './components/TrackSelector';
export { JuzPicker } from './components/JuzPicker';
export { TimeSlotSelector } from './components/TimeSlotSelector';
export { PartnerCard } from './components/PartnerCard';
export { ProgressTracker } from './components/ProgressTracker';
export { TrackStatsCard } from './components/TrackStatsCard';
export { HimamDashboardCard } from './components/HimamDashboardCard';

// Hooks
export { useUpcomingEvent } from './hooks/useUpcomingEvent';
export { useMyRegistration } from './hooks/useMyRegistration';
export { useRegisterForEvent } from './hooks/useRegisterForEvent';
export { useCancelRegistration } from './hooks/useCancelRegistration';
export { useHimamProgress } from './hooks/useHimamProgress';
export { useMarkJuzComplete } from './hooks/useMarkJuzComplete';
export { useEventRegistrations } from './hooks/useEventRegistrations';
export { useRunPairing } from './hooks/useRunPairing';
export { useEventStats } from './hooks/useEventStats';
export { useHimamEvents } from './hooks/useHimamEvents';
export { useCancelEvent } from './hooks/useCancelEvent';
export { useHimamHistory } from './hooks/useHimamHistory';

// Service
export { himamService } from './services/himam.service';

// Types
export type {
  HimamTrack,
  PrayerTimeSlot,
  EventStatus,
  RegistrationStatus,
  ProgressStatus,
  HimamEvent,
  HimamRegistration,
  HimamProgress,
  ProfileSummary,
  RegistrationWithProfiles,
  RegistrationWithEvent,
  RegisterInput,
  MarkJuzCompleteInput,
  SwapPartnersInput,
  RegisterResponse,
  MarkJuzCompleteResponse,
  PairingStats,
  EventStats,
  CreateEventResponse,
} from './types/himam.types';

export {
  TRACK_JUZ_COUNT,
  ALL_TRACKS,
  ALL_PRAYER_SLOTS,
} from './types/himam.types';
