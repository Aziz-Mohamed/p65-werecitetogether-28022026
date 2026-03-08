import React from 'react';
import { I18nManager, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useStudentProfileData } from '@/features/students/hooks/useStudentProfileData';
import {
  StudentProfileHeader,
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
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Program Admin Student Detail (Read-Only) ───────────────────────────────

export default function ProgramAdminStudentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useRoleTheme();
  const { resolveName } = useLocalizedName();

  const data = useStudentProfileData(id);

  if (data.isLoading) return <LoadingState />;
  if (data.error) return <ErrorState description={(data.error as Error).message} onRetry={data.refetch} />;
  if (!data.student) return <ErrorState description={t('admin.students.notFound')} />;

  const displayName = resolveName(data.studentProfile?.name_localized, data.studentProfile?.full_name);
  const classBadge = data.studentClass
    ? resolveName(data.studentClass.name_localized, data.studentClass.name)
    : null;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            icon={<Ionicons name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color={theme.primary} />}
          />
        </View>

        <StudentProfileHeader
          name={displayName}
          avatarUrl={data.studentProfile?.avatar_url}
          classBadge={classBadge}
          activeCount={data.activeCount}
        />

        <StudentStatsGrid
          activeCount={data.activeCount}
          streak={data.student.current_streak ?? 0}
          stickersCount={data.stickers.length}
          attendanceRate={data.attendanceRate}
        />

        {data.memStats && (
          <MemorizationProgressBar stats={data.memStats} compact />
        )}

        <StudentSessionsList sessions={data.sessions} />

        <CollapsibleRubProgress activeCount={data.activeCount}>
          <View style={styles.progressMapContainer}>
            <RubProgressMap studentId={id!} mode="readonly" />
          </View>
        </CollapsibleRubProgress>

        <StudentStickersList stickers={data.stickers} />

        <StudentGuardiansList guardians={data.guardians} />

        <StudentEnrollmentHistory enrollments={data.enrollments} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressMapContainer: {
    minHeight: normalize(400),
  },
});
