import React, { useState } from 'react';
import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui';
import { RatingBadge } from '@/components/RatingBadge';
import { useAuthStore } from '@/stores/authStore';
import { useAssignedTeachers } from '@/features/supervisor/hooks/useSupervisor';
import type { TeacherSummary } from '@/features/supervisor/types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function SupervisorTeachersScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const supervisorId = profile?.id ?? '';

  const [selectedProgramId] = useState<string | undefined>(undefined);
  const { data: teachers = [], isLoading } = useAssignedTeachers(
    supervisorId,
    selectedProgramId,
  );

  const renderTeacher = ({ item }: { item: TeacherSummary }) => (
    <Card variant="default" style={styles.teacherCard}>
      <View style={styles.row}>
        <Avatar
          source={item.avatar_url ?? undefined}
          name={item.display_name ?? item.full_name}
          size="md"
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.display_name ?? item.full_name}
            </Text>
            {item.has_flagged_reviews && (
              <Badge label={t('supervisor.flagged')} variant="error" size="sm" />
            )}
          </View>
          <RatingBadge
            averageRating={item.average_rating}
            totalReviews={item.total_reviews}
          />
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={14} color={neutral[400]} />
            <Text style={styles.metaText}>
              {t('supervisor.activeStudents', { count: item.active_students })}
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );

  return (
    <Screen hasTabBar>
      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        renderItem={renderTeacher}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          <Text style={styles.header}>
            {t('supervisor.assignedTeachers')}
          </Text>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={neutral[300]} />
              <Text style={styles.emptyText}>
                {t('supervisor.noTeachers')}
              </Text>
            </View>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.base,
    paddingBlockEnd: spacing['2xl'],
  },
  header: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockEnd: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  teacherCard: {
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['3xl'],
    gap: spacing.md,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
