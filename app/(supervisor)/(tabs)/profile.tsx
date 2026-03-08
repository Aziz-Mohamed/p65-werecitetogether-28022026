import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { adminService } from '@/features/admin/services/admin.service';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';

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

  const programs = useQuery({
    queryKey: ['supervisor-programs', userId],
    queryFn: async () => {
      const { data, error } = await adminService.getProgramTeam(''); // placeholder
      // We need to find programs where this user is supervisor
      // Query program_roles for this user as supervisor
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

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <Avatar
            source={profile?.avatar_url ?? undefined}
            name={profile?.full_name ?? ''}
            size="xl"
          />
          <Text style={styles.name}>{profile?.full_name ?? ''}</Text>
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
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
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
