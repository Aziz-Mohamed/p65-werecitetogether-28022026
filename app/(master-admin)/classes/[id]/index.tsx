import React from 'react';
import { I18nManager, StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useClassById, useRemoveStudent } from '@/features/classes/hooks/useClasses';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Class Detail Screen ─────────────────────────────────────────────────────

export default function ClassDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: classData, isLoading, error, refetch } = useClassById(id);
  const removeStudent = useRemoveStudent();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!classData) return <ErrorState description={t('admin.classes.notFound')} />;

  const students = (classData as any).students ?? [];
  const teacherName = resolveName((classData as any).profiles?.name_localized, (classData as any).profiles?.full_name) ?? null;

  const handleRemoveStudent = (studentId: string, studentName: string) => {
    Alert.alert(
      t('admin.classes.removeStudentTitle'),
      t('admin.classes.removeStudentMessage', { name: studentName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: () => removeStudent.mutate(studentId),
        },
      ],
    );
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        {/* Class Header */}
        <View style={styles.classHeader}>
          <Text style={styles.name}>{resolveName((classData as any).name_localized, classData.name)}</Text>
          <Badge
            label={classData.is_active ? t('common.active') : t('common.inactive')}
            variant={classData.is_active ? 'success' : 'warning'}
            size="md"
          />
        </View>

        {classData.description && (
          <Text style={styles.description}>{classData.description}</Text>
        )}

        {/* Info */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.classes.teacher')}</Text>
            <Text style={styles.infoValue}>
              {teacherName ?? t('admin.classes.noTeacher')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.classes.studentCount')}</Text>
            <Text style={styles.infoValue}>
              {students.length}{classData.max_students ? ` / ${classData.max_students}` : ''}
            </Text>
          </View>
        </Card>

        {/* Student Roster */}
        <Text style={styles.sectionTitle}>{t('admin.classes.roster')}</Text>
        {students.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title={t('admin.classes.noStudents')}
            description={t('admin.classes.noStudentsDescription')}
          />
        ) : (
          students.map((s: any) => (
            <Card
              key={s.id}
              variant="outlined"
              style={styles.studentCard}
              onPress={() => router.push(`/(master-admin)/students/${s.id}`)}
            >
              <View style={styles.studentRow}>
                <Text style={styles.studentName}>
                  {resolveName(s.profiles?.name_localized, s.profiles?.full_name) ?? '—'}
                </Text>
                <View style={styles.studentActions}>
                  <Button
                    title={t('common.remove')}
                    onPress={() => handleRemoveStudent(s.id, resolveName(s.profiles?.name_localized, s.profiles?.full_name) ?? '—')}
                    variant="ghost"
                    size="sm"
                  />
                  <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={colors.neutral[300]} />
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('common.edit')}
            onPress={() => router.push(`/(master-admin)/classes/${id}/edit`)}
            variant="secondary"
            size="md"
            icon={<Ionicons name="create-outline" size={18} color={colors.primary[500]} />}
            style={styles.actionButton}
          />
        </View>
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
  classHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  infoCard: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  infoValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontFamily: typography.fontFamily.medium,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginTop: spacing.sm,
  },
  studentCard: {
    marginBottom: spacing.xs,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
  },
  studentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
