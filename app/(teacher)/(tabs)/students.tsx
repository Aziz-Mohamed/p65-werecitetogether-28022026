import React, { useState, useCallback } from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge, Avatar } from '@/components/ui';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Teacher Student List Screen ─────────────────────────────────────────────

export default function TeacherStudentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useRoleTheme();
  const { resolveName } = useLocalizedName();
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: students = [],
    isLoading,
    error,
    refetch,
  } = useStudents({
    isActive: true,
    searchQuery: searchQuery.trim() || undefined,
  });

  const handleClearSearch = useCallback(() => setSearchQuery(''), []);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll={false} hasTabBar>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('teacher.students.title')}</Text>
          <Badge label={String(students.length)} variant={theme.tag} />
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={handleClearSearch}
            placeholder={t('teacher.students.searchPlaceholder')}
          />
        </View>

        {students.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('teacher.students.emptyTitle')}
            description={t('teacher.students.emptyDescription')}
          />
        ) : (
          <FlashList
            data={students}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }: { item: any }) => (
              <Card
                variant="default"
                onPress={() => router.push(`/(teacher)/students/${item.id}`)}
                style={styles.studentCard}
              >
                <View style={styles.studentRow}>
                  <Avatar
                    name={resolveName(item.profiles?.name_localized, item.profiles?.full_name)}
                    size="md"
                    ring
                    variant={theme.tag}
                  />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {resolveName(item.profiles?.name_localized, item.profiles?.full_name) ?? '—'}
                    </Text>
                    <Text style={styles.studentMeta}>
                      {resolveName(item.classes?.name_localized, item.classes?.name) ?? t('teacher.students.noClass')}
                      {` · Lvl ${item.current_level ?? 0}`}
                    </Text>
                  </View>
                  <View style={styles.studentActions}>
                    <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.neutral[300]} />
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
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  studentCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  studentInfo: {
    flex: 1,
    gap: normalize(2),
  },
  studentName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
    fontSize: normalize(17),
  },
  studentMeta: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
