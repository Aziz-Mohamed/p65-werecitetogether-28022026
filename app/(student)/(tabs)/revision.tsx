import React, { useCallback, useMemo, useState } from 'react';
import { Alert, I18nManager, Pressable, RefreshControl, SectionList, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useRoleTheme } from '@/hooks/useRoleTheme';
import {
  useRevisionHealth,
  RevisionWarning,
  RevisionSheet,
  GroupRevisionSheet,
  FRESHNESS_DOT_COLORS,
  FRESHNESS_BG_COLORS,
  getWorstState,
} from '@/features/gamification';
import type { EnrichedCertification, CertGroup } from '@/features/gamification';
import { colors } from '@/theme/colors';
import { normalize } from '@/theme/normalize';
import { styles } from '@/styles/revision.styles';

// ─── Types ───────────────────────────────────────────────────────────────────

type ViewMode = 'rub' | 'hizb' | 'juz';
type ChevronName = 'chevron-back' | 'chevron-forward';

type SectionItem = EnrichedCertification | CertGroup;

function isGroup(item: SectionItem): item is CertGroup {
  return '_type' in item && item._type === 'group';
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEW_MODES: ViewMode[] = ['rub', 'hizb', 'juz'];

// ─── Memoized Sub-Components ─────────────────────────────────────────────────

interface HealthLineProps {
  color: string;
  count: number;
  label: string;
}

const HealthLine = React.memo(function HealthLine({ color, count, label }: HealthLineProps) {
  return (
    <View style={styles.healthLine}>
      <View style={[styles.healthDot, { backgroundColor: color }]} />
      <Text style={styles.healthCount}>{count}</Text>
      <Text style={styles.healthLabel}>{label}</Text>
    </View>
  );
});

interface RubRowProps {
  cert: EnrichedCertification;
  showDaysLeft: boolean;
  chevron: ChevronName;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const RubRow = React.memo(function RubRow({ cert, showDaysLeft, chevron, onPress, t }: RubRowProps) {
  const juz = Math.ceil(cert.rub_number / 8);
  const dotColor = FRESHNESS_DOT_COLORS[cert.freshness.state] ?? colors.neutral[400];
  const bgColor = FRESHNESS_BG_COLORS[cert.freshness.state] ?? colors.neutral[50];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.rubRow,
        pressed && styles.rubRowPressed,
      ]}
      onPress={onPress}
    >
      <View style={[styles.rubDot, { backgroundColor: dotColor }]} />
      <View style={styles.rubInfo}>
        <Text style={styles.rubTitle}>
          {t('gamification.rub')} {cert.rub_number} {'\u00B7'} {t('gamification.juz')} {juz}
        </Text>
        <View style={[styles.rubChip, { backgroundColor: bgColor }]}>
          <Text style={[styles.rubChipText, { color: dotColor }]}>
            {showDaysLeft
              ? t('student.revision.daysLeft', { count: cert.freshness.daysUntilDormant })
              : `${t(`gamification.freshness.${cert.freshness.state}`)} (${cert.freshness.percentage}%)`}
          </Text>
        </View>
      </View>
      <Ionicons name={chevron} size={16} color={colors.neutral[300]} />
    </Pressable>
  );
});

// ─── Revision Health Screen ───────────────────────────────────────────────────

export default function RevisionHealthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();
  const theme = useRoleTheme();
  const chevron: ChevronName = I18nManager.isRTL ? 'chevron-back' : 'chevron-forward';

  const health = useRevisionHealth(profile?.id);

  const [viewMode, setViewMode] = useState<ViewMode>('rub');
  const [viewModeOpen, setViewModeOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<EnrichedCertification | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CertGroup | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  // Build sections based on view mode
  const sections = useMemo((): { title: string; data: SectionItem[]; key: string }[] => {
    if (viewMode === 'rub') {
      const attention: EnrichedCertification[] = [];
      const rest: EnrichedCertification[] = [];

      for (const cert of health.enriched) {
        const needsAttention = cert.freshness.state === 'warning' || cert.freshness.state === 'critical';
        if (needsAttention && !health.homeworkRubSet.has(cert.rub_number)) {
          attention.push(cert);
        } else {
          rest.push(cert);
        }
      }

      attention.sort((a, b) => a.freshness.daysUntilDormant - b.freshness.daysUntilDormant);
      rest.sort((a, b) => a.freshness.percentage - b.freshness.percentage);

      const result: { title: string; data: SectionItem[]; key: string }[] = [];
      if (attention.length > 0) {
        result.push({
          title: `${t('student.revision.needsAttention')} (${attention.length})`,
          data: collapsedSections.attention ? [] : attention,
          key: 'attention',
        });
      }
      if (rest.length > 0) {
        result.push({
          title: `${t('student.revision.allCertified')} (${rest.length})`,
          data: collapsedSections.certified ? [] : rest,
          key: 'certified',
        });
      }
      return result;
    }

    // Group mode (hizb or juz)
    const divisor = viewMode === 'hizb' ? 2 : 8;
    const groupMap = new Map<number, EnrichedCertification[]>();

    for (const cert of health.enriched) {
      const groupNum = Math.ceil(cert.rub_number / divisor);
      const existing = groupMap.get(groupNum);
      if (existing) existing.push(cert);
      else groupMap.set(groupNum, [cert]);
    }

    const attention: CertGroup[] = [];
    const rest: CertGroup[] = [];

    for (const [groupNumber, children] of groupMap) {
      const juzNumber = viewMode === 'juz'
        ? groupNumber
        : Math.ceil(groupNumber / 4);

      const worstState = getWorstState(children.map((c) => c.freshness.state));
      const needsRevisionCount = children.filter(
        (c) => (c.freshness.state === 'warning' || c.freshness.state === 'critical')
          && !health.homeworkRubSet.has(c.rub_number),
      ).length;

      const group: CertGroup = {
        _type: 'group',
        id: `${viewMode}-${groupNumber}`,
        groupNumber,
        juzNumber,
        children: children.sort((a, b) => a.rub_number - b.rub_number),
        worstState,
        needsRevisionCount,
      };

      if (needsRevisionCount > 0) {
        attention.push(group);
      } else {
        rest.push(group);
      }
    }

    attention.sort((a, b) => a.groupNumber - b.groupNumber);
    rest.sort((a, b) => a.groupNumber - b.groupNumber);

    const result: { title: string; data: SectionItem[]; key: string }[] = [];
    if (attention.length > 0) {
      result.push({
        title: `${t('student.revision.needsAttention')} (${attention.length})`,
        data: collapsedSections.attention ? [] : attention,
        key: 'attention',
      });
    }
    if (rest.length > 0) {
      result.push({
        title: `${t('student.revision.allCertified')} (${rest.length})`,
        data: collapsedSections.certified ? [] : rest,
        key: 'certified',
      });
    }
    return result;
  }, [health.enriched, viewMode, collapsedSections, health.homeworkRubSet, t]);

  const handleCertPress = (cert: EnrichedCertification) => {
    setSelectedCert(cert);
    setSheetVisible(true);
  };

  const handleGroupPress = (group: CertGroup) => {
    setSelectedGroup(group);
  };

  const handleAddToPlan = () => {
    if (!selectedCert) return;
    health.addToPlan(selectedCert, {
      onSuccess: () => {
        Alert.alert('', t('gamification.revision.addedToPlan'));
        setSheetVisible(false);
        setSelectedCert(null);
      },
    });
  };

  const handleGroupAddToPlan = useCallback(async () => {
    if (!selectedGroup) return;
    try {
      const count = await health.addGroupToPlan(selectedGroup);
      if (count > 0) {
        Alert.alert('', t('student.revision.batchAddedToPlan', { count }));
      }
      setSelectedGroup(null);
    } catch {
      // Individual failures handled by TanStack Query
    }
  }, [selectedGroup, health, t]);

  const handleRemoveHomework = useCallback((assignmentId: string) => {
    health.removeHomework(assignmentId, {
      onSuccess: () => {
        Alert.alert('', t('student.revision.removeHomework'));
      },
    });
  }, [health, t]);

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const renderItem = useCallback(({ item, section }: { item: SectionItem; section: { key: string } }) => {
    if (isGroup(item)) {
      const dotColor = FRESHNESS_DOT_COLORS[item.worstState] ?? colors.neutral[400];
      const bgColor = FRESHNESS_BG_COLORS[item.worstState] ?? colors.neutral[50];
      const itemLabel = viewMode === 'juz'
        ? `${t('gamification.juz')} ${item.groupNumber}`
        : `${t('gamification.hizb')} ${item.groupNumber} ${'\u00B7'} ${t('gamification.juz')} ${item.juzNumber}`;
      const divisor = viewMode === 'hizb' ? 2 : 8;

      return (
        <Pressable
          style={({ pressed }) => [styles.rubRow, pressed && styles.rubRowPressed]}
          onPress={() => handleGroupPress(item)}
        >
          <View style={[styles.rubDot, { backgroundColor: dotColor }]} />
          <View style={styles.rubInfo}>
            <Text style={styles.rubTitle}>{itemLabel}</Text>
            <View style={[styles.rubChip, { backgroundColor: bgColor }]}>
              <Text style={[styles.rubChipText, { color: dotColor }]}>
                {item.needsRevisionCount > 0
                  ? t('student.revision.itemsNeedRevision', { count: item.needsRevisionCount })
                  : t(`gamification.freshness.${item.worstState}`)}
              </Text>
            </View>
          </View>
          <View style={styles.groupCountBadge}>
            <Text style={styles.groupCountText}>{item.children.length}/{divisor}</Text>
          </View>
          <Ionicons name={chevron} size={16} color={colors.neutral[300]} />
        </Pressable>
      );
    }
    return (
      <RubRow
        cert={item}
        showDaysLeft={section.key === 'attention'}
        chevron={chevron}
        onPress={() => handleCertPress(item)}
        t={t}
      />
    );
  }, [viewMode, chevron, t]);

  if (health.isLoading) return <LoadingState />;
  if (health.error) return <ErrorState description={health.error.message} onRetry={health.refetch} />;

  // Empty state — no certifications at all
  if (health.enriched.length === 0) {
    return (
      <Screen scroll={false}>
        <EmptyState
          icon="pulse-outline"
          title={t('student.revision.noCertifications')}
          description={t('student.revision.noCertificationsDesc')}
        />
      </Screen>
    );
  }

  const { freshCount, fadingCount, warningCount, criticalCount, dormantCountLocal } = (() => {
    const c = health.healthCounts;
    return {
      freshCount: c.fresh ?? 0,
      fadingCount: c.fading ?? 0,
      warningCount: c.warning ?? 0,
      criticalCount: c.critical ?? 0,
      dormantCountLocal: c.dormant ?? 0,
    };
  })();

  const selectedRef = selectedCert ? health.rubReferenceMap.get(selectedCert.rub_number) ?? null : null;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        {/* Title + View Mode */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('student.revision.title')}</Text>
          <View>
            <Pressable
              style={styles.viewModeButton}
              onPress={() => setViewModeOpen((v) => !v)}
            >
              <Text style={styles.viewModeLabel}>
                {t(`student.revision.viewMode.${viewMode}`)}
              </Text>
              <Ionicons
                name={viewModeOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.primary[500]}
              />
            </Pressable>
            {viewModeOpen && (
              <View style={styles.viewModeDropdown}>
                {VIEW_MODES.map((mode) => (
                  <Pressable
                    key={mode}
                    style={[
                      styles.viewModeOption,
                      viewMode === mode && styles.viewModeOptionActive,
                    ]}
                    onPress={() => { setViewMode(mode); setViewModeOpen(false); }}
                  >
                    <Text
                      style={[
                        styles.viewModeOptionText,
                        viewMode === mode && styles.viewModeOptionTextActive,
                      ]}
                    >
                      {t(`student.revision.viewMode.${mode}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Rubʿ Revision Content */}
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            stickySectionHeadersEnabled={false}
            refreshControl={<RefreshControl refreshing={false} onRefresh={health.refetch} />}
            ListHeaderComponent={
              <>
                {/* Health Summary Card */}
                <Card variant="default" style={styles.healthCard}>
                  <View style={styles.healthRow}>
                    <View style={styles.healthLevel}>
                      <Text style={styles.healthLevelNumber}>{health.activeCount}</Text>
                      <Text style={styles.healthLevelTotal}>/240</Text>
                    </View>
                    <View style={styles.healthBreakdown}>
                      {freshCount > 0 && (
                        <HealthLine color={FRESHNESS_DOT_COLORS.fresh} count={freshCount} label={t('gamification.freshness.fresh')} />
                      )}
                      {fadingCount > 0 && (
                        <HealthLine color={FRESHNESS_DOT_COLORS.fading} count={fadingCount} label={t('gamification.freshness.fading')} />
                      )}
                      {warningCount > 0 && (
                        <HealthLine color={FRESHNESS_DOT_COLORS.warning} count={warningCount} label={t('gamification.freshness.warning')} />
                      )}
                      {criticalCount > 0 && (
                        <HealthLine color={FRESHNESS_DOT_COLORS.critical} count={criticalCount} label={t('gamification.freshness.critical')} />
                      )}
                      {dormantCountLocal > 0 && (
                        <HealthLine color={FRESHNESS_DOT_COLORS.dormant} count={dormantCountLocal} label={t('gamification.freshness.dormant')} />
                      )}
                    </View>
                  </View>
                  <ProgressBar
                    progress={health.activeCount / 240}
                    variant={theme.tag}
                    height={6}
                  />
                </Card>

                {/* Revision Warning */}
                <RevisionWarning count={health.effectiveCriticalCount} />

                {/* Revision Homework */}
                {health.homeworkItems.length > 0 && (
                  <Card variant="default" style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <Ionicons name="book-outline" size={18} color={colors.primary[500]} />
                      <Text style={styles.planTitle}>{t('student.revision.plannedItems')}</Text>
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{health.homeworkItems.length}</Text>
                      </View>
                    </View>
                    {health.homeworkItems.map((item) => {
                      const cert = health.enriched.find((c) => c.rub_number === item.rubNumber);
                      const dotColor = cert
                        ? (FRESHNESS_DOT_COLORS[cert.freshness.state] ?? colors.primary[400])
                        : colors.primary[400];

                      return (
                        <View key={item.assignmentId} style={styles.planRow}>
                          <Pressable
                            style={({ pressed }) => [styles.planRowContent, pressed && styles.rubRowPressed]}
                            onPress={() => {
                              if (cert) handleCertPress(cert);
                            }}
                          >
                            <View style={[styles.rubDot, { backgroundColor: dotColor }]} />
                            <Text style={[styles.rubTitle, { flex: 1 }]} numberOfLines={1}>
                              {t('gamification.rub')} {item.rubNumber} {'\u00B7'} {t('gamification.juz')} {item.juz}
                            </Text>
                          </Pressable>
                          <Pressable
                            style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                            onPress={() => handleRemoveHomework(item.assignmentId)}
                            hitSlop={8}
                          >
                            <Ionicons name="close-circle" size={20} color={colors.neutral[300]} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </Card>
                )}

                {/* All-fresh success state */}
                {health.effectiveCriticalCount === 0 && health.enriched.length > 0 && (
                  <Card variant="outlined" style={styles.allFreshCard}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary[500]} />
                    <View style={styles.allFreshText}>
                      <Text style={styles.allFreshTitle}>{t('student.revision.allFresh')}</Text>
                      <Text style={styles.allFreshDesc}>{t('student.revision.allFreshDesc')}</Text>
                    </View>
                  </Card>
                )}
              </>
            }
            renderSectionHeader={({ section }) => {
              const isCollapsed = collapsedSections[section.key] ?? false;
              return (
                <Pressable
                  style={styles.sectionHeaderContainer}
                  onPress={() => toggleSection(section.key)}
                >
                  <Text style={styles.sectionHeader}>{section.title}</Text>
                  <Ionicons
                    name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={16}
                    color={colors.neutral[400]}
                  />
                </Pressable>
              );
            }}
            renderItem={renderItem}
            ListFooterComponent={
              <View style={styles.quickLinks}>
                <Pressable
                  style={[styles.pill, { backgroundColor: colors.accent.violet[50] }]}
                  onPress={() => router.push('/(student)/(tabs)/journey')}
                >
                  <Ionicons name="map" size={16} color={colors.accent.violet[500]} />
                  <Text style={[styles.pillText, { color: colors.accent.violet[600] }]}>
                    {t('student.revision.fullMap')}
                  </Text>
                </Pressable>
              </View>
            }
          />

        {/* Revision Sheet (single rubʿ) */}
        <RevisionSheet
          mode="student"
          visible={sheetVisible}
          certification={selectedCert}
          reference={selectedRef}
          canSelfAssign={health.canSelfAssign}
          alreadyInPlan={selectedCert ? health.isAlreadyInPlan(selectedCert) : false}
          isAddingToPlan={health.isAddingToPlan}
          onAddToPlan={handleAddToPlan}
          onClose={() => {
            setSheetVisible(false);
            setSelectedCert(null);
          }}
        />

        {/* Group Revision Sheet (hizb/juz) */}
        <GroupRevisionSheet
          group={selectedGroup}
          viewMode={viewMode}
          canSelfAssign={health.canSelfAssign}
          isAdding={health.isAddingToPlan}
          isAlreadyInPlan={health.isAlreadyInPlan}
          onAddToPlan={handleGroupAddToPlan}
          onClose={() => setSelectedGroup(null)}
        />
      </View>
    </Screen>
  );
}
