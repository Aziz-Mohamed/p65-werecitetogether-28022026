import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useActiveDraftSession } from './useActiveDraftSession';
import type { SessionWithDetails } from '../types';

const MIN_SESSION_AGE_MS = 5 * 60 * 1000; // 5 minutes

interface UsePostSessionDetectionResult {
  showPrompt: boolean;
  activeSession: SessionWithDetails | null;
  dismissPrompt: () => void;
}

export function usePostSessionDetection(
  studentId: string | undefined,
): UsePostSessionDetectionResult {
  const { data: activeDraft, refetch } = useActiveDraftSession(studentId);
  const [showPrompt, setShowPrompt] = useState(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const checkSession = useCallback(() => {
    if (!activeDraft) {
      setShowPrompt(false);
      return;
    }

    const createdAt = new Date(activeDraft.created_at).getTime();
    const age = Date.now() - createdAt;
    if (age > MIN_SESSION_AGE_MS) {
      setShowPrompt(true);
    }
  }, [activeDraft]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          // App came to foreground — refetch draft session.
          // The checkSession effect below will re-run when activeDraft changes.
          refetch();
        }
        appState.current = nextState;
      },
    );

    return () => subscription.remove();
  }, [refetch]);

  // Also check on initial mount / when data changes
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
  }, []);

  return {
    showPrompt,
    activeSession: activeDraft ?? null,
    dismissPrompt,
  };
}
