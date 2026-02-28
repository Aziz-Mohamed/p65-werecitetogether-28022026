import React, { useState, useCallback, useMemo } from 'react';
import { I18nManager, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge, Avatar } from '@/components/ui';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuthStore } from '@/stores/authStore';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { supabase } from '@/lib/supabase';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface TeacherStudentRow {
  id: string;
  status: string;
  student_id: string;
  program: { id: string; name: string; name_ar: string } | null;
  student: {
    id: string;
    full_name: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

function useTeacherStudents(teacherId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', 'teacher-students', teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id, status, student_id,
          program:programs!enrollments_program_id_fkey(id, name, name_ar),
          student:profiles!enrollments_student_id_fkey(id, full_name, display_name, avatar_url)
        `)
        .eq('teacher_id', teacherId!)
        .in('status', ['approved', 'active'])
        .order('enrolled_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as TeacherStudentRow[];
    },
    enabled: !!teacherId,
    staleTime: 60_000,
  });
}

export default function TeacherStudentsScreen() {
  const { t } = useTranslation();
  const theme = useRoleTheme();
  const { resolveName } = useLocalizedName();
  const [searchQuery, setSearchQuery] = useState('');
  const profile = useAuthStore((s) => s.profile);
  const teacherId = profile?.id;

  const { data: students = [], isLoading, error, refetch } = useTeacherStudents(teacherId);

  const handleClearSearch = useCallback(() => setSearchQuery(''), []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.trim().toLowerCase();
    return students.filter((s) => {
      const name = s.student?.display_name ?? s.student?.full_name ?? '';
      return name.toLowerCase().includes(q);
    });
  }, [students, searchQuery]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll={false} hasTabBar>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('teacher.students.title')}</Text>
          <Badge label={String(students.length)} variant={theme.tag as any} />
        </View>

        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={handleClearSearch}
            placeholder={t('teacher.students.searchPlaceholder')}
          />
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('teacher.students.emptyTitle')}
            description={t('teacher.students.emptyDescription')}
          />
        ) : (
          <FlashList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Card variant="default" style={styles.studentCard}>
                <View style={styles.studentRow}>
                  <Avatar
                    source={item.student?.avatar_url ?? undefined}
                    name={item.student?.display_name ?? item.student?.full_name ?? ''}
                    size="md"
                    ring
                    variant={theme.tag as any}
                  />
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {item.student?.display_name ?? item.student?.full_name ?? '—'}
                    </Text>
                    <Text style={styles.studentMeta}>
                      {resolveName(
                        item.program ? { en: item.program.name, ar: item.program.name_ar } : undefined,
                        item.program?.name,
                      ) ?? '—'}
                    </Text>
                  </View>
                  <View style={styles.studentActions}>
                    <Badge
                      label={item.status}
                      variant={item.status === 'active' ? 'success' : 'default'}
                      size="sm"
                    />
                    <Ionicons
                      name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={20}
                      color={neutral[300]}
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
    color: neutral[900],
    fontSize: normalize(17),
  },
  studentMeta: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
