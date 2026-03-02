import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useProgramById } from '../hooks/usePrograms';
import { useLocaleStore } from '@/stores/localeStore';
import { typography } from '@/theme/typography';
import { lightTheme, accent, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { ProgramTrack } from '../types';
import type { TrackType } from '@/types/common.types';

const TRACK_TYPE_COLORS: Record<TrackType, string> = {
  free: accent.emerald[500],
  structured: accent.indigo[500],
};

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const isArabic = locale === 'ar';

  const { data: program, isLoading, error } = useProgramById(id);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      </Screen>
    );
  }

  if (error || !program) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
      </Screen>
    );
  }

  const name = isArabic ? program.name_ar : program.name;
  const description = isArabic ? program.description_ar : program.description;
  const tracks = program.program_tracks ?? [];

  return (
    <Screen>
      <View style={styles.backRow}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<Ionicons name="arrow-back" size={20} color={primary[600]} />}
        />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{name}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('programs.tracks')} ({tracks.length})
        </Text>

        {tracks.length === 0 ? (
          <Text style={styles.emptyText}>{t('programs.noTracks')}</Text>
        ) : (
          <View style={styles.trackList}>
            {tracks.map((track) => (
              <TrackCard key={track.id} track={track} isArabic={isArabic} programId={id!} />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function TrackCard({
  track,
  isArabic,
  programId,
}: {
  track: ProgramTrack;
  isArabic: boolean;
  programId: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const trackName = isArabic ? track.name_ar : track.name;
  const trackDescription = isArabic ? track.description_ar : track.description;
  const trackType = (track.track_type ?? 'free') as TrackType;

  const handlePress = () => {
    if (trackType === 'free') {
      router.push({
        pathname: '/(student)/program/available-teachers',
        params: { programId },
      });
    }
  };

  return (
    <Card style={styles.trackCard}>
      <View style={styles.trackHeader}>
        <Text style={styles.trackName}>{trackName}</Text>
        <View
          style={[
            styles.trackTypeBadge,
            { backgroundColor: (TRACK_TYPE_COLORS[trackType] ?? primary[500]) + '20' },
          ]}
        >
          <Text
            style={[
              styles.trackTypeText,
              { color: TRACK_TYPE_COLORS[trackType] ?? primary[500] },
            ]}
          >
            {t(`programs.category.${trackType}`)}
          </Text>
        </View>
      </View>

      {trackDescription && (
        <Text style={styles.trackDescription}>{trackDescription}</Text>
      )}

      <Button
        title={
          trackType === 'free'
            ? t('programs.browseTeachers')
            : t('programs.enrollInTrack')
        }
        onPress={handlePress}
        variant={trackType === 'free' ? 'secondary' : 'primary'}
        size="sm"
        fullWidth
        style={styles.trackButton}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.textStyles.body,
    color: lightTheme.error,
  },
  backRow: {
    flexDirection: 'row',
    paddingBlockStart: spacing.sm,
  },
  header: {
    paddingBlockStart: spacing.md,
    paddingBlockEnd: spacing.lg,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBlockEnd: spacing.sm,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    lineHeight: 22,
  },
  section: {
    paddingBlockEnd: spacing.lg,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockEnd: spacing.md,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  trackList: {
    gap: spacing.md,
  },
  trackCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  trackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackName: {
    ...typography.textStyles.label,
    color: lightTheme.text,
    flex: 1,
  },
  trackTypeBadge: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    borderRadius: radius.full,
  },
  trackTypeText: {
    ...typography.textStyles.caption,
    fontFamily: typography.fontFamily.semiBold,
  },
  trackDescription: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBlockStart: spacing.sm,
  },
  trackButton: {
    marginBlockStart: spacing.md,
  },
});
