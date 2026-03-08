import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useUpdateStudent } from '@/features/students/hooks/useStudents';
import { useStudentProfileData } from '@/features/students/hooks/useStudentProfileData';
import {
  StudentStatsGrid,
  StudentSessionsList,
  StudentStickersList,
  StudentGuardiansList,
  StudentEnrollmentHistory,
  CollapsibleRubProgress,
} from '@/features/students/components/StudentProfileSections';
import { MemorizationProgressBar } from '@/features/memorization';
import { RubProgressMap } from '@/features/gamification/components/RubProgressMap';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Student Detail Screen ───────────────────────────────────────────────────

export default function StudentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const data = useStudentProfileData(id);
  const updateStudent = useUpdateStudent();

  if (data.isLoading) return <LoadingState />;
  if (data.error) return <ErrorState description={(data.error as Error).message} onRetry={data.refetch} />;
  if (!data.student) return <ErrorState description={t('admin.students.notFound')} />;

  const { student, studentProfile: profile, guardians } = data;

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
        <PageHeader title={t('admin.students.title')} />

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
          <Badge
            label={student.is_active ? t('common.active') : t('common.inactive')}
            variant={student.is_active ? 'success' : 'warning'}
            size="md"
          />
        </View>

        {/* Personal Info — only show if there's data */}
        {(profile?.phone || student.date_of_birth) && (
          <>
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
            </Card>
          </>
        )}

        {/* Academic Info */}
        <Card variant="default" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.students.class')}</Text>
            <Text style={styles.infoValue}>
              {data.studentClass
                ? resolveName(data.studentClass.name_localized, data.studentClass.name)
                : t('admin.students.noClass')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.students.longestStreak')}</Text>
            <Text style={styles.infoValue}>{student.longest_streak ?? 0}</Text>
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

        {/* Performance Stats */}
        <StudentStatsGrid
          activeCount={data.activeCount}
          streak={student.current_streak ?? 0}
          stickersCount={data.stickers.length}
          attendanceRate={data.attendanceRate}
        />

        {/* Memorization Progress */}
        {data.memStats && (
          <MemorizationProgressBar stats={data.memStats} compact />
        )}

        {/* Recent Sessions */}
        <StudentSessionsList sessions={data.sessions} />

        {/* Rub Progress Map */}
        <CollapsibleRubProgress activeCount={data.activeCount}>
          <View style={styles.progressMapContainer}>
            <RubProgressMap studentId={id!} mode="readonly" />
          </View>
        </CollapsibleRubProgress>

        {/* Sticker History */}
        <StudentStickersList stickers={data.stickers} />

        {/* Guardians */}
        <StudentGuardiansList guardians={guardians} />

        {/* Enrollment History */}
        <StudentEnrollmentHistory enrollments={data.enrollments} />

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
  progressMapContainer: {
    minHeight: normalize(400),
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
