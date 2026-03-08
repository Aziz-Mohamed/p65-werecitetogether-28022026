import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui';
import { EmptyState } from '@/components/feedback';
import { colors, gamification as gamColors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { ProgramLeaderboardEntry } from '../types/gamification.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProgramLeaderboardProps {
  entries: ProgramLeaderboardEntry[];
  currentStudentId: string | undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProgramLeaderboard({
  entries,
  currentStudentId,
}: ProgramLeaderboardProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="podium-outline"
        title={t('gamification.programLeaderboard.empty')}
      />
    );
  }

  // Find if the current student is beyond the top list (appended by RPC)
  const topEntries = entries.filter((e) => e.rank <= 20);
  const ownEntry = entries.find(
    (e) => e.student_id === currentStudentId && e.rank > 20,
  );

  const data = ownEntry ? [...topEntries, ownEntry] : topEntries;

  return (
    <FlashList
      data={data}
      keyExtractor={(item) => item.student_id}
      contentContainerStyle={styles.listContent}
      renderItem={({ item, index }) => {
        const isCurrentUser = item.student_id === currentStudentId;
        const showDivider =
          ownEntry && index === topEntries.length;

        return (
          <>
            {showDivider && <View style={styles.divider} />}
            <LeaderboardRow
              entry={item}
              isCurrentUser={isCurrentUser}
              t={t}
            />
          </>
        );
      }}
    />
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  isCurrentUser,
  t,
}: {
  entry: ProgramLeaderboardEntry;
  isCurrentUser: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const rankColor =
    entry.rank === 1
      ? gamColors.tierAccent.gold
      : entry.rank === 2
        ? gamColors.tierAccent.silver
        : entry.rank === 3
          ? gamColors.tierAccent.bronze
          : undefined;

  return (
    <Card
      variant={isCurrentUser ? 'primary-glow' : 'default'}
      style={styles.entryCard}
    >
      <View style={styles.entryRow}>
        <View style={styles.rankContainer}>
          {entry.rank <= 3 ? (
            <Ionicons name="trophy" size={24} color={rankColor} />
          ) : (
            <Text style={styles.rankText}>{entry.rank}</Text>
          )}
        </View>

        <Avatar
          source={entry.avatar_url ?? undefined}
          name={entry.full_name}
          size="md"
          ring={isCurrentUser}
        />

        <View style={styles.entryInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.entryName} numberOfLines={1}>
              {entry.full_name}
            </Text>
            {isCurrentUser && (
              <Text style={styles.youLabel}>
                {t('gamification.programLeaderboard.you')}
              </Text>
            )}
          </View>
          <Text style={styles.entryMeta}>
            {t('gamification.programLeaderboard.level', {
              level: entry.current_level,
            })}{' '}
            · {t('gamification.programLeaderboard.streak', {
              count: entry.longest_streak,
            })}
          </Text>
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelValue}>{entry.current_level}</Text>
          <Text style={styles.levelMax}>/240</Text>
        </View>
      </View>
    </Card>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.lg,
  },
  entryCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rankContainer: {
    width: normalize(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[400],
    fontSize: normalize(18),
  },
  entryInfo: {
    flex: 1,
    gap: normalize(2),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  entryName: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
    flexShrink: 1,
  },
  youLabel: {
    ...typography.textStyles.caption,
    color: colors.primary[500],
    fontFamily: typography.fontFamily.bold,
  },
  entryMeta: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  levelValue: {
    ...typography.textStyles.bodyMedium,
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(18),
    color: colors.primary[500],
  },
  levelMax: {
    ...typography.textStyles.label,
    fontSize: normalize(12),
    color: colors.neutral[400],
  },
  divider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginVertical: spacing.md,
    marginHorizontal: spacing.sm,
  },
});
