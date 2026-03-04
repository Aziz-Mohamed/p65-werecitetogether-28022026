import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FlashList } from '@shopify/flash-list';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { useLocalizedField } from '../utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { ProgramTrack } from '../types/programs.types';

interface TrackListProps {
  tracks: ProgramTrack[];
}

export function TrackList({ tracks }: TrackListProps) {
  const { t } = useTranslation();
  const localize = useLocalizedField();

  if (tracks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('programs.labels.tracks')}
      </Text>
      <FlashList
        data={tracks}
        keyExtractor={(item) => item.id}
        estimatedItemSize={80}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Card variant="outlined" style={styles.card}>
            <View style={styles.row}>
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
            </View>
            {(item.description || item.description_ar) && (
              <Text style={styles.trackDescription} numberOfLines={2}>
                {localize(item.description, item.description_ar)}
              </Text>
            )}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
  },
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trackName: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
    flex: 1,
  },
  trackDescription: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: normalize(4),
  },
});
