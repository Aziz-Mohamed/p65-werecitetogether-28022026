import {
  NOTIFICATION_CATEGORIES,
  getCategoriesForRole,
  TABLE_TO_CATEGORY,
} from './notification-categories';

describe('NOTIFICATION_CATEGORIES', () => {
  it('has no duplicate IDs', () => {
    const ids = NOTIFICATION_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category has required fields', () => {
    for (const cat of NOTIFICATION_CATEGORIES) {
      expect(cat.id).toBeTruthy();
      expect(cat.labelKey).toBeTruthy();
      expect(cat.descriptionKey).toBeTruthy();
      expect(cat.icon).toBeTruthy();
      expect(cat.roles.length).toBeGreaterThan(0);
      expect(cat.preferenceColumn).toBeTruthy();
    }
  });
});

describe('getCategoriesForRole', () => {
  it('returns student categories', () => {
    const cats = getCategoriesForRole('student');
    const ids = cats.map((c) => c.id);
    expect(ids).toContain('sticker_awarded');
    expect(ids).toContain('trophy_earned');
    expect(ids).toContain('achievement_unlocked');
    expect(ids).toContain('session_completed');
    expect(ids).not.toContain('daily_summary');
    expect(ids).not.toContain('student_alert');
  });

  it('returns teacher categories', () => {
    const cats = getCategoriesForRole('teacher');
    const ids = cats.map((c) => c.id);
    expect(ids).toContain('daily_summary');
    expect(ids).toContain('student_alert');
    expect(ids).not.toContain('sticker_awarded');
  });

  it('returns parent categories', () => {
    const cats = getCategoriesForRole('parent');
    const ids = cats.map((c) => c.id);
    expect(ids).toContain('sticker_awarded');
    expect(ids).toContain('attendance_marked');
    expect(ids).not.toContain('daily_summary');
  });

  it('returns empty for roles with no categories', () => {
    const cats = getCategoriesForRole('admin' as any);
    expect(cats).toHaveLength(0);
  });
});

describe('TABLE_TO_CATEGORY', () => {
  it('maps known tables', () => {
    expect(TABLE_TO_CATEGORY['student_stickers']).toBe('sticker_awarded');
    expect(TABLE_TO_CATEGORY['student_trophies']).toBe('trophy_earned');
    expect(TABLE_TO_CATEGORY['student_achievements']).toBe('achievement_unlocked');
    expect(TABLE_TO_CATEGORY['attendance']).toBe('attendance_marked');
    expect(TABLE_TO_CATEGORY['sessions']).toBe('session_completed');
  });

  it('returns undefined for unmapped tables', () => {
    expect(TABLE_TO_CATEGORY['profiles']).toBeUndefined();
  });
});
