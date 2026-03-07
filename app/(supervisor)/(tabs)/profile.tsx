import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { profileService } from '@/features/profile/services/profile.service';
import { useAuthStore } from '@/stores/authStore';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

interface ProgramInfo {
  program_id: string;
  program_name: string;
  teacher_count: number;
}

export default function SupervisorProfile() {
  const { t } = useTranslation();
  const { session, profile } = useAuth();
  const { logout, isPending: logoutPending } = useLogout();
  const userId = session?.user?.id;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);

  const programs = useQuery({
    queryKey: ['supervisor-programs', userId],
    queryFn: async () => {
      const { data: roles, error: roleError } = await (await import('@/lib/supabase')).supabase
        .from('program_roles')
        .select(`
          program_id,
          programs ( name, name_ar )
        `)
        .eq('profile_id', userId!)
        .eq('role', 'supervisor');

      if (roleError) throw roleError;
      if (!roles) return [];

      const programIds = roles.map((r: { program_id: string }) => r.program_id);
      const { data: teamData } = await (await import('@/lib/supabase')).supabase
        .from('program_roles')
        .select('program_id, profile_id')
        .in('program_id', programIds)
        .eq('role', 'teacher');

      return roles.map((r: { program_id: string; programs: { name: string; name_ar: string } | null }) => ({
        program_id: r.program_id,
        program_name: r.programs?.name ?? '',
        teacher_count: (teamData ?? []).filter((t: { program_id: string }) => t.program_id === r.program_id).length,
      })) as ProgramInfo[];
    },
    enabled: !!userId,
  });

  const handleStartEdit = () => {
    setEditName(profile?.full_name ?? '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const handleSaveProfile = async () => {
    if (!userId || !editName.trim()) return;
    setSaving(true);
    try {
      const { error } = await profileService.updateProfile(userId, {
        full_name: editName.trim(),
      });
      if (error) throw error;
      useAuthStore.getState().setProfile(
        profile ? { ...profile, full_name: editName.trim() } : null,
      );
      setIsEditing(false);
    } catch {
      Alert.alert(t('common.error'), t('admin.supervisor.profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Avatar
            source={profile?.avatar_url ?? undefined}
            name={profile?.full_name ?? ''}
            size="xl"
          />
          {isEditing ? (
            <>
              <TextInput
                style={styles.nameInput}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                maxLength={100}
              />
              <View style={styles.editActions}>
                <Button
                  title={t('admin.supervisor.profile.saveProfile')}
                  onPress={handleSaveProfile}
                  loading={saving}
                  disabled={saving || !editName.trim()}
                  size="sm"
                  style={styles.editButton}
                />
                <Button
                  title={t('admin.supervisor.profile.cancelEdit')}
                  onPress={handleCancelEdit}
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  style={styles.editButton}
                />
              </View>
            </>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile?.full_name ?? ''}</Text>
              <Pressable onPress={handleStartEdit} hitSlop={8}>
                <Ionicons name="pencil-outline" size={18} color={colors.primary[500]} />
              </Pressable>
            </View>
          )}
          <Text style={styles.email}>{profile?.email ?? ''}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('admin.supervisor.profile.supervisedPrograms')}</Text>

        <FlatList
          data={programs.data ?? []}
          keyExtractor={(item) => item.program_id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Card variant="outlined" style={styles.programCard}>
              <Text style={styles.programName}>{item.program_name}</Text>
              <Text style={styles.programTeachers}>
                {t('admin.supervisor.profile.teachersInProgram', { count: item.teacher_count })}
              </Text>
            </Card>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        <Button
          title={t('common.signOut')}
          onPress={() => logout()}
          variant="ghost"
          disabled={logoutPending}
          loading={logoutPending}
          style={styles.signOutButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
  },
  nameInput: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.primary[300],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: normalize(200),
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButton: {
    minWidth: normalize(80),
  },
  email: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  programCard: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  programTeachers: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  separator: {
    height: spacing.sm,
  },
  signOutButton: {
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
  },
});
