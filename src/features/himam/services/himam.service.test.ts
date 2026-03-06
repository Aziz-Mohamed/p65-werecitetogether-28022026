import { himamService } from './himam.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('himamService', () => {
  describe('register', () => {
    it('calls RPC with correct parameters', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: { registrationId: 'r1' }, error: null });

      await himamService.register({
        eventId: 'e1',
        track: 'memorization',
        selectedJuz: [1, 2],
        timeSlots: ['morning'],
      });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('register_for_himam_event', {
        p_event_id: 'e1',
        p_track: 'memorization',
        p_selected_juz: [1, 2],
        p_time_slots: ['morning'],
      });
    });
  });

  describe('cancel', () => {
    it('calls RPC with registration ID', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await himamService.cancel('reg-1');

      expect(mockSupabase.rpc).toHaveBeenCalledWith('cancel_himam_registration', {
        p_registration_id: 'reg-1',
      });
    });
  });

  describe('markComplete', () => {
    it('calls RPC with registration and juz number', async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await himamService.markComplete({ registrationId: 'r1', juzNumber: 5 });

      expect(mockSupabase.rpc).toHaveBeenCalledWith('mark_juz_complete', {
        p_registration_id: 'r1',
        p_juz_number: 5,
      });
    });
  });

  describe('getUpcomingEvent', () => {
    it('queries upcoming events for a program', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await himamService.getUpcomingEvent('p1');

      expect(mockSupabase.from).toHaveBeenCalledWith('himam_events');
      expect(builder.eq).toHaveBeenCalledWith('program_id', 'p1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'upcoming');
      expect(builder.limit).toHaveBeenCalledWith(1);
      expect(builder.maybeSingle).toHaveBeenCalled();
    });
  });

  describe('getEvents', () => {
    it('queries events ordered by date descending', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await himamService.getEvents('p1');

      expect(mockSupabase.from).toHaveBeenCalledWith('himam_events');
      expect(builder.eq).toHaveBeenCalledWith('program_id', 'p1');
      expect(builder.order).toHaveBeenCalledWith('event_date', { ascending: false });
    });
  });
});
