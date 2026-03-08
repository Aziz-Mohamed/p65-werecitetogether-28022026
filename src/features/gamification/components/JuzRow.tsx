import React, { useCallback, useState } from 'react';
import { Alert, I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { RubBlock } from './RubBlock';
import type { RubProgressItem } from '../types/gamification.types';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { shadows } from '@/theme/shadows';
import { normalize } from '@/theme/normalize';

interface JuzRowProps {
  juzNumber: number;
  items: RubProgressItem[];
  onRubPress?: (item: RubProgressItem) => void;
  onJuzAction?: (juzNumber: number, action: 'good' | 'poor') => void;
}

export function JuzRow({ juzNumber, items, onRubPress, onJuzAction }: JuzRowProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const expandAnim = useSharedValue(0);

  const certifiedCount = items.filter((i) => i.state !== 'uncertified').length;
  const certifiedNonDormant = items.filter(
    (i) => i.state !== 'uncertified' && i.state !== 'dormant',
  ).length;
  const total = items.length;
  const progress = total > 0 ? certifiedCount / total : 0;

  const hideContent = useCallback(() => setShowContent(false), []);

  const handleBatchAction = useCallback(() => {
    if (!onJuzAction || certifiedNonDormant === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      `${t('gamification.juz')} ${juzNumber}`,
      t('gamification.revision.batchConfirm', { count: certifiedNonDormant, juz: juzNumber, action: '' }),
      [
        {
          text: t('gamification.revision.markJuzGood'),
          onPress: () => onJuzAction(juzNumber, 'good'),
        },
        {
          text: t('gamification.revision.markJuzPoor'),
          onPress: () => onJuzAction(juzNumber, 'poor'),
          style: 'destructive',
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  }, [onJuzAction, certifiedNonDormant, juzNumber, t]);

  const toggleExpanded = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !expanded;
    setExpanded(next);
    if (next) {
      setShowContent(true);
      expandAnim.value = withTiming(1, { duration: 250 });
    } else {
      expandAnim.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(hideContent)();
      });
    }
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: expandAnim.value,
    maxHeight: expandAnim.value * 300,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expandAnim.value * 90}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleExpanded} style={styles.header} accessibilityRole="button">
        <View style={styles.headerStart}>
          <View style={styles.juzBadge}>
            <Text style={styles.juzNumber}>{juzNumber}</Text>
          </View>
          <View style={styles.juzInfo}>
            <Text style={styles.juzLabel}>
              {t('gamification.juz')} {juzNumber}
            </Text>
            <Text style={styles.juzCount}>
              {certifiedCount}/{total}
            </Text>
          </View>
        </View>
        <View style={styles.headerEnd}>
          <View style={styles.miniBar}>
            <View style={[styles.miniBarFill, { width: `${progress * 100}%` }]} />
          </View>
          {onJuzAction && certifiedNonDormant > 0 && (
            <Pressable
              onPress={handleBatchAction}
              hitSlop={8}
              style={styles.batchActionButton}
            >
              <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.primary[500]} />
            </Pressable>
          )}
          <Animated.View style={chevronStyle}>
            <Ionicons name={I18nManager.isRTL ? "chevron-back" : "chevron-forward"} size={18} color={colors.neutral[400]} />
          </Animated.View>
        </View>
      </Pressable>

      {showContent && (
        <Animated.View style={[styles.rubGrid, contentStyle]}>
          {items.map((item) => (
            <RubBlock
              key={item.reference.rub_number}
              rubNumber={item.reference.rub_number}
              state={item.state}
              onPress={onRubPress ? () => onRubPress(item) : undefined}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerStart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  juzBadge: {
    width: normalize(32),
    height: normalize(32),
    borderRadius: normalize(16),
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  juzNumber: {
    fontFamily: typography.fontFamily.bold,
    fontSize: normalize(13),
    color: colors.primary[700],
  },
  juzInfo: {
    gap: normalize(2),
  },
  juzLabel: {
    fontFamily: typography.fontFamily.semiBold,
    fontSize: normalize(14),
    color: colors.neutral[800],
  },
  juzCount: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.neutral[500],
  },
  headerEnd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniBar: {
    width: normalize(48),
    height: normalize(6),
    borderRadius: normalize(3),
    backgroundColor: colors.neutral[100],
    overflow: 'hidden',
  },
  miniBarFill: {
    height: '100%',
    borderRadius: normalize(3),
    backgroundColor: colors.primary[500],
  },
  batchActionButton: {
    padding: normalize(2),
  },
  rubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
});
