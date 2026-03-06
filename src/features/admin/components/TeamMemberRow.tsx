import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { colors, lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { normalize } from '@/theme/normalize';
import type { ProgramTeamMember } from '../types/admin.types';

type BadgeVariant = 'success' | 'info' | 'warning' | 'default';

const roleBadgeVariant: Record<string, BadgeVariant> = {
  program_admin: 'info',
  supervisor: 'warning',
  teacher: 'success',
};

interface TeamMemberRowProps {
  member: ProgramTeamMember;
  supervisorName?: string;
  onRemove?: () => void;
  onLinkSupervisor?: () => void;
  activeStudentCount?: number;
}

export function TeamMemberRow({
  member,
  supervisorName,
  onRemove,
  onLinkSupervisor,
  activeStudentCount,
}: TeamMemberRowProps) {
  const { t } = useTranslation();

  const handleRemove = () => {
    if (activeStudentCount && activeStudentCount > 0) {
      Alert.alert(
        t('admin.programAdmin.team.removeConfirm', { name: member.profiles?.full_name ?? '' }),
        t('admin.programAdmin.team.removeWarning', { count: activeStudentCount }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.remove'), style: 'destructive', onPress: onRemove },
        ],
      );
    } else {
      onRemove?.();
    }
  };

  return (
    <View style={styles.row}>
      <Avatar
        source={member.profiles?.avatar_url ?? undefined}
        name={member.profiles?.full_name ?? ''}
        size="sm"
      />
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {member.profiles?.full_name ?? '-'}
        </Text>
        {member.role === 'teacher' && supervisorName && (
          <Text style={styles.supervisorLink} numberOfLines={1}>
            → {supervisorName}
          </Text>
        )}
      </View>
      <Badge
        label={member.role.replace('_', ' ')}
        variant={roleBadgeVariant[member.role] ?? 'default'}
        size="sm"
      />
      {member.role === 'teacher' && onLinkSupervisor && (
        <Pressable onPress={onLinkSupervisor} hitSlop={8} accessibilityRole="button">
          <Ionicons name="link-outline" size={normalize(20)} color={colors.accent.indigo} />
        </Pressable>
      )}
      {onRemove && (
        <Pressable onPress={handleRemove} hitSlop={8} accessibilityRole="button">
          <Ionicons name="close-circle-outline" size={normalize(20)} color={lightTheme.error} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: lightTheme.border,
  },
  textContainer: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.textStyles.bodyMedium,
    color: lightTheme.text,
  },
  supervisorLink: {
    ...typography.textStyles.caption,
    color: colors.accent.indigo,
  },
});
