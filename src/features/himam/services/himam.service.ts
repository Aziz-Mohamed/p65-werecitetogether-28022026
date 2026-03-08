import { supabase } from '@/lib/supabase';
import type {
  RegisterInput,
  MarkJuzCompleteInput,
  SwapPartnersInput,
  RegisterResponse,
  MarkJuzCompleteResponse,
  PairingStats,
  EventStats,
  CreateEventResponse,
} from '../types/himam.types';

class HimamService {
  // ─── RPC Operations ──────────────────────────────────────────────────────

  async register(input: RegisterInput) {
    return supabase.rpc('register_for_himam_event', {
      p_event_id: input.eventId,
      p_track: input.track,
      p_selected_juz: input.selectedJuz,
      p_time_slots: input.timeSlots,
    }) as unknown as { data: RegisterResponse | null; error: Error | null };
  }

  async cancel(registrationId: string) {
    return supabase.rpc('cancel_himam_registration', {
      p_registration_id: registrationId,
    });
  }

  async markComplete(input: MarkJuzCompleteInput) {
    return supabase.rpc('mark_juz_complete', {
      p_registration_id: input.registrationId,
      p_juz_number: input.juzNumber,
    }) as unknown as { data: MarkJuzCompleteResponse | null; error: Error | null };
  }

  async runPairing(eventId: string) {
    return supabase.rpc('generate_himam_pairings', {
      p_event_id: eventId,
    }) as unknown as { data: PairingStats | null; error: Error | null };
  }

  async swapPartners(input: SwapPartnersInput) {
    return supabase.rpc('swap_himam_partners', {
      p_registration_id_a: input.registrationIdA,
      p_registration_id_b: input.registrationIdB,
    });
  }

  async cancelEvent(eventId: string) {
    return supabase.rpc('cancel_himam_event', {
      p_event_id: eventId,
    });
  }

  async createEvent(eventDate: string) {
    return supabase.rpc('create_himam_event', {
      p_event_date: eventDate,
    }) as unknown as { data: CreateEventResponse | null; error: Error | null };
  }

  async getStats(eventId: string) {
    return supabase.rpc('get_himam_event_stats', {
      p_event_id: eventId,
    }) as unknown as { data: EventStats | null; error: Error | null };
  }

  // ─── Direct Queries ────────────────────────────────────────────────────

  async getUpcomingEvent(programId: string) {
    return supabase
      .from('himam_events')
      .select('*')
      .eq('program_id', programId)
      .eq('status', 'upcoming')
      .order('event_date', { ascending: true })
      .limit(1)
      .maybeSingle();
  }

  async getEvents(programId: string) {
    return supabase
      .from('himam_events')
      .select('*')
      .eq('program_id', programId)
      .order('event_date', { ascending: false });
  }

  async getMyRegistration(eventId: string, studentId: string) {
    return supabase
      .from('himam_registrations')
      .select(`
        *,
        student:profiles!himam_registrations_student_id_fkey ( id, full_name, avatar_url, meeting_link ),
        partner:profiles!himam_registrations_partner_id_fkey ( id, full_name, avatar_url, meeting_link )
      `)
      .eq('event_id', eventId)
      .or(`student_id.eq.${studentId},partner_id.eq.${studentId}`)
      .limit(1)
      .maybeSingle();
  }

  async getProgress(registrationId: string) {
    return supabase
      .from('himam_progress')
      .select('*')
      .eq('registration_id', registrationId)
      .order('juz_number', { ascending: true });
  }

  async getHistory(studentId: string) {
    return supabase
      .from('himam_registrations')
      .select(`
        *,
        event:himam_events!himam_registrations_event_id_fkey ( id, event_date, status ),
        partner:profiles!himam_registrations_partner_id_fkey ( id, full_name )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
  }

  async getEventRegistrations(eventId: string) {
    return supabase
      .from('himam_registrations')
      .select(`
        *,
        student:profiles!himam_registrations_student_id_fkey ( id, full_name, avatar_url ),
        partner:profiles!himam_registrations_partner_id_fkey ( id, full_name )
      `)
      .eq('event_id', eventId)
      .order('track')
      .order('created_at');
  }
}

export const himamService = new HimamService();
