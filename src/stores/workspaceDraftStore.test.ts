jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

import { useWorkspaceDraftStore, type WorkspaceDraft } from './workspaceDraftStore';

const initialState = useWorkspaceDraftStore.getState();

beforeEach(() => {
  useWorkspaceDraftStore.setState(initialState);
  jest.useRealTimers();
});

const makeDraft = (savedAt = Date.now()): Omit<WorkspaceDraft, 'savedAt'> => ({
  attendanceStatuses: { s1: 'present' },
  evaluations: {},
  recitations: {},
});

describe('workspaceDraftStore', () => {
  it('starts with empty drafts', () => {
    expect(useWorkspaceDraftStore.getState().drafts).toEqual({});
  });

  describe('saveDraft', () => {
    it('stores draft with current timestamp', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-01T10:00:00Z'));

      useWorkspaceDraftStore.getState().saveDraft('session-1', makeDraft());
      const draft = useWorkspaceDraftStore.getState().drafts['session-1'];

      expect(draft).toBeDefined();
      expect(draft.savedAt).toBe(new Date('2026-03-01T10:00:00Z').getTime());
      expect(draft.attendanceStatuses).toEqual({ s1: 'present' });
    });
  });

  describe('getDraft', () => {
    it('returns correct draft by sessionId', () => {
      useWorkspaceDraftStore.getState().saveDraft('session-1', makeDraft());
      const draft = useWorkspaceDraftStore.getState().getDraft('session-1');
      expect(draft).toBeDefined();
      expect(draft!.attendanceStatuses).toEqual({ s1: 'present' });
    });

    it('returns undefined for unknown sessionId', () => {
      const draft = useWorkspaceDraftStore.getState().getDraft('nonexistent');
      expect(draft).toBeUndefined();
    });
  });

  describe('clearDraft', () => {
    it('removes specific draft and leaves others', () => {
      useWorkspaceDraftStore.getState().saveDraft('session-1', makeDraft());
      useWorkspaceDraftStore.getState().saveDraft('session-2', makeDraft());

      useWorkspaceDraftStore.getState().clearDraft('session-1');

      expect(useWorkspaceDraftStore.getState().getDraft('session-1')).toBeUndefined();
      expect(useWorkspaceDraftStore.getState().getDraft('session-2')).toBeDefined();
    });
  });

  describe('clearStaleDrafts', () => {
    it('removes drafts older than default 7 days', () => {
      jest.useFakeTimers();

      // Save a draft "8 days ago"
      jest.setSystemTime(new Date('2026-02-20T00:00:00Z'));
      useWorkspaceDraftStore.getState().saveDraft('old-session', makeDraft());

      // Save a draft "now"
      jest.setSystemTime(new Date('2026-02-28T00:00:00Z'));
      useWorkspaceDraftStore.getState().saveDraft('fresh-session', makeDraft());

      // Clear stale drafts
      useWorkspaceDraftStore.getState().clearStaleDrafts();

      expect(useWorkspaceDraftStore.getState().getDraft('old-session')).toBeUndefined();
      expect(useWorkspaceDraftStore.getState().getDraft('fresh-session')).toBeDefined();
    });

    it('respects custom maxAge', () => {
      jest.useFakeTimers();

      jest.setSystemTime(new Date('2026-02-27T00:00:00Z'));
      useWorkspaceDraftStore.getState().saveDraft('session-1', makeDraft());

      jest.setSystemTime(new Date('2026-02-28T00:00:00Z'));

      // 1-day maxAge
      const ONE_DAY = 24 * 60 * 60 * 1000;
      useWorkspaceDraftStore.getState().clearStaleDrafts(ONE_DAY);

      expect(useWorkspaceDraftStore.getState().getDraft('session-1')).toBeUndefined();
    });

    it('preserves fresh drafts', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-01T00:00:00Z'));

      useWorkspaceDraftStore.getState().saveDraft('session-1', makeDraft());
      useWorkspaceDraftStore.getState().clearStaleDrafts();

      expect(useWorkspaceDraftStore.getState().getDraft('session-1')).toBeDefined();
    });
  });
});
