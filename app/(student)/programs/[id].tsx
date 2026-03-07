import React, { useMemo } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { Screen } from '@/components/layout/Screen';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ProgramDetailHeader } from '@/features/programs/components/ProgramDetailHeader';
import { TrackList } from '@/features/programs/components/TrackList';
import { ProgramClassCard } from '@/features/programs/components/ProgramClassCard';
import { EnrollmentStatusBadge } from '@/features/programs/components/EnrollmentStatusBadge';
import { useProgram } from '@/features/programs/hooks/useProgram';
import { useProgramClasses } from '@/features/programs/hooks/useCohorts';
import { useEnroll, useJoinFreeProgram } from '@/features/programs/hooks/useEnroll';
import { useEnrollments } from '@/features/programs/hooks/useEnrollments';
import { useLeaveProgram } from '@/features/programs/hooks/useLeaveProgram';
import { useAvailableTeachers } from '@/features/teacher-availability/hooks/useAvailableTeachers';
import { JoinQueueButton } from '@/features/queue/components/JoinQueueButton';
import { FairUsageNotice } from '@/features/queue/components/FairUsageNotice';
import { WaitlistPositionCard } from '@/features/programs/components/WaitlistPositionCard';
import { useLocalizedField, getEnrollErrorKey } from '@/features/programs/utils/enrollment-helpers';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import type { ProgramClassWithTeacher, ProgramTrack } from '@/features/programs/types/programs.types';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const localize = useLocalizedField();
  const session = useAuthStore((s) => s.session);
  const userId = session?.user?.id;

  const { data: program, isLoading, error, refetch } = useProgram(id);
  const { data: programClasses } = useProgramClasses({ programId: id! });
  const { data: enrollments } = useEnrollments(userId);
  const enroll = useEnroll(id!);
  const joinFree = useJoinFreeProgram(id!);
  const leaveProgram = useLeaveProgram();

  // Available teachers — only for free/mixed programs
  const showAvailableTeachers = program?.category === 'free' || program?.category === 'mixed';
  const { data: availableTeachers } = useAvailableTeachers(
    showAvailableTeachers ? id : undefined,
  );

  // Find user's enrollment for this program (per track)
  const myEnrollments = useMemo(
    () => enrollments?.filter((e) => e.program_id === id) ?? [],
    [enrollments, id],
  );

  const isEnrolledInTrack = (trackId: string | null) =>
    myEnrollments.some(
      (e) =>
        e.track_id === trackId &&
        (e.status === 'active' || e.status === 'pending' || e.status === 'waitlisted'),
    );

  const getTrackEnrollment = (trackId: string | null) =>
    myEnrollments.find(
      (e) =>
        e.track_id === trackId &&
        (e.status === 'active' || e.status === 'pending' || e.status === 'waitlisted'),
    );

  const handleEnroll = (classId: string, trackId: string | null) => {
    Alert.alert(
      t('programs.confirm.enroll'),
      t('programs.confirm.enrollBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('programs.actions.enroll'),
          onPress: () =>
            enroll.mutate(
              { programId: id!, trackId: trackId ?? undefined, classId },
              {
                onError: (err: { message?: string }) => {
                  const key = getEnrollErrorKey(err.message);
                  Alert.alert(t('common.error'), t(key));
                },
              },
            ),
        },
      ],
    );
  };

  const handleJoinFree = (trackId?: string) => {
    if (!userId) return;
    joinFree.mutate(
      { userId, trackId },
      {
        onError: () => {
          Alert.alert(t('common.error'), t('programs.errors.enrollFailed'));
        },
      },
    );
  };

  const handleLeave = (enrollmentId: string) => {
    if (!userId) return;
    Alert.alert(
      t('programs.confirm.leave'),
      t('programs.confirm.leaveBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('programs.actions.leave'),
          style: 'destructive',
          onPress: () => leaveProgram.mutate({ enrollmentId, userId }),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error || !program) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const isFreeProgramOrTrack = (track?: ProgramTrack) => {
    if (program.category === 'free') return true;
    if (program.category === 'mixed' && track?.track_type === 'free') return true;
    return false;
  };

  const classesForTrack = (trackId: string) =>
    programClasses?.filter((c) => c.track_id === trackId) ?? [];

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="arrow-back" size={normalize(24)} color={lightTheme.text} />
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <ProgramDetailHeader program={program} />

        {/* Leaderboard */}
        {myEnrollments.some((e) => e.status === 'active') && (
          <View style={styles.section}>
            <Button
              title={t('gamification.programLeaderboard.title')}
              onPress={() =>
                router.push({
                  pathname: '/(student)/program/[programId]/leaderboard',
                  params: { programId: id! },
                })
              }
              variant="secondary"
              icon={<Ionicons name="podium-outline" size={16} color={lightTheme.text} />}
            />
          </View>
        )}

        {/* Mutoon Progress — structured programs with active enrollment */}
        {program.category === 'structured' &&
          myEnrollments.some((e) => e.status === 'active') && (
          <View style={styles.section}>
            <Button
              title={t('mutoon.title')}
              onPress={() =>
                router.push({
                  pathname: '/(student)/mutoon/[programId]',
                  params: { programId: id! },
                })
              }
              variant="secondary"
              icon={<Ionicons name="book-outline" size={16} color={lightTheme.text} />}
            />
          </View>
        )}

        {/* Available Teachers — free/mixed programs */}
        {showAvailableTeachers && (
          <View style={styles.section}>
            <Button
              title={`${t('availability.availableNow')}${availableTeachers?.length ? ` (${availableTeachers.length})` : ''}`}
              onPress={() => router.push(`/(student)/available-now/${id}`)}
              variant="default"
              icon={<Ionicons name="radio-button-on" size={16} color="#22C55E" />}
            />
          </View>
        )}

        {/* Queue — free programs with no teachers available */}
        {program.category === 'free' && availableTeachers?.length === 0 && (
          <View style={styles.section}>
            <JoinQueueButton programId={id!} />
          </View>
        )}

        {/* Fair usage notice — free programs */}
        {program.category === 'free' && (
          <View style={styles.section}>
            <FairUsageNotice programId={id!} />
          </View>
        )}

        {/* Free program with no tracks — direct join */}
        {program.category === 'free' && program.program_tracks.length === 0 && (
          <View style={styles.section}>
            {isEnrolledInTrack(null) ? (
              <View style={styles.enrolledRow}>
                <EnrollmentStatusBadge status={getTrackEnrollment(null)!.status} />
                <Button
                  title={t('programs.actions.leave')}
                  onPress={() => handleLeave(getTrackEnrollment(null)!.id)}
                  variant="danger"
                  size="sm"
                  loading={leaveProgram.isPending}
                />
              </View>
            ) : (
              <Button
                title={t('programs.actions.join')}
                onPress={() => handleJoinFree()}
                loading={joinFree.isPending}
              />
            )}
          </View>
        )}

        {/* Tracks with class/join actions */}
        {program.program_tracks.map((track) => {
          const enrolled = isEnrolledInTrack(track.id);
          const trackEnrollment = getTrackEnrollment(track.id);
          const trackClasses = classesForTrack(track.id);
          const isFree = isFreeProgramOrTrack(track);

          return (
            <View key={track.id} style={styles.trackSection}>
              <View style={styles.trackHeader}>
                <Text style={styles.trackName} numberOfLines={1}>
                  {localize(track.name, track.name_ar)}
                </Text>
                {enrolled && trackEnrollment && (
                  <EnrollmentStatusBadge status={trackEnrollment.status} />
                )}
              </View>

              {(track.description || track.description_ar) && (
                <Text style={styles.trackDescription}>
                  {localize(track.description, track.description_ar)}
                </Text>
              )}

              {enrolled && trackEnrollment ? (
                trackEnrollment.status === 'waitlisted' && trackEnrollment.class_id ? (
                  <WaitlistPositionCard
                    classId={trackEnrollment.class_id}
                    userId={userId}
                    enrollmentId={trackEnrollment.id}
                    onLeave={() => handleLeave(trackEnrollment.id)}
                    leavePending={leaveProgram.isPending}
                  />
                ) : (
                  <Button
                    title={t('programs.actions.leave')}
                    onPress={() => handleLeave(trackEnrollment.id)}
                    variant="danger"
                    size="sm"
                    loading={leaveProgram.isPending}
                  />
                )
              ) : isFree ? (
                <Button
                  title={t('programs.actions.join')}
                  onPress={() => handleJoinFree(track.id)}
                  loading={joinFree.isPending}
                  variant="default"
                />
              ) : trackClasses.length > 0 ? (
                trackClasses.map((pc: ProgramClassWithTeacher) => (
                  <ProgramClassCard
                    key={pc.id}
                    programClass={pc}
                    onEnroll={() => handleEnroll(pc.id, track.id)}
                    disabled={enroll.isPending}
                  />
                ))
              ) : (
                <Text style={styles.noClasses}>
                  {t('programs.labels.noClasses')}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  content: {
    paddingBottom: spacing['3xl'],
    gap: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.base,
  },
  enrolledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trackSection: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trackName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    flex: 1,
  },
  trackDescription: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  noClasses: {
    ...typography.textStyles.caption,
    color: lightTheme.textTertiary,
    fontStyle: 'italic',
  },
});
