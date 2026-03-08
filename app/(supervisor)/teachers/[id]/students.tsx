import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

import { ReassignSheet } from '@/features/admin/components/ReassignSheet';
import { useTeacherStudents } from '@/features/admin/hooks/useTeacherStudents';
import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import type { TeacherStudentRow } from '@/features/admin/types/admin.types';

export default function TeacherStudentsScreen() {
  const { t } = useTranslation();
  const { resolveName } = useLocalizedName();
  const { id: teacherId, programId } = useLocalSearchParams<{ id: string; programId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const students = useTeacherStudents(teacherId, programId);
  const teachers = useSupervisedTeachers(userId);
  const [reassignEnrollmentId, setReassignEnrollmentId] = useState<string | null>(null);

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.title}>{t('admin.supervisor.teacherDetail.students')}</Text>

        <FlashList
          data={students.data ?? []}
          estimatedItemSize={64}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }: { item: TeacherStudentRow }) => (
            <View style={styles.row}>
              <Avatar
                source={item.profiles?.avatar_url ?? undefined}
                name={resolveName(item.profiles?.name_localized, item.profiles?.full_name)}
                size="sm"
              />
              <View style={styles.rowText}>
                <Text style={styles.rowName} numberOfLines={1}>
                  {resolveName(item.profiles?.name_localized, item.profiles?.full_name)}
                </Text>
                <Text style={styles.rowDate}>
                  {t('common.active')}: {new Date(item.enrolled_at).toLocaleDateString()}
                </Text>
              </View>
              <Badge label={item.status} variant="default" size="sm" />
              <Button
                title={t('admin.supervisor.reassign.title')}
                variant="ghost"
                size="sm"
                onPress={() => setReassignEnrollmentId(item.id)}
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !students.isLoading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t('common.noResults')}</Text>
              </View>
            ) : null
          }
        />

        {reassignEnrollmentId && userId && (
          <ReassignSheet
            isOpen={!!reassignEnrollmentId}
            onClose={() => setReassignEnrollmentId(null)}
            enrollmentId={reassignEnrollmentId}
            currentTeacherId={teacherId!}
            supervisorId={userId}
            teachers={teachers.data ?? []}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  backButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary[500],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  rowDate: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: lightTheme.border,
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
