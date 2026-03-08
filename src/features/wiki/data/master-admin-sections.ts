import { colors } from '@/theme/colors';
import type { WikiSection } from '../types/wiki.types';

export const masterAdminSections: WikiSection[] = [
  {
    id: 'dashboard',
    titleKey: 'wiki.masterAdmin.dashboard.title',
    subtitleKey: 'wiki.masterAdmin.dashboard.subtitle',
    icon: 'home',
    color: colors.primary[500],
    topics: [
      {
        id: 'overview',
        titleKey: 'wiki.masterAdmin.dashboard.overview.title',
        descriptionKey: 'wiki.masterAdmin.dashboard.overview.description',
      },
      {
        id: 'quickActions',
        titleKey: 'wiki.masterAdmin.dashboard.quickActions.title',
        descriptionKey: 'wiki.masterAdmin.dashboard.quickActions.description',
      },
    ],
  },
  {
    id: 'users',
    titleKey: 'wiki.masterAdmin.users.title',
    subtitleKey: 'wiki.masterAdmin.users.subtitle',
    icon: 'person-outline',
    color: colors.primary[600],
    topics: [
      {
        id: 'search',
        titleKey: 'wiki.masterAdmin.users.search.title',
        descriptionKey: 'wiki.masterAdmin.users.search.description',
      },
      {
        id: 'details',
        titleKey: 'wiki.masterAdmin.users.details.title',
        descriptionKey: 'wiki.masterAdmin.users.details.description',
      },
    ],
  },
  {
    id: 'teachers',
    titleKey: 'wiki.masterAdmin.teachers.title',
    subtitleKey: 'wiki.masterAdmin.teachers.subtitle',
    icon: 'school',
    color: colors.accent.indigo[500],
    topics: [
      {
        id: 'create',
        titleKey: 'wiki.masterAdmin.teachers.create.title',
        descriptionKey: 'wiki.masterAdmin.teachers.create.description',
        steps: [
          { textKey: 'wiki.masterAdmin.teachers.create.step1' },
          { textKey: 'wiki.masterAdmin.teachers.create.step2' },
          { textKey: 'wiki.masterAdmin.teachers.create.step3' },
        ],
      },
      {
        id: 'manage',
        titleKey: 'wiki.masterAdmin.teachers.manage.title',
        descriptionKey: 'wiki.masterAdmin.teachers.manage.description',
      },
    ],
  },
  {
    id: 'students',
    titleKey: 'wiki.masterAdmin.students.title',
    subtitleKey: 'wiki.masterAdmin.students.subtitle',
    icon: 'people',
    color: colors.primary[500],
    topics: [
      {
        id: 'create',
        titleKey: 'wiki.masterAdmin.students.create.title',
        descriptionKey: 'wiki.masterAdmin.students.create.description',
        steps: [
          { textKey: 'wiki.masterAdmin.students.create.step1' },
          { textKey: 'wiki.masterAdmin.students.create.step2' },
          { textKey: 'wiki.masterAdmin.students.create.step3' },
        ],
      },
      {
        id: 'manage',
        titleKey: 'wiki.masterAdmin.students.manage.title',
        descriptionKey: 'wiki.masterAdmin.students.manage.description',
      },
    ],
  },
  {
    id: 'classes',
    titleKey: 'wiki.masterAdmin.classes.title',
    subtitleKey: 'wiki.masterAdmin.classes.subtitle',
    icon: 'albums',
    color: colors.accent.violet[500],
    topics: [
      {
        id: 'create',
        titleKey: 'wiki.masterAdmin.classes.create.title',
        descriptionKey: 'wiki.masterAdmin.classes.create.description',
        steps: [
          { textKey: 'wiki.masterAdmin.classes.create.step1' },
          { textKey: 'wiki.masterAdmin.classes.create.step2' },
          { textKey: 'wiki.masterAdmin.classes.create.step3' },
          { textKey: 'wiki.masterAdmin.classes.create.step4' },
        ],
      },
      {
        id: 'schedule',
        titleKey: 'wiki.masterAdmin.classes.schedule.title',
        descriptionKey: 'wiki.masterAdmin.classes.schedule.description',
      },
    ],
  },
  {
    id: 'programs',
    titleKey: 'wiki.masterAdmin.programs.title',
    subtitleKey: 'wiki.masterAdmin.programs.subtitle',
    icon: 'library',
    color: colors.primary[600],
    topics: [
      {
        id: 'create',
        titleKey: 'wiki.masterAdmin.programs.create.title',
        descriptionKey: 'wiki.masterAdmin.programs.create.description',
      },
      {
        id: 'tracks',
        titleKey: 'wiki.masterAdmin.programs.tracks.title',
        descriptionKey: 'wiki.masterAdmin.programs.tracks.description',
      },
      {
        id: 'team',
        titleKey: 'wiki.masterAdmin.programs.team.title',
        descriptionKey: 'wiki.masterAdmin.programs.team.description',
      },
    ],
  },
  {
    id: 'stickers',
    titleKey: 'wiki.masterAdmin.stickers.title',
    subtitleKey: 'wiki.masterAdmin.stickers.subtitle',
    icon: 'star',
    color: colors.secondary[500],
    topics: [
      {
        id: 'create',
        titleKey: 'wiki.masterAdmin.stickers.create.title',
        descriptionKey: 'wiki.masterAdmin.stickers.create.description',
        steps: [
          { textKey: 'wiki.masterAdmin.stickers.create.step1' },
          { textKey: 'wiki.masterAdmin.stickers.create.step2' },
          { textKey: 'wiki.masterAdmin.stickers.create.step3' },
        ],
      },
      {
        id: 'manage',
        titleKey: 'wiki.masterAdmin.stickers.manage.title',
        descriptionKey: 'wiki.masterAdmin.stickers.manage.description',
      },
    ],
  },
  {
    id: 'reports',
    titleKey: 'wiki.masterAdmin.reports.title',
    subtitleKey: 'wiki.masterAdmin.reports.subtitle',
    icon: 'bar-chart',
    color: colors.accent.rose[500],
    topics: [
      {
        id: 'types',
        titleKey: 'wiki.masterAdmin.reports.types.title',
        descriptionKey: 'wiki.masterAdmin.reports.types.description',
      },
    ],
  },
  {
    id: 'certifications',
    titleKey: 'wiki.masterAdmin.certifications.title',
    subtitleKey: 'wiki.masterAdmin.certifications.subtitle',
    icon: 'ribbon',
    color: colors.accent.indigo[600],
    topics: [
      {
        id: 'verify',
        titleKey: 'wiki.masterAdmin.certifications.verify.title',
        descriptionKey: 'wiki.masterAdmin.certifications.verify.description',
      },
    ],
  },
  {
    id: 'settings',
    titleKey: 'wiki.masterAdmin.settings.title',
    subtitleKey: 'wiki.masterAdmin.settings.subtitle',
    icon: 'settings',
    color: colors.neutral[600],
    topics: [
      {
        id: 'attendance',
        titleKey: 'wiki.masterAdmin.settings.attendance.title',
        descriptionKey: 'wiki.masterAdmin.settings.attendance.description',
      },
      {
        id: 'permissions',
        titleKey: 'wiki.masterAdmin.settings.permissions.title',
        descriptionKey: 'wiki.masterAdmin.settings.permissions.description',
      },
    ],
  },
  {
    id: 'passwordReset',
    titleKey: 'wiki.masterAdmin.passwordReset.title',
    subtitleKey: 'wiki.masterAdmin.passwordReset.subtitle',
    icon: 'key',
    color: colors.neutral[500],
    topics: [
      {
        id: 'reset',
        titleKey: 'wiki.masterAdmin.passwordReset.reset.title',
        descriptionKey: 'wiki.masterAdmin.passwordReset.reset.description',
        steps: [
          { textKey: 'wiki.masterAdmin.passwordReset.reset.step1' },
          { textKey: 'wiki.masterAdmin.passwordReset.reset.step2' },
          { textKey: 'wiki.masterAdmin.passwordReset.reset.step3' },
        ],
      },
    ],
  },
];
