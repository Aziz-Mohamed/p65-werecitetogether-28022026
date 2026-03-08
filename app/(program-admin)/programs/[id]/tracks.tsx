import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { TextField, Button, Badge } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useProgram } from '@/features/programs/hooks/useProgram';
import { useCreateTrack } from '@/features/programs/hooks/useAdminPrograms';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import type { ProgramTrack } from '@/features/programs/types/programs.types';

const trackSchema = z.object({
  name: z.string().min(1),
  name_ar: z.string().min(1),
  description: z.string().optional(),
  description_ar: z.string().optional(),
  sortOrder: z.number().min(0),
});

type TrackFormData = z.infer<typeof trackSchema>;

export default function TrackManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const localize = useLocalizedField();
  const [showForm, setShowForm] = useState(false);

  const { data: program, isLoading, error, refetch } = useProgram(id);
  const createTrack = useCreateTrack();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TrackFormData>({
    resolver: zodResolver(trackSchema),
    defaultValues: { name: '', name_ar: '', description: '', description_ar: '', sortOrder: 0 },
  });

  const onSubmit = async (data: TrackFormData) => {
    if (!id) return;
    const { error: err } = await createTrack.mutateAsync({
      programId: id,
      name: data.name,
      name_ar: data.name_ar,
      description: data.description || undefined,
      description_ar: data.description_ar || undefined,
      sortOrder: data.sortOrder,
    });

    if (err) {
      Alert.alert(t('common.error'), err.message);
      return;
    }

    reset();
    setShowForm(false);
  };

  if (isLoading) return <LoadingState />;
  if (error || !program) return <ErrorState onRetry={refetch} />;

  const tracks = program.program_tracks;

  return (
    <Screen scroll>
      <View style={styles.container}>
        <View style={styles.header}>
          <Button title={t('common.back')} onPress={() => router.back()} variant="ghost" size="sm" />
          <Text style={styles.title}>{t('programs.labels.tracks')}</Text>
          <Button
            title={t('common.add')}
            onPress={() => setShowForm(!showForm)}
            variant="primary"
            size="sm"
          />
        </View>

        {showForm && (
          <Card variant="outlined" style={styles.form}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label={t('programs.labels.trackName')}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="name_ar"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label={t('programs.labels.trackNameAr')}
                  value={value}
                  onChangeText={onChange}
                  error={errors.name_ar?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="sortOrder"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label={t('programs.labels.sortOrder')}
                  value={String(value)}
                  onChangeText={(v) => onChange(Number(v) || 0)}
                  keyboardType="numeric"
                />
              )}
            />
            <Button
              title={t('common.save')}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              loading={createTrack.isPending}
            />
          </Card>
        )}

        {tracks.length === 0 ? (
          <EmptyState
            icon="list-outline"
            title={t('programs.labels.noTracks')}
          />
        ) : (
          <FlashList
            data={tracks}
            keyExtractor={(item) => item.id}
            estimatedItemSize={70}
            scrollEnabled={false}
            renderItem={({ item }: { item: ProgramTrack }) => (
              <Card variant="outlined" style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.trackName} numberOfLines={1}>
                    {localize(item.name, item.name_ar)}
                  </Text>
                  {item.track_type && (
                    <Badge
                      label={t(`programs.category.${item.track_type}`)}
                      variant={item.track_type === 'free' ? 'success' : 'info'}
                      size="sm"
                    />
                  )}
                  <Badge
                    label={item.is_active ? t('common.active') : t('common.inactive')}
                    variant={item.is_active ? 'success' : 'warning'}
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
  form: {
    gap: spacing.md,
    padding: spacing.base,
  },
  card: {
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trackName: {
    ...typography.textStyles.body,
    fontFamily: typography.fontFamily.semiBold,
    color: lightTheme.text,
    flex: 1,
  },
});
