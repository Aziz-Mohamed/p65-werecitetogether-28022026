import { StyleSheet, type DimensionValue } from 'react-native';
import { typography } from '@/theme/typography';
import { lightTheme, colors, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(22),
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: normalize(2),
  },

  // Today at a Glance
  glanceCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  glanceTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  glancePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  pillText: {
    ...typography.textStyles.label,
    fontFamily: typography.fontFamily.semiBold,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
    marginTop: normalize(2),
  },
  alertText: {
    ...typography.textStyles.label,
    color: semantic.error,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%' as DimensionValue,
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(24),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },

  // Children quick status
  childrenList: {
    gap: spacing.md,
  },
  childCard: {
    padding: spacing.md,
  },
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  childInfo: {
    flex: 1,
    minWidth: 0,
  },
  childName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  childMeta: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    marginTop: normalize(1),
  },
  childBadges: {
    alignItems: 'flex-end',
    gap: normalize(2),
  },
  rateText: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    fontFamily: typography.fontFamily.semiBold,
  },

  // Recent Sessions
  sessionCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  sessionChildName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
    flex: 1,
  },
  sessionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  sessionDateText: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  sessionWeekday: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  sessionScoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    paddingHorizontal: normalize(10),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },
  scorePillLabel: {
    fontSize: normalize(11),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[500],
  },
  scorePillValue: {
    fontSize: normalize(12),
    fontFamily: typography.fontFamily.bold,
  },
  sessionNotesPreview: {
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: normalize(8),
    borderLeftWidth: 3,
    borderLeftColor: colors.neutral[200],
  },
  sessionNotesText: {
    ...typography.textStyles.caption,
    color: colors.neutral[600],
    fontStyle: 'italic',
  },
  sessionTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: normalize(4),
  },
  sessionTapText: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },

  // Empty
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
});
