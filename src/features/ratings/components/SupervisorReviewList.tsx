import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { StarRating } from './StarRating';
import { useTeacherReviews } from '../hooks/useTeacherReviews';
import { useExcludeRating } from '../hooks/useExcludeRating';
import type { ReviewWithDetails } from '../types/ratings.types';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface SupervisorReviewListProps {
  teacherId: string;
  programId: string;
}

function ReviewItem({ review, onExclude, onRestore }: {
  review: ReviewWithDetails;
  onExclude: (ratingId: string, reason: string) => void;
  onRestore: (ratingId: string, reason: string) => void;
}) {
  const { t } = useTranslation();
  const [reasonText, setReasonText] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  const handleToggleExclusion = useCallback(() => {
    if (review.is_excluded) {
      onRestore(review.id, 'Supervisor restored');
    } else {
      setShowReasonInput(true);
    }
  }, [review.id, review.is_excluded, onRestore]);

  const handleConfirmExclude = useCallback(() => {
    if (!reasonText.trim()) {
      Alert.alert(t('ratings.supervisor.reasonRequired'));
      return;
    }
    onExclude(review.id, reasonText.trim());
    setReasonText('');
    setShowReasonInput(false);
  }, [review.id, reasonText, onExclude, t]);

  const date = new Date(review.created_at).toLocaleDateString();

  return (
    <Card variant={review.is_flagged ? 'outlined' : 'default'} style={[
      styles.reviewCard,
      review.is_flagged && styles.flaggedCard,
    ]}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderLeft}>
          <Text style={styles.studentName}>{review.student_name}</Text>
          <Text style={styles.reviewDate}>{date}</Text>
        </View>
        <View style={styles.reviewHeaderRight}>
          {review.is_flagged && (
            <Badge label={t('ratings.supervisor.flagged')} variant="warning" size="sm" />
          )}
          {review.is_excluded && (
            <Badge label={t('ratings.supervisor.excluded')} variant="default" size="sm" />
          )}
        </View>
      </View>

      {/* Stars */}
      <StarRating value={review.star_rating} onChange={() => {}} size={normalize(24)} />

      {/* Tags */}
      {review.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {review.tags.map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{t(`ratings.tags.${tag}`)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Comment */}
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}

      {/* Exclusion Controls */}
      <View style={styles.actionRow}>
        <Button
          title={review.is_excluded ? t('ratings.supervisor.restore') : t('ratings.supervisor.exclude')}
          onPress={handleToggleExclusion}
          variant={review.is_excluded ? 'ghost' : 'outline'}
          size="sm"
          icon={<Ionicons name={review.is_excluded ? 'refresh' : 'close-circle'} size={16} color={review.is_excluded ? colors.primary[500] : colors.accent.rose[500]} />}
        />
      </View>

      {/* Reason Input */}
      {showReasonInput && (
        <View style={styles.reasonSection}>
          <TextInput
            style={styles.reasonInput}
            placeholder={t('ratings.supervisor.reasonPlaceholder')}
            placeholderTextColor={colors.neutral[400]}
            value={reasonText}
            onChangeText={setReasonText}
            multiline
          />
          <View style={styles.reasonActions}>
            <Button title={t('common.cancel')} onPress={() => setShowReasonInput(false)} variant="ghost" size="sm" />
            <Button title={t('ratings.supervisor.exclude')} onPress={handleConfirmExclude} variant="primary" size="sm" />
          </View>
        </View>
      )}

      {/* Audit Trail */}
      {review.exclusion_log.length > 0 && (
        <View style={styles.auditSection}>
          <Text style={styles.auditTitle}>{t('ratings.supervisor.auditTrail')}</Text>
          {review.exclusion_log.map((entry) => (
            <View key={entry.id} style={styles.auditEntry}>
              <Ionicons
                name={entry.action === 'excluded' ? 'close-circle-outline' : 'checkmark-circle-outline'}
                size={14}
                color={entry.action === 'excluded' ? colors.accent.rose[400] : colors.primary[400]}
              />
              <Text style={styles.auditText}>
                {entry.action === 'excluded'
                  ? t('ratings.supervisor.excludedBy', { name: entry.performer_name ?? '—' })
                  : t('ratings.supervisor.restoredBy', { name: entry.performer_name ?? '—' })}
                {entry.reason ? ` — ${entry.reason}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export function SupervisorReviewList({ teacherId, programId }: SupervisorReviewListProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useTeacherReviews(teacherId, programId, page);
  const { exclude, restore } = useExcludeRating();

  const handleExclude = useCallback((ratingId: string, reason: string) => {
    exclude.mutate({ ratingId, reason });
  }, [exclude]);

  const handleRestore = useCallback((ratingId: string, reason: string) => {
    restore.mutate({ ratingId, reason });
  }, [restore]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  const reviews = data?.reviews ?? [];
  const totalPages = data ? Math.ceil(data.total_count / data.page_size) : 1;

  return (
    <View style={styles.container}>
      <FlashList
        data={reviews}
        keyExtractor={(item) => item.id}
        estimatedItemSize={200}
        renderItem={({ item }) => (
          <ReviewItem
            review={item}
            onExclude={handleExclude}
            onRestore={handleRestore}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('ratings.noReviewsYet')}</Text>
        }
        contentContainerStyle={styles.listContent}
      />

      {totalPages > 1 && (
        <View style={styles.pagination}>
          <Button
            title="←"
            onPress={() => setPage((p) => Math.max(1, p - 1))}
            variant="ghost"
            size="sm"
            disabled={page <= 1}
          />
          <Text style={styles.pageText}>{page} / {totalPages}</Text>
          <Button
            title="→"
            onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
  },
  reviewCard: {
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  flaggedCard: {
    borderColor: colors.accent.amber[300],
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewHeaderLeft: {
    flex: 1,
  },
  reviewHeaderRight: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  reviewDate: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: normalize(6),
  },
  tagChip: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    backgroundColor: colors.neutral[100],
    borderRadius: normalize(10),
  },
  tagText: {
    ...typography.textStyles.caption,
    color: colors.neutral[600],
  },
  comment: {
    ...typography.textStyles.body,
    color: colors.neutral[600],
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reasonSection: {
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: normalize(8),
  },
  reasonInput: {
    ...typography.textStyles.body,
    backgroundColor: colors.white,
    borderRadius: normalize(8),
    padding: spacing.sm,
    minHeight: normalize(60),
    borderWidth: 1,
    borderColor: colors.neutral[200],
    color: lightTheme.text,
    textAlignVertical: 'top',
  },
  reasonActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  auditSection: {
    gap: normalize(4),
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  auditTitle: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    fontFamily: typography.fontFamily.semiBold,
  },
  auditEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(6),
  },
  auditText: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    flex: 1,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.neutral[400],
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pageText: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
});
