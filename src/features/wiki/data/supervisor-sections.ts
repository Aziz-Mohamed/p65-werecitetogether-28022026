import { colors } from '@/theme/colors';
import type { WikiSection } from '../types/wiki.types';

export const supervisorSections: WikiSection[] = [
  {
    id: 'dashboard',
    titleKey: 'wiki.supervisor.dashboard.title',
    subtitleKey: 'wiki.supervisor.dashboard.subtitle',
    icon: 'home',
    color: colors.primary[500],
    topics: [
      {
        id: 'overview',
        titleKey: 'wiki.supervisor.dashboard.overview.title',
        descriptionKey: 'wiki.supervisor.dashboard.overview.description',
      },
      {
        id: 'inactiveAlerts',
        titleKey: 'wiki.supervisor.dashboard.inactiveAlerts.title',
        descriptionKey: 'wiki.supervisor.dashboard.inactiveAlerts.description',
        tipKey: 'wiki.supervisor.dashboard.inactiveAlerts.tip',
      },
    ],
  },
  {
    id: 'teachers',
    titleKey: 'wiki.supervisor.teachers.title',
    subtitleKey: 'wiki.supervisor.teachers.subtitle',
    icon: 'school',
    color: colors.accent.indigo[500],
    topics: [
      {
        id: 'list',
        titleKey: 'wiki.supervisor.teachers.list.title',
        descriptionKey: 'wiki.supervisor.teachers.list.description',
      },
      {
        id: 'details',
        titleKey: 'wiki.supervisor.teachers.details.title',
        descriptionKey: 'wiki.supervisor.teachers.details.description',
        steps: [
          { textKey: 'wiki.supervisor.teachers.details.step1' },
          { textKey: 'wiki.supervisor.teachers.details.step2' },
          { textKey: 'wiki.supervisor.teachers.details.step3' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    titleKey: 'wiki.supervisor.reports.title',
    subtitleKey: 'wiki.supervisor.reports.subtitle',
    icon: 'bar-chart',
    color: colors.accent.violet[500],
    topics: [
      {
        id: 'sessionsPerTeacher',
        titleKey: 'wiki.supervisor.reports.sessionsPerTeacher.title',
        descriptionKey: 'wiki.supervisor.reports.sessionsPerTeacher.description',
      },
      {
        id: 'ratings',
        titleKey: 'wiki.supervisor.reports.ratings.title',
        descriptionKey: 'wiki.supervisor.reports.ratings.description',
      },
    ],
  },
  {
    id: 'himam',
    titleKey: 'wiki.supervisor.himam.title',
    subtitleKey: 'wiki.supervisor.himam.subtitle',
    icon: 'trophy',
    color: colors.secondary[600],
    topics: [
      {
        id: 'events',
        titleKey: 'wiki.supervisor.himam.events.title',
        descriptionKey: 'wiki.supervisor.himam.events.description',
      },
      {
        id: 'registrations',
        titleKey: 'wiki.supervisor.himam.registrations.title',
        descriptionKey: 'wiki.supervisor.himam.registrations.description',
      },
      {
        id: 'pairings',
        titleKey: 'wiki.supervisor.himam.pairings.title',
        descriptionKey: 'wiki.supervisor.himam.pairings.description',
        steps: [
          { textKey: 'wiki.supervisor.himam.pairings.step1' },
          { textKey: 'wiki.supervisor.himam.pairings.step2' },
          { textKey: 'wiki.supervisor.himam.pairings.step3' },
        ],
        tipKey: 'wiki.supervisor.himam.pairings.tip',
      },
    ],
  },
  {
    id: 'certifications',
    titleKey: 'wiki.supervisor.certifications.title',
    subtitleKey: 'wiki.supervisor.certifications.subtitle',
    icon: 'ribbon',
    color: colors.accent.indigo[600],
    topics: [
      {
        id: 'queue',
        titleKey: 'wiki.supervisor.certifications.queue.title',
        descriptionKey: 'wiki.supervisor.certifications.queue.description',
        steps: [
          { textKey: 'wiki.supervisor.certifications.queue.step1' },
          { textKey: 'wiki.supervisor.certifications.queue.step2' },
          { textKey: 'wiki.supervisor.certifications.queue.step3' },
        ],
      },
    ],
  },
  {
    id: 'rewards',
    titleKey: 'wiki.supervisor.rewards.title',
    subtitleKey: 'wiki.supervisor.rewards.subtitle',
    icon: 'gift',
    color: colors.accent.rose[500],
    topics: [
      {
        id: 'distribute',
        titleKey: 'wiki.supervisor.rewards.distribute.title',
        descriptionKey: 'wiki.supervisor.rewards.distribute.description',
      },
    ],
  },
  {
    id: 'profile',
    titleKey: 'wiki.supervisor.profile.title',
    subtitleKey: 'wiki.supervisor.profile.subtitle',
    icon: 'person-circle',
    color: colors.neutral[500],
    topics: [
      {
        id: 'supervised',
        titleKey: 'wiki.supervisor.profile.supervised.title',
        descriptionKey: 'wiki.supervisor.profile.supervised.description',
      },
      {
        id: 'notifications',
        titleKey: 'wiki.supervisor.profile.notifications.title',
        descriptionKey: 'wiki.supervisor.profile.notifications.description',
      },
    ],
  },
];
