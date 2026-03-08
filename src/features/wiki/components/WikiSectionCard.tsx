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

import type { WikiSection } from '../types/wiki.types';
import { WikiAccordionItem } from './WikiAccordionItem';
import { Card } from '@/components/ui/Card';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Props ───────────────────────────────────────────────────────────────────

interface WikiSectionCardProps {
  section: WikiSection;
  isExpanded: boolean;
  onToggle: (sectionId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WikiSectionCard({ section, isExpanded, onToggle }: WikiSectionCardProps) {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState(isExpanded);
  const expandAnim = useSharedValue(isExpanded ? 1 : 0);

  const hideContent = useCallback(() => setShowContent(false), []);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = !isExpanded;
    onToggle(section.id);

    if (next) {
      setShowContent(true);
      expandAnim.value = withTiming(1, { duration: 300 });
    } else {
      expandAnim.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(hideContent)();
      });
    }
  };

  // Sync external state changes (when another section opens and closes this one)
  React.useEffect(() => {
    if (!isExpanded && showContent) {
      expandAnim.value = withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(hideContent)();
      });
    }
  }, [isExpanded]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: expandAnim.value,
    maxHeight: expandAnim.value * 2000,
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${expandAnim.value * 90}deg` }],
  }));

  return (
    <Card variant="glass" style={styles.card}>
      <Pressable onPress={handleToggle} style={styles.header} accessibilityRole="button">
        <View style={[styles.iconContainer, { backgroundColor: section.color + '15' }]}>
          <Ionicons
            name={section.icon}
            size={20}
            color={section.color}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t(section.titleKey)}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{t(section.subtitleKey)}</Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={18}
            color={colors.neutral[400]}
          />
        </Animated.View>
      </Pressable>

      {showContent && (
        <Animated.View style={[styles.content, contentStyle]}>
          {section.topics.map((topic) => (
            <WikiAccordionItem key={topic.id} topic={topic} />
          ))}
        </Animated.View>
      )}
    </Card>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconContainer: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    gap: normalize(2),
  },
  title: {
    ...typography.textStyles.bodyMedium,
    color: colors.neutral[900],
  },
  subtitle: {
    ...typography.textStyles.caption,
    color: colors.neutral[500],
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
});
