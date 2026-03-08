import { StyleSheet } from 'react-native';

import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import { shadows } from '@/theme/shadows';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
    paddingBottom: 110,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    zIndex: 10,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },

  // View Mode Dropdown
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewModeLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(14),
    color: colors.primary[500],
  },
  viewModeDropdown: {
    position: 'absolute',
    top: '100%',
    end: 0,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: normalize(4),
    minWidth: normalize(100),
    ...shadows.lg,
  },
  viewModeOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  viewModeOptionActive: {
    backgroundColor: colors.primary[50],
  },
  viewModeOptionText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[600],
  },
  viewModeOptionTextActive: {
    color: colors.primary[600],
    fontFamily: typography.fontFamily.semiBold,
  },

  // Health Summary
  healthCard: {
    padding: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  healthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  healthLevel: {
    alignItems: 'center',
    justifyContent: 'center',
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    borderWidth: 3,
    borderColor: colors.primary[200],
  },
  healthLevelNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(22),
    color: colors.primary[600],
  },
  healthLevelTotal: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(11),
    color: colors.neutral[400],
    marginTop: -2,
  },
  healthBreakdown: {
    flex: 1,
    gap: normalize(4),
  },
  healthLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  healthDot: {
    width: normalize(8),
    height: normalize(8),
    borderRadius: normalize(4),
  },
  healthCount: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: colors.neutral[800],
    minWidth: normalize(20),
  },
  healthLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(13),
    color: colors.neutral[500],
  },

  // All-fresh success
  allFreshCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  allFreshText: {
    flex: 1,
  },
  allFreshTitle: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(14),
    color: colors.primary[700],
  },
  allFreshDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(12),
    color: colors.neutral[500],
    marginTop: normalize(2),
  },

  // Revision Homework
  planCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  planTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(14),
    color: colors.neutral[800],
  },
  planBadge: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: radius.full,
    minWidth: normalize(24),
    alignItems: 'center',
  },
  planBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(11),
    color: colors.primary[600],
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[100],
  },
  planRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  removeButton: {
    padding: spacing.sm,
    borderRadius: radius.full,
  },
  removeButtonPressed: {
    backgroundColor: colors.neutral[100],
  },

  // Section Headers
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sectionHeader: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    fontSize: normalize(15),
  },

  // Rub Rows
  rubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.xs,
  },
  rubRowPressed: {
    opacity: 0.7,
  },
  rubDot: {
    width: normalize(10),
    height: normalize(10),
    borderRadius: normalize(5),
  },
  rubInfo: {
    flex: 1,
    gap: normalize(4),
  },
  rubTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(14),
    color: colors.neutral[900],
  },
  rubChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: radius.full,
  },
  rubChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(11),
  },

  // Group count badge
  groupCountBadge: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: radius.full,
  },
  groupCountText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(11),
    color: colors.neutral[600],
  },

  // Quick Links
  quickLinks: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  pillText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
  },
});
