import React, { useMemo } from 'react';
import { ScrollView, View, Text, Alert, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ProgramDetailHeader } from '@/features/programs/components/ProgramDetailHeader';
import { ProgramClassCard } from '@/features/programs/components/ProgramClassCard';
import { EnrollmentStatusBadge } from '@/features/programs/components/EnrollmentStatusBadge';
import { useProgram } from '@/features/programs/hooks/useProgram';
import { useProgramClasses } from '@/features/programs/hooks/useClasses';
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
import { Card } from '@/components/ui/Card';
import { spacing } from '@/theme/spacing';
import { lightTheme, colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import { buildTrackTree } from '@/features/programs/utils/enrollment-helpers';
import type { ProgramClassWithTeacher, ProgramTrack, ProgramTrackNode } from '@/features/programs/types/programs.types';

function AvailableTrackNode({
  node,
  depth,
  localize,
  isFreeProgramOrTrack,
  classesForTrack,
  handleJoinFree,
  handleEnroll,
  joinFreePending,
  enrollPending,
  t,
}: {
  node: ProgramTrackNode;
  depth: number;
  localize: (en: string | null | undefined, ar: string | null | undefined) => string;
  isFreeProgramOrTrack: (track?: ProgramTrack) => boolean;
  classesForTrack: (trackId: string) => ProgramClassWithTeacher[];
  handleJoinFree: (trackId?: string) => void;
  handleEnroll: (classId: string, trackId: string | null) => void;
  joinFreePending: boolean;
  enrollPending: boolean;
  t: (key: string) => string;
}) {
  const isParent = node.children.length > 0;

  if (isParent) {
    return (
      <View style={depth > 0 ? styles.childTrackContainer : undefined}>
        <Text style={styles.parentTrackLabel}>
          {localize(node.name, node.name_ar)}
        </Text>
        {(node.description || node.description_ar) && (
          <Text style={styles.trackDescription}>
            {localize(node.description, node.description_ar)}
          </Text>
        )}
        {node.children.map((child) => (
          <AvailableTrackNode
            key={child.id}
            node={child}
            depth={depth + 1}
            localize={localize}
            isFreeProgramOrTrack={isFreeProgramOrTrack}
            classesForTrack={classesForTrack}
            handleJoinFree={handleJoinFree}
            handleEnroll={handleEnroll}
            joinFreePending={joinFreePending}
            enrollPending={enrollPending}
            t={t}
          />
        ))}
      </View>
    );
  }

  const trackClasses = classesForTrack(node.id);
  const isFree = isFreeProgramOrTrack(node);

  return (
    <View style={depth > 0 ? styles.childTrackContainer : undefined}>
      <Card variant="outlined" style={styles.trackCard}>
        <Text style={styles.trackCardName} numberOfLines={2}>
          {localize(node.name, node.name_ar)}
        </Text>

        {(node.description || node.description_ar) && (
          <Text style={styles.trackDescription}>
            {localize(node.description, node.description_ar)}
          </Text>
        )}

        {isFree ? (
          <Button
            title={t('programs.actions.join')}
            onPress={() => handleJoinFree(node.id)}
            loading={joinFreePending}
            size="sm"
          />
        ) : trackClasses.length > 0 ? (
          <View style={styles.classesContainer}>
            {trackClasses.map((pc: ProgramClassWithTeacher) => (
              <ProgramClassCard
                key={pc.id}
                programClass={pc}
                onEnroll={() => handleEnroll(pc.id, node.id)}
                disabled={enrollPending}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.noClasses}>
            {t('programs.labels.noClasses')}
          </Text>
        )}
      </Card>
    </View>
  );
}

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

  // Available teachers — only for free programs
  const showAvailableTeachers = program?.category === 'free';
  const { data: availableTeachers } = useAvailableTeachers(
    showAvailableTeachers ? id : undefined,
  );

  // Find user's enrollment for this program (per track)
  const myEnrollments = useMemo(
    () => enrollments?.filter((e) => e.program_id === id) ?? [],
    [enrollments, id],
  );

  const hasActiveEnrollment = myEnrollments.some((e) => e.status === 'active');

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
    if (track?.track_type === 'free') return true;
    return false;
  };

  const classesForTrack = (trackId: string) =>
    programClasses?.filter((c) => c.track_id === trackId) ?? [];

  // Get all leaf tracks (tracks with no children — these are enrollable)
  const trackTree = useMemo(
    () => buildTrackTree(program.program_tracks),
    [program.program_tracks],
  );

  const leafTracks = useMemo(() => {
    const leaves: ProgramTrack[] = [];
    const collectLeaves = (nodes: ProgramTrackNode[]) => {
      for (const node of nodes) {
        if (node.children.length === 0) {
          leaves.push(node);
        } else {
          collectLeaves(node.children);
        }
      }
    };
    collectLeaves(trackTree);
    return leaves;
  }, [trackTree]);

  // Separate enrolled tracks from available tracks (leaf tracks only)
  const enrolledTracks = leafTracks.filter((t) => isEnrolledInTrack(t.id));
  const availableTracks = leafTracks.filter((t) => !isEnrolledInTrack(t.id));

  // Build available track tree for hierarchical display
  const availableTrackTree = useMemo(() => {
    const availableIds = new Set(availableTracks.map((t) => t.id));
    const filterTree = (nodes: ProgramTrackNode[]): ProgramTrackNode[] => {
      return nodes
        .map((node) => {
          if (node.children.length === 0) {
            return availableIds.has(node.id) ? node : null;
          }
          const filteredChildren = filterTree(node.children);
          if (filteredChildren.length === 0) return null;
          return { ...node, children: filteredChildren };
        })
        .filter((n): n is ProgramTrackNode => n !== null);
    };
    return filterTree(trackTree);
  }, [trackTree, availableTracks]);

  // Show quick actions row?
  const showQuickActions =
    hasActiveEnrollment || showAvailableTeachers;

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

        {/* ── Quick Actions Row ── */}
        {showQuickActions && (
          <View style={styles.quickActions}>
            {showAvailableTeachers && (
              <Pressable
                style={styles.quickActionItem}
                onPress={() => router.push(`/(student)/available-now/${id}`)}
                accessibilityRole="button"
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconGreen]}>
                  <Ionicons name="radio-button-on" size={normalize(18)} color={colors.primary[600]} />
                </View>
                <Text style={styles.quickActionLabel} numberOfLines={1}>
                  {t('availability.availableNow')}
                </Text>
                {availableTeachers?.length ? (
                  <View style={styles.quickActionBadge}>
                    <Text style={styles.quickActionBadgeText}>{availableTeachers.length}</Text>
                  </View>
                ) : null}
              </Pressable>
            )}

            {hasActiveEnrollment && (
              <Pressable
                style={styles.quickActionItem}
                onPress={() =>
                  router.push({
                    pathname: '/(student)/program/[programId]/leaderboard',
                    params: { programId: id! },
                  })
                }
                accessibilityRole="button"
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconAmber]}>
                  <Ionicons name="podium-outline" size={normalize(18)} color={colors.secondary[600]} />
                </View>
                <Text style={styles.quickActionLabel} numberOfLines={1}>
                  {t('gamification.programLeaderboard.title')}
                </Text>
              </Pressable>
            )}

            {program.category === 'structured' && hasActiveEnrollment && (
              <Pressable
                style={styles.quickActionItem}
                onPress={() =>
                  router.push({
                    pathname: '/(student)/mutoon/[programId]',
                    params: { programId: id! },
                  })
                }
                accessibilityRole="button"
              >
                <View style={[styles.quickActionIcon, styles.quickActionIconIndigo]}>
                  <Ionicons name="book-outline" size={normalize(18)} color={colors.accent.indigo[600]} />
                </View>
                <Text style={styles.quickActionLabel} numberOfLines={1}>
                  {t('mutoon.title')}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Queue / Fair Usage ── */}
        {program.category === 'free' && availableTeachers?.length === 0 && (
          <View style={styles.section}>
            <JoinQueueButton programId={id!} />
          </View>
        )}
        {program.category === 'free' && (
          <View style={styles.section}>
            <FairUsageNotice programId={id!} />
          </View>
        )}

        {/* ── Free program with no tracks — direct enrollment card ── */}
        {program.category === 'free' && program.program_tracks.length === 0 && (
          <View style={styles.section}>
            {isEnrolledInTrack(null) ? (
              <Card variant="outlined" style={styles.enrolledCard}>
                <View style={styles.enrolledCardRow}>
                  <EnrollmentStatusBadge status={getTrackEnrollment(null)!.status} />
                  <Pressable
                    onPress={() => handleLeave(getTrackEnrollment(null)!.id)}
                    disabled={leaveProgram.isPending}
                    accessibilityRole="button"
                  >
                    <Text style={styles.leaveText}>{t('programs.actions.leave')}</Text>
                  </Pressable>
                </View>
              </Card>
            ) : (
              <Button
                title={t('programs.actions.join')}
                onPress={() => handleJoinFree()}
                loading={joinFree.isPending}
              />
            )}
          </View>
        )}

        {/* ── Enrolled Tracks ── */}
        {enrolledTracks.length > 0 && (
          <View style={styles.tracksSection}>
            <Text style={styles.sectionTitle}>{t('programs.myPrograms')}</Text>
            {enrolledTracks.map((track) => {
              const trackEnrollment = getTrackEnrollment(track.id)!;
              return (
                <Card key={track.id} variant="outlined" style={styles.trackCard}>
                  <View style={styles.trackCardHeader}>
                    <Text style={styles.trackCardName} numberOfLines={2}>
                      {localize(track.name, track.name_ar)}
                    </Text>
                    <EnrollmentStatusBadge status={trackEnrollment.status} />
                  </View>

                  {(track.description || track.description_ar) && (
                    <Text style={styles.trackDescription}>
                      {localize(track.description, track.description_ar)}
                    </Text>
                  )}

                  {trackEnrollment.status === 'waitlisted' && trackEnrollment.class_id ? (
                    <WaitlistPositionCard
                      classId={trackEnrollment.class_id}
                      userId={userId}
                      enrollmentId={trackEnrollment.id}
                      onLeave={() => handleLeave(trackEnrollment.id)}
                      leavePending={leaveProgram.isPending}
                    />
                  ) : (
                    <Pressable
                      onPress={() => handleLeave(trackEnrollment.id)}
                      disabled={leaveProgram.isPending}
                      style={styles.leaveButton}
                      accessibilityRole="button"
                    >
                      <Ionicons name="exit-outline" size={normalize(14)} color={colors.accent.red[500]} />
                      <Text style={styles.leaveText}>{t('programs.actions.leave')}</Text>
                    </Pressable>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {/* ── Available Tracks ── */}
        {availableTrackTree.length > 0 && (
          <View style={styles.tracksSection}>
            <Text style={styles.sectionTitle}>{t('programs.labels.tracks')}</Text>
            {availableTrackTree.map((node) => (
              <AvailableTrackNode
                key={node.id}
                node={node}
                depth={0}
                localize={localize}
                isFreeProgramOrTrack={isFreeProgramOrTrack}
                classesForTrack={classesForTrack}
                handleJoinFree={handleJoinFree}
                handleEnroll={handleEnroll}
                joinFreePending={joinFree.isPending}
                enrollPending={enroll.isPending}
                t={t}
              />
            ))}
          </View>
        )}
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
  },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.base,
  },

  /* ── Quick Actions ── */
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: lightTheme.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  quickActionIcon: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIconGreen: {
    backgroundColor: colors.primary[50],
  },
  quickActionIconAmber: {
    backgroundColor: colors.secondary[50],
  },
  quickActionIconIndigo: {
    backgroundColor: colors.accent.indigo[50],
  },
  quickActionLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.text,
    textAlign: 'center',
  },
  quickActionBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: radius.full,
    minWidth: normalize(20),
    height: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  quickActionBadgeText: {
    ...typography.textStyles.label,
    color: colors.white,
  },

  /* ── Section Headers ── */
  tracksSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.xs,
  },

  /* ── Track Cards ── */
  parentTrackLabel: {
    ...typography.textStyles.bodyMedium,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  childTrackContainer: {
    paddingStart: spacing.lg,
  },
  trackCard: {
    gap: spacing.sm,
  },
  trackCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trackCardName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  trackDescription: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  classesContainer: {
    gap: spacing.sm,
  },
  noClasses: {
    ...typography.textStyles.caption,
    color: lightTheme.textTertiary,
    fontStyle: 'italic',
  },

  /* ── Enrolled Card ── */
  enrolledCard: {
    gap: spacing.sm,
  },
  enrolledCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  /* ── Leave Action ── */
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  leaveText: {
    ...typography.textStyles.caption,
    color: colors.accent.red[500],
  },
});
