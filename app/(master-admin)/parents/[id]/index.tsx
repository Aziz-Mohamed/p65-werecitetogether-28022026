import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useParentById } from '@/features/parents/hooks/useParents';
import { useLocalizedName } from '@/hooks/useLocalizedName';
import { typography } from '@/theme/typography';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

// ─── Parent Detail Screen ───────────────────────────────────────────────────

export default function ParentDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { resolveName } = useLocalizedName();
  const { data: parent, isLoading, error, refetch } = useParentById(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!parent) return <ErrorState description={t('admin.parents.notFound')} />;

  const children = (parent as any).students ?? [];

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Button
          title={t('common.back')}
          onPress={() => router.back()}
          variant="ghost"
          size="sm"
        />

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons name="people" size={40} color={colors.accent.rose[500]} />
          </View>
          <Text style={styles.name}>{resolveName(parent.name_localized, parent.full_name)}</Text>
          <Text style={styles.username}>@{parent.username ?? '—'}</Text>
        </View>

        {/* Info */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('admin.parents.linkedChildren')}</Text>
            <Text style={styles.infoValue}>{children.length}</Text>
          </View>
          {parent.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('common.phone')}</Text>
              <Text style={styles.infoValue}>{parent.phone}</Text>
            </View>
          )}
        </Card>

        {/* Linked Children */}
        {children.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>{t('admin.parents.linkedChildren')}</Text>
            {children.map((child: any) => (
              <Card
                key={child.id}
                variant="outlined"
                style={styles.childCard}
                onPress={() => router.push(`/(master-admin)/students/${child.id}`)}
              >
                <View style={styles.childRow}>
                  <Text style={styles.childName}>
                    {resolveName(child.profiles?.name_localized, child.profiles?.full_name) ?? '—'}
                  </Text>
                  <Badge
                    label={child.is_active ? t('common.active') : t('common.inactive')}
                    variant={child.is_active ? 'success' : 'warning'}
                    size="sm"
                  />
                </View>
              </Card>
            ))}
          </>
        ) : (
          <Card variant="outlined" style={styles.emptyCard}>
            <Text style={styles.emptyText}>{t('admin.parents.noChildren')}</Text>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title={t('common.edit')}
            onPress={() => router.push(`/(master-admin)/parents/${id}/edit`)}
            variant="secondary"
            size="md"
            icon={<Ionicons name="create-outline" size={18} color={colors.primary[500]} />}
            style={styles.actionButton}
          />
        </View>
      </View>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  avatar: {
    width: normalize(72),
    height: normalize(72),
    borderRadius: normalize(36),
    backgroundColor: colors.accent.rose[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  username: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  infoCard: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  infoValue: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    fontFamily: typography.fontFamily.medium,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    marginTop: spacing.sm,
  },
  childCard: {
    marginBottom: spacing.xs,
  },
  childRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
