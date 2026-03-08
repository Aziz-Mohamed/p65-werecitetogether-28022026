import { useCallback, useMemo, useState } from 'react';

import { useStudentById } from './useStudents';
import { useSessions } from '@/features/sessions/hooks/useSessions';
import { useStudentStickers } from '@/features/gamification/hooks/useStickers';
import { useRubCertifications } from '@/features/gamification/hooks/useRubCertifications';
import { useCertifyRub } from '@/features/gamification/hooks/useCertifyRub';
import { useUndoCertification } from '@/features/gamification/hooks/useUndoCertification';
import { useRecordRevision, type RevisionInput } from '@/features/gamification/hooks/useRecordRevision';
import { useRubReference } from '@/features/gamification/hooks/useRubReference';
import type { EnrichedCertification, RubReference } from '@/features/gamification/types/gamification.types';
import { useAttendanceRate } from '@/features/attendance/hooks/useAttendance';
import { useMemorizationStats } from '@/features/memorization/hooks/useMemorizationStats';
import { useAssignments, useCompleteRevisionHomework } from '@/features/memorization';
import { useUndoTimer } from '@/hooks/useUndoTimer';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape of the joined Supabase select from studentsService.getStudentById() */
export interface StudentDetailProfile {
  full_name: string;
  name_localized: Record<string, string> | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface StudentDetailClass {
  id: string;
  name: string;
  name_localized: Record<string, string> | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTeacherStudentDetail(studentId: string | undefined, teacherId: string | undefined) {
  // ── Queries ─────────────────────────────────────────────────────────
  const { data: student, isLoading, error, refetch } = useStudentById(studentId);
  const { data: sessions = [] } = useSessions({
    studentId,
    teacherId,
    pageSize: 10,
  });
  const { data: stickers = [] } = useStudentStickers(studentId);
  const { data: attendanceData } = useAttendanceRate(studentId);
  const { data: memStats } = useMemorizationStats(studentId);
  const { enriched, activeCount } = useRubCertifications(studentId);

  // ── Mutations ───────────────────────────────────────────────────────
  const certifyMutation = useCertifyRub();
  const undoMutation = useUndoCertification();
  const { goodRevision, poorRevision, recertify, batchGoodRevision, batchPoorRevision } = useRecordRevision();
  const completeHomework = useCompleteRevisionHomework();

  // ── Rubʿ reference data ──────────────────────────────────────────────
  const { data: rubReferenceList } = useRubReference();

  const rubReferenceMap = useMemo(() => {
    const map = new Map<number, RubReference>();
    if (rubReferenceList) {
      for (const ref of rubReferenceList) {
        map.set(ref.rub_number, ref);
      }
    }
    return map;
  }, [rubReferenceList]);

  // ── Revision homework ────────────────────────────────────────────────
  const { data: homeworkAssignments = [] } = useAssignments({
    studentId,
    status: 'pending',
    assignmentType: 'old_review',
  });

  const reverseRubMap = useMemo(() => {
    const map = new Map<string, number>();
    if (rubReferenceList) {
      for (const ref of rubReferenceList) {
        map.set(`${ref.start_surah}:${ref.start_ayah}`, ref.rub_number);
      }
    }
    return map;
  }, [rubReferenceList]);

  const homeworkItems = useMemo(() => {
    const items: { assignmentId: string; rubNumber: number; juz: number }[] = [];
    for (const a of homeworkAssignments) {
      const rubNumber = reverseRubMap.get(`${a.surah_number}:${a.from_ayah}`);
      if (!rubNumber) continue;
      items.push({ assignmentId: a.id, rubNumber, juz: Math.ceil(rubNumber / 8) });
    }
    return items;
  }, [homeworkAssignments, reverseRubMap]);

  // ── Undo state ───────────────────────────────────────────────────────
  const undo = useUndoTimer<{ certId: string; rubNumber: number }>();

  // ── Revision sheet state ─────────────────────────────────────────────
  const [revisionCert, setRevisionCert] = useState<EnrichedCertification | null>(null);

  // ── Callbacks ────────────────────────────────────────────────────────
  const handleCertify = useCallback(
    async (rubNumber: number) => {
      if (!studentId || !teacherId) return;
      try {
        const result = await certifyMutation.mutateAsync({
          studentId,
          rubNumber,
          certifiedBy: teacherId,
        });
        if (result.data) {
          undo.set({ certId: result.data.id, rubNumber });
        }
      } catch {
        // Mutation error handled by TanStack Query
      }
    },
    [studentId, teacherId, certifyMutation, undo],
  );

  const handleUndo = useCallback(() => {
    if (!undo.data || !studentId) return;
    undoMutation.mutate({ certificationId: undo.data.certId, studentId });
    undo.clear();
  }, [undo, studentId, undoMutation]);

  const handleCertifiedRubPress = useCallback((cert: EnrichedCertification) => {
    setRevisionCert(cert);
  }, []);

  const handleRevisionAction = useCallback(
    (action: 'good' | 'poor' | 'recertify') => {
      if (!revisionCert || !studentId) return;
      const base = {
        certificationId: revisionCert.id,
        studentId,
        reviewCount: revisionCert.review_count,
        dormantSince: revisionCert.dormant_since,
      };

      if (action === 'good') {
        goodRevision.mutate(base);
      } else if (action === 'poor') {
        poorRevision.mutate(base);
      } else if (action === 'recertify' && teacherId) {
        recertify.mutate({
          certificationId: revisionCert.id,
          studentId,
          certifiedBy: teacherId,
        });
      }
      setRevisionCert(null);
    },
    [revisionCert, studentId, teacherId, goodRevision, poorRevision, recertify],
  );

  const handleJuzAction = useCallback(
    (juzNumber: number, action: 'good' | 'poor') => {
      if (!studentId) return;
      const targets = enriched.filter(
        (cert) =>
          Math.ceil(cert.rub_number / 8) === juzNumber &&
          cert.freshness.state !== 'dormant',
      );
      if (targets.length === 0) return;

      const inputs: RevisionInput[] = targets.map((cert) => ({
        certificationId: cert.id,
        studentId,
        reviewCount: cert.review_count,
        dormantSince: cert.dormant_since,
      }));

      if (action === 'good') {
        batchGoodRevision.mutate(inputs);
      } else {
        batchPoorRevision.mutate(inputs);
      }
    },
    [studentId, enriched, batchGoodRevision, batchPoorRevision],
  );

  const closeRevisionSheet = useCallback(() => setRevisionCert(null), []);

  // ── Derived profile/class (properly typed) ──────────────────────────
  const studentProfile = (student as unknown as { profiles: StudentDetailProfile } | undefined)?.profiles ?? null;
  const studentClass = (student as unknown as { classes: StudentDetailClass | null } | undefined)?.classes ?? null;
  const attendanceRate = attendanceData?.rate ?? 0;

  return {
    // Query state
    student,
    isLoading,
    error,
    refetch,

    // Data
    sessions,
    stickers,
    memStats,
    activeCount,
    attendanceRate,
    studentProfile,
    studentClass,
    rubReferenceMap,
    homeworkItems,

    // Undo
    undo,
    handleUndo,

    // Revision sheet
    revisionCert,
    closeRevisionSheet,

    // Mutations
    completeHomework,
    handleCertify,
    handleCertifiedRubPress,
    handleRevisionAction,
    handleJuzAction,
  };
}
