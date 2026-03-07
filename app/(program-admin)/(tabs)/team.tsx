import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, SectionList, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { EmptyState } from '@/components/feedback/EmptyState';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import { shadows } from '@/theme/shadows';
import { radius } from '@/theme/radius';

import { TeamMemberRow } from '@/features/admin/components/TeamMemberRow';
import { useProgramTeam } from '@/features/admin/hooks/useProgramTeam';
import { useLinkSupervisor } from '@/features/admin/hooks/useLinkSupervisor';
import type { ProgramTeamMember } from '@/features/admin/types/admin.types';

export default function ProgramAdminTeam() {
  const { t } = useTranslation();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const router = useRouter();
  const team = useProgramTeam(programId);
  const linkSupervisor = useLinkSupervisor(programId);

  const sections = useMemo(() => {
    const members = team.data ?? [];
    const supervisors = members.filter((m) => m.role === 'supervisor');
    const teachers = members.filter((m) => m.role === 'teacher');
    const admins = members.filter((m) => m.role === 'program_admin');

    return [
      ...(admins.length > 0 ? [{ title: t('admin.programAdmin.team.sections.admins'), data: admins }] : []),
      ...(supervisors.length > 0 ? [{ title: t('admin.programAdmin.team.sections.supervisors'), data: supervisors }] : []),
      ...(teachers.length > 0 ? [{ title: t('admin.programAdmin.team.sections.teachers'), data: teachers }] : []),
    ];
  }, [team.data, t]);

  const supervisors = useMemo(
    () => (team.data ?? []).filter((m) => m.role === 'supervisor'),
    [team.data],
  );

  if (!programId) {
    return (
      <Screen>
        <EmptyState
          icon="people-outline"
          title={t('admin.programAdmin.selectProgram')}
          description={t('admin.programAdmin.selectProgramDescription')}
        />
      </Screen>
    );
  }

  const getSupervisorName = (supervisorId: string | null) => {
    if (!supervisorId) return undefined;
    const sv = supervisors.find((s) => s.profile_id === supervisorId);
    return sv?.profiles?.full_name;
  };

  const handleLinkSupervisor = (member: ProgramTeamMember) => {
    if (supervisors.length === 0) return;

    const options = supervisors.map((s) => s.profiles?.full_name ?? '');
    options.push(t('admin.programAdmin.team.unlinkSupervisor'));
    options.push(t('common.cancel'));

    Alert.alert(
      t('admin.programAdmin.team.selectSupervisor'),
      undefined,
      [
        ...supervisors.map((s, i) => ({
          text: s.profiles?.full_name ?? '',
          onPress: () => {
            linkSupervisor.mutate(
              { programRoleId: member.id, supervisorId: s.profile_id },
              {
                onSuccess: () => Alert.alert(t('common.success'), t('admin.programAdmin.team.linkSuccess')),
                onError: () => Alert.alert(t('common.error'), t('admin.programAdmin.team.linkError')),
              },
            );
          },
        })),
        {
          text: t('admin.programAdmin.team.unlinkSupervisor'),
          onPress: () => {
            linkSupervisor.mutate({ programRoleId: member.id, supervisorId: null });
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  };

  const handleRemove = (member: ProgramTeamMember) => {
    team.remove.mutate(member.id, {
      onSuccess: () => Alert.alert(t('common.success'), t('admin.programAdmin.team.removeSuccess')),
      onError: () => Alert.alert(t('common.error'), t('admin.programAdmin.team.removeError')),
    });
  };

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('admin.programAdmin.team.title')}</Text>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={team.isRefetching} onRefresh={() => team.refetch()} />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TeamMemberRow
              member={item}
              supervisorName={getSupervisorName(item.supervisor_id)}
              onRemove={() => handleRemove(item)}
              onLinkSupervisor={item.role === 'teacher' ? () => handleLinkSupervisor(item) : undefined}
            />
          )}
        />

        <Pressable
          style={styles.fab}
          onPress={() =>
            router.push({
              pathname: '/(program-admin)/team/add',
              params: { programId: programId! },
            })
          }
          accessibilityRole="button"
          accessibilityLabel={t('admin.programAdmin.team.addMember')}
        >
          <Ionicons name="add" size={normalize(28)} color="#fff" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  sectionHeader: {
    ...typography.textStyles.label,
    color: lightTheme.textSecondary,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  fab: {
    position: 'absolute',
    bottom: spacing['3xl'],
    right: spacing.base,
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
  },
});
