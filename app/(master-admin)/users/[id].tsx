import React from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useUserPrograms } from '@/features/programs/hooks/useRoleManagement';
import { profileService } from '@/features/profile/services/profile.service';
import { useQuery } from '@tanstack/react-query';
import { typography } from '@/theme/typography';
import { lightTheme, accent, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function UserDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const result = await profileService.getProfile(id!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!id,
  });

  const { data: programRoles = [] } = useUserPrograms(id);

  if (isLoading) return <LoadingState />;
  if (error || !profile) {
    return (
      <ErrorState
        description={error?.message ?? 'Not found'}
        onRetry={refetch}
      />
    );
  }

  const displayName = profile.display_name ?? profile.full_name;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={lightTheme.text} />
          </Pressable>
          <Text style={styles.title}>{displayName}</Text>
        </View>

        {/* Profile Card */}
        <Card variant="default" style={styles.profileCard}>
          <Avatar
            source={profile.avatar_url ?? undefined}
            name={displayName}
            size="xl"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{profile.email ?? '—'}</Text>
            <Badge label={t(`roles.${profile.role}`)} variant="default" />
          </View>
        </Card>

        {/* Program Roles */}
        <Text style={styles.sectionTitle}>
          {t('dashboard.masterAdmin.programs')} ({programRoles.length})
        </Text>
        {programRoles.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {t('common.noResults')}
            </Text>
          </Card>
        ) : (
          programRoles.map((pr) => (
            <Card key={pr.id} variant="outlined" style={styles.roleCard}>
              <View style={styles.roleRow}>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleProgramId}>
                    {pr.program_id}
                  </Text>
                  <Badge label={t(`roles.${pr.role}`)} variant="default" size="sm" />
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Assign to Program Button */}
        <Button
          title={t('common.assign')}
          onPress={() => {
            // TODO: Show program/role picker bottom sheet
          }}
          variant="primary"
          size="md"
          fullWidth
          style={styles.assignButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  profileCard: {
    alignItems: 'center',
    paddingBlock: spacing.xl,
    gap: spacing.md,
  },
  profileInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileName: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  profileEmail: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  roleCard: {
    padding: spacing.md,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleProgramId: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  assignButton: {
    marginBlockStart: spacing.lg,
  },
});
