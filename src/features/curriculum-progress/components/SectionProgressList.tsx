import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import type { CurriculumProgress } from '../types/curriculum-progress.types';
import { typography } from '@/theme/typography';
import { lightTheme, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

const STATUS_ICONS: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  not_started: { name: 'ellipse-outline', color: neutral[300] },
  in_progress: { name: 'time-outline', color: '#f59e0b' },
  memorized: { name: 'checkmark-circle', color: '#22c55e' },
  certified: { name: 'ribbon', color: '#8b5cf6' },
  passed: { name: 'checkmark-circle', color: '#22c55e' },
  failed: { name: 'close-circle', color: '#ef4444' },
};

interface SectionProgressListProps {
  sections: CurriculumProgress[];
  onSectionPress?: (section: CurriculumProgress) => void;
}

export function SectionProgressList({ sections, onSectionPress }: SectionProgressListProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <View style={styles.container}>
      {sections.map((section) => {
        const statusConfig = STATUS_ICONS[section.status] ?? STATUS_ICONS.not_started;

        return (
          <View
            key={section.id}
            style={styles.row}
            onTouchEnd={() => onSectionPress?.(section)}
          >
            <Ionicons name={statusConfig.name} size={20} color={statusConfig.color} />
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {section.section_number}. {section.section_title}
              </Text>
              <View style={styles.meta}>
                <Text style={styles.status}>
                  {t(`curriculumProgress.status.${section.status}`)}
                </Text>
                {section.score != null && (
                  <Text style={styles.score}>{section.score}</Text>
                )}
                {section.last_reviewed_at && (
                  <Text style={styles.date}>
                    {new Date(section.last_reviewed_at).toLocaleDateString(
                      isAr ? 'ar-SA' : 'en-US',
                      { month: 'short', day: 'numeric' },
                    )}
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  info: { flex: 1 },
  title: { ...typography.textStyles.body, color: lightTheme.text },
  meta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  status: { ...typography.textStyles.caption, color: neutral[500] },
  score: { ...typography.textStyles.caption, color: lightTheme.primary },
  date: { ...typography.textStyles.caption, color: neutral[400] },
});
