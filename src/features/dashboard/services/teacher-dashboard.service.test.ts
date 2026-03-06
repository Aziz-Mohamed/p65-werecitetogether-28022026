import { teacherDashboardService } from './teacher-dashboard.service';
import { supabase } from '@/lib/supabase';
import { createQueryMock, resetSupabaseMocks } from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-03-01T10:00:00Z'));
});

afterEach(() => {
  jest.useRealTimers();
});

describe('teacherDashboardService', () => {
  describe('getDashboard', () => {
    it('counts unique students from today sessions', async () => {
      const builder = createQueryMock({
        data: [
          { id: '1', student_id: 's1' },
          { id: '2', student_id: 's2' },
          { id: '3', student_id: 's1' }, // duplicate student
        ],
        error: null,
      });
      mockSupabase.from.mockReturnValue(builder);

      const result = await teacherDashboardService.getDashboard('teacher-1');

      expect(result.todaySessionCount).toBe(3);
      expect(result.todayStudentsSeen).toBe(2); // unique
    });

    it('sums total students across classes', async () => {
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // sessions query
          return createQueryMock({ data: [], error: null });
        }
        if (callCount === 2) {
          // classes query with student arrays
          return createQueryMock({
            data: [
              { id: 'c1', students: [{ id: 's1' }, { id: 's2' }] },
              { id: 'c2', students: [{ id: 's3' }] },
            ],
            error: null,
          });
        }
        // remaining queries
        return createQueryMock({ data: null, error: null });
      });

      const result = await teacherDashboardService.getDashboard('teacher-1');

      expect(result.totalStudents).toBe(3);
    });

    it('handles empty data gracefully', async () => {
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      const result = await teacherDashboardService.getDashboard('teacher-1');

      expect(result.todaySessionCount).toBe(0);
      expect(result.todayStudentsSeen).toBe(0);
      expect(result.totalStudents).toBe(0);
      expect(result.recentSessions).toEqual([]);
    });
  });
});
