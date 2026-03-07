import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useTeacherById } from '@/features/teachers/hooks/useTeachers';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Teacher Detail Screen ───────────────────────────────────────────────────

export default function TeacherDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: teacher, isLoading, error, refetch } = useTeacherById(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!teacher) return <ErrorState description={t('admin.teachers.notFound')} />;

  const classes = (teacher as any).classes ?? [];
  const totalStudents = classes.reduce(
    (sum: number, c: any) => sum + (c.students?.length ?? 0),
    0,
  );

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            source={teacher.avatar_url ?? undefined}
            name={resolveName(teacher.name_localized, teacher.full_name)}
            size="lg"
          />
          <Text style={styles.name}>{resolveName(teacher.name_localized, teacher.full_name)}</Text>
          <Text style={styles.username}>@{teacher.username ?? '—'}</Text>
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionLabel}>{t('admin.detail.personalInfo')}</Text>
        <Card variant="default" style={styles.infoCard}>
          {teacher.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.detail.phone')}</Text>
              <Text style={styles.infoValue}>{teacher.phone}</Text>
            </View>
          )}
          {(teacher as any).created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.detail.joined')}</Text>
              <Text style={styles.infoValue}>
                {new Date((teacher as any).created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Stats */}
        <Card variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.teachers.assignedClasses')}</Text>
            <Text style={styles.infoValue}>{classes.length}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.dashboard.totalStudents')}</Text>
            <Text style={styles.infoValue}>{totalStudents}</Text>
          </View>
        </Card>

        {/* Classes */}
        {classes.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('admin.teachers.classes')}</Text>
            {classes.map((c: any) => (
              <Card key={c.id} variant="default" style={styles.listCard}>
                <Text style={styles.listItemText}>{resolveName(c.name_localized, c.name)}</Text>
              </Card>
            ))}
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('common.edit')}
            onPress={() => router.push(`/(master-admin)/teachers/${id}/edit`)}
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
  profileHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginTop: spacing.sm,
  },
  username: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  sectionLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
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
    flexShrink: 1,
    textAlign: 'right',
  },
  listCard: {
    marginBottom: spacing.xs,
  },
  listItemText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
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
