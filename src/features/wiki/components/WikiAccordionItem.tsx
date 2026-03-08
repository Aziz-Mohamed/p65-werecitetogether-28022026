import React, { useCallback, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import type { WikiTopic } from '../types/wiki.types';
import { WikiStepGuide } from './WikiStepGuide';
import { WikiTip } from './WikiTip';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Props ───────────────────────────────────────────────────────────────────

interface WikiAccordionItemProps {
  topic: WikiTopic;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WikiAccordionItem({ topic }: WikiAccordionItemProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const expandAnim = useSharedValue(0);

  const hideContent = useCallback(() => setShowContent(false), []);

  const toggle = () => {
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
    maxHeight: expandAnim.value * 600,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expandAnim.value * 90}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Pressable onPress={toggle} style={styles.header} accessibilityRole="button">
        <Text style={styles.title} numberOfLines={2}>{t(topic.titleKey)}</Text>
        <Animated.View style={chevronStyle}>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={16}
            color={colors.neutral[400]}
          />
        </Animated.View>
      </Pressable>

      {showContent && (
        <Animated.View style={[styles.content, contentStyle]}>
          <Text style={styles.description}>{t(topic.descriptionKey)}</Text>
          {topic.steps && topic.steps.length > 0 && (
            <WikiStepGuide steps={topic.steps} />
          )}
          {topic.tipKey && <WikiTip textKey={topic.tipKey} />}
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[800],
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  description: {
    ...typography.textStyles.body,
    color: colors.neutral[600],
    lineHeight: normalize(22),
  },
});
