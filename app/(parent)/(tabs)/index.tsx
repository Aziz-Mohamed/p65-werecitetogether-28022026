import React from 'react';
import { I18nManager, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge, Avatar } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useParentDashboard } from '@/features/dashboard/hooks/useParentDashboard';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { formatSessionDate } from '@/lib/helpers';
import { colors, semantic } from '@/theme/colors';
import type { ChildQuickStatus, RecentSessionEntry } from '@/features/dashboard/types/dashboard.types';
import { getAttendanceBadge } from '@/features/attendance/utils/attendance-badge';
import { styles } from '@/styles/parent-dashboard.styles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRate(rate: number): string {
  return rate >= 0 ? `${rate}%` : 'N/A';
}

// ─── Parent Dashboard ─────────────────────────────────────────────────────────

export default function ParentDashboard() {
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const router = useRouter();
  const theme = useRoleTheme();

  const { resolveFirstName } = useLocalizedName();

  const { data, isLoading, error, refetch } = useParentDashboard(profile?.id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  const children = data?.children ?? [];
  const stats = data?.aggregateStats;
  const recentSessions = data?.recentSessions ?? [];

  if (children.length === 0) {
    return (
      <Screen scroll hasTabBar>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.greeting}>
                {t('dashboard.welcome', { name: resolveFirstName(profile?.name_localized, profile?.full_name) })} 👋
              </Text>
              <Text style={styles.subtitle}>{t('parent.dashboard.subtitle')}</Text>
            </View>
            <Badge label={t('roles.parent')} variant={theme.tag} size="md" />
          </View>
          <EmptyState
            icon="people-outline"
            title={t('parent.children.emptyTitle')}
            description={t('parent.children.emptyDescription')}
          />
        </View>
      </Screen>
    );
  }

  const absentChildren = children.filter((c) => c.todayStatus === 'absent');

  return (
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>
              {t('dashboard.welcome', { name: resolveFirstName(profile?.name_localized, profile?.full_name) })} 👋
            </Text>
            <Text style={styles.subtitle}>{t('parent.dashboard.subtitle')}</Text>
          </View>
          <Badge label={t('roles.parent')} variant={theme.tag} size="md" />
        </View>

        {/* ── Today at a Glance ── */}
        <Card variant="primary-glow" style={styles.glanceCard}>
          <Text style={styles.glanceTitle}>{t('parent.dashboard.todayAtAGlance')}</Text>
          <View style={styles.glancePills}>
            <View style={styles.pill}>
              <Ionicons name="checkmark-circle" size={16} color={semantic.success} />
              <Text style={[styles.pillText, { color: semantic.success }]}>
                {stats?.presentToday ?? 0} {t('parent.dashboard.present')}
              </Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="close-circle" size={16} color={semantic.error} />
              <Text style={[styles.pillText, { color: semantic.error }]}>
                {stats?.absentToday ?? 0} {t('parent.dashboard.absent')}
              </Text>
            </View>
            <View style={styles.pill}>
              <Ionicons name="time-outline" size={16} color={colors.neutral[400]} />
              <Text style={[styles.pillText, { color: colors.neutral[500] }]}>
                {stats?.notMarkedToday ?? 0} {t('parent.dashboard.notMarked')}
              </Text>
            </View>
          </View>
          {absentChildren.length > 0 ? (
            <View style={styles.alertRow}>
              <Ionicons name="alert-circle" size={14} color={semantic.error} />
              <Text style={styles.alertText}>
                {absentChildren.map((c) => t('parent.dashboard.absentAlert', { name: c.name.split(' ')[0] })).join(' · ')}
              </Text>
            </View>
          ) : stats?.presentToday && stats.presentToday > 0 ? (
            <View style={styles.alertRow}>
              <Ionicons name="checkmark-done" size={14} color={semantic.success} />
              <Text style={[styles.alertText, { color: semantic.success }]}>
                {t('parent.dashboard.allPresent')}
              </Text>
            </View>
          ) : null}
        </Card>

        {/* ── Stats Grid ── */}
        <View style={styles.statsGrid}>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: semantic.success }]}>
              {formatRate(stats?.averageAttendanceRate ?? -1)}
            </Text>
            <Text style={styles.statLabel}>{t('parent.dashboard.averageAttendance')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent.violet[500] }]}>
              {stats?.totalStickers ?? 0}
            </Text>
            <Text style={styles.statLabel}>{t('parent.dashboard.totalStickers')}</Text>
          </Card>
          <Card variant="default" style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.accent.rose[500] }]}>
              {stats?.totalStreakDays ?? 0}
            </Text>
            <Text style={styles.statLabel}>{t('parent.dashboard.activeStreaks')}</Text>
          </Card>
        </View>

        {/* ── Children Quick Status ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('parent.dashboard.childrenStatus')}</Text>
          <Badge label={String(children.length)} variant={theme.tag} />
        </View>
        <View style={styles.childrenList}>
          {children.map((child) => (
            <ChildStatusRow
              key={child.id}
              child={child}
              theme={theme}
              onPress={() => router.push(`/(parent)/children/${child.id}`)}
            />
          ))}
        </View>

        {/* ── Recent Sessions ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('parent.recentSessions')}</Text>
          <Badge label={String(recentSessions.length)} variant="sky" />
        </View>
        {recentSessions.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('parent.dashboard.noRecentSessions')}</Text>
          </Card>
        ) : (
          recentSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              locale={i18n.language}
              onPress={() => router.push(`/(parent)/sessions/${session.id}`)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

// ─── Child Status Row ─────────────────────────────────────────────────────────

interface ChildStatusRowProps {
  child: ChildQuickStatus;
  theme: ReturnType<typeof useRoleTheme>;
  onPress: () => void;
}

const ChildStatusRow = React.memo(function ChildStatusRow({
  child,
  theme,
  onPress,
}: ChildStatusRowProps) {
  const { t } = useTranslation();

  return (
    <Card variant="default" style={styles.childCard} onPress={onPress}>
      <View style={styles.childRow}>
        <Avatar name={child.name} size="sm" ring variant={theme.tag} />
        <View style={styles.childInfo}>
          <Text style={styles.childName} numberOfLines={1}>{child.name}</Text>
          <Text style={styles.childMeta} numberOfLines={1}>
            {child.className ?? '—'}
            {` · ${t('common.level')} ${child.currentLevel}/240`}
          </Text>
        </View>
        <View style={styles.childBadges}>
          {(() => {
            const badge = getAttendanceBadge(child.todayStatus, t);
            return <Badge label={badge.label} variant={badge.variant} size="sm" />;
          })()}
          <Text style={styles.rateText}>{formatRate(child.attendanceRate)}</Text>
        </View>
        <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.neutral[300]} />
      </View>
    </Card>
  );
});

// ─── Session Card ────────────────────────────────────────────────────────────

interface SessionCardProps {
  session: RecentSessionEntry;
  locale: string;
  onPress: () => void;
}

const SessionCard = React.memo(function SessionCard({
  session,
  locale,
  onPress,
}: SessionCardProps) {
  const { t } = useTranslation();
  const formatted = formatSessionDate(session.sessionDate, locale);
  const hasScores = session.memorizationScore != null || session.tajweedScore != null || session.recitationQuality != null;

  return (
    <Card variant="default" style={styles.sessionCard} onPress={onPress}>
      {/* Header: child name + date */}
      <View style={styles.sessionHeader}>
        <View style={styles.sessionHeaderLeft}>
          <Ionicons name="book-outline" size={16} color={colors.accent.violet[500]} />
          <Text style={styles.sessionChildName} numberOfLines={1}>{session.childName}</Text>
        </View>
        <View style={styles.sessionDateRow}>
          <Text style={styles.sessionDateText}>{formatted.date}</Text>
          <Text style={styles.sessionWeekday}>({formatted.weekday})</Text>
        </View>
      </View>

      {/* Scores row */}
      {hasScores && (
        <View style={styles.sessionScoresRow}>
          {session.memorizationScore != null && (
            <ScorePill label={t('common.scoreAbbrev.memorization')} value={session.memorizationScore} max={5} />
          )}
          {session.tajweedScore != null && (
            <ScorePill label={t('common.scoreAbbrev.tajweed')} value={session.tajweedScore} max={5} />
          )}
          {session.recitationQuality != null && (
            <ScorePill label={t('common.scoreAbbrev.recitation')} value={session.recitationQuality} max={5} />
          )}
        </View>
      )}

      {/* Notes preview */}
      {session.notes && (
        <View style={styles.sessionNotesPreview}>
          <Text style={styles.sessionNotesText} numberOfLines={2}>{session.notes}</Text>
        </View>
      )}

      {/* Tap hint */}
      <View style={styles.sessionTapHint}>
        <Text style={styles.sessionTapText}>{t('parent.sessionDetail.title')}</Text>
        <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={14} color={colors.neutral[300]} />
      </View>
    </Card>
  );
});

interface ScorePillProps {
  label: string;
  value: number;
  max: number;
}

const ScorePill = React.memo(function ScorePill({ label, value, max }: ScorePillProps) {
  const isHigh = value >= max * 0.8;
  return (
    <View style={[styles.scorePill, { backgroundColor: isHigh ? colors.primary[50] : colors.neutral[50] }]}>
      <Text style={styles.scorePillLabel}>{label}:</Text>
      <Text style={[styles.scorePillValue, { color: isHigh ? colors.primary[600] : colors.neutral[600] }]}>
        {value}/{max}
      </Text>
    </View>
  );
});

