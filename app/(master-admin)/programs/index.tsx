import React from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { CategoryBadge } from '@/features/programs/components/CategoryBadge';
import { useAllPrograms, useUpdateProgram } from '@/features/programs/hooks/useAdminPrograms';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { Program } from '@/features/programs/types/programs.types';

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
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.admin.programs')}</Text>
          <Button
            title={t('common.create')}
            onPress={() => router.push('/(master-admin)/programs/create')}
            variant="primary"
            size="sm"
            icon={<Ionicons name="add" size={18} color={colors.white} />}
          />
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
            estimatedItemSize={90}
            renderItem={({ item }: { item: Program }) => (
              <Card variant="outlined" style={styles.card}>
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <Text style={styles.programName} numberOfLines={1}>
                      {localize(item.name, item.name_ar)}
                    </Text>
                    <CategoryBadge category={item.category} />
                  </View>
                  <Badge
                    label={item.is_active ? t('common.active') : t('common.inactive')}
                    variant={item.is_active ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
                <View style={styles.actions}>
                  <Button
                    title={t('common.edit')}
                    onPress={() => router.push(`/(master-admin)/programs/${item.id}`)}
                    variant="default"
                    size="sm"
                  />
                  <Button
                    title={item.is_active ? t('programs.actions.deactivate') : t('programs.actions.reactivate')}
                    onPress={() => handleToggleActive(item)}
                    variant={item.is_active ? 'danger' : 'primary'}
                    size="sm"
                  />
                </View>
              </Card>
            )}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    flex: 1,
    textAlign: 'center',
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  programName: {
    ...typography.textStyles.body,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
