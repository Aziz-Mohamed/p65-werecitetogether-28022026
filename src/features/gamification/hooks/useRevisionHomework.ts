import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { assignmentService } from '@/features/memorization/services/assignment.service';
import { useRubReference } from './useRubReference';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HomeworkItem {
  assignmentId: string;
  rubNumber: number;
  juz: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useRevisionHomework(studentId: string | undefined) {
  // 1. Pending old_review assignments
  const { data: pendingAssignments, ...assignmentQuery } = useQuery({
    queryKey: ['assignments', 'pending-revision', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('No profile');
      const { data, error } = await assignmentService.getAssignments({
        studentId,
        assignmentType: 'old_review',
        status: 'pending',
      });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studentId,
    staleTime: 1000 * 60,
  });

  // 2. Rubʿ reference list for reverse mapping
  const { data: rubReferenceList } = useRubReference();

  // 3. Reverse map: surah:fromAyah → rub_number
  const reverseRubMap = useMemo(() => {
    const map = new Map<string, number>();
    if (rubReferenceList) {
      for (const ref of rubReferenceList) {
        map.set(`${ref.start_surah}:${ref.start_ayah}`, ref.rub_number);
      }
    }
    return map;
  }, [rubReferenceList]);

  // 4. Homework items mapped to rubʿ numbers
  const homeworkItems = useMemo((): HomeworkItem[] => {
    if (!pendingAssignments) return [];
    const items: HomeworkItem[] = [];
    for (const a of pendingAssignments) {
      const rubNumber = reverseRubMap.get(`${a.surah_number}:${a.from_ayah}`);
      if (!rubNumber) continue;
      items.push({ assignmentId: a.id, rubNumber, juz: Math.ceil(rubNumber / 8) });
    }
    return items;
  }, [pendingAssignments, reverseRubMap]);

  // 5. Pending keys set (for "already in homework" checks)
  const pendingKeys = useMemo(() => {
    const keys = new Set<string>();
    if (pendingAssignments) {
      for (const a of pendingAssignments) {
        keys.add(`${a.surah_number}:${a.from_ayah}`);
      }
    }
    return keys;
  }, [pendingAssignments]);

  return {
    homeworkItems,
    pendingKeys,
    pendingAssignments,
    isLoading: assignmentQuery.isLoading,
  };
}
