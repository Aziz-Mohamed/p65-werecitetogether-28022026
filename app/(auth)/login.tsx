import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/components/layout';
import { LanguageToggleButton } from '@/components/ui/LanguageToggleButton';
import { OAuthButtons } from '@/features/auth/components/OAuthButtons';
import { DevRolePills } from '@/features/auth/components/DevRolePills';
import { typography } from '@/theme/typography';
import { lightTheme } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { normalize } from '@/theme/normalize';
import type { UserRole } from '@/types/common.types';

// ─── Login Screen ─────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.container}>
        <LanguageToggleButton />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/app-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>{t('auth.signInTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>

        <View style={styles.oauthSection}>
          <OAuthButtons />
        </View>

        {__DEV__ && (
          <View style={styles.devSection}>
            <DevRolePills />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBlockStart: spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBlockEnd: spacing.xl,
  },
  logo: {
    width: normalize(120),
    height: normalize(120),
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    textAlign: 'center',
    marginBlockEnd: spacing.xs,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
    textAlign: 'center',
    marginBlockEnd: spacing.xl,
  },
  oauthSection: {
    marginBlockEnd: spacing.xl,
  },
  devSection: {
    paddingBlockEnd: spacing.base,
    alignItems: 'center',
  },
});
