import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/layout';
import { LoadingState, ErrorState } from '@/components/feedback';
import { useCertificationDetail } from '@/features/certifications/hooks/useCertifications';
import { CertificateDetail } from '@/features/certifications/components/CertificateDetail';

const PROJECT_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export default function CertificateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: certification, isLoading, error, refetch } = useCertificationDetail(id);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState description={(error as Error).message} onRetry={refetch} />;
  if (!certification) return null;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <CertificateDetail
          certification={certification as any}
          projectUrl={PROJECT_URL}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
});
