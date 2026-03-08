import React, { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

// Safe require — native modules may not be available (e.g. Expo Go)
let ViewShot: any = null;
let captureRef: any = null;
let Sharing: any = null;
try {
  const viewShotModule = require('react-native-view-shot');
  ViewShot = viewShotModule.default;
  captureRef = viewShotModule.captureRef;
  Sharing = require('expo-sharing');
} catch {
  // Native modules unavailable
}

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
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewShotRef = useRef(null);

  const { data: cert, isLoading, isError, refetch } = useCertificationDetail(id);

  const handleShare = async () => {
    if (!captureRef || !Sharing) {
      Alert.alert(t('common.error'), t('certifications.student.shareError'));
      return;
    }
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

  const certContent = <CertificateView certification={cert as CertificationWithDetails} />;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="arrow-back" size={24} color={lightTheme.text} />
        </Pressable>
        {ViewShot ? (
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }}>
            {certContent}
          </ViewShot>
        ) : (
          certContent
        )}

        <View style={styles.actions}>
          <Button
            title={t('certifications.student.share')}
            onPress={handleShare}
            variant="primary"
            disabled={!ViewShot}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
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
