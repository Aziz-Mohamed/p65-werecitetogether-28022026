import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { Screen } from '@/components/layout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';

import { StatCard } from '@/features/admin/components/StatCard';
import { useSupervisedTeachers } from '@/features/admin/hooks/useSupervisedTeachers';
import { adminService } from '@/features/admin/services/admin.service';
import type { SessionHistoryRow } from '@/features/admin/types/admin.types';

export default function TeacherDetailScreen() {
  const { t } = useTranslation();
  const { id: teacherId, programId } = useLocalSearchParams<{ id: string; programId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const teachers = useSupervisedTeachers(userId);
  const teacher = teachers.data?.find((t) => t.teacher_id === teacherId);

  // Flag issue state
  const flagSheetRef = useRef<BottomSheet>(null);
  const flagSnapPoints = useMemo(() => ['45%'], []);
  const [flagNote, setFlagNote] = useState('');
  const [flagSending, setFlagSending] = useState(false);

  const openFlagSheet = useCallback(() => {
    setFlagNote('');
    flagSheetRef.current?.snapToIndex(0);
  }, []);

  const closeFlagSheet = useCallback(() => {
    flagSheetRef.current?.close();
  }, []);

  const handleSendFlag = useCallback(async () => {
    if (!teacherId || !userId) return;
    const resolvedProgramId = programId ?? teacher?.program_id;
    if (!resolvedProgramId) return;

    setFlagSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-notification', {
        body: {
          type: 'supervisor_flag',
          teacher_id: teacherId,
          program_id: resolvedProgramId,
          note: flagNote.trim().substring(0, 500),
          supervisor_id: userId,
        },
      });
      if (error) throw error;
      Alert.alert(t('common.success'), t('admin.supervisor.teacherDetail.flagSuccess'));
      closeFlagSheet();
    } catch {
      Alert.alert(t('common.error'), t('admin.supervisor.teacherDetail.flagError'));
    } finally {
      setFlagSending(false);
    }
  }, [teacherId, userId, programId, teacher?.program_id, flagNote, t, closeFlagSheet]);

  const sessionHistory = useQuery({
    queryKey: ['teacher-sessions', teacherId],
    queryFn: async () => {
      const { data, error } = await adminService.getTeacherSessionHistory(teacherId!);
      if (error) throw error;
      return (data as unknown as SessionHistoryRow[]) ?? [];
    },
    enabled: !!teacherId,
  });

  return (
    <Screen>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        {teacher && (
          <>
            <View style={styles.header}>
              <Avatar
                source={teacher.avatar_url ?? undefined}
                name={teacher.full_name}
                size="lg"
              />
              <View style={styles.headerText}>
                <Text style={styles.name}>{teacher.full_name}</Text>
                <Text style={styles.program}>{teacher.program_name}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard
                label={t('admin.supervisor.teacherCard.students', { count: teacher.student_count })}
                value={teacher.student_count}
                icon="school-outline"
                iconColor={colors.primary[500]}
              />
              <StatCard
                label={t('admin.supervisor.teacherCard.sessions', { count: teacher.sessions_this_week })}
                value={teacher.sessions_this_week}
                icon="calendar-outline"
                iconColor={colors.accent.indigo[500]}
              />
            </View>

            <View style={styles.statsRow}>
              <StatCard
                label={teacher.average_rating != null
                  ? t('admin.supervisor.teacherCard.rating', { rating: teacher.average_rating.toFixed(1) })
                  : t('admin.supervisor.teacherCard.noRating')}
                value={teacher.average_rating?.toFixed(1) ?? '-'}
                icon="star-outline"
                iconColor={colors.secondary[500]}
              />
            </View>

            <View style={styles.buttonRow}>
              <Button
                title={t('admin.supervisor.teacherDetail.students')}
                onPress={() =>
                  router.push({
                    pathname: '/(supervisor)/teachers/[id]/students',
                    params: { id: teacherId!, programId: programId ?? teacher.program_id },
                  })
                }
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title={t('ratings.supervisor.reviews')}
                onPress={() =>
                  router.push({
                    pathname: '/(supervisor)/teachers/[id]/reviews',
                    params: { id: teacherId!, programId: programId ?? teacher.program_id },
                  })
                }
                variant="secondary"
                style={styles.actionButton}
              />
            </View>
            <View style={styles.buttonRow}>
              <Button
                title={t('admin.supervisor.teacherDetail.flagIssue')}
                onPress={openFlagSheet}
                variant="ghost"
                style={styles.actionButton}
              />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>{t('admin.supervisor.teacherDetail.sessionHistory')}</Text>

        <FlatList
          data={sessionHistory.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.sessionRow}>
              <Text style={styles.sessionStudent} numberOfLines={1}>
                {item.profiles?.full_name ?? '-'}
              </Text>
              <Text style={styles.sessionDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
              {item.duration_minutes != null && (
                <Text style={styles.sessionDuration}>
                  {item.duration_minutes}m
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            !sessionHistory.isLoading ? (
              <Text style={styles.emptyText}>
                {t('admin.supervisor.teacherDetail.noSessions')}
              </Text>
            ) : null
          }
        />
      </View>

      <BottomSheet
        ref={flagSheetRef}
        snapPoints={flagSnapPoints}
        index={-1}
        enablePanDownToClose
        onClose={() => setFlagNote('')}
      >
        <BottomSheetScrollView contentContainerStyle={styles.flagContent}>
          <Text style={styles.flagTitle}>{t('admin.supervisor.teacherDetail.flagIssue')}</Text>
          <Text style={styles.flagLabel}>{t('admin.supervisor.teacherDetail.flagNote')}</Text>
          <TextInput
            style={styles.flagInput}
            placeholder={t('admin.supervisor.teacherDetail.flagNotePlaceholder')}
            placeholderTextColor={lightTheme.textSecondary}
            value={flagNote}
            onChangeText={(text) => setFlagNote(text.substring(0, 500))}
            multiline
            maxLength={500}
          />
          <Text style={styles.flagCharCount}>{flagNote.length}/500</Text>
          <Button
            title={t('admin.supervisor.teacherDetail.flagConfirm')}
            onPress={handleSendFlag}
            loading={flagSending}
            disabled={flagSending || flagNote.trim().length === 0}
            style={styles.flagSubmitButton}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  backButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  backText: {
    ...typography.textStyles.bodyMedium,
    color: colors.primary[500],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  program: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginVertical: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginTop: spacing.base,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  sessionStudent: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    flex: 1,
  },
  sessionDate: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  sessionDuration: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    minWidth: normalize(30),
    textAlign: 'end',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    padding: spacing['2xl'],
  },
  flagContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
  },
  flagTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBottom: spacing.base,
  },
  flagLabel: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  flagInput: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    borderWidth: 1,
    borderColor: lightTheme.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: normalize(100),
    textAlignVertical: 'top',
  },
  flagCharCount: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  flagSubmitButton: {
    marginTop: spacing.base,
  },
});
