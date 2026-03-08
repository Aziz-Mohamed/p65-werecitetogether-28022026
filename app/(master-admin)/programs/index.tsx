import React from 'react';
import { I18nManager, Pressable, StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { CategoryBadge } from '@/features/programs/components/CategoryBadge';
import { useAllPrograms, useUpdateProgram } from '@/features/programs/hooks/useAdminPrograms';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { colors, lightTheme } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import { radius } from '@/theme/radius';
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
  const updateProgram = useUpdateProgram();

  const handleToggleActive = (program: Program) => {
    const action = program.is_active ? t('programs.actions.deactivate') : t('programs.actions.reactivate');
    Alert.alert(
      action,
      program.is_active ? t('programs.confirm.deactivateBody') : '',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: action,
          style: program.is_active ? 'destructive' : 'default',
          onPress: () =>
            updateProgram.mutate({
              programId: program.id,
              input: { is_active: !program.is_active },
            }),
        },
      ],
    );
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons
              name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={lightTheme.text}
            />
          </Pressable>
          <Text style={styles.title}>{t('programs.admin.programs')}</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push('/(master-admin)/programs/create')}
          >
            <Ionicons name="add" size={22} color={colors.primary[600]} />
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
            estimatedItemSize={80}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }: { item: Program }) => {
              const iconName = CATEGORY_ICON[item.category] ?? 'library-outline';
              const iconColor = CATEGORY_COLOR[item.category] ?? colors.primary[500];

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
                      <View style={styles.badgeRow}>
                        <CategoryBadge category={item.category} />
                        <View style={[styles.statusDot, { backgroundColor: item.is_active ? colors.primary[500] : colors.neutral[300] }]} />
                        <Text style={[styles.statusText, { color: item.is_active ? colors.primary[600] : colors.neutral[400] }]}>
                          {item.is_active ? t('common.active') : t('common.inactive')}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.toggleButton}
                      onPress={() => handleToggleActive(item)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={item.is_active ? 'pause-circle-outline' : 'play-circle-outline'}
                        size={22}
                        color={item.is_active ? colors.accent.rose[500] : colors.primary[500]}
                      />
                    </Pressable>
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
  backButton: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    fontSize: normalize(22),
  },
  createButton: {
    width: normalize(38),
    height: normalize(38),
    borderRadius: radius.sm,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: normalize(4),
  },
  programName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    fontSize: normalize(16),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
  },
  statusText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: normalize(12),
  },
  toggleButton: {
    padding: spacing.xs,
  },
  separator: {
    height: spacing.sm,
  },
});
