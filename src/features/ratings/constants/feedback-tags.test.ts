import { POSITIVE_TAGS, CONSTRUCTIVE_TAGS, ALL_FEEDBACK_TAGS } from './feedback-tags';

describe('feedback tags', () => {
  it('all positive tags have category "positive"', () => {
    for (const tag of POSITIVE_TAGS) {
      expect(tag.category).toBe('positive');
    }
  });

  it('all constructive tags have category "constructive"', () => {
    for (const tag of CONSTRUCTIVE_TAGS) {
      expect(tag.category).toBe('constructive');
    }
  });

  it('ALL_FEEDBACK_TAGS combines both arrays', () => {
    expect(ALL_FEEDBACK_TAGS.length).toBe(POSITIVE_TAGS.length + CONSTRUCTIVE_TAGS.length);
  });

  it('has no duplicate keys', () => {
    const keys = ALL_FEEDBACK_TAGS.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every tag has required fields', () => {
    for (const tag of ALL_FEEDBACK_TAGS) {
      expect(tag.key).toBeTruthy();
      expect(tag.i18nKey).toBeTruthy();
      expect(['positive', 'constructive']).toContain(tag.category);
    }
  });
});
