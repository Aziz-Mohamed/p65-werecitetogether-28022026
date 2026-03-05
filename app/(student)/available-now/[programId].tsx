import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Alert, Linking, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback';
import {
  AvailableTeacherCard,
  AvailableTeacherCardSkeleton,
} from '@/features/teacher-availability/components/AvailableTeacherCard';
import { useAvailableTeachers } from '@/features/teacher-availability/hooks/useAvailableTeachers';
import { useJoinSession } from '@/features/teacher-availability/hooks/useJoinSession';
import type { AvailableTeacher } from '@/features/teacher-availability/types/availability.types';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function AvailableNowScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { t } = useTranslation();
  const { data: teachers, isLoading, error, refetch } = useAvailableTeachers(programId);
  const joinSession = useJoinSession();

  const handleJoin = useCallback(
    async (teacher: AvailableTeacher) => {
      const meetingLink = teacher.profiles?.meeting_link;
      if (!meetingLink) return;

      joinSession.mutate(
        { availabilityId: teacher.id, meetingLink, programId: programId! },
        {
          onSuccess: async (result) => {
            if (!result) {
              Alert.alert(t('availability.teacherFull'), t('availability.joinFailed'));
              return;
            }
            try {
              await Linking.openURL(meetingLink);
            } catch {
              Alert.alert(t('availability.copyLink'), meetingLink);
            }
          },
          onError: () => {
            Alert.alert(t('common.error'), t('availability.joinFailed'));
          },
        },
      );
    },
    [joinSession, programId, t],
  );

  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('availability.availableNow')}</Text>

        {isLoading ? (
          <View style={styles.list}>
            <AvailableTeacherCardSkeleton />
            <AvailableTeacherCardSkeleton />
            <AvailableTeacherCardSkeleton />
          </View>
        ) : teachers && teachers.length > 0 ? (
          <View style={styles.list}>
            {teachers.map((teacher) => (
              <AvailableTeacherCard
                key={teacher.id}
                teacher={teacher}
                onJoin={handleJoin}
                isJoining={joinSession.isPending}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('availability.noTeachersAvailable')}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});
