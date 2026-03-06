import { sessionsService } from './sessions.service';
import { supabase } from '@/lib/supabase';
import {
  createQueryMock,
  whenFromMulti,
  whenGetUser,
  resetSupabaseMocks,
} from '@/__test-utils__';

const mockSupabase = supabase as any;

beforeEach(() => {
  resetSupabaseMocks();
});

describe('sessionsService', () => {
  describe('createSession', () => {
    it('looks up teacher school_id before inserting', async () => {
      const profileBuilder = createQueryMock({
        data: { school_id: 'school-1' },
        error: null,
      });
      const sessionBuilder = createQueryMock({
        data: { id: 'session-1' },
        error: null,
      });

      let callCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'profiles') return profileBuilder;
        if (table === 'sessions') {
          callCount++;
          return sessionBuilder;
        }
        return createQueryMock();
      });

      const result = await sessionsService.createSession({
        student_id: 's1',
        teacher_id: 't1',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(profileBuilder.select).toHaveBeenCalledWith('school_id');
      expect(profileBuilder.eq).toHaveBeenCalledWith('id', 't1');
      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(result.data).toEqual({ id: 'session-1' });
      expect(result.error).toBeNull();
    });

    it('returns error when teacher profile not found', async () => {
      const profileBuilder = createQueryMock({
        data: null,
        error: null,
      });
      mockSupabase.from.mockReturnValue(profileBuilder);

      const result = await sessionsService.createSession({
        student_id: 's1',
        teacher_id: 't1',
      });

      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });

    it('returns error when profile lookup fails', async () => {
      const profileBuilder = createQueryMock({
        data: null,
        error: { message: 'DB error' },
      });
      mockSupabase.from.mockReturnValue(profileBuilder);

      const result = await sessionsService.createSession({
        student_id: 's1',
        teacher_id: 't1',
      });

      expect(result.data).toBeNull();
      expect(result.error).toEqual({ message: 'DB error' });
    });
  });

  describe('updateDraft', () => {
    it('returns error when not authenticated', async () => {
      whenGetUser(null);

      const result = await sessionsService.updateDraft('session-1', {});
      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('Not authenticated');
    });

    it('applies auth guards when authenticated', async () => {
      whenGetUser({ id: 'user-1' });
      const builder = createQueryMock({ data: { id: 'session-1' }, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.updateDraft('session-1', { notes: 'updated' });

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(builder.eq).toHaveBeenCalledWith('id', 'session-1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'draft');
      expect(builder.eq).toHaveBeenCalledWith('teacher_id', 'user-1');
    });
  });

  describe('deleteDraft', () => {
    it('returns error when not authenticated', async () => {
      whenGetUser(null);

      const result = await sessionsService.deleteDraft('session-1');
      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('applies auth guards when authenticated', async () => {
      whenGetUser({ id: 'user-1' });
      const builder = createQueryMock({ data: null, error: null });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.deleteDraft('session-1');

      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith('id', 'session-1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'draft');
      expect(builder.eq).toHaveBeenCalledWith('teacher_id', 'user-1');
    });
  });

  describe('getSessions', () => {
    it('applies all provided filters', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.getSessions({
        studentId: 's1',
        teacherId: 't1',
        classId: 'c1',
        programId: 'p1',
        status: 'completed',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(builder.eq).toHaveBeenCalledWith('student_id', 's1');
      expect(builder.eq).toHaveBeenCalledWith('teacher_id', 't1');
      expect(builder.eq).toHaveBeenCalledWith('class_id', 'c1');
      expect(builder.eq).toHaveBeenCalledWith('program_id', 'p1');
      expect(builder.eq).toHaveBeenCalledWith('status', 'completed');
      expect(builder.gte).toHaveBeenCalledWith('session_date', '2026-01-01');
      expect(builder.lte).toHaveBeenCalledWith('session_date', '2026-01-31');
    });

    it('does not apply filters for undefined values', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.getSessions({});

      // Only order and range should be called, no eq/gte/lte
      expect(builder.order).toHaveBeenCalled();
      expect(builder.range).toHaveBeenCalled();
      // eq should not have been called (no filters)
      expect(builder.eq).not.toHaveBeenCalled();
    });

    it('paginates correctly', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.getSessions({ page: 3, pageSize: 10 });

      // page 3, pageSize 10 → offset = 20, range(20, 29)
      expect(builder.range).toHaveBeenCalledWith(20, 29);
    });

    it('defaults to page 1 with pageSize 20', async () => {
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.getSessions({});

      expect(builder.range).toHaveBeenCalledWith(0, 19);
    });
  });

  describe('getSessionById', () => {
    it('queries sessions table with id filter', async () => {
      const builder = createQueryMock({
        data: { id: 'session-1' },
        error: null,
      });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.getSessionById('session-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
      expect(builder.eq).toHaveBeenCalledWith('id', 'session-1');
      expect(builder.single).toHaveBeenCalled();
    });
  });

  describe('getTeacherPrograms', () => {
    it('returns error when not authenticated', async () => {
      whenGetUser(null);

      const result = await sessionsService.getTeacherPrograms();
      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
    });

    it('queries program_roles for the authenticated teacher', async () => {
      whenGetUser({ id: 'teacher-1' });
      const builder = createQueryMock({ data: [], error: null });
      mockSupabase.from.mockReturnValue(builder);

      await sessionsService.getTeacherPrograms();

      expect(mockSupabase.from).toHaveBeenCalledWith('program_roles');
      expect(builder.eq).toHaveBeenCalledWith('profile_id', 'teacher-1');
      expect(builder.eq).toHaveBeenCalledWith('role', 'teacher');
    });
  });
});
