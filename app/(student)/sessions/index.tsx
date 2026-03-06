import React from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useSessions } from '@/features/sessions/hooks/useSessions';
import { MicIndicator } from '@/features/voice-memos';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { formatSessionDate } from '@/lib/helpers';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Student Session History ─────────────────────────────────────────────────

export default function StudentSessionsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const theme = useRoleTheme();

  const { resolveName } = useLocalizedName();
  const { data: sessions = [], isLoading, error, refetch } = useSessions({
    studentId: profile?.id,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            icon={<Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={20} color={theme.primary} />}
          />
          <Text style={styles.title}>{t('student.sessions.title')}</Text>
        </View>

        {sessions.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title={t('student.sessions.emptyTitle')}
            description={t('student.sessions.emptyDescription')}
          />
        ) : (
          <FlashList
            data={sessions}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }: { item: any }) => (
              <Card
                variant="default"
                onPress={() => router.push(`/(student)/sessions/${item.id}`)}
                style={styles.sessionCard}
              >
                <View style={styles.sessionRow}>
                  <View style={[styles.teacherIcon, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name="person" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.sessionInfo}>
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={12} color={colors.neutral[400]} />
                      <Text style={styles.sessionDate}>
                        {formatSessionDate(item.session_date, i18n.language).date}{' '}
                        <Text style={styles.sessionWeekday}>({formatSessionDate(item.session_date, i18n.language).weekday})</Text>
                      </Text>
                    </View>
                    <Text style={styles.teacherName}>
                      {t('common.teacher')}: {resolveName(item.teacher?.name_localized, item.teacher?.full_name) ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.scores}>
                    <MicIndicator hasVoiceMemo={Array.isArray((item as any).session_voice_memos) && (item as any).session_voice_memos.length > 0} />
                    {item.memorization_score != null && (
                      <Badge
                        label={`${item.memorization_score}/5`}
                        variant={item.memorization_score >= 4 ? "success" : "warning"}
                        size="sm"
                      />
                    )}
                    <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.neutral[300]} />
                  </View>
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sessionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teacherIcon: {
    width: normalize(44),
    height: normalize(44),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
    gap: normalize(2),
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(4),
  },
  sessionDate: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
    fontSize: normalize(16),
  },
  sessionWeekday: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  teacherName: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
  },
  scores: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

