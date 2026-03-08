import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { JuzRow } from './JuzRow';
import { CertificationDialog } from './CertificationDialog';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useRubReference } from '../hooks/useRubReference';
import { useRubCertifications } from '../hooks/useRubCertifications';
import { LoadingState, ErrorState } from '@/components/feedback';
import type {
  RubProgressItem,
  RubReference,
  EnrichedCertification,
} from '../types/gamification.types';
import { colors, secondary } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

interface RubProgressMapProps {
  studentId: string;
  mode: 'interactive' | 'readonly';
  onCertify?: (rubNumber: number) => void;
  onCertifiedRubPress?: (certification: EnrichedCertification) => void;
  onJuzAction?: (juzNumber: number, action: 'good' | 'poor') => void;
}

interface JuzGroup {
  juzNumber: number;
  items: RubProgressItem[];
}

export function RubProgressMap({
  studentId,
  mode,
  onCertify,
  onCertifiedRubPress,
  onJuzAction,
}: RubProgressMapProps) {
  const { t } = useTranslation();
  const { data: rubReference = [], isLoading: refLoading, error: refError } = useRubReference();
  const {
    enriched,
    certMap,
    activeCount,
    criticalCount,
    isLoading: certLoading,
    error: certError,
    refetch,
  } = useRubCertifications(studentId);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedRef, setSelectedRef] = useState<RubReference | null>(null);

  // Group 240 rubʿ into 30 juz groups
  const juzGroups = useMemo((): JuzGroup[] => {
    if (rubReference.length === 0) return [];

    const groups = new Map<number, RubProgressItem[]>();
    for (const ref of rubReference) {
      const cert = certMap.get(ref.rub_number) ?? null;
      const state = cert ? cert.freshness.state : 'uncertified' as const;
      const item: RubProgressItem = { reference: ref, certification: cert, state };

      const existing = groups.get(ref.juz_number);
      if (existing) {
        existing.push(item);
      } else {
        groups.set(ref.juz_number, [item]);
      }
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => a - b)
      .map(([juzNumber, items]) => ({ juzNumber, items }));
  }, [rubReference, certMap]);

  const handleRubPress = useCallback(
    (item: RubProgressItem) => {
      if (mode === 'readonly') return;

      if (item.certification) {
        // Certified rubʿ — delegate to revision handler (US2)
        onCertifiedRubPress?.(item.certification);
      } else {
        // Uncertified rubʿ — show certification dialog
        setSelectedRef(item.reference);
        setDialogVisible(true);
      }
    },
    [mode, onCertifiedRubPress],
  );

  const handleConfirmCertify = useCallback(() => {
    if (selectedRef) {
      onCertify?.(selectedRef.rub_number);
    }
    setDialogVisible(false);
    setSelectedRef(null);
  }, [selectedRef, onCertify]);

  const handleCancelCertify = useCallback(() => {
    setDialogVisible(false);
    setSelectedRef(null);
  }, []);

  if (refLoading || certLoading) return <LoadingState />;
  if (refError || certError) {
    return (
      <ErrorState
        description={(refError as Error)?.message ?? (certError as Error)?.message ?? ''}
        onRetry={refetch}
      />
    );
  }

  const level = activeCount;
  const progress = 240 > 0 ? level / 240 : 0;

  return (
    <View style={styles.container}>
      {/* Level Header */}
      <View style={styles.levelHeader}>
        <Text style={styles.levelText}>
          {t('gamification.levelLabel', { level, total: 240 })}
        </Text>
        <ProgressBar progress={progress} variant="primary" height={8} />
        <Text style={styles.levelSub}>
          {t('gamification.rubCertified', { count: level })}
        </Text>
      </View>

      {/* Revision Warning */}
      {criticalCount > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            {t('gamification.revisionWarning', { count: criticalCount })}
          </Text>
        </View>
      )}

      {/* Juz List */}
      <FlashList
        data={juzGroups}
        keyExtractor={(item) => String(item.juzNumber)}
        renderItem={({ item }) => (
          <JuzRow
            juzNumber={item.juzNumber}
            items={item.items}
            onRubPress={mode === 'interactive' ? handleRubPress : undefined}
            onJuzAction={mode === 'interactive' ? onJuzAction : undefined}
          />
        )}
        ItemSeparatorComponent={JuzSeparator}
      />

      {/* Certification Dialog */}
      <CertificationDialog
        visible={dialogVisible}
        rubReference={selectedRef}
        onConfirm={handleConfirmCertify}
        onCancel={handleCancelCertify}
      />
    </View>
  );
}

function JuzSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  levelHeader: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  levelText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(20),
    color: colors.neutral[900],
  },
  levelSub: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.neutral[500],
  },
  warningBanner: {
    backgroundColor: secondary[100],
    borderRadius: normalize(8),
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.base,
    marginBottom: spacing.md,
  },
  warningText: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(13),
    color: secondary[800],
  },
  separator: {
    height: spacing.sm,
  },
});
