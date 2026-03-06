import React, { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { CertificateView } from '@/features/certifications/components/CertificateView';
import { useCertificationDetail } from '@/features/certifications/hooks/useCertificationDetail';
import type { CertificationWithDetails } from '@/features/certifications/types/certifications.types';

export default function StudentCertificateDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewShotRef = useRef<ViewShot>(null);

  const { data: cert, isLoading, isError, refetch } = useCertificationDetail(id);

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('certifications.student.share'),
      });
    } catch {
      Alert.alert(t('common.error'), t('certifications.student.shareError'));
    }
  };

  if (isLoading) return <Screen><Text style={styles.loading}>{t('common.loading')}</Text></Screen>;
  if (isError || !cert) return <Screen><ErrorState onRetry={refetch} /></Screen>;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
          <CertificateView certification={cert as CertificationWithDetails} />
        </ViewShot>

        <View style={styles.actions}>
          <Button
            title={t('certifications.student.share')}
            onPress={handleShare}
            variant="primary"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.base,
    paddingBottom: spacing['3xl'],
  },
  loading: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
  actions: {
    marginTop: spacing.xl,
  },
});
