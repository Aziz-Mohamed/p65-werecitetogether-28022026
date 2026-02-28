import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useCohortsByProgram } from '@/features/cohorts/hooks/useCohorts';
import { useAuthStore } from '@/stores/authStore';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { Cohort } from '@/features/cohorts/types';

const STATUS_BADGE_MAP: Record<string, { variant: 'success' | 'warning' | 'info' | 'default' | 'error'; key: string }> = {
  enrollment_open: { variant: 'success', key: 'open' },
  enrollment_closed: { variant: 'warning', key: 'closed' },
  in_progress: { variant: 'info', key: 'in_progress' },
  completed: { variant: 'default', key: 'completed' },
  archived: { variant: 'default', key: 'archived' },
};

export default function CohortsScreen() {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);

  // TODO: Get programId from context/store
  const programId = undefined as string | undefined;
  const { data: cohorts = [], isLoading } = useCohortsByProgram(programId);

  const renderCohort = ({ item }: { item: Cohort }) => {
    const statusConfig = STATUS_BADGE_MAP[item.status] ?? { variant: 'default' as const, key: item.status };

    return (
      <Card variant="default" style={styles.cohortCard}>
        <View style={styles.cohortHeader}>
          <Text style={styles.cohortName} numberOfLines={1}>
            {item.name}
          </Text>
          <Badge
            label={t(`cohorts.status.${statusConfig.key}`)}
            variant={statusConfig.variant}
            size="sm"
          />
        </View>

        <View style={styles.cohortMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={16} color={neutral[400]} />
            <Text style={styles.metaText}>
              {t('cohorts.maxStudents')}: {item.max_students}
            </Text>
          </View>

          {item.start_date && (
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={neutral[400]} />
              <Text style={styles.metaText}>
                {new Date(item.start_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('cohorts.title')}</Text>

        {cohorts.length === 0 && !isLoading ? (
          <View style={styles.placeholder}>
            <Ionicons name="grid-outline" size={48} color={neutral[300]} />
            <Text style={styles.placeholderText}>
              {t('cohorts.emptyRoster')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={cohorts}
            keyExtractor={(item) => item.id}
            renderItem={renderCohort}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
          />
        )}
      </View>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => setShowForm(true)}
        accessibilityLabel={t('cohorts.create')}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
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
  list: {
    gap: spacing.md,
  },
  cohortCard: {
    padding: spacing.base,
  },
  cohortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cohortName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  cohortMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBlockStart: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBlock: spacing['3xl'],
  },
  placeholderText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  fab: {
    position: 'absolute',
    bottom: normalize(90),
    right: spacing.lg,
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
  },
});
