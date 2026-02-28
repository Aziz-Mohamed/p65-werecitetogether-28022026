import React from 'react';
import { StyleSheet, View, Text, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { usePrograms } from '@/features/programs/hooks/usePrograms';
import { useLocaleStore } from '@/stores/localeStore';
import { typography } from '@/theme/typography';
import { lightTheme, primary, accent, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
import type { ProgramCategory } from '@/types/common.types';

const CATEGORY_COLORS: Record<ProgramCategory, string> = {
  free: accent.emerald[500],
  structured: accent.indigo[500],
  mixed: accent.violet[500],
};

export default function ProgramListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useLocaleStore((s) => s.locale);
  const isArabic = locale === 'ar';
  const { data: programs = [], isLoading } = usePrograms();

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={lightTheme.text} />
          </Pressable>
          <Text style={styles.title}>
            {t('dashboard.masterAdmin.programs')}
          </Text>
          <Badge label={String(programs.length)} variant="default" />
        </View>

        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const name = isArabic ? item.name_ar : item.name;
            const category = item.category as ProgramCategory;

            return (
              <Card
                variant="default"
                onPress={() => router.push(`/(master-admin)/programs/${item.id}`)}
                style={styles.programCard}
              >
                <View style={styles.programRow}>
                  <View style={styles.programInfo}>
                    <Text style={styles.programName} numberOfLines={1}>
                      {name}
                    </Text>
                    <View style={styles.programMeta}>
                      <View
                        style={[
                          styles.categoryBadge,
                          {
                            backgroundColor:
                              (CATEGORY_COLORS[category] ?? primary[500]) + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            {
                              color: CATEGORY_COLORS[category] ?? primary[500],
                            },
                          ]}
                        >
                          {t(`programs.category.${category}`)}
                        </Text>
                      </View>
                      {!item.is_active && (
                        <Badge label={t('common.inactive')} variant="warning" size="sm" />
                      )}
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={neutral[300]}
                  />
                </View>
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* Create Program FAB */}
        <Pressable
          style={styles.fab}
          onPress={() => {
            // TODO: navigate to create program form
          }}
          accessibilityLabel={t('common.create')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
  },
  list: {
    paddingInline: spacing.lg,
    paddingBlockEnd: spacing['4xl'],
  },
  separator: {
    height: spacing.sm,
  },
  programCard: {
    padding: spacing.base,
  },
  programRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  programInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryBadge: {
    paddingBlock: 2,
    paddingInline: spacing.sm,
    borderRadius: radius.full,
  },
  categoryText: {
    ...typography.textStyles.label,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: normalize(56),
    height: normalize(56),
    borderRadius: normalize(28),
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
  },
});
