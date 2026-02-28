import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSessionsByTeacher } from '@/features/sessions/hooks/useSessions';
import { SessionHistoryList } from '@/features/sessions/components/SessionHistoryList';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Session } from '@/features/sessions/types';

export default function TeacherSessionsScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const teacherId = profile?.id;

  const { data: draftSessions = [] } = useSessionsByTeacher(teacherId, 'draft');
  const { data: completedSessions = [] } = useSessionsByTeacher(teacherId, 'completed');

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('sessions.title')}</Text>

        {/* Draft Sessions */}
        {draftSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('sessions.draft')} ({draftSessions.length})
            </Text>
            {draftSessions.map((session: Session) => (
              <Card key={session.id} variant="outlined" style={styles.draftCard}>
                <View style={styles.draftRow}>
                  <Badge label={t('sessions.draft')} variant="warning" size="sm" />
                  <Text style={styles.draftDate}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Completed Sessions */}
        <Text style={styles.sectionTitle}>
          {t('sessions.recentSessions')}
        </Text>

        <SessionHistoryList
          sessions={completedSessions}
          isLoading={false}
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
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  draftCard: {
    padding: spacing.md,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  draftDate: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
});
