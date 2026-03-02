import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { AvailableTeachersList } from '@/features/teacher-availability/components/AvailableTeachersList';
import { JoinSessionFlow } from '@/features/sessions/components/JoinSessionFlow';
import { useAuthStore } from '@/stores/authStore';
import { useProgramById } from '@/features/programs/hooks/usePrograms';
import { lightTheme, primary } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import type { AvailableTeacher } from '@/features/teacher-availability/types';

export default function AvailableTeachersScreen() {
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<AvailableTeacher | null>(null);

  const { data: program, isLoading } = useProgramById(programId);

  const handleJoinSession = useCallback(
    (teacher: AvailableTeacher) => {
      setSelectedTeacher(teacher);
      bottomSheetRef.current?.snapToIndex(0);
    },
    [],
  );

  const handleDismiss = useCallback(() => {
    setSelectedTeacher(null);
    bottomSheetRef.current?.close();
  }, []);

  if (isLoading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      </Screen>
    );
  }

  // Redirect if not a free program
  if (program && program.category !== 'free') {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('common.notFound')}</Text>
          <Button
            title={t('common.back')}
            onPress={() => router.back()}
            variant="ghost"
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.backRow}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<Ionicons name="arrow-back" size={20} color={primary[600]} />}
        />
      </View>

      <Text style={styles.title}>{t('sessionJoin.title')}</Text>

      {programId && profile?.id ? (
        <AvailableTeachersList
          programId={programId}
          studentId={profile.id}
          onJoinSession={handleJoinSession}
        />
      ) : (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={lightTheme.primary} />
        </View>
      )}

      <JoinSessionFlow
        teacher={selectedTeacher}
        programId={programId ?? ''}
        programSettings={program?.settings as Record<string, unknown> | null}
        bottomSheetRef={bottomSheetRef}
        onDismiss={handleDismiss}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.textStyles.body,
    color: lightTheme.error,
  },
  backRow: {
    flexDirection: 'row',
    paddingBlockStart: spacing.sm,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingBlockStart: spacing.md,
    paddingBlockEnd: spacing.base,
  },
});
