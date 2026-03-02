import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';

import { Screen } from '@/components/layout';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useCertificationRequests } from '@/features/certifications/hooks/useCertificationRequests';
import { CertificationRequestCard } from '@/features/certifications/components/CertificationRequestCard';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function MasterAdminCertificationsScreen() {
  const { t } = useTranslation();

  // Master admin sees certifications across all programs (read-only)
  // TODO: Get programId from context/store — or query all programs
  const programId = undefined as string | undefined;

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useCertificationRequests(programId);

  if (isLoading && programId) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('certifications.title')}</Text>
        </View>

        {!programId || requests.length === 0 ? (
          <EmptyState
            icon="ribbon-outline"
            title={t('certifications.requests.empty')}
            description={t('certifications.requests.emptyDesc')}
          />
        ) : (
          <FlashList
            data={requests}
            keyExtractor={(item) => item.id}

            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <CertificationRequestCard request={item as any} />
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
