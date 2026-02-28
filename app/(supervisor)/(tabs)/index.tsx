import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useAssignedTeachers, useFlaggedReviews } from '@/features/supervisor/hooks/useSupervisor';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral, semantic, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

const WARNING_RATING_THRESHOLD = 3.5;

export default function SupervisorDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const theme = useRoleTheme();
  const supervisorId = profile?.id ?? '';
  const displayName = profile?.display_name ?? profile?.full_name ?? '';

  const [selectedProgramId] = useState<string | undefined>(undefined);

  const { data: teachers = [] } = useAssignedTeachers(supervisorId, selectedProgramId);
  const { data: flaggedReviews = [] } = useFlaggedReviews(selectedProgramId);

  const teachersWithLowRating = teachers.filter(
    (t) => t.average_rating !== null && t.average_rating < WARNING_RATING_THRESHOLD,
  );

  const activeFlagged = flaggedReviews.filter((r) => !r.is_excluded);

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: displayName })}
            </Text>
          </View>
          <Badge label={t('roles.supervisor')} variant="indigo" size="md" />
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.primary }]}>
              {teachers.length}
            </Text>
            <Text style={styles.statLabel}>
              {t('supervisor.teachers')}
            </Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: activeFlagged.length > 0 ? semantic.error : neutral[400] }]}>
              {activeFlagged.length}
            </Text>
            <Text style={styles.statLabel}>
              {t('supervisor.flaggedReviews')}
            </Text>
          </Card>
        </View>

        {/* Low Rating Teachers */}
        {teachersWithLowRating.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t('supervisor.teachersNeedingAttention')}
            </Text>
            {teachersWithLowRating.map((teacher) => (
              <Card key={teacher.id} variant="outlined" style={styles.alertCard}>
                <View style={styles.alertRow}>
                  <Ionicons name="warning" size={20} color={semantic.warning} />
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertName}>
                      {teacher.display_name ?? teacher.full_name}
                    </Text>
                    <Text style={styles.alertMeta}>
                      {t('supervisor.ratingBelow', {
                        rating: teacher.average_rating?.toFixed(1),
                        threshold: WARNING_RATING_THRESHOLD,
                      })}
                    </Text>
                  </View>
                  {teacher.has_flagged_reviews && (
                    <Badge label={t('supervisor.flagged')} variant="error" size="sm" />
                  )}
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Recent Flagged Reviews */}
        {activeFlagged.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>
              {t('supervisor.recentFlaggedReviews')}
            </Text>
            {activeFlagged.slice(0, 5).map((review) => (
              <Card key={review.id} variant="outlined" style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewTeacher}>{review.teacher_name}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={accent.yellow[500]} />
                    <Text style={styles.ratingText}>{review.rating}</Text>
                  </View>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment} numberOfLines={2}>
                    {review.comment}
                  </Text>
                )}
                <Text style={styles.reviewMeta}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </Card>
            ))}
          </>
        )}

        {/* Empty state */}
        {teachers.length === 0 && !selectedProgramId && (
          <Card variant="outlined" style={styles.emptyCard}>
            <Ionicons name="shield-outline" size={32} color={neutral[300]} />
            <Text style={styles.emptyText}>
              {t('supervisor.selectProgram')}
            </Text>
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBlockEnd: spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(22),
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingBlock: spacing.lg,
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(28),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
    marginBlockStart: spacing.xs,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  alertCard: {
    padding: spacing.md,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  alertInfo: {
    flex: 1,
    gap: 2,
  },
  alertName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  alertMeta: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  reviewCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewTeacher: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    ...typography.textStyles.caption,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
  },
  reviewComment: {
    ...typography.textStyles.caption,
    color: neutral[600],
  },
  reviewMeta: {
    ...typography.textStyles.label,
    color: neutral[400],
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
