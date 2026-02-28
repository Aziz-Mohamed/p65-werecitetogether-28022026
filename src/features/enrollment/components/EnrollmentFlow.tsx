import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { useEnroll } from '../hooks/useEnrollment';
import { useJoinWaitlist, useWaitlistPosition } from '../hooks/useWaitlist';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

interface EnrollmentFlowProps {
  studentId: string;
  programId: string;
  cohortId?: string;
  cohortName: string;
  enrolled: number;
  maxStudents: number;
  trackId?: string;
  visible: boolean;
  onDismiss: () => void;
}

export function EnrollmentFlow({
  studentId,
  programId,
  cohortId,
  cohortName,
  enrolled,
  maxStudents,
  trackId,
  visible,
  onDismiss,
}: EnrollmentFlowProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);
  const enroll = useEnroll();
  const joinWaitlist = useJoinWaitlist();
  const { data: waitlistPosition } = useWaitlistPosition(studentId, programId);
  const [done, setDone] = useState(false);

  const isFull = enrolled >= maxStudents;
  const isOnWaitlist = waitlistPosition != null && waitlistPosition > 0;

  const handleEnroll = useCallback(async () => {
    await enroll.mutateAsync({
      studentId,
      programId,
      trackId,
      cohortId,
    });
    setDone(true);
  }, [studentId, programId, trackId, cohortId, enroll]);

  const handleJoinWaitlist = useCallback(async () => {
    await joinWaitlist.mutateAsync({
      studentId,
      programId,
      trackId,
      cohortId,
    });
    setDone(true);
  }, [studentId, programId, trackId, cohortId, joinWaitlist]);

  const handleClose = useCallback(() => {
    setDone(false);
    onDismiss();
  }, [onDismiss]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={handleClose}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{cohortName}</Text>

        <View style={styles.capacityRow}>
          <Text style={styles.capacityText}>
            {t('enrollment.capacity', { enrolled, max: maxStudents })}
          </Text>
          {isFull && <Badge label={t('enrollment.full')} variant="error" size="sm" />}
        </View>

        {done ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={48} color={primary[500]} />
            <Text style={styles.successText}>
              {isFull ? t('enrollment.waitlistPosition', { position: (waitlistPosition ?? 0) + 1 }) : t('enrollment.pending')}
            </Text>
          </View>
        ) : isOnWaitlist ? (
          <View style={styles.waitlistInfo}>
            <Ionicons name="time-outline" size={24} color={neutral[400]} />
            <Text style={styles.waitlistText}>
              {t('enrollment.waitlistPosition', { position: waitlistPosition })}
            </Text>
          </View>
        ) : isFull ? (
          <Button
            title={t('enrollment.joinWaitlist')}
            onPress={handleJoinWaitlist}
            variant="secondary"
            loading={joinWaitlist.isPending}
            fullWidth
          />
        ) : (
          <Button
            title={t('programs.enroll')}
            onPress={handleEnroll}
            variant="primary"
            loading={enroll.isPending}
            fullWidth
          />
        )}
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.base,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  capacityText: {
    ...typography.textStyles.body,
    color: neutral[600],
  },
  successContainer: {
    alignItems: 'center',
    gap: spacing.md,
    paddingBlock: spacing.xl,
  },
  successText: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    textAlign: 'center',
  },
  waitlistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBlock: spacing.md,
  },
  waitlistText: {
    ...typography.textStyles.body,
    color: neutral[500],
  },
});
