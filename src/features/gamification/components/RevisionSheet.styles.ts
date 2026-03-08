import { StyleSheet } from 'react-native';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: lightTheme.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopStartRadius: radius.xl,
    borderTopEndRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  headerLeft: {
    flex: 1,
    gap: normalize(2),
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  verseRange: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(13),
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
  freshnessChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginStart: spacing.sm,
  },
  freshnessText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(12),
    color: colors.neutral[700],
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.base,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[500],
  },
  infoValue: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: colors.neutral[800],
  },

  // Freshness bar
  freshnessBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  freshnessBarTrack: {
    flex: 1,
    height: normalize(6),
    backgroundColor: colors.neutral[200],
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  freshnessBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  freshnessPercent: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(12),
    color: colors.neutral[600],
    minWidth: normalize(32),
    textAlign: 'auto',
  },

  // Actions
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.7,
  },
  actionText: {
    flex: 1,
    gap: normalize(2),
  },
  actionLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(15),
  },
  actionDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(12),
    color: colors.neutral[500],
  },

  // Student plan button
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.primary[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  planButtonDisabled: {
    opacity: 0.8,
    borderColor: colors.primary[100],
  },
  planButtonText: {
    flex: 1,
    gap: normalize(2),
  },
  planButtonLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(15),
  },
  planButtonDesc: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(12),
    color: colors.neutral[500],
  },

  // Info message (dormant / no self-assign)
  infoMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
  },
  infoMessageText: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    color: colors.neutral[600],
  },

  // Cancel
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelLabel: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[500],
  },
});
