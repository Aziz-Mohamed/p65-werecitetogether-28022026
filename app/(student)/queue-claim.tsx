import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/stores/authStore';
import { useClaimQueueSlot, useJoinQueue } from '@/features/queue/hooks/useQueue';
import { useAvailableTeachers } from '@/features/teacher-availability/hooks/useTeacherAvailability';
import { JoinSessionFlow } from '@/features/sessions/components/JoinSessionFlow';
import { useProgramById } from '@/features/programs/hooks/usePrograms';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { AvailableTeacher } from '@/features/teacher-availability/types';

export default function QueueClaimScreen() {
  const { queueEntryId, programId } = useLocalSearchParams<{
    queueEntryId: string;
    programId: string;
  }>();
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const claimSlot = useClaimQueueSlot();
  const joinQueue = useJoinQueue();

  const { data: teachers, isLoading: teachersLoading } = useAvailableTeachers(programId);
  const { data: program } = useProgramById(programId);

  const [expired, setExpired] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<AvailableTeacher | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // For now, pick the first available teacher as the one who triggered the queue offer.
  // A more robust approach would pass teacherId in the notification data.
  const teacher = teachers?.[0] ?? null;

  // Initialize countdown — queue entries expire 3 minutes after notification
  useEffect(() => {
    if (secondsLeft !== null) return;
    // Default 3-minute claim window from notification time
    setSecondsLeft(180);
  }, [secondsLeft]);

  // Countdown timer — use ref-based check to avoid re-creating interval on each tick
  const timerStarted = useRef(false);
  useEffect(() => {
    if (secondsLeft === null || timerStarted.current) return;
    timerStarted.current = true;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsLeft]);

  const handleClaim = useCallback(async () => {
    if (!queueEntryId || !programId || !profile?.id) return;

    try {
      await claimSlot.mutateAsync({
        queueEntryId,
        studentId: profile.id,
        programId,
      });
      setClaimed(true);
      if (teacher) {
        setSelectedTeacher(teacher);
        bottomSheetRef.current?.snapToIndex(0);
      }
    } catch (err) {
      // Entry already expired on server
      setExpired(true);
    }
  }, [queueEntryId, programId, profile, claimSlot, teacher]);

  const handleRejoinQueue = useCallback(async () => {
    if (!programId || !profile?.id) return;

    try {
      await joinQueue.mutateAsync({
        studentId: profile.id,
        programId,
      });
      Alert.alert(t('queue.joinedQueue'));
      router.back();
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof Error ? err.message : t('common.unknownError'),
      );
    }
  }, [programId, profile, joinQueue, t, router]);

  const handleDismissSheet = useCallback(() => {
    setSelectedTeacher(null);
    bottomSheetRef.current?.close();
    router.back();
  }, [router]);

  if (!queueEntryId || !programId) {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('sessionJoin.linkInvalid')}</Text>
          <Button
            title={t('sessionJoin.goToPrograms')}
            onPress={() => router.replace('/(student)/(tabs)/programs')}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  if (teachersLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      </Screen>
    );
  }

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : 0;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : 0;
  const isUrgent = secondsLeft !== null && secondsLeft < 60;

  const displayName = teacher
    ? teacher.profile.display_name ?? teacher.profile.full_name
    : '';
  const platform = teacher?.profile.meeting_platform ?? 'link';

  return (
    <Screen>
      <View style={styles.backRow}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<Ionicons name="arrow-back" size={20} color={primary[600]} />}
        />
      </View>

      <View style={styles.container}>
        {expired ? (
          <Card style={styles.expiredCard}>
            <Ionicons name="time-outline" size={48} color={neutral[300]} />
            <Text style={styles.expiredTitle}>
              {t('sessionJoin.offerExpired')}
            </Text>
            <Button
              title={t('sessionJoin.rejoinQueue')}
              onPress={handleRejoinQueue}
              variant="primary"
              size="sm"
              fullWidth
              loading={joinQueue.isPending}
              style={styles.actionButton}
            />
            <Button
              title={t('sessionJoin.goToPrograms')}
              onPress={() => router.replace('/(student)/(tabs)/programs')}
              variant="ghost"
              size="sm"
            />
          </Card>
        ) : (
          <>
            {teacher && (
              <Card style={styles.teacherCard}>
                <View style={styles.teacherInfo}>
                  <Avatar
                    source={teacher.profile.avatar_url ?? undefined}
                    name={displayName}
                    size="lg"
                  />
                  <View style={styles.teacherDetails}>
                    <Text style={styles.teacherName}>{displayName}</Text>
                    <View style={styles.platformRow}>
                      <Ionicons
                        name="videocam"
                        size={16}
                        color={primary[500]}
                      />
                      <Text style={styles.platformText}>
                        {platform.replaceAll('_', ' ')}
                      </Text>
                    </View>
                    {teacher.ratingStats?.average_rating != null && (
                      <View style={styles.ratingRow}>
                        <Ionicons
                          name="star"
                          size={14}
                          color={primary[500]}
                        />
                        <Text style={styles.ratingText}>
                          {teacher.ratingStats.average_rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            )}

            <View style={styles.timerSection}>
              <Ionicons
                name="timer-outline"
                size={24}
                color={isUrgent ? lightTheme.error : neutral[500]}
              />
              <Text
                style={[
                  styles.timerText,
                  isUrgent && styles.timerUrgent,
                ]}
                accessibilityLabel={t('sessionJoin.secondsRemaining', {
                  seconds: secondsLeft ?? 0,
                })}
              >
                {minutes}:{seconds.toString().padStart(2, '0')}
              </Text>
            </View>

            <Button
              title={t('sessionJoin.claimAndJoin')}
              onPress={handleClaim}
              variant="primary"
              size="lg"
              fullWidth
              loading={claimSlot.isPending}
              style={styles.actionButton}
            />
          </>
        )}
      </View>

      <JoinSessionFlow
        teacher={selectedTeacher}
        programId={programId ?? ''}
        programSettings={program?.settings as Record<string, unknown> | null}
        bottomSheetRef={bottomSheetRef}
        onDismiss={handleDismissSheet}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.textStyles.body,
    color: lightTheme.error,
    textAlign: 'center',
  },
  backRow: {
    flexDirection: 'row',
    paddingBlockStart: spacing.sm,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingInline: spacing.base,
    gap: spacing.xl,
  },
  teacherCard: {
    padding: spacing.lg,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  teacherDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  teacherName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  platformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  platformText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  ratingText: {
    ...typography.textStyles.caption,
    color: primary[600],
    fontWeight: '600',
  },
  timerSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  timerText: {
    ...typography.textStyles.heading,
    color: neutral[500],
    fontVariant: ['tabular-nums'],
  },
  timerUrgent: {
    color: lightTheme.error,
  },
  expiredCard: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  expiredTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    textAlign: 'center',
  },
  actionButton: {
    minHeight: 44,
  },
});
