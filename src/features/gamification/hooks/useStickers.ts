import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import { mutationTracker } from '@/features/realtime';
import { aggregateStickerCollection } from '../utils/sticker-aggregation';
import type { AwardedSticker, StickerWithProgram } from '../types/gamification.types';

/**
 * Fetch sticker catalog, optionally filtered by program IDs.
 * When programIds provided: returns global + program-scoped stickers, grouped.
 * When omitted: returns only global stickers (backward-compatible).
 * Stale for 30 min since the catalog rarely changes.
 */
export const useStickers = (programIds?: string[]) => {
  return useQuery({
    queryKey: ['stickers', ...(programIds ?? [])],
    queryFn: async () => {
      const { data, error } = await gamificationService.getStickers(programIds);
      if (error) throw error;
      return (data ?? []) as Array<StickerWithProgram & { programs: { name: string; name_ar: string } | null }>;
    },
    staleTime: 1000 * 60 * 30,
  });
};

/** Group stickers by program (null = global) for section rendering */
export const useGroupedStickers = (programIds?: string[]) => {
  const query = useStickers(programIds);

  const grouped = useMemo(() => {
    if (!query.data) return [];
    const groups = new Map<string | null, { programId: string | null; programName: string | null; programNameAr: string | null; stickers: typeof query.data }>();

    for (const sticker of query.data) {
      const key = sticker.program_id ?? null;
      if (!groups.has(key)) {
        groups.set(key, {
          programId: key,
          programName: key ? sticker.programs?.name ?? null : null,
          programNameAr: key ? sticker.programs?.name_ar ?? null : null,
          stickers: [],
        });
      }
      groups.get(key)!.stickers.push(sticker);
    }

    // Global first, then programs alphabetically
    const entries = [...groups.values()];
    entries.sort((a, b) => {
      if (a.programId === null) return -1;
      if (b.programId === null) return 1;
      return (a.programName ?? '').localeCompare(b.programName ?? '');
    });
    return entries;
  }, [query.data]);

  return { ...query, grouped };
};

/**
 * Fetch all stickers awarded to a student (raw list, most recent first).
 */
export const useStudentStickers = (studentId: string | undefined) => {
  return useQuery({
    queryKey: ['student-stickers', studentId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      const { data, error } = await gamificationService.getStudentStickers(studentId);
      if (error) throw error;
      return (data ?? []) as AwardedSticker[];
    },
    enabled: !!studentId,
  });
};

/**
 * Aggregate awarded stickers into a collection grouped by sticker_id.
 * Each item shows the sticker, how many times earned, and whether any are new.
 */
export const useStickerCollection = (studentId: string | undefined) => {
  const query = useStudentStickers(studentId);

  const collection = useMemo(
    () => aggregateStickerCollection(query.data ?? []),
    [query.data],
  );

  return {
    ...query,
    collection,
  };
};

/**
 * Get stickers that are new (is_new = true) for reveal animation.
 */
export const useNewStickers = (studentId: string | undefined) => {
  const query = useStudentStickers(studentId);
  const newStickers = (query.data ?? []).filter((s) => s.is_new);
  return { ...query, newStickers };
};

/**
 * Award a sticker to a student (teacher/admin use).
 */
export const useAwardSticker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['award-sticker'],
    mutationFn: (input: {
      studentId: string;
      stickerId: string;
      awardedBy: string;
      reason?: string;
    }) => gamificationService.awardSticker(input),
    onSuccess: (data, variables) => {
      if (data?.data?.id) {
        mutationTracker.record('student_stickers', data.data.id);
      }
      queryClient.invalidateQueries({
        queryKey: ['student-stickers', variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-dashboard', variables.studentId],
      });
    },
  });
};

/**
 * Remove an awarded sticker (undo within grace period).
 */
export const useRemoveSticker = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['remove-sticker'],
    mutationFn: (input: { studentStickerId: string; studentId: string }) =>
      gamificationService.removeSticker(input.studentStickerId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['student-stickers', variables.studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['student-dashboard', variables.studentId],
      });
    },
  });
};

/**
 * Mark a single sticker as seen (dismiss reveal animation).
 */
export const useMarkStickerSeen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['mark-sticker-seen'],
    mutationFn: (input: { studentStickerId: string; studentId: string }) =>
      gamificationService.markStickersAsSeen(input.studentStickerId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['student-stickers', variables.studentId],
      });
    },
  });
};

/**
 * Mark all new stickers as seen for a student.
 */
export const useMarkAllStickersSeen = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['mark-all-stickers-seen'],
    mutationFn: (input: { studentId: string }) =>
      gamificationService.markAllStickersAsSeen(input.studentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['student-stickers', variables.studentId],
      });
    },
  });
};
