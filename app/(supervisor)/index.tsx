import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { Button } from '@/components/ui';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';

export default function SupervisorPlaceholder() {
  const { t } = useTranslation();
  const { logout, isPending } = useLogout();

  return (
    <Screen>
      <View style={styles.container}>
        <Image
          source={require('../../assets/app-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.roleTitle}>
          {t('auth.placeholder.title', { role: t('auth.role.supervisor') })}
        </Text>
        <Text style={styles.comingSoon}>{t('auth.placeholder.comingSoon')}</Text>
        <Text style={styles.description}>{t('auth.placeholder.description')}</Text>
        <Button
          title={t('common.signOut')}
          onPress={() => logout()}
          disabled={isPending}
          loading={isPending}
          style={styles.signOutButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: spacing.xl,
  },
  logo: {
    width: normalize(80),
    height: normalize(80),
    marginBlockEnd: spacing.xl,
  },
  roleTitle: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
    marginBlockEnd: spacing.sm,
  },
  comingSoon: {
    ...typography.textStyles.subheading,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginBlockEnd: spacing.xs,
  },
  description: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginBlockEnd: spacing.xl,
  },
  signOutButton: {
    minWidth: normalize(200),
  },
});
