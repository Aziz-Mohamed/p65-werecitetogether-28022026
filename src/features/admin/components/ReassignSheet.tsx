import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { useReassignStudent } from '../hooks/useReassignStudent';
import type { SupervisedTeacher } from '../types/admin.types';

interface ReassignSheetProps {
  isOpen: boolean;
  onClose: () => void;
  enrollmentId: string;
  currentTeacherId: string;
  supervisorId: string;
  teachers: SupervisedTeacher[];
}

export function ReassignSheet({
  isOpen,
  onClose,
  enrollmentId,
  currentTeacherId,
  supervisorId,
  teachers,
}: ReassignSheetProps) {
  const { t } = useTranslation();
  const { resolveName } = useLocalizedName();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['50%'], []);
  const reassign = useReassignStudent();

  const otherTeachers = useMemo(
    () => teachers.filter((t) => t.teacher_id !== currentTeacherId),
    [teachers, currentTeacherId],
  );

  const handleSelect = (teacherId: string) => {
    reassign.mutate(
      {
        p_enrollment_id: enrollmentId,
        p_new_teacher_id: teacherId,
        p_supervisor_id: supervisorId,
      },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('admin.supervisor.reassign.success'));
          onClose();
        },
        onError: () => {
          Alert.alert(t('common.error'), t('admin.supervisor.reassign.error'));
        },
      },
    );
  };

  if (!isOpen) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t('admin.supervisor.reassign.selectTeacher')}</Text>
      </View>

      <BottomSheetFlatList
        data={otherTeachers}
        keyExtractor={(item) => item.teacher_id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => handleSelect(item.teacher_id)}
            disabled={reassign.isPending}
            accessibilityRole="button"
            accessibilityLabel={resolveName(item.name_localized, item.full_name)}
          >
            <Avatar
              source={item.avatar_url ?? undefined}
              name={resolveName(item.name_localized, item.full_name)}
              size="sm"
            />
            <View style={styles.rowText}>
              <Text style={styles.rowName} numberOfLines={1}>
                {resolveName(item.name_localized, item.full_name)}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {t('admin.supervisor.teacherCard.students', { count: item.student_count })}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: lightTheme.border,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  list: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  rowName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  rowSub: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
