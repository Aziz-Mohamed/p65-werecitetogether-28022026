import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDevLogin } from '../hooks/useDevLogin';
import { ROLES } from '@/lib/constants';
import { lightTheme, accent, semantic, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import { normalize } from '@/theme/normalize';
import type { UserRole } from '@/types/common.types';

const ROLE_COLORS: Record<UserRole, string> = {
  student: semantic.success,
  teacher: accent.blue[500],
  supervisor: accent.blue[700] ?? accent.blue[500],
  program_admin: accent.violet[700] ?? accent.violet[500],
  master_admin: semantic.error,
};

export const DevRolePills: React.FC = () => {
  const { t } = useTranslation();
  const { signInAsRole, isLoading, activeRole } = useDevLogin();

  if (!__DEV__) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('auth.devLogin')}</Text>
      <View style={styles.pillsContainer}>
        {ROLES.map((role) => {
          const color = ROLE_COLORS[role];
          const isActive = activeRole === role;

          return (
            <Pressable
              key={role}
              style={[styles.pill, { borderColor: color }]}
              onPress={() => signInAsRole(role)}
              disabled={isLoading}
              accessibilityLabel={t('auth.signInAs', { role: t(`auth.role.${role}`) })}
              accessibilityRole="button"
            >
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {t(`auth.role.${role}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: normalize(10),
    color: lightTheme.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingBlock: normalize(6),
    paddingInline: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    minHeight: normalize(44),
  },
  dot: {
    width: normalize(6),
    height: normalize(6),
    borderRadius: normalize(3),
  },
  pillText: {
    fontSize: normalize(11),
    color: lightTheme.textSecondary,
  },
  pillTextActive: {
    fontWeight: '600',
  },
});
