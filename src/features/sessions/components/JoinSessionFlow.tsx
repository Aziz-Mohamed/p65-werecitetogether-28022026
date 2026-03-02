import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Linking,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { useAuthStore } from '@/stores/authStore';
import { useCreateDraftSession } from '../hooks/useCreateDraftSession';
import { useDailySessionCount, useQueueSize } from '@/features/queue/hooks/useQueue';
import type { AvailableTeacher } from '@/features/teacher-availability/types';

interface JoinSessionFlowProps {
  teacher: AvailableTeacher | null;
  programId: string;
  programSettings?: Record<string, unknown> | null;
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  onDismiss: () => void;
}

export const JoinSessionFlow: React.FC<JoinSessionFlowProps> = ({
  teacher,
  programId,
  programSettings,
  bottomSheetRef,
  onDismiss,
}) => {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const createDraft = useCreateDraftSession();
  const [sessionCreated, setSessionCreated] = useState(false);

  const studentId = profile?.id;
  const { data: dailyCount = 0 } = useDailySessionCount(studentId, programId);
  const { data: queueSize = 0 } = useQueueSize(programId);

  const maxDaily = (programSettings?.max_daily_free_sessions as number) ?? 2;
  const isAtDailyLimit = dailyCount >= maxDaily && queueSize > 0;

  const handleJoin = useCallback(async () => {
    if (!teacher || !profile) return;

    // Check teacher capacity
    if (
      teacher.availability.current_session_count >=
      teacher.availability.max_concurrent_students
    ) {
      Alert.alert(t('sessionJoin.sessionFull'));
      return;
    }

    // Check daily limit (only enforced when queue has students)
    if (isAtDailyLimit) {
      Alert.alert(t('sessionJoin.dailyLimitReached'));
      return;
    }

    try {
      await createDraft.mutateAsync({
        teacherId: teacher.id,
        programId,
        meetingLinkUsed: teacher.profile.meeting_link ?? undefined,
        studentId: profile.id,
      });
      setSessionCreated(true);
    } catch (err) {
      Alert.alert(
        t('common.error'),
        err instanceof Error ? err.message : t('common.unknownError'),
      );
    }
  }, [teacher, profile, programId, createDraft, isAtDailyLimit, t]);

  const handleOpenMeetingLink = useCallback(async () => {
    const link = teacher?.profile.meeting_link;
    if (!link) return;

    try {
      await Linking.openURL(link);
    } catch {
      // Linking failed — offer copy-to-clipboard fallback
      Alert.alert(
        t('sessionJoin.openMeetingFailed'),
        undefined,
        [
          {
            text: t('sessionJoin.copyLink'),
            onPress: async () => {
              await Clipboard.setStringAsync(link);
              Alert.alert(t('sessionJoin.linkCopied'));
            },
          },
          { text: t('common.close'), style: 'cancel' },
        ],
      );
    }
  }, [teacher, t]);

  const handleClose = useCallback(() => {
    setSessionCreated(false);
    onDismiss();
  }, [onDismiss]);

  if (!teacher) return null;

  const displayName =
    teacher.profile.display_name ?? teacher.profile.full_name;
  const meetingLink = teacher.profile.meeting_link;
  const platform = teacher.profile.meeting_platform ?? 'link';

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['45%']}
      enablePanDownToClose
      onClose={handleClose}
    >
      <BottomSheetView style={styles.content}>
        <View style={styles.teacherInfo}>
          <Avatar
            source={teacher.profile.avatar_url ?? undefined}
            name={displayName}
            size="lg"
          />
          <View style={styles.teacherDetails}>
            <Text style={styles.teacherName}>{displayName}</Text>
            {meetingLink && (
              <View style={styles.platformRow}>
                <Ionicons name="videocam" size={16} color={primary[500]} />
                <Text style={styles.platformText}>
                  {platform.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {isAtDailyLimit && (
          <Text style={styles.dailyLimitText}>
            {t('sessionJoin.dailyLimitReached')}
          </Text>
        )}

        {!sessionCreated ? (
          <Button
            title={t('teacherAvailability.joinSession')}
            onPress={handleJoin}
            variant="primary"
            size="lg"
            fullWidth
            loading={createDraft.isPending}
            disabled={isAtDailyLimit}
          />
        ) : (
          <View style={styles.successSection}>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={24} color={lightTheme.success} />
              <Text style={styles.successText}>
                {t('sessionJoin.sessionCreated')}
              </Text>
            </View>

            {meetingLink ? (
              <Button
                title={t('sessionJoin.openMeeting', {
                  platform: platform.replace('_', ' '),
                })}
                onPress={handleOpenMeetingLink}
                variant="primary"
                size="lg"
                fullWidth
                icon={<Ionicons name="open-outline" size={20} color="#fff" />}
              />
            ) : (
              <Text style={styles.noLinkText}>
                {t('common.noMeetingLink')}
              </Text>
            )}

            <Button
              title={t('common.close')}
              onPress={handleClose}
              variant="ghost"
              size="sm"
            />
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.xl,
    gap: spacing.xl,
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
  dailyLimitText: {
    ...typography.textStyles.body,
    color: lightTheme.error,
    textAlign: 'center',
  },
  successSection: {
    gap: spacing.md,
    alignItems: 'center',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: lightTheme.background,
    paddingBlock: spacing.sm,
    paddingInline: spacing.base,
    borderRadius: radius.sm,
  },
  successText: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.success,
  },
  noLinkText: {
    ...typography.textStyles.body,
    color: neutral[400],
    textAlign: 'center',
  },
});
