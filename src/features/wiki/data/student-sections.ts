import { colors } from '@/theme/colors';
import type { WikiSection } from '../types/wiki.types';

export const studentSections: WikiSection[] = [
  {
    id: 'dashboard',
    titleKey: 'wiki.student.dashboard.title',
    subtitleKey: 'wiki.student.dashboard.subtitle',
    icon: 'home',
    color: colors.primary[500],
    topics: [
      {
        id: 'streak',
        titleKey: 'wiki.student.dashboard.streak.title',
        descriptionKey: 'wiki.student.dashboard.streak.description',
        tipKey: 'wiki.student.dashboard.streak.tip',
      },
      {
        id: 'stats',
        titleKey: 'wiki.student.dashboard.stats.title',
        descriptionKey: 'wiki.student.dashboard.stats.description',
      },
      {
        id: 'upcomingSessions',
        titleKey: 'wiki.student.dashboard.upcomingSessions.title',
        descriptionKey: 'wiki.student.dashboard.upcomingSessions.description',
      },
      {
        id: 'quickActions',
        titleKey: 'wiki.student.dashboard.quickActions.title',
        descriptionKey: 'wiki.student.dashboard.quickActions.description',
        steps: [
          { textKey: 'wiki.student.dashboard.quickActions.step1' },
          { textKey: 'wiki.student.dashboard.quickActions.step2' },
        ],
      },
    ],
  },
  {
    id: 'programs',
    titleKey: 'wiki.student.programs.title',
    subtitleKey: 'wiki.student.programs.subtitle',
    icon: 'library',
    color: colors.accent.indigo[500],
    topics: [
      {
        id: 'browse',
        titleKey: 'wiki.student.programs.browse.title',
        descriptionKey: 'wiki.student.programs.browse.description',
        steps: [
          { textKey: 'wiki.student.programs.browse.step1' },
          { textKey: 'wiki.student.programs.browse.step2' },
          { textKey: 'wiki.student.programs.browse.step3' },
        ],
      },
      {
        id: 'enroll',
        titleKey: 'wiki.student.programs.enroll.title',
        descriptionKey: 'wiki.student.programs.enroll.description',
        steps: [
          { textKey: 'wiki.student.programs.enroll.step1' },
          { textKey: 'wiki.student.programs.enroll.step2' },
          { textKey: 'wiki.student.programs.enroll.step3' },
        ],
        tipKey: 'wiki.student.programs.enroll.tip',
      },
      {
        id: 'myPrograms',
        titleKey: 'wiki.student.programs.myPrograms.title',
        descriptionKey: 'wiki.student.programs.myPrograms.description',
      },
    ],
  },
  {
    id: 'memorization',
    titleKey: 'wiki.student.memorization.title',
    subtitleKey: 'wiki.student.memorization.subtitle',
    icon: 'book',
    color: colors.primary[600],
    topics: [
      {
        id: 'rubGrid',
        titleKey: 'wiki.student.memorization.rubGrid.title',
        descriptionKey: 'wiki.student.memorization.rubGrid.description',
        tipKey: 'wiki.student.memorization.rubGrid.tip',
      },
      {
        id: 'selfAssignment',
        titleKey: 'wiki.student.memorization.selfAssignment.title',
        descriptionKey: 'wiki.student.memorization.selfAssignment.description',
        steps: [
          { textKey: 'wiki.student.memorization.selfAssignment.step1' },
          { textKey: 'wiki.student.memorization.selfAssignment.step2' },
          { textKey: 'wiki.student.memorization.selfAssignment.step3' },
        ],
      },
      {
        id: 'progress',
        titleKey: 'wiki.student.memorization.progress.title',
        descriptionKey: 'wiki.student.memorization.progress.description',
      },
    ],
  },
  {
    id: 'revision',
    titleKey: 'wiki.student.revision.title',
    subtitleKey: 'wiki.student.revision.subtitle',
    icon: 'refresh',
    color: colors.accent.violet[500],
    topics: [
      {
        id: 'freshness',
        titleKey: 'wiki.student.revision.freshness.title',
        descriptionKey: 'wiki.student.revision.freshness.description',
        tipKey: 'wiki.student.revision.freshness.tip',
      },
      {
        id: 'revisionSheets',
        titleKey: 'wiki.student.revision.revisionSheets.title',
        descriptionKey: 'wiki.student.revision.revisionSheets.description',
        steps: [
          { textKey: 'wiki.student.revision.revisionSheets.step1' },
          { textKey: 'wiki.student.revision.revisionSheets.step2' },
          { textKey: 'wiki.student.revision.revisionSheets.step3' },
        ],
      },
    ],
  },
  {
    id: 'journey',
    titleKey: 'wiki.student.journey.title',
    subtitleKey: 'wiki.student.journey.subtitle',
    icon: 'map',
    color: colors.secondary[500],
    topics: [
      {
        id: 'milestones',
        titleKey: 'wiki.student.journey.milestones.title',
        descriptionKey: 'wiki.student.journey.milestones.description',
      },
      {
        id: 'badges',
        titleKey: 'wiki.student.journey.badges.title',
        descriptionKey: 'wiki.student.journey.badges.description',
        tipKey: 'wiki.student.journey.badges.tip',
      },
    ],
  },
  {
    id: 'sessions',
    titleKey: 'wiki.student.sessions.title',
    subtitleKey: 'wiki.student.sessions.subtitle',
    icon: 'calendar',
    color: colors.accent.sky[500],
    topics: [
      {
        id: 'viewSchedule',
        titleKey: 'wiki.student.sessions.viewSchedule.title',
        descriptionKey: 'wiki.student.sessions.viewSchedule.description',
        steps: [
          { textKey: 'wiki.student.sessions.viewSchedule.step1' },
          { textKey: 'wiki.student.sessions.viewSchedule.step2' },
        ],
      },
      {
        id: 'sessionDetails',
        titleKey: 'wiki.student.sessions.sessionDetails.title',
        descriptionKey: 'wiki.student.sessions.sessionDetails.description',
      },
      {
        id: 'scores',
        titleKey: 'wiki.student.sessions.scores.title',
        descriptionKey: 'wiki.student.sessions.scores.description',
        tipKey: 'wiki.student.sessions.scores.tip',
      },
    ],
  },
  {
    id: 'himam',
    titleKey: 'wiki.student.himam.title',
    subtitleKey: 'wiki.student.himam.subtitle',
    icon: 'trophy',
    color: colors.secondary[600],
    topics: [
      {
        id: 'overview',
        titleKey: 'wiki.student.himam.overview.title',
        descriptionKey: 'wiki.student.himam.overview.description',
      },
      {
        id: 'registration',
        titleKey: 'wiki.student.himam.registration.title',
        descriptionKey: 'wiki.student.himam.registration.description',
        steps: [
          { textKey: 'wiki.student.himam.registration.step1' },
          { textKey: 'wiki.student.himam.registration.step2' },
          { textKey: 'wiki.student.himam.registration.step3' },
          { textKey: 'wiki.student.himam.registration.step4' },
        ],
        tipKey: 'wiki.student.himam.registration.tip',
      },
      {
        id: 'tracks',
        titleKey: 'wiki.student.himam.tracks.title',
        descriptionKey: 'wiki.student.himam.tracks.description',
      },
      {
        id: 'pairing',
        titleKey: 'wiki.student.himam.pairing.title',
        descriptionKey: 'wiki.student.himam.pairing.description',
      },
      {
        id: 'progress',
        titleKey: 'wiki.student.himam.progress.title',
        descriptionKey: 'wiki.student.himam.progress.description',
        steps: [
          { textKey: 'wiki.student.himam.progress.step1' },
          { textKey: 'wiki.student.himam.progress.step2' },
          { textKey: 'wiki.student.himam.progress.step3' },
        ],
      },
    ],
  },
  {
    id: 'leaderboard',
    titleKey: 'wiki.student.leaderboard.title',
    subtitleKey: 'wiki.student.leaderboard.subtitle',
    icon: 'podium',
    color: colors.accent.rose[500],
    topics: [
      {
        id: 'rankings',
        titleKey: 'wiki.student.leaderboard.rankings.title',
        descriptionKey: 'wiki.student.leaderboard.rankings.description',
      },
    ],
  },
  {
    id: 'certificates',
    titleKey: 'wiki.student.certificates.title',
    subtitleKey: 'wiki.student.certificates.subtitle',
    icon: 'ribbon',
    color: colors.accent.indigo[600],
    topics: [
      {
        id: 'view',
        titleKey: 'wiki.student.certificates.view.title',
        descriptionKey: 'wiki.student.certificates.view.description',
      },
      {
        id: 'qr',
        titleKey: 'wiki.student.certificates.qr.title',
        descriptionKey: 'wiki.student.certificates.qr.description',
        tipKey: 'wiki.student.certificates.qr.tip',
      },
    ],
  },
  {
    id: 'mutoon',
    titleKey: 'wiki.student.mutoon.title',
    subtitleKey: 'wiki.student.mutoon.subtitle',
    icon: 'document-text',
    color: colors.neutral[600],
    topics: [
      {
        id: 'overview',
        titleKey: 'wiki.student.mutoon.overview.title',
        descriptionKey: 'wiki.student.mutoon.overview.description',
      },
    ],
  },
  {
    id: 'attendance',
    titleKey: 'wiki.student.attendance.title',
    subtitleKey: 'wiki.student.attendance.subtitle',
    icon: 'checkmark-circle',
    color: colors.primary[500],
    topics: [
      {
        id: 'howItWorks',
        titleKey: 'wiki.student.attendance.howItWorks.title',
        descriptionKey: 'wiki.student.attendance.howItWorks.description',
      },
    ],
  },
  {
    id: 'profile',
    titleKey: 'wiki.student.profile.title',
    subtitleKey: 'wiki.student.profile.subtitle',
    icon: 'person-circle',
    color: colors.neutral[500],
    topics: [
      {
        id: 'badges',
        titleKey: 'wiki.student.profile.badges.title',
        descriptionKey: 'wiki.student.profile.badges.description',
      },
      {
        id: 'notifications',
        titleKey: 'wiki.student.profile.notifications.title',
        descriptionKey: 'wiki.student.profile.notifications.description',
      },
      {
        id: 'language',
        titleKey: 'wiki.student.profile.language.title',
        descriptionKey: 'wiki.student.profile.language.description',
      },
    ],
  },
];
