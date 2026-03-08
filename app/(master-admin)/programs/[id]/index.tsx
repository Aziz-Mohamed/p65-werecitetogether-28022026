import React from 'react';
import { StyleSheet, View, Text, Pressable, I18nManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen, PageHeader } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useProgram } from '@/features/programs/hooks/useProgram';
import { useProgramTeam } from '@/features/admin/hooks/useProgramTeam';
import { useProgramAdminDashboard } from '@/features/admin/hooks/useProgramAdminDashboard';
import { CategoryBadge } from '@/features/programs/components/CategoryBadge';
import { TeamMemberRow } from '@/features/admin/components/TeamMemberRow';
import { typography } from '@/theme/typography';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function ProgramOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { data: program, isLoading, error, refetch } = useProgram(id);
  const teamQuery = useProgramTeam(id);
  const statsQuery = useProgramAdminDashboard(id);

  if (isLoading) return <LoadingState />;
  if (error || !program) return <ErrorState onRetry={refetch} />;

  const name = i18n.language === 'ar' ? program.name_ar : program.name;
  const description = i18n.language === 'ar' ? program.description_ar : program.description;
  const team = teamQuery.data ?? [];
  const stats = statsQuery.data;

  const teamByRole = {
    program_admin: team.filter((m) => m.role === 'program_admin').length,
    supervisor: team.filter((m) => m.role === 'supervisor').length,
    teacher: team.filter((m) => m.role === 'teacher').length,
  };

  const trackCount = program.program_tracks?.filter((t) => t.is_active).length ?? 0;

  return (
    <Screen scroll>
      <View style={styles.container}>
        {/* Header */}
        <PageHeader
          title={name}
          rightAction={
            <Pressable
              onPress={() => router.push(`/(master-admin)/programs/${id}/edit`)}
              hitSlop={8}
              style={styles.headerAction}
            >
              <Ionicons name="settings-outline" size={24} color={colors.neutral[600]} />
            </Pressable>
          }
        />

        {/* Status */}
        <View style={styles.statusRow}>
          <CategoryBadge category={program.category} />
          <Badge
            label={program.is_active ? t('common.active') : t('common.inactive')}
            variant={program.is_active ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <OverviewStat
            icon="people"
            label={t('admin.masterAdmin.programs.enrolledStudents')}
            value={stats?.total_enrolled ?? 0}
            color={colors.primary[500]}
          />
          <OverviewStat
            icon="person-circle"
            label={t('admin.masterAdmin.programs.teamMembers')}
            value={team.length}
            color={colors.accent.indigo[500]}
          />
          <OverviewStat
            icon="school"
            label={t('admin.masterAdmin.programs.activeClasses')}
            value={stats?.active_classes ?? 0}
            color={colors.accent.violet[500]}
          />
          <OverviewStat
            icon="calendar"
            label={t('admin.masterAdmin.programs.sessionsThisWeek')}
            value={stats?.sessions_this_week ?? 0}
            color={colors.accent.sky[500]}
          />
        </View>

        {/* Navigation Cards */}
        <View style={styles.navGrid}>
          <NavCard
            icon="people-circle"
            title={t('admin.masterAdmin.programs.viewTeam')}
            subtitle={t('admin.masterAdmin.programs.teamSummary', {
              admins: teamByRole.program_admin,
              teachers: teamByRole.teacher,
              supervisors: teamByRole.supervisor,
            })}
            color={colors.accent.indigo[500]}
            onPress={() => router.push(`/(master-admin)/programs/${id}/team`)}
          />
          <NavCard
            icon="layers-outline"
            title={t('admin.masterAdmin.programs.viewTracks')}
            subtitle={t('admin.masterAdmin.programs.activeTracks', { count: trackCount })}
            color={colors.accent.violet[500]}
            onPress={() => router.push(`/(master-admin)/programs/${id}/tracks`)}
          />
          <NavCard
            icon="school-outline"
            title={t('admin.masterAdmin.programs.viewClasses')}
            subtitle={t('admin.masterAdmin.programs.activeClasses', { count: stats?.active_classes ?? 0 })}
            color={colors.accent.sky[500]}
            onPress={() => router.push(`/(master-admin)/programs/${id}/classes`)}
          />
          <NavCard
            icon="settings-outline"
            title={t('admin.masterAdmin.programs.settings')}
            subtitle={t('admin.masterAdmin.programs.editSettings')}
            color={colors.neutral[600]}
            onPress={() => router.push(`/(master-admin)/programs/${id}/edit`)}
          />
        </View>

        {/* Team Preview */}
        {team.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>{t('admin.masterAdmin.programs.team')}</Text>
              <Pressable onPress={() => router.push(`/(master-admin)/programs/${id}/team`)}>
                <Text style={styles.viewAllText}>{t('common.viewAll')}</Text>
              </Pressable>
            </View>
            <View>
              {team.slice(0, 3).map((member) => (
                <TeamMemberRow key={member.id} member={member} />
              ))}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function OverviewStat({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <Card variant="default" style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={16} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </Card>
  );
}

function NavCard({ icon, title, subtitle, color, onPress }: {
  icon: string; title: string; subtitle: string; color: string; onPress: () => void;
}) {
  return (
    <Card variant="default" style={styles.navCard} onPress={onPress}>
      <View style={styles.navContent}>
        <View style={[styles.navIcon, { backgroundColor: color + '10' }]}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
        </View>
        <View style={styles.navTextContainer}>
          <Text style={styles.navTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.navSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.neutral[300]} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  headerAction: {
    width: normalize(38),
    height: normalize(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginTop: -spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
  },
  statIcon: {
    width: normalize(28),
    height: normalize(28),
    borderRadius: normalize(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(6),
  },
  statValue: {
    ...typography.textStyles.display,
    fontSize: normalize(22),
  },
  statLabel: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: normalize(2),
    textAlign: 'center',
  },
  navGrid: {
    gap: spacing.md,
  },
  navCard: {
    padding: spacing.md,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  navIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextContainer: {
    flex: 1,
    gap: normalize(2),
  },
  navTitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
  },
  navSubtitle: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: colors.neutral[800],
    fontSize: normalize(16),
  },
  viewAllText: {
    ...typography.textStyles.label,
    color: colors.primary[500],
  },
});
