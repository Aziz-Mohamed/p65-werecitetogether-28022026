import React, { useState } from 'react';
import { StyleSheet, View, Text, Alert, Pressable, Switch, I18nManager } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/layout';
import { Card } from '@/components/ui/Card';
import { TextField, Button } from '@/components/ui';
import { LoadingState, ErrorState, EmptyState } from '@/components/feedback';
import { useProgram } from '@/features/programs/hooks/useProgram';
import { useCreateTrack, useUpdateTrack } from '@/features/programs/hooks/useAdminPrograms';
import { useLocalizedField } from '@/features/programs/utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { ProgramTrack } from '@/features/programs/types/programs.types';

export default function TrackManagementScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const localize = useLocalizedField();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createNameAr, setCreateNameAr] = useState('');
  const [createSort, setCreateSort] = useState('0');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editSort, setEditSort] = useState('0');
  const [editActive, setEditActive] = useState(true);

  const { data: program, isLoading, error, refetch } = useProgram(id);
  const createTrack = useCreateTrack();
  const updateTrack = useUpdateTrack();

  const handleCreate = async () => {
    if (!id || !createName.trim() || !createNameAr.trim()) return;
    const { error: err } = await createTrack.mutateAsync({
      programId: id,
      name: createName.trim(),
      name_ar: createNameAr.trim(),
      sortOrder: Number(createSort) || 0,
    });
    if (err) {
      Alert.alert(t('common.error'), err.message);
      return;
    }
    setCreateName('');
    setCreateNameAr('');
    setCreateSort('0');
    setShowCreate(false);
  };

  const startEdit = (track: ProgramTrack) => {
    setEditingId(track.id);
    setEditName(track.name);
    setEditNameAr(track.name_ar);
    setEditSort(String(track.sort_order));
    setEditActive(track.is_active);
    setShowCreate(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim() || !editNameAr.trim()) return;
    const { error: err } = await updateTrack.mutateAsync({
      trackId: editingId,
      input: {
        name: editName.trim(),
        name_ar: editNameAr.trim(),
        sort_order: Number(editSort) || 0,
        is_active: editActive,
      },
    });
    if (err) {
      Alert.alert(t('common.error'), err.message);
      return;
    }
    setEditingId(null);
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
            onPress={() => { setShowCreate(!showCreate); setEditingId(null); }}
            variant="ghost"
            size="sm"
          />
        </View>

        {showCreate && (
          <Card variant="outlined" style={styles.form}>
            <TextField
              label={t('programs.labels.trackName')}
              value={createName}
              onChangeText={setCreateName}
            />
            <TextField
              label={t('programs.labels.trackNameAr')}
              value={createNameAr}
              onChangeText={setCreateNameAr}
            />
            <TextField
              label={t('programs.labels.sortOrder')}
              value={createSort}
              onChangeText={setCreateSort}
              keyboardType="numeric"
            />
            <View style={styles.formActions}>
              <Button
                title={t('common.cancel')}
                onPress={() => setShowCreate(false)}
                variant="ghost"
                size="sm"
              />
              <Button
                title={t('common.save')}
                onPress={handleCreate}
                variant="primary"
                size="sm"
                loading={createTrack.isPending}
              />
            </View>
          </Card>
        )}

        {tracks.length === 0 ? (
          <EmptyState
            icon="list-outline"
            title={t('programs.labels.noTracks')}
          />
        ) : (
          tracks.map((item) => {
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <Card key={item.id} variant="outlined" style={styles.form}>
                  <TextField
                    label={t('programs.labels.trackName')}
                    value={editName}
                    onChangeText={setEditName}
                  />
                  <TextField
                    label={t('programs.labels.trackNameAr')}
                    value={editNameAr}
                    onChangeText={setEditNameAr}
                  />
                  <TextField
                    label={t('programs.labels.sortOrder')}
                    value={editSort}
                    onChangeText={setEditSort}
                    keyboardType="numeric"
                  />
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>{t('common.active')}</Text>
                    <Switch value={editActive} onValueChange={setEditActive} />
                  </View>
                  <View style={styles.formActions}>
                    <Button
                      title={t('common.cancel')}
                      onPress={() => setEditingId(null)}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      title={t('common.save')}
                      onPress={handleUpdate}
                      variant="primary"
                      size="sm"
                      loading={updateTrack.isPending}
                    />
                  </View>
                </Card>
              );
            }

            const metaParts = [
              item.track_type ? t(`programs.category.${item.track_type}`) : null,
              !item.is_active ? t('common.inactive') : null,
            ].filter(Boolean);

            return (
              <Card key={item.id} variant="default" style={styles.card} onPress={() => startEdit(item)}>
                <View style={styles.cardRow}>
                  <View style={styles.cardContent}>
                    <Text style={[styles.trackName, !item.is_active && styles.inactive]} numberOfLines={1}>
                      {localize(item.name, item.name_ar)}
                    </Text>
                    {metaParts.length > 0 && (
                      <Text style={styles.metaText}>{metaParts.join('  ·  ')}</Text>
                    )}
                  </View>
                  <Ionicons
                    name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                    size={16}
                    color={colors.neutral[300]}
                  />
                </View>
              </Card>
            );
          })
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
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  switchLabel: {
    ...typography.textStyles.body,
    color: lightTheme.text,
  },
  card: {
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  cardContent: {
    flex: 1,
    gap: normalize(3),
  },
  trackName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    fontSize: normalize(15),
  },
  inactive: {
    color: colors.neutral[400],
  },
  metaText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: normalize(12),
    color: colors.neutral[400],
    textTransform: 'capitalize',
  },
});
