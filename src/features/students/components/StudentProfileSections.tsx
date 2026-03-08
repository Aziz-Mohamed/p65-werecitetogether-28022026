import React, { useState } from 'react';
import { I18nManager, LayoutAnimation, Pressable, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Badge, Avatar } from '@/components/ui';
import { typography } from '@/theme/typography';
import { colors, semanticSurface } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { formatSessionDate } from '@/lib/helpers';
import type { EnrollmentWithDetails } from '@/features/programs/types/programs.types';

// ─── CollapsibleSection ──────────────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  summary?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, summary, defaultExpanded = false, children }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const chevronName = expanded
    ? 'chevron-down'
    : (I18nManager.isRTL ? 'chevron-back' : 'chevron-forward');

  return (
    <View>
      <Pressable onPress={toggle} style={collapseStyles.header} accessibilityRole="button">
        <View style={collapseStyles.titleRow}>
          <Text style={sectionStyles.title}>{title}</Text>
          {count != null && <Badge label={String(count)} variant="default" />}
        </View>
        <Ionicons name={chevronName} size={18} color={colors.neutral[400]} />
      </Pressable>

      {!expanded && summary && (
        <View style={collapseStyles.summaryContainer}>{summary}</View>
      )}

      {expanded && <View style={collapseStyles.content}>{children}</View>}
    </View>
  );
}

const collapseStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  summaryContainer: {
    paddingBottom: spacing.xs,
  },
  content: {
    paddingTop: spacing.xs,
  },
});

// ─── StudentProfileHeader ────────────────────────────────────────────────────

interface StudentProfileHeaderProps {
  name: string | null;
  avatarUrl?: string | null;
  classBadge?: string | null;
  activeCount: number;
}

export function StudentProfileHeader({ name, avatarUrl, classBadge, activeCount }: StudentProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <Card variant="primary-glow" style={headerStyles.card}>
      <Avatar
        source={avatarUrl ?? undefined}
        name={name ?? undefined}
        size="xl"
        ring
        variant="indigo"
      />
      <View style={headerStyles.info}>
        <Text style={headerStyles.name}>{name ?? '—'}</Text>
        <View style={headerStyles.metaRow}>
          {classBadge && <Badge label={classBadge} variant="sky" size="sm" />}
          <Badge label={`${t('common.level')} ${activeCount}/240`} variant="indigo" size="sm" />
        </View>
      </View>
    </Card>
  );
}

const headerStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  info: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.heading,
    color: colors.neutral[900],
    fontSize: normalize(24),
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});

// ─── StudentStatsGrid ────────────────────────────────────────────────────────

interface StudentStatsGridProps {
  activeCount: number;
  streak: number;
  stickersCount: number;
  attendanceRate: number;
}

export function StudentStatsGrid({ activeCount, streak, stickersCount, attendanceRate }: StudentStatsGridProps) {
  const { t } = useTranslation();

  return (
    <View style={statsStyles.grid}>
      <Card variant="default" style={statsStyles.card}>
        <Text style={[statsStyles.value, { color: colors.primary[500] }]}>{activeCount}/240</Text>
        <Text style={statsStyles.label}>{t('common.level')}</Text>
      </Card>
      <Card variant="default" style={statsStyles.card}>
        <Text style={[statsStyles.value, { color: colors.accent.rose[500] }]}>{streak}</Text>
        <Text style={statsStyles.label}>{t('student.streak')}</Text>
      </Card>
      <Card variant="default" style={statsStyles.card}>
        <Text style={[statsStyles.value, { color: colors.primary[500] }]}>{stickersCount}</Text>
        <Text style={statsStyles.label}>{t('navigation.stickers')}</Text>
      </Card>
      <Card variant="default" style={statsStyles.card}>
        <Text style={[statsStyles.value, { color: colors.accent.sky[500] }]}>{Math.round(attendanceRate)}%</Text>
        <Text style={statsStyles.label}>{t('navigation.attendance')}</Text>
      </Card>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  value: {
    ...typography.textStyles.display,
    fontSize: normalize(24),
  },
  label: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    marginTop: normalize(4),
  },
});

// ─── StudentSessionsList ─────────────────────────────────────────────────────

interface StudentSessionsListProps {
  sessions: any[];
  maxItems?: number;
}

function ScoreItem({ label, value, color }: { label: string; value: number | null; color: string }) {
  if (value == null) return null;
  return (
    <View style={sessionStyles.scoreItem}>
      <Text style={sessionStyles.scoreLabel}>{label}</Text>
      <View style={[sessionStyles.scoreValueContainer, { backgroundColor: color + '10' }]}>
        <Text style={[sessionStyles.scoreValue, { color }]}>{value}/5</Text>
      </View>
    </View>
  );
}

function SessionsSummary({ sessions }: { sessions: any[] }) {
  const { t, i18n } = useTranslation();
  if (sessions.length === 0) return null;

  const latest = sessions[0];
  const avgMem = sessions.reduce((sum: number, s: any) => sum + (s.memorization_score ?? 0), 0) / sessions.length;
  const avgTaj = sessions.reduce((sum: number, s: any) => sum + (s.tajweed_score ?? 0), 0) / sessions.length;

  return (
    <Card variant="default" style={summaryStyles.card}>
      <View style={summaryStyles.row}>
        <Text style={summaryStyles.label}>{t('teacher.insights.recentSessions')}</Text>
        <Text style={summaryStyles.value}>
          {formatSessionDate(latest.session_date, i18n.language).date}
        </Text>
      </View>
      <View style={summaryStyles.scoresRow}>
        <View style={[summaryStyles.scorePill, { backgroundColor: colors.primary[500] + '10' }]}>
          <Text style={[summaryStyles.scoreText, { color: colors.primary[500] }]}>
            {t('teacher.sessions.memorization')} {avgMem.toFixed(1)}
          </Text>
        </View>
        <View style={[summaryStyles.scorePill, { backgroundColor: colors.accent.sky[500] + '10' }]}>
          <Text style={[summaryStyles.scoreText, { color: colors.accent.sky[500] }]}>
            {t('teacher.sessions.tajweed')} {avgTaj.toFixed(1)}
          </Text>
        </View>
      </View>
    </Card>
  );
}

export function StudentSessionsList({ sessions, maxItems = 10 }: StudentSessionsListProps) {
  const { t, i18n } = useTranslation();
  const items = maxItems ? sessions.slice(0, maxItems) : sessions;

  return (
    <CollapsibleSection
      title={t('teacher.insights.recentSessions')}
      count={sessions.length}
      summary={<SessionsSummary sessions={sessions} />}
    >
      {items.length === 0 ? (
        <Card variant="outlined" style={sectionStyles.emptyCard}>
          <Text style={sectionStyles.emptyText}>{t('teacher.dashboard.noRecentSessions')}</Text>
        </Card>
      ) : (
        items.map((session) => (
          <Card key={session.id} variant="default" style={sessionStyles.card}>
            <View style={sessionStyles.row}>
              <View style={sessionStyles.headerRow}>
                <View style={sessionStyles.dateGroup}>
                  <Ionicons name="calendar" size={16} color={colors.primary[500]} />
                  <Text style={sessionStyles.date}>
                    {formatSessionDate(session.session_date, i18n.language).date}{' '}
                    <Text style={sessionStyles.weekday}>
                      ({formatSessionDate(session.session_date, i18n.language).weekday})
                    </Text>
                  </Text>
                </View>
              </View>
              <View style={sessionStyles.scoresRow}>
                <ScoreItem label={t('teacher.sessions.memorization')} value={session.memorization_score} color={colors.primary[500]} />
                <ScoreItem label={t('teacher.sessions.tajweed')} value={session.tajweed_score} color={colors.accent.sky[500]} />
                <ScoreItem label={t('teacher.sessions.recitation')} value={session.recitation_quality} color={colors.accent.violet[500]} />
              </View>
            </View>
          </Card>
        ))
      )}
    </CollapsibleSection>
  );
}

const sessionStyles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  date: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
  },
  weekday: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.neutral[50],
    padding: spacing.sm,
    borderRadius: normalize(12),
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreLabel: {
    fontSize: normalize(9),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    marginBottom: normalize(4),
  },
  scoreValueContainer: {
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(2),
    borderRadius: normalize(6),
  },
  scoreValue: {
    fontSize: normalize(12),
    fontFamily: typography.fontFamily.bold,
  },
});

// ─── StudentStickersList ─────────────────────────────────────────────────────

interface StudentStickersListProps {
  stickers: any[];
  maxItems?: number;
}

export function StudentStickersList({ stickers, maxItems = 5 }: StudentStickersListProps) {
  const { t } = useTranslation();
  const items = maxItems ? stickers.slice(0, maxItems) : stickers;

  return (
    <CollapsibleSection
      title={t('teacher.insights.stickerHistory')}
      count={stickers.length}
      summary={
        stickers.length > 0 ? (
          <Card variant="default" style={summaryStyles.card}>
            <Text style={summaryStyles.summaryText}>
              {stickers.slice(0, 3).map((s: any) => s.stickers?.name_en ?? '—').join(', ')}
              {stickers.length > 3 ? ` +${stickers.length - 3}` : ''}
            </Text>
          </Card>
        ) : null
      }
    >
      {items.length === 0 ? (
        <Card variant="outlined" style={sectionStyles.emptyCard}>
          <Text style={sectionStyles.emptyText}>{t('student.stickers.emptyDescription')}</Text>
        </Card>
      ) : (
        items.map((sticker) => (
          <Card key={sticker.id} variant="glass" style={stickerStyles.card}>
            <View style={stickerStyles.row}>
              <View style={stickerStyles.iconContainer}>
                <Ionicons name="star" size={20} color={colors.gamification.gold} />
              </View>
              <View style={stickerStyles.info}>
                <Text style={stickerStyles.name}>{sticker.stickers?.name_en ?? '—'}</Text>
                {sticker.reason && <Text style={stickerStyles.reason}>{sticker.reason}</Text>}
              </View>
              <View style={stickerStyles.tierLabel}>
                <Text style={stickerStyles.tier}>{sticker.stickers?.tier ?? ''}</Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </CollapsibleSection>
  );
}

const stickerStyles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    backgroundColor: semanticSurface.warning,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  reason: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
  tierLabel: {
    backgroundColor: colors.neutral[50],
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(4),
    borderRadius: normalize(8),
  },
  tier: {
    fontSize: normalize(11),
    fontFamily: typography.fontFamily.semiBold,
    color: colors.neutral[500],
    textTransform: 'capitalize',
  },
});

// ─── StudentGuardiansList ────────────────────────────────────────────────────

interface StudentGuardiansListProps {
  guardians: any[];
}

export function StudentGuardiansList({ guardians }: StudentGuardiansListProps) {
  const { t } = useTranslation();

  if (guardians.length === 0) return null;

  return (
    <CollapsibleSection
      title={t('admin.students.guardian')}
      count={guardians.length}
      defaultExpanded
    >
      {guardians.map((g: any) => (
        <Card key={g.id} variant="outlined" style={guardianStyles.card}>
          <View style={guardianStyles.row}>
            <Ionicons name="person-outline" size={18} color={colors.neutral[500]} />
            <View style={guardianStyles.info}>
              <Text style={guardianStyles.name}>{g.guardian_name ?? '—'}</Text>
              {g.relationship && (
                <Text style={guardianStyles.relationship}>{g.relationship}</Text>
              )}
            </View>
            {g.is_primary && <Badge label={t('common.primary')} variant="info" size="sm" />}
          </View>
        </Card>
      ))}
    </CollapsibleSection>
  );
}

const guardianStyles = StyleSheet.create({
  card: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  relationship: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
});

// ─── StudentEnrollmentHistory ────────────────────────────────────────────────

interface StudentEnrollmentHistoryProps {
  enrollments: EnrollmentWithDetails[];
}

export function StudentEnrollmentHistory({ enrollments }: StudentEnrollmentHistoryProps) {
  const { t } = useTranslation();

  if (enrollments.length === 0) return null;

  return (
    <CollapsibleSection
      title={t('programs.labels.enrollments')}
      count={enrollments.length}
      summary={
        <Card variant="default" style={summaryStyles.card}>
          <Text style={summaryStyles.summaryText}>
            {enrollments.slice(0, 2).map((e) => e.programs?.name ?? '—').join(', ')}
            {enrollments.length > 2 ? ` +${enrollments.length - 2}` : ''}
          </Text>
        </Card>
      }
    >
      {enrollments.map((e) => (
        <Card key={e.id} variant="outlined" style={enrollmentStyles.card}>
          <View style={enrollmentStyles.row}>
            <View style={enrollmentStyles.info}>
              <Text style={enrollmentStyles.programName}>
                {e.programs?.name ?? '—'}
              </Text>
              {e.classes?.name && (
                <Text style={enrollmentStyles.className}>{e.classes.name}</Text>
              )}
              {e.enrolled_at && (
                <Text style={enrollmentStyles.date}>
                  {new Date(e.enrolled_at).toLocaleDateString()}
                </Text>
              )}
            </View>
            <Badge
              label={t(`programs.status.${e.status}`)}
              variant={e.status === 'active' ? 'success' : e.status === 'pending' ? 'warning' : 'default'}
              size="sm"
            />
          </View>
        </Card>
      ))}
    </CollapsibleSection>
  );
}

const enrollmentStyles = StyleSheet.create({
  card: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  className: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    marginTop: normalize(2),
  },
  date: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    marginTop: normalize(2),
  },
});

// ─── Collapsible Rub Progress Map Wrapper ────────────────────────────────────

interface CollapsibleRubProgressProps {
  activeCount: number;
  children: React.ReactNode;
}

export function CollapsibleRubProgress({ activeCount, children }: CollapsibleRubProgressProps) {
  const { t } = useTranslation();

  return (
    <CollapsibleSection
      title={t('gamification.progressMap')}
      summary={
        <Card variant="default" style={summaryStyles.card}>
          <Text style={summaryStyles.summaryText}>
            {activeCount}/240 {t('common.level').toLowerCase()}
          </Text>
        </Card>
      }
    >
      {children}
    </CollapsibleSection>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────────────────

const summaryStyles = StyleSheet.create({
  card: {
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
    textTransform: 'uppercase',
  },
  value: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
  },
  scoresRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  scorePill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: normalize(2),
    borderRadius: normalize(8),
  },
  scoreText: {
    fontSize: normalize(11),
    fontFamily: typography.fontFamily.semiBold,
  },
  summaryText: {
    ...typography.textStyles.body,
    color: colors.neutral[600],
  },
});

const sectionStyles = StyleSheet.create({
  title: {
    ...typography.textStyles.subheading,
    color: colors.neutral[800],
    fontSize: normalize(18),
  },
  emptyCard: {
    padding: spacing.xl,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.textStyles.body,
    color: colors.neutral[400],
  },
});
