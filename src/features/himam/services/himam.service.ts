import { supabase } from '@/lib/supabase';
import type { Json } from '@/types/database.types';
import type { CreateEventInput, TimeSlot } from '../types/himam.types';

class HimamService {
  /**
   * Get upcoming/active events for a program.
   */
  async getUpcomingEvents(programId: string) {
    return supabase
      .from('himam_events')
      .select('*')
      .eq('program_id', programId)
      .in('status', ['upcoming', 'active'])
      .order('event_date', { ascending: true });
  }

  /**
   * Get a single event by ID.
   */
  async getEventById(eventId: string) {
    return supabase
      .from('himam_events')
      .select('*')
      .eq('id', eventId)
      .single();
  }

  /**
   * Get a student's registration for a specific event.
   */
  async getRegistration(eventId: string, studentId: string) {
    return supabase
      .from('himam_registrations')
      .select(
        '*, partner:profiles!himam_registrations_partner_id_fkey(full_name, display_name, avatar_url, meeting_link)',
      )
      .eq('event_id', eventId)
      .eq('student_id', studentId)
      .maybeSingle();
  }

  /**
   * Get all registrations for an event, optionally filtered by track.
   */
  async getEventRegistrations(eventId: string, track?: string) {
    let query = supabase
      .from('himam_registrations')
      .select(
        '*, student:profiles!himam_registrations_student_id_fkey(full_name, display_name), partner:profiles!himam_registrations_partner_id_fkey(full_name, display_name)',
      )
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (track) {
      query = query.eq('track', track);
    }

    return query;
  }

  /**
   * Get Juz' progress for a registration.
   */
  async getProgress(registrationId: string) {
    return supabase
      .from('himam_progress')
      .select('*')
      .eq('registration_id', registrationId)
      .order('juz_number', { ascending: true });
  }

  /**
   * Create a new Himam event (program admin only).
   */
  async createEvent(input: CreateEventInput, createdBy: string) {
    return supabase
      .from('himam_events')
      .insert({
        program_id: input.program_id,
        event_date: input.event_date,
        start_time: input.start_time,
        end_time: input.end_time,
        timezone: input.timezone,
        status: 'upcoming',
        created_by: createdBy,
      })
      .select()
      .single();
  }

  /**
   * Register a student for an event with a chosen track.
   * Also creates himam_progress rows for each Juz' in the track.
   */
  async registerForEvent(eventId: string, studentId: string, track: string) {
    // Insert registration
    const { data: registration, error: regError } = await supabase
      .from('himam_registrations')
      .insert({
        event_id: eventId,
        student_id: studentId,
        track,
        status: 'registered',
      })
      .select()
      .single();

    if (regError || !registration) return { data: null, error: regError };

    // Determine Juz' count from track
    const juzCount = parseInt(track.split('_')[0], 10);

    // Create progress rows
    const progressRows = Array.from({ length: juzCount }, (_, i) => ({
      registration_id: registration.id,
      juz_number: i + 1,
      status: 'pending',
    }));

    const { error: progressError } = await supabase
      .from('himam_progress')
      .insert(progressRows);

    if (progressError) return { data: registration, error: progressError };

    return { data: registration, error: null };
  }

  /**
   * Update time slots for a registration.
   */
  async updateTimeSlots(registrationId: string, timeSlots: TimeSlot[]) {
    return supabase
      .from('himam_registrations')
      .update({ time_slots: timeSlots as unknown as Json })
      .eq('id', registrationId)
      .select()
      .single();
  }

  /**
   * Log block completion for a specific Juz'.
   */
  async logBlockCompletion(
    registrationId: string,
    juzNumber: number,
    loggedBy: string,
    status: 'completed' | 'partner_absent',
    notes?: string,
  ) {
    const updateFields: Record<string, unknown> = {
      status,
      logged_by: loggedBy,
      notes: notes ?? null,
    };

    if (status === 'completed') {
      updateFields.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('himam_progress')
      .update(updateFields)
      .eq('registration_id', registrationId)
      .eq('juz_number', juzNumber)
      .select()
      .single();

    if (error) return { data: null, error };

    // Check if all Juz' are completed (partner_absent does NOT count)
    if (status === 'completed') {
      const { data: allProgress } = await supabase
        .from('himam_progress')
        .select('status')
        .eq('registration_id', registrationId);

      const allCompleted = allProgress?.every((p) => p.status === 'completed');
      if (allCompleted) {
        await supabase
          .from('himam_registrations')
          .update({ status: 'completed' })
          .eq('id', registrationId);
      }
    }

    return { data, error: null };
  }

  /**
   * Cancel a student's registration.
   */
  async cancelRegistration(registrationId: string) {
    return supabase
      .from('himam_registrations')
      .update({ status: 'cancelled' })
      .eq('id', registrationId)
      .select()
      .single();
  }

  /**
   * Cancel an entire event and all its registrations.
   */
  async cancelEvent(eventId: string) {
    // Cancel all non-completed registrations
    await supabase
      .from('himam_registrations')
      .update({ status: 'cancelled' })
      .eq('event_id', eventId)
      .neq('status', 'completed');

    // Cancel the event itself
    return supabase
      .from('himam_events')
      .update({ status: 'cancelled' })
      .eq('id', eventId)
      .select()
      .single();
  }
}

export const himamService = new HimamService();
