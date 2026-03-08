import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { gamificationService } from '../services/gamification.service';
import type { MilestoneBadge, StudentBadgeDisplay } from '../types/gamification.types';

/**
 * Fetch a student's earned badges and merge with all milestone badge types
 * to produce a complete earned/locked list for display.
 */
export const useStudentBadges = (
  studentId: string | undefined,
  programId: string | undefined,
) => {
  const earnedQuery = useQuery({
    queryKey: ['gamification', 'badges', 'earned', studentId, programId],
    queryFn: async () => {
      if (!studentId) throw new Error('Student ID is required');
      const { data, error } = await gamificationService.getStudentBadges(
        studentId,
        programId,
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!studentId,
  });

  const allBadgesQuery = useQuery({
    queryKey: ['gamification', 'badges', 'all'],
    queryFn: async () => {
      const { data, error } = await gamificationService.getMilestoneBadges();
      if (error) throw error;
      return (data ?? []) as MilestoneBadge[];
    },
    staleTime: 1000 * 60 * 60,
  });

  const badges = useMemo<StudentBadgeDisplay[]>(() => {
    if (!allBadgesQuery.data) return [];

    const earnedMap = new Map<string, { earned_at: string; program_id: string | null }>();
    for (const earned of earnedQuery.data ?? []) {
      earnedMap.set(earned.badge_id, {
        earned_at: earned.earned_at,
        program_id: earned.program_id ?? null,
      });
    }

    return allBadgesQuery.data.map((badge) => {
      const earned = earnedMap.get(badge.id);
      return {
        badge_id: badge.id,
        name_en: badge.name_en,
        name_ar: badge.name_ar,
        description_en: badge.description_en,
        description_ar: badge.description_ar,
        icon: badge.icon,
        category: badge.category,
        sort_order: badge.sort_order,
        earned: !!earned,
        earned_at: earned?.earned_at ?? null,
        program_id: earned?.program_id ?? null,
        program_name: null,
      };
    });
  }, [allBadgesQuery.data, earnedQuery.data]);

  return {
    badges,
    isLoading: earnedQuery.isLoading || allBadgesQuery.isLoading,
    error: earnedQuery.error || allBadgesQuery.error,
    refetch: () => {
      earnedQuery.refetch();
      allBadgesQuery.refetch();
    },
  };
};
