import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState, LoadingState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

import { TeacherCard } from '@/features/admin/components/TeacherCard';
import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';
import { useLocalizedName } from '@/hooks/useLocalizedName';

export default function SupervisorTeachers() {
  const { t } = useTranslation();
  const { resolveName } = useLocalizedName();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;
  const teachers = useSupervisedTeachers(userId);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const data = teachers.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((t) => {
      const localizedName = resolveName(t.name_localized, t.full_name).toLowerCase();
      return localizedName.includes(q) || t.full_name.toLowerCase().includes(q);
    });
  }, [teachers.data, query]);

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('admin.supervisor.teacherList.title')}</Text>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('admin.supervisor.teacherList.searchPlaceholder')}
            placeholderTextColor={lightTheme.textSecondary}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <FlashList
          data={filtered}
          estimatedItemSize={120}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={teachers.isRefetching} onRefresh={() => teachers.refetch()} />
          }
          renderItem={({ item }) => (
            <TeacherCard
              teacher={item}
              onPress={() =>
                router.push({
                  pathname: '/(supervisor)/teachers/[id]',
                  params: { id: item.teacher_id, programId: item.program_id },
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            teachers.isLoading ? (
              <LoadingState />
            ) : teachers.isError ? (
              <ErrorState onRetry={() => teachers.refetch()} />
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {t('admin.supervisor.teacherList.empty')}
                </Text>
              </View>
            )
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  searchContainer: {
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  searchInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: lightTheme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: normalize(44),
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
