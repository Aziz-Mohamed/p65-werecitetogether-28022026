import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/feedback';
import { supabase } from '@/lib/supabase';
import { typography } from '@/theme/typography';
import { lightTheme, neutral, primary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

function usePlatformConfig() {
  return useQuery({
    queryKey: ['platform-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_config')
        .select('*')
        .limit(1)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
  });
}

export default function MasterAdminSettingsScreen() {
  const { t } = useTranslation();
  const { data: config, isLoading, error, refetch } = usePlatformConfig();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <Text style={styles.title}>{t('dashboard.masterAdmin.settings')}</Text>

        {/* Platform Name */}
        <Card variant="default" style={styles.configCard}>
          <View style={styles.configRow}>
            <View style={[styles.configIcon, { backgroundColor: primary[50] }]}>
              <Ionicons name="text" size={20} color={primary[500]} />
            </View>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>{t('settings.platformName')}</Text>
              <Text style={styles.configValue}>{config?.name ?? '—'}</Text>
            </View>
          </View>
        </Card>

        {/* Platform Name (Arabic) */}
        <Card variant="default" style={styles.configCard}>
          <View style={styles.configRow}>
            <View style={[styles.configIcon, { backgroundColor: primary[50] }]}>
              <Ionicons name="language" size={20} color={primary[500]} />
            </View>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>{t('settings.platformNameAr')}</Text>
              <Text style={styles.configValue}>{config?.name_ar ?? '—'}</Text>
            </View>
          </View>
        </Card>

        {/* Logo URL */}
        <Card variant="default" style={styles.configCard}>
          <View style={styles.configRow}>
            <View style={[styles.configIcon, { backgroundColor: primary[50] }]}>
              <Ionicons name="image" size={20} color={primary[500]} />
            </View>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>{t('settings.logoUrl')}</Text>
              <Text style={styles.configValue} numberOfLines={1}>
                {config?.logo_url ?? t('common.notSet')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Settings (JSONB) */}
        <Card variant="default" style={styles.configCard}>
          <View style={styles.configRow}>
            <View style={[styles.configIcon, { backgroundColor: primary[50] }]}>
              <Ionicons name="settings" size={20} color={primary[500]} />
            </View>
            <View style={styles.configInfo}>
              <Text style={styles.configLabel}>{t('settings.globalDefaults')}</Text>
              <Text style={styles.configValue}>
                {config?.settings
                  ? JSON.stringify(config.settings, null, 2).slice(0, 100)
                  : t('common.notSet')}
              </Text>
            </View>
          </View>
        </Card>

        {/* Edit placeholder */}
        <View style={styles.placeholder}>
          <Ionicons name="create-outline" size={36} color={neutral[300]} />
          <Text style={styles.placeholderText}>{t('common.comingSoon')}</Text>
        </View>
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
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBlockEnd: spacing.xs,
  },
  configCard: {
    padding: spacing.md,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  configIcon: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  configInfo: {
    flex: 1,
    gap: normalize(2),
  },
  configLabel: {
    ...typography.textStyles.label,
    color: neutral[500],
  },
  configValue: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  placeholder: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingBlock: spacing['2xl'],
  },
  placeholderText: {
    ...typography.textStyles.caption,
    color: neutral[400],
  },
});
