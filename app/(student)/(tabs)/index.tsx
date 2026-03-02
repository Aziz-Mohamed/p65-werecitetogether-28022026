import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSessionsByStudent } from '@/features/sessions/hooks/useSessions';
import { SessionHistoryList } from '@/features/sessions/components/SessionHistoryList';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

export default function StudentHomeScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const displayName = profile?.display_name || profile?.full_name || '';
  const studentId = profile?.id;

  const { data: recentSessions = [], isLoading } = useSessionsByStudent(
    studentId,
    'completed',
  );

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>
            {t('dashboard.welcome', { name: displayName })}
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t('programs.browsePrograms')}</Text>
          <Text style={styles.cardDescription}>
            {t('programs.allPrograms')}
          </Text>
        </Card>

        {/* Recent Sessions */}
        <Text style={styles.sectionTitle}>
          {t('sessions.recentSessions')}
        </Text>

        <SessionHistoryList
          sessions={recentSessions.slice(0, 5)}
          isLoading={isLoading}
        />
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
    paddingBlockEnd: spacing.xs,
  },
  welcome: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  cardTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockEnd: spacing.xs,
  },
  cardDescription: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
});
