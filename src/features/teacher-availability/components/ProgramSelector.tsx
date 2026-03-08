import React, { forwardRef, useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { useToggleAvailability } from '../hooks/useToggleAvailability';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface ProgramSelectorProps {
  programs: Array<{
    id: string;
    program_id: string;
    name: string;
    name_ar: string;
    is_available: boolean;
    max_students: number;
    active_student_count: number;
  }>;
}

const MAX_STUDENTS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const ProgramSelector = forwardRef<BottomSheetModal, ProgramSelectorProps>(
  ({ programs }, ref) => {
    const { t } = useTranslation();
    const localize = useLocalizedField();
    const toggle = useToggleAvailability();

    const [maxStudentsMap, setMaxStudentsMap] = useState<Record<string, number>>({});

    // Sync max_students from props when programs data changes
    useEffect(() => {
      setMaxStudentsMap((prev) => {
        const next: Record<string, number> = {};
        for (const p of programs) {
          next[p.program_id] = prev[p.program_id] ?? p.max_students;
        }
        return next;
      });
    }, [programs]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      [],
    );

    const handleToggle = (programId: string, isAvailable: boolean) => {
      toggle.mutate({
        programId,
        isAvailable,
        maxStudents: maxStudentsMap[programId] ?? 1,
      });
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={['60%']}
        backdropComponent={renderBackdrop}
        enableDynamicSizing={false}
      >
        <BottomSheetScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{t('availability.selectPrograms')}</Text>

          {programs.map((program) => (
            <Card key={program.program_id} variant="outlined" style={styles.programCard}>
              <View style={styles.programRow}>
                <View style={styles.programInfo}>
                  <Text style={styles.programName}>
                    {localize(program.name, program.name_ar)}
                  </Text>
                  <Text style={styles.programMeta}>
                    {t('availability.studentsCount', {
                      current: program.active_student_count,
                      max: maxStudentsMap[program.program_id] ?? program.max_students,
                    })}
                  </Text>
                </View>
                <Switch
                  value={program.is_available}
                  onValueChange={(val) => handleToggle(program.program_id, val)}
                  trackColor={{ false: colors.neutral[200], true: '#22C55E' }}
                  thumbColor={colors.white}
                />
              </View>

              {/* Max students selector */}
              <View style={styles.maxStudentsRow}>
                <Text style={styles.maxStudentsLabel}>{t('programs.labels.maxStudents')}</Text>
                <View style={styles.maxStudentsPicker}>
                  {MAX_STUDENTS_OPTIONS.map((n) => (
                    <Button
                      key={n}
                      title={String(n)}
                      size="sm"
                      variant={
                        (maxStudentsMap[program.program_id] ?? program.max_students) === n
                          ? 'primary'
                          : 'ghost'
                      }
                      onPress={() => {
                        setMaxStudentsMap((prev) => ({ ...prev, [program.program_id]: n }));
                        if (program.is_available) {
                          toggle.mutate({
                            programId: program.program_id,
                            isAvailable: true,
                            maxStudents: n,
                          });
                        }
                      }}
                      style={styles.maxStudentsButton}
                    />
                  ))}
                </View>
              </View>
            </Card>
          ))}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing['2xl'],
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(20),
    marginBottom: spacing.sm,
  },
  programCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  programRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  programInfo: {
    flex: 1,
    gap: normalize(2),
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  programMeta: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  maxStudentsRow: {
    gap: spacing.xs,
  },
  maxStudentsLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[600],
  },
  maxStudentsPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  maxStudentsButton: {
    minWidth: normalize(36),
    paddingHorizontal: spacing.xs,
  },
});
