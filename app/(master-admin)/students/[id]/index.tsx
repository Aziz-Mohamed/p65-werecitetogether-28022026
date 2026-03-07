import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useStudentById, useUpdateStudent } from '@/features/students/hooks/useStudents';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

// ─── Student Detail Screen ───────────────────────────────────────────────────

export default function StudentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: student, isLoading, error, refetch } = useStudentById(id);
  const updateStudent = useUpdateStudent();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!student) return <ErrorState description={t('admin.students.notFound')} />;

  const profile = (student as any).profiles;

  const handleToggleActive = () => {
    Alert.alert(
      student.is_active ? t('admin.students.deactivateTitle') : t('admin.students.activateTitle'),
      student.is_active ? t('admin.students.deactivateMessage') : t('admin.students.activateMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            updateStudent.mutate({
              id: student.id,
              input: { isActive: !student.is_active },
            });
          },
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

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            source={profile?.avatar_url ?? undefined}
            name={resolveName(profile?.name_localized, profile?.full_name)}
            size="lg"
          />
          <Text style={styles.name}>
            {resolveName(profile?.name_localized, profile?.full_name)}
          </Text>
          <Text style={styles.username}>@{profile?.username ?? '—'}</Text>
          <Badge
            label={student.is_active ? t('common.active') : t('common.inactive')}
            variant={student.is_active ? 'success' : 'warning'}
            size="md"
          />
        </View>

        {/* Personal Info */}
        <Text style={styles.sectionLabel}>{t('admin.detail.personalInfo')}</Text>
        <Card variant="default" style={styles.infoCard}>
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.detail.phone')}</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}
          {student.date_of_birth && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.students.dateOfBirth')}</Text>
              <Text style={styles.infoValue}>{student.date_of_birth}</Text>
            </View>
          )}
          {profile?.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.detail.joined')}</Text>
              <Text style={styles.infoValue}>
                {new Date(profile.created_at).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Academic Info */}
        <Card variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.students.class')}</Text>
            <Text style={styles.infoValue}>
              {resolveName((student as any).classes?.name_localized, (student as any).classes?.name) ?? t('admin.students.noClass')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.students.level')}</Text>
            <Text style={styles.infoValue}>
              {t('common.level')} {student.current_level ?? 0}/240
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('student.streak')}</Text>
            <Text style={styles.infoValue}>{student.current_streak}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.students.longestStreak')}</Text>

            <Text style={styles.infoValue}>{student.longest_streak ?? 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.students.parent')}</Text>
            <Text style={styles.infoValue}>
              {resolveName((student as any).parent?.name_localized, (student as any).parent?.full_name) ?? t('admin.students.noParent')}
            </Text>
          </View>
          {student.enrollment_date && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('admin.students.enrollmentDate')}</Text>
              <Text style={styles.infoValue}>
                {new Date(student.enrollment_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('common.edit')}
            onPress={() => router.push(`/(master-admin)/students/${id}/edit`)}
            variant="secondary"
            size="md"
            icon={<Ionicons name="create-outline" size={18} color={colors.primary[500]} />}
            style={styles.actionButton}
          />
          <Button
            title={student.is_active ? t('admin.students.deactivate') : t('admin.students.activate')}
            onPress={handleToggleActive}
            variant="secondary"
            size="md"
            loading={updateStudent.isPending}
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
