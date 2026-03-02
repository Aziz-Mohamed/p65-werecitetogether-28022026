import React, { useCallback, useRef, useState, useEffect } from 'react';
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
import { useAvailableTeachers } from '@/features/teacher-availability/hooks/useTeacherAvailability';
import { useActiveDraftSession } from '@/features/sessions/hooks/useActiveDraftSession';
import { useProgramById } from '@/features/programs/hooks/usePrograms';
import { useJoinQueue } from '@/features/queue/hooks/useQueue';
import { JoinSessionFlow } from '@/features/sessions/components/JoinSessionFlow';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { AvailableTeacher } from '@/features/teacher-availability/types';

export default function SessionJoinScreen() {
  const { teacher: teacherParam, program: programParam } =
    useLocalSearchParams<{ teacher: string; program: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<AvailableTeacher | null>(null);
  const [activeSessionHandled, setActiveSessionHandled] = useState(false);
  const alertShownRef = useRef(false);

  // T017: Role check — if not student, redirect
  useEffect(() => {
    if (profile && profile.role !== 'student') {
      const roleHome =
        profile.role === 'teacher'
          ? '/(teacher)/(tabs)/'
          : profile.role === 'supervisor'
            ? '/(supervisor)/(tabs)/'
            : '/(student)/(tabs)/';
      Alert.alert(t('sessionJoin.studentsOnly'));
      router.replace(roleHome as `/${string}`);
    }
  }, [profile, router, t]);

  const {
    data: teachers,
    isLoading: teachersLoading,
    error: teachersError,
    refetch,
  } = useAvailableTeachers(programParam);
  const { data: program } = useProgramById(programParam);
  const { data: activeDraft, isLoading: draftLoading } =
    useActiveDraftSession(profile?.id);
  const joinQueue = useJoinQueue();

  // Find the specific teacher from the deep link
  const teacher = teachers?.find((item) => item.id === teacherParam) ?? null;

  // T018: Active session edge case
  useEffect(() => {
    if (draftLoading || activeSessionHandled || alertShownRef.current) return;
    if (!activeDraft) return;

    alertShownRef.current = true;
    Alert.alert(
      t('sessionJoin.alreadyActiveSession'),
      undefined,
      [
        {
          text: t('sessionJoin.viewCurrentSession'),
          onPress: () => router.replace('/(student)/(tabs)/'),
        },
        {
          text: t('sessionJoin.continueNewSession'),
          onPress: () => setActiveSessionHandled(true),
        },
      ],
    );
  }, [activeDraft, draftLoading, activeSessionHandled, router, t]);

  const handleOpenJoinFlow = useCallback(() => {
    if (!teacher) return;
    setSelectedTeacher(teacher);
    bottomSheetRef.current?.snapToIndex(0);
  }, [teacher]);

  // Auto-open join flow when teacher is found
  useEffect(() => {
    if (teacher && !selectedTeacher && (activeSessionHandled || !activeDraft)) {
      handleOpenJoinFlow();
    }
  }, [teacher, selectedTeacher, activeSessionHandled, activeDraft, handleOpenJoinFlow]);

  const handleDismiss = useCallback(() => {
    setSelectedTeacher(null);
    bottomSheetRef.current?.close();
  }, []);

  const handleJoinQueue = useCallback(async () => {
    if (!programParam || !profile?.id) return;
    try {
      await joinQueue.mutateAsync({
        studentId: profile.id,
        programId: programParam,
      });
      Alert.alert(t('queue.joinedQueue'));
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof Error ? err.message : t('common.unknownError'),
      );
    }
  }, [programParam, profile, joinQueue, t]);

  // Invalid params
  if (!teacherParam || !programParam) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="link-outline" size={48} color={neutral[300]} />
          <Text style={styles.errorTitle}>{t('sessionJoin.linkInvalid')}</Text>
          <Button
            title={t('sessionJoin.goToPrograms')}
            onPress={() => router.replace('/(student)/(tabs)/programs')}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  // Loading state
  if (teachersLoading || draftLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      </Screen>
    );
  }

  // Network error with retry
  if (teachersError) {
    return (
      <Screen>
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={neutral[300]} />
          <Text style={styles.errorTitle}>
            {t('sessionJoin.connectionError')}
          </Text>
          <Button
            title={t('common.retry')}
            onPress={() => refetch()}
            variant="primary"
          />
        </View>
      </Screen>
    );
  }

  // Teacher not available
  if (!teacher) {
    const displayName = teacherParam;
    return (
      <Screen>
        <View style={styles.backRow}>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
            size="sm"
            icon={
              <Ionicons name="arrow-back" size={20} color={primary[600]} />
            }
          />
        </View>
        <View style={styles.center}>
          <Ionicons
            name="person-outline"
            size={48}
            color={neutral[300]}
          />
          <Text style={styles.errorTitle}>
            {t('sessionJoin.teacherNotAvailable')}
          </Text>
          <Button
            title={t('sessionJoin.browseTeachers')}
            onPress={() =>
              router.replace({
                pathname: '/(student)/program/available-teachers',
                params: { programId: programParam },
              })
            }
            variant="primary"
          />
          <Button
            title={t('queue.notifyMe')}
            onPress={handleJoinQueue}
            variant="ghost"
            loading={joinQueue.isPending}
          />
        </View>
      </Screen>
    );
  }

  // Success — teacher found, show their card and join flow
  const displayName =
    teacher.profile.display_name ?? teacher.profile.full_name;
  const platform = teacher.profile.meeting_platform ?? 'link';

  return (
    <Screen>
      <View style={styles.backRow}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={
            <Ionicons name="arrow-back" size={20} color={primary[600]} />
          }
        />
      </View>

      <View style={styles.container}>
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
                <Ionicons name="videocam" size={16} color={primary[500]} />
                <Text style={styles.platformText}>
                  {platform.replaceAll('_', ' ')}
                </Text>
              </View>
              {teacher.ratingStats?.average_rating != null && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={primary[500]} />
                  <Text style={styles.ratingText}>
                    {teacher.ratingStats.average_rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>

        <Button
          title={t('teacherAvailability.joinSession')}
          onPress={handleOpenJoinFlow}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.joinButton}
        />
      </View>

      <JoinSessionFlow
        teacher={selectedTeacher}
        programId={programParam}
        programSettings={program?.settings as Record<string, unknown> | null}
        bottomSheetRef={bottomSheetRef}
        onDismiss={handleDismiss}
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
    paddingInline: spacing.xl,
  },
  errorTitle: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
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
  joinButton: {
    minHeight: 44,
  },
});
