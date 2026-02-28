import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useProgramById, useProgramTracks } from '@/features/programs/hooks/usePrograms';
import { useRolesForProgram } from '@/features/programs/hooks/useProgramAdmin';
import { useLocaleStore } from '@/stores/localeStore';
import { typography } from '@/theme/typography';
import { lightTheme, accent, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

export default function ProgramDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const locale = useLocaleStore((s) => s.locale);
  const isArabic = locale === 'ar';

  const { data: program, isLoading, error, refetch } = useProgramById(id);
  const { data: roles = [] } = useRolesForProgram(id);

  if (isLoading) return <LoadingState />;
  if (error || !program) {
    return <ErrorState description={error?.message ?? 'Not found'} onRetry={refetch} />;
  }

  const name = isArabic ? program.name_ar : program.name;
  const description = isArabic ? program.description_ar : program.description;
  const tracks = program.program_tracks ?? [];
  const settings = (program.settings ?? {}) as Record<string, unknown>;

  const teachers = roles.filter((r) => r.role === 'teacher');
  const supervisors = roles.filter((r) => r.role === 'supervisor');
  const admins = roles.filter((r) => r.role === 'program_admin');

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={lightTheme.text} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1}>
            {name}
          </Text>
        </View>

        {/* Program Info */}
        <Card variant="default" style={styles.infoCard}>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
          <View style={styles.metaRow}>
            <Badge
              label={t(`programs.category.${program.category}`)}
              variant={program.is_active ? 'success' : 'warning'}
            />
          </View>
        </Card>

        {/* Team Summary */}
        <Text style={styles.sectionTitle}>{t('dashboard.programAdmin.team')}</Text>
        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.sky[500] }]}>
              {admins.length}
            </Text>
            <Text style={styles.statLabel}>{t('roles.program_admin')}</Text>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.violet[500] }]}>
              {teachers.length}
            </Text>
            <Text style={styles.statLabel}>{t('roles.teacher')}</Text>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <Text style={[styles.statValue, { color: accent.rose[500] }]}>
              {supervisors.length}
            </Text>
            <Text style={styles.statLabel}>{t('roles.supervisor')}</Text>
          </Card>
        </View>

        {/* Tracks */}
        <Text style={styles.sectionTitle}>
          {t('programs.tracks')} ({tracks.length})
        </Text>
        {tracks.map((track) => {
          const trackName = isArabic ? track.name_ar : track.name;
          return (
            <Card key={track.id} variant="outlined" style={styles.trackCard}>
              <View style={styles.trackRow}>
                <Text style={styles.trackName}>{trackName}</Text>
                {track.track_type && (
                  <Badge
                    label={track.track_type}
                    variant={track.track_type === 'free' ? 'success' : 'default'}
                    size="sm"
                  />
                )}
              </View>
            </Card>
          );
        })}

        {/* Settings Summary */}
        <Text style={styles.sectionTitle}>{t('dashboard.masterAdmin.settings')}</Text>
        <Card variant="outlined" style={styles.settingsCard}>
          {Object.entries(settings).map(([key, value]) => (
            <View key={key} style={styles.settingRow}>
              <Text style={styles.settingKey}>{key.replace(/_/g, ' ')}</Text>
              <Text style={styles.settingValue}>{String(value)}</Text>
            </View>
          ))}
        </Card>
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
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  infoCard: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingBlock: spacing.md,
  },
  statValue: {
    ...typography.textStyles.heading,
  },
  statLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
    marginBlockStart: spacing.xs,
    textAlign: 'center',
  },
  trackCard: {
    padding: spacing.md,
  },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  settingsCard: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingKey: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
  },
  settingValue: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
});
