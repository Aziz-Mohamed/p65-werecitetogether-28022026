import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, Switch, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Screen } from '@/components/layout';
import { TextField, Button } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useProgram } from '@/features/programs/hooks/useProgram';
import { useUpdateProgram } from '@/features/programs/hooks/useAdminPrograms';
import { useProgramTeam } from '@/features/admin/hooks/useProgramTeam';
import { TeamMemberRow } from '@/features/admin/components/TeamMemberRow';
import { UserSearchSheet } from '@/features/admin/components/UserSearchSheet';
import { typography } from '@/theme/typography';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { ProgramCategory, ProgramRoleType } from '@/features/programs/types/programs.types';

const editSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  category: z.enum(['free', 'structured', 'mixed']),
  is_active: z.boolean(),
  max_students_per_teacher: z.number().min(1).max(100),
  auto_approve: z.boolean(),
  session_duration_minutes: z.number().min(5).max(180),
  daily_session_limit: z.number().min(1).max(20),
  queue_notification_threshold: z.number().min(1).max(100),
});

type EditFormData = z.infer<typeof editSchema>;

const TEAM_ROLES: ProgramRoleType[] = ['program_admin', 'supervisor', 'teacher'];

export default function MasterAdminEditProgram() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = useAuth();
  const { data: program, isLoading, error, refetch } = useProgram(id);
  const updateProgram = useUpdateProgram();
  const teamQuery = useProgramTeam(id);

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name: string } | null>(null);
  const [selectedRole, setSelectedRole] = useState<ProgramRoleType>('teacher');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    values: program
      ? {
          name: program.name,
          name_ar: program.name_ar,
          description: program.description ?? '',
          description_ar: program.description_ar ?? '',
          category: program.category,
          is_active: program.is_active,
          max_students_per_teacher: program.settings?.max_students_per_teacher ?? 10,
          auto_approve: program.settings?.auto_approve ?? false,
          session_duration_minutes: program.settings?.session_duration_minutes ?? 30,
          daily_session_limit: (program as any).daily_session_limit ?? 2,
          queue_notification_threshold: (program as any).queue_notification_threshold ?? 5,
        }
      : undefined,
  });

  const onSubmit = async (data: EditFormData) => {
    if (!id) return;
    const { error: err } = await updateProgram.mutateAsync({
      programId: id,
      input: {
        name: data.name,
        name_ar: data.name_ar,
        description: data.description || null,
        description_ar: data.description_ar || null,
        category: data.category as ProgramCategory,
        is_active: data.is_active,
        settings: {
          max_students_per_teacher: data.max_students_per_teacher,
          auto_approve: data.auto_approve,
          session_duration_minutes: data.session_duration_minutes,
        },
        daily_session_limit: data.daily_session_limit,
        queue_notification_threshold: data.queue_notification_threshold,
      },
    });

    if (err) {
      Alert.alert(t('common.error'), err.message);
      return;
    }

    router.back();
  };

  const handleAssignTeamMember = () => {
    if (!selectedUser || !id || !session?.user?.id) return;
    teamQuery.assign.mutate(
      { input: { profileId: selectedUser.id, programId: id, role: selectedRole }, assignedBy: session.user.id },
      {
        onSuccess: () => {
          Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.assignSuccess'));
          setSelectedUser(null);
        },
        onError: () => {
          Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.assignError'));
        },
      },
    );
  };

  const handleRemoveTeamMember = (roleId: string, memberName: string) => {
    Alert.alert(
      t('admin.masterAdmin.users.roles.removeConfirm', { role: '', program: memberName }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.remove'),
          style: 'destructive',
          onPress: () => {
            teamQuery.remove.mutate(roleId, {
              onSuccess: () => Alert.alert(t('common.success'), t('admin.masterAdmin.users.roles.removeSuccess')),
              onError: () => Alert.alert(t('common.error'), t('admin.masterAdmin.users.roles.removeError')),
            });
          },
        },
      ],
    );
  };

  if (isLoading) return <LoadingState />;
  if (error || !program) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.admin.editProgram')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.programName')}
              value={value}
              onChangeText={onChange}
              error={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="name_ar"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.programNameAr')}
              value={value}
              onChangeText={onChange}
              error={errors.name_ar?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.description')}
              value={value}
              onChangeText={onChange}
              multiline
            />
          )}
        />

        <Controller
          control={control}
          name="description_ar"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.descriptionAr')}
              value={value}
              onChangeText={onChange}
              multiline
            />
          )}
        />

        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View>
              <Text style={styles.pickerLabel}>{t('programs.labels.selectCategory')}</Text>
              <View style={styles.segmentedControl}>
                {(['free', 'structured', 'mixed'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.segment, value === cat && styles.segmentActive]}
                    onPress={() => onChange(cat)}
                  >
                    <Text style={[styles.segmentText, value === cat && styles.segmentTextActive]}>
                      {t(`programs.category.${cat}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        />

        <Controller
          control={control}
          name="max_students_per_teacher"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.maxPerTeacher')}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v) || 0)}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="session_duration_minutes"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('programs.labels.sessionDuration')}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v) || 0)}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="auto_approve"
          render={({ field: { onChange, value } }) => (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('programs.labels.autoApprove')}</Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="is_active"
          render={({ field: { onChange, value } }) => (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{t('common.active')}</Text>
              <Switch value={value} onValueChange={onChange} />
            </View>
          )}
        />

        <Controller
          control={control}
          name="daily_session_limit"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('queue.fairUsage.dailyLimit')}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v) || 0)}
              keyboardType="numeric"
            />
          )}
        />

        <Controller
          control={control}
          name="queue_notification_threshold"
          render={({ field: { onChange, value } }) => (
            <TextField
              label={t('queue.fairUsage.threshold')}
              value={String(value)}
              onChangeText={(v) => onChange(Number(v) || 0)}
              keyboardType="numeric"
            />
          )}
        />

        <Button
          title={t('common.save')}
          onPress={handleSubmit(onSubmit)}
          variant="primary"
          loading={isSubmitting || updateProgram.isPending}
        />

        {/* Team Section */}
        <View style={styles.teamDivider} />
        <View style={styles.teamHeader}>
          <Text style={styles.teamTitle}>{t('admin.masterAdmin.programs.team')}</Text>
          <Button
            title={t('admin.programAdmin.team.addMember')}
            onPress={() => setShowUserSearch(true)}
            variant="secondary"
            size="sm"
          />
        </View>

        {selectedUser && (
          <View style={styles.assignSection}>
            <View style={styles.selectedUser}>
              <Text style={styles.selectedName}>{selectedUser.full_name}</Text>
              <Pressable onPress={() => setSelectedUser(null)}>
                <Text style={styles.changeText}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
            <View style={styles.roleRow}>
              {TEAM_ROLES.map((role) => (
                <Pressable
                  key={role}
                  style={[styles.roleChip, selectedRole === role && styles.roleChipActive]}
                  onPress={() => setSelectedRole(role)}
                >
                  <Text style={[styles.roleChipText, selectedRole === role && styles.roleChipTextActive]}>
                    {role.replace('_', ' ')}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Button
              title={t('common.confirm')}
              onPress={handleAssignTeamMember}
              loading={teamQuery.assign.isPending}
              disabled={teamQuery.assign.isPending}
              size="sm"
            />
          </View>
        )}

        {teamQuery.data && teamQuery.data.length > 0 ? (
          teamQuery.data.map((member) => (
            <TeamMemberRow
              key={member.id}
              member={member}
              onRemove={() => handleRemoveTeamMember(member.id, member.full_name)}
            />
          ))
        ) : (
          <Text style={styles.noTeam}>{t('admin.masterAdmin.programs.noTeam')}</Text>
        )}

        <UserSearchSheet
          isOpen={showUserSearch && !selectedUser}
          onClose={() => setShowUserSearch(false)}
          onSelect={(user) => {
            setSelectedUser({ id: user.id, full_name: user.full_name });
            setShowUserSearch(false);
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  pickerLabel: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginBottom: spacing.xs,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: lightTheme.border,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    backgroundColor: lightTheme.surface,
  },
  segmentActive: {
    backgroundColor: lightTheme.primary,
  },
  segmentText: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  teamDivider: {
    height: 1,
    backgroundColor: lightTheme.border,
    marginVertical: spacing.md,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  assignSection: {
    gap: spacing.sm,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: spacing.base,
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  changeText: {
    ...typography.textStyles.body,
    color: colors.primary[500],
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleChip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: lightTheme.border,
  },
  roleChipActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[500],
  },
  roleChipText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textTransform: 'capitalize',
  },
  roleChipTextActive: {
    color: colors.primary[700],
  },
  noTeam: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    paddingVertical: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchLabel: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
});
