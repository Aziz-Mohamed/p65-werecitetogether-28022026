import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Badge } from '@/components/ui';
import { useLocaleStore } from '@/stores/localeStore';
import { typography } from '@/theme/typography';
import { lightTheme, primary, accent } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import type { Program } from '../types';
import type { ProgramCategory } from '@/types/common.types';

interface ProgramCardProps {
  program: Program;
  onPress: () => void;
}

const CATEGORY_COLORS: Record<ProgramCategory, string> = {
  free: accent.emerald[500],
  structured: accent.indigo[500],
  mixed: accent.violet[500],
};

export const ProgramCard: React.FC<ProgramCardProps> = ({ program, onPress }) => {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const isArabic = locale === 'ar';

  const name = isArabic ? program.name_ar : program.name;
  const description = isArabic
    ? program.description_ar
    : program.description;
  const category = program.category as ProgramCategory;

  return (
    <Pressable onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: (CATEGORY_COLORS[category] ?? primary[500]) + '20' },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: CATEGORY_COLORS[category] ?? primary[500] },
              ]}
            >
              {t(`programs.category.${category}`)}
            </Text>
          </View>
        </View>

        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  name: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    flex: 1,
  },
  categoryBadge: {
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    borderRadius: radius.full,
  },
  categoryText: {
    ...typography.textStyles.caption,
    fontFamily: typography.fontFamily.semiBold,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBlockStart: spacing.sm,
  },
});
