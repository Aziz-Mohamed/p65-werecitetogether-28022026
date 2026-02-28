import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { RatingBadge } from '@/components/RatingBadge';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { AvailableTeacher } from '../types';

interface AvailableTeacherCardProps {
  teacher: AvailableTeacher;
  onJoinSession: (teacher: AvailableTeacher) => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  zoom: 'videocam',
  google_meet: 'logo-google',
  teams: 'people',
  jitsi: 'globe',
};

const MIN_REVIEWS_FOR_RATING = 5;

export const AvailableTeacherCard: React.FC<AvailableTeacherCardProps> = ({
  teacher,
  onJoinSession,
}) => {
  const { t } = useTranslation();

  const { profile, availability, ratingStats } = teacher;
  const displayName = profile.display_name ?? profile.full_name;
  const isAtCapacity =
    availability.current_session_count >= availability.max_concurrent_students;

  const platformIcon =
    PLATFORM_ICONS[profile.meeting_platform ?? ''] ?? 'link';

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Avatar
          source={profile.avatar_url ?? undefined}
          name={displayName}
          size="lg"
        />

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>

          <RatingBadge
            averageRating={ratingStats?.average_rating ?? null}
            totalReviews={ratingStats?.total_reviews ?? 0}
          />

          {profile.languages && profile.languages.length > 0 && (
            <View style={styles.languagesRow}>
              <Ionicons name="language" size={14} color={neutral[400]} />
              <Text style={styles.languagesText} numberOfLines={1}>
                {profile.languages.join(', ')}
              </Text>
            </View>
          )}

          <View style={styles.metaRow}>
            <Ionicons
              name={platformIcon as any}
              size={14}
              color={primary[500]}
            />
            <Text style={styles.concurrentText}>
              {t('teacherAvailability.concurrentStudents', {
                current: availability.current_session_count,
                max: availability.max_concurrent_students,
              })}
            </Text>
          </View>
        </View>
      </View>

      <Button
        title={
          isAtCapacity
            ? t('teacherAvailability.inSession')
            : t('teacherAvailability.joinSession')
        }
        onPress={() => onJoinSession(teacher)}
        variant={isAtCapacity ? 'ghost' : 'primary'}
        size="sm"
        fullWidth
        disabled={isAtCapacity}
        style={styles.joinButton}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  languagesText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  concurrentText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  joinButton: {
    marginBlockStart: spacing.md,
  },
});
