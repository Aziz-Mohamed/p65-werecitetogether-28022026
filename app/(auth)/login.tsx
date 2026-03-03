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

        <Text style={styles.title}>{t('auth.login')}</Text>
        <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>

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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBlockStart: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBlockEnd: spacing.xl,
  },
  logo: {
    width: normalize(100),
    height: normalize(100),
  },
  title: {
    ...typography.textStyles.heading,
    color: lightTheme.text,
    marginBlockEnd: spacing.xs,
  },
  subtitle: {
    ...typography.textStyles.body,
    color: lightTheme.textSecondary,
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
