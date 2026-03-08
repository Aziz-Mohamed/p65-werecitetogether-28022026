import React, { useMemo } from 'react';
import { Pressable, View, Text, SectionList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui';
import { LoadingState, ErrorState } from '@/components/feedback';
import { ProgramCard } from '@/features/programs/components/ProgramCard';
import { EmptyProgramState } from '@/features/programs/components/EmptyProgramState';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { Program, ProgramCategory } from '@/features/programs/types/programs.types';

interface ProgramSection {
  title: string;
  description: string;
  data: Program[];
}

export default function ProgramsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: programs, isLoading, error, refetch } = usePrograms();

  const sections = useMemo((): ProgramSection[] => {
    if (!programs || programs.length === 0) return [];

    const grouped: Record<ProgramCategory, Program[]> = { free: [], structured: [] };
    for (const p of programs) {
      const cat = p.category === 'free' ? 'free' : 'structured';
      grouped[cat].push(p);
    }

    const result: ProgramSection[] = [];
    if (grouped.free.length > 0) {
      result.push({
        title: t('programs.sections.open'),
        description: t('programs.sections.openDescription'),
        data: grouped.free,
      });
    }
    if (grouped.structured.length > 0) {
      result.push({
        title: t('programs.sections.structured'),
        description: t('programs.sections.structuredDescription'),
        data: grouped.structured,
      });
    }
    return result;
  }, [programs, t]);

  if (isLoading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
      >
        <Ionicons name="arrow-back" size={normalize(24)} color={lightTheme.text} />
      </Pressable>
      <View style={styles.header}>
        <Text style={styles.title}>{t('student.tabs.programs')}</Text>
        <Button
          title={t('programs.myPrograms')}
          onPress={() => router.push('/(student)/programs/my-programs')}
          variant="ghost"
          size="sm"
        />
      </View>
      {sections.length === 0 ? (
        <EmptyProgramState />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.base }}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDescription}>{section.description}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <ProgramCard
              program={item}
              onPress={() => router.push(`/(student)/programs/${item.id}`)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  sectionHeader: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: normalize(2),
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  sectionDescription: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
