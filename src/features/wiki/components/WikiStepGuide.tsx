import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { WikiStep } from '../types/wiki.types';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Props ───────────────────────────────────────────────────────────────────

interface WikiStepGuideProps {
  steps: WikiStep[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WikiStepGuide({ steps }: WikiStepGuideProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;

        return (
          <View key={step.textKey} style={styles.stepRow}>
            {/* Number circle + connecting line */}
            <View style={styles.stepIndicator}>
              <View style={styles.numberCircle}>
                <Text style={styles.numberText}>{index + 1}</Text>
              </View>
              {!isLast && <View style={styles.connectingLine} />}
            </View>

            {/* Step text */}
            <View style={[styles.stepContent, !isLast && styles.stepContentSpacing]}>
              <Text style={styles.stepText}>{t(step.textKey)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CIRCLE_SIZE = normalize(28);

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepIndicator: {
    alignItems: 'center',
    width: CIRCLE_SIZE,
    marginEnd: spacing.md,
  },
  numberCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(13),
    color: colors.white,
  },
  connectingLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.primary[100],
    minHeight: spacing.md,
  },
  stepContent: {
    flex: 1,
    paddingTop: normalize(4),
  },
  stepContentSpacing: {
    paddingBottom: spacing.md,
  },
  stepText: {
    ...typography.textStyles.body,
    color: colors.neutral[700],
  },
});
