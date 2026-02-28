import React from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui';
import { RatingBadge } from '@/components/RatingBadge';
import { useReviewsForTeacher } from '@/features/teacher-ratings/hooks/useTeacherRatings';
import { teacherRatingsService } from '@/features/teacher-ratings/services/teacher-ratings.service';
import type { TeacherSummary } from '../types';
import type { TeacherReview } from '@/features/teacher-ratings/types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, semantic, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';

interface TeacherDetailViewProps {
  teacher: TeacherSummary;
  programId: string;
  supervisorId: string;
  onExcludeReview?: (reviewId: string) => void;
}

export function TeacherDetailView({
  teacher,
  programId,
  onExcludeReview,
}: TeacherDetailViewProps) {
  const { t } = useTranslation();
  const { data: reviews = [] } = useReviewsForTeacher(teacher.id, programId);

  const flaggedReviews = reviews.filter((r) => r.rating <= 2);

  const renderReview = ({ item }: { item: TeacherReview }) => {
    const isFlagged = item.rating <= 2;

    return (
      <Card
        variant={isFlagged ? 'outlined' : 'default'}
        style={[styles.reviewCard, isFlagged && styles.reviewCardFlagged]}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= item.rating ? 'star' : 'star-outline'}
                size={14}
                color={accent.yellow[500]}
              />
            ))}
          </View>
          <Text style={styles.reviewDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        {item.tags && (item.tags as string[]).length > 0 && (
          <View style={styles.tagsRow}>
            {(item.tags as string[]).map((tag) => (
              <Badge key={tag} label={tag} variant="default" size="sm" />
            ))}
          </View>
        )}

        {item.comment && (
          <Text style={styles.reviewComment}>{item.comment}</Text>
        )}

        {isFlagged && !item.is_excluded && onExcludeReview && (
          <Button
            title={t('supervisor.excludeReview')}
            onPress={() => onExcludeReview(item.id)}
            variant="ghost"
            size="sm"
          />
        )}

        {item.is_excluded && (
          <Badge label={t('supervisor.excluded')} variant="default" size="sm" />
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Teacher Info Header */}
      <Card variant="default" style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Avatar
            source={teacher.avatar_url ?? undefined}
            name={teacher.display_name ?? teacher.full_name}
            size="lg"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.teacherName}>
              {teacher.display_name ?? teacher.full_name}
            </Text>
            <RatingBadge
              averageRating={teacher.average_rating}
              totalReviews={teacher.total_reviews}
            />
          </View>
        </View>
      </Card>

      {/* Flagged Reviews Alert */}
      {flaggedReviews.length > 0 && (
        <View style={styles.alertRow}>
          <Ionicons name="warning" size={18} color={semantic.warning} />
          <Text style={styles.alertText}>
            {t('supervisor.flaggedReviewsCount', { count: flaggedReviews.length })}
          </Text>
        </View>
      )}

      {/* Reviews List */}
      <Text style={styles.sectionTitle}>
        {t('supervisor.reviews')} ({reviews.length})
      </Text>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={renderReview}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('supervisor.noReviews')}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerCard: {
    padding: spacing.base,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  teacherName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  alertText: {
    ...typography.textStyles.caption,
    color: semantic.warning,
  },
  sectionTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  separator: {
    height: spacing.sm,
  },
  reviewCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  reviewCardFlagged: {
    borderColor: semantic.warning,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    ...typography.textStyles.label,
    color: neutral[400],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  reviewComment: {
    ...typography.textStyles.caption,
    color: neutral[600],
  },
  emptyText: {
    ...typography.textStyles.caption,
    color: neutral[400],
    textAlign: 'center',
    paddingBlock: spacing.lg,
  },
});
