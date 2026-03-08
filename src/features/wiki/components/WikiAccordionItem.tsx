import React, { useState } from 'react';
import { I18nManager, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
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

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  const chevronName = expanded
    ? 'chevron-down'
    : I18nManager.isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <View style={styles.container}>
      <Pressable onPress={toggle} style={styles.header} accessibilityRole="button">
        <Text style={styles.title} numberOfLines={2}>{t(topic.titleKey)}</Text>
        <Ionicons name={chevronName} size={16} color={colors.neutral[400]} />
      </Pressable>

      {expanded && (
        <View style={styles.content}>
          <Text style={styles.description}>{t(topic.descriptionKey)}</Text>
          {topic.steps && topic.steps.length > 0 && (
            <WikiStepGuide steps={topic.steps} />
          )}
          {topic.tipKey && <WikiTip textKey={topic.tipKey} />}
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
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
  },
  description: {
    ...typography.textStyles.body,
    color: colors.neutral[600],
    lineHeight: normalize(22),
  },
});
