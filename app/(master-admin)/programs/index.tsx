import React from 'react';
import { I18nManager, Pressable, StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAllPrograms } from '@/features/programs/hooks/useAdminPrograms';
import { useMasterAdminDashboard } from '@/features/admin/hooks/useMasterAdminDashboard';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { Program } from '@/features/programs/types/programs.types';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  structured: 'layers-outline',
  free: 'sparkles-outline',
  mixed: 'shuffle-outline',
};

const CATEGORY_COLOR: Record<string, string> = {
  structured: colors.accent.indigo[500],
  free: colors.primary[500],
  mixed: colors.accent.violet[500],
};

export default function MasterAdminProgramsList() {
  const { t } = useTranslation();
  const router = useRouter();
  const localize = useLocalizedField();
  const { data: programs = [], isLoading, error, refetch } = useAllPrograms();
  const dashboard = useMasterAdminDashboard();

  const statsMap = new Map(
    (dashboard.data?.programs ?? []).map((p) => [p.program_id, p]),
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={8}>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={lightTheme.text}
            />
          </Pressable>
          <Text style={styles.title}>{t('programs.admin.programs')}</Text>
          <Pressable
            style={styles.headerButton}
            onPress={() => router.push('/(master-admin)/programs/create')}
            hitSlop={8}
          >
            <Ionicons name="add" size={24} color={lightTheme.text} />
          </Pressable>
        </View>

        {programs.length === 0 ? (
          <EmptyState
            icon="library-outline"
            title={t('programs.empty.programs')}
          />
        ) : (
          <FlashList
            data={programs}
            keyExtractor={(item) => item.id}
            estimatedItemSize={100}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }: { item: Program }) => {
              const iconName = CATEGORY_ICON[item.category] ?? 'library-outline';
              const iconColor = CATEGORY_COLOR[item.category] ?? colors.primary[500];
              const stats = statsMap.get(item.id);

              return (
                <Card
                  variant="default"
                  style={styles.card}
                  onPress={() => router.push(`/(master-admin)/programs/${item.id}`)}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.iconCircle, { backgroundColor: iconColor + '15' }]}>
                      <Ionicons name={iconName} size={20} color={iconColor} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={styles.programName} numberOfLines={1}>
                        {localize(item.name, item.name_ar)}
                      </Text>
                      <Text style={styles.metaText} numberOfLines={1}>
                        {t(`programs.category.${item.category}`)}
                        {!item.is_active && (
                          `  ·  ${t('common.inactive')}`
                        )}
                      </Text>
                      {stats && (
                        <Text style={styles.statsText} numberOfLines={1}>
                          {stats.enrolled_count} {t('programs.labels.enrolled')}  ·  {stats.session_count} {t('programs.labels.sessions')}
                        </Text>
                      )}
                    </View>
                    <Ionicons
                      name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                      size={18}
                      color={colors.neutral[300]}
                    />
                  </View>
                </Card>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  headerButton: {
    width: normalize(38),
    height: normalize(38),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    fontSize: normalize(22),
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  card: {
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: normalize(3),
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    fontSize: normalize(15),
  },
  metaText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
    color: colors.neutral[400],
    textTransform: 'capitalize',
  },
  statsText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(12),
    color: colors.neutral[400],
  },
  separator: {
    height: spacing.sm,
  },
});
