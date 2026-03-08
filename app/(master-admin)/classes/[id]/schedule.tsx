import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import {
  useClassSchedules,
  useUpsertClassSchedule,
  useDeleteClassSchedule,
} from '@/features/scheduling/hooks/useClassSchedules';
import { typography } from '@/theme/typography';
import { lightTheme, colors, semantic } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6];

// ─── Class Schedule Editor ──────────────────────────────────────────────────

export default function ClassScheduleScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: classId } = useLocalSearchParams<{ id: string }>();
  const { schoolId } = useAuth();

  const { data: schedules = [], isLoading, error, refetch } = useClassSchedules(classId);
  const upsertMutation = useUpsertClassSchedule();
  const deleteMutation = useDeleteClassSchedule();

  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');

  const dayNames = DAYS_OF_WEEK.map((d) => t(`admin.workSchedule.days.${d}`));

  const scheduleByDay = new Map(schedules.map((s: any) => [s.day_of_week, s]));

  const handleEdit = (dayOfWeek: number) => {
    const existing = scheduleByDay.get(dayOfWeek);
    if (existing) {
      setStartTime(existing.start_time?.slice(0, 5) ?? '16:00');
      setEndTime(existing.end_time?.slice(0, 5) ?? '17:00');
    } else {
      setStartTime('16:00');
      setEndTime('17:00');
    }
    setEditingDay(dayOfWeek);
  };

  const handleSave = () => {
    if (editingDay === null || !classId || !schoolId) return;

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert(t('common.error'), t('admin.workSchedule.invalidTime'));
      return;
    }
    if (startTime >= endTime) {
      Alert.alert(t('common.error'), t('admin.workSchedule.endBeforeStart'));
      return;
    }

    upsertMutation.mutate(
      {
        classId,
        schoolId,
        dayOfWeek: editingDay,
        startTime,
        endTime,
      },
      {
        onSuccess: () => setEditingDay(null),
        onError: (err) => Alert.alert(t('common.error'), err.message),
      },
    );
  };

  const handleDelete = (scheduleId: string, dayName: string) => {
    Alert.alert(
      t('admin.classSchedule.removeTitle'),
      t('admin.classSchedule.removeMessage', { day: dayName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(scheduleId),
        },
      ],
    );
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>{t('admin.classSchedule.title')}</Text>
        <Text style={styles.description}>{t('admin.classSchedule.description')}</Text>

        {DAYS_OF_WEEK.map((dayOfWeek) => {
          const schedule = scheduleByDay.get(dayOfWeek);
          const isEditing = editingDay === dayOfWeek;

          return (
            <Card key={dayOfWeek} variant={schedule ? 'default' : 'outlined'} style={styles.dayCard}>
              <View style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{dayNames[dayOfWeek]}</Text>
                  {schedule && !isEditing ? (
                    <Text style={styles.timeRange}>
                      {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}
                    </Text>
                  ) : !isEditing ? (
                    <Text style={styles.noClass}>{t('admin.classSchedule.noSession')}</Text>
                  ) : null}
                </View>
                {!isEditing && (
                  <View style={styles.dayActions}>
                    {schedule && (
                      <Button
                        title=""
                        onPress={() => handleDelete(schedule.id, dayNames[dayOfWeek])}
                        variant="ghost"
                        size="sm"
                        icon={<Ionicons name="trash-outline" size={18} color={semantic.error} />}
                      />
                    )}
                    <Button
                      title={schedule ? t('common.edit') : t('admin.classSchedule.addSession')}
                      onPress={() => handleEdit(dayOfWeek)}
                      variant={schedule ? 'ghost' : 'secondary'}
                      size="sm"
                    />
                  </View>
                )}
              </View>

              {isEditing && (
                <View style={styles.editSection}>
                  <View style={styles.timeRow}>
                    <View style={styles.timeField}>
                      <TextField
                        label={t('admin.workSchedule.startTime')}
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="16:00"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                    <View style={styles.timeField}>
                      <TextField
                        label={t('admin.workSchedule.endTime')}
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="17:00"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                  <Text style={styles.timeHint}>{t('admin.workSchedule.timeFormat')}</Text>
                  <View style={styles.editActions}>
                    <Button
                      title={t('common.cancel')}
                      onPress={() => setEditingDay(null)}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      title={t('common.save')}
                      onPress={handleSave}
                      variant="primary"
                      size="sm"
                      loading={upsertMutation.isPending}
                    />
                  </View>
                </View>
              )}
            </Card>
          );
        })}
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
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  dayCard: {
    padding: spacing.md,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  timeRange: {
    ...typography.textStyles.label,
    color: colors.accent.violet[600],
    marginTop: normalize(2),
  },
  noClass: {
    ...typography.textStyles.label,
    color: colors.neutral[400],
    marginTop: normalize(2),
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editSection: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timeField: {
    flex: 1,
  },
  timeHint: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
});
