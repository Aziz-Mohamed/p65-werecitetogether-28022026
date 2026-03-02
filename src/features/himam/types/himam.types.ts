import type { Json, Tables } from '@/types/database.types';

// ─── Status Enums ───────────────────────────────────────────────────────────

export type HimamEventStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export type HimamRegistrationStatus =
  | 'registered'
  | 'paired'
  | 'in_progress'
  | 'completed'
  | 'incomplete'
  | 'cancelled';

export type HimamProgressStatus = 'pending' | 'completed' | 'partner_absent';

export type HimamTrack = '3_juz' | '5_juz' | '10_juz' | '15_juz' | '30_juz';

// ─── Database Row Aliases ───────────────────────────────────────────────────

export type HimamEvent = Tables<'himam_events'>;
export type HimamRegistration = Tables<'himam_registrations'>;
export type HimamProgress = Tables<'himam_progress'>;

// ─── Joined Types ───────────────────────────────────────────────────────────

export interface HimamRegistrationWithPartner extends HimamRegistration {
  partner: Pick<
    Tables<'profiles'>,
    'full_name' | 'display_name' | 'avatar_url' | 'meeting_link'
  > | null;
}

export interface HimamRegistrationWithStudent extends HimamRegistration {
  student: Pick<Tables<'profiles'>, 'full_name' | 'display_name'>;
  partner: Pick<Tables<'profiles'>, 'full_name' | 'display_name'> | null;
}

// ─── Inputs ─────────────────────────────────────────────────────────────────

export interface CreateEventInput {
  program_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
}

export interface TimeSlot {
  block: 'fajr_dhuhr' | 'dhuhr_asr' | 'asr_maghrib' | 'maghrib_isha' | 'isha_fajr';
  start_time: string;
  end_time: string;
}

// ─── Edge Function Responses ────────────────────────────────────────────────

export interface PartnerMatchingResult {
  paired: number;
  unmatched: number;
}

export interface EventLifecycleResult {
  activated: number;
  completed: number;
  reminders_sent: number;
}
