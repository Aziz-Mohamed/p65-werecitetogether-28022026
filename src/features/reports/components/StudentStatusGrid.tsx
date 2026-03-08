import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type { StudentQuickStatus } from '../types/reports.types';
import { StatusDot } from './StatusDot';
import { getScoreLabel } from '../utils/thresholds';
import { SkeletonLoader } from '@/components/feedback';
import { lightTheme, secondary, accent, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { typography } from '@/theme/typography';

const SCORE_LABEL_COLORS: Record<string, string> = {
  excellent: colors.semantic.success,
  good: accent.teal[600],
  developing: colors.semantic.warning,
  needsWork: colors.semantic.error,
};

interface StudentStatusGridProps {
  students: StudentQuickStatus[];
  onStudentPress?: (studentId: string) => void;
  isLoading?: boolean;
}

export function StudentStatusGrid({
  students,
  onStudentPress,
  isLoading,
}: StudentStatusGridProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>{t('insights.studentsAtGlance')}</Text>
        {[1, 2, 3].map((i) => (
          <SkeletonLoader key={i} width="100%" height={48} borderRadius={radius.sm} style={{ marginBottom: spacing.sm }} />
        ))}
      </View>
    );
  }

  if (students.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('insights.studentsAtGlance')} ({students.length})
      </Text>
      {students.map((student) => (
        <Pressable
          key={student.studentId}
          style={styles.row}
          onPress={() => onStudentPress?.(student.studentId)}
          accessibilityRole="button"
          accessibilityLabel={student.fullName}
        >
          <StatusDot status={student.status} />
          <Text style={styles.name} numberOfLines={1}>{student.fullName}</Text>
          <View style={styles.meta}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>L{student.currentLevel}</Text>
            </View>
            {student.currentStreak > 0 && (
              <View style={styles.streakContainer}>
                <Ionicons name="flame" size={14} color={secondary[500]} />
                <Text style={styles.streakText}>{student.currentStreak}</Text>
              </View>
            )}
            <Text style={[
              styles.scoreText,
              student.recentAvgScore > 0 && { color: SCORE_LABEL_COLORS[getScoreLabel(student.recentAvgScore)] ?? lightTheme.text },
            ]}>
              {student.recentAvgScore > 0 ? student.recentAvgScore.toFixed(1) : '--'}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: lightTheme.border,
    padding: spacing.base,
  },
  sectionTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.border,
  },
  name: {
    flex: 1,
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    backgroundColor: lightTheme.background,
    borderRadius: radius.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    color: lightTheme.textSecondary,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  streakText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: typography.lineHeight.xs,
    color: secondary[600],
  },
  scoreText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.sm,
    color: lightTheme.text,
    minWidth: 28,
    textAlign: 'auto',
  },
});
