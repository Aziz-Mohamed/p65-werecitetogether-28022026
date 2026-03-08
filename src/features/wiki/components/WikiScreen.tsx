import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { PageHeader } from '@/components/layout/PageHeader';
import type { WikiRole } from '../types/wiki.types';
import { wikiContentByRole } from '../data/wiki-content';
import { WikiSectionCard } from './WikiSectionCard';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Props ───────────────────────────────────────────────────────────────────

interface WikiScreenProps {
  role: WikiRole;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function WikiScreen({ role }: WikiScreenProps) {
  const { t } = useTranslation();
  const config = wikiContentByRole[role];
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const handleToggleSection = useCallback((sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? null : sectionId));
  }, []);

  return (
    <Screen scroll>
      <View style={styles.container}>
        <PageHeader title={t(config.pageTitleKey)} />

        <Text style={styles.intro}>{t(config.introKey)}</Text>

        <View style={styles.sections}>
          {config.sections.map((section) => (
            <WikiSectionCard
              key={section.id}
              section={section}
              isExpanded={expandedSection === section.id}
              onToggle={handleToggleSection}
            />
          ))}
        </View>
      </View>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  intro: {
    ...typography.textStyles.body,
    color: colors.neutral[600],
    lineHeight: normalize(22),
  },
  sections: {
    gap: spacing.md,
  },
});
