import React from 'react';
import { I18nManager, LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
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

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle(section.id);
  };

  const chevronName = isExpanded
    ? 'chevron-down'
    : I18nManager.isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <Card variant="glass" style={styles.card}>
      <Pressable onPress={handleToggle} style={styles.header} accessibilityRole="button">
        <View style={[styles.iconContainer, { backgroundColor: section.color + '15' }]}>
          <Ionicons name={section.icon} size={20} color={section.color} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{t(section.titleKey)}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{t(section.subtitleKey)}</Text>
        </View>
        <Ionicons name={chevronName} size={18} color={colors.neutral[400]} />
      </Pressable>

      {isExpanded && (
        <View style={styles.content}>
          {section.topics.map((topic) => (
            <WikiAccordionItem key={topic.id} topic={topic} />
          ))}
        </View>
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
  },
});
