import React from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';

import { lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { useAvailableTeachers } from '../hooks/useTeacherAvailability';
import { AvailableTeacherCard } from './AvailableTeacherCard';
import { NoTeachersAvailable } from '@/features/queue/components/NoTeachersAvailable';
import type { AvailableTeacher } from '../types';

interface AvailableTeachersListProps {
  programId: string;
  studentId: string;
  onJoinSession: (teacher: AvailableTeacher) => void;
}

export const AvailableTeachersList: React.FC<AvailableTeachersListProps> = ({
  programId,
  studentId,
  onJoinSession,
}) => {
  const { t } = useTranslation();
  const { data: teachers, isLoading, error } = useAvailableTeachers(programId);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={lightTheme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={teachers ?? []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <AvailableTeacherCard teacher={item} onJoinSession={onJoinSession} />
      )}
      contentContainerStyle={styles.list}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <Text style={styles.header}>
          {t('teacherAvailability.availableNow')}
        </Text>
      }
      ListEmptyComponent={
        <NoTeachersAvailable studentId={studentId} programId={programId} />
      }
    />
  );
};

const styles = StyleSheet.create({
  list: {
    padding: spacing.base,
    paddingBlockEnd: spacing['2xl'],
  },
  header: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockEnd: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  errorText: {
    ...typography.textStyles.body,
    color: lightTheme.error,
    textAlign: 'center',
  },
});
