import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { Avatar, Badge, Button } from '@/components/ui';
import { GreenDotIndicator } from '@/components/ui/GreenDotIndicator';
import { TeacherRatingBadge } from '@/features/ratings/components/TeacherRatingBadge';
import { useTeacherRatingStats } from '@/features/ratings/hooks/useTeacherRatingStats';
import type { AvailableTeacher } from '../types/availability.types';
import { typography } from '@/theme/typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// Map ISO 639-1 codes to display names
const LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: {
    ar: 'Arabic', en: 'English', ur: 'Urdu', fr: 'French',
    tr: 'Turkish', ms: 'Malay', id: 'Indonesian', bn: 'Bengali',
  },
  ar: {
    ar: 'العربية', en: 'الإنجليزية', ur: 'الأردية', fr: 'الفرنسية',
    tr: 'التركية', ms: 'الملايوية', id: 'الإندونيسية', bn: 'البنغالية',
  },
};

interface AvailableTeacherCardProps {
  teacher: AvailableTeacher;
  onJoin: (teacher: AvailableTeacher) => void;
  isJoining?: boolean;
}

export function AvailableTeacherCard({ teacher, onJoin, isJoining }: AvailableTeacherCardProps) {
  const { t, i18n } = useTranslation();
  const { data: ratingStats } = useTeacherRatingStats(teacher.teacher_id, teacher.program_id);
  const isFull = teacher.active_student_count >= teacher.max_students;
  const hasNoLink = !teacher.profiles?.meeting_link;

  const languageNames = teacher.profiles?.languages
    ?.map((code) => LANGUAGE_NAMES[i18n.language]?.[code] ?? code)
    .join(', ');

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.row}>
        {/* Avatar with green dot */}
        <View style={styles.avatarContainer}>
          <Avatar name={teacher.profiles?.full_name ?? '?'} size="lg" />
          <GreenDotIndicator isAvailable overlay />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {teacher.profiles?.full_name ?? '—'}
            </Text>
            <TeacherRatingBadge
              averageRating={ratingStats?.average_rating ?? null}
              totalReviews={ratingStats?.total_reviews ?? 0}
            />
          </View>

          {languageNames ? (
            <Text style={styles.languages} numberOfLines={1}>
              {languageNames}
            </Text>
          ) : null}

          <Text style={styles.capacity}>
            {t('availability.studentsCount', {
              current: teacher.active_student_count,
              max: teacher.max_students,
            })}
          </Text>
        </View>
      </View>

      {/* Action */}
      {isFull ? (
        <View style={styles.fullBadge}>
          <Text style={styles.fullText}>{t('availability.teacherFull')}</Text>
        </View>
      ) : hasNoLink ? (
        <View style={styles.fullBadge}>
          <Text style={styles.fullText}>{t('availability.meetingLinkNotConfigured')}</Text>
        </View>
      ) : (
        <Button
          title={t('availability.joinSession')}
          onPress={() => onJoin(teacher)}
          variant="primary"
          size="md"
          loading={isJoining}
        />
      )}
    </Card>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function AvailableTeacherCardSkeleton() {
  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.skeletonCircle, styles.skeleton]} />
        <View style={styles.info}>
          <View style={[styles.skeletonLine, styles.skeleton, { width: '60%' }]} />
          <View style={[styles.skeletonLine, styles.skeleton, { width: '40%' }]} />
        </View>
      </View>
      <View style={[styles.skeletonButton, styles.skeleton]} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  info: {
    flex: 1,
    gap: normalize(3),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
    flex: 1,
  },
  languages: {
    ...typography.textStyles.caption,
    color: colors.neutral[600],
  },
  capacity: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  fullBadge: {
    backgroundColor: colors.neutral[100],
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: normalize(8),
    alignItems: 'center',
  },
  fullText: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
  },
  // Skeleton styles
  skeleton: {
    backgroundColor: colors.neutral[100],
    borderRadius: normalize(4),
  },
  skeletonCircle: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
  },
  skeletonLine: {
    height: normalize(14),
  },
  skeletonButton: {
    height: normalize(40),
    borderRadius: normalize(8),
  },
});
