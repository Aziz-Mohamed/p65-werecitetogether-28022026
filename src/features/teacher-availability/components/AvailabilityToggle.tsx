import React, { useRef, useMemo } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { GreenDotIndicator } from '@/components/ui/GreenDotIndicator';
import { LoadingState } from '@/components/feedback';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { useMyAvailability } from '../hooks/useMyAvailability';
import { useTeacherProfile } from '../hooks/useTeacherProfile';
import { useToggleAvailability } from '../hooks/useToggleAvailability';
import { ProgramSelector } from './ProgramSelector';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface AvailabilityToggleProps {
  eligiblePrograms: Array<{
    program_id: string;
    name: string;
    name_ar: string;
  }>;
}

export function AvailabilityToggle({ eligiblePrograms }: AvailabilityToggleProps) {
  const { t } = useTranslation();
  const localize = useLocalizedField();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { data: myAvailability = [], isLoading } = useMyAvailability();
  const { data: profile } = useTeacherProfile();
  const toggle = useToggleAvailability();

  const availableCount = useMemo(
    () => myAvailability.filter((a) => a.is_available).length,
    [myAvailability],
  );

  const hasNoPrograms = eligiblePrograms.length === 0;

  const handleGoAvailable = () => {
    if (!profile?.meeting_link) {
      Alert.alert(t('availability.meetingLink'), t('availability.configureMeetingLink'));
      return;
    }
    sheetRef.current?.present();
  };

  const handleGoOffline = () => {
    const available = myAvailability.filter((a) => a.is_available);
    for (const a of available) {
      toggle.mutate({ programId: a.program_id, isAvailable: false });
    }
  };

  // Map availability data with program names for ProgramSelector
  const selectorPrograms = useMemo(() => {
    return eligiblePrograms.map((ep) => {
      const existing = myAvailability.find((a) => a.program_id === ep.program_id);
      return {
        id: existing?.id ?? '',
        program_id: ep.program_id,
        name: ep.name,
        name_ar: ep.name_ar,
        is_available: existing?.is_available ?? false,
        max_students: existing?.max_students ?? 1,
        active_student_count: existing?.active_student_count ?? 0,
      };
    });
  }, [eligiblePrograms, myAvailability]);

  if (isLoading) return <LoadingState />;

  return (
    <View style={styles.container}>
      {/* Status Summary */}
      <Card variant={availableCount > 0 ? 'primary-glow' : 'outlined'} style={styles.statusCard}>
        <View style={styles.statusRow}>
          <View style={styles.statusInfo}>
            <View style={styles.statusDotRow}>
              <GreenDotIndicator isAvailable={availableCount > 0} />
              <Text style={styles.statusText}>
                {availableCount > 0
                  ? t('availability.availableForPrograms', { count: availableCount })
                  : t('availability.offline')}
              </Text>
            </View>
          </View>
          <Ionicons
            name={availableCount > 0 ? 'radio-button-on' : 'radio-button-off'}
            size={24}
            color={availableCount > 0 ? '#22C55E' : colors.neutral[400]}
          />
        </View>
      </Card>

      {/* Toggle Button */}
      {hasNoPrograms ? (
        <Card variant="outlined" style={styles.disabledCard}>
          <Ionicons name="information-circle-outline" size={20} color={colors.neutral[400]} />
          <Text style={styles.disabledText}>{t('availability.noFreePrograms')}</Text>
        </Card>
      ) : availableCount > 0 ? (
        <Button
          title={t('availability.goOffline')}
          onPress={handleGoOffline}
          variant="ghost"
          size="lg"
          icon={<Ionicons name="stop-circle-outline" size={20} color={colors.accent.rose[500]} />}
          style={styles.offlineButton}
          loading={toggle.isPending}
        />
      ) : (
        <Button
          title={t('availability.goAvailable')}
          onPress={handleGoAvailable}
          variant="primary"
          size="lg"
          icon={<Ionicons name="radio-button-on" size={20} color={colors.white} />}
          style={styles.availableButton}
          loading={toggle.isPending}
        />
      )}

      {/* Per-program status */}
      {myAvailability
        .filter((a) => a.is_available)
        .map((a) => (
          <Card key={a.id} variant="default" style={styles.programStatusCard}>
            <View style={styles.programStatusRow}>
              <View style={styles.programStatusInfo}>
                <Text style={styles.programStatusName}>
                  {localize(a.programs?.name, a.programs?.name_ar)}
                </Text>
                <Text style={styles.programStatusMeta}>
                  {t('availability.studentsCount', {
                    current: a.active_student_count,
                    max: a.max_students,
                  })}
                </Text>
              </View>
              <GreenDotIndicator isAvailable />
            </View>
          </Card>
        ))}

      {/* Bottom Sheet */}
      <ProgramSelector ref={sheetRef} programs={selectorPrograms} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  statusCard: {
    padding: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusInfo: {
    flex: 1,
  },
  statusDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusText: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
    fontSize: normalize(16),
  },
  availableButton: {
    backgroundColor: '#22C55E',
  },
  offlineButton: {
    backgroundColor: colors.accent.rose[50],
  },
  disabledCard: {
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderStyle: 'dashed',
  },
  disabledText: {
    ...typography.textStyles.body,
    color: colors.neutral[500],
    flex: 1,
  },
  programStatusCard: {
    padding: spacing.md,
  },
  programStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programStatusInfo: {
    flex: 1,
    gap: normalize(2),
  },
  programStatusName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  programStatusMeta: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
});
