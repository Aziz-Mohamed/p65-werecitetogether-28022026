import { colors } from '@/theme/colors';
import type { WikiSection } from '../types/wiki.types';

export const teacherSections: WikiSection[] = [
  {
    id: 'dashboard',
    titleKey: 'wiki.teacher.dashboard.title',
    subtitleKey: 'wiki.teacher.dashboard.subtitle',
    icon: 'home',
    color: colors.primary[500],
    topics: [
      {
        id: 'overview',
        titleKey: 'wiki.teacher.dashboard.overview.title',
        descriptionKey: 'wiki.teacher.dashboard.overview.description',
      },
      {
        id: 'insights',
        titleKey: 'wiki.teacher.dashboard.insights.title',
        descriptionKey: 'wiki.teacher.dashboard.insights.description',
        tipKey: 'wiki.teacher.dashboard.insights.tip',
      },
    ],
  },
  {
    id: 'students',
    titleKey: 'wiki.teacher.students.title',
    subtitleKey: 'wiki.teacher.students.subtitle',
    icon: 'people',
    color: colors.accent.indigo[500],
    topics: [
      {
        id: 'list',
        titleKey: 'wiki.teacher.students.list.title',
        descriptionKey: 'wiki.teacher.students.list.description',
      },
      {
        id: 'profiles',
        titleKey: 'wiki.teacher.students.profiles.title',
        descriptionKey: 'wiki.teacher.students.profiles.description',
        steps: [
          { textKey: 'wiki.teacher.students.profiles.step1' },
          { textKey: 'wiki.teacher.students.profiles.step2' },
          { textKey: 'wiki.teacher.students.profiles.step3' },
        ],
      },
      {
        id: 'recommendations',
        titleKey: 'wiki.teacher.students.recommendations.title',
        descriptionKey: 'wiki.teacher.students.recommendations.description',
      },
    ],
  },
  {
    id: 'sessions',
    titleKey: 'wiki.teacher.sessions.title',
    subtitleKey: 'wiki.teacher.sessions.subtitle',
    icon: 'calendar',
    color: colors.accent.sky[500],
    topics: [
      {
        id: 'workspace',
        titleKey: 'wiki.teacher.sessions.workspace.title',
        descriptionKey: 'wiki.teacher.sessions.workspace.description',
        steps: [
          { textKey: 'wiki.teacher.sessions.workspace.step1' },
          { textKey: 'wiki.teacher.sessions.workspace.step2' },
          { textKey: 'wiki.teacher.sessions.workspace.step3' },
          { textKey: 'wiki.teacher.sessions.workspace.step4' },
        ],
      },
      {
        id: 'evaluation',
        titleKey: 'wiki.teacher.sessions.evaluation.title',
        descriptionKey: 'wiki.teacher.sessions.evaluation.description',
        tipKey: 'wiki.teacher.sessions.evaluation.tip',
      },
    ],
  },
  {
    id: 'classProgress',
    titleKey: 'wiki.teacher.classProgress.title',
    subtitleKey: 'wiki.teacher.classProgress.subtitle',
    icon: 'bar-chart',
    color: colors.accent.violet[500],
    topics: [
      {
        id: 'charts',
        titleKey: 'wiki.teacher.classProgress.charts.title',
        descriptionKey: 'wiki.teacher.classProgress.charts.description',
      },
      {
        id: 'trends',
        titleKey: 'wiki.teacher.classProgress.trends.title',
        descriptionKey: 'wiki.teacher.classProgress.trends.description',
      },
    ],
  },
  {
    id: 'availability',
    titleKey: 'wiki.teacher.availability.title',
    subtitleKey: 'wiki.teacher.availability.subtitle',
    icon: 'time',
    color: colors.primary[500],
    topics: [
      {
        id: 'setSlots',
        titleKey: 'wiki.teacher.availability.setSlots.title',
        descriptionKey: 'wiki.teacher.availability.setSlots.description',
        steps: [
          { textKey: 'wiki.teacher.availability.setSlots.step1' },
          { textKey: 'wiki.teacher.availability.setSlots.step2' },
          { textKey: 'wiki.teacher.availability.setSlots.step3' },
        ],
        tipKey: 'wiki.teacher.availability.setSlots.tip',
      },
    ],
  },
  {
    id: 'stickers',
    titleKey: 'wiki.teacher.stickers.title',
    subtitleKey: 'wiki.teacher.stickers.subtitle',
    icon: 'star',
    color: colors.secondary[500],
    topics: [
      {
        id: 'award',
        titleKey: 'wiki.teacher.stickers.award.title',
        descriptionKey: 'wiki.teacher.stickers.award.description',
        steps: [
          { textKey: 'wiki.teacher.stickers.award.step1' },
          { textKey: 'wiki.teacher.stickers.award.step2' },
          { textKey: 'wiki.teacher.stickers.award.step3' },
        ],
      },
    ],
  },
  {
    id: 'certifications',
    titleKey: 'wiki.teacher.certifications.title',
    subtitleKey: 'wiki.teacher.certifications.subtitle',
    icon: 'ribbon',
    color: colors.accent.indigo[600],
    topics: [
      {
        id: 'review',
        titleKey: 'wiki.teacher.certifications.review.title',
        descriptionKey: 'wiki.teacher.certifications.review.description',
      },
    ],
  },
  {
    id: 'meeting',
    titleKey: 'wiki.teacher.meeting.title',
    subtitleKey: 'wiki.teacher.meeting.subtitle',
    icon: 'videocam',
    color: colors.accent.sky[600],
    topics: [
      {
        id: 'setup',
        titleKey: 'wiki.teacher.meeting.setup.title',
        descriptionKey: 'wiki.teacher.meeting.setup.description',
        steps: [
          { textKey: 'wiki.teacher.meeting.setup.step1' },
          { textKey: 'wiki.teacher.meeting.setup.step2' },
          { textKey: 'wiki.teacher.meeting.setup.step3' },
        ],
      },
    ],
  },
  {
    id: 'profile',
    titleKey: 'wiki.teacher.profile.title',
    subtitleKey: 'wiki.teacher.profile.subtitle',
    icon: 'person-circle',
    color: colors.neutral[500],
    topics: [
      {
        id: 'notifications',
        titleKey: 'wiki.teacher.profile.notifications.title',
        descriptionKey: 'wiki.teacher.profile.notifications.description',
      },
      {
        id: 'language',
        titleKey: 'wiki.teacher.profile.language.title',
        descriptionKey: 'wiki.teacher.profile.language.description',
      },
    ],
  },
];
