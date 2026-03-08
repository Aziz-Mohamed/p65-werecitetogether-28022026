import React, { useState, useMemo, useCallback, forwardRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Alert,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/forms/DatePicker';
import { TimePicker, formatTimeHHMM } from '@/components/forms/TimePicker';
import { LoadingState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { useTeacherClasses } from '@/features/reports/hooks/useTeacherReports';
import { useStudents } from '@/features/students/hooks/useStudents';
import { useCreateScheduledSession } from '@/features/scheduling/hooks/useScheduledSessions';
import { useTeacherPrograms } from '@/features/sessions/hooks/useTeacherPrograms';
import { useCreateSession } from '@/features/sessions/hooks/useSessions';
import type { SessionType } from '@/features/scheduling/types/scheduling.types';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { useUIStore } from '@/stores/uiStore';

// ─── Component ────────────────────────────────────────────────────────────────

export const CreateSessionSheet = forwardRef<BottomSheetModal>((_props, ref) => {
  const { t } = useTranslation();
  const { profile, schoolId } = useAuth();
  const { resolveName } = useLocalizedName();

  const createMutation = useCreateScheduledSession();
  const draftMutation = useCreateSession();
  const teacherClasses = useTeacherClasses(profile?.id ?? null);
  const { data: teacherPrograms = [] } = useTeacherPrograms();

  // ── Form state ──────────────────────────────────────────────────────────
  const [sessionType, setSessionType] = useState<SessionType>('class');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  // Auto-select if teacher has exactly one program (FR-028)
  React.useEffect(() => {
    if (teacherPrograms.length === 1 && !selectedProgramId) {
      setSelectedProgramId((teacherPrograms[0] as any).program_id);
    }
  }, [teacherPrograms, selectedProgramId]);

  // ── Student list (filtered by selected class) ───────────────────────────
  const { data: students = [], isLoading: studentsLoading } = useStudents(
    selectedClassId ? { classId: selectedClassId, isActive: true } : undefined,
  );

  const classes = useMemo(() => teacherClasses.data ?? [], [teacherClasses.data]);
  const snapPoints = useMemo(() => ['75%'], []);

  // Reset downstream when session type changes
  const handleTypeChange = useCallback((type: SessionType) => {
    setSessionType(type);
    setSelectedClassId(null);
    setSelectedStudentId(null);
  }, []);

  const handleClassChange = useCallback((classId: string) => {
    setSelectedClassId(classId);
    setSelectedStudentId(null);
  }, []);

  const handleStartTimeChange = useCallback((date: Date) => {
    setStartTime(date);
    // Clear end time if it's now before start
    if (endTime && date >= endTime) setEndTime(null);
  }, [endTime]);

  const resetForm = useCallback(() => {
    setSessionType('class');
    setSelectedClassId(null);
    setSelectedStudentId(null);
    setSelectedProgramId(null);
    setSessionDate(null);
    setStartTime(null);
    setEndTime(null);
  }, []);

  // ── Validation ──────────────────────────────────────────────────────────
  const canSubmit = useMemo(() => {
    if (!sessionDate || !startTime || !endTime) return false;
    if (startTime >= endTime) return false;
    if (sessionType === 'class' && !selectedClassId) return false;
    if (sessionType === 'individual' && !selectedStudentId) return false;
    return true;
  }, [sessionDate, startTime, endTime, sessionType, selectedClassId, selectedStudentId]);

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!canSubmit || !profile?.id || !schoolId || !startTime || !endTime) return;

    const dateStr = sessionDate!.toISOString().split('T')[0];

    createMutation.mutate(
      {
        teacherId: profile.id,
        schoolId,
        sessionDate: dateStr,
        startTime: formatTimeHHMM(startTime),
        endTime: formatTimeHHMM(endTime),
        sessionType,
        classId: selectedClassId ?? undefined,
        studentId: selectedStudentId ?? undefined,
      },
      {
        onSuccess: () => {
          (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
          resetForm();
        },
        onError: (err: Error) => {
          Alert.alert(t('common.error'), err.message);
        },
      },
    );
  }, [canSubmit, profile, schoolId, sessionDate, startTime, endTime, sessionType, selectedClassId, selectedStudentId, createMutation, t, ref, resetForm]);

  // Can save as draft if student is selected (scores not required)
  const canSaveDraft = useMemo(() => {
    if (sessionType === 'individual' && selectedStudentId) return true;
    if (sessionType === 'class' && selectedClassId) return true;
    return false;
  }, [sessionType, selectedStudentId, selectedClassId]);

  const handleSaveDraft = useCallback(() => {
    if (!profile?.id || !canSaveDraft) return;

    // For class sessions, student_id is not selected yet — need individual student
    const studentId = selectedStudentId;
    if (!studentId) {
      Alert.alert(t('common.error'), t('scheduling.selectStudent'));
      return;
    }

    draftMutation.mutate(
      {
        student_id: studentId,
        teacher_id: profile.id,
        program_id: selectedProgramId ?? null,
        status: 'draft',
      },
      {
        onSuccess: () => {
          (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss();
          resetForm();
        },
        onError: (err: Error) => {
          Alert.alert(t('common.error'), err.message);
        },
      },
    );
  }, [profile, canSaveDraft, selectedStudentId, selectedProgramId, draftMutation, t, ref, resetForm]);

  const pushModal = useUIStore((s) => s.pushModal);
  const popModal = useUIStore((s) => s.popModal);

  const handleSheetChange = useCallback(
    (index: number) => {
      if (index >= 0) pushModal();
      else popModal();
    },
    [pushModal, popModal],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      onChange={handleSheetChange}
      onDismiss={resetForm}
      enableDynamicSizing={false}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBackground}
    >
      {/* Header */}
      <View style={styles.sheetHeader}>
        <Text style={styles.title}>{t('scheduling.createSessionTitle')}</Text>
        <Pressable
          style={styles.closeButton}
          onPress={() => (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()}
          hitSlop={8}
        >
          <Ionicons name="close" size={20} color={colors.neutral[500]} />
        </Pressable>
      </View>

      {teacherClasses.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
        </View>
      ) : (
        <BottomSheetScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Session Type — Segmented Control ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('scheduling.selectSessionType')}</Text>
            <View style={styles.segmentedControl}>
              {(['class', 'individual'] as const).map((type) => {
                const isActive = sessionType === type;
                return (
                  <Pressable
                    key={type}
                    style={[styles.segment, isActive && styles.segmentActive]}
                    onPress={() => handleTypeChange(type)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Ionicons
                      name={type === 'class' ? 'people-outline' : 'person-outline'}
                      size={18}
                      color={isActive ? colors.primary[600] : colors.neutral[400]}
                    />
                    <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                      {t(`scheduling.${type === 'class' ? 'classSession' : 'individualSessionType'}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* ── Program Selector (optional) ── */}
          {teacherPrograms.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('sessions.program')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.chipRow}>
                  {teacherPrograms.map((tp: any) => {
                    const isSelected = selectedProgramId === tp.program_id;
                    const name = resolveName(
                      tp.programs?.name_ar ? { ar: tp.programs.name_ar, en: tp.programs.name } : null,
                      tp.programs?.name,
                    );
                    return (
                      <Pressable
                        key={tp.program_id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setSelectedProgramId(isSelected ? null : tp.program_id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* ── Class Selector ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('scheduling.selectClass')}</Text>
            {classes.length === 0 ? (
              <Text style={styles.emptyText}>{t('common.noResults')}</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <View style={styles.chipRow}>
                  {classes.map((cls) => {
                    const isSelected = selectedClassId === cls.id;
                    return (
                      <Pressable
                        key={cls.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => handleClassChange(cls.id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {resolveName(cls.name_localized, cls.name)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          {/* ── Student Selector (individual only) ── */}
          {sessionType === 'individual' && selectedClassId && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('scheduling.selectStudent')}</Text>
              {studentsLoading ? (
                <LoadingState />
              ) : students.length === 0 ? (
                <Text style={styles.emptyText}>{t('common.noResults')}</Text>
              ) : (
                <View style={styles.studentGrid}>
                  {students.map((student: any) => {
                    const isSelected = selectedStudentId === student.id;
                    const name = resolveName(student.profiles?.name_localized, student.profiles?.full_name);
                    return (
                      <Pressable
                        key={student.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setSelectedStudentId(student.id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* ── Date ── */}
          <View style={styles.section}>
            <DatePicker
              label={t('scheduling.selectDate')}
              value={sessionDate}
              onChange={setSessionDate}
              minimumDate={new Date()}
            />
          </View>

          {/* ── Time Row ── */}
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <TimePicker
                label={t('scheduling.startTime')}
                value={startTime}
                onChange={handleStartTimeChange}
              />
            </View>
            <View style={styles.timeField}>
              <TimePicker
                label={t('scheduling.endTime')}
                value={endTime}
                onChange={setEndTime}
                minimumDate={startTime ?? undefined}
              />
            </View>
          </View>
        </BottomSheetScrollView>
      )}

      {/* Fixed footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          {selectedStudentId && (
            <Button
              title={t('sessions.saveDraft')}
              onPress={handleSaveDraft}
              variant="default"
              size="lg"
              loading={draftMutation.isPending}
              disabled={!canSaveDraft}
              style={styles.footerButton}
            />
          )}
          <Button
            title={t('scheduling.createSession')}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            loading={createMutation.isPending}
            disabled={!canSubmit}
            style={styles.footerButton}
          />
        </View>
      </View>
    </BottomSheetModal>
  );
});

CreateSessionSheet.displayName = 'CreateSessionSheet';

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
  },
  handleIndicator: {
    backgroundColor: colors.neutral[300],
    width: normalize(36),
    height: normalize(4),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  title: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(18),
    lineHeight: normalize(24),
    color: lightTheme.text,
  },
  closeButton: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
  },

  // ── Sections ──
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    lineHeight: normalize(18),
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },

  // ── Segmented Control (Session Type) ──
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.neutral[100],
    borderRadius: radius.md,
    padding: normalize(3),
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md - normalize(2),
  },
  segmentActive: {
    backgroundColor: colors.white,
    ...shadows.xs,
  },
  segmentText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(14),
    lineHeight: normalize(20),
    color: colors.neutral[400],
  },
  segmentTextActive: {
    color: colors.primary[600],
  },

  // ── Chips ──
  chipScroll: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingEnd: spacing.lg,
  },
  studentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  chipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[400],
  },
  chipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(13),
    lineHeight: normalize(18),
    color: colors.neutral[600],
  },
  chipTextActive: {
    color: colors.primary[700],
  },

  // ── Time Row ──
  timeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timeField: {
    flex: 1,
  },

  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textTertiary,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.neutral[200],
    backgroundColor: colors.white,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
});
