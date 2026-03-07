import React, { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useStudents } from '@/features/students/hooks/useStudents';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { useLocalizedName } from '@/hooks/useLocalizedName';

// ─── Admin Students List ──────────────────────────────────────────────────────

export default function AdminStudentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { resolveName } = useLocalizedName();

  const { data: students = [], isLoading, error, refetch } = useStudents({
    searchQuery: searchQuery || undefined,
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
          />
          <Text style={styles.title}>{t('admin.students.title')}</Text>
          <Button
            title={t('admin.addStudent')}
            onPress={() => router.push('/(master-admin)/students/create')}
            variant="primary"
            size="sm"
            icon={<Ionicons name="add" size={18} color={colors.white} />}
          />
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder={t('admin.students.searchPlaceholder')}
          style={styles.searchBar}
        />

        {students.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('admin.students.emptyTitle')}
            description={t('admin.students.emptyDescription')}
          />
        ) : (
          <FlashList
            data={students}
            keyExtractor={(item: any) => item.id}

            renderItem={({ item }: { item: any }) => (
              <Card
                variant="outlined"
                style={styles.studentCard}
                onPress={() => router.push(`/(master-admin)/students/${item.id}`)}
              >
                <View style={styles.studentRow}>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>
                      {resolveName(item.profiles?.name_localized, item.profiles?.full_name)}
                    </Text>
                    <Text style={styles.studentMeta}>
                      @{item.profiles?.username ?? '—'}
                      {item.classes?.name ? ` · ${resolveName(item.classes?.name_localized, item.classes.name)}` : ''}
                    </Text>
                  </View>
                  <View style={styles.studentBadges}>
                    <Badge
                      label={`Lvl ${item.current_level ?? 0}`}
                      variant="info"
                      size="sm"
                    />
                    <Badge
                      label={item.is_active ? t('common.active') : t('common.inactive')}
                      variant={item.is_active ? 'success' : 'warning'}
                      size="sm"
                    />
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
    textAlign: 'center',
  },
  searchBar: {
    marginBottom: spacing.xs,
  },
  studentCard: {
    marginBottom: spacing.sm,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontFamily: typography.fontFamily.semiBold,
  },
  studentMeta: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: normalize(2),
  },
  studentBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
