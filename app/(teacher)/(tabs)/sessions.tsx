import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

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
import { lightTheme, neutral, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Session } from '@/features/sessions/types';

export default function TeacherSessionsScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const teacherId = profile?.id;

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
    <Screen scroll hasTabBar>
      <View style={styles.container}>
        <Text style={styles.title}>{t('sessions.title')}</Text>

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
            {draftSessions.map((session: Session) => (
              <Card key={session.id} variant="outlined" style={styles.draftCard}>
                <View style={styles.draftRow}>
                  <Badge label={t('sessions.draft')} variant="warning" size="sm" />
                  <Text style={styles.draftDate}>
                    {new Date(session.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* Completed Sessions */}
        <Text style={styles.sectionTitle}>
          {t('sessions.recentSessions')}
        </Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginBlockStart: spacing.sm,
  },
  draftCard: {
    padding: spacing.md,
  },
  draftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  draftDate: {
    ...typography.textStyles.caption,
    color: neutral[500],
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
