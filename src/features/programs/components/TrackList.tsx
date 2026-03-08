import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui';
import { useLocalizedField, buildTrackTree } from '../utils/enrollment-helpers';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { ProgramTrack, ProgramTrackNode } from '../types/programs.types';

interface TrackListProps {
  tracks: ProgramTrack[];
}

function TrackItem({ node, depth = 0 }: { node: ProgramTrackNode; depth?: number }) {
  const { t } = useTranslation();
  const localize = useLocalizedField();
  const isParent = node.children.length > 0;

  return (
    <View style={depth > 0 ? styles.childContainer : undefined}>
      <Card variant="outlined" style={styles.card}>
        <View style={styles.row}>
          <Text style={[styles.trackName, isParent && styles.parentTrackName]} numberOfLines={1}>
            {localize(node.name, node.name_ar)}
          </Text>
          {node.track_type && (
            <Badge
              label={t(`programs.category.${node.track_type}`)}
              variant={node.track_type === 'free' ? 'success' : 'info'}
              size="sm"
            />
          )}
        </View>
        {(node.description || node.description_ar) && (
          <Text style={styles.trackDescription} numberOfLines={2}>
            {localize(node.description, node.description_ar)}
          </Text>
        )}
      </Card>
      {node.children.map((child) => (
        <TrackItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </View>
  );
}

export function TrackList({ tracks }: TrackListProps) {
  const { t } = useTranslation();

  const tree = useMemo(() => buildTrackTree(tracks), [tracks]);

  if (tracks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('programs.labels.tracks')}
      </Text>
      {tree.map((node) => (
        <TrackItem key={node.id} node={node} />
      ))}
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
  parentTrackName: {
    fontFamily: typography.fontFamily.semiBold,
  },
  trackDescription: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    marginTop: normalize(4),
  },
  childContainer: {
    paddingStart: spacing.lg,
  },
});
