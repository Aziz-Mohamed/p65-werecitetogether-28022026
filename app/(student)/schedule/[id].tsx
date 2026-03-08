import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { scheduledSessionService } from '@/features/scheduling/services/scheduled-session.service';
import { SessionRecitationPlanList } from '@/features/scheduling/components/SessionRecitationPlanList';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Student Session Detail ──────────────────────────────────────────────────

export default function StudentSessionDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, schoolId } = useAuth();
  const { resolveName } = useLocalizedName();

  const { data: session, isLoading, error, refetch } = useQuery({
    queryKey: ['scheduled-session', id],
    queryFn: async () => {
      const { data, error } = await scheduledSessionService.getScheduledSessions({
        schoolId: schoolId!,
      });
      if (error) throw error;
      return (data ?? []).find((s: any) => s.id === id) ?? null;
    },
    enabled: !!id && !!schoolId,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;
  if (!session) return <ErrorState description={t('scheduling.sessionNotFound')} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <View style={styles.header}>
          <Text style={styles.title}>
            {resolveName(session.class?.name_localized, session.class?.name) ?? t('scheduling.individualSession')}
          </Text>
          <Badge
            label={t(`scheduling.status.${session.status}`)}
            variant={session.status === 'completed' ? 'success' : session.status === 'in_progress' ? 'warning' : 'sky'}
            size="md"
          />
        </View>

        {/* Session Details */}
        <Card variant="default" style={styles.detailCard}>
          <DetailRow
            icon="calendar-outline"
            label={t('scheduling.date')}
            value={new Date(session.session_date + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          />
          <DetailRow
            icon="time-outline"
            label={t('scheduling.time')}
            value={`${session.start_time?.slice(0, 5)} – ${session.end_time?.slice(0, 5)}`}
          />
          <DetailRow
            icon="book-outline"
            label={t('scheduling.type')}
            value={t(`scheduling.sessionType.${session.session_type}`)}
          />
          {session.teacher?.full_name && (
            <DetailRow
              icon="person-outline"
              label={t('common.teacher')}
              value={session.teacher.full_name}
            />
          )}
        </Card>

        {/* Recitation Plans */}
        {profile?.id && schoolId && (
          <SessionRecitationPlanList
            sessionId={id!}
            schoolId={schoolId}
            userId={profile.id}
            sessionDate={session.session_date}
            role="student"
            isClassSession={session.session_type === 'class'}
          />
        )}
      </View>
    </Screen>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon as any} size={20} color={colors.neutral[400]} />
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  detailCard: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
  },
  detailValue: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
    marginTop: normalize(2),
  },
});
