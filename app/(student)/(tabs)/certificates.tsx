import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useAuth } from '@/hooks/useAuth';
import { useCertifications } from '@/features/certifications/hooks/useCertifications';
import { CertificateCard } from '@/features/certifications/components/CertificateCard';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function CertificatesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { profile } = useAuth();

  const {
    data: certifications = [],
    isLoading,
    error,
    refetch,
  } = useCertifications(profile?.id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false} hasTabBar>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('certifications.myCertificates')}</Text>
        </View>

        {certifications.length === 0 ? (
          <EmptyState
            icon="ribbon-outline"
            title={t('certifications.noCertificates')}
            description={t('certifications.noCertificatesDesc')}
          />
        ) : (
          <FlashList
            data={certifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <CertificateCard
                certification={item as any}
                onPress={() => router.push(`/(student)/certificates/${item.id}`)}
              />
            )}
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
  },
  header: {
    paddingBlockStart: spacing.lg,
    paddingBlockEnd: spacing.base,
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
  },
  listContent: {
    paddingBottom: spacing.lg,
  },
  separator: {
    height: spacing.sm,
  },
});
