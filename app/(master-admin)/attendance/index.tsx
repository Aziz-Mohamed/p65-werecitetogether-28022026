import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Alert, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/forms/Select';
import { LoadingState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useClasses } from '@/features/classes/hooks/useClasses';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useMarkBulkAttendance, useClassAttendance } from '@/features/attendance/hooks/useAttendance';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: colors.semantic.success,
  absent: colors.semantic.error,
  late: colors.semantic.warning,
  excused: colors.primary[500],
};

// ─── Bulk Attendance Screen ──────────────────────────────────────────────────

export default function BulkAttendanceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});

  const { resolveName } = useLocalizedName();
  const { data: classes = [] } = useClasses({ isActive: true });
  const { data: students = [], isLoading: studentsLoading } = useStudents(
    selectedClassId ? { classId: selectedClassId } : undefined,
  );
  const { data: existingAttendance } = useClassAttendance(
    selectedClassId ?? undefined,
    selectedClassId ? selectedDate : undefined,
  );
  const markAttendance = useMarkBulkAttendance();

  // Track which class+date combo we've already initialized statuses for,
  // so background refetches don't overwrite the user's local edits.
  const lastInitRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${selectedClassId}:${selectedDate}`;
    if (key === lastInitRef.current) return;

    if (existingAttendance !== undefined) {
      if (existingAttendance.length > 0) {
        const existing: Record<string, AttendanceStatus> = {};
        for (const record of existingAttendance) {
          existing[record.student_id] = record.status as AttendanceStatus;
        }
        setStatuses(existing);
      } else {
        setStatuses({});
      }
      lastInitRef.current = key;
    }
  }, [existingAttendance, selectedClassId, selectedDate]);

  const classOptions = classes.map((c: any) => ({
    label: resolveName(c.name_localized, c.name) ?? c.name,
    value: c.id,
  }));

  const handleStatusToggle = (studentId: string) => {
    const order: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];
    const current = statuses[studentId] ?? 'present';
    const nextIndex = (order.indexOf(current) + 1) % order.length;
    setStatuses((prev) => ({ ...prev, [studentId]: order[nextIndex] }));
  };

  const handleMarkAllPresent = () => {
    const all: Record<string, AttendanceStatus> = {};
    for (const s of students) {
      all[s.id] = 'present';
    }
    setStatuses(all);
  };

  const handleSubmit = async () => {
    if (!selectedClassId || !profile?.school_id || !profile?.id) return;

    const records = students.map((s: any) => ({
      student_id: s.id,
      status: statuses[s.id] ?? 'present',
    }));

    if (records.length === 0) {
      Alert.alert(t('common.error'), t('admin.attendance.noStudents'));
      return;
    }

    try {
      const { error } = await markAttendance.mutateAsync({
        input: {
          class_id: selectedClassId,
          date: selectedDate,
          records,
        },
        schoolId: profile.school_id,
        markedBy: profile.id,
      });

      if (error) {
        Alert.alert(t('common.error'), (error as Error).message);
        return;
      }

      // Allow re-init from server data after successful submission
      lastInitRef.current = null;
      Alert.alert(t('common.success'), t('admin.attendance.submitSuccess'));
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('common.unexpectedError'),
      );
    }
  };

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        <Text style={styles.title}>{t('admin.attendance.title')}</Text>
        <Text style={styles.description}>{t('admin.attendance.subtitle')}</Text>

        {/* Class Selector */}
        <Select
          label={t('admin.attendance.selectClass')}
          placeholder={t('admin.attendance.selectClassPlaceholder')}
          options={classOptions}
          value={selectedClassId}
          onChange={(val) => {
            setSelectedClassId(val);
            setStatuses({});
            lastInitRef.current = null;
          }}
        />

        {/* Date */}
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>{t('admin.attendance.date')}</Text>
          <Text style={styles.dateValue}>{selectedDate}</Text>
        </View>

        {selectedClassId && (
          <>
            {/* Mark All Present Shortcut */}
            <Button
              title={t('admin.attendance.markAllPresent')}
              onPress={handleMarkAllPresent}
              variant="secondary"
              size="md"
              icon={<Ionicons name="checkmark-done" size={18} color={colors.primary[500]} />}
            />

            {/* Student List */}
            {studentsLoading ? (
              <LoadingState />
            ) : students.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title={t('admin.attendance.noStudentsTitle')}
                description={t('admin.attendance.noStudentsDesc')}
              />
            ) : (
              students.map((student: any) => {
                const status: AttendanceStatus = statuses[student.id] ?? 'present';
                return (
                  <Card key={student.id} variant="outlined" style={styles.studentCard}>
                    <View style={styles.studentRow}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>
                          {resolveName(student.profiles?.name_localized, student.profiles?.full_name) ?? '—'}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => handleStatusToggle(student.id)}
                        style={[
                          styles.statusBadge,
                          { backgroundColor: STATUS_COLORS[status] + '20' },
                        ]}
                      >
                        <Text
                          style={[styles.statusText, { color: STATUS_COLORS[status] }]}
                        >
                          {t(`admin.attendance.status.${status}`)}
                        </Text>
                      </Pressable>
                    </View>
                  </Card>
                );
              })
            )}

            {/* Submit */}
            {students.length > 0 && (
              <Button
                title={t('admin.attendance.submit')}
                onPress={handleSubmit}
                variant="primary"
                size="lg"
                loading={markAttendance.isPending}
                style={styles.submitButton}
              />
            )}
          </>
        )}
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dateLabel: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  dateValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontFamily: typography.fontFamily.medium,
  },
  studentCard: {
    marginBottom: spacing.xs,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: normalize(16),
  },
  statusText: {
    ...typography.textStyles.caption,
    fontFamily: typography.fontFamily.semiBold,
    textTransform: 'capitalize',
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
