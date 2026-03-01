import React, { useCallback } from 'react';
import { StyleSheet, View, Text, Switch, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/stores/authStore';
import { notificationsService } from '../services/notifications.service';
import { getCategoriesForRole } from '../config/notification-categories';
import type { CategoryConfig } from '../types/notifications.types';
import type { UserRole } from '@/types/common.types';
import { typography } from '@/theme/typography';
import { lightTheme, primary, neutral } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function NotificationPreferences() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);
  const profileId = profile?.id ?? '';
  const role = (profile?.role ?? 'student') as UserRole;

  const categories = getCategoriesForRole(role);

  const { data: preferences = [] } = useQuery({
    queryKey: ['notification-preferences', profileId],
    queryFn: async () => {
      const result = await notificationsService.getPreferences(profileId);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!profileId,
  });

  const updatePref = useMutation({
    mutationFn: async ({ category, enabled }: { category: string; enabled: boolean }) => {
      const result = await notificationsService.updatePreference(profileId, category, enabled);
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', profileId] });
    },
  });

  const isEnabled = useCallback(
    (categoryId: string) => {
      const pref = preferences.find((p) => p.category === categoryId);
      return pref?.enabled ?? true;
    },
    [preferences],
  );

  const handleToggle = useCallback(
    (categoryId: string, value: boolean) => {
      updatePref.mutate({ category: categoryId, enabled: value });
    },
    [updatePref],
  );

  const renderCategory = ({ item }: { item: CategoryConfig }) => (
    <Card variant="default" style={styles.categoryCard}>
      <View style={styles.categoryRow}>
        <Ionicons name={item.icon as any} size={24} color={primary[500]} />
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryLabel}>{t(item.labelKey)}</Text>
          <Text style={styles.categoryDesc}>{t(item.descriptionKey)}</Text>
        </View>
        <Switch
          value={isEnabled(item.id)}
          onValueChange={(value) => handleToggle(item.id, value)}
          trackColor={{ false: neutral[200], true: primary[200] }}
          thumbColor={isEnabled(item.id) ? primary[500] : neutral[400]}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('notifications.preferences.title')}</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  separator: {
    height: spacing.sm,
  },
  categoryCard: {
    padding: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  categoryInfo: {
    flex: 1,
    gap: 2,
  },
  categoryLabel: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  categoryDesc: {
    ...typography.textStyles.caption,
    color: neutral[500],
  },
});
