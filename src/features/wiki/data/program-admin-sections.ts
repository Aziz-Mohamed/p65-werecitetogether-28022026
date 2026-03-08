import { colors } from '@/theme/colors';
import type { WikiSection } from '../types/wiki.types';

export const programAdminSections: WikiSection[] = [
  {
    id: 'dashboard',
    titleKey: 'wiki.programAdmin.dashboard.title',
    subtitleKey: 'wiki.programAdmin.dashboard.subtitle',
    icon: 'home',
    color: colors.primary[500],
    topics: [
      {
        id: 'overview',
        titleKey: 'wiki.programAdmin.dashboard.overview.title',
        descriptionKey: 'wiki.programAdmin.dashboard.overview.description',
      },
      {
        id: 'pendingEnrollments',
        titleKey: 'wiki.programAdmin.dashboard.pendingEnrollments.title',
        descriptionKey: 'wiki.programAdmin.dashboard.pendingEnrollments.description',
        tipKey: 'wiki.programAdmin.dashboard.pendingEnrollments.tip',
      },
    ],
  },
  {
    id: 'classes',
    titleKey: 'wiki.programAdmin.classes.title',
    subtitleKey: 'wiki.programAdmin.classes.subtitle',
    icon: 'albums',
    color: colors.accent.violet[500],
    topics: [
      {
        id: 'create',
        titleKey: 'wiki.programAdmin.classes.create.title',
        descriptionKey: 'wiki.programAdmin.classes.create.description',
        steps: [
          { textKey: 'wiki.programAdmin.classes.create.step1' },
          { textKey: 'wiki.programAdmin.classes.create.step2' },
          { textKey: 'wiki.programAdmin.classes.create.step3' },
          { textKey: 'wiki.programAdmin.classes.create.step4' },
        ],
      },
      {
        id: 'manage',
        titleKey: 'wiki.programAdmin.classes.manage.title',
        descriptionKey: 'wiki.programAdmin.classes.manage.description',
      },
      {
        id: 'waitlist',
        titleKey: 'wiki.programAdmin.classes.waitlist.title',
        descriptionKey: 'wiki.programAdmin.classes.waitlist.description',
        tipKey: 'wiki.programAdmin.classes.waitlist.tip',
      },
    ],
  },
  {
    id: 'team',
    titleKey: 'wiki.programAdmin.team.title',
    subtitleKey: 'wiki.programAdmin.team.subtitle',
    icon: 'people',
    color: colors.accent.indigo[500],
    topics: [
      {
        id: 'viewTeam',
        titleKey: 'wiki.programAdmin.team.viewTeam.title',
        descriptionKey: 'wiki.programAdmin.team.viewTeam.description',
      },
      {
        id: 'addMembers',
        titleKey: 'wiki.programAdmin.team.addMembers.title',
        descriptionKey: 'wiki.programAdmin.team.addMembers.description',
        steps: [
          { textKey: 'wiki.programAdmin.team.addMembers.step1' },
          { textKey: 'wiki.programAdmin.team.addMembers.step2' },
          { textKey: 'wiki.programAdmin.team.addMembers.step3' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    titleKey: 'wiki.programAdmin.reports.title',
    subtitleKey: 'wiki.programAdmin.reports.subtitle',
    icon: 'bar-chart',
    color: colors.accent.sky[500],
    topics: [
      {
        id: 'teacherWorkload',
        titleKey: 'wiki.programAdmin.reports.teacherWorkload.title',
        descriptionKey: 'wiki.programAdmin.reports.teacherWorkload.description',
      },
      {
        id: 'sessionTrends',
        titleKey: 'wiki.programAdmin.reports.sessionTrends.title',
        descriptionKey: 'wiki.programAdmin.reports.sessionTrends.description',
      },
      {
        id: 'enrollmentMetrics',
        titleKey: 'wiki.programAdmin.reports.enrollmentMetrics.title',
        descriptionKey: 'wiki.programAdmin.reports.enrollmentMetrics.description',
      },
    ],
  },
  {
    id: 'programs',
    titleKey: 'wiki.programAdmin.programs.title',
    subtitleKey: 'wiki.programAdmin.programs.subtitle',
    icon: 'library',
    color: colors.primary[600],
    topics: [
      {
        id: 'details',
        titleKey: 'wiki.programAdmin.programs.details.title',
        descriptionKey: 'wiki.programAdmin.programs.details.description',
      },
      {
        id: 'tracks',
        titleKey: 'wiki.programAdmin.programs.tracks.title',
        descriptionKey: 'wiki.programAdmin.programs.tracks.description',
      },
    ],
  },
  {
    id: 'certifications',
    titleKey: 'wiki.programAdmin.certifications.title',
    subtitleKey: 'wiki.programAdmin.certifications.subtitle',
    icon: 'ribbon',
    color: colors.accent.indigo[600],
    topics: [
      {
        id: 'queue',
        titleKey: 'wiki.programAdmin.certifications.queue.title',
        descriptionKey: 'wiki.programAdmin.certifications.queue.description',
      },
    ],
  },
  {
    id: 'rewards',
    titleKey: 'wiki.programAdmin.rewards.title',
    subtitleKey: 'wiki.programAdmin.rewards.subtitle',
    icon: 'gift',
    color: colors.accent.rose[500],
    topics: [
      {
        id: 'distribute',
        titleKey: 'wiki.programAdmin.rewards.distribute.title',
        descriptionKey: 'wiki.programAdmin.rewards.distribute.description',
      },
    ],
  },
  {
    id: 'profile',
    titleKey: 'wiki.programAdmin.profile.title',
    subtitleKey: 'wiki.programAdmin.profile.subtitle',
    icon: 'person-circle',
    color: colors.neutral[500],
    topics: [
      {
        id: 'notifications',
        titleKey: 'wiki.programAdmin.profile.notifications.title',
        descriptionKey: 'wiki.programAdmin.profile.notifications.description',
      },
      {
        id: 'language',
        titleKey: 'wiki.programAdmin.profile.language.title',
        descriptionKey: 'wiki.programAdmin.profile.language.description',
      },
    ],
  },
];
