// ─── Enums & Literals ────────────────────────────────────────────────────────

export type HimamTrack = '3_juz' | '5_juz' | '10_juz' | '15_juz' | '30_juz';

export type PrayerTimeSlot = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'night';

export type EventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export type RegistrationStatus =
  | 'registered'
  | 'paired'
  | 'in_progress'
  | 'completed'
  | 'incomplete'
  | 'cancelled';

export type ProgressStatus = 'pending' | 'completed';

// ─── Track Config ───────────────────────────────────────────────────────────

export const TRACK_JUZ_COUNT: Record<HimamTrack, number> = {
  '3_juz': 3,
  '5_juz': 5,
  '10_juz': 10,
  '15_juz': 15,
  '30_juz': 30,
};

export const ALL_TRACKS: HimamTrack[] = ['3_juz', '5_juz', '10_juz', '15_juz', '30_juz'];

export const ALL_PRAYER_SLOTS: PrayerTimeSlot[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
  'night',
];

// ─── Domain Entities ─────────────────────────────────────────────────────────

export interface HimamEvent {
  id: string;
  program_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  registration_deadline: string;
  status: EventStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HimamRegistration {
  id: string;
  event_id: string;
  student_id: string;
  track: HimamTrack;
  selected_juz: number[];
  partner_id: string | null;
  time_slots: PrayerTimeSlot[];
  status: RegistrationStatus;
  created_at: string;
  updated_at: string;
}

export interface HimamProgress {
  id: string;
  registration_id: string;
  juz_number: number;
  status: ProgressStatus;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
  created_at: string;
}

// ─── Composite / Joined Types ────────────────────────────────────────────────

export interface ProfileSummary {
  id: string;
  full_name: string;
  avatar_url: string | null;
  meeting_link: string | null;
}

export interface RegistrationWithProfiles extends HimamRegistration {
  student: ProfileSummary | null;
  partner: ProfileSummary | null;
}

export interface RegistrationWithEvent extends HimamRegistration {
  event_date: string;
  event_status: EventStatus;
  partner: { id: string; full_name: string } | null;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

export interface RegisterInput {
  eventId: string;
  track: HimamTrack;
  selectedJuz: number[];
  timeSlots: PrayerTimeSlot[];
}

export interface MarkJuzCompleteInput {
  registrationId: string;
  juzNumber: number;
}

export interface SwapPartnersInput {
  registrationIdA: string;
  registrationIdB: string;
}

// ─── Response Types ─────────────────────────────────────────────────────────

export interface RegisterResponse {
  registration_id: string;
  event_date: string;
  track: HimamTrack;
  selected_juz: number[];
  time_slots: PrayerTimeSlot[];
  status: RegistrationStatus;
}

export interface MarkJuzCompleteResponse {
  completed_count: number;
  total_count: number;
  all_complete: boolean;
  registration_status: RegistrationStatus;
}

export interface PairingStats {
  pairs_created: number;
  unpaired_students: number;
  tracks: Record<string, { pairs: number; unpaired: number }>;
}

export interface EventStats {
  event_date: string;
  total_registrations: number;
  total_paired: number;
  completed: number;
  incomplete: number;
  cancelled: number;
  tracks: Record<string, { registered: number; completed: number; incomplete: number }>;
}

export interface CreateEventResponse {
  event_id: string;
  event_date: string;
  registration_deadline: string;
  status: EventStatus;
}
