/**
 * Tests for the badge merge logic in useStudentBadges.
 * Extracted from the hook's useMemo block for direct testing.
 */

interface MilestoneBadge {
  id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  category: string;
  sort_order: number;
}

interface StudentBadgeDisplay {
  badge_id: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  icon: string;
  category: string;
  sort_order: number;
  earned: boolean;
  earned_at: string | null;
  program_id: string | null;
  program_name: string | null;
}

// Extracted from useStudentBadges useMemo
function mergeBadges(
  allBadges: MilestoneBadge[],
  earnedBadges: Array<Record<string, unknown>>,
): StudentBadgeDisplay[] {
  const earnedMap = new Map<string, { earned_at: string; program_id: string | null }>();
  for (const earned of earnedBadges) {
    earnedMap.set(earned.badge_id as string, {
      earned_at: earned.earned_at as string,
      program_id: (earned.program_id as string) ?? null,
    });
  }

  return allBadges.map((badge) => {
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
}

const allBadges: MilestoneBadge[] = [
  {
    id: 'badge-1',
    name_en: 'First Session',
    name_ar: 'الجلسة الأولى',
    description_en: 'Complete your first session',
    description_ar: 'أكمل جلستك الأولى',
    icon: 'star',
    category: 'session',
    sort_order: 1,
  },
  {
    id: 'badge-2',
    name_en: '10 Sessions',
    name_ar: '10 جلسات',
    description_en: 'Complete 10 sessions',
    description_ar: 'أكمل 10 جلسات',
    icon: 'trophy',
    category: 'session',
    sort_order: 2,
  },
  {
    id: 'badge-3',
    name_en: 'Perfect Score',
    name_ar: 'درجة كاملة',
    description_en: 'Get a perfect score',
    description_ar: 'احصل على درجة كاملة',
    icon: 'medal',
    category: 'achievement',
    sort_order: 3,
  },
];

describe('useStudentBadges merge logic', () => {
  it('returns all badges with earned=false when no badges earned', () => {
    const result = mergeBadges(allBadges, []);

    expect(result).toHaveLength(3);
    expect(result.every((b) => b.earned === false)).toBe(true);
    expect(result.every((b) => b.earned_at === null)).toBe(true);
  });

  it('marks earned badges correctly', () => {
    const earned = [
      { badge_id: 'badge-1', earned_at: '2026-03-01T00:00:00Z', program_id: 'p1' },
    ];

    const result = mergeBadges(allBadges, earned);

    expect(result[0].earned).toBe(true);
    expect(result[0].earned_at).toBe('2026-03-01T00:00:00Z');
    expect(result[0].program_id).toBe('p1');
    expect(result[1].earned).toBe(false);
    expect(result[2].earned).toBe(false);
  });

  it('handles multiple earned badges', () => {
    const earned = [
      { badge_id: 'badge-1', earned_at: '2026-02-01T00:00:00Z', program_id: null },
      { badge_id: 'badge-3', earned_at: '2026-03-01T00:00:00Z', program_id: 'p2' },
    ];

    const result = mergeBadges(allBadges, earned);

    expect(result[0].earned).toBe(true);
    expect(result[0].program_id).toBeNull();
    expect(result[1].earned).toBe(false);
    expect(result[2].earned).toBe(true);
    expect(result[2].program_id).toBe('p2');
  });

  it('returns empty array when no badge definitions exist', () => {
    const result = mergeBadges([], [{ badge_id: 'badge-1', earned_at: '2026-03-01T00:00:00Z' }]);
    expect(result).toEqual([]);
  });

  it('preserves badge metadata in output', () => {
    const result = mergeBadges(allBadges, []);

    expect(result[0].badge_id).toBe('badge-1');
    expect(result[0].name_en).toBe('First Session');
    expect(result[0].name_ar).toBe('الجلسة الأولى');
    expect(result[0].icon).toBe('star');
    expect(result[0].category).toBe('session');
    expect(result[0].sort_order).toBe(1);
    expect(result[0].program_name).toBeNull();
  });

  it('ignores earned badges with no matching definition', () => {
    const earned = [
      { badge_id: 'nonexistent', earned_at: '2026-03-01T00:00:00Z', program_id: null },
    ];

    const result = mergeBadges(allBadges, earned);

    expect(result).toHaveLength(3);
    expect(result.every((b) => b.earned === false)).toBe(true);
  });
});
