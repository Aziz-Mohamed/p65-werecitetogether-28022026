import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { StatusBadge } from './StatusBadge';
import type { CertificationStatus, CertificationType } from '../types/certifications.types';

interface CertificationCardProps {
  id: string;
  studentName: string;
  teacherName?: string;
  programName?: string;
  trackName?: string | null;
  type: CertificationType;
  status: CertificationStatus;
  title: string;
  createdAt: string;
  onPress: () => void;
}

export function CertificationCard({
  studentName,
  teacherName,
  programName,
  trackName,
  type,
  status,
  title,
  createdAt,
  onPress,
}: CertificationCardProps) {
  const { t } = useTranslation();

  const formattedDate = new Date(createdAt).toLocaleDateString();

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <StatusBadge status={status} />
      </View>

      <Text style={styles.studentName} numberOfLines={1}>{studentName}</Text>

      <View style={styles.meta}>
        {teacherName && (
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={14} color={lightTheme.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>{teacherName}</Text>
          </View>
        )}
        {programName && (
          <View style={styles.metaRow}>
            <Ionicons name="book-outline" size={14} color={lightTheme.textSecondary} />
            <Text style={styles.metaText} numberOfLines={1}>
              {programName}{trackName ? ` - ${trackName}` : ''}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Badge label={t(`certifications.types.${type}`)} />
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
    </Pressable>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.typeBadge}>
      <Text style={styles.typeBadgeText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: lightTheme.card,
    borderRadius: 12,
    padding: spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: lightTheme.border,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.textStyles.subheading,
    color: lightTheme.text,
    flex: 1,
  },
  studentName: {
    ...typography.textStyles.body,
    color: lightTheme.text,
    marginBottom: spacing.sm,
  },
  meta: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
  typeBadge: {
    backgroundColor: lightTheme.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    ...typography.textStyles.caption,
    color: lightTheme.textSecondary,
  },
});
