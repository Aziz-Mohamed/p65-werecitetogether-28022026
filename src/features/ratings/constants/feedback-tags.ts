import type { FeedbackTag } from '../types/ratings.types';

export const POSITIVE_TAGS: FeedbackTag[] = [
  { key: 'patient', i18nKey: 'ratings.tags.patient', category: 'positive' },
  { key: 'clear_explanation', i18nKey: 'ratings.tags.clearExplanation', category: 'positive' },
  { key: 'encouraging', i18nKey: 'ratings.tags.encouraging', category: 'positive' },
  { key: 'well_prepared', i18nKey: 'ratings.tags.wellPrepared', category: 'positive' },
  { key: 'good_listener', i18nKey: 'ratings.tags.goodListener', category: 'positive' },
];

export const CONSTRUCTIVE_TAGS: FeedbackTag[] = [
  { key: 'session_felt_rushed', i18nKey: 'ratings.tags.sessionFeltRushed', category: 'constructive' },
  { key: 'needs_more_practice', i18nKey: 'ratings.tags.needsMorePractice', category: 'constructive' },
  { key: 'unclear_instructions', i18nKey: 'ratings.tags.unclearInstructions', category: 'constructive' },
  { key: 'late_start', i18nKey: 'ratings.tags.lateStart', category: 'constructive' },
];

export const ALL_FEEDBACK_TAGS: FeedbackTag[] = [...POSITIVE_TAGS, ...CONSTRUCTIVE_TAGS];
