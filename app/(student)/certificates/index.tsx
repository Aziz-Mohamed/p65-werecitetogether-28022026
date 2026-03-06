import React from 'react';
import { View, Text, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { lightTheme, colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { StatusBadge } from '@/features/certifications/components/StatusBadge';
import { useStudentCertificates } from '@/features/certifications/hooks/useStudentCertificates';

export default function StudentCertificatesScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const router = useRouter();
  const userId = session?.user?.id;

  const { data, isLoading, isRefetching, isError, refetch } = useStudentCertificates(userId);

  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>{t('certifications.student.title')}</Text>
        <FlashList
          data={data ?? []}
          estimatedItemSize={100}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          renderItem={({ item }) => {
            const program = item.programs as { name: string } | null;
            const track = item.program_tracks as { name: string } | null;
            return (
              <Pressable
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() =>
                  router.push({
                    pathname: '/(student)/certificates/[id]',
                    params: { id: (item as { id: string }).id },
                  })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {(item as { title: string }).title}
                  </Text>
                  <StatusBadge status="issued" />
                </View>
                <Text style={styles.cardProgram} numberOfLines={1}>
                  {program?.name}{track?.name ? ` - ${track.name}` : ''}
                </Text>
                <View style={styles.cardFooter}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {t(`certifications.types.${(item as { type: string }).type}`)}
                    </Text>
                  </View>
                  <Text style={styles.date}>
                    {(item as { issue_date: string }).issue_date
                      ? new Date((item as { issue_date: string }).issue_date).toLocaleDateString()
                      : ''}
                  </Text>
                </View>
                <View style={styles.viewRow}>
                  <Ionicons name="document-text-outline" size={16} color={colors.primary[500]} />
                  <Text style={styles.viewText}>{t('certifications.detail.title')}</Text>
                </View>
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            !isLoading ? (
              isError ? (
                <ErrorState onRetry={refetch} />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="ribbon-outline" size={48} color={lightTheme.textSecondary} />
                  <Text style={styles.emptyText}>{t('certifications.student.empty')}</Text>
                </View>
              )
            ) : null
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.base,
  },
  listContent: {
    paddingHorizontal: spacing.base,
  },
  card: {
    backgroundColor: lightTheme.card,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  pressed: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    flex: 1,
  },
  cardProgram: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    marginBottom: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    backgroundColor: lightTheme.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  date: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  viewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  viewText: {
    ...typography.textStyles.caption,
    color: colors.primary[500],
  },
  separator: {
    height: spacing.sm,
  },
  emptyContainer: {
    padding: spacing['2xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
  },
});
