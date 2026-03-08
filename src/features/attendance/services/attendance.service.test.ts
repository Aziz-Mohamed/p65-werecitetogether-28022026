import { attendanceService } from './attendance.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('attendanceService', () => {
  describe('markBulkAttendance', () => {
    it('upserts records with school_id and marked_by', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await attendanceService.markBulkAttendance(
        {
          class_id: 'c1',
          date: '2026-03-01',
          records: [
            { student_id: 's1', status: 'present' },
            { student_id: 's2', status: 'absent', notes: 'sick' },
          ],
        },
        'school-1',
        'teacher-1',
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('attendance');
      expect(builder.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            student_id: 's1',
            status: 'present',
            school_id: 'school-1',
            marked_by: 'teacher-1',
            notes: null,
          }),
          expect.objectContaining({
            student_id: 's2',
            status: 'absent',
            notes: 'sick',
          }),
        ]),
        { onConflict: 'student_id,date' },
      );
    });
  });

  describe('getAttendanceCalendar', () => {
    it('computes correct date range for a given month', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await attendanceService.getAttendanceCalendar('s1', 3, 2026);

      expect(builder.eq).toHaveBeenCalledWith('student_id', 's1');
      expect(builder.gte).toHaveBeenCalledWith('date', '2026-03-01');
      expect(builder.lt).toHaveBeenCalledWith('date', '2026-04-01');
    });

    it('handles December → January rollover', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await attendanceService.getAttendanceCalendar('s1', 12, 2026);

      expect(builder.gte).toHaveBeenCalledWith('date', '2026-12-01');
      expect(builder.lt).toHaveBeenCalledWith('date', '2027-01-01');
    });
  });

  describe('getAttendanceRate', () => {
    it('computes rate from status breakdown', async () => {
      const builder = createQueryMock({
        data: [
          { status: 'present' },
          { status: 'present' },
          { status: 'late' },
          { status: 'absent' },
          { status: 'excused' },
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(builder);

      const result = await attendanceService.getAttendanceRate('s1');

      expect(result.error).toBeNull();
      expect(result.data).toEqual({
        total: 5,
        present: 2,
        late: 1,
        absent: 1,
        excused: 1,
        rate: 60, // (2 + 1) / 5 * 100 = 60
      });
    });

    it('returns 0 rate for empty records', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      const result = await attendanceService.getAttendanceRate('s1');

      expect(result.data).toEqual({
        total: 0,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        rate: 0,
      });
    });

    it('propagates query errors', async () => {
      const builder = createQueryMock({
        data: null,
        error: { message: 'DB error' },
      });
      mockSupabase.from.mockReturnValue(builder);

      const result = await attendanceService.getAttendanceRate('s1');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'DB error' });
    });
  });
});
