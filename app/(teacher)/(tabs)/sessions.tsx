import React, { useState, useMemo, useRef, useCallback } from 'react';
import { I18nManager, StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider, type BottomSheetModal } from '@gorhom/bottom-sheet';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import {
  useTeacherUpcomingSessions,
  useTeacherSessionHistory,
} from '@/features/scheduling/hooks/useScheduledSessions';
import { useCanTeacherCreateSessions } from '@/features/schools';
import { CreateSessionSheet } from '@/features/scheduling/components/CreateSessionSheet';
import { useDraftSessions } from '@/features/sessions/hooks/useDraftSessions';
import { DraftBadge } from '@/features/sessions/components/DraftBadge';
import { ProgramChip } from '@/features/sessions/components/ProgramChip';
import { MicIndicator } from '@/features/voice-memos';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';

// ─── Types ───────────────────────────────────────────────────────────────────

type ActiveTab = 'upcoming' | 'history';

type SessionListItem =
  | { type: 'header'; date: string }
  | { type: 'session'; data: any };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<string, 'sky' | 'warning' | 'success' | 'default'> = {
  scheduled: 'sky',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'default',
  missed: 'warning',
};

function groupByDate(sessions: any[]): SessionListItem[] {
  const grouped = new Map<string, any[]>();
  for (const session of sessions) {
    const date = session.session_date;
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date)!.push(session);
  }
  const items: SessionListItem[] = [];
  for (const [date, daySessions] of grouped.entries()) {
    items.push({ type: 'header', date });
    for (const session of daySessions) {
      items.push({ type: 'session', data: session });
    }
  }
  return items;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SessionsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile, schoolId } = useAuth();
  const { resolveName } = useLocalizedName();

  const [activeTab, setActiveTab] = useState<ActiveTab>('upcoming');
  const createSheetRef = useRef<BottomSheetModal>(null);

  const { canCreate } = useCanTeacherCreateSessions(schoolId ?? undefined);

  const handleOpenCreateSheet = useCallback(() => {
    createSheetRef.current?.present();
  }, []);

  const upcoming = useTeacherUpcomingSessions(profile?.id, schoolId ?? undefined);
  const history = useTeacherSessionHistory(profile?.id, schoolId ?? undefined);
  const { data: drafts = [] } = useDraftSessions();

  const upcomingItems = useMemo(() => groupByDate(upcoming.data ?? []), [upcoming.data]);
  const historyItems = useMemo(() => groupByDate(history.data ?? []), [history.data]);

  const isLoading = activeTab === 'upcoming' ? upcoming.isLoading : history.isLoading;
  const error = activeTab === 'upcoming' ? upcoming.error : history.error;
  const refetch = activeTab === 'upcoming' ? upcoming.refetch : history.refetch;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <BottomSheetModalProvider>
      <Screen scroll={false} hasTabBar>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('teacher.sessions.title')}</Text>
            {canCreate && (
              <Pressable
                style={styles.addButton}
                onPress={handleOpenCreateSheet}
                accessibilityLabel={t('scheduling.createSession')}
              >
                <Ionicons name="add" size={22} color={colors.primary[600]} />
              </Pressable>
            )}
          </View>

          {/* Drafts Section */}
          {drafts.length > 0 && (
            <View style={styles.draftsSection}>
              <Text style={styles.draftsSectionTitle}>{t('sessions.draftsSection')}</Text>
              {drafts.map((draft: any) => {
                const draftStudentName = resolveName(
                  draft.student?.profiles?.name_localized,
                  draft.student?.profiles?.full_name,
                ) ?? '—';
                return (
                  <Card
                    key={draft.id}
                    variant="default"
                    style={styles.draftCard}
                    onPress={() => router.push(`/(teacher)/sessions/${draft.id}`)}
                  >
                    <View style={styles.cardRow}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {draftStudentName}
                        </Text>
                        <Text style={styles.cardMeta}>
                          {new Date(draft.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {draft.programs && (
                        <ProgramChip
                          programName={draft.programs.name}
                          programNameAr={draft.programs.name_ar}
                        />
                      )}
                      <DraftBadge />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Tabs */}
          <View style={styles.tabBar}>
            {(['upcoming', 'history'] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count = tab === 'upcoming'
                ? (upcoming.data?.length ?? 0)
                : (history.data?.length ?? 0);
              return (
                <Pressable
                  key={tab}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isActive }}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {t(`teacher.sessions.${tab}`)}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                      <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                        {count}
                      </Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Content */}
          {activeTab === 'upcoming' ? (
            <SessionList
              items={upcomingItems}
              resolveName={resolveName}
              router={router}
              t={t}
              emptyIcon="calendar-outline"
              emptyTitle={t('teacher.sessions.noUpcoming')}
              emptyDescription={t('teacher.sessions.noUpcomingDesc')}
              emptyActionLabel={canCreate ? t('scheduling.createSession') : undefined}
              onEmptyAction={canCreate ? handleOpenCreateSheet : undefined}
              showScore={false}
            />
          ) : (
            <SessionList
              items={historyItems}
              resolveName={resolveName}
              router={router}
              t={t}
              emptyIcon="clipboard-outline"
              emptyTitle={t('teacher.sessions.emptyTitle')}
              emptyDescription={t('teacher.sessions.emptyDescription')}
              showScore
            />
          )}
        </View>
      </Screen>

      {canCreate && <CreateSessionSheet ref={createSheetRef} />}
    </BottomSheetModalProvider>
  );
}

// ─── Shared Session List ────────────────────────────────────────────────────

function SessionList({
  items,
  resolveName,
  router,
  t,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  showScore,
}: {
  items: SessionListItem[];
  resolveName: (localized: any, fallback: any) => string | undefined;
  router: ReturnType<typeof useRouter>;
  t: (key: string, opts?: any) => string;
  emptyIcon: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  showScore: boolean;
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon as any}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  return (
    <FlashList
      data={items}
      keyExtractor={(item, _idx) => (item.type === 'header' ? `h-${item.date}` : `s-${item.data.id}`)}
      getItemType={(item) => item.type}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => {
        if (item.type === 'header') {
          return (
            <Text style={styles.dateHeader}>
              {new Date(item.date + 'T00:00:00').toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          );
        }

        const session = item.data;
        const score = session.evaluation?.memorization_score ?? session.memorization_score;

        return (
          <Card
            variant="default"
            style={styles.card}
            onPress={() => router.push(`/(teacher)/schedule/${session.id}`)}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {resolveName(session.class?.name_localized, session.class?.name) ?? t('scheduling.individualSession')}
                </Text>
                <Text style={styles.cardMeta}>
                  {session.start_time?.slice(0, 5)} – {session.end_time?.slice(0, 5)}
                  {session.student?.profiles?.full_name
                    ? `  ·  ${resolveName(session.student.profiles?.name_localized, session.student.profiles.full_name)}`
                    : ''}
                </Text>
              </View>
              <MicIndicator hasVoiceMemo={Array.isArray(session.session_voice_memos) && session.session_voice_memos.length > 0} />
              {showScore && score != null && (
                <Badge
                  label={`${score}/5`}
                  variant={score >= 4 ? 'success' : 'warning'}
                  size="sm"
                />
              )}
              <Badge
                label={t(`scheduling.status.${session.status}`)}
                variant={STATUS_BADGE_VARIANT[session.status] ?? 'default'}
                size="sm"
              />
              <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.neutral[300]} />
            </View>
          </Card>
        );
      }}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    fontSize: normalize(24),
  },
  addButton: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: radius.sm,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Tabs ──
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary[500],
  },
  tabText: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[400],
    fontSize: normalize(15),
  },
  tabTextActive: {
    color: colors.primary[600],
  },
  tabCount: {
    minWidth: normalize(20),
    height: normalize(20),
    borderRadius: normalize(10),
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  tabCountActive: {
    backgroundColor: colors.primary[50],
  },
  tabCountText: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
    fontSize: normalize(11),
    fontWeight: '600',
  },
  tabCountTextActive: {
    color: colors.primary[600],
  },

  // ── Shared ──
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  dateHeader: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    fontSize: normalize(13),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: normalize(3),
  },
  cardTitle: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  cardMeta: {
    ...typography.textStyles.caption,
    color: colors.neutral[400],
  },
  draftsSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  draftsSectionTitle: {
    ...typography.textStyles.label,
    color: colors.neutral[500],
    fontSize: normalize(13),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  draftCard: {
    padding: spacing.md,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
});
