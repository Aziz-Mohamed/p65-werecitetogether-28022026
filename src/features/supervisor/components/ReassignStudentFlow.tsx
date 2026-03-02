import React, { useState, useMemo, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAssignedTeachers, useReassignStudent } from '../hooks/useSupervisor';
import type { TeacherSummary } from '../types';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';

interface ReassignStudentFlowProps {
  enrollmentId: string;
  studentName: string;
  currentTeacherId: string;
  supervisorId: string;
  programId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function ReassignStudentFlow({
  enrollmentId,
  studentName,
  currentTeacherId,
  supervisorId,
  programId,
  visible,
  onDismiss,
}: ReassignStudentFlowProps) {
  const { t } = useTranslation();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['70%'], []);
  const reassign = useReassignStudent();

  const { data: teachers = [] } = useAssignedTeachers(supervisorId, programId);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);

  const availableTeachers = teachers.filter((t) => t.id !== currentTeacherId);

  const handleConfirm = useCallback(async () => {
    if (!selectedTeacherId) return;

    await reassign.mutateAsync({
      enrollmentId,
      newTeacherId: selectedTeacherId,
      supervisorId,
      programId,
    });

    onDismiss();
  }, [enrollmentId, selectedTeacherId, supervisorId, programId, reassign, onDismiss]);

  if (!visible) return null;

  const renderTeacher = ({ item }: { item: TeacherSummary }) => {
    const isSelected = item.id === selectedTeacherId;

    return (
      <Pressable onPress={() => setSelectedTeacherId(item.id)}>
        <Card
          variant={isSelected ? 'default' : 'outlined'}
          style={[styles.teacherCard, isSelected && styles.teacherCardSelected]}
        >
          <View style={styles.teacherRow}>
            <Avatar
              source={item.avatar_url ?? undefined}
              name={item.display_name ?? item.full_name}
              size="sm"
            />
            <View style={styles.teacherInfo}>
              <Text style={styles.teacherName}>
                {item.display_name ?? item.full_name}
              </Text>
              <Text style={styles.teacherMeta}>
                {t('supervisor.activeStudents', { count: item.active_students })}
              </Text>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={24} color={primary[500]} />
            )}
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
    >
      <BottomSheetView style={styles.content}>
        <Text style={styles.title}>{t('supervisor.reassignStudent')}</Text>
        <Text style={styles.subtitle}>
          {t('supervisor.reassignStudentDesc', { name: studentName })}
        </Text>

        <Text style={styles.sectionTitle}>
          {t('supervisor.selectNewTeacher')}
        </Text>

        <FlatList
          data={availableTeachers}
          keyExtractor={(item) => item.id}
          renderItem={renderTeacher}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <Button
          title={t('supervisor.confirmReassign')}
          onPress={handleConfirm}
          variant="primary"
          loading={reassign.isPending}
          disabled={!selectedTeacherId}
          fullWidth
        />
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
  subtitle: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
  sectionTitle: {
    ...typography.textStyles.label,
    color: neutral[500],
    marginBlockStart: spacing.sm,
  },
  separator: {
    height: spacing.sm,
  },
  teacherCard: {
    padding: spacing.md,
  },
  teacherCardSelected: {
    borderWidth: 2,
    borderColor: primary[500],
    borderRadius: radius.sm,
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teacherInfo: {
    flex: 1,
    gap: 2,
  },
  teacherName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  teacherMeta: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
});
